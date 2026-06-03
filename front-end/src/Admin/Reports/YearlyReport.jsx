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
import { DateRange, Assessment, Schedule, TrendingUp, AccountBalance } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
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

function buildYearlyByProject(workDetails) {
  const map = new Map();
  workDetails.forEach((item) => {
    const year = entryYear(item);
    if (!year || !item.projectName) return;
    if (!map.has(item.projectName)) map.set(item.projectName, {});
    const proj = map.get(item.projectName);
    proj[year] = (proj[year] || 0) + hoursFromEntry(item);
  });
  return map;
}

const YearlyReport = () => {
  const { projectDetails, workDetails, loading, error, loadData } = useProjectsAndWorkDetails();
  const { notify, SnackbarAlert } = useReportSnackbar();
  const [exportApi, setExportApi] = useState(null);
  const [projectFilter, setProjectFilter] = useState("");

  useEffect(() => {
    loadData();
  }, [loadData]);

  const yearlyByProject = useMemo(() => buildYearlyByProject(workDetails), [workDetails]);

  const uniqueYears = useMemo(() => {
    const years = new Set();
    workDetails.forEach((w) => {
      const y = entryYear(w);
      if (y) years.add(y);
    });
    return [...years].sort((a, b) => a - b);
  }, [workDetails]);

  const filteredProjects = useMemo(() => {
    if (!projectFilter) return projectDetails;
    return projectDetails.filter((p) => p.projectName === projectFilter);
  }, [projectDetails, projectFilter]);

  const projectOptions = useMemo(
    () => projectNamesFromData(projectDetails, workDetails),
    [projectDetails, workDetails]
  );

  const totalConsumedAll = useMemo(
    () => workDetails.reduce((s, w) => s + hoursFromEntry(w), 0),
    [workDetails]
  );

  const summary = useMemo(() => {
    let allotted = 0;
    filteredProjects.forEach((p) => {
      allotted += parseFloat(p.allotatedHours) || 0;
    });
    const consumed = filteredProjects.reduce((s, p) => {
      const years = yearlyByProject.get(p.projectName) || {};
      return s + Object.values(years).reduce((a, b) => a + b, 0);
    }, 0);
    return {
      projects: filteredProjects.length,
      years: uniqueYears.length,
      allotted: allotted.toFixed(2),
      consumed: consumed.toFixed(2),
    };
  }, [filteredProjects, yearlyByProject, uniqueYears]);

  const columnDefs = useMemo(() => {
    const yearCols = uniqueYears.map((year) => ({
      field: String(year),
      headerName: String(year),
      minWidth: 88,
      valueGetter: (params) => {
        const y = yearlyByProject.get(params.data.projectName);
        return Number((y?.[year] || 0).toFixed(2));
      },
      cellStyle: (p) => (p.value > 0 ? { fontWeight: 600 } : null),
    }));

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
        headerName: "Total consumed",
        minWidth: 120,
        valueGetter: (params) => {
          const years = yearlyByProject.get(params.data.projectName) || {};
          const t = Object.values(years).reduce((s, h) => s + h, 0);
          return Number(t.toFixed(2));
        },
        cellStyle: { fontWeight: 600 },
      },
      {
        headerName: "Utilization %",
        minWidth: 110,
        valueGetter: (params) => {
          const allotted = parseFloat(params.data.allotatedHours) || 0;
          if (!allotted) return 0;
          const years = yearlyByProject.get(params.data.projectName) || {};
          const t = Object.values(years).reduce((s, h) => s + h, 0);
          return Number(((t / allotted) * 100).toFixed(1));
        },
      },
      {
        headerName: "Idle hrs",
        minWidth: 90,
        valueGetter: (params) => {
          const allotted = parseFloat(params.data.allotatedHours) || 0;
          const years = yearlyByProject.get(params.data.projectName) || {};
          const t = Object.values(years).reduce((s, h) => s + h, 0);
          return Number(Math.max(0, allotted - t).toFixed(2));
        },
      },
      ...yearCols,
    ];
  }, [uniqueYears, yearlyByProject]);

  const onExport = () => {
    if (exportApi) {
      exportApi.exportDataAsCsv({ fileName: "yearly-project-report.csv" });
      notify("Report exported successfully");
    } else notify("Please wait for the grid to load", "warning");
  };

  return (
    <Box sx={{ maxWidth: 1800, mx: "auto" }}>
      <ReportPageHeader
        icon={DateRange}
        title="Project Yearly Report"
        subtitle="Approved hours by project and calendar year with utilization and idle hours."
        onRefresh={loadData}
        loading={loading}
        onExport={onExport}
        exportDisabled={!filteredProjects.length}
      />

      <ReportFilterCard
        chips={
          projectFilter ? (
            <Chip label={projectFilter} size="small" color="primary" onDelete={() => setProjectFilter("")} />
          ) : null
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
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

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && (
        <ReportStatsGrid>
          <StatCard icon={Assessment} label="Projects" value={summary.projects} accent="primary" />
          <StatCard icon={DateRange} label="Years in data" value={summary.years} accent="info" />
          <StatCard icon={AccountBalance} label="Allotted hrs" value={summary.allotted} accent="secondary" />
          <StatCard icon={Schedule} label="Consumed (all years)" value={summary.consumed} accent="warning" valueColor="warning.dark" />
          <StatCard label="Grand total hrs" value={totalConsumedAll.toFixed(2)} sub="All approved entries" accent="success" />
        </ReportStatsGrid>
      )}

      <ReportGridCard icon={DateRange} title="Yearly project analysis" rowCount={filteredProjects.length} loading={loading}>
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

export default YearlyReport;
