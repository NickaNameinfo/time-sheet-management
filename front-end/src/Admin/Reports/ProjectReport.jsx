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
import { Folder, Assessment, Schedule, TrendingUp } from "@mui/icons-material";
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
  projectNamesFromData,
  gridStyle,
  defaultReportColDef,
} from "../../components/reports/reportPageUi";

const ProjectReport = () => {
  const { projectDetails, workDetails, loading, error, loadData } = useProjectsAndWorkDetails();
  const { notify, SnackbarAlert } = useReportSnackbar();
  const [exportApi, setExportApi] = useState(null);
  const [projectFilter, setProjectFilter] = useState("");

  useEffect(() => {
    loadData();
  }, [loadData]);

  const consumedByRef = useMemo(() => {
    const map = new Map();
    workDetails.forEach((w) => {
      const key = w.referenceNo || w.projectName;
      if (!key) return;
      map.set(key, (map.get(key) || 0) + hoursFromEntry(w));
    });
    return map;
  }, [workDetails]);

  const filteredProjects = useMemo(() => {
    if (!projectFilter) return projectDetails;
    return projectDetails.filter((p) => p.projectName === projectFilter);
  }, [projectDetails, projectFilter]);

  const projectOptions = useMemo(
    () => projectNamesFromData(projectDetails, workDetails),
    [projectDetails, workDetails]
  );

  const calcRow = (params) => {
    const ref = params.data.referenceNo;
    const consumed = consumedByRef.get(ref) || consumedByRef.get(params.data.projectName) || 0;
    const allotted = parseFloat(params.data.allotatedHours) || 0;
    const pct = allotted > 0 ? (consumed / allotted) * 100 : 0;
    return {
      consumed: Number(consumed.toFixed(2)),
      utilizedPct: Number(pct.toFixed(1)),
      remainingPct: Number(Math.max(0, 100 - pct).toFixed(1)),
      idle: Number(Math.max(0, allotted - consumed).toFixed(2)),
    };
  };

  const summary = useMemo(() => {
    let allotted = 0;
    let consumed = 0;
    filteredProjects.forEach((p) => {
      allotted += parseFloat(p.allotatedHours) || 0;
      const c =
        consumedByRef.get(p.referenceNo) || consumedByRef.get(p.projectName) || 0;
      consumed += c;
    });
    return {
      count: filteredProjects.length,
      allotted: allotted.toFixed(2),
      consumed: consumed.toFixed(2),
      avgUtil: allotted > 0 ? ((consumed / allotted) * 100).toFixed(1) : "0",
    };
  }, [filteredProjects, consumedByRef]);

  const columnDefs = useMemo(
    () => [
      { field: "projectName", headerName: "Project", minWidth: 180, pinned: "left" },
      { field: "referenceNo", minWidth: 120 },
      { field: "projectNo", headerName: "Project no", minWidth: 100 },
      { field: "orderId", minWidth: 90 },
      { field: "desciplineCode", headerName: "Discipline", minWidth: 100 },
      {
        field: "allotatedHours",
        headerName: "Allotted",
        minWidth: 90,
        valueFormatter: (p) => Number(p.value || 0).toFixed(2),
      },
      {
        headerName: "Consumed",
        minWidth: 100,
        valueGetter: (p) => calcRow(p).consumed,
        cellStyle: { fontWeight: 600 },
      },
      {
        headerName: "% Utilized",
        minWidth: 100,
        valueGetter: (p) => `${calcRow(p).utilizedPct}%`,
      },
      {
        headerName: "Idle hrs",
        minWidth: 90,
        valueGetter: (p) => calcRow(p).idle,
      },
      { field: "startDate", minWidth: 110 },
      { field: "targetDate", minWidth: 110 },
    ],
    [consumedByRef]
  );

  const onExport = () => {
    if (exportApi) {
      exportApi.exportDataAsCsv({ fileName: "project-report.csv" });
      notify("Report exported successfully");
    } else notify("Please wait for the grid to load", "warning");
  };

  return (
    <Box sx={{ maxWidth: 1800, mx: "auto" }}>
      <ReportPageHeader
        icon={Folder}
        title="Project Report"
        subtitle="Project allotment vs approved consumed hours, utilization, and schedule dates."
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
          <StatCard icon={Assessment} label="Projects" value={summary.count} accent="primary" />
          <StatCard icon={Folder} label="Allotted hrs" value={summary.allotted} accent="info" />
          <StatCard icon={Schedule} label="Consumed hrs" value={summary.consumed} accent="warning" valueColor="warning.dark" />
          <StatCard icon={TrendingUp} label="Avg utilization" value={`${summary.avgUtil}%`} accent="success" />
        </ReportStatsGrid>
      )}

      <ReportGridCard icon={Folder} title="Project details" rowCount={filteredProjects.length} loading={loading}>
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

export default ProjectReport;
