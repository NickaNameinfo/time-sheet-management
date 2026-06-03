import React, { useMemo } from "react";
import { Box, Card, CardContent, Typography, Grid, Stack, useTheme } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function shortName(name, max = 12) {
  const s = String(name || "").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

const PIE_COLORS = ["#4C86F9", "#F6BC00", "#9C27B0"];
const WEEKEND_COLOR = "#9C27B0";
const HOLIDAY_COLOR = "#E65100";
const PAYABLE_COLOR = "#2E7D32";

const chartCardSx = {
  borderRadius: 3,
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  border: "1px solid",
  borderColor: "divider",
  height: "100%",
};

function monthPayableOf(r) {
  if (r?.monthPayable != null) return Number(r.monthPayable);
  return Number(
    (Number(r.regularPay || 0) + Number(r.holidayPay || 0)).toFixed(2)
  );
}

function totalSalaryOf(r) {
  return Number(r?.totalSalary ?? r?.baseSalary) || 0;
}

/** Month strip: Sat/Sun highlighted for selected period */
export function PeriodMonthCalendar({ periodCalendar = [] }) {
  const theme = useTheme();
  if (!periodCalendar.length) return null;
  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 3,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Period calendar
          </Typography>
          <Box sx={{ display: "flex", gap: 1, ml: "auto", flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: "rgba(156, 39, 176, 0.35)" }} />
              <Typography variant="caption">Weekend</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: "rgba(230, 81, 0, 0.45)" }} />
              <Typography variant="caption">Holiday</Typography>
            </Box>
          </Box>
        </Stack>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {periodCalendar.map((day) => {
            const isHoliday = day.isHoliday;
            const isWeekend = day.isWeekend;
            return (
              <Box
                key={day.date}
                title={isHoliday ? day.holidayName || "Public holiday" : isWeekend ? "Weekend" : ""}
                sx={{
                  width: 40,
                  textAlign: "center",
                  py: 0.75,
                  px: 0.25,
                  borderRadius: 1.5,
                  border: "1px solid",
                  borderColor: isHoliday ? HOLIDAY_COLOR : isWeekend ? WEEKEND_COLOR : "divider",
                  bgcolor: isHoliday
                    ? "rgba(230, 81, 0, 0.12)"
                    : isWeekend
                      ? "rgba(156, 39, 176, 0.1)"
                      : theme.palette.background.paper,
                  transition: "transform 0.15s",
                  "&:hover": { transform: "scale(1.05)" },
                }}
              >
                <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: 9, lineHeight: 1.2 }}>
                  {day.dayOfWeek}
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color={isHoliday ? HOLIDAY_COLOR : isWeekend ? WEEKEND_COLOR : "text.primary"}
                  sx={{ fontSize: 12 }}
                >
                  {day.dayOfMonth}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function SalaryPayslipCharts({ rows = [], periodTotals = {}, currencySymbol = "", periodCalendar = [] }) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const warning = theme.palette.warning.main;

  const employeeHoursData = useMemo(
    () =>
      rows.map((r) => ({
        name: shortName(r.employeeName),
        fullName: r.employeeName,
        regularHours: Number(r.regularHours || 0),
        extraHours: Number(r.extraHours || 0),
        weekendHours: Number(r.weekendHours || 0),
      })),
    [rows]
  );

  const checkInOutData = useMemo(
    () =>
      rows.map((r) => ({
        name: shortName(r.employeeName),
        fullName: r.employeeName,
        checkIns: r.checkInCount || 0,
        checkOuts: r.checkOutCount || 0,
      })),
    [rows]
  );

  const payData = useMemo(
    () =>
      rows.map((r) => ({
        name: shortName(r.employeeName),
        fullName: r.employeeName,
        regularPay: Number(r.regularPay || 0),
        extraPay: Number(r.extraPay || 0),
        weekendPay: Number(r.weekendPay || 0),
      })),
    [rows]
  );

  const payablePayData = useMemo(
    () =>
      rows.map((r) => ({
        name: shortName(r.employeeName),
        fullName: r.employeeName,
        monthPayable: monthPayableOf(r),
      })),
    [rows]
  );

  const salaryVsPayableData = useMemo(
    () =>
      rows.map((r) => ({
        name: shortName(r.employeeName),
        fullName: r.employeeName,
        totalSalary: totalSalaryOf(r),
        monthPayable: monthPayableOf(r),
      })),
    [rows]
  );

  const hoursPieData = useMemo(
    () => [
      { name: "Weekday regular (≤8h)", value: Number(periodTotals.regularHours || 0) },
      { name: "Weekday extra (>8h)", value: Number(periodTotals.extraHours || 0) },
      { name: "Weekend (Sat/Sun)", value: Number(periodTotals.weekendHours || 0) },
    ].filter((x) => x.value > 0),
    [periodTotals]
  );

  const payablePieData = useMemo(
    () =>
      [{ name: "Regular pay (payable)", value: Number(periodTotals.regularPay || 0) }].filter(
        (x) => x.value > 0
      ),
    [periodTotals]
  );

  const tooltipLabel = (label, payload) => {
    const full = payload?.[0]?.payload?.fullName;
    return full || label;
  };

  if (!rows.length) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
        Load a period with employees to see charts.
      </Typography>
    );
  }

  const chartHeight = Math.max(280, Math.min(420, rows.length * 36 + 80));

  return (
    <>
      {periodCalendar.length > 0 && <PeriodMonthCalendar periodCalendar={periodCalendar} />}
      <Grid container spacing={2}>
      <Grid item xs={12} md={8}>
        <Card sx={chartCardSx}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Hours by employee (weekday regular / extra + weekend)
            </Typography>
            <Box sx={{ width: "100%", height: chartHeight }}>
              <ResponsiveContainer>
                <BarChart data={employeeHoursData} margin={{ top: 8, right: 16, left: 0, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} interval={0} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} label={{ value: "Hours", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
                  <Tooltip labelFormatter={tooltipLabel} />
                  <Legend />
                  <Bar dataKey="regularHours" name="Weekday regular" stackId="h" fill={primary} />
                  <Bar dataKey="extraHours" name="Weekday extra" stackId="h" fill={warning} />
                  <Bar dataKey="weekendHours" name="Weekend" stackId="h" fill={WEEKEND_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card variant="outlined" sx={{ height: "100%" }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Total hours split
            </Typography>
            <Box sx={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={hoursPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} label={({ name, value }) => `${name}: ${value.toFixed(1)}`}>
                    {hoursPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${Number(v).toFixed(2)} h`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={chartCardSx}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Check-in vs check-out count
            </Typography>
            <Box sx={{ width: "100%", height: chartHeight }}>
              <ResponsiveContainer>
                <BarChart data={checkInOutData} margin={{ top: 8, right: 16, left: 0, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} interval={0} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={tooltipLabel} />
                  <Legend />
                  <Bar dataKey="checkIns" name="Check-ins" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="checkOuts" name="Check-outs" fill={theme.palette.grey[600]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={chartCardSx}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              This month payable — regular logged hrs ({currencySymbol || ""})
            </Typography>
            <Box sx={{ width: "100%", height: chartHeight }}>
              <ResponsiveContainer>
                <BarChart data={payablePayData} margin={{ top: 8, right: 16, left: 0, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} interval={0} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={tooltipLabel}
                    formatter={(v) => `${currencySymbol}${Number(v).toFixed(2)}`}
                  />
                  <Legend />
                  <Bar dataKey="monthPayable" name="This month payable" fill={PAYABLE_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={chartCardSx}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Total salary (profile) vs this month payable
            </Typography>
            <Box sx={{ width: "100%", height: chartHeight }}>
              <ResponsiveContainer>
                <BarChart data={salaryVsPayableData} margin={{ top: 8, right: 16, left: 0, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} interval={0} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={tooltipLabel}
                    formatter={(v) => `${currencySymbol}${Number(v).toFixed(2)}`}
                  />
                  <Legend />
                  <Bar dataKey="totalSalary" name="Total salary (profile)" fill={theme.palette.grey[500]} />
                  <Bar dataKey="monthPayable" name="This month payable" fill={PAYABLE_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card variant="outlined" sx={{ height: "100%" }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Payable (regular logged hrs)
            </Typography>
            <Box sx={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={payablePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={88}
                    label={({ name, value }) => `${name}: ${currencySymbol}${value.toFixed(0)}`}
                  >
                    {payablePieData.map((_, i) => (
                      <Cell key={i} fill={[primary, WEEKEND_COLOR][i % 2]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${currencySymbol}${Number(v).toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card sx={chartCardSx}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              All pay breakdown (extra pay not in payable) ({currencySymbol || ""})
            </Typography>
            <Box sx={{ width: "100%", height: chartHeight }}>
              <ResponsiveContainer>
                <BarChart data={payData} margin={{ top: 8, right: 16, left: 0, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} interval={0} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={tooltipLabel}
                    formatter={(v) => `${currencySymbol}${Number(v).toFixed(2)}`}
                  />
                  <Legend />
                  <Bar dataKey="regularPay" name="Regular pay" stackId="p" fill={primary} />
                  <Bar dataKey="weekendPay" name="Weekend pay" stackId="p" fill={WEEKEND_COLOR} />
                  <Bar dataKey="extraPay" name="Extra pay (not payable)" stackId="x" fill={warning} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
    </>
  );
}

/** Daily hours chart for employee detail dialog */
export function SalaryPayslipDailyChart({ dailyBreakdown = [] }) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const warning = theme.palette.warning.main;

  const data = useMemo(
    () =>
      (dailyBreakdown || []).map((d) => ({
        date: `${d.dayOfWeek || ""} ${String(d.date).slice(8, 10)}`,
        fullDate: `${d.date} (${d.dayOfWeek})${d.isWeekend ? " — Weekend" : ""}`,
        regularHours: d.isWeekend ? 0 : d.regularHours,
        extraHours: d.isWeekend ? 0 : d.extraHours,
        weekendHours: d.isWeekend ? d.weekendHours || d.dayTotalHours : 0,
        isWeekend: d.isWeekend,
      })),
    [dailyBreakdown]
  );

  if (!data.length) return null;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Daily hours chart (weekends in purple)
        </Typography>
        <Box sx={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate} />
              <Legend />
              <Bar dataKey="regularHours" name="Weekday regular" stackId="d" fill={primary} />
              <Bar dataKey="extraHours" name="Weekday extra" stackId="d" fill={warning} />
              <Bar dataKey="weekendHours" name="Weekend" stackId="d" fill={WEEKEND_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
