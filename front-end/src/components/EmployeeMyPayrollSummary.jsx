import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  CircularProgress,
  Alert,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  CalendarToday,
  Login,
  Logout,
  Schedule,
  AccessTime,
  WarningAmber,
  AttachMoney,
  AccountBalanceWallet,
  BeachAccess,
  Event,
} from "@mui/icons-material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { PeriodMonthCalendar } from "./SalaryPayslipCharts";
import { apiService } from "../services/api";
import { useAppTheme } from "../context/AppThemeContext";
import {
  getHolidayPay,
  getLoggedHours,
  getMissingHours,
  getMonthPayableAmount,
  getRequiredHours,
  getTotalSalary,
} from "../utils/payslipFormat";
import ErrorMessage from "./ErrorMessage";

const pageCardSx = {
  borderRadius: 3,
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  border: "1px solid",
  borderColor: "divider",
};

function StatCard({ icon: Icon, label, value, sub, accent = "primary", valueColor }) {
  const theme = useTheme();
  const main =
    typeof accent === "string" && accent.startsWith("#")
      ? accent
      : accent === "text.secondary"
        ? theme.palette.text.secondary
        : accent === "grey.500"
          ? theme.palette.grey[500]
          : theme.palette[accent]?.main || theme.palette.primary.main;
  return (
    <Card
      sx={{
        ...pageCardSx,
        height: "100%",
        borderLeft: `4px solid ${main}`,
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
              }}
            >
              <Icon fontSize="small" />
            </Box>
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block" noWrap>
              {label}
            </Typography>
            <Typography variant="h6" fontWeight={700} color={valueColor || "text.primary"}>
              {value}
            </Typography>
            {sub && (
              <Typography variant="caption" color="text.secondary" display="block">
                {sub}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

const statusColor = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "paid") return "success";
  if (s === "finalized") return "info";
  return "default";
};

export default function EmployeeMyPayrollSummary({ onViewPaidSlip }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { appSettings } = useAppTheme();
  const currencySymbol = appSettings?.currency_symbol || "";

  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));
  const [row, setRow] = useState(null);
  const [periodCalendar, setPeriodCalendar] = useState([]);
  const [periodSummary, setPeriodSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const periodParams = useMemo(
    () => ({
      startDate: startDate.format("YYYY-MM-DD"),
      endDate: endDate.format("YYYY-MM-DD"),
    }),
    [startDate, endDate]
  );

  const periodLabel = `${startDate.format("DD MMM YYYY")} – ${endDate.format("DD MMM YYYY")}`;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getMyPayslipPeriodSummary(periodParams);
      const payload = res?.data?.Result ?? res?.data ?? {};
      setRow(payload.employee || null);
      setPeriodCalendar(Array.isArray(payload.periodCalendar) ? payload.periodCalendar : []);
      setPeriodSummary(payload.periodSummary ?? null);
    } catch (e) {
      setError(e?.response?.data?.Error || e?.message || "Failed to load period summary");
      setRow(null);
      setPeriodCalendar([]);
      setPeriodSummary(null);
    } finally {
      setLoading(false);
    }
  }, [periodParams]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card sx={{ ...pageCardSx, mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Event color="primary" />
            <Typography variant="h6" fontWeight={700}>
              {t("myPayslips.periodDetails", { defaultValue: "My pay period details" })}
            </Typography>
            <Chip label={periodLabel} size="small" variant="outlined" sx={{ ml: "auto" }} />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("myPayslips.periodDetailsHint", {
              defaultValue:
                "See your attendance hours and pay breakdown for any period. Download the formal slip only when status is Paid.",
            })}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
            <DatePicker
              label={t("salaryPayslip.startDate", { defaultValue: "Period start" })}
              value={startDate}
              onChange={(v) => v && setStartDate(v)}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
            <DatePicker
              label={t("salaryPayslip.endDate", { defaultValue: "Period end" })}
              value={endDate}
              onChange={(v) => v && setEndDate(v)}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
            <Button
              variant="contained"
              startIcon={<CalendarToday />}
              onClick={load}
              disabled={loading}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
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
          }}
        >
          <CardContent sx={{ py: 2 }}>
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
                />
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {periodCalendar.length > 0 && <PeriodMonthCalendar periodCalendar={periodCalendar} />}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : row ? (
        <>
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
            <StatCard icon={Login} label="Check-ins" value={row.checkInCount ?? 0} accent="success" />
            <StatCard icon={Logout} label="Check-outs" value={row.checkOutCount ?? 0} accent="text.secondary" />
            <StatCard
              icon={AccessTime}
              label="Required hrs"
              value={getRequiredHours(row).toFixed(2)}
              sub={`${periodSummary?.workingDaysInPeriod ?? "—"} days × 8h`}
              accent="primary"
              valueColor="primary.main"
            />
            <StatCard icon={Schedule} label="Reg. logged" value={getLoggedHours(row).toFixed(2)} accent="info" />
            <StatCard
              icon={WarningAmber}
              label="Reg. not logged"
              value={getMissingHours(row).toFixed(2)}
              accent="error"
              valueColor="error.main"
            />
            <StatCard label="Regular hrs" value={Number(row.regularHours || 0).toFixed(2)} accent="grey.500" />
            <StatCard
              label="Extra hrs"
              value={Number(row.extraHours || 0).toFixed(2)}
              accent="warning"
              valueColor="warning.dark"
            />
            <StatCard
              label="Weekend hrs"
              value={Number(row.weekendHours || 0).toFixed(2)}
              accent="#9C27B0"
              valueColor="#9C27B0"
            />
            <StatCard
              icon={AttachMoney}
              label="Total salary"
              value={`${currencySymbol}${getTotalSalary(row).toFixed(2)}`}
              accent="secondary"
            />
            <StatCard
              icon={AccountBalanceWallet}
              label="Month payable"
              value={`${currencySymbol}${getMonthPayableAmount(row).toFixed(2)}`}
              accent="success"
              valueColor="success.dark"
            />
          </Box>

          <Card sx={pageCardSx}>
            <CardContent>
              <TableContainer sx={{ borderRadius: 2, border: 1, borderColor: "divider" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Metric</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        Value
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Regular pay</TableCell>
                      <TableCell align="right">
                        {currencySymbol}
                        {Number(row.regularPay || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Extra pay</TableCell>
                      <TableCell align="right">
                        {currencySymbol}
                        {Number(row.extraPay || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Weekend pay</TableCell>
                      <TableCell align="right">
                        {currencySymbol}
                        {Number(row.weekendPay || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Holiday pay</TableCell>
                      <TableCell align="right">
                        {currencySymbol}
                        {getHolidayPay(row).toFixed(2)}
                        {row.holidayCount > 0 && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {row.holidayCount} day(s)
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.success.main, 0.06) }}>
                      <TableCell sx={{ fontWeight: 700 }}>Net payable</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "success.dark" }}>
                        {currencySymbol}
                        {getMonthPayableAmount(row).toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">
                        <Chip label={row.status || "draft"} size="small" color={statusColor(row.status)} />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {row.canDownload && onViewPaidSlip && (
                <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    onClick={() =>
                      onViewPaidSlip({
                        employeeId: row.employeeId,
                        employeeName: row.employeeName,
                        empId: row.empId,
                        status: "paid",
                        payslipId: row.payslipId,
                        finalAmount: row.finalAmount,
                        regularPay: row.regularPay,
                        weekendPay: row.weekendPay,
                        extraPay: row.extraPay,
                        holidayPay: row.holidayPay,
                        period: row.period,
                      })
                    }
                    sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                  >
                    {t("myPayslips.viewDownload", { defaultValue: "View / Print payslip" })}
                  </Button>
                </Box>
              )}

              {!row.canDownload && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {t("myPayslips.notPaidYet", {
                    defaultValue:
                      "Formal payslip download is available after HR marks this period as Paid.",
                  })}
                </Alert>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        !error && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("myPayslips.noPeriodData", { defaultValue: "No data for this period." })}
          </Alert>
        )
      )}
    </LocalizationProvider>
  );
}
