import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  Stack,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  People,
  CalendarToday,
  AccessTime,
  Assignment,
  CheckCircle,
  Schedule,
  List,
} from "@mui/icons-material";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { apiService } from "../services/api";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import dayjs from "dayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const TIME_PERIODS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "3_months", label: "3 Months" },
  { value: "6_months", label: "6 Months" },
  { value: "9_months", label: "9 Months" },
  { value: "yearly", label: "Yearly" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", color: "default" },
  { value: "active", label: "Active", color: "primary" },
  { value: "completed", label: "Completed", color: "success" },
  { value: "cancelled", label: "Cancelled", color: "error" },
];

function ProjectPlanning() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    plan_name: "",
    project_id: "",
    time_period: "monthly",
    start_date: dayjs(),
    total_allotted_hours: "",
    description: "",
    status: "draft",
  });
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeHours, setEmployeeHours] = useState({});
  const [gridApi, setGridApi] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [addEmployeeDialogOpen, setAddEmployeeDialogOpen] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  /** Rows from GET /project-plan/:id — includes assignees not on the project's roster (assignedEmployees JSON). */
  const [planEmployeesSnapshot, setPlanEmployeesSnapshot] = useState([]);
  const [allEmployeesLoading, setAllEmployeesLoading] = useState(false);
  const [employeeSearchText, setEmployeeSearchText] = useState("");
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logDetails, setLogDetails] = useState({ utilized_hours: 0, progress_percent: 0, log_details: [] });
  const [logDetailsLoading, setLogDetailsLoading] = useState(false);
  const [selectedPlanForLog, setSelectedPlanForLog] = useState(null);
  const [logPage, setLogPage] = useState(0);
  const [logRowsPerPage, setLogRowsPerPage] = useState(25);
  const [filterEmployeeId, setFilterEmployeeId] = useState("");
  const [filterPlanId, setFilterPlanId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Fetch data
  const { data: projects, loading: projectsLoading } = useApi(
    () => apiService.getProjects(),
    []
  );
  const { data: plans, loading: plansLoading, refetch: refetchPlans } = useApi(
    () => {
      const params = {};
      if (filterEmployeeId) params.employee_id = filterEmployeeId;
      if (filterPlanId) params.plan_id = filterPlanId;
      if (filterStatus) params.status = filterStatus;
      return apiService.getProjectPlans(params);
    },
    [filterEmployeeId, filterPlanId, filterStatus]
  );
  const { data: allPlansForFilter } = useApi(
    () => apiService.getProjectPlans(),
    []
  );
  const { data: filterEmployees } = useApi(
    () => apiService.getEmployees(),
    []
  );
  const { data: projectEmployees, loading: employeesLoading } = useApi(
    () => {
      if (formData.project_id) {
        return apiService.getProjectEmployees(formData.project_id);
      }
      return Promise.resolve({ data: [] });
    },
    [formData.project_id]
  );

  // Process projects data - MUST be defined before useEffect that uses it
  const projectsList = useMemo(() => {
    if (!projects) return [];
    const data = Array.isArray(projects) ? projects : projects?.Result || [];
    return data;
  }, [projects]);

  // Process plans data - MUST be defined before useMemo that uses it
  const plansList = useMemo(() => {
    if (!plans) return [];
    const data = Array.isArray(plans) ? plans : plans?.Result || plans?.data || [];
    return data;
  }, [plans]);

  const allPlansList = useMemo(() => {
    if (!allPlansForFilter) return [];
    const data = Array.isArray(allPlansForFilter) ? allPlansForFilter : allPlansForFilter?.Result || allPlansForFilter?.data || [];
    return data;
  }, [allPlansForFilter]);

  const employeesForFilter = useMemo(() => {
    if (!filterEmployees) return [];
    return Array.isArray(filterEmployees) ? filterEmployees : filterEmployees?.Result || filterEmployees?.data || [];
  }, [filterEmployees]);

  // Fetch selected project details
  useEffect(() => {
    if (formData.project_id && projectsList.length > 0) {
      const project = projectsList.find((p) => p.id === parseInt(formData.project_id));
      if (project) {
        setSelectedProject(project);
      }
    } else {
      setSelectedProject(null);
    }
  }, [formData.project_id, projectsList]);

  // Calculate remaining hours for selected project
  const remainingHours = useMemo(() => {
    if (!selectedProject) return 0;
    
    const projectAllottedHours = parseFloat(selectedProject.allotatedHours) || 0;
    
    // Sum up all plan hours for this project
    const totalPlanHours = plansList
      .filter((plan) => plan.project_id === selectedProject.id && plan.id !== selectedPlan?.id)
      .reduce((sum, plan) => sum + (parseFloat(plan.total_allotted_hours) || 0), 0);
    
    // If editing, subtract the current plan's hours (will be replaced)
    const currentPlanHours = selectedPlan 
      ? parseFloat(selectedPlan.total_allotted_hours) || 0 
      : 0;
    
    const usedHours = totalPlanHours - currentPlanHours;
    const remaining = projectAllottedHours - usedHours;
    
    return Math.max(0, remaining);
  }, [selectedProject, plansList, selectedPlan]);

  // Calculate end date based on time period and project target date
  const calculatedEndDate = useMemo(() => {
    if (!formData.start_date) return null;
    
    const start = dayjs(formData.start_date);
    let end = start;
    
    // Calculate based on time period
    switch (formData.time_period) {
      case 'weekly':
        end = start.add(7, 'days');
        break;
      case 'monthly':
        end = start.add(1, 'month');
        break;
      case '3_months':
        end = start.add(3, 'months');
        break;
      case '6_months':
        end = start.add(6, 'months');
        break;
      case '9_months':
        end = start.add(9, 'months');
        break;
      case 'yearly':
        end = start.add(1, 'year');
        break;
      default:
        end = start.add(1, 'month');
    }
    
    // If project has target date, don't exceed it
    if (selectedProject?.targetDate) {
      const projectTargetDate = dayjs(selectedProject.targetDate);
      if (end.isAfter(projectTargetDate)) {
        end = projectTargetDate;
      }
    }
    
    return end;
  }, [formData.start_date, formData.time_period, selectedProject]);

  const { mutate: createPlan, loading: creating } = useMutation(apiService.createProjectPlan);
  const { mutate: updatePlan, loading: updating } = useMutation((data) =>
    apiService.updateProjectPlan(selectedPlan?.id, data)
  );
  const { mutate: assignEmployees, loading: assigning } = useMutation((data) =>
    apiService.assignEmployeesToPlan(selectedPlan?.id, data)
  );
  const { mutate: deletePlan, loading: deleting } = useMutation(apiService.deleteProjectPlan);

  // Project roster + plan API snapshot + allEmployees (snapshot fills gaps before "Add Employee" loads full list)
  const employeesList = useMemo(() => {
    const projectEmpData = projectEmployees
      ? Array.isArray(projectEmployees)
        ? projectEmployees
        : projectEmployees?.Result || projectEmployees?.data || []
      : [];

    const snapshot = Array.isArray(planEmployeesSnapshot) ? planEmployeesSnapshot : [];

    const map = new Map();
    const addToMap = (emp) => {
      if (!emp) return;
      const pk = emp.employee_id ?? emp.id;
      if (pk == null && pk !== 0) return;
      const key = String(pk);
      if (map.has(key)) return;
      map.set(key, {
        ...emp,
        id: pk,
        employee_id: pk,
      });
    };

    projectEmpData.forEach(addToMap);
    snapshot.forEach(addToMap);

    const projectEmployeeIds = projectEmpData
      .map((emp) => {
        const id = emp.id ?? emp.employee_id ?? emp.EMPID;
        return id != null ? String(id) : null;
      })
      .filter(Boolean);

    const stillMissingIds = selectedEmployees
      .map((id) => String(id))
      .filter((id) => !projectEmployeeIds.includes(id) && !map.has(id));

    const manuallyAddedEmployees = allEmployees.filter((emp) => {
      const empId = emp.id ?? emp.EMPID;
      return empId != null && stillMissingIds.includes(String(empId));
    });
    manuallyAddedEmployees.forEach(addToMap);

    const ordered = [];
    const seen = new Set();
    const pushKey = (key) => {
      if (key == null || seen.has(key)) return;
      const row = map.get(key);
      if (row) {
        seen.add(key);
        ordered.push(row);
      }
    };

    projectEmpData.forEach((emp) => {
      const pk = emp.id ?? emp.employee_id;
      if (pk != null) pushKey(String(pk));
    });
    snapshot.forEach((emp) => {
      const pk = emp.employee_id ?? emp.id;
      if (pk != null) pushKey(String(pk));
    });
    manuallyAddedEmployees.forEach((emp) => {
      const pk = emp.id ?? emp.EMPID;
      if (pk != null) pushKey(String(pk));
    });

    return ordered;
  }, [projectEmployees, selectedEmployees, allEmployees, planEmployeesSnapshot]);
  
  // Fetch all employees for adding
  const fetchAllEmployees = async () => {
    setAllEmployeesLoading(true);
    try {
      const response = await apiService.getEmployees();
      const data = Array.isArray(response.data) 
        ? response.data 
        : response.data?.Result || response.data?.data || [];
      setAllEmployees(data);
    } catch (error) {
      console.error("Error fetching all employees:", error);
    } finally {
      setAllEmployeesLoading(false);
    }
  };
  
  const handleOpenAddEmployeeDialog = async () => {
    await fetchAllEmployees();
    setAddEmployeeDialogOpen(true);
  };
  
  const handleAddEmployees = (employeeIds) => {
    const newEmployeeIds = employeeIds.filter(id => !selectedEmployees.includes(id));
    setSelectedEmployees(prev => [...prev, ...newEmployeeIds]);
    
    // Initialize hours for new employees
    const newHours = { ...employeeHours };
    newEmployeeIds.forEach(id => {
      if (!newHours[id]) {
        newHours[id] = 0;
      }
    });
    setEmployeeHours(newHours);
    setAddEmployeeDialogOpen(false);
  };
  
  const handleRemoveEmployee = (employeeId) => {
    setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    setEmployeeHours(prev => {
      const newHours = { ...prev };
      delete newHours[employeeId];
      return newHours;
    });
  };

  const handleOpenDialog = async (plan = null) => {
    if (plan) {
      setSelectedPlan(plan);
      setFormData({
        plan_name: plan.plan_name || "",
        project_id: plan.project_id || "",
        time_period: plan.time_period || "monthly",
        start_date: plan.start_date ? dayjs(plan.start_date) : dayjs(),
        total_allotted_hours: plan.total_allotted_hours || "",
        description: plan.description || "",
        status: plan.status || "draft",
      });
      
      // Fetch plan details with employees (full rows — needed for assignees not on project roster)
      try {
        const res = await apiService.getProjectPlan(plan.id);
        const planData = res.data?.Result || res.data?.data || res.data;
        const list = Array.isArray(planData.employees) ? planData.employees : [];
        setSelectedEmployees(list.map((e) => e.employee_id));
        const hours = {};
        list.forEach((e) => {
          hours[e.employee_id] = e.allotted_hours || 0;
        });
        setEmployeeHours(hours);
        setPlanEmployeesSnapshot(
          list.map((e) => ({
            ...e,
            id: e.employee_id,
          }))
        );
      } catch (error) {
        console.error("Error fetching plan employees:", error);
        setPlanEmployeesSnapshot([]);
      }
    } else {
      setSelectedPlan(null);
      setFormData({
        plan_name: "",
        project_id: "",
        time_period: "monthly",
        start_date: dayjs(),
        total_allotted_hours: "",
        description: "",
        status: "draft",
      });
      setSelectedEmployees([]);
      setEmployeeHours({});
      setPlanEmployeesSnapshot([]);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPlan(null);
    setFormData({
      plan_name: "",
      project_id: "",
      time_period: "monthly",
      start_date: dayjs(),
      total_allotted_hours: "",
      description: "",
      status: "draft",
    });
    setSelectedEmployees([]);
    setEmployeeHours({});
    setPlanEmployeesSnapshot([]);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        start_date: formData.start_date.format("YYYY-MM-DD"),
        total_allotted_hours: parseFloat(formData.total_allotted_hours),
      };

      if (selectedPlan) {
        // Update plan
        await updatePlan(data);
        // Update employees separately
        if (selectedEmployees.length > 0 || Object.keys(employeeHours).length > 0) {
          await assignEmployees({
            employee_ids: selectedEmployees,
            employee_hours: employeeHours,
          });
        }
      } else {
        // Create new plan with employees
        await createPlan({
          ...data,
          employee_ids: selectedEmployees,
          employee_hours: employeeHours,
        });
      }
      refetchPlans();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving plan:", error);
    }
  };

  const handleDelete = async (planId) => {
    if (window.confirm("Are you sure you want to delete this plan?")) {
      try {
        await deletePlan(planId);
        refetchPlans();
      } catch (error) {
        console.error("Error deleting plan:", error);
      }
    }
  };

  const handleOpenEmployeeDialog = (plan) => {
    setSelectedPlan(plan);
    const emps = Array.isArray(plan.employees) ? plan.employees : [];
    setSelectedEmployees(emps.map((e) => e.employee_id));
    const hours = {};
    emps.forEach((e) => {
      hours[e.employee_id] = e.allotted_hours || 0;
    });
    setEmployeeHours(hours);
    setPlanEmployeesSnapshot(
      emps.map((e) => ({
        ...e,
        id: e.employee_id,
      }))
    );
    // Update formData to fetch employees for this project
    if (plan.project_id) {
      setFormData(prev => ({ ...prev, project_id: plan.project_id }));
    }
    setEmployeeDialogOpen(true);
  };

  const handleAssignEmployees = async () => {
    try {
      await assignEmployees({
        employee_ids: selectedEmployees,
        employee_hours: employeeHours,
      });
      refetchPlans();
      setEmployeeDialogOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error("Error assigning employees:", error);
    }
  };

  const handleEmployeeToggle = (employeeId) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleEmployeeHoursChange = (employeeId, hours) => {
    setEmployeeHours((prev) => ({
      ...prev,
      [employeeId]: parseFloat(hours) || 0,
    }));
  };

  const handleOpenLogDetails = async (plan) => {
    setSelectedPlanForLog(plan);
    setLogDialogOpen(true);
    setLogDetailsLoading(true);
    setLogPage(0);
    try {
      const res = await apiService.getPlanUtilization(plan.id);
      const data = res.data?.Result || res.data || {};
      setLogDetails({
        utilized_hours: data.utilized_hours ?? 0,
        progress_percent: data.progress_percent ?? 0,
        total_allotted_hours: data.total_allotted_hours ?? plan.total_allotted_hours ?? 0,
        log_details: data.log_details || [],
      });
    } catch (err) {
      console.error("Error fetching plan utilization:", err);
      setLogDetails({ utilized_hours: 0, progress_percent: 0, log_details: [] });
    } finally {
      setLogDetailsLoading(false);
    }
  };

  const filteredLogDetails = useMemo(() => {
    const rows = Array.isArray(logDetails?.log_details) ? logDetails.log_details : [];
    const plan = selectedPlanForLog;
    if (!plan) return rows;

    const normalize = (v) => String(v || "").trim().toLowerCase();
    const planProjectId = plan.project_id ?? plan.projectId ?? null;
    const planProjectName = normalize(plan.projectName || plan.project_name);
    const planRefNo = normalize(plan.referenceNo || plan.reference_no);

    return rows.filter((row) => {
      const rowProjectId = row.project_id ?? row.projectId ?? null;
      if (planProjectId != null && rowProjectId != null && String(planProjectId) === String(rowProjectId)) {
        return true;
      }

      const rowProjectName = normalize(row.projectName || row.project_name);
      if (planProjectName && rowProjectName && planProjectName === rowProjectName) return true;

      const rowRefNo = normalize(row.referenceNo || row.reference_no);
      if (planRefNo && rowRefNo && planRefNo === rowRefNo) return true;

      return false;
    });
  }, [logDetails?.log_details, selectedPlanForLog]);

  const pagedLogDetails = useMemo(() => {
    return filteredLogDetails.slice(
      logPage * logRowsPerPage,
      logPage * logRowsPerPage + logRowsPerPage
    );
  }, [filteredLogDetails, logPage, logRowsPerPage]);

  const columnDefs = [
    {
      field: "plan_name",
      headerName: "Plan Name",
      minWidth: 200,
      flex: 2,
      pinned: "left",
      cellRenderer: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Assignment color="primary" sx={{ fontSize: 20 }} />
          <Typography variant="body2" fontWeight="medium">
            {params.value || "N/A"}
          </Typography>
        </Box>
      ),
    },

    {
      field: "progress_percent",
      headerName: "Progress",
      minWidth: 100,
      flex: 1,
      cellRenderer: (params) => {
        const pct = params.value ?? 0;
        const color = pct >= 100 ? "success" : pct >= 75 ? "primary" : pct >= 50 ? "info" : "warning";
        return (
          <Chip
            label={`${pct}%`}
            size="small"
            color={color}
            variant="outlined"
          />
        );
      },
    },

    {
      field: "total_allotted_hours",
      headerName: "Allotted",
      minWidth: 120,
      flex: 1,
      cellRenderer: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <AccessTime sx={{ fontSize: 14, color: "text.secondary" }} />
          <Typography variant="body2">{params.value ?? "0"}</Typography>
        </Box>
      ),
    },
    {
      field: "utilized_hours",
      headerName: "Utilized",
      minWidth: 120,
      flex: 1,
      cellRenderer: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Schedule sx={{ fontSize: 14, color: "info.main" }} />
          <Typography variant="body2">{params.value ?? "0"}</Typography>
        </Box>
      ),
    },
    {
      field: "time_period",
      headerName: "Period",
      minWidth: 120,
      flex: 1,
      cellRenderer: (params) => {
        const period = TIME_PERIODS.find((p) => p.value === params.value);
        return (
          <Chip
            label={period?.label || params.value}
            size="small"
            color="primary"
            variant="outlined"
          />
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      flex: 1,
      cellRenderer: (params) => {
        const status = STATUS_OPTIONS.find((s) => s.value === params.value);
        return (
          <Chip
            label={status?.label || params.value}
            size="small"
            color={status?.color || "default"}
          />
        );
      },
    },
    {
      field: "projectName",
      headerName: "Project",
      minWidth: 200,
      flex: 2,
    },
    {
      field: "start_date",
      headerName: "Start Date",
      minWidth: 120,
      flex: 1,
      cellRenderer: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : "N/A",
    },
    {
      field: "end_date",
      headerName: "End Date",
      minWidth: 120,
      flex: 1,
      cellRenderer: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : "N/A",
    },
    {
      field: "assigned_employees_count",
      headerName: "Emp",
      minWidth: 120,
      flex: 1,
      cellRenderer: (params) => (
        <Chip
          icon={<People />}
          label={params.value || 0}
          size="small"
          color="info"
          variant="outlined"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 200,
      flex: 2,
      pinned: "right",
      filter: false,
      sortable: false,
      cellRenderer: (params) => {
        const plan = params.data;
        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Log details & utilization">
              <IconButton
                size="small"
                color="info"
                onClick={() => handleOpenLogDetails(plan)}
              >
                <List fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Assign Employees">
              <IconButton
                size="small"
                color="primary"
                onClick={async () => {
                  try {
                    const res = await apiService.getProjectPlan(plan.id);
                    const planData = res.data?.Result || res.data?.data || res.data;
                    // Also fetch project employees for assignment
                    if (planData.project_id) {
                      const empRes = await apiService.getProjectEmployees(planData.project_id);
                      const employees = empRes.data?.Result || empRes.data?.data || empRes.data || [];
                      planData.availableEmployees = employees;
                    }
                    handleOpenEmployeeDialog(planData);
                  } catch (error) {
                    console.error("Error fetching plan details:", error);
                  }
                }}
              >
                <People fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleOpenDialog(plan)}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDelete(plan.id)}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      minWidth: 110,
    }),
    []
  );

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
              Project Planning
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create and manage project plans with time-based allocations
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
              },
            }}
          >
            Create Plan
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
          Filter by
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Employee</InputLabel>
              <Select
                value={filterEmployeeId}
                label="Employee"
                onChange={(e) => setFilterEmployeeId(e.target.value)}
              >
                <MenuItem value="">All employees</MenuItem>
                {employeesForFilter.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.employeeName || emp.userName} {emp.EMPID ? `(${emp.EMPID})` : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Plan</InputLabel>
              <Select
                value={filterPlanId}
                label="Plan"
                onChange={(e) => setFilterPlanId(e.target.value)}
              >
                <MenuItem value="">All plans</MenuItem>
                {allPlansList.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.plan_name} {plan.projectName ? `— ${plan.projectName}` : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">All statuses</MenuItem>
                <MenuItem value="active">{STATUS_OPTIONS.find((s) => s.value === "active")?.label || "Active"}</MenuItem>
                <MenuItem value="draft">{STATUS_OPTIONS.find((s) => s.value === "draft")?.label || "Draft"} (In progress)</MenuItem>
                <MenuItem value="completed">{STATUS_OPTIONS.find((s) => s.value === "completed")?.label || "Completed"}</MenuItem>
                <MenuItem value="cancelled">{STATUS_OPTIONS.find((s) => s.value === "cancelled")?.label || "Cancelled"}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <Button
              variant="outlined"
              size="medium"
              onClick={() => {
                setFilterEmployeeId("");
                setFilterPlanId("");
                setFilterStatus("");
              }}
              disabled={!filterEmployeeId && !filterPlanId && !filterStatus}
            >
              Clear filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Plans Grid */}
      <Card sx={{ borderRadius: 3, overflow: "hidden" }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ height: "600px", width: "100%" }} className="ag-theme-alpine">
            <AgGridReact
              rowData={plansList}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              pagination={true}
              paginationPageSize={20}
              animateRows={true}
              rowHeight={60}
              headerHeight={60}
              loading={plansLoading}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Create/Edit Plan Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            {selectedPlan ? "Edit Project Plan" : "Create Project Plan"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Plan Name"
                value={formData.plan_name}
                onChange={(e) =>
                  setFormData({ ...formData, plan_name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Project</InputLabel>
                <Select
                  value={formData.project_id}
                  label="Project"
                  onChange={(e) =>
                    setFormData({ ...formData, project_id: e.target.value })
                  }
                  disabled={projectsLoading}
                >
                  {projectsList.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.projectName} ({project.projectNo})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {selectedProject && (
              <Grid item xs={12} sm={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: "primary.light",
                    borderRadius: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Project Allotted Hours
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    {parseFloat(selectedProject.allotatedHours || 0).toFixed(2)} hrs
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Remaining: {remainingHours.toFixed(2)} hrs
                  </Typography>
                </Paper>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={formData.time_period}
                  label="Time Period"
                  onChange={(e) =>
                    setFormData({ ...formData, time_period: e.target.value })
                  }
                >
                  {TIME_PERIODS.map((period) => (
                    <MenuItem key={period.value} value={period.value}>
                      {period.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={formData.start_date}
                  onChange={(date) =>
                    setFormData({ ...formData, start_date: date })
                  }
                  slotProps={{
                    textField: { fullWidth: true, required: true },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Allotted Hours"
                type="number"
                value={formData.total_allotted_hours}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (value <= remainingHours || !selectedProject) {
                    setFormData({
                      ...formData,
                      total_allotted_hours: e.target.value,
                    });
                  }
                }}
                required
                error={
                  selectedProject &&
                  parseFloat(formData.total_allotted_hours || 0) > remainingHours
                }
                helperText={
                  selectedProject &&
                  parseFloat(formData.total_allotted_hours || 0) > remainingHours
                    ? `Cannot exceed remaining hours (${remainingHours.toFixed(2)} hrs)`
                    : selectedProject
                    ? `Available: ${remainingHours.toFixed(2)} hrs`
                    : ""
                }
                InputProps={{
                  startAdornment: (
                    <AccessTime sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
            {calculatedEndDate && (
              <Grid item xs={12} sm={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: "info.light",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <CalendarToday color="info" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Calculated End Date
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {calculatedEndDate.format("DD MMM YYYY")}
                    </Typography>
                    {selectedProject?.targetDate &&
                      dayjs(selectedProject.targetDate).isBefore(calculatedEndDate) && (
                        <Typography variant="caption" color="warning.main">
                          Limited by project target date
                        </Typography>
                      )}
                  </Box>
                </Paper>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Grid>
            
            {/* Employee Assignment Section */}
            {formData.project_id && (
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      Assigned Employees
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={`${selectedEmployees.length} assigned`}
                        size="small"
                        color="primary"
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Add />}
                        onClick={handleOpenAddEmployeeDialog}
                      >
                        Add Employee
                      </Button>
                    </Box>
                  </Box>
                  
                  {employeesLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : employeesList.length === 0 ? (
                    <Alert severity="info">
                      No employees assigned to this project. Please assign employees to the project first.
                    </Alert>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox">Select</TableCell>
                            <TableCell>Employee Name</TableCell>
                            <TableCell>EMP ID</TableCell>
                            <TableCell>Designation</TableCell>
                            <TableCell>Allotted Hours</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {employeesList.map((employee) => {
                            const employeeId =
                              employee.employee_id ?? employee.id ?? employee.EMPID;
                            const isSelected = selectedEmployees.some(
                              (x) => String(x) === String(employeeId)
                            );
                            const hours =
                              employeeHours[employeeId] ??
                              employeeHours[Number(employeeId)] ??
                              0;

                            return (
                              <TableRow key={`emp-${String(employeeId)}`} hover>
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={isSelected}
                                    onChange={() => {
                                      if (isSelected) {
                                        handleRemoveEmployee(employeeId);
                                      } else {
                                        setSelectedEmployees((prev) => [
                                          ...prev,
                                          employeeId,
                                        ]);
                                        setEmployeeHours((prev) => ({
                                          ...prev,
                                          [employeeId]: 0,
                                        }));
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{employee.employeeName || "N/A"}</TableCell>
                                <TableCell>{employee.EMPID || "N/A"}</TableCell>
                                <TableCell>{employee.designation || "N/A"}</TableCell>
                                <TableCell>
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={hours}
                                    onChange={(e) =>
                                      handleEmployeeHoursChange(
                                        employeeId,
                                        e.target.value
                                      )
                                    }
                                    disabled={!isSelected}
                                    sx={{ width: 120 }}
                                    InputProps={{
                                      inputProps: { min: 0, step: 0.5 },
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: "flex", gap: 0.5 }}>
                                    {isSelected && (
                                      <Tooltip title="Remove from Plan">
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleRemoveEmployee(employeeId)}
                                        >
                                          <Delete fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                  
                  {selectedEmployees.length > 0 && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: "success.light", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Total Employee Hours
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        {Object.values(employeeHours)
                          .reduce((sum, hours) => sum + (parseFloat(hours) || 0), 0)
                          .toFixed(2)} hrs
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            )}
            
            {selectedPlan && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={creating || updating}
          >
            {creating || updating ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog
        open={addEmployeeDialogOpen}
        onClose={() => setAddEmployeeDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Add Employees to Plan
          </Typography>
        </DialogTitle>
        <DialogContent>
          {allEmployeesLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TextField
                fullWidth
                placeholder="Search employees by name, ID, or email..."
                size="small"
                value={employeeSearchText}
                onChange={(e) => setEmployeeSearchText(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <People />
                    </InputAdornment>
                  ),
                }}
              />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">Select</TableCell>
                      <TableCell>Employee Name</TableCell>
                      <TableCell>EMP ID</TableCell>
                      <TableCell>Designation</TableCell>
                      <TableCell>Email</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allEmployees
                      .filter(emp => {
                        const employeeId = emp.id || emp.EMPID;
                        const isNotSelected = !selectedEmployees.includes(employeeId);
                        if (!isNotSelected) return false;
                        
                        if (!employeeSearchText) return true;
                        
                        const searchLower = employeeSearchText.toLowerCase();
                        const name = (emp.employeeName || "").toLowerCase();
                        const empId = (emp.EMPID || "").toLowerCase();
                        const email = (emp.employeeEmail || "").toLowerCase();
                        const designation = (emp.designation || "").toLowerCase();
                        
                        return name.includes(searchLower) || 
                               empId.includes(searchLower) || 
                               email.includes(searchLower) ||
                               designation.includes(searchLower);
                      })
                      .map((employee) => {
                        const employeeId = employee.id || employee.EMPID;
                        return (
                          <TableRow key={employeeId} hover>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={false}
                                onChange={() => {
                                  if (!selectedEmployees.includes(employeeId)) {
                                    handleAddEmployees([employeeId]);
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>{employee.employeeName || "N/A"}</TableCell>
                            <TableCell>{employee.EMPID || "N/A"}</TableCell>
                            <TableCell>{employee.designation || "N/A"}</TableCell>
                            <TableCell>{employee.employeeEmail || "N/A"}</TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
              {allEmployees.filter(emp => {
                const employeeId = emp.id || emp.EMPID;
                return !selectedEmployees.includes(employeeId);
              }).length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  All available employees are already added to this plan.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => {
            setAddEmployeeDialogOpen(false);
            setEmployeeSearchText("");
          }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Employees Dialog */}
      <Dialog
        open={employeeDialogOpen}
        onClose={() => setEmployeeDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Assign Employees to Plan
          </Typography>
        </DialogTitle>
        <DialogContent>
          {employeesLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (!selectedPlan?.project_id || employeesList.length === 0) ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              {!selectedPlan?.project_id 
                ? "Please select a project first."
                : "No employees assigned to this project. Please assign employees to the project first."}
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">Select</TableCell>
                    <TableCell>Employee Name</TableCell>
                    <TableCell>EMP ID</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell>Allotted Hours</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeesList.map((employee) => (
                    <TableRow key={employee.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={() => handleEmployeeToggle(employee.id)}
                        />
                      </TableCell>
                      <TableCell>{employee.employeeName || "N/A"}</TableCell>
                      <TableCell>{employee.EMPID || "N/A"}</TableCell>
                      <TableCell>{employee.designation || "N/A"}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={employeeHours[employee.id] || 0}
                          onChange={(e) =>
                            handleEmployeeHoursChange(employee.id, e.target.value)
                          }
                          disabled={!selectedEmployees.includes(employee.id)}
                          sx={{ width: 120 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEmployeeDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAssignEmployees}
            variant="contained"
            disabled={assigning || selectedEmployees.length === 0}
          >
            {assigning ? <CircularProgress size={20} /> : "Assign Employees"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Log details & utilization Dialog */}
      <Dialog
        open={logDialogOpen}
        onClose={() => setLogDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Log details & progress — {selectedPlanForLog?.plan_name || "Plan"}
          </Typography>
          {selectedPlanForLog && (
            <Stack direction="row" spacing={2} sx={{ mt: 1 }} flexWrap="wrap">
              <Chip
                label={`Total Logs: ${filteredLogDetails.length}`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<AccessTime />}
                label={`Allotted: ${Number(logDetails.total_allotted_hours ?? selectedPlanForLog.total_allotted_hours ?? 0).toFixed(2)} hrs`}
                size="small"
                variant="outlined"
              />
              <Chip
                icon={<Schedule />}
                label={`Utilized: ${Number(logDetails.utilized_hours).toFixed(2)} hrs`}
                size="small"
                color="info"
                variant="outlined"
              />
              <Chip
                label={`Progress: ${logDetails.progress_percent}%`}
                size="small"
                color={logDetails.progress_percent >= 100 ? "success" : "primary"}
                variant="outlined"
              />
            </Stack>
          )}
        </DialogTitle>
        <DialogContent>
          {logDetailsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Clock In</TableCell>
                    <TableCell>Clock Out</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLogDetails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary">No log entries for this project</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedLogDetails.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.employeeName || row.userName || "—"}</TableCell>
                        <TableCell>{row.sentDate ? new Date(row.sentDate).toLocaleDateString() : "—"}</TableCell>
                        <TableCell>{row.totalHours != null ? Number(row.totalHours).toFixed(2) : "—"}</TableCell>
                        <TableCell>{row.clockInTime ? new Date(row.clockInTime).toLocaleString() : "—"}</TableCell>
                        <TableCell>{row.clockOutTime ? new Date(row.clockOutTime).toLocaleString() : "—"}</TableCell>
                        <TableCell>
                          <Chip label={row.status || "—"} size="small" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {filteredLogDetails.length > 0 && (
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <TablePagination
                    component="div"
                    count={filteredLogDetails.length}
                    page={logPage}
                    onPageChange={(event, newPage) => setLogPage(newPage)}
                    rowsPerPage={logRowsPerPage}
                    onRowsPerPageChange={(event) => {
                      setLogRowsPerPage(parseInt(event.target.value, 10));
                      setLogPage(0);
                    }}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    labelRowsPerPage="Rows per page:"
                    labelDisplayedRows={({ from, to, count }) =>
                      `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                    }
                  />
                </Box>
              )}
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProjectPlanning;
