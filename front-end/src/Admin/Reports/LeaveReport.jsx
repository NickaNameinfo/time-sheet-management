import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Alert } from "@mui/material";
import { EventAvailable, People, Schedule } from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import api from "../../services/api";
import {
  ReportPageHeader,
  ReportGridCard,
  ReportStatsGrid,
  StatCard,
  useReportSnackbar,
  gridStyle,
  defaultReportColDef,
} from "../../components/reports/reportPageUi";

const LEAVE_TYPES = ["Casual Leave", "Sick Leave", "Earned Leave", "Comp-off", "LOP"];

function aggregateLeaveRows(raw) {
  const byEmployee = new Map();

  (raw || []).forEach((entry) => {
    const id = entry.employeeId ?? entry.EMPID ?? entry.empId;
    const name = entry.employeeName || "Unknown";
    const key = `${id}::${name}`;
    if (!byEmployee.has(key)) {
      byEmployee.set(key, {
        employeeName: name,
        employeeId: id,
        totalCount: 0,
      });
    }
    const row = byEmployee.get(key);
    const type = entry.leaveType || "Other";
    const hrs = parseInt(entry.leaveHours, 10) || 0;
    row[type] = (row[type] || 0) + hrs;
    row.totalCount += hrs;
  });

  return [...byEmployee.values()].sort((a, b) =>
    String(a.employeeName).localeCompare(String(b.employeeName))
  );
}

const LeaveReport = () => {
  const { notify, SnackbarAlert } = useReportSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportApi, setExportApi] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/getLeaveDetails");
      if (res.data?.Status === "Success") {
        setRows(aggregateLeaveRows(res.data.Result));
      } else {
        throw new Error(res.data?.Message || "Failed to load leave data");
      }
    } catch (e) {
      setError(e?.message || "Failed to load leave report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = useMemo(() => {
    const totalHours = rows.reduce((s, r) => s + (r.totalCount || 0), 0);
    const byType = {};
    LEAVE_TYPES.forEach((t) => {
      byType[t] = rows.reduce((s, r) => s + (r[t] || 0), 0);
    });
    return { employees: rows.length, totalHours, byType };
  }, [rows]);

  const columnDefs = useMemo(
    () => [
      { field: "employeeName", headerName: "Employee", minWidth: 160, pinned: "left" },
      { field: "employeeId", headerName: "ID", minWidth: 90 },
      ...LEAVE_TYPES.map((type) => ({
        field: type,
        headerName: type.replace(" Leave", ""),
        minWidth: 100,
        valueFormatter: (p) => (p.value ? Number(p.value) : 0),
      })),
      {
        field: "totalCount",
        headerName: "Total",
        minWidth: 90,
        cellStyle: { fontWeight: 700 },
      },
    ],
    []
  );

  const onExport = () => {
    if (exportApi) {
      exportApi.exportDataAsCsv({ fileName: "leave-report.csv" });
      notify("Report exported successfully");
    } else notify("Please wait for the grid to load", "warning");
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      <ReportPageHeader
        icon={EventAvailable}
        title="Leave Report"
        subtitle="Leave hours summarized by employee and leave type."
        onRefresh={loadData}
        loading={loading}
        onExport={onExport}
        exportDisabled={!rows.length}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && (
        <ReportStatsGrid>
          <StatCard icon={People} label="Employees" value={summary.employees} accent="primary" />
          <StatCard icon={Schedule} label="Total leave hrs" value={summary.totalHours} accent="warning" valueColor="warning.dark" />
          {LEAVE_TYPES.slice(0, 4).map((type, i) => (
            <StatCard
              key={type}
              label={type.replace(" Leave", "")}
              value={summary.byType[type] || 0}
              accent={["info", "success", "secondary", "#9C27B0"][i]}
            />
          ))}
        </ReportStatsGrid>
      )}

      <ReportGridCard icon={EventAvailable} title="Employee leave summary" rowCount={rows.length} loading={loading}>
        <div style={gridStyle} className="ag-theme-alpine">
          <AgGridReact
            rowData={rows}
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

export default LeaveReport;
