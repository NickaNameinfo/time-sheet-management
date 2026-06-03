import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Collapse,
  TextField,
  MenuItem,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Close, Print, Save, ExpandMore, ExpandLess } from "@mui/icons-material";
import EmployeePayslipForm from "./EmployeePayslipForm";
import EmployeePayslipEditor from "./EmployeePayslipEditor";
import {
  buildPayslipFromAttendance,
  DEFAULT_COMPANY,
  DEFAULT_PAYMENT,
  sumEarnings,
  sumDeductions,
  dojToEditorText,
  getMonthPayableAmount,
  getTotalSalary,
  normalizePayslipEarnings,
  resolveMonthPayableFromAttendance,
} from "../utils/payslipFormat";
import { apiService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { buildPayslipPrintHtml, printPayslipDocument } from "../utils/payslipPrintHtml";
import dayjs from "dayjs";

function nextMonthFirstDay(endDate) {
  if (!endDate) return "";
  return dayjs(endDate).add(1, "month").startOf("month").format("DD-MM-YYYY");
}

function attendanceFromRow(row) {
  return {
    totalSalary: getTotalSalary(row),
    regularPay: parseFloat(row?.regularPay) || 0,
    weekendPay: parseFloat(row?.weekendPay) || 0,
    extraPay: parseFloat(row?.extraPay) || 0,
    holidayPay: parseFloat(row?.holidayPay) || 0,
    monthPayable: getMonthPayableAmount(row),
  };
}

export default function EmployeePayslipDialog({
  open,
  onClose,
  row,
  periodParams,
  onSaved,
  employeeView = false,
}) {
  const { user } = useAuth();
  const printRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showEdit, setShowEdit] = useState(!employeeView);

  const [company, setCompany] = useState({ ...DEFAULT_COMPANY });
  const [employee, setEmployee] = useState({});
  const [period, setPeriod] = useState({ startDate: "", endDate: "" });
  const [earnings, setEarnings] = useState({});
  const [deductions, setDeductions] = useState({});
  const [payment, setPayment] = useState({ ...DEFAULT_PAYMENT });
  const [attendancePay, setAttendancePay] = useState({
    totalSalary: 0,
    regularPay: 0,
    weekendPay: 0,
    extraPay: 0,
    monthPayable: 0,
  });
  const [inHandOverride, setInHandOverride] = useState("");
  const [payslipStatus, setPayslipStatus] = useState("draft");

  const applyPayslipCalc = useCallback((calc, detail = {}) => {
    setEarnings(detail.earnings || calc.earnings);
    setDeductions(detail.deductions || calc.deductions);
    setAttendancePay({
      totalSalary: calc.totalSalary,
      regularPay: calc.regularPay,
      weekendPay: calc.weekendPay,
      extraPay: calc.extraPay,
      holidayPay: calc.holidayPay,
      monthPayable: calc.monthPayable,
    });
    setEmployee((prev) => ({
      ...prev,
      monthlySalary: calc.totalSalary,
    }));
    if (detail.inHandSalary != null && detail.inHandSalary !== "") {
      setInHandOverride(detail.inHandSalary);
    } else {
      setInHandOverride("");
    }
  }, []);

  const recalculateFromAttendance = useCallback(
    (pay = attendancePay) => {
      const calc = buildPayslipFromAttendance(pay);
      applyPayslipCalc(calc);
    },
    [attendancePay, applyPayslipCalc]
  );

  useEffect(() => {
    if (!open || !row) return;
    setError(null);
    setLoading(true);
    setPeriod({
      startDate: periodParams?.startDate || "",
      endDate: periodParams?.endDate || "",
    });
    setInHandOverride("");
    setPayslipStatus(row?.status || "draft");

    const rowPay = attendanceFromRow(row);

    const load = async () => {
      try {
        const res = await apiService.getSalaryPayslipDetail(row.employeeId, periodParams);
        const data = res?.data?.Result ?? res?.data ?? {};
        const detail = data.payslipDetail || {};
        const emp = data.employee || {};
        if (data.status) setPayslipStatus(data.status);

        const tablePayable = getMonthPayableAmount(row);
        const normalizedEarnings = normalizePayslipEarnings(detail.earnings);
        const detailGross = normalizedEarnings ? sumEarnings(normalizedEarnings) : 0;
        const monthPayable =
          resolveMonthPayableFromAttendance(data, row) || tablePayable || 0;

        const breakdown = data.attendancePayBreakdown || {};
        const holidayPay =
          parseFloat(row.holidayPay) > 0
            ? parseFloat(row.holidayPay)
            : parseFloat(data.holidayPay) > 0
              ? parseFloat(data.holidayPay)
              : parseFloat(breakdown.holidayPay) > 0
                ? parseFloat(breakdown.holidayPay)
                : rowPay.holidayPay || 0;

        let regularPay = parseFloat(data.regularPay);
        if (Number.isNaN(regularPay) || regularPay <= 0) {
          regularPay = parseFloat(breakdown.regularPay) || 0;
        }
        if (Number.isNaN(regularPay) || regularPay <= 0) {
          const rowReg = parseFloat(row.regularPay);
          regularPay = !Number.isNaN(rowReg) && rowReg > 0 ? rowReg : rowPay.regularPay || 0;
        }
        if (regularPay <= 0 && monthPayable > 0) {
          regularPay = Math.max(0, monthPayable - holidayPay);
        }

        const profileSalary =
          parseFloat(emp.baseSalary) ||
          rowPay.totalSalary ||
          parseFloat(data.monthlySalary) ||
          0;

        const pay = {
          totalSalary: profileSalary,
          regularPay,
          weekendPay:
            parseFloat(row.weekendPay) > 0
              ? parseFloat(row.weekendPay)
              : parseFloat(data.weekendPay) > 0
                ? parseFloat(data.weekendPay)
                : parseFloat(breakdown.weekendPay) || rowPay.weekendPay,
          extraPay:
            parseFloat(row.extraPay) > 0
              ? parseFloat(row.extraPay)
              : parseFloat(data.extraPay) > 0
                ? parseFloat(data.extraPay)
                : parseFloat(breakdown.extraPay) || rowPay.extraPay,
          holidayPay,
          monthPayable,
        };

        if (detail.period?.startDate) {
          setPeriod({
            startDate: detail.period.startDate,
            endDate: detail.period.endDate,
          });
        }

        setCompany({
          name: detail.company?.name || data.company?.name || user?.company_name || DEFAULT_COMPANY.name,
          address: detail.company?.address || data.company?.address || DEFAULT_COMPANY.address,
          phone: detail.company?.phone || data.company?.phone || DEFAULT_COMPANY.phone,
        });

        const dojSource = detail.employee?.dateOfJoining ?? detail.employee?.dojText ?? emp.dateOfJoining;
        setEmployee({
          employeeName: detail.employee?.employeeName || emp.employeeName || row.employeeName,
          empId: detail.employee?.empId || emp.empId || row.empId,
          designation: detail.employee?.designation || emp.designation || row.designation,
          dateOfJoining: dojSource,
          dojText: detail.employee?.dojText ?? dojToEditorText(dojSource),
          monthlySalary: pay.totalSalary,
        });

        setPayment({
          chqNumber: detail.payment?.chqNumber ?? DEFAULT_PAYMENT.chqNumber,
          chqDate: detail.payment?.chqDate || nextMonthFirstDay(periodParams?.endDate),
          bankName: detail.payment?.bankName ?? DEFAULT_PAYMENT.bankName,
        });

        const calc = buildPayslipFromAttendance(pay);
        const profileSalaryNum = profileSalary;
        let inHand = calc.inHandSalary;
        const savedInHand = parseFloat(detail.inHandSalary ?? data.finalAmount ?? row.finalAmount);
        if (
          !Number.isNaN(savedInHand) &&
          savedInHand > 0 &&
          Math.abs(savedInHand - profileSalaryNum) > 1
        ) {
          inHand = savedInHand;
        } else if (monthPayable > 0) {
          inHand = monthPayable - sumDeductions(detail.deductions || calc.deductions);
        }

        const earningsMatchPayable =
          detailGross > 0 && Math.abs(detailGross - monthPayable) < 1;

        if (earningsMatchPayable && normalizedEarnings) {
          applyPayslipCalc(calc, {
            ...detail,
            earnings: normalizedEarnings,
            deductions: detail.deductions || calc.deductions,
            inHandSalary: inHand,
          });
        } else {
          applyPayslipCalc(calc, {
            deductions: detail.deductions || calc.deductions,
            inHandSalary: inHand,
          });
        }
      } catch (e) {
        setCompany({
          name: user?.company_name || DEFAULT_COMPANY.name,
          address: DEFAULT_COMPANY.address,
          phone: DEFAULT_COMPANY.phone,
        });
        setEmployee({
          employeeName: row.employeeName,
          empId: row.empId,
          designation: row.designation,
          dateOfJoining: null,
          dojText: "",
          monthlySalary: rowPay.totalSalary,
        });
        setPayment({
          ...DEFAULT_PAYMENT,
          chqDate: nextMonthFirstDay(periodParams?.endDate),
        });
        applyPayslipCalc(buildPayslipFromAttendance(rowPay));
        if (e?.response?.status !== 404) {
          setError(e?.response?.data?.Error || e?.message);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, row, periodParams, user?.company_name, applyPayslipCalc]);

  const inHandSalary = useMemo(() => {
    if (inHandOverride !== "" && inHandOverride != null && !Number.isNaN(Number(inHandOverride))) {
      return Number(inHandOverride);
    }
    const payable = attendancePay.monthPayable || sumEarnings(earnings);
    const d = sumDeductions(deductions);
    return Math.max(0, payable - d);
  }, [earnings, deductions, inHandOverride, attendancePay.monthPayable]);

  const handlePrint = () => {
    if (loading) return;
    const html = buildPayslipPrintHtml({
      company,
      employee,
      period,
      earnings,
      deductions,
      payment,
      inHandSalary,
      monthlySalary: attendancePay.totalSalary,
      attendancePay,
    });
    printPayslipDocument(html);
  };

  const handleSave = async () => {
    if (!row) return;
    setSaving(true);
    setError(null);
    try {
      const monthPayable = attendancePay.monthPayable || getMonthPayableAmount(row);
      await apiService.upsertSalaryPayslip({
        employeeId: row.employeeId,
        startDate: period.startDate || periodParams.startDate,
        endDate: period.endDate || periodParams.endDate,
        adjustments: parseFloat(row.adjustments) || 0,
        attendancePay: monthPayable,
        totalHours: parseFloat(row.totalHours) || 0,
        notes: row.notes || "",
        status: payslipStatus || row.status || "draft",
        recalculateFromAttendance: false,
        payslipDetail: {
          company,
          employee: {
            employeeName: employee.employeeName,
            empId: employee.empId,
            designation: employee.designation,
            dateOfJoining: employee.dateOfJoining,
            dojText: employee.dojText,
            monthlySalary: attendancePay.totalSalary,
          },
          attendancePay: { ...attendancePay, monthPayable },
          period,
          earnings,
          deductions,
          payment,
          inHandSalary,
        },
      });
      onSaved?.();
    } catch (e) {
      setError(e?.response?.data?.Error || e?.message || "Failed to save payslip");
    } finally {
      setSaving(false);
    }
  };

  const theme = useTheme();

  if (!row) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pr: 1,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.success.main, 0.08)} 100%)`,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Salary Slip
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {row.employeeName} · {row.empId}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="close">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: "grey.50" }}>
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {loading ? (
          <Stack alignItems="center" py={6}>
            <CircularProgress />
          </Stack>
        ) : (
          <>
            {!employeeView && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                Payable = <strong>regular pay</strong> + <strong>government holiday pay</strong> (8h per weekday public
                holiday). Weekend and extra pay are informational. Set status to <strong>Paid</strong> so employees can
                download from My Payslips.
              </Alert>
            )}
            {employeeView && (
              <Alert severity="success" sx={{ mb: 2 }}>
                This payslip is marked as <strong>Paid</strong>. Use Print to save or download a PDF copy.
              </Alert>
            )}
            {!employeeView && (
              <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap">
                <TextField
                  select
                  size="small"
                  label="Payslip status"
                  value={payslipStatus}
                  onChange={(e) => setPayslipStatus(e.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="finalized">Finalized</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                </TextField>
                <Button
                  size="small"
                  variant="outlined"
                  endIcon={showEdit ? <ExpandLess /> : <ExpandMore />}
                  onClick={() => setShowEdit((v) => !v)}
                >
                  {showEdit ? "Hide editor" : "Show editor (all fields)"}
                </Button>
              </Stack>
            )}
            <Collapse in={showEdit && !employeeView}>
              <EmployeePayslipEditor
                company={company}
                setCompany={setCompany}
                employee={employee}
                setEmployee={setEmployee}
                period={period}
                setPeriod={setPeriod}
                earnings={earnings}
                setEarnings={setEarnings}
                deductions={deductions}
                setDeductions={setDeductions}
                payment={payment}
                setPayment={setPayment}
                attendancePay={attendancePay}
                inHandOverride={inHandOverride}
                setInHandOverride={setInHandOverride}
                onRecalculateFromAttendance={() => recalculateFromAttendance(attendancePay)}
              />
            </Collapse>
            <Box
              ref={printRef}
              sx={{
                mt: 1,
                p: { xs: 1, sm: 2 },
                borderRadius: 2,
                bgcolor: "#fff",
                boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                "@media print": { boxShadow: "none", p: 0 },
              }}
            >
              <EmployeePayslipForm
                company={company}
                employee={employee}
                period={period}
                earnings={earnings}
                deductions={deductions}
                payment={payment}
                inHandSalary={inHandSalary}
                monthlySalary={attendancePay.totalSalary}
                attendancePay={attendancePay}
              />
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: "divider" }}>
        <Button onClick={onClose} sx={{ borderRadius: 2, textTransform: "none" }}>
          Close
        </Button>
        <Button
          variant="outlined"
          startIcon={<Print />}
          onClick={handlePrint}
          disabled={loading}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          {employeeView ? "Print / Download" : "Print"}
        </Button>
        {!employeeView && (
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={loading || saving}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
            }}
          >
            {saving ? "Saving…" : "Save payslip"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
