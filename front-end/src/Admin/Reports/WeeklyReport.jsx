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
} from "@mui/material";
import { CalendarToday, Assessment, Schedule, TrendingUp, AccountBalance } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import dayjs from "dayjs";
import {
  ReportPageHeader,
  ReportFilterCard,
  ReportGridCard,
  ReportStatsGrid,
  StatCard,
  useProjectsAndWorkDetails,
  useReportSnackbar,
  hoursFromEntry,
  entryYear,
  projectNamesFromData,
  gridStyle,
  defaultReportColDef,
} from "../../components/reports/reportPageUi";

const WeeklyReport = () => {
  const { projectDetails, workDetails, loading, error, loadData } = useProjectsAndWorkDetails();
  const { notify, SnackbarAlert } = useReportSnackbar();
  const [exportApi, setExportApi] = useState(null);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [projectFilter, setProjectFilter] = useState("");

  useEffect(() => {
    loadData();
  }, [loadData]);

  const yearWork = useMemo(
    () => workDetails.filter((w) => entryYear(w) === selectedYear),
    [workDetails, selectedYear]
  );

  const filteredProjects = useMemo(() => {
    if (!projectFilter) return projectDetails;
    return projectDetails.filter((p) => p.projectName === projectFilter);
  }, [projectDetails, projectFilter]);

  const yearOptions = useMemo(() => {
    const years = new Set([dayjs().year()]);
    workDetails.forEach((w) => {
      const y = entryYear(w);
      if (y) years.add(y);
    });
    return [...years].sort((a, b) => b - a);
  }, [workDetails]);

  const projectOptions = useMemo(
    () => projectNamesFromData(projectDetails, workDetails),
    [projectDetails, workDetails]
  );

  const consumedByProject = useMemo(() => {
    const map = new Map();
    yearWork.forEach((w) => {
      if (!w.projectName) return;
      map.set(w.projectName, (map.get(w.projectName) || 0) + hoursFromEntry(w));
    });
    return map;
  }, [yearWork]);

  const summary = useMemo(() => {
    let allotted = 0;
    filteredProjects.forEach((p) => {
      allotted += parseFloat(p.allotatedHours) || 0;
    });
    const consumed = [...consumedByProject.values()].reduce((s, h) => s + h, 0);
    const filteredConsumed = projectFilter
      ? consumedByProject.get(projectFilter) || 0
      : consumed;
    return {
      projects: filteredProjects.length,
      allotted: allotted.toFixed(2),
      consumed: filteredConsumed.toFixed(2),
      entries: projectFilter
        ? yearWork.filter((w) => w.projectName === projectFilter).length
        : yearWork.length,
    };
  }, [filteredProjects, consumedByProject, yearWork, projectFilter]);

  const getWeekHours = (projectName, weekNumber) =>
    yearWork
      .filter(
        (item) =>
          String(item.weekNumber) === String(weekNumber) && item.projectName === projectName
      )
      .reduce((acc, item) => acc + hoursFromEntry(item), 0);

  const columnDefs = useMemo(() => {
    const weekFields = [];
    for (let w = 1; w <= 52; w++) {
      weekFields.push({
        field: String(w),
        headerName: `W${w}`,
        minWidth: 52,
        maxWidth: 60,
        valueGetter: (params) => Number(getWeekHours(params.data.projectName, w).toFixed(2)),
        cellStyle: (p) => (p.value > 0 ? { fontWeight: 600 } : null),
      });
    }
    return [
      { field: "projectName", headerName: "Project", minWidth: 180, pinned: "left" },
      { field: "referenceNo", headerName: "Reference", minWidth: 110 },
      { field: "desciplineCode", headerName: "Discipline", minWidth: 100 },
      {
        field: "allotatedHours",
        headerName: "Allotted",
        minWidth: 90,
        valueFormatter: (p) => Number(p.value || 0).toFixed(2),
      },
      {
        headerName: `Consumed (${selectedYear})`,
        minWidth: 120,
        valueGetter: (p) =>
          Number((consumedByProject.get(p.data.projectName) || 0).toFixed(2)),
        cellStyle: { fontWeight: 600 },
      },
      ...weekFields,
    ];
  }, [yearWork, selectedYear, consumedByProject]);

  const onExport = () => {
    if (exportApi) {
      exportApi.exportDataAsCsv({ fileName: `weekly-report-${selectedYear}.csv` });
      notify("Report exported successfully");
    } else notify("Please wait for the grid to load", "warning");
  };

  return (
    <Box sx={{ maxWidth: 1800, mx: "auto" }}>
      <ReportPageHeader
        icon={CalendarToday}
        title="Project Weekly Report"
        subtitle="Approved hours by project and week number (1–52) for the selected year."
        onRefresh={loadData}
        loading={loading}
        onExport={onExport}
        exportDisabled={!filteredProjects.length}
      />

      <ReportFilterCard
        chips={
          <>
            <Chip label={`Year ${selectedYear}`} size="small" color="primary" variant="outlined" />
            {projectFilter && (
              <Chip label={projectFilter} size="small" color="primary" onDelete={() => setProjectFilter("")} />
            )}
          </>
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Year</InputLabel>
              <Select value={selectedYear} label="Year" onChange={(e) => setSelectedYear(Number(e.target.value))}>
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
              <Select value={projectFilter} label="Project" onChange={(e) => setProjectFilter(e.target.value)}>
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
      </ReportFilterCard>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <ReportStatsGrid>
          <StatCard icon={Assessment} label="Projects" value={summary.projects} accent="primary" />
          <StatCard icon={AccountBalance} label="Allotted hrs" value={summary.allotted} accent="info" />
          <StatCard icon={Schedule} label={`Consumed (${selectedYear})`} value={summary.consumed} accent="warning" valueColor="warning.dark" />
          <StatCard icon={TrendingUp} label="Approved entries" value={summary.entries} accent="secondary" />
        </ReportStatsGrid>
      )}

      <ReportGridCard
        icon={CalendarToday}
        title="Weekly project hours"
        rowCount={filteredProjects.length}
        loading={loading}
      >
        <div style={gridStyle} className="ag-theme-alpine">
          <AgGridReact
            rowData={filteredProjects}
            columnDefs={columnDefs}
            defaultColDef={defaultReportColDef}
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

export default WeeklyReport;
