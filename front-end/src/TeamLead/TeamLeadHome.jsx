import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
} from "@mui/material";
import {
  Folder,
  CheckCircle,
  Refresh,
  ExpandMore,
  ExpandLess,
  Assignment,
} from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import ClockInOutCard from "../components/ClockInOutCard";

function TeamLeadHome() {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [rowData, setRowData] = useState([]);
  const [projectWorkHours, setProjectWorkHours] = React.useState(null);
  const [workDetails, setWorkDetails] = useState([]);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [projectTimesheetData, setProjectTimesheetData] = useState({});
  const token = localStorage.getItem("token");

  const calculateProjectValues = (params, projectWorkHours) => {
    const project = projectWorkHours?.find(
      (items) => items.projectName === params.data.projectName
    );
    if (project) {
      const completionPercentage =
        (project.totalHours / params.data.allotatedHours) * 100;
      const remainingPercentage = 100 - completionPercentage;

      return {
        completionPercentage: completionPercentage.toFixed(2) + "%",
        utilizationPercentage: remainingPercentage.toFixed(2) + "%",
        consumedHours: project.totalHours,
      };
    }

    return {
      completionPercentage: "0%",
      utilizationPercentage: "0%",
      consumedHours: 0,
    };
  };

  React.useEffect(() => {
    onGetWorkDetails();
  }, []);

  React.useEffect(() => {
    // Group work details by project name for timesheet display
    const grouped = {};
    workDetails.forEach((work) => {
      const projectName = work.projectName;
      if (!grouped[projectName]) {
        grouped[projectName] = [];
      }
      grouped[projectName].push(work);
    });
    setProjectTimesheetData(grouped);
  }, [workDetails]);

  React.useEffect(() => {
    const projectData = workDetails.reduce((acc, entry) => {
      const projectName = entry.projectName;
      if (!acc[projectName]) {
        acc[projectName] = [];
      }
      acc[projectName].push(entry.totalHours);
      return acc;
    }, {});

    const projectTotalHours = Object.keys(projectData).map((projectName) => {
      const totalHours = projectData[projectName].reduce(
        (sum, hours) => sum + hours,
        0
      );
      return { projectName, totalHours };
    });
    setProjectWorkHours(projectTotalHours);
  }, [workDetails]);

  const columnDefs = useMemo(
    () => [
      {
        field: "projectName",
        minWidth: 170,
      },
      {
        field: "completion",
        minWidth: 170,
        editable: true,
      },
      {
        field: "Consumed Hours",
        minWidth: 170,
        valueGetter: (params) =>
          calculateProjectValues(params, projectWorkHours).consumedHours,
      },
      { field: "allotatedHours", headerName: "Allotted Hours", minWidth: 170 },
      { field: "referenceNo", minWidth: 170 },
      { field: "orderId", minWidth: 170 },
      { field: "positionNumber", minWidth: 170 },
      { field: "projectNo", minWidth: 170 },
      { field: "startDate", minWidth: 170 },
      { field: "subDivision", minWidth: 170 },
      { field: "subPositionNumber", minWidth: 170 },
      { field: "targetDate", minWidth: 170 },
      { field: "taskJobNo", minWidth: 170 },
      {
        field: "timesheetCount",
        headerName: "Timesheet Entries",
        minWidth: 150,
        cellRenderer: (params) => {
          const projectName = params.data.projectName;
          const timesheets = projectTimesheetData[projectName] || [];
          const totalHours = timesheets.reduce((sum, ts) => sum + (parseFloat(ts.totalHours) || 0), 0);
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Chip 
                label={`${timesheets.length} entries`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary">
                {totalHours.toFixed(2)} hrs total
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "viewTimesheets",
        headerName: "View Details",
        minWidth: 120,
        filter: false,
        sortable: false,
        cellRenderer: (params) => {
          const projectName = params.data.projectName;
          const timesheets = projectTimesheetData[projectName] || [];
          const isExpanded = expandedProjects[params.data.id];
          
          return (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title={isExpanded ? "Hide Timesheet Details" : "Show Timesheet Details"}>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => {
                    setExpandedProjects(prev => ({
                      ...prev,
                      [params.data.id]: !prev[params.data.id]
                    }));
                  }}
                  disabled={timesheets.length === 0}
                  sx={{
                    "&:hover": {
                      bgcolor: "primary.light",
                      color: "white",
                    },
                  }}
                >
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
      {
        headerName: "Action",
        pinned: "right",
        minWidth: 120,
        width: 120,
        field: "id",
        filter: false,
        editable: false,
        cellRenderer: (params) => (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Tooltip title="Update Completion">
              <IconButton
                size="small"
                color="success"
                onClick={() => updateProjectDetails(params)}
                sx={{
                  "&:hover": {
                    bgcolor: "success.light",
                    color: "white",
                  },
                }}
              >
                <CheckCircle fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [projectTimesheetData, expandedProjects]
  );

  const autoGroupColumnDef = useMemo(
    () => ({
      headerName: "Group",
      minWidth: 170,
      field: "athlete",
      valueGetter: (params) => {
        if (params.node.group) {
          return params.node.key;
        } else {
          return params.data[params.colDef.field];
        }
      },
      headerCheckboxSelection: false,
      cellRenderer: "agGroupCellRenderer",
      cellRendererParams: {
        checkbox: false,
      },
    }),
    []
  );

  const defaultColDef = useMemo(
    () => ({
      editable: false,
      enableRowGroup: false,
      enablePivot: false,
      enableValue: false,
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter: true,
      flex: 1,
      minWidth: 100,
    }),
    []
  );

  const onGridReady = useCallback((params) => {
    api
      .get("/getProject")
      .then(async (res) => {
        let userDetails = await api.post("/dashboard", {
          tokensss: token,
        });
        if (res.data.Status === "Success") {
          let filterData = res.data.Result.filter(
            (items) => items.tlName === userDetails.data.employeeName
          );
          setRowData(filterData);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  }, []);

  const onGetWorkDetails = (params) => {
    api
      .get("/getWorkDetails")
      .then((res) => {
        if (res.data.Status === "Success") {
          setWorkDetails(res.data.Result);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const updateProjectDetails = (params) => {
    let apiTemp = { ...params.data, approvedDate: new Date() };
    api
      .put(
        "/project/update/completion/" + params.data.id,
        apiTemp
      )
      .then(async (res) => {
        alert("Update Successfully");
        location.reload();
      });
  };

  const onSelectionChanged = (event) => {
    // Handle selection if needed
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Clock In/Out Card */}
      <ClockInOutCard />

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Allotted Project Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage projects assigned to your team
              {rowData.length > 0 && (
                <Chip 
                  label={`${rowData.length} Projects Involved`} 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={onGridReady}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Grid Card */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <Folder color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Projects
            </Typography>
          </Box>
          <Box sx={{ width: "100%", height: "600px" }}>
            <div style={gridStyle} className="ag-theme-alpine">
              <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                autoGroupColumnDef={autoGroupColumnDef}
                defaultColDef={defaultColDef}
                suppressRowClickSelection={true}
                groupSelectsChildren={true}
                rowSelection={"single"}
                rowGroupPanelShow={"always"}
                pivotPanelShow={"always"}
                pagination={true}
                paginationPageSize={20}
                onGridReady={onGridReady}
                onSelectionChanged={onSelectionChanged}
                getRowId={(params) => params.data.id}
              />
            </div>
          </Box>
        </CardContent>
      </Card>

      {/* Timesheet Details for Expanded Projects */}
      {rowData.map((project) => {
        if (!expandedProjects[project.id]) return null;
        const timesheets = projectTimesheetData[project.projectName] || [];
        
        return (
          <Card key={project.id} sx={{ mt: 2, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Assignment color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Timesheet Details - {project.projectName}
                </Typography>
                <Chip 
                  label={`${timesheets.length} entries`} 
                  size="small" 
                  color="primary"
                />
              </Box>
              {timesheets.length > 0 ? (
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Employee</strong></TableCell>
                        <TableCell><strong>Week</strong></TableCell>
                        <TableCell><strong>Reference No</strong></TableCell>
                        <TableCell><strong>Total Hours</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Sent Date</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {timesheets.map((ts, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>{ts.employeeName || "N/A"}</TableCell>
                          <TableCell>Week {ts.weekNumber || "N/A"}</TableCell>
                          <TableCell>{ts.referenceNo || "N/A"}</TableCell>
                          <TableCell>
                            <Chip 
                              label={ts.totalHours || "0"} 
                              size="small" 
                              color="info"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={ts.status || "pending"}
                              size="small"
                              color={
                                ts.status === "approved"
                                  ? "success"
                                  : ts.status === "rejected"
                                  ? "error"
                                  : "warning"
                              }
                              variant={ts.status === "approved" ? "filled" : "outlined"}
                            />
                          </TableCell>
                          <TableCell>
                            {ts.sentDate
                              ? new Date(ts.sentDate).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  No timesheet entries found for this project.
                </Typography>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}

export default TeamLeadHome;
