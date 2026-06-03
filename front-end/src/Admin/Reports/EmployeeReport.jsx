import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Chip,
  Stack,
  Alert,
  Typography,
} from "@mui/material";
import { People, Clear } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import api from "../../services/api";
import {
  ReportPageHeader,
  ReportFilterCard,
  ReportGridCard,
  ReportStatsGrid,
  StatCard,
  useReportSnackbar,
  gridStyle,
  defaultReportColDef,
} from "../../components/reports/reportPageUi";

const STATUS_OPTIONS = [
  { key: "all", label: "All active statuses" },
  { key: "Permanent", label: "Permanent" },
  { key: "Probation", label: "Probation" },
  { key: "Ex-Employee", label: "Ex-Employee" },
];

const EmployeeReport = () => {
  const { notify, SnackbarAlert } = useReportSnackbar();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportApi, setExportApi] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/getEmployee");
      if (res.data?.Status === "Success") {
        setEmployees(res.data.Result || []);
      } else {
        throw new Error(res.data?.Message || "Failed to load employees");
      }
    } catch (e) {
      setError(e?.message || "Failed to load employees");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const filteredRows = useMemo(() => {
    let list = employees;
    if (statusFilter !== "all") {
      list = list.filter((e) => String(e.employeeStatus || "").trim() === statusFilter);
    }
    if (startDate || endDate) {
      list = list.filter((item) => {
        const dateField =
          statusFilter === "Ex-Employee" ? item.relievingDate : item.date;
        if (!dateField) return false;
        const d = dayjs(dateField);
        if (!d.isValid()) return false;
        if (startDate && d.isBefore(dayjs(startDate), "day")) return false;
        if (endDate && d.isAfter(dayjs(endDate), "day")) return false;
        return true;
      });
    }
    return list;
  }, [employees, statusFilter, startDate, endDate]);

  const summary = useMemo(() => {
    const counts = { Permanent: 0, Probation: 0, "Ex-Employee": 0, other: 0 };
    filteredRows.forEach((e) => {
      const s = String(e.employeeStatus || "").trim();
      if (counts[s] !== undefined) counts[s] += 1;
      else counts.other += 1;
    });
    return { total: filteredRows.length, ...counts };
  }, [filteredRows]);

  const columnDefs = useMemo(
    () => [
      { field: "employeeName", headerName: "Name", minWidth: 160, pinned: "left" },
      { field: "EMPID", headerName: "Employee ID", minWidth: 110 },
      { field: "employeeEmail", headerName: "Email", minWidth: 180 },
      { field: "userName", minWidth: 120 },
      { field: "role", minWidth: 90 },
      { field: "discipline", minWidth: 100 },
      { field: "designation", minWidth: 120 },
      { field: "employeeStatus", headerName: "Status", minWidth: 110 },
      { field: "date", headerName: "Join date", minWidth: 110 },
      { field: "permanentDate", headerName: "Permanent date", minWidth: 120 },
      { field: "relievingDate", headerName: "Relieving date", minWidth: 120 },
    ],
    []
  );

  const clearFilters = () => {
    setStatusFilter("all");
    setStartDate(null);
    setEndDate(null);
  };

  const onExport = () => {
    if (exportApi) {
      exportApi.exportDataAsCsv({ fileName: "employee-report.csv" });
      notify("Report exported successfully");
    } else notify("Please wait for the grid to load", "warning");
  };

  return (
    <Box sx={{ maxWidth: 1800, mx: "auto" }}>
      <ReportPageHeader
        icon={People}
        title="Employee Report"
        subtitle="Employee roster with status and join / relieving date filters."
        onRefresh={loadEmployees}
        loading={loading}
        onExport={onExport}
        exportDisabled={!filteredRows.length}
      />

      <ReportFilterCard
        title="Filters"
        chips={
          (statusFilter !== "all" || startDate || endDate) && (
            <Chip label="Clear all" size="small" icon={<Clear />} onClick={clearFilters} clickable color="warning" variant="outlined" />
          )
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Status
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {STATUS_OPTIONS.map((opt) => (
                <Chip
                  key={opt.key}
                  label={opt.label}
                  clickable
                  color={statusFilter === opt.key ? "primary" : "default"}
                  variant={statusFilter === opt.key ? "filled" : "outlined"}
                  onClick={() => setStatusFilter(opt.key)}
                />
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label={statusFilter === "Ex-Employee" ? "Relieving from" : "Join from"}
                value={startDate}
                onChange={(v) => setStartDate(v)}
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label={statusFilter === "Ex-Employee" ? "Relieving to" : "Join to"}
                value={endDate}
                onChange={(v) => setEndDate(v)}
                minDate={startDate || undefined}
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </ReportFilterCard>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && (
        <ReportStatsGrid>
          <StatCard icon={People} label="Shown" value={summary.total} accent="primary" />
          <StatCard label="Permanent" value={summary.Permanent} accent="success" />
          <StatCard label="Probation" value={summary.Probation} accent="warning" />
          <StatCard label="Ex-employee" value={summary["Ex-Employee"]} accent="error" />
        </ReportStatsGrid>
      )}

      <ReportGridCard icon={People} title="Employee details" rowCount={filteredRows.length} loading={loading}>
        <div style={gridStyle} className="ag-theme-alpine">
          <AgGridReact
            rowData={filteredRows}
            columnDefs={columnDefs}
            defaultColDef={{ ...defaultReportColDef, filter: true, floatingFilter: true }}
            pagination
            paginationPageSize={25}
            onGridReady={(p) => setExportApi(p?.api)}
          />
        </div>
      </ReportGridCard>
      {SnackbarAlert}
    </Box>
  );
};

export default EmployeeReport;
