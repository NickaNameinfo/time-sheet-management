import React, { useState, useMemo, useCallback } from "react";
import { Navigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Grid,
  Divider,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Refresh,
  Edit,
  Description,
  Paid,
  Savings,
  CalendarToday,
  Login,
  Logout,
  Schedule,
  TableChart,
  BarChart as BarChartIcon,
  AccountBalanceWallet,
  Event,
  AccessTime,
  WarningAmber,
  BeachAccess,
  AttachMoney,
} from "@mui/icons-material";
import SalaryPayslipCharts, { SalaryPayslipDailyChart, PeriodMonthCalendar } from "./SalaryPayslipCharts";
import EmployeePayslipDialog from "./EmployeePayslipDialog";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { apiService } from "../services/api";
import { useAppTheme } from "../context/AppThemeContext";
import ErrorMessage from "./ErrorMessage";
import { formatClockDateTime } from "../utils/formatWorkDetailClock";
import {
  getHolidayPay,
  getLoggedHours,
  getMissingHours,
  getMonthPayableAmount,
  getRequiredHours,
  getTotalSalary,
} from "../utils/payslipFormat";
import { useAuth } from "../context/AuthContext";
import { isPayrollAdminUser } from "../utils/payrollAccess";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "finalized", label: "Finalized" },
  { value: "paid", label: "Paid" },
];

const pageCardSx = {
  borderRadius: 3,
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  border: "1px solid",
  borderColor: "divider",
};

function resolveAccentColor(theme, accent) {
  if (typeof accent === "string" && accent.startsWith("#")) return accent;
  if (accent === "text.secondary") return theme.palette.text.secondary;
  if (accent === "grey.500") return theme.palette.grey[500];
  return theme.palette[accent]?.main || theme.palette.primary.main;
}

function StatCard({ icon: Icon, label, value, sub, accent = "primary", valueColor }) {
  const theme = useTheme();
  const main = resolveAccentColor(theme, accent);
  return (
    <Card
      sx={{
        ...pageCardSx,
        height: "100%",
        borderLeft: `4px solid ${main}`,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 28px rgba(0,0,0,0.1)",
        },
      }}
    >
      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          {Icon && (
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha(main, 0.12),
                color: main,
                display: "flex",
                flexShrink: 0,
              }}
            >
              <Icon fontSize="small" />
            </Box>
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block" noWrap>
              {label}
            </Typography>
            <Typography
              variant="h6"
              fontWeight={700}
              color={valueColor || "text.primary"}
              sx={{ lineHeight: 1.25, fontSize: { xs: "1rem", sm: "1.15rem" } }}
            >
              {value}
            </Typography>
            {sub && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                {sub}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function entryDayKey(entry) {
  const raw = entry?.clockInTime || entry?.sentDate;
  if (!raw) return "";
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return String(raw).slice(0, 10);
}

const SalaryAndPayslip = () => {
  const { t } = useTranslation();
  const { appSettings } = useAppTheme();
  const { roles, user } = useAuth();
  const currencySymbol = appSettings?.currency_symbol || "";

  if (!isPayrollAdminUser(roles, user)) {
    return <Navigate to="/Employee/MyPayslips" replace />;
  }

  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));
  const [rows, setRows] = useState([]);
  const [periodCalendar, setPeriodCalendar] = useState([]);
  const [periodSummary, setPeriodSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [attendanceDetail, setAttendanceDetail] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewTab, setViewTab] = useState(0);
  const [payslipRow, setPayslipRow] = useState(null);
  const [form, setForm] = useState({
    adjustments: "0",
    attendancePay: "0",
    totalHours: "0",
    regularHours: "0",
    extraHours: "0",
    weekendHours: "0",
    notes: "",
    status: "draft",
  });

  const periodParams = useMemo(
    () => ({
      startDate: startDate.format("YYYY-MM-DD"),
      endDate: endDate.format("YYYY-MM-DD"),
    }),
    [startDate, endDate]
  );

  const periodTotals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        checkInCount: acc.checkInCount + (r.checkInCount || 0),
        checkOutCount: acc.checkOutCount + (r.checkOutCount || 0),
        regularHours: acc.regularHours + (r.regularHours || 0),
        extraHours: acc.extraHours + (r.extraHours || 0),
        weekendHours: acc.weekendHours + (r.weekendHours || 0),
        loggedHours: acc.loggedHours + getLoggedHours(r),
        missingHours: acc.missingHours + getMissingHours(r),
        regularPay: acc.regularPay + (r.regularPay || 0),
        extraPay: acc.extraPay + (r.extraPay || 0),
        weekendPay: acc.weekendPay + (r.weekendPay || 0),
        holidayPay: acc.holidayPay + getHolidayPay(r),
        totalSalary: acc.totalSalary + getTotalSalary(r),
        monthPayable: acc.monthPayable + getMonthPayableAmount(r),
      }),
      {
        checkInCount: 0,
        checkOutCount: 0,
        regularHours: 0,
        extraHours: 0,
        weekendHours: 0,
        loggedHours: 0,
        missingHours: 0,
        regularPay: 0,
        extraPay: 0,
        weekendPay: 0,
        holidayPay: 0,
        totalSalary: 0,
        monthPayable: 0,
      }
    );
  }, [rows]);

  const loadPayslips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getSalaryPayslips(periodParams);
      const payload = res?.data?.Result ?? res?.data ?? {};
      const list = Array.isArray(payload) ? payload : payload.employees ?? [];
      setRows(list);
      setPeriodCalendar(Array.isArray(payload?.periodCalendar) ? payload.periodCalendar : []);
      setPeriodSummary(payload?.periodSummary ?? null);
    } catch (e) {
      setError(e?.response?.data?.Error || e?.message || "Failed to load salary & payslip data");
      setRows([]);
      setPeriodCalendar([]);
      setPeriodSummary(null);
    } finally {
      setLoading(false);
    }
  }, [periodParams]);

  React.useEffect(() => {
    loadPayslips();
  }, [loadPayslips]);

  const applyAttendancePayload = (payload) => {
    setAttendanceDetail(payload);
    setForm((prev) => ({
      ...prev,
      attendancePay: String(payload.attendancePay ?? 0),
      totalHours: String(payload.totalHours ?? 0),
      regularHours: String(payload.regularHours ?? 0),
      extraHours: String(payload.extraHours ?? 0),
      weekendHours: String(payload.weekendHours ?? 0),
    }));
  };

  const openEdit = async (row) => {
    setEditRow(row);
    setForm({
      adjustments: String(row.adjustments ?? 0),
      attendancePay: String(row.attendancePay ?? 0),
      totalHours: String(row.totalHours ?? 0),
      regularHours: String(row.regularHours ?? 0),
      extraHours: String(row.extraHours ?? 0),
      weekendHours: String(row.weekendHours ?? 0),
      notes: row.notes || "",
      status: row.status || "draft",
    });
    setAttendanceDetail(null);
    setEditOpen(true);
    setAttendanceLoading(true);
    try {
      const res = await apiService.getEmployeePayslipAttendance(row.employeeId, periodParams);
      const payload = res?.data?.Result ?? res?.data ?? {};
      applyAttendancePayload(payload);
    } catch {
      setAttendanceDetail(null);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!editRow) return;
    setAttendanceLoading(true);
    try {
      const res = await apiService.getEmployeePayslipAttendance(editRow.employeeId, periodParams);
      const payload = res?.data?.Result ?? res?.data ?? {};
      applyAttendancePayload(payload);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleMarkPaid = async (row) => {
    setSaving(true);
    setError(null);
    try {
      await apiService.upsertSalaryPayslip({
        employeeId: row.employeeId,
        startDate: periodParams.startDate,
        endDate: periodParams.endDate,
        adjustments: parseFloat(row.adjustments) || 0,
        attendancePay: parseFloat(row.attendancePay) || getMonthPayableAmount(row),
        totalHours: parseFloat(row.totalHours) || 0,
        notes: row.notes || "",
        status: "paid",
        recalculateFromAttendance: false,
      });
      await loadPayslips();
    } catch (e) {
      setError(e?.response?.data?.Error || e?.message || "Failed to mark as paid");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!editRow) return;
    setSaving(true);
    try {
      await apiService.upsertSalaryPayslip({
        employeeId: editRow.employeeId,
        startDate: periodParams.startDate,
        endDate: periodParams.endDate,
        adjustments: parseFloat(form.adjustments) || 0,
        attendancePay: parseFloat(form.attendancePay) || 0,
        totalHours: parseFloat(form.totalHours) || 0,
        notes: form.notes,
        status: form.status,
        recalculateFromAttendance: false,
      });
      setEditOpen(false);
      setEditRow(null);
      await loadPayslips();
    } catch (e) {
      setError(e?.response?.data?.Error || e?.message || "Failed to save payslip");
    } finally {
      setSaving(false);
    }
  };

  const finalPreview =
    (parseFloat(form.attendancePay) || 0) + (parseFloat(form.adjustments) || 0);

  const statusColor = (status) => {
    if (status === "paid") return "success";
    if (status === "finalized") return "info";
    return "default";
  };

  const statusLabel = (status) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === status);
    return opt?.label || status || "Draft";
  };

  const dailyRows = attendanceDetail?.dailyBreakdown || [];
  const entryRows = attendanceDetail?.entries || [];

  const dayHoursMap = useMemo(() => {
    const m = new Map();
    dailyRows.forEach((d) => m.set(d.date, d));
    return m;
  }, [dailyRows]);

  const theme = useTheme();
  const periodLabel = `${startDate.format("DD MMM YYYY")} – ${endDate.format("DD MMM YYYY")}`;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2.5,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
                color: "#fff",
                display: { xs: "none", sm: "flex" },
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
              }}
            >
              <AccountBalanceWallet />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -0.5 }}>
                {t("salaryPayslip.title", { defaultValue: "Salary & Payslip" })}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
                {t("salaryPayslip.subtitlePayable", {
                  defaultValue:
                    "Payable = regular pay + government holiday pay. Required hours exclude weekends and public holidays.",
                })}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadPayslips}
            disabled={loading}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            {t("common.refresh", { defaultValue: "Refresh" })}
          </Button>
        </Box>

        <Card sx={{ ...pageCardSx, mb: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Event color="primary" />
              <Typography variant="h6" fontWeight={700}>
                {t("salaryPayslip.payPeriod", { defaultValue: "Pay period" })}
              </Typography>
              <Chip label={periodLabel} size="small" variant="outlined" sx={{ ml: "auto" }} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
              <DatePicker
                label={t("salaryPayslip.startDate", { defaultValue: "Period start" })}
                value={startDate}
                onChange={(v) => v && setStartDate(v)}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: { "& .MuiOutlinedInput-root": { borderRadius: 2 } },
                  },
                }}
              />
              <DatePicker
                label={t("salaryPayslip.endDate", { defaultValue: "Period end" })}
                value={endDate}
                onChange={(v) => v && setEndDate(v)}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: { "& .MuiOutlinedInput-root": { borderRadius: 2 } },
                  },
                }}
              />
              <Button
                variant="contained"
                startIcon={<CalendarToday />}
                onClick={loadPayslips}
                disabled={loading}
                sx={{
                  minWidth: { sm: 160 },
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
                  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                  "&:hover": {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.success.dark} 100%)`,
                  },
                }}
              >
                {t("salaryPayslip.loadPeriod", { defaultValue: "Load period" })}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {error && <ErrorMessage error={error} message={error} />}

        {periodSummary?.governmentHolidays?.length > 0 && (
          <Card
            sx={{
              ...pageCardSx,
              mb: 2,
              bgcolor: alpha(theme.palette.info.main, 0.04),
              borderColor: alpha(theme.palette.info.main, 0.25),
            }}
          >
            <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <BeachAccess color="info" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={700}>
                  Government holidays — {periodSummary.payrollCountry || appSettings?.country || "India"}
                </Typography>
                <Chip
                  size="small"
                  color="info"
                  label={`${periodSummary.holidayCount ?? 0} paid · ${(periodSummary.holidayHours ?? 0).toFixed(0)}h`}
                  sx={{ ml: "auto" }}
                />
              </Stack>
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {periodSummary.governmentHolidays.map((h) => (
                  <Chip
                    key={h.date}
                    size="small"
                    variant={h.isWeekend ? "outlined" : "filled"}
                    color={h.isWeekend ? "default" : "warning"}
                    label={`${h.date} · ${h.name}${h.isWeekend ? " (wknd)" : ""}`}
                    sx={{ fontWeight: 500 }}
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {periodCalendar.length > 0 && <PeriodMonthCalendar periodCalendar={periodCalendar} />}

        {rows.length > 0 && (
          <Box
            sx={{
              mb: 3,
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(4, 1fr)",
                lg: "repeat(5, 1fr)",
              },
              gap: 2,
            }}
          >
              <StatCard
                icon={Login}
                label={t("salaryPayslip.totalCheckIns", { defaultValue: "Check-ins" })}
                value={periodTotals.checkInCount}
                accent="success"
              />
              <StatCard
                icon={Logout}
                label={t("salaryPayslip.totalCheckOuts", { defaultValue: "Check-outs" })}
                value={periodTotals.checkOutCount}
                accent="text.secondary"
              />
              <StatCard
                icon={AccessTime}
                label={t("salaryPayslip.requiredHours", { defaultValue: "Required hrs" })}
                value={Number(
                  periodSummary?.requiredHours ?? (rows[0] ? getRequiredHours(rows[0]) : 0)
                ).toFixed(2)}
                sub={`${periodSummary?.workingDaysInPeriod ?? "—"} days × 8h`}
                accent="primary"
                valueColor="primary.main"
              />
              <StatCard
                icon={Schedule}
                label={t("salaryPayslip.loggedHours", { defaultValue: "Reg. logged" })}
                value={periodTotals.loggedHours.toFixed(2)}
                accent="info"
              />
              <StatCard
                icon={WarningAmber}
                label={t("salaryPayslip.notLoggedHours", { defaultValue: "Reg. not logged" })}
                value={periodTotals.missingHours.toFixed(2)}
                accent="error"
                valueColor="error.main"
              />
              <StatCard
                label={t("salaryPayslip.regularHours", { defaultValue: "Regular hrs" })}
                value={periodTotals.regularHours.toFixed(2)}
                accent="grey.500"
              />
              <StatCard
                label={t("salaryPayslip.extraHours", { defaultValue: "Extra hrs" })}
                value={periodTotals.extraHours.toFixed(2)}
                accent="warning"
                valueColor="warning.dark"
              />
              <StatCard
                label={t("salaryPayslip.weekendHours", { defaultValue: "Weekend hrs" })}
                value={periodTotals.weekendHours.toFixed(2)}
                accent="#9C27B0"
                valueColor="#9C27B0"
              />
              <StatCard
                icon={AttachMoney}
                label={t("salaryPayslip.totalSalary", { defaultValue: "Total salary" })}
                value={`${currencySymbol}${periodTotals.totalSalary.toFixed(2)}`}
                accent="secondary"
              />
              <StatCard
                icon={AccountBalanceWallet}
                label={t("salaryPayslip.monthPayable", { defaultValue: "Month payable" })}
                value={`${currencySymbol}${periodTotals.monthPayable.toFixed(2)}`}
                accent="success"
                valueColor="success.dark"
              />
          </Box>
        )}

        <Card sx={pageCardSx}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Tabs
              value={viewTab}
              onChange={(_, v) => setViewTab(v)}
              sx={{
                mb: 2,
                minHeight: 44,
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  minHeight: 44,
                  borderRadius: 2,
                  mr: 0.5,
                },
                "& .Mui-selected": { bgcolor: alpha(theme.palette.primary.main, 0.08) },
              }}
            >
              <Tab icon={<TableChart />} iconPosition="start" label={t("salaryPayslip.tableView", { defaultValue: "Table" })} />
              <Tab
                icon={<BarChartIcon />}
                iconPosition="start"
                label={t("salaryPayslip.chartView", { defaultValue: "Charts" })}
                disabled={loading || rows.length === 0}
              />
            </Tabs>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : rows.length === 0 ? (
              <Alert severity="info">
                {t("salaryPayslip.noEmployees", { defaultValue: "No employees found for this period." })}
              </Alert>
            ) : viewTab === 1 ? (
              <SalaryPayslipCharts
                rows={rows}
                periodTotals={periodTotals}
                currencySymbol={currencySymbol}
                periodCalendar={periodCalendar}
              />
            ) : (
              <TableContainer
                sx={{
                  overflowX: "auto",
                  borderRadius: 2,
                  border: 1,
                  borderColor: "divider",
                  maxHeight: { md: "calc(100vh - 320px)" },
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                        {t("salaryPayslip.employee", { defaultValue: "Employee" })}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                        {t("salaryPayslip.checkIns", { defaultValue: "Check-ins" })}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                        {t("salaryPayslip.checkOuts", { defaultValue: "Check-outs" })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                        {t("salaryPayslip.regularHours", { defaultValue: "Regular hrs" })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                        {t("salaryPayslip.extraHours", { defaultValue: "Extra hrs" })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                        {t("salaryPayslip.weekendHours", { defaultValue: "Weekend hrs" })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                        {t("salaryPayslip.requiredHours", { defaultValue: "Required hrs" })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                        {t("salaryPayslip.loggedHours", { defaultValue: "Reg. logged" })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                        {t("salaryPayslip.notLoggedHours", { defaultValue: "Reg. not logged" })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                        {t("salaryPayslip.regularPay", { defaultValue: "Regular pay" })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                        {t("salaryPayslip.extraPay", { defaultValue: "Extra pay" })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                        {t("salaryPayslip.weekendPay", { defaultValue: "Weekend pay" })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                        {t("salaryPayslip.holidayPay", { defaultValue: "Holiday pay" })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                        {t("salaryPayslip.totalSalary", { defaultValue: "Total salary" })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.success.main, 0.08) }}>
                        {t("salaryPayslip.monthPayable", { defaultValue: "Payable" })}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                        {t("salaryPayslip.status", { defaultValue: "Status" })}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                        {t("salaryPayslip.actions", { defaultValue: "Actions" })}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, idx) => (
                      <TableRow
                        key={row.employeeId}
                        hover
                        sx={{
                          bgcolor: idx % 2 === 0 ? "background.paper" : "grey.50",
                          "&:last-child td": { borderBottom: 0 },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {row.employeeName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.empId} · {currencySymbol}
                            {Number(row.baseSalary || 0).toFixed(0)}/mo
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip size="small" icon={<Login />} label={row.checkInCount ?? 0} variant="outlined" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip size="small" icon={<Logout />} label={row.checkOutCount ?? 0} variant="outlined" />
                        </TableCell>
                        <TableCell align="right">{Number(row.regularHours || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">
                          <Typography color="warning.dark" fontWeight={600}>
                            {Number(row.extraHours || 0).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ color: "#9C27B0" }} fontWeight={600}>
                            {Number(row.weekendHours || 0).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600} color="primary.main">
                            {getRequiredHours(row).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600}>{getLoggedHours(row).toFixed(2)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          {getMissingHours(row) > 0 ? (
                            <Typography fontWeight={700} color="error.main">
                              {getMissingHours(row).toFixed(2)}
                            </Typography>
                          ) : (
                            <Typography color="text.secondary">0.00</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {currencySymbol}
                          {Number(row.regularPay ?? 0).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          {currencySymbol}
                          {Number(row.extraPay || 0).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          {currencySymbol}
                          {Number(row.weekendPay || 0).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ color: "#E65100" }} fontWeight={600}>
                            {currencySymbol}
                            {getHolidayPay(row).toFixed(2)}
                          </Typography>
                          {row.holidayCount > 0 && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {row.holidayCount} day(s)
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {currencySymbol}
                          {getTotalSalary(row).toFixed(2)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "success.dark" }}>
                          {currencySymbol}
                          {getMonthPayableAmount(row).toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={statusLabel(row.status)}
                            size="small"
                            color={statusColor(row.status)}
                            variant={row.status === "paid" ? "filled" : "outlined"}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            {row.status !== "paid" && (
                              <Tooltip title={t("salaryPayslip.markPaid", { defaultValue: "Mark as paid" })}>
                                <IconButton
                                  size="small"
                                  color="success"
                                  disabled={saving}
                                  onClick={() => handleMarkPaid(row)}
                                  sx={{
                                    bgcolor: alpha(theme.palette.success.main, 0.1),
                                    "&:hover": { bgcolor: alpha(theme.palette.success.main, 0.2) },
                                  }}
                                >
                                  <Paid fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title={t("salaryPayslip.viewSlip", { defaultValue: "View salary slip" })}>
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => setPayslipRow(row)}
                                sx={{
                                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                  "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.2) },
                                }}
                              >
                                <Description fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t("salaryPayslip.updatePayslip", { defaultValue: "Update payslip" })}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => openEdit(row)}
                                sx={{
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        <EmployeePayslipDialog
          open={!!payslipRow}
          onClose={() => setPayslipRow(null)}
          row={payslipRow}
          periodParams={periodParams}
          onSaved={loadPayslips}
        />

        <Dialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.success.main, 0.08)} 100%)`,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                display: "flex",
              }}
            >
              <Savings color="primary" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} component="span" display="block">
                {t("salaryPayslip.editTitle", { defaultValue: "Update payslip" })}
              </Typography>
              {editRow && (
                <Typography variant="body2" color="text.secondary">
                  {editRow.employeeName} · {editRow.empId}
                </Typography>
              )}
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: "grey.50" }}>
            {editRow && (
              <Stack spacing={2}>
                <Alert severity="info" icon={<Schedule />}>
                  {t("salaryPayslip.calcHint8hWeekend", {
                    defaultValue:
                      "Weekdays: first 8h = regular, above 8h = extra. Saturday & Sunday: all hours = weekend (same hourly rate). Counts are from workdetails check-in/out.",
                  })}
                </Alert>

                {attendanceDetail && !attendanceLoading && (
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center" }}>
                        <Typography variant="caption">Check-ins</Typography>
                        <Typography variant="h6">{attendanceDetail.checkInCount ?? 0}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center" }}>
                        <Typography variant="caption">Check-outs</Typography>
                        <Typography variant="h6">{attendanceDetail.checkOutCount ?? 0}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center" }}>
                        <Typography variant="caption">Regular hrs</Typography>
                        <Typography variant="h6">{Number(attendanceDetail.regularHours || 0).toFixed(2)}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center", borderColor: "warning.light" }}>
                        <Typography variant="caption">Extra hrs</Typography>
                        <Typography variant="h6" color="warning.dark">
                          {Number(attendanceDetail.extraHours || 0).toFixed(2)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center", borderColor: "#ce93d8" }}>
                        <Typography variant="caption">Weekend hrs</Typography>
                        <Typography variant="h6" sx={{ color: "#9C27B0" }}>
                          {Number(attendanceDetail.weekendHours || 0).toFixed(2)}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                )}

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField label="Regular pay" value={attendanceDetail?.regularPay ?? ""} disabled fullWidth size="small" />
                  <TextField label="Extra pay" value={attendanceDetail?.extraPay ?? ""} disabled fullWidth size="small" />
                  <TextField label="Weekend pay" value={attendanceDetail?.weekendPay ?? ""} disabled fullWidth size="small" />
                  <TextField
                    label={t("salaryPayslip.attendancePay", { defaultValue: "Total attendance pay" })}
                    value={form.attendancePay}
                    onChange={(e) => setForm({ ...form, attendancePay: e.target.value })}
                    fullWidth
                    size="small"
                    type="number"
                  />
                  <TextField
                    label={t("salaryPayslip.adjustments", { defaultValue: "Adjustments" })}
                    value={form.adjustments}
                    onChange={(e) => setForm({ ...form, adjustments: e.target.value })}
                    fullWidth
                    size="small"
                    type="number"
                  />
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} fullWidth size="small">
                    {STATUS_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField label="Final amount" value={finalPreview.toFixed(2)} disabled fullWidth size="small" />
                </Stack>
                <TextField label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} fullWidth multiline minRows={2} />

                <Button variant="outlined" onClick={handleRecalculate} disabled={attendanceLoading}>
                  {attendanceLoading ? "Loading..." : "Recalculate from check-in/out"}
                </Button>

                {attendanceLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <>
                    {dailyRows.length > 0 && (
                      <>
                        <SalaryPayslipDailyChart dailyBreakdown={dailyRows} />
                        <Typography variant="subtitle2" fontWeight={600}>
                          Daily summary (weekdays 8h cap; weekends separate)
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Day</TableCell>
                                <TableCell align="right">Day total</TableCell>
                                <TableCell align="right">Regular (≤8h)</TableCell>
                                <TableCell align="right">Extra (&gt;8h)</TableCell>
                                <TableCell align="right">Weekend</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {dailyRows.map((d) => (
                                <TableRow
                                  key={d.date}
                                  sx={d.isWeekend ? { bgcolor: "rgba(156, 39, 176, 0.06)" } : undefined}
                                >
                                  <TableCell>{d.date}</TableCell>
                                  <TableCell>
                                    {d.dayOfWeek || "—"}
                                    {d.isWeekend && (
                                      <Chip label="Weekend" size="small" sx={{ ml: 0.5, height: 18, fontSize: 10 }} color="secondary" />
                                    )}
                                  </TableCell>
                                  <TableCell align="right">{d.dayTotalHours.toFixed(2)}</TableCell>
                                  <TableCell align="right">{d.isWeekend ? "—" : d.regularHours.toFixed(2)}</TableCell>
                                  <TableCell align="right">
                                    {d.isWeekend ? (
                                      "—"
                                    ) : (
                                      <Typography color={d.extraHours > 0 ? "warning.dark" : "inherit"}>
                                        {d.extraHours.toFixed(2)}
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell align="right">
                                    {d.isWeekend ? (
                                      <Typography sx={{ color: "#9C27B0" }} fontWeight={600}>
                                        {(d.weekendHours ?? d.dayTotalHours).toFixed(2)}
                                      </Typography>
                                    ) : (
                                      "—"
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        <Divider />
                      </>
                    )}

                    <Typography variant="subtitle2" fontWeight={600}>
                      All check-in / check-out records
                    </Typography>
                    {entryRows.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No attendance records in this period.
                      </Typography>
                    ) : (
                      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>Date</TableCell>
                              <TableCell>Clock in</TableCell>
                              <TableCell>Clock out</TableCell>
                              <TableCell align="right">Hours</TableCell>
                              <TableCell>Project</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {entryRows.map((a) => {
                              const day = entryDayKey(a);
                              const dayInfo = dayHoursMap.get(day);
                              return (
                                <TableRow key={a.id}>
                                  <TableCell>{day || "—"}</TableCell>
                                  <TableCell>{formatClockDateTime(a.clockInTime)}</TableCell>
                                  <TableCell>{formatClockDateTime(a.clockOutTime)}</TableCell>
                                  <TableCell align="right">{Number(a.calculatedHours || 0).toFixed(2)}</TableCell>
                                  <TableCell>
                                    {a.projectName || "—"}
                                    {dayInfo?.isWeekend && (
                                      <Typography variant="caption" display="block" sx={{ color: "#9C27B0" }}>
                                        Weekend day
                                      </Typography>
                                    )}
                                    {dayInfo && !dayInfo.isWeekend && dayInfo.extraHours > 0 && (
                                      <Typography variant="caption" display="block" color="warning.dark">
                                        Day extra: {dayInfo.extraHours.toFixed(2)}h
                                      </Typography>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, bgcolor: "background.paper", borderTop: 1, borderColor: "divider" }}>
            <Button onClick={() => setEditOpen(false)} sx={{ borderRadius: 2, textTransform: "none" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
              }}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default SalaryAndPayslip;
