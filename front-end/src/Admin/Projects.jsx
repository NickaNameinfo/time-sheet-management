import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Tooltip,
  Paper,
  TextField,
  InputAdornment,
  Stack,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  Business,
  CalendarToday,
  AccessTime,
  ExpandMore,
  ExpandLess,
  Assignment,
  CheckCircle,
  Warning,
  Error,
  Schedule,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

function Projects(props) {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [rowData, setRowData] = useState([]);
  const [roles, setRoles] = React.useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [gridApi, setGridApi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [workDetails, setWorkDetails] = useState([]);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [projectTimesheetData, setProjectTimesheetData] = useState({});
  const projectDetailRefs = useRef({});

  React.useEffect(() => {
    api
      .post("/dashboard", { tokensss: token })
      .then((res) => {
        if (res.data.Status === "Success") {
          setRoles(res.data.role?.split(","));
        }
      });
  }, []);

  const onClickEdit = (id) => {
    navigate(`/Dashboard/addProject/${id}`);
  };

  // Helper function to calculate project status
  const calculateProjectStatus = useCallback((project, timesheets) => {
    const allottedHours = parseFloat(project.allotatedHours) || 0;
    
    // Filter timesheets by project date range (startDate to targetDate)
    const projectStartDate = project.startDate ? new Date(project.startDate) : null;
    const projectTargetDate = project.targetDate ? new Date(project.targetDate) : null;
    
    const filteredTimesheets = timesheets.filter((ts) => {
      if (!ts.sentDate) return false;
      
      const sentDate = new Date(ts.sentDate);
      sentDate.setHours(0, 0, 0, 0);
      
      // Check if sentDate is within project date range
      let withinStartDate = true;
      let withinEndDate = true;
      
      if (projectStartDate) {
        const start = new Date(projectStartDate);
        start.setHours(0, 0, 0, 0);
        withinStartDate = sentDate >= start;
      }
      
      if (projectTargetDate) {
        const target = new Date(projectTargetDate);
        target.setHours(23, 59, 59, 999); // Include the entire target date
        withinEndDate = sentDate <= target;
      }
      
      return withinStartDate && withinEndDate;
    });
    
    // Calculate total hours only from filtered timesheets
    const totalHours = filteredTimesheets.reduce((sum, ts) => sum + (parseFloat(ts.totalHours) || 0), 0);
    
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    let isOverdue = false;
    if (projectTargetDate) {
      const target = new Date(projectTargetDate);
      target.setHours(0, 0, 0, 0);
      isOverdue = target < currentDate;
    }
    
    const hoursOverBudget = totalHours > allottedHours;
    const hoursRemaining = allottedHours - totalHours;
    const percentageUsed = allottedHours > 0 ? (totalHours / allottedHours) * 100 : 0;
    
    let status = "On Track";
    let statusColor = "success";
    let statusIcon = <CheckCircle />;
    
    if (hoursOverBudget && isOverdue) {
      status = "Overdue & Over Budget";
      statusColor = "error";
      statusIcon = <Error />;
    } else if (hoursOverBudget) {
      status = "Over Budget";
      statusColor = "warning";
      statusIcon = <Warning />;
    } else if (isOverdue) {
      status = "Overdue";
      statusColor = "error";
      statusIcon = <Error />;
    } else if (percentageUsed >= 100) {
      status = "Completed";
      statusColor = "success";
      statusIcon = <CheckCircle />;
    } else if (percentageUsed >= 90) {
      status = "Near Completion";
      statusColor = "info";
      statusIcon = <Schedule />;
    }
    
    let daysOverdue = 0;
    if (isOverdue && projectTargetDate) {
      const target = new Date(projectTargetDate);
      target.setHours(0, 0, 0, 0);
      daysOverdue = Math.ceil((currentDate - target) / (1000 * 60 * 60 * 24));
    }
    
    return {
      status,
      statusColor,
      statusIcon,
      totalHours,
      allottedHours,
      hoursOverBudget,
      hoursRemaining,
      percentageUsed,
      isOverdue,
      daysOverdue,
    };
  }, []);

  const columnDefs = useMemo(
    () => [
      {
        field: "projectName",
        headerName: "Project Name",
        minWidth: 200,
        checkboxSelection: roles?.[0] === "Admin",
        cellRenderer: (params) => {
          const projectName = params.data.projectName;
          const timesheets = projectTimesheetData[projectName] || [];
          const isExpanded = expandedProjects[params.data.id];
          
          const handleExpandClick = (e) => {
            e.stopPropagation();
            const projectId = params.data.id;
            const willExpand = !expandedProjects[projectId];
            
            setExpandedProjects(prev => ({
              ...prev,
              [projectId]: !prev[projectId]
            }));
            
            // Scroll to project details after state update
            if (willExpand) {
              setTimeout(() => {
                const detailElement = projectDetailRefs.current[projectId];
                if (detailElement) {
                  detailElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start',
                    inline: 'nearest'
                  });
                }
              }, 100); // Small delay to ensure DOM is updated
            }
          };

          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }} onClick={handleExpandClick}>
              <Business color="primary" sx={{ fontSize: 20 }} />
              <Typography variant="body2" fontWeight="medium">
                {params.value || "N/A"}
              </Typography>
              <Tooltip title={isExpanded ? "Hide Timesheet Details" : "Show Timesheet Details"}>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={handleExpandClick}
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
        field: "tlName",
        headerName: "TL Name",
        minWidth: 150,
      },

      {
        field: "hoursUsed",
        headerName: "Hours Used / Remaining",
        minWidth: 250,
        cellRenderer: (params) => {
          const projectName = params.data.projectName;
          const allTimesheets = projectTimesheetData[projectName] || [];
          const statusInfo = calculateProjectStatus(params.data, allTimesheets);
          
          // Count filtered entries (within date range)
          const projectStartDate = params.data.startDate ? new Date(params.data.startDate) : null;
          const projectTargetDate = params.data.targetDate ? new Date(params.data.targetDate) : null;
          const filteredCount = allTimesheets.filter((ts) => {
            if (!ts.sentDate) return false;
            const sentDate = new Date(ts.sentDate);
            sentDate.setHours(0, 0, 0, 0);
            let withinStartDate = true;
            let withinEndDate = true;
            if (projectStartDate) {
              const start = new Date(projectStartDate);
              start.setHours(0, 0, 0, 0);
              withinStartDate = sentDate >= start;
            }
            if (projectTargetDate) {
              const target = new Date(projectTargetDate);
              target.setHours(23, 59, 59, 999);
              withinEndDate = sentDate <= target;
            }
            return withinStartDate && withinEndDate;
          }).length;
          
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography 
                  variant="body2" 
                  fontWeight="bold"
                  color={statusInfo.hoursOverBudget ? "error.main" : "text.primary"}
                >
                  {statusInfo.totalHours.toFixed(2)} / {statusInfo.allottedHours.toFixed(2)} hrs
                </Typography>
                {statusInfo.hoursOverBudget && (
                  <Chip
                    label={`+${(statusInfo.totalHours - statusInfo.allottedHours).toFixed(2)} hrs`}
                    size="small"
                    color="error"
                    sx={{ height: 20, fontSize: "0.65rem" }}
                  />
                )}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box
                  sx={{
                    width: "100%",
                    height: 6,
                    bgcolor: "grey.200",
                    borderRadius: 1,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width: `${Math.min(statusInfo.percentageUsed, 100)}%`,
                      height: "100%",
                      bgcolor: statusInfo.hoursOverBudget 
                        ? "error.main" 
                        : statusInfo.percentageUsed >= 90 
                        ? "warning.main" 
                        : "success.main",
                      transition: "width 0.3s ease",
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
                  {statusInfo.percentageUsed.toFixed(1)}%
                </Typography>
              </Box>
              {statusInfo.hoursRemaining > 0 && !statusInfo.hoursOverBudget && (
                <Typography variant="caption" color="success.main">
                  {statusInfo.hoursRemaining.toFixed(2)} hrs remaining
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {filteredCount} of {allTimesheets.length} entries in date range
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "status",
        headerName: "Project Status",
        minWidth: 140,
        cellRenderer: (params) => {
          const status = params.value || 'active';
          const statusConfig = {
            active: { label: "Active", color: "success", icon: <CheckCircle /> },
            on_hold: { label: "On Hold", color: "warning", icon: <Warning /> },
            completed: { label: "Completed", color: "info", icon: <CheckCircle /> },
            cancelled: { label: "Cancelled", color: "error", icon: <Error /> },
          };
          const config = statusConfig[status] || statusConfig.active;
          
          return (
            <Chip
              icon={config.icon}
              label={config.label}
              color={config.color}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          );
        },
      },
      {
        field: "projectProgressStatus",
        headerName: "Progress Status",
        minWidth: 180,
        cellRenderer: (params) => {
          const projectName = params.data.projectName;
          const timesheets = projectTimesheetData[projectName] || [];
          const statusInfo = calculateProjectStatus(params.data, timesheets);
          
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Chip
                icon={statusInfo.statusIcon}
                label={statusInfo.status}
                color={statusInfo.statusColor}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              {statusInfo.isOverdue && (
                <Typography variant="caption" color="error.main" sx={{ mt: 0.5 }}>
                  {statusInfo.daysOverdue} day{statusInfo.daysOverdue !== 1 ? 's' : ''} overdue
                </Typography>
              )}
              {statusInfo.hoursOverBudget && (
                <Typography variant="caption" color="error.main" sx={{ mt: 0.5 }}>
                  {(statusInfo.totalHours - statusInfo.allottedHours).toFixed(2)} hrs over budget
                </Typography>
              )}
            </Box>
          );
        },
      },
      {
        field: "timesheetCount",
        headerName: "Timesheet Entries",
        minWidth: 150,
        cellRenderer: (params) => {
          const projectName = params.data.projectName;
          const timesheets = projectTimesheetData[projectName] || [];
          
          // Count entries within project date range
          const projectStartDate = params.data.startDate ? new Date(params.data.startDate) : null;
          const projectTargetDate = params.data.targetDate ? new Date(params.data.targetDate) : null;
          const filteredCount = timesheets.filter((ts) => {
            if (!ts.sentDate) return false;
            const sentDate = new Date(ts.sentDate);
            sentDate.setHours(0, 0, 0, 0);
            let withinStartDate = true;
            let withinEndDate = true;
            if (projectStartDate) {
              const start = new Date(projectStartDate);
              start.setHours(0, 0, 0, 0);
              withinStartDate = sentDate >= start;
            }
            if (projectTargetDate) {
              const target = new Date(projectTargetDate);
              target.setHours(23, 59, 59, 999);
              withinEndDate = sentDate <= target;
            }
            return withinStartDate && withinEndDate;
          }).length;
          
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Chip 
                label={`${filteredCount} / ${timesheets.length} entries`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary">
                In date range
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "projectNo",
        headerName: "Project No",
        minWidth: 120,
      },
      {
        field: "desciplineCode",
        headerName: "Discipline Code",
        minWidth: 150,
        cellRenderer: (params) => (
          <Chip label={params.value || "N/A"} size="small" variant="outlined" />
        ),
      },
      {
        field: "startDate",
        headerName: "Start Date",
        minWidth: 130,
        cellRenderer: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <CalendarToday sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="body2">
              {params.value ? new Date(params.value).toLocaleDateString() : "N/A"}
            </Typography>
          </Box>
        ),
      },
      {
        field: "targetDate",
        headerName: "Target Date",
        minWidth: 130,
        cellRenderer: (params) => (
          <Typography variant="body2">
            {params.value ? new Date(params.value).toLocaleDateString() : "N/A"}
          </Typography>
        ),
      },
      {
        field: "allotatedHours",
        headerName: "Allotted Hours",
        minWidth: 140,
        cellRenderer: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <AccessTime sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="body2">{params.value || "N/A"}</Typography>
          </Box>
        ),
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
          
          const handleExpandClick = (e) => {
            e.stopPropagation();
            const projectId = params.data.id;
            const willExpand = !expandedProjects[projectId];
            
            setExpandedProjects(prev => ({
              ...prev,
              [projectId]: !prev[projectId]
            }));
            
            // Scroll to project details after state update
            if (willExpand) {
              setTimeout(() => {
                const detailElement = projectDetailRefs.current[projectId];
                if (detailElement) {
                  detailElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start',
                    inline: 'nearest'
                  });
                }
              }, 100); // Small delay to ensure DOM is updated
            }
          };

          const handleEditClick = (e) => {
            e.stopPropagation();
            onClickEdit(params.data.id);
          };
          
          return (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Edit Project">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={handleEditClick}
                  sx={{
                    "&:hover": {
                      bgcolor: "primary.light",
                      color: "white",
                    },
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [roles, projectTimesheetData, expandedProjects, calculateProjectStatus]
  );

  const defaultColDef = useMemo(
    () => ({
      editable: false,
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
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
    fetchProjectData();
  }, []);

  const fetchProjectData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get("/getProject"),
      api.get("/getWorkDetails")
    ])
      .then(([projectsRes, workDetailsRes]) => {
        if (projectsRes.data.Status === "Success") {
          setRowData(projectsRes.data.Result);
        } else {
          alert("Error loading projects data");
        }
        
        if (workDetailsRes.data.Status === "Success") {
          setWorkDetails(workDetailsRes.data.Result || []);
          
          // Group work details by project name
          const grouped = {};
          (workDetailsRes.data.Result || []).forEach((work) => {
            const projectName = work.projectName;
            if (!grouped[projectName]) {
              grouped[projectName] = [];
            }
            grouped[projectName].push(work);
          });
          setProjectTimesheetData(grouped);
        }
      })
      .catch((err) => {
        console.log(err);
        alert("Error loading data");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (gridApi) {
        if (searchText) {
          gridApi.setQuickFilter(searchText);
        } else {
          gridApi.setQuickFilter("");
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText, gridApi]);

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (projectToDelete) {
      api
        .delete("/project/delete/" + projectToDelete.id)
        .then((res) => {
          if (res.data.Status === "Success") {
            setDeleteDialogOpen(false);
            setProjectToDelete(null);
            setSelectedRows([]);
            fetchProjectData();
          } else {
            alert("Error deleting project");
          }
        })
        .catch((err) => {
          console.log(err);
          alert("Error deleting project");
        });
    }
  };

  const onSelectionChanged = useCallback((event) => {
    const selectedItems = event.api.getSelectedRows();
    setSelectedRows(selectedItems);
  }, []);

  const handleBulkDelete = () => {
    if (selectedRows.length > 0) {
      setProjectToDelete(selectedRows[0]);
      setDeleteDialogOpen(true);
    }
  };

  return (
    <Box>
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
                Project Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and view all projects in your organization
                {rowData.length > 0 && (
                  <Chip 
                    label={`${rowData.length} Total Projects`} 
                    size="small" 
                    color="primary" 
                    sx={{ ml: 2 }}
                  />
                )}
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchProjectData}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate("/Dashboard/addProject")}
                sx={{
                  background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
                  },
                }}
              >
                Add Project
              </Button>
            </Stack>
          </Box>

          {/* Search and Actions Bar */}
          <Paper
            elevation={1}
            sx={{
              p: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <TextField
              placeholder="Search projects..."
              variant="outlined"
              size="small"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, minWidth: 250 }}
            />
            {selectedRows.length > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label={`${selectedRows.length} selected`}
                  color="primary"
                  size="small"
                />
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={handleBulkDelete}
                  size="small"
                >
                  Delete Selected
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      {/* AG Grid */}
      <Card
        sx={{
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ height: "600px", width: "100%" }} className="ag-theme-alpine">
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              suppressRowClickSelection={true}
              rowSelection={roles?.[0] === "Admin" ? "multiple" : false}
              pagination={true}
              paginationPageSize={20}
              onGridReady={onGridReady}
              onSelectionChanged={onSelectionChanged}
              animateRows={true}
              rowHeight={80}
              headerHeight={50}
              enableRangeSelection={true}
              suppressCellFocus={true}
              loading={loading}
              getRowId={(params) => params.data.id}
              masterDetail={false}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Timesheet Details for Expanded Projects */}
      {rowData.map((project) => {
        const isExpanded = expandedProjects[project.id];
        const allTimesheets = projectTimesheetData[project.projectName] || [];
        
        // Filter timesheets by project date range
        const projectStartDate = project.startDate ? new Date(project.startDate) : null;
        const projectTargetDate = project.targetDate ? new Date(project.targetDate) : null;
        const timesheets = allTimesheets.filter((ts) => {
          if (!ts.sentDate) return false;
          const sentDate = new Date(ts.sentDate);
          sentDate.setHours(0, 0, 0, 0);
          let withinStartDate = true;
          let withinEndDate = true;
          if (projectStartDate) {
            const start = new Date(projectStartDate);
            start.setHours(0, 0, 0, 0);
            withinStartDate = sentDate >= start;
          }
          if (projectTargetDate) {
            const target = new Date(projectTargetDate);
            target.setHours(23, 59, 59, 999);
            withinEndDate = sentDate <= target;
          }
          return withinStartDate && withinEndDate;
        });
        
        const statusInfo = calculateProjectStatus(project, allTimesheets);
        
        return (
          <Collapse 
            key={project.id} 
            in={isExpanded} 
            timeout="auto" 
            unmountOnExit
          >
            <Box
              ref={(el) => {
                if (el) {
                  projectDetailRefs.current[project.id] = el;
                } else {
                  delete projectDetailRefs.current[project.id];
                }
              }}
            >
              <Card sx={{ mt: 2, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Assignment color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                      Timesheet Details - {project.projectName}
                    </Typography>
                    <Chip 
                      label={`${timesheets.length} entries (in date range)`} 
                      size="small" 
                      color="primary"
                    />
                    {allTimesheets.length > timesheets.length && (
                      <Chip 
                        label={`${allTimesheets.length - timesheets.length} outside range`} 
                        size="small" 
                        color="default"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {statusInfo.isOverdue && (
                      <Chip
                        icon={<Error />}
                        label={`${statusInfo.daysOverdue} day${statusInfo.daysOverdue !== 1 ? 's' : ''} overdue`}
                        color="error"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                    {statusInfo.hoursOverBudget && (
                      <Chip
                        icon={<Warning />}
                        label={`${(statusInfo.totalHours - statusInfo.allottedHours).toFixed(2)} hrs over budget`}
                        color="warning"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                    <Chip
                      icon={statusInfo.statusIcon}
                      label={statusInfo.status}
                      color={statusInfo.statusColor}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Box>
                
                {/* Project Summary */}
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    bgcolor: statusInfo.isOverdue || statusInfo.hoursOverBudget 
                      ? "error.light" 
                      : statusInfo.percentageUsed >= 90 
                      ? "warning.light" 
                      : "success.light",
                    borderRadius: 2,
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Allotted Hours
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {statusInfo.allottedHours.toFixed(2)} hrs
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Hours Used
                      </Typography>
                      <Typography 
                        variant="h6" 
                        fontWeight="bold"
                        color={statusInfo.hoursOverBudget ? "error.main" : "text.primary"}
                      >
                        {statusInfo.totalHours.toFixed(2)} hrs
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        {statusInfo.hoursOverBudget ? "Over Budget" : "Remaining"}
                      </Typography>
                      <Typography 
                        variant="h6" 
                        fontWeight="bold"
                        color={statusInfo.hoursOverBudget ? "error.main" : "success.main"}
                      >
                        {statusInfo.hoursOverBudget 
                          ? `+${(statusInfo.totalHours - statusInfo.allottedHours).toFixed(2)} hrs`
                          : `${statusInfo.hoursRemaining.toFixed(2)} hrs`}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Completion
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {statusInfo.percentageUsed.toFixed(1)}%
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
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
          </Box>
          </Collapse>
        );
      })}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Delete color="error" />
            <Typography variant="h6">Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete project{" "}
            <strong>{projectToDelete?.projectName}</strong> (Project No: {projectToDelete?.projectNo})?
            <br />
            <br />
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            startIcon={<Delete />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Projects;
