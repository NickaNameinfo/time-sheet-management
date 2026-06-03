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
import { Category, Assessment, Schedule } from "@mui/icons-material";
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
  gridStyle,
  defaultReportColDef,
} from "../../components/reports/reportPageUi";

function buildDisciplineByYear(workDetails) {
  const byYear = {};
  workDetails.forEach((item) => {
    const year = entryYear(item);
    const code = item.desciplineCode || item.discipline || "Unknown";
    if (!year) return;
    if (!byYear[year]) byYear[year] = {};
    byYear[year][code] = (byYear[year][code] || 0) + hoursFromEntry(item);
  });
  return Object.keys(byYear)
    .map((y) => ({
      year: parseInt(y, 10),
      disciplineCodeTotals: byYear[y],
      totalHours: Object.values(byYear[y]).reduce((s, h) => s + h, 0),
    }))
    .sort((a, b) => b.year - a.year);
}

const DesciplineCodeReport = () => {
  const { workDetails, loading, error, loadData } = useProjectsAndWorkDetails();
  const { notify, SnackbarAlert } = useReportSnackbar();
  const [exportApi, setExportApi] = useState(null);
  const [yearFilter, setYearFilter] = useState("");

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allRows = useMemo(() => buildDisciplineByYear(workDetails), [workDetails]);

  const filteredRows = useMemo(() => {
    if (!yearFilter) return allRows;
    return allRows.filter((r) => String(r.year) === String(yearFilter));
  }, [allRows, yearFilter]);

  const disciplineCodes = useMemo(() => {
    const codes = new Set();
    allRows.forEach((row) => {
      Object.keys(row.disciplineCodeTotals || {}).forEach((c) => codes.add(c));
    });
    return [...codes].sort();
  }, [allRows]);

  const yearOptions = useMemo(() => allRows.map((r) => r.year), [allRows]);

  const summary = useMemo(() => {
    const totalHrs = filteredRows.reduce((s, r) => s + r.totalHours, 0);
    return {
      years: filteredRows.length,
      codes: disciplineCodes.length,
      totalHours: totalHrs.toFixed(2),
    };
  }, [filteredRows, disciplineCodes]);

  const columnDefs = useMemo(
    () => [
      { field: "year", headerName: "Year", minWidth: 90, pinned: "left" },
      {
        headerName: "Total",
        minWidth: 90,
        valueGetter: (p) => Number((p.data.totalHours || 0).toFixed(2)),
        cellStyle: { fontWeight: 700 },
      },
      ...disciplineCodes.map((code) => ({
        headerName: code,
        minWidth: 100,
        valueGetter: (params) => {
          const v = params.data.disciplineCodeTotals?.[code];
          return v != null ? Number(v.toFixed(2)) : 0;
        },
        cellStyle: (p) => (p.value > 0 ? { fontWeight: 600 } : null),
      })),
    ],
    [disciplineCodes]
  );

  const onExport = () => {
    if (exportApi) {
      exportApi.exportDataAsCsv({ fileName: "discipline-code-report.csv" });
      notify("Report exported successfully");
    } else notify("Please wait for the grid to load", "warning");
  };

  return (
    <Box sx={{ maxWidth: 1800, mx: "auto" }}>
      <ReportPageHeader
        icon={Category}
        title="Discipline Code Report"
        subtitle="Approved work hours grouped by year and discipline code."
        onRefresh={loadData}
        loading={loading}
        onExport={onExport}
        exportDisabled={!filteredRows.length}
      />

      <ReportFilterCard
        chips={
          yearFilter ? (
            <Chip label={`Year ${yearFilter}`} size="small" color="primary" onDelete={() => setYearFilter("")} />
          ) : (
            <Chip label="All years" size="small" variant="outlined" />
          )
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Year</InputLabel>
              <Select value={yearFilter} label="Year" onChange={(e) => setYearFilter(e.target.value)}>
                <MenuItem value="">All years</MenuItem>
                {yearOptions.map((y) => (
                  <MenuItem key={y} value={String(y)}>
                    {y}
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
          <StatCard icon={Assessment} label="Year rows" value={summary.years} accent="primary" />
          <StatCard icon={Category} label="Discipline codes" value={summary.codes} accent="info" />
          <StatCard icon={Schedule} label="Total hours" value={summary.totalHours} accent="warning" valueColor="warning.dark" />
        </ReportStatsGrid>
      )}

      <ReportGridCard icon={Category} title="Discipline code analysis" rowCount={filteredRows.length} loading={loading}>
        <div style={gridStyle} className="ag-theme-alpine">
          <AgGridReact
            rowData={filteredRows}
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

export default DesciplineCodeReport;
