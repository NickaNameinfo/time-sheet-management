import React, { useCallback, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextareaAutosize,
  IconButton,
  Tooltip,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Assignment,
  CheckCircle,
  Cancel,
  Refresh,
  Close,
  Comment,
  Send,
  FilterList,
  Search,
  Clear,
  Schedule,
  AccessTime,
  WarningAmber,
  Login,
  Logout,
  Groups,
  Event,
} from "@mui/icons-material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { apiService } from "../services/api";
import { useApi, useMutation } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import {
  STANDARD_DAILY_HOURS,
  enrichRowsWithDayMetrics,
  summarizeTeam,
} from "../utils/attendanceSummary";
import { formatClockDateTime } from "../utils/formatWorkDetailClock";

const pageCardSx = {
  borderRadius: 3,
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  border: "1px solid",
  borderColor: "divider",
};

function resolveAccent(theme, accent) {
  if (typeof accent === "string" && accent.startsWith("#")) return accent;
  if (accent === "text.secondary") return theme.palette.text.secondary;
  return theme.palette[accent]?.main || theme.palette.primary.main;
}

function StatCard({ icon: Icon, label, value, sub, accent = "primary", valueColor }) {
  const theme = useTheme();
  const main = resolveAccent(theme, accent);
  return (
    <Card
      sx={{
        ...pageCardSx,
        height: "100%",
        borderLeft: `4px solid ${main}`,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 28px rgba(0,0,0,0.1)" },
      }}
    >
      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          {Icon && (
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha(main, 0.12),
                color: main,
                display: "flex",
                flexShrink: 0,
              }}
            >
              <Icon fontSize="small" />
            </Box>
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {label}
            </Typography>
            <Typography variant="h6" fontWeight={700} color={valueColor || "text.primary"} sx={{ lineHeight: 1.25 }}>
              {value}
            </Typography>
            {sub && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                {sub}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ProjectWorkDetails() {
  const gridStyle = { height: "100%", width: "100%" };
  const { user } = useAuth();
  const theme = useTheme();
  const gridRef = React.createRef();
  
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedWorkDetail, setSelectedWorkDetail] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  // Approval dialog states
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalComments, setApprovalComments] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: "all", // "all", "pending", "approved", "rejected"
    employeeName: "",
    projectName: "",
    weekNumber: "",
    referenceNo: "",
    startDate: dayjs().startOf("month"),
    endDate: dayjs().endOf("month"),
    searchText: "",
  });

  // Fetch work details - filter by team lead's ID (tlId)
  const { data: workDetails, loading, error, refetch } = useApi(
    () => apiService.getWorkDetails({ tlId: user?.id }),
    [user?.id],
    !!user?.id
  );

  // Get unique values for filter dropdowns (backend already filters by tlId)
  const filterOptions = useMemo(() => {
    if (!workDetails || !user) return { employees: [], projects: [], weekNumbers: [], referenceNos: [] };
    
    const details = Array.isArray(workDetails) 
      ? workDetails 
      : workDetails?.Result || [];
    
    // Backend already filters by tlId, so use all details
    return {
      employees: [...new Set(details.map(item => item.employeeName).filter(Boolean))].sort(),
      projects: [...new Set(details.map(item => item.projectName).filter(Boolean))].sort(),
      weekNumbers: [...new Set(details.map(item => item.weekNumber).filter(Boolean))].sort((a, b) => Number(a) - Number(b)),
      referenceNos: [...new Set(details.map(item => item.referenceNo).filter(Boolean))].sort(),
    };
  }, [workDetails, user]);

  // Filter work details with applied filters (backend already filters by tlId)
  const rowData = useMemo(() => {
    if (!workDetails || !user) return [];
    
    // Handle both array and object with Result property
    const details = Array.isArray(workDetails) 
      ? workDetails 
      : workDetails?.Result || [];
    
    // Backend already filters by tlId, so we just apply frontend filters
    let filtered = details;
    
    // Apply status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((item) => {
        const statusValue = item.status?.trim() || "";
        const status = statusValue === "" ? "pending" : statusValue.toLowerCase();
        return status === filters.status;
      });
    }
    
    // Apply employee filter (exact match from dropdown)
    if (filters.employeeName) {
      filtered = filtered.filter((item) => item.employeeName === filters.employeeName);
    }
    
    // Apply project name filter
    if (filters.projectName) {
      filtered = filtered.filter((item) =>
        item.projectName?.toLowerCase().includes(filters.projectName.toLowerCase())
      );
    }
    
    // Apply week number filter
    if (filters.weekNumber) {
      filtered = filtered.filter((item) => item.weekNumber === filters.weekNumber);
    }
    
    // Apply reference number filter
    if (filters.referenceNo) {
      filtered = filtered.filter((item) =>
        item.referenceNo?.toString().includes(filters.referenceNo.toString())
      );
    }
    
    // Apply date range filter
    if (filters.startDate) {
      const startDate = dayjs(filters.startDate).startOf("day");
      filtered = filtered.filter((item) => {
        if (!item.sentDate) return false;
        const itemDate = dayjs(item.sentDate);
        return !itemDate.isBefore(startDate, "day");
      });
    }

    if (filters.endDate) {
      const endDate = dayjs(filters.endDate).endOf("day");
      filtered = filtered.filter((item) => {
        if (!item.sentDate) return false;
        const itemDate = dayjs(item.sentDate);
        return !itemDate.isAfter(endDate, "day");
      });
    }
    
    // Apply search text filter (searches across multiple fields)
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter((item) =>
        item.employeeName?.toLowerCase().includes(searchLower) ||
        item.projectName?.toLowerCase().includes(searchLower) ||
        item.referenceNo?.toString().includes(searchLower) ||
        item.taskNo?.toString().includes(searchLower) ||
        item.areaofWork?.toLowerCase().includes(searchLower) ||
        item.weekNumber?.toString().includes(searchLower)
      );
    }
    
    return filtered;
  }, [workDetails, user, filters]);

  const periodStart = useMemo(
    () =>
      filters.startDate
        ? dayjs(filters.startDate).format("YYYY-MM-DD")
        : dayjs().startOf("month").format("YYYY-MM-DD"),
    [filters.startDate]
  );

  const periodEnd = useMemo(
    () =>
      filters.endDate
        ? dayjs(filters.endDate).format("YYYY-MM-DD")
        : dayjs().endOf("month").format("YYYY-MM-DD"),
    [filters.endDate]
  );

  const periodLabel = `${dayjs(periodStart).format("DD MMM YYYY")} – ${dayjs(periodEnd).format("DD MMM YYYY")}`;

  const teamMetrics = useMemo(
    () => summarizeTeam(rowData, periodStart, periodEnd),
    [rowData, periodStart, periodEnd]
  );

  const enrichedRowData = useMemo(() => enrichRowsWithDayMetrics(rowData), [rowData]);

  // Mutation for updating work details (for non-approval updates)
  const { mutate: updateWorkDetailsMutation, loading: updating } = useMutation(
    (payload) => apiService.updateWorkDetails(payload.id, payload.data)
  );

  // Mutation for approving/rejecting work details (uses approval endpoint)
  const { mutate: approveWorkDetailsMutation, loading: approving } = useMutation(
    (data) => apiService.approveEntity(data.entityType, data.entityId, {
      approverId: user?.id || 1,
      status: data.status,
      comments: data.comments || "",
    })
  );

  // Mutation for sending notifications
  const { mutate: sendNotificationMutation, loading: sendingNotification } = useMutation(
    apiService.sendNotification
  );

  const gridOptions = useMemo(
    () => ({
      editType: "fullRow",
      rowIndex: 1,
      editable: true,
      rowPinned: true,
    }),
    []
  );

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: "all",
      employeeName: "",
      projectName: "",
      weekNumber: "",
      referenceNo: "",
      startDate: dayjs().startOf("month"),
      endDate: dayjs().endOf("month"),
      searchText: "",
    });
  };

  const isDefaultPeriod = useMemo(() => {
    if (!filters.startDate || !filters.endDate) return false;
    return (
      dayjs(filters.startDate).format("YYYY-MM-DD") ===
        dayjs().startOf("month").format("YYYY-MM-DD") &&
      dayjs(filters.endDate).format("YYYY-MM-DD") === dayjs().endOf("month").format("YYYY-MM-DD")
    );
  }, [filters.startDate, filters.endDate]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== "all" ||
      filters.employeeName !== "" ||
      filters.projectName !== "" ||
      filters.weekNumber !== "" ||
      filters.referenceNo !== "" ||
      (!isDefaultPeriod && (filters.startDate || filters.endDate)) ||
      filters.searchText !== ""
    );
  }, [filters, isDefaultPeriod]);

  const handleApprove = (status, params) => {
    setSelectedItem({ ...params.data, status });
    setApprovalDialog(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedItem) return;

    try {
      // Use approval endpoint for approve/reject actions (consistent with ApprovalCenter)
      const result = await approveWorkDetailsMutation({
        entityType: "timesheet", // or "workdetails" - both work the same way
        entityId: selectedItem.id,
        status: selectedItem.status,
        comments: approvalComments || "",
      });
      
      if (result.success || result.Status === 'Success') {
        showSnackbar(`Work details ${selectedItem.status} successfully`, "success");
        setApprovalDialog(false);
        setSelectedItem(null);
        setApprovalComments("");
        refetch();
      } else {
        showSnackbar(result.error || result.Message || "Failed to update work details", "error");
      }
    } catch (error) {
      showSnackbar(error.message || "Failed to update work details", "error");
    }
  };

  const updateProjectDetails = async (status, params) => {
    // This function is kept for backward compatibility but now uses handleApprove
    handleApprove(status, params);
  };

  const columnDefs = useMemo(
    () => [
      {
        field: "employeeName",
        headerName: "Employee Name",
        minWidth: 170,
        filter: true,
      },
      { field: "areaofWork", headerName: "Area of Work", minWidth: 170 },
      { field: "projectName", headerName: "Project Name", minWidth: 170 },
      { field: "monday", headerName: "Monday", minWidth: 100 },
      { field: "tuesday", headerName: "Tuesday", minWidth: 100 },
      { field: "wednesday", headerName: "Wednesday", minWidth: 100 },
      { field: "thursday", headerName: "Thursday", minWidth: 100 },
      { field: "friday", headerName: "Friday", minWidth: 100 },
      { field: "saturday", headerName: "Saturday", minWidth: 100 },
      { field: "sunday", headerName: "Sunday", minWidth: 100 },
      { field: "totalHours", headerName: "Entry Hrs", filter: false, minWidth: 100 },
      {
        field: "workDate",
        headerName: "Work Date",
        minWidth: 110,
        valueFormatter: (p) => p.value || "—",
      },
      {
        field: "dayOfWeek",
        headerName: "Day",
        minWidth: 72,
        cellRenderer: (params) => {
          const weekend = params.data?.isWeekendDay;
          return (
            <Chip
              label={params.value || "—"}
              size="small"
              color={weekend ? "secondary" : "default"}
              variant={weekend ? "filled" : "outlined"}
              sx={{ height: 22, fontSize: 11 }}
            />
          );
        },
      },
      {
        field: "dayTotalHours",
        headerName: "Day Total",
        minWidth: 95,
        valueFormatter: (p) => (p.value != null ? Number(p.value).toFixed(2) : "—"),
      },
      {
        field: "dayRegularHours",
        headerName: `Regular (≤${STANDARD_DAILY_HOURS}h)`,
        minWidth: 120,
        valueFormatter: (p) =>
          p.data?.isWeekendDay ? "—" : p.value != null ? Number(p.value).toFixed(2) : "—",
      },
      {
        field: "dayExtraHours",
        headerName: "Extra (>8h)",
        minWidth: 100,
        cellStyle: (params) =>
          params.data?.dayExtraHours > 0 ? { color: "#ed6c02", fontWeight: 600 } : null,
        valueFormatter: (p) =>
          p.data?.isWeekendDay ? "—" : p.value != null ? Number(p.value).toFixed(2) : "—",
      },
      {
        field: "dayWeekendHours",
        headerName: "Weekend Hrs",
        minWidth: 105,
        cellStyle: (params) =>
          params.data?.isWeekendDay ? { color: "#9c27b0", fontWeight: 600 } : null,
        valueFormatter: (p) =>
          p.data?.isWeekendDay && p.value != null ? Number(p.value).toFixed(2) : "—",
      },
      {
        headerName: "Clock In",
        colId: "clockInTime",
        filter: false,
        minWidth: 160,
        valueGetter: (params) => params?.data?.clockInTime || params?.data?.sentDate || null,
        valueFormatter: (params) => formatClockDateTime(params.value),
      },
      {
        headerName: "Clock Out",
        colId: "clockOutTime",
        filter: false,
        minWidth: 160,
        valueGetter: (params) => params?.data?.clockOutTime || params?.data?.approvedDate || null,
        valueFormatter: (params) => formatClockDateTime(params.value),
      },
      { field: "weekNumber", headerName: "Week Number", filter: false, minWidth: 120 },
      { 
        field: "sentDate", 
        headerName: "Sent Date", 
        filter: false, 
        minWidth: 150,
        valueFormatter: (params) => {
          if (!params.value) return "";
          try {
            const date = new Date(params.value);
            if (isNaN(date.getTime())) return params.value;
            return date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
          } catch (e) {
            return params.value;
          }
        }
      },
      { 
        field: "approvedDate", 
        headerName: "Approved Date", 
        filter: false, 
        minWidth: 150,
        valueFormatter: (params) => {
          if (!params.value || params.value === "") return "-";
          try {
            const date = new Date(params.value);
            if (isNaN(date.getTime())) return params.value;
            return date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
          } catch (e) {
            return params.value || "-";
          }
        }
      },
      {
        field: "status",
        headerName: "Status",
        pinned: "right",
        minWidth: 120,
        width: 120,
        filter: false,
        editable: false,
        cellRenderer: (params) => {
          // Handle empty string status as "pending"
          const statusValue = params?.data?.status?.trim() || "";
          const status = statusValue === "" ? "pending" : statusValue.toLowerCase();
          const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
          
          return (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Chip
                label={displayStatus}
                color={
                  status === "approved"
                    ? "success"
                    : status === "rejected"
                    ? "error"
                    : "warning"
                }
                size="small"
                variant={status === "approved" ? "filled" : "outlined"}
                icon={
                  status === "approved" ? (
                    <CheckCircle fontSize="small" />
                  ) : status === "rejected" ? (
                    <Cancel fontSize="small" />
                  ) : null
                }
              />
            </Box>
          );
        },
      },
      {
        headerName: "Action",
        pinned: "right",
        minWidth: 150,
        width: 150,
        field: "id",
        filter: false,
        editable: false,
        cellRenderer: (params) => {
          // Handle empty string status as "pending"
          const statusValue = params?.data?.status?.trim() || "";
          const status = statusValue === "" ? "pending" : statusValue.toLowerCase();
          const isApproved = status === "approved";
          const isRejected = status === "rejected";
          
          return (
            <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
              {!isApproved && !isRejected && (
                <>
                  <Tooltip title="Approve">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => handleApprove("approved", params)}
                      disabled={approving || updating}
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
                  <Tooltip title="Reject">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleApprove("rejected", params)}
                      disabled={approving || updating}
                      sx={{
                        "&:hover": {
                          bgcolor: "error.light",
                          color: "white",
                        },
                      }}
                    >
                      <Cancel fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add Comment">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        setSelectedWorkDetail(params.data);
                        setOpen(true);
                      }}
                      sx={{
                        "&:hover": {
                          bgcolor: "primary.light",
                          color: "white",
                        },
                      }}
                    >
                      <Comment fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              {isApproved && (
                <Chip
                  label="Approved"
                  color="success"
                  size="small"
                  icon={<CheckCircle fontSize="small" />}
                />
              )}
              {isRejected && (
                <Chip
                  label="Rejected"
                  color="error"
                  size="small"
                  icon={<Cancel fontSize="small" />}
                />
              )}
            </Box>
          );
        },
      },
    ],
    [approving, updating]
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
      enableRowGroup: true,
      enablePivot: true,
      enableValue: true,
      sortable: true,
      resizable: true,
      filter: false,
      floatingFilter: true,
      flex: 1,
      minWidth: 100,
    }),
    []
  );

  const onGridReady = useCallback((params) => {
    // Grid is ready, data will be loaded via useApi hook
  }, []);

  const handleClose = () => {
    setOpen(false);
    setMessage("");
    setSelectedWorkDetail(null);
  };

  const handleSubmit = async () => {
    if (!selectedWorkDetail || !message.trim()) {
      showSnackbar("Please enter a message", "warning");
      return;
    }

    const notificationData = {
      from: user?.employeeName || user?.userName,
      to: selectedWorkDetail?.userName,
      sendDate: new Date().toISOString(),
      message: message,
      empId: selectedWorkDetail?.employeeId || "",
      tlId: user?.id || "",
    };

    const result = await sendNotificationMutation(notificationData);
    
    if (result.success) {
      showSnackbar("Notification sent successfully", "success");
      setOpen(false);
      setMessage("");
      setSelectedWorkDetail(null);
    } else {
      showSnackbar(result.error || "Error sending notification", "error");
    }
  };

  const onSelectionChanged = (event) => {
    // Handle selection if needed
  };

  const { totals, employeeSummaries, requiredHoursPerEmployee, weekdaysInPeriod } = teamMetrics;
  const selectedEmployee = filters.employeeName?.trim() || "";
  const isEmployeeFiltered = Boolean(selectedEmployee);
  const scopeLabel = isEmployeeFiltered ? selectedEmployee : "Team";

  const filtersCard = (
    <Card sx={{ ...pageCardSx, mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, flexWrap: "wrap" }}>
          <FilterList color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Filters & period
          </Typography>
          <Chip icon={<Event />} label={periodLabel} size="small" variant="outlined" />
          {isEmployeeFiltered && (
            <Chip label={selectedEmployee} size="small" color="primary" variant="filled" />
          )}
          {hasActiveFilters && (
            <Chip
              label="Clear all"
              onClick={handleClearFilters}
              color="warning"
              variant="outlined"
              icon={<Clear />}
              clickable
              size="small"
              sx={{ ml: "auto" }}
            />
          )}
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Employee</InputLabel>
              <Select
                value={filters.employeeName}
                label="Employee"
                onChange={(e) => handleFilterChange("employeeName", e.target.value)}
                sx={{
                  borderRadius: 2,
                  bgcolor: isEmployeeFiltered ? alpha(theme.palette.primary.main, 0.06) : undefined,
                }}
              >
                <MenuItem value="">All team members</MenuItem>
                {filterOptions.employees.map((emp) => (
                  <MenuItem key={emp} value={emp}>
                    {emp}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              Select an employee to filter stats, hours table, and submissions below.
            </Typography>
          </Grid>

          <Grid item xs={6} md={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Period start"
                value={filters.startDate}
                onChange={(newValue) => handleFilterChange("startDate", newValue)}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: { "& .MuiOutlinedInput-root": { borderRadius: 2 } },
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={6} md={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Period end"
                value={filters.endDate}
                onChange={(newValue) => handleFilterChange("endDate", newValue)}
                minDate={filters.startDate || undefined}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: { "& .MuiOutlinedInput-root": { borderRadius: 2 } },
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search across all fields..."
              value={filters.searchText}
              onChange={(e) => handleFilterChange("searchText", e.target.value)}
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
              <InputLabel>Project</InputLabel>
              <Select
                value={filters.projectName}
                label="Project"
                onChange={(e) => handleFilterChange("projectName", e.target.value)}
              >
                <MenuItem value="">All projects</MenuItem>
                {filterOptions.projects.map((proj) => (
                  <MenuItem key={proj} value={proj}>
                    {proj}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Week</InputLabel>
              <Select
                value={filters.weekNumber}
                label="Week"
                onChange={(e) => handleFilterChange("weekNumber", e.target.value)}
              >
                <MenuItem value="">All weeks</MenuItem>
                {filterOptions.weekNumbers.map((week) => (
                  <MenuItem key={week} value={week}>
                    Week {week}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Reference no"
              placeholder="Search..."
              value={filters.referenceNo}
              onChange={(e) => handleFilterChange("referenceNo", e.target.value)}
            />
          </Grid>

          {hasActiveFilters && (
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="body2" color="text.secondary">
                  Active:
                </Typography>
                {filters.status !== "all" && (
                  <Chip
                    label={`Status: ${filters.status}`}
                    size="small"
                    onDelete={() => handleFilterChange("status", "all")}
                  />
                )}
                {filters.employeeName && (
                  <Chip
                    label={`Employee: ${filters.employeeName}`}
                    size="small"
                    color="primary"
                    onDelete={() => handleFilterChange("employeeName", "")}
                  />
                )}
                {filters.projectName && (
                  <Chip
                    label={`Project: ${filters.projectName}`}
                    size="small"
                    onDelete={() => handleFilterChange("projectName", "")}
                  />
                )}
                {filters.weekNumber && (
                  <Chip
                    label={`Week: ${filters.weekNumber}`}
                    size="small"
                    onDelete={() => handleFilterChange("weekNumber", "")}
                  />
                )}
                {filters.referenceNo && (
                  <Chip
                    label={`Ref: ${filters.referenceNo}`}
                    size="small"
                    onDelete={() => handleFilterChange("referenceNo", "")}
                  />
                )}
                {!isDefaultPeriod && (filters.startDate || filters.endDate) && (
                  <Chip
                    label="Period"
                    size="small"
                    onDelete={() => {
                      handleFilterChange("startDate", dayjs().startOf("month"));
                      handleFilterChange("endDate", dayjs().endOf("month"));
                    }}
                  />
                )}
              </Stack>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: 1680, mx: "auto" }}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
              color: "#fff",
              display: { xs: "none", sm: "flex" },
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
            }}
          >
            <Assignment />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -0.5 }}>
              Team Project Work Details
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
              Review submissions · Required = weekdays × {STANDARD_DAILY_HOURS}h/day · Weekday regular
              capped at {STANDARD_DAILY_HOURS}h · Extra = above {STANDARD_DAILY_HOURS}h · Sat/Sun = weekend
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={refetch}
          disabled={loading}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </Box>

      {filtersCard}

      {rowData.length > 0 ? (
        <>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            <strong>{scopeLabel}</strong> attendance · <strong>{periodLabel}</strong>
            {employeeSummaries.length > 0 && (
              <>
                {" "}
                ·{" "}
                {isEmployeeFiltered
                  ? `${weekdaysInPeriod} weekday(s) × ${STANDARD_DAILY_HOURS}h = ${requiredHoursPerEmployee.toFixed(2)} required hrs`
                  : `${employeeSummaries.length} member(s) · ${requiredHoursPerEmployee.toFixed(2)} required hrs each`}
              </>
            )}
          </Alert>

          <Box
            sx={{
              mb: 3,
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(4, 1fr)",
                lg: "repeat(5, 1fr)",
              },
              gap: 2,
            }}
          >
            {!isEmployeeFiltered && (
              <StatCard
                icon={Groups}
                label="Team members"
                value={employeeSummaries.length}
                accent="primary"
              />
            )}
            <StatCard
              icon={AccessTime}
              label={isEmployeeFiltered ? "Required hrs" : "Required hrs (each)"}
              value={requiredHoursPerEmployee.toFixed(2)}
              sub={`${weekdaysInPeriod} weekdays × ${STANDARD_DAILY_HOURS}h`}
              accent="primary"
              valueColor="primary.main"
            />
            <StatCard
              icon={Schedule}
              label={`${scopeLabel} reg. logged`}
              value={totals.loggedHours.toFixed(2)}
              sub="Regular (≤8h/day)"
              accent="info"
            />
            <StatCard
              icon={WarningAmber}
              label={`${scopeLabel} not logged`}
              value={totals.missingHours.toFixed(2)}
              sub="Required − regular logged"
              accent="error"
              valueColor="error.main"
            />
            <StatCard
              label={`${scopeLabel} extra hrs`}
              value={totals.extraHours.toFixed(2)}
              sub={`Above ${STANDARD_DAILY_HOURS}h on weekdays`}
              accent="warning"
              valueColor="warning.dark"
            />
            <StatCard
              label={`${scopeLabel} weekend hrs`}
              value={totals.weekendHours.toFixed(2)}
              sub="Saturday & Sunday"
              accent="#9C27B0"
              valueColor="#9C27B0"
            />
            <StatCard
              icon={Login}
              label="Check-ins"
              value={totals.checkInCount}
              accent="success"
            />
            <StatCard
              icon={Logout}
              label="Check-outs"
              value={totals.checkOutCount}
              accent="text.secondary"
            />
          </Box>

          {!isEmployeeFiltered && employeeSummaries.length > 0 && (
            <Card sx={{ ...pageCardSx, mb: 3 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Groups color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    Hours by team member
                  </Typography>
                  <Chip label={periodLabel} size="small" variant="outlined" sx={{ ml: "auto" }} />
                </Stack>
                <TableContainer sx={{ borderRadius: 2, border: 1, borderColor: "divider" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "grey.50" }}>Employee</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                          Required
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                          Reg. logged
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                          Not logged
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                          Extra
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                          Weekend
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "grey.50" }}>
                          Check-in/out
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {employeeSummaries.map((emp, idx) => (
                        <TableRow
                          key={emp.key}
                          hover
                          sx={{ bgcolor: idx % 2 === 0 ? "background.paper" : "grey.50" }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {emp.employeeName}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{emp.requiredHours.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={600}>{emp.loggedHours.toFixed(2)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            {emp.missingHours > 0 ? (
                              <Typography fontWeight={700} color="error.main">
                                {emp.missingHours.toFixed(2)}
                              </Typography>
                            ) : (
                              <Typography color="text.secondary">0.00</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography color="warning.dark" fontWeight={600}>
                              {emp.extraHours.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ color: "#9C27B0" }} fontWeight={600}>
                              {emp.weekendHours.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="caption">
                              {emp.checkInCount} / {emp.checkOutCount}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          No work details match the current filters.
          {isEmployeeFiltered && ` Try another period or clear the employee filter for ${selectedEmployee}.`}
        </Alert>
      )}

      <Card sx={pageCardSx}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Assignment color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Work submissions
              {isEmployeeFiltered ? ` — ${selectedEmployee}` : ""}
            </Typography>
            <Chip label={`${enrichedRowData.length} rows`} size="small" sx={{ ml: 1 }} />
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ width: "100%", height: "600px", position: "relative" }}>
            {loading && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 1000,
                }}
              >
                <CircularProgress />
              </Box>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <div style={gridStyle} className="ag-theme-alpine">
              <AgGridReact
                ref={gridRef}
                rowData={enrichedRowData || []}
                columnDefs={columnDefs}
                autoGroupColumnDef={autoGroupColumnDef}
                defaultColDef={defaultColDef}
                suppressRowClickSelection={true}
                groupSelectsChildren={true}
                gridOptions={gridOptions}
                stopEditingWhenCellsLoseFocus={true}
                rowSelection={"single"}
                rowGroupPanelShow={"always"}
                pivotPanelShow={"always"}
                pagination={true}
                paginationPageSize={20}
                onGridReady={onGridReady}
                onSelectionChanged={onSelectionChanged}
              />
            </div>
          </Box>
        </CardContent>
      </Card>

      {/* Notification Dialog */}
      <Dialog
        fullWidth
        open={open}
        maxWidth="sm"
        onClose={handleClose}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Comment color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Add Comment
              </Typography>
            </Box>
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextareaAutosize
            minRows={4}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontFamily: "inherit",
              fontSize: "14px",
            }}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave a message..."
            value={message}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={sendingNotification}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={sendingNotification ? <CircularProgress size={20} /> : <Send />}
            disabled={sendingNotification || !message.trim()}
            sx={{
              background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
              },
            }}
          >
            {sendingNotification ? "Sending..." : "Send"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog
        open={approvalDialog}
        onClose={() => {
          setApprovalDialog(false);
          setApprovalComments("");
          setSelectedItem(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              {selectedItem?.status === "approved" ? "Approve" : "Reject"} Work Details
            </Typography>
            <IconButton
              onClick={() => {
                setApprovalDialog(false);
                setApprovalComments("");
                setSelectedItem(null);
              }}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Employee: {selectedItem.employeeName || "N/A"}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Project: {selectedItem.projectName || "N/A"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reference No: {selectedItem.referenceNo || "N/A"}
              </Typography>
            </Box>
          )}
          <TextField
            label="Comments"
            multiline
            rows={4}
            value={approvalComments}
            onChange={(e) => setApprovalComments(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            placeholder="Enter approval comments (optional)"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setApprovalDialog(false);
              setApprovalComments("");
              setSelectedItem(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmApprove}
            variant="contained"
            disabled={approving}
            startIcon={selectedItem?.status === "approved" ? <CheckCircle /> : <Cancel />}
            color={selectedItem?.status === "approved" ? "success" : "error"}
            sx={{
              background:
                selectedItem?.status === "approved"
                  ? "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)"
                  : "linear-gradient(135deg, #f44336 0%, #c62828 100%)",
              "&:hover": {
                background:
                  selectedItem?.status === "approved"
                    ? "linear-gradient(135deg, #43a047 0%, #1b5e20 100%)"
                    : "linear-gradient(135deg, #e53935 0%, #b71c1c 100%)",
              },
            }}
          >
            {approving ? "Processing..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ProjectWorkDetails;
