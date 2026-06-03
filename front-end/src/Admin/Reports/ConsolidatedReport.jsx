import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Assessment, Schedule, Groups, Folder, Search } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import { formatClockDateTime } from "../../utils/formatWorkDetailClock";
import {
  ReportPageHeader,
  ReportFilterCard,
  ReportGridCard,
  ReportStatsGrid,
  StatCard,
  useWorkDetailsOnly,
  useReportSnackbar,
  hoursFromEntry,
  entryYear,
  gridStyle,
  defaultReportColDef,
} from "../../components/reports/reportPageUi";

const ConsolidatedReport = () => {
  const { workDetails, loading, error, loadData } = useWorkDetailsOnly();
  const { notify, SnackbarAlert } = useReportSnackbar();
  const [exportApi, setExportApi] = useState(null);
  const [yearFilter, setYearFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    loadData();
  }, [loadData]);

  const yearOptions = useMemo(() => {
    const years = new Set();
    workDetails.forEach((w) => {
      const y = entryYear(w);
      if (y) years.add(y);
    });
    return [...years].sort((a, b) => b - a);
  }, [workDetails]);

  const employeeOptions = useMemo(
    () => [...new Set(workDetails.map((w) => w.employeeName).filter(Boolean))].sort(),
    [workDetails]
  );

  const projectOptions = useMemo(
    () => [...new Set(workDetails.map((w) => w.projectName).filter(Boolean))].sort(),
    [workDetails]
  );

  const filteredRows = useMemo(() => {
    let list = workDetails;
    if (yearFilter) {
      list = list.filter((w) => entryYear(w) === Number(yearFilter));
    }
    if (employeeFilter) {
      list = list.filter((w) => w.employeeName === employeeFilter);
    }
    if (projectFilter) {
      list = list.filter((w) => w.projectName === projectFilter);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(
        (w) =>
          w.employeeName?.toLowerCase().includes(q) ||
          w.projectName?.toLowerCase().includes(q) ||
          w.referenceNo?.toString().includes(q) ||
          w.desciplineCode?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [workDetails, yearFilter, employeeFilter, projectFilter, searchText]);

  const summary = useMemo(() => {
    const hours = filteredRows.reduce((s, w) => s + hoursFromEntry(w), 0);
    return {
      entries: filteredRows.length,
      hours: hours.toFixed(2),
      employees: new Set(filteredRows.map((w) => w.employeeName)).size,
      projects: new Set(filteredRows.map((w) => w.projectName)).size,
    };
  }, [filteredRows]);

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Year",
        minWidth: 80,
        valueGetter: (p) => entryYear(p.data) || "—",
      },
      { field: "weekNumber", headerName: "Week", minWidth: 70 },
      { field: "employeeName", headerName: "Employee", minWidth: 150 },
      { field: "employeeNo", minWidth: 90 },
      { field: "designation", minWidth: 120 },
      { field: "projectName", headerName: "Project", minWidth: 150 },
      { field: "projectNo", minWidth: 90 },
      { field: "desciplineCode", headerName: "Code", minWidth: 90 },
      { field: "subDivision", minWidth: 100 },
      { field: "areaofWork", headerName: "Area", minWidth: 120 },
      { field: "variation", minWidth: 90 },
      {
        field: "totalHours",
        headerName: "Hours",
        minWidth: 80,
        valueGetter: (p) => Number(hoursFromEntry(p.data).toFixed(2)),
        cellStyle: { fontWeight: 600 },
      },
      {
        field: "sentDate",
        headerName: "Sent",
        minWidth: 150,
        valueFormatter: (p) => formatClockDateTime(p.value),
      },
    ],
    []
  );

  const onExport = () => {
    if (exportApi) {
      exportApi.exportDataAsCsv({ fileName: "consolidated-report.csv" });
      notify("Report exported successfully");
    } else notify("Please wait for the grid to load", "warning");
  };

  return (
    <Box sx={{ maxWidth: 1800, mx: "auto" }}>
      <ReportPageHeader
        icon={Assessment}
        title="Consolidated Report"
        subtitle="All approved work details — filter by year, employee, project, or search."
        onRefresh={loadData}
        loading={loading}
        onExport={onExport}
        exportDisabled={!filteredRows.length}
      />

      <ReportFilterCard title="Filters & period">
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search employee, project, ref..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Year</InputLabel>
              <Select value={yearFilter} label="Year" onChange={(e) => setYearFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {yearOptions.map((y) => (
                  <MenuItem key={y} value={String(y)}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Employee</InputLabel>
              <Select value={employeeFilter} label="Employee" onChange={(e) => setEmployeeFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {employeeOptions.map((e) => (
                  <MenuItem key={e} value={e}>
                    {e}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Project</InputLabel>
              <Select value={projectFilter} label="Project" onChange={(e) => setProjectFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {projectOptions.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </ReportFilterCard>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && (
        <ReportStatsGrid>
          <StatCard icon={Assessment} label="Entries" value={summary.entries} accent="primary" />
          <StatCard icon={Schedule} label="Total hours" value={summary.hours} accent="warning" valueColor="warning.dark" />
          <StatCard icon={Groups} label="Employees" value={summary.employees} accent="info" />
          <StatCard icon={Folder} label="Projects" value={summary.projects} accent="success" />
        </ReportStatsGrid>
      )}

      <ReportGridCard icon={Assessment} title="Consolidated work details" rowCount={filteredRows.length} loading={loading}>
        <div style={gridStyle} className="ag-theme-alpine">
          <AgGridReact
            rowData={filteredRows}
            columnDefs={columnDefs}
            defaultColDef={{ ...defaultReportColDef, filter: true, floatingFilter: true }}
            pagination
            paginationPageSize={50}
            onGridReady={(p) => setExportApi(p?.api)}
          />
        </div>
      </ReportGridCard>
      {SnackbarAlert}
    </Box>
  );
};

export default ConsolidatedReport;
