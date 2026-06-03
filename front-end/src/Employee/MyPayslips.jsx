import React, { useCallback, useEffect, useState } from "react";
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
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import { Download, Receipt, Refresh } from "@mui/icons-material";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { apiService } from "../services/api";
import { useAppTheme } from "../context/AppThemeContext";
import EmployeePayslipDialog from "../components/EmployeePayslipDialog";
import EmployeeMyPayrollSummary from "../components/EmployeeMyPayrollSummary";
import ErrorMessage from "../components/ErrorMessage";

const statusColor = (status) => {
  if (status === "paid") return "success";
  if (status === "finalized") return "info";
  return "default";
};

export default function MyPayslips() {
  const { t } = useTranslation();
  const { appSettings } = useAppTheme();
  const currencySymbol = appSettings?.currency_symbol || "";

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewRow, setViewRow] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getMyPaidPayslips();
      const data = res?.data?.Result ?? res?.data ?? [];
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(
        e?.response?.data?.Error ||
          e?.message ||
          t("myPayslips.loadError", { defaultValue: "Failed to load payslips" })
      );
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const openSlip = (item) => {
    setViewRow({
      employeeId: item.employeeId,
      employeeName: item.employeeName,
      empId: item.empId,
      status: "paid",
      payslipId: item.payslipId,
      finalAmount: item.finalAmount,
      regularPay: item.regularPay,
      weekendPay: item.weekendPay,
      extraPay: item.extraPay,
      holidayPay: item.holidayPay,
      period: item.period || {
        startDate: dayjs(item.periodStart).format("YYYY-MM-DD"),
        endDate: dayjs(item.periodEnd).format("YYYY-MM-DD"),
      },
    });
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {t("myPayslips.title", { defaultValue: "My Payslips" })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("myPayslips.subtitle", {
              defaultValue:
                "View your attendance and pay for each period. Download formal salary slips for months marked Paid by payroll.",
            })}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={load} disabled={loading}>
          {t("common.refresh", { defaultValue: "Refresh" })}
        </Button>
      </Stack>

      {error && <ErrorMessage error={error} message={error} />}

      <EmployeeMyPayrollSummary onViewPaidSlip={openSlip} />

      <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5, mt: 1 }}>
        {t("myPayslips.paidSlips", { defaultValue: "Paid salary slips" })}
      </Typography>

      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : list.length === 0 ? (
            <Alert severity="info" icon={<Receipt />}>
              {t("myPayslips.empty", {
                defaultValue:
                  "No paid payslips yet. When HR marks your salary as Paid for a month, it will appear here for download.",
              })}
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell>{t("myPayslips.month", { defaultValue: "Month" })}</TableCell>
                    <TableCell>{t("myPayslips.period", { defaultValue: "Pay period" })}</TableCell>
                    <TableCell align="right">{t("myPayslips.amount", { defaultValue: "Net payable" })}</TableCell>
                    <TableCell align="center">{t("myPayslips.status", { defaultValue: "Status" })}</TableCell>
                    <TableCell align="center">{t("myPayslips.download", { defaultValue: "Download" })}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((item) => (
                    <TableRow key={item.payslipId} hover>
                      <TableCell>
                        <Typography fontWeight={600}>{item.periodLabel}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.periodMonth}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {dayjs(item.periodStart).format("DD MMM YYYY")} –{" "}
                        {dayjs(item.periodEnd).format("DD MMM YYYY")}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {currencySymbol}
                        {Number(item.finalAmount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.status || "paid"}
                          size="small"
                          color={statusColor(item.status)}
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Download />}
                          onClick={() => openSlip(item)}
                        >
                          {t("myPayslips.viewDownload", { defaultValue: "View / Print" })}
                        </Button>
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
        open={!!viewRow}
        onClose={() => setViewRow(null)}
        row={viewRow}
        periodParams={
          viewRow?.period
            ? {
                startDate: viewRow.period.startDate,
                endDate: viewRow.period.endDate,
              }
            : {}
        }
        employeeView
      />
    </Box>
  );
}
