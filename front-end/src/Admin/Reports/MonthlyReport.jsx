import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Snackbar,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  CalendarMonth,
  FileDownload,
  Refresh,
  FilterList,
  Clear,
  Assessment,
  Schedule,
  TrendingUp,
  AccountBalance,
} from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import dayjs from "dayjs";
import api from "../../services/api";
import { workDetailHours } from "../../utils/formatWorkDetailClock";

const MONTH_COLUMNS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const pageCardSx = {
  borderRadius: 3,
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  border: "1px solid",
  borderColor: "divider",
};

function resolveAccent(theme, accent) {
  if (typeof accent === "string" && accent.startsWith("#")) return accent;
  return theme.palette[accent]?.main || theme.palette.primary.main;
}

function StatCard({ icon: Icon, label, value, sub, accent = "primary", valueColor }) {
  const theme = useTheme();
  const main = resolveAccent(theme, accent);
  return (
    <Card
      sx={{
        ...pageCardSx,
        height: "100%",
        borderLeft: `4px solid ${main}`,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 28px rgba(0,0,0,0.1)" },
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
            <Typography variant="caption" color="text.secondary" display="block">
              {label}
            </Typography>
            <Typography variant="h6" fontWeight={700} color={valueColor || "text.primary"} sx={{ lineHeight: 1.25 }}>
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

function entryYearAndMonth(item) {
  const raw = item?.sentDate || item?.clockInTime;
  if (!raw) return null;
  const d = dayjs(raw);
  if (!d.isValid()) return null;
  return { year: d.year(), monthIndex: d.month(), monthName: MONTH_COLUMNS[d.month()] };
}

function buildMonthlyHoursByProject(workDetails, year) {
  const byMonth = {};
  MONTH_COLUMNS.forEach((m) => {
    byMonth[m] = {};
  });

  (workDetails || []).forEach((item) => {
    const ym = entryYearAndMonth(item);
    if (!ym || ym.year !== year) return;
    const projectKey = item.projectName || "Unknown";
    const hrs = workDetailHours(item);
    byMonth[ym.monthName][projectKey] = (byMonth[ym.monthName][projectKey] || 0) + hrs;
  });

  return byMonth;
}

function consumedHoursForProject(workDetails, projectName, year) {
  return (workDetails || []).reduce((total, entry) => {
    if (entry.projectName !== projectName) return total;
    const ym = entryYearAndMonth(entry);
    if (!ym || ym.year !== year) return total;
    return total + workDetailHours(entry);
  }, 0);
}

const MonthlyReport = () => {
  const theme = useTheme();
  const gridStyle = { height: "100%", width: "100%" };

  const [projectDetails, setProjectDetails] = useState([]);
  const [workDetails, setWorkDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportApi, setExportApi] = useState(null);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [projectFilter, setProjectFilter] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectRes, workRes] = await Promise.all([
        api.get("/getProject"),
        api.get("/getWorkDetails"),
      ]);

      if (projectRes.data?.Status === "Success") {
        setProjectDetails(projectRes.data.Result || []);
      } else {
        throw new Error(projectRes.data?.Message || "Failed to load projects");
      }

      if (workRes.data?.Status === "Success") {
        const approved = (workRes.data.Result || []).filter(
          (item) => String(item.status || "").toLowerCase() === "approved"
        );
        setWorkDetails(approved);
      } else {
        throw new Error(workRes.data?.Message || "Failed to load work details");
      }
    } catch (e) {
      setError(e?.message || "Failed to load report data");
      setProjectDetails([]);
      setWorkDetails([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const projectWorkHours = useMemo(
    () => buildMonthlyHoursByProject(workDetails, selectedYear),
    [workDetails, selectedYear]
  );

  const yearOptions = useMemo(() => {
    const years = new Set([dayjs().year()]);
    workDetails.forEach((item) => {
      const ym = entryYearAndMonth(item);
      if (ym) years.add(ym.year);
    });
    return [...years].sort((a, b) => b - a);
  }, [workDetails]);

  const projectOptions = useMemo(() => {
    const names = new Set(projectDetails.map((p) => p.projectName).filter(Boolean));
    workDetails.forEach((w) => {
      if (w.projectName) names.add(w.projectName);
    });
    return [...names].sort();
  }, [projectDetails, workDetails]);

  const filteredProjects = useMemo(() => {
    if (!projectFilter) return projectDetails;
    return projectDetails.filter((p) => p.projectName === projectFilter);
  }, [projectDetails, projectFilter]);

  const reportSummary = useMemo(() => {
    let totalAllotted = 0;
    let totalConsumed = 0;
    const monthTotals = MONTH_COLUMNS.map((m) => ({
      month: m,
      hours: 0,
    }));

    filteredProjects.forEach((p) => {
      totalAllotted += parseFloat(p.allotatedHours) || 0;
      totalConsumed += consumedHoursForProject(workDetails, p.projectName, selectedYear);
    });

    MONTH_COLUMNS.forEach((month, idx) => {
      const projects = projectWorkHours[month] || {};
      monthTotals[idx].hours = Object.values(projects).reduce((s, h) => s + h, 0);
    });

    const peakMonth = monthTotals.reduce(
      (best, cur) => (cur.hours > best.hours ? cur : best),
      { month: "—", hours: 0 }
    );

    const ytdAllProjects = MONTH_COLUMNS.reduce((sum, month) => {
      const projects = projectWorkHours[month] || {};
      return sum + Object.values(projects).reduce((s, h) => s + h, 0);
    }, 0);

    return {
      projectCount: filteredProjects.length,
      totalAllotted: Number(totalAllotted.toFixed(2)),
      totalConsumed: Number(totalConsumed.toFixed(2)),
      remaining: Number(Math.max(0, totalAllotted - totalConsumed).toFixed(2)),
      ytdAllProjects: Number(ytdAllProjects.toFixed(2)),
      approvedEntries: workDetails.filter((w) => {
        const ym = entryYearAndMonth(w);
        return ym && ym.year === selectedYear && (!projectFilter || w.projectName === projectFilter);
      }).length,
      peakMonth,
      monthTotals,
    };
  }, [filteredProjects, workDetails, projectWorkHours, selectedYear, projectFilter]);

  const generateMonthColumn = useCallback(
    (month) => ({
      field: month,
      headerName: month.slice(0, 3),
      filter: false,
      minWidth: 72,
      maxWidth: 88,
      cellStyle: (params) =>
        Number(params.value) > 0 ? { fontWeight: 600, color: theme.palette.primary.main } : null,
      valueGetter: (params) => {
        const value = projectWorkHours[month]?.[params.data.projectName] || 0;
        return Number(value.toFixed(2));
      },
    }),
    [projectWorkHours, theme.palette.primary.main]
  );

  const columnDefs = useMemo(
    () => [
      {
        field: "projectName",
        headerName: "Project",
        minWidth: 180,
        pinned: "left",
        filter: true,
      },
      { field: "referenceNo", headerName: "Reference", minWidth: 120 },
      { field: "desciplineCode", headerName: "Discipline", minWidth: 110 },
      {
        field: "allotatedHours",
        headerName: "Allotted",
        minWidth: 100,
        valueFormatter: (p) => (p.value != null ? Number(p.value).toFixed(2) : "0.00"),
      },
      {
        field: "consumed",
        headerName: `Consumed (${selectedYear})`,
        minWidth: 130,
        valueGetter: (params) =>
          Number(consumedHoursForProject(workDetails, params.data.projectName, selectedYear).toFixed(2)),
        cellStyle: { fontWeight: 600 },
      },
      {
        field: "remaining",
        headerName: "Remaining",
        minWidth: 110,
        valueGetter: (params) => {
          const allotted = parseFloat(params.data.allotatedHours) || 0;
          const consumed = consumedHoursForProject(
            workDetails,
            params.data.projectName,
            selectedYear
          );
          return Number(Math.max(0, allotted - consumed).toFixed(2));
        },
        cellStyle: (params) =>
          params.value > 0 ? { color: theme.palette.success.main } : { color: theme.palette.error.main },
      },
      ...MONTH_COLUMNS.map(generateMonthColumn),
    ],
    [generateMonthColumn, selectedYear, workDetails, theme]
  );

  const defaultColDef = useMemo(
    () => ({
      editable: false,
      sortable: true,
      resizable: true,
      filter: false,
      flex: 0,
      minWidth: 72,
    }),
    []
  );

  const onGridReady = (params) => {
    setExportApi(params?.api);
  };

  const onClickExport = () => {
    if (exportApi) {
      exportApi.exportDataAsCsv({ fileName: `monthly-report-${selectedYear}.csv` });
      setSnackbar({ open: true, message: "Report exported successfully", severity: "success" });
    } else {
      setSnackbar({ open: true, message: "Please wait for the grid to load", severity: "warning" });
    }
  };

  const hasFilters = projectFilter !== "";

  return (
    <Box sx={{ maxWidth: 1800, mx: "auto" }}>
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
            <CalendarMonth />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -0.5 }}>
              Project Monthly Report
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
              Approved work hours by project and month. Consumed and monthly columns are scoped to the
              selected year.
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadData}
            disabled={loading}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Refresh
          </Button>
          <Button
            onClick={onClickExport}
            variant="contained"
            startIcon={<FileDownload />}
            disabled={loading || !filteredProjects.length}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
            }}
          >
            Export CSV
          </Button>
        </Stack>
      </Box>

      <Card sx={{ ...pageCardSx, mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
            <FilterList color="primary" />
            <Typography variant="h6" fontWeight={700}>
              Filters
            </Typography>
            <Chip label={`Year ${selectedYear}`} size="small" color="primary" variant="outlined" />
            {hasFilters && (
              <Chip
                label="Clear project filter"
                size="small"
                icon={<Clear />}
                onClick={() => setProjectFilter("")}
                clickable
                color="warning"
                variant="outlined"
                sx={{ ml: "auto" }}
              />
            )}
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Year"
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {yearOptions.map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8} md={5}>
              <FormControl fullWidth size="small">
                <InputLabel>Project</InputLabel>
                <Select
                  value={projectFilter}
                  label="Project"
                  onChange={(e) => setProjectFilter(e.target.value)}
                >
                  <MenuItem value="">All projects</MenuItem>
                  {projectOptions.map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          <Box
            sx={{
              mb: 3,
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(4, 1fr)",
                lg: "repeat(6, 1fr)",
              },
              gap: 2,
            }}
          >
            <StatCard icon={Assessment} label="Projects" value={reportSummary.projectCount} accent="primary" />
            <StatCard
              icon={AccountBalance}
              label="Total allotted hrs"
              value={reportSummary.totalAllotted.toFixed(2)}
              accent="info"
            />
            <StatCard
              icon={Schedule}
              label={`Consumed (${selectedYear})`}
              value={reportSummary.totalConsumed.toFixed(2)}
              sub="Approved work details"
              accent="warning"
              valueColor="warning.dark"
            />
            <StatCard
              label="Remaining hrs"
              value={reportSummary.remaining.toFixed(2)}
              sub="Allotted − consumed"
              accent="success"
              valueColor="success.dark"
            />
            <StatCard
              icon={TrendingUp}
              label="YTD logged (all)"
              value={reportSummary.ytdAllProjects.toFixed(2)}
              sub={`Sum of monthly columns · ${selectedYear}`}
              accent="secondary"
            />
            <StatCard
              label="Peak month"
              value={reportSummary.peakMonth.month}
              sub={`${reportSummary.peakMonth.hours.toFixed(2)} hrs`}
              accent="#9C27B0"
            />
          </Box>

          <Card sx={{ ...pageCardSx, mb: 3 }}>
            <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Hours by month ({selectedYear}) — all projects
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {reportSummary.monthTotals.map(({ month, hours }) => (
                  <Chip
                    key={month}
                    size="small"
                    variant={hours > 0 ? "filled" : "outlined"}
                    color={hours > 0 ? "primary" : "default"}
                    label={`${month.slice(0, 3)}: ${hours.toFixed(1)}h`}
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </>
      )}

      <Card sx={pageCardSx}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <CalendarMonth color="primary" />
            <Typography variant="h6" fontWeight={700}>
              Monthly project hours
            </Typography>
            <Chip label={`${filteredProjects.length} projects`} size="small" sx={{ ml: 1 }} />
            <Chip label={`${reportSummary.approvedEntries} approved entries`} size="small" variant="outlined" />
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ width: "100%", height: 620, position: "relative" }}>
            {loading && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "rgba(255,255,255,0.7)",
                  zIndex: 2,
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <div style={gridStyle} className="ag-theme-alpine">
              <AgGridReact
                rowData={filteredProjects}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                suppressRowClickSelection
                rowSelection="single"
                pagination
                paginationPageSize={25}
                onGridReady={onGridReady}
                domLayout="normal"
              />
            </div>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MonthlyReport;
