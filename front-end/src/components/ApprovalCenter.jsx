import React, { useState, useMemo, useEffect } from "react";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import { apiService } from "../services/api";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Checkbox,
  Stack,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TablePagination,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  Refresh,
  Close,
  Assignment,
  AccessTime,
  Description,
  History,
  Person,
  FilterList,
} from "@mui/icons-material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import ErrorMessage from "./ErrorMessage";
import Loading from "./Loading";
import { useAuth } from "../context/AuthContext";

const ApprovalCenter = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [comments, setComments] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [timesheetFilters, setTimesheetFilters] = useState({
    employeeName: "",
    weekDate: null, // YYYY-MM-DD (any day within the week)
  });
  const [leaveFilters, setLeaveFilters] = useState({
    employeeName: "",
    startDate: null,
    endDate: null,
  });
  const [overtimeFilters, setOvertimeFilters] = useState({
    employeeName: "",
    startDate: null,
    endDate: null,
  });

  const [leavePage, setLeavePage] = useState(0);
  const [leaveRowsPerPage, setLeaveRowsPerPage] = useState(25);
  const [overtimePage, setOvertimePage] = useState(0);
  const [overtimeRowsPerPage, setOvertimeRowsPerPage] = useState(25);
  const [timesheetPage, setTimesheetPage] = useState(0);
  const [timesheetRowsPerPage, setTimesheetRowsPerPage] = useState(25);

  const getTimesheetHoursCell = (entity) => {
    const rawHours = entity?.totalHours ?? entity?.totalhours ?? 0;
    const hours = Number.parseFloat(rawHours);

    if (Number.isFinite(hours) && hours > 0) {
      return <Chip label={hours} size="small" color="info" variant="outlined" />;
    }

    const clockInTime = entity?.clockInTime || entity?.sentDate || null;
    const clockOutTime = entity?.clockOutTime || entity?.approvedDate || null;
    const normalizedStatus = String(entity?.status || "").toLowerCase();

    const isCheckedOut = Boolean(clockOutTime) || normalizedStatus === "completed";
    const isCheckedIn = Boolean(clockInTime) || normalizedStatus === "active";

    const label = isCheckedOut ? "Checked Out" : isCheckedIn ? "Checked In" : "Pending";
    const color = isCheckedOut ? "default" : isCheckedIn ? "success" : "warning";

    const tooltipParts = [];
    if (clockInTime) {
      const d = new Date(clockInTime);
      tooltipParts.push(`In: ${Number.isNaN(d.getTime()) ? String(clockInTime) : d.toLocaleString()}`);
    }
    if (clockOutTime) {
      const d = new Date(clockOutTime);
      tooltipParts.push(`Out: ${Number.isNaN(d.getTime()) ? String(clockOutTime) : d.toLocaleString()}`);
    }
    const tooltip = tooltipParts.length > 0 ? tooltipParts.join(" • ") : "Hours not submitted yet";

    return (
      <Tooltip title={tooltip}>
        <Chip label={label} size="small" color={color} variant="outlined" />
      </Tooltip>
    );
  };

  const isTimesheetApprovable = (entity) => {
    const rawHours = entity?.totalHours ?? entity?.totalhours ?? 0;
    const hours = Number.parseFloat(rawHours);
    if (Number.isFinite(hours) && hours > 0) return true;

    const clockOutTime = entity?.clockOutTime || entity?.approvedDate || null;
    const normalizedStatus = String(entity?.status || "").toLowerCase();
    return Boolean(clockOutTime) || normalizedStatus === "completed";
  };

  const getTimesheetEntityDate = (entity) => {
    const raw =
      entity?.date ||
      entity?.sentDate ||
      entity?.clockInTime ||
      entity?.created_at ||
      entity?.createdAt ||
      null;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  // History filters
  const [historyFilters, setHistoryFilters] = useState({
    entityType: "",
    status: "",
    startDate: null,
    endDate: null,
    employeeName: "",
    projectName: "",
  });

  // Pagination for history
  const [historyPage, setHistoryPage] = useState(0);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(25);

  const {
    data: pendingApprovals,
    loading: pendingLoading,
    error: pendingError,
    refetch: refetchPending,
  } = useApi(
    () => apiService.getPendingApprovals({ approverId: user?.id }),
    [user?.id]
  );

  const { leaves, overtime, timesheets } = useMemo(() => {
    const list = Array.isArray(pendingApprovals) ? pendingApprovals : [];
    return {
      leaves: list.filter((a) => a.entityType === "leave"),
      overtime: list.filter((a) => a.entityType === "overtime"),
      timesheets: list.filter((a) => a.entityType === "timesheet"),
    };
  }, [pendingApprovals]);

  const filteredLeaves = useMemo(() => {
    let filtered = leaves;

    if (leaveFilters.employeeName) {
      filtered = filtered.filter((item) => {
        const name = String(item?.requestedBy || item?.entity?.employeeName || "").toLowerCase();
        return name.includes(leaveFilters.employeeName.toLowerCase());
      });
    }

    const start = leaveFilters.startDate ? new Date(leaveFilters.startDate) : null;
    const end = leaveFilters.endDate ? new Date(leaveFilters.endDate) : null;
    if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      filtered = filtered.filter((item) => {
        const raw = item?.entity?.leaveFrom || item?.requestedDate || null;
        if (!raw) return false;
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return false;
        return isWithinInterval(d, { start, end });
      });
    }

    return filtered;
  }, [leaves, leaveFilters.employeeName, leaveFilters.startDate, leaveFilters.endDate]);

  const filteredOvertime = useMemo(() => {
    let filtered = overtime;

    if (overtimeFilters.employeeName) {
      filtered = filtered.filter((item) => {
        const name = String(item?.requestedBy || item?.entity?.employeeName || "").toLowerCase();
        return name.includes(overtimeFilters.employeeName.toLowerCase());
      });
    }

    const start = overtimeFilters.startDate ? new Date(overtimeFilters.startDate) : null;
    const end = overtimeFilters.endDate ? new Date(overtimeFilters.endDate) : null;
    if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      filtered = filtered.filter((item) => {
        const raw = item?.entity?.attendance_date || item?.entity?.attendanceDate || item?.requestedDate || null;
        if (!raw) return false;
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return false;
        return isWithinInterval(d, { start, end });
      });
    }

    return filtered;
  }, [overtime, overtimeFilters.employeeName, overtimeFilters.startDate, overtimeFilters.endDate]);

  const filteredTimesheets = useMemo(() => {
    let filtered = timesheets;

    if (timesheetFilters.employeeName) {
      filtered = filtered.filter((item) => {
        const name = String(item?.requestedBy || item?.entity?.employeeName || "").toLowerCase();
        return name.includes(timesheetFilters.employeeName.toLowerCase());
      });
    }

    if (timesheetFilters.weekDate) {
      const anchor = new Date(timesheetFilters.weekDate);
      if (!Number.isNaN(anchor.getTime())) {
        const start = startOfWeek(anchor, { weekStartsOn: 1 }); // Monday
        const end = endOfWeek(anchor, { weekStartsOn: 1 }); // Sunday
        filtered = filtered.filter((item) => {
          const d = getTimesheetEntityDate(item?.entity);
          if (!d) return false;
          return isWithinInterval(d, { start, end });
        });
      }
    }

    return filtered;
  }, [timesheets, timesheetFilters.employeeName, timesheetFilters.weekDate]);

  const pagedLeaves = useMemo(() => {
    return filteredLeaves.slice(leavePage * leaveRowsPerPage, leavePage * leaveRowsPerPage + leaveRowsPerPage);
  }, [filteredLeaves, leavePage, leaveRowsPerPage]);

  const pagedOvertime = useMemo(() => {
    return filteredOvertime.slice(
      overtimePage * overtimeRowsPerPage,
      overtimePage * overtimeRowsPerPage + overtimeRowsPerPage
    );
  }, [filteredOvertime, overtimePage, overtimeRowsPerPage]);

  const pagedTimesheets = useMemo(() => {
    return filteredTimesheets.slice(
      timesheetPage * timesheetRowsPerPage,
      timesheetPage * timesheetRowsPerPage + timesheetRowsPerPage
    );
  }, [filteredTimesheets, timesheetPage, timesheetRowsPerPage]);

  const timesheetSelectableIds = useMemo(() => {
    return filteredTimesheets
      .filter((item) => isTimesheetApprovable(item?.entity))
      .map((item) => item.entityId);
  }, [filteredTimesheets]);

  const selectedTimesheetIdsSet = useMemo(() => {
    return new Set(
      selectedItems
        .filter((i) => i.entityType === "timesheet")
        .map((i) => i.entityId)
    );
  }, [selectedItems]);

  const timesheetAllSelected =
    timesheetSelectableIds.length > 0 &&
    timesheetSelectableIds.every((id) => selectedTimesheetIdsSet.has(id));

  const timesheetSomeSelected =
    timesheetSelectableIds.some((id) => selectedTimesheetIdsSet.has(id)) && !timesheetAllSelected;

  const toggleSelectAllTimesheets = (checked) => {
    if (timesheetSelectableIds.length === 0) return;

    if (checked) {
      const next = [...selectedItems];
      timesheetSelectableIds.forEach((entityId) => {
        const exists = next.some((i) => i.entityType === "timesheet" && i.entityId === entityId);
        if (!exists) next.push({ entityType: "timesheet", entityId });
      });
      setSelectedItems(next);
      return;
    }

    // Remove only the currently-filtered selectable timesheets
    setSelectedItems(
      selectedItems.filter(
        (i) => !(i.entityType === "timesheet" && timesheetSelectableIds.includes(i.entityId))
      )
    );
  };

  const {
    data: approvalHistoryData,
    loading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useApi(
    () => apiService.getApprovalHistory({
      entityType: historyFilters.entityType,
      status: historyFilters.status,
      startDate: historyFilters.startDate,
      endDate: historyFilters.endDate,
      employeeName: historyFilters.employeeName || undefined,
      projectName: historyFilters.projectName || undefined,
    }),
    [
      tabValue === 3,
      historyFilters.entityType,
      historyFilters.status,
      historyFilters.startDate,
      historyFilters.endDate,
      historyFilters.employeeName,
      historyFilters.projectName,
    ],
    tabValue === 3
  );

  // Ensure History always refreshes after filter changes (after state commit).
  useEffect(() => {
    if (tabValue !== 3) return;
    refetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tabValue,
    historyFilters.entityType,
    historyFilters.status,
    historyFilters.startDate,
    historyFilters.endDate,
    historyFilters.employeeName,
    historyFilters.projectName,
  ]);

  // Fetch employees and projects for filter dropdowns
  const { data: employeesData } = useApi(() => apiService.getEmployees(), []);
  const { data: projectsData } = useApi(() => apiService.getProjects(), []);

  const employees = useMemo(() => {
    if (!employeesData) return [];
    const data = Array.isArray(employeesData) ? employeesData : employeesData?.Result || [];
    return data.map(emp => emp.employeeName).filter(Boolean).sort();
  }, [employeesData]);

  const projects = useMemo(() => {
    if (!projectsData) return [];
    const data = Array.isArray(projectsData) ? projectsData : projectsData?.Result || [];
    return data.map(proj => proj.projectName).filter(Boolean).sort();
  }, [projectsData]);

  // Parse and enrich approval history data with entity details
  const approvalHistory = useMemo(() => {
    if (!approvalHistoryData) return [];
    // Handle both array and object with Result property
    let parsedData = [];
    if (Array.isArray(approvalHistoryData)) {
      parsedData = approvalHistoryData;
    } else {
      parsedData = approvalHistoryData?.Result || approvalHistoryData?.data?.Result || approvalHistoryData?.data || [];
    }
    
    // Apply client-side filters (in addition to backend) for consistency
    let filtered = parsedData;

    // Entity type filter
    if (historyFilters.entityType) {
      if (historyFilters.entityType === "timesheet") {
        filtered = filtered.filter((record) => {
          const t = String(record.entity_type || "").toLowerCase();
          return t === "timesheet" || t === "workdetails";
        });
      } else {
        filtered = filtered.filter(
          (record) => String(record.entity_type || "").toLowerCase() === historyFilters.entityType
        );
      }
    }

    // Status filter
    if (historyFilters.status) {
      filtered = filtered.filter((record) => String(record.status || "").toLowerCase() === historyFilters.status);
    }

    // Date range filter (created_at)
    if (historyFilters.startDate || historyFilters.endDate) {
      const start = historyFilters.startDate ? new Date(historyFilters.startDate) : null;
      const end = historyFilters.endDate ? new Date(historyFilters.endDate) : null;
      if ((start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime()))) {
        // ignore invalid dates
      } else {
        filtered = filtered.filter((record) => {
          if (!record.created_at) return false;
          const d = new Date(record.created_at);
          if (Number.isNaN(d.getTime())) return false;
          if (start && end) return isWithinInterval(d, { start, end });
          if (start) return d >= start;
          if (end) return d <= end;
          return true;
        });
      }
    }
    
    if (historyFilters.employeeName) {
      filtered = filtered.filter(record => {
        const entityEmployee = record.entityEmployeeName || '';
        return entityEmployee.toLowerCase().includes(historyFilters.employeeName.toLowerCase());
      });
    }
    
    if (historyFilters.projectName) {
      filtered = filtered.filter(record => {
        const project = record.entityProjectName || '';
        return project.toLowerCase().includes(historyFilters.projectName.toLowerCase());
      });
    }
    
    return filtered;
  }, [
    approvalHistoryData,
    historyFilters.entityType,
    historyFilters.status,
    historyFilters.startDate,
    historyFilters.endDate,
    historyFilters.employeeName,
    historyFilters.projectName,
  ]);

  const { mutate: approveEntity, loading: approving } = useMutation((data) =>
    apiService.approveEntity(data.entityType, data.entityId, {
      approverId: user?.id || 1,
      status: data.status,
      comments: data.comments,
    })
  );

  const { mutate: bulkApprove, loading: bulkApproving } = useMutation(apiService.bulkApprove);

  const handleApprove = (item, status) => {
    setSelectedItem({ ...item, status });
    setApprovalDialog(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedItem) return;

    const result = await approveEntity({
      entityType: selectedItem.entityType,
      entityId: selectedItem.entityId,
      status: selectedItem.status,
      comments,
    });

    if (result.success) {
      setApprovalDialog(false);
      setSelectedItem(null);
      setComments("");
      refetchPending();
      refetchHistory(); // Refresh history after approval
      alert(`Item ${selectedItem.status} successfully`);
    }
  };

  const handleBulkAction = async (status) => {
    if (selectedItems.length === 0) {
      alert(`Please select items to ${status}`);
      return;
    }

    // Group by entity type
    const grouped = selectedItems.reduce((acc, item) => {
      if (!acc[item.entityType]) {
        acc[item.entityType] = [];
      }
      acc[item.entityType].push(item.entityId);
      return acc;
    }, {});

    // Process each group
    let allSuccess = true;
    const errors = [];
    const results = [];

    for (const [entityType, entityIds] of Object.entries(grouped)) {
      const result = await bulkApprove({
        entityType,
        entityIds,
        status: status,
        approverId: user?.id || 1,
        comments: `Bulk ${status}`,
      });

      if (result.success) {
        // Check if all items in the result were successful
        const resultData = result.data?.Result || result.data || [];
        const failedItems = resultData.filter(r => !r.success || r.status === "error");
        if (failedItems.length > 0) {
          allSuccess = false;
          errors.push(`${entityType}: ${failedItems.length} item(s) failed`);
        }
        results.push(...resultData);
      } else {
        allSuccess = false;
        errors.push(`${entityType}: ${result.error || `Failed to ${status}`}`);
      }
    }

    if (allSuccess) {
      setSelectedItems([]);
      refetchPending();
      refetchHistory();
      alert(`Bulk ${status} completed successfully! ${selectedItems.length} item(s) ${status}.`);
    } else {
      alert(`Bulk ${status} completed with errors:\n${errors.join("\n")}`);
      // Still refresh to show updated status
      refetchPending();
      refetchHistory();
    }
  };

  const handleBulkApprove = () => handleBulkAction("approved");
  const handleBulkReject = () => handleBulkAction("rejected");

  const toggleSelectItem = (item) => {
    const exists = selectedItems.find(
      (i) => i.entityType === item.entityType && i.entityId === item.entityId
    );
    if (exists) {
      setSelectedItems(selectedItems.filter((i) => i !== exists));
    } else {
      setSelectedItems([...selectedItems, { entityType: item.entityType, entityId: item.entityId }]);
    }
  };

  if (pendingLoading || (tabValue === 3 && historyLoading)) {
    return <Loading message="Loading approvals..." />;
  }

  if (pendingError) {
    return <ErrorMessage message={pendingError?.message || pendingError} />;
  }

  if (tabValue === 3 && historyError) {
    return <ErrorMessage message={historyError?.message || historyError} />;
  }

  return (
    <Box sx={{ p: 3 }}>
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
              Approval Center
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and approve pending requests
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                refetchPending();
                if (tabValue === 3) {
                  refetchHistory();
                }
              }}
            >
              Refresh
            </Button>
            {selectedItems.length > 0 && (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  onClick={handleBulkApprove}
                  disabled={bulkApproving}
                  color="success"
                  sx={{
                    background: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #43a047 0%, #1b5e20 100%)",
                    },
                  }}
                >
                  Bulk Approve ({selectedItems.length})
                </Button>
                <Button
                  variant="contained"
                  onClick={handleBulkReject}
                  disabled={bulkApproving}
                  color="error"
                  sx={{
                    background: "linear-gradient(135deg, #f44336 0%, #c62828 100%)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #e53935 0%, #b71c1c 100%)",
                    },
                  }}
                >
                  Bulk Reject ({selectedItems.length})
                </Button>
              </Stack>
            )}
          </Stack>
        </Box>
      </Box>

      <Tabs
        value={tabValue}
        onChange={(e, newValue) => {
          setTabValue(newValue);
          // Refresh history when switching to history tab
          if (newValue === 3) {
            refetchHistory();
            setHistoryPage(0); // Reset pagination when switching to history tab
          }
        }}
        sx={{
          mb: 3,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
          },
        }}
      >
        <Tab
          icon={<Description />}
          iconPosition="start"
          label={`Leaves (${leaves.length})`}
        />
        <Tab
          icon={<AccessTime />}
          iconPosition="start"
          label={`Overtime (${overtime.length})`}
        />
        <Tab
          icon={<Assignment />}
          iconPosition="start"
          label={`Timesheets (${timesheets.length})`}
        />
        <Tab
          icon={<History />}
          iconPosition="start"
          label="History"
        />
      </Tabs>

      {/* Leaves Tab */}
      {tabValue === 0 && (
        <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <CardContent>
            {/* Leave Filters */}
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Employee</InputLabel>
                    <Select
                      value={leaveFilters.employeeName}
                      label="Employee"
                      onChange={(e) => {
                        setLeavePage(0);
                        setLeaveFilters({ ...leaveFilters, employeeName: e.target.value });
                      }}
                    >
                      <MenuItem value="">All Employees</MenuItem>
                      {employees.map((emp) => (
                        <MenuItem key={emp} value={emp}>
                          {emp}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="From"
                      value={leaveFilters.startDate ? dayjs(leaveFilters.startDate) : null}
                      onChange={(newValue) => {
                        setLeavePage(0);
                        setLeaveFilters({
                          ...leaveFilters,
                          startDate: newValue ? newValue.format("YYYY-MM-DD") : null,
                        });
                      }}
                      slotProps={{ textField: { size: "small", fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="To"
                      value={leaveFilters.endDate ? dayjs(leaveFilters.endDate) : null}
                      onChange={(newValue) => {
                        setLeavePage(0);
                        setLeaveFilters({
                          ...leaveFilters,
                          endDate: newValue ? newValue.format("YYYY-MM-DD") : null,
                        });
                      }}
                      slotProps={{ textField: { size: "small", fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setLeavePage(0);
                      setLeaveFilters({ employeeName: "", startDate: null, endDate: null });
                    }}
                  >
                    Clear
                  </Button>
                </Grid>
              </Grid>
            </Box>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell padding="checkbox" sx={{ color: "white" }}>Select</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Employee</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Leave Type</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>From</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>To</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Days</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Reason</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedLeaves.length > 0 ? (
                    pagedLeaves.map((item) => (
                      <TableRow key={item.entityId} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedItems.some(
                              (i) => i.entityType === item.entityType && i.entityId === item.entityId
                            )}
                            onChange={() => toggleSelectItem(item)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Person sx={{ fontSize: 16, color: "text.secondary" }} />
                            {item.requestedBy}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={item.entity.leaveType} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{item.entity.leaveFrom}</TableCell>
                        <TableCell>{item.entity.leaveTo}</TableCell>
                        <TableCell>{item.entity.leaveHours}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 200,
                            }}
                          >
                            {item.entity.reason}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleApprove(item, "approved")}
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
                                onClick={() => handleApprove(item, "rejected")}
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
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          {leaves.length > 0 ? "No leave requests match your filters" : "No pending leave requests"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {filteredLeaves.length > 0 && (
              <TablePagination
                component="div"
                count={filteredLeaves.length}
                page={leavePage}
                onPageChange={(event, newPage) => setLeavePage(newPage)}
                rowsPerPage={leaveRowsPerPage}
                onRowsPerPageChange={(event) => {
                  setLeaveRowsPerPage(parseInt(event.target.value, 10));
                  setLeavePage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
                labelRowsPerPage="Rows per page:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                }
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Overtime Tab */}
      {tabValue === 1 && (
        <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <CardContent>
            {/* Overtime Filters */}
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Employee</InputLabel>
                    <Select
                      value={overtimeFilters.employeeName}
                      label="Employee"
                      onChange={(e) => {
                        setOvertimePage(0);
                        setOvertimeFilters({ ...overtimeFilters, employeeName: e.target.value });
                      }}
                    >
                      <MenuItem value="">All Employees</MenuItem>
                      {employees.map((emp) => (
                        <MenuItem key={emp} value={emp}>
                          {emp}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="From"
                      value={overtimeFilters.startDate ? dayjs(overtimeFilters.startDate) : null}
                      onChange={(newValue) => {
                        setOvertimePage(0);
                        setOvertimeFilters({
                          ...overtimeFilters,
                          startDate: newValue ? newValue.format("YYYY-MM-DD") : null,
                        });
                      }}
                      slotProps={{ textField: { size: "small", fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="To"
                      value={overtimeFilters.endDate ? dayjs(overtimeFilters.endDate) : null}
                      onChange={(newValue) => {
                        setOvertimePage(0);
                        setOvertimeFilters({
                          ...overtimeFilters,
                          endDate: newValue ? newValue.format("YYYY-MM-DD") : null,
                        });
                      }}
                      slotProps={{ textField: { size: "small", fullWidth: true } }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setOvertimePage(0);
                      setOvertimeFilters({ employeeName: "", startDate: null, endDate: null });
                    }}
                  >
                    Clear
                  </Button>
                </Grid>
              </Grid>
            </Box>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell padding="checkbox" sx={{ color: "white" }}>Select</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Employee</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>OT Hours</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>OT Amount</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedOvertime.length > 0 ? (
                    pagedOvertime.map((item) => (
                      <TableRow key={item.entityId} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedItems.some(
                              (i) => i.entityType === item.entityType && i.entityId === item.entityId
                            )}
                            onChange={() => toggleSelectItem(item)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Person sx={{ fontSize: 16, color: "text.secondary" }} />
                            {item.requestedBy}
                          </Box>
                        </TableCell>
                        <TableCell>{item.entity.attendance_date}</TableCell>
                        <TableCell>
                          <Chip label={item.entity.ot_hours} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight="bold" color="success.main">
                            AED {parseFloat(item.entity.ot_amount || 0).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleApprove(item, "approved")}
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
                                onClick={() => handleApprove(item, "rejected")}
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
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          {overtime.length > 0
                            ? "No overtime requests match your filters"
                            : "No pending overtime requests"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {filteredOvertime.length > 0 && (
              <TablePagination
                component="div"
                count={filteredOvertime.length}
                page={overtimePage}
                onPageChange={(event, newPage) => setOvertimePage(newPage)}
                rowsPerPage={overtimeRowsPerPage}
                onRowsPerPageChange={(event) => {
                  setOvertimeRowsPerPage(parseInt(event.target.value, 10));
                  setOvertimePage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
                labelRowsPerPage="Rows per page:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                }
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Timesheets Tab */}
      {tabValue === 2 && (
        <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <CardContent>
            {/* Timesheet Filters */}
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Employee</InputLabel>
                    <Select
                      value={timesheetFilters.employeeName}
                      label="Employee"
                      onChange={(e) => {
                        setTimesheetPage(0);
                        setTimesheetFilters({ ...timesheetFilters, employeeName: e.target.value });
                      }}
                    >
                      <MenuItem value="">All Employees</MenuItem>
                      {employees.map((emp) => (
                        <MenuItem key={emp} value={emp}>
                          {emp}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Week"
                      value={timesheetFilters.weekDate ? dayjs(timesheetFilters.weekDate) : null}
                      onChange={(newValue) =>
                        (setTimesheetPage(0),
                        setTimesheetFilters({
                          ...timesheetFilters,
                          weekDate: newValue ? newValue.format("YYYY-MM-DD") : null,
                        }))
                      }
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      (setTimesheetPage(0),
                      setTimesheetFilters({
                        employeeName: "",
                        weekDate: null,
                      }))
                    }
                  >
                    Clear Filters
                  </Button>
                </Grid>
              </Grid>
            </Box>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell padding="checkbox" sx={{ color: "white" }}>
                      <Checkbox
                        indeterminate={timesheetSomeSelected}
                        checked={timesheetAllSelected}
                        disabled={timesheetSelectableIds.length === 0}
                        onChange={(e) => toggleSelectAllTimesheets(e.target.checked)}
                        sx={{
                          color: "white",
                          "&.Mui-checked": { color: "white" },
                          "&.MuiCheckbox-indeterminate": { color: "white" },
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Employee</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Project</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Hours</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedTimesheets.length > 0 ? (
                    pagedTimesheets.map((item) => (
                      <TableRow key={item.entityId} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedItems.some(
                              (i) => i.entityType === item.entityType && i.entityId === item.entityId
                            )}
                            disabled={!isTimesheetApprovable(item.entity)}
                            onChange={() => {
                              if (!isTimesheetApprovable(item.entity)) return;
                              toggleSelectItem(item);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Person sx={{ fontSize: 16, color: "text.secondary" }} />
                            {item.requestedBy}
                          </Box>
                        </TableCell>
                        <TableCell>{item.entity.projectName}</TableCell>
                        <TableCell>{item.entity.sentDate}</TableCell>
                        <TableCell>
                          {getTimesheetHoursCell(item.entity)}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip
                              title={
                                isTimesheetApprovable(item.entity)
                                  ? "Approve"
                                  : "Only checked-out timesheets can be approved"
                              }
                            >
                              <IconButton
                                size="small"
                                color="success"
                                disabled={!isTimesheetApprovable(item.entity)}
                                onClick={() => {
                                  if (!isTimesheetApprovable(item.entity)) return;
                                  handleApprove(item, "approved");
                                }}
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
                            <Tooltip
                              title={
                                isTimesheetApprovable(item.entity)
                                  ? "Reject"
                                  : "Only checked-out timesheets can be rejected"
                              }
                            >
                              <IconButton
                                size="small"
                                color="error"
                                disabled={!isTimesheetApprovable(item.entity)}
                                onClick={() => {
                                  if (!isTimesheetApprovable(item.entity)) return;
                                  handleApprove(item, "rejected");
                                }}
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
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          {timesheets.length > 0 ? "No timesheets match your filters" : "No pending timesheet requests"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {filteredTimesheets.length > 0 && (
              <TablePagination
                component="div"
                count={filteredTimesheets.length}
                page={timesheetPage}
                onPageChange={(event, newPage) => setTimesheetPage(newPage)}
                rowsPerPage={timesheetRowsPerPage}
                onRowsPerPageChange={(event) => {
                  setTimesheetRowsPerPage(parseInt(event.target.value, 10));
                  setTimesheetPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
                labelRowsPerPage="Rows per page:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                }
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* History Tab */}
      {tabValue === 3 && (
        <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <CardContent>
            {/* Filters */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FilterList color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Filters
                  </Typography>
                </Box>
                {approvalHistory?.length > 0 && (
                  <Chip
                    label={`Total Records: ${approvalHistory.length}`}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: "bold" }}
                  />
                )}
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Entity Type</InputLabel>
                    <Select
                      value={historyFilters.entityType}
                      label="Entity Type"
                      onChange={(e) => {
                        const value = e.target.value;
                        setHistoryPage(0);
                        setHistoryFilters((prev) => ({ ...prev, entityType: value }));
                      }}
                    >
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="leave">Leave</MenuItem>
                      <MenuItem value="overtime">Overtime</MenuItem>
                      <MenuItem value="timesheet">Timesheet</MenuItem>
                      <MenuItem value="workdetails">Work Details</MenuItem>
                      <MenuItem value="compoff">Comp-Off</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={historyFilters.status}
                      label="Status"
                      onChange={(e) => {
                        const value = e.target.value;
                        setHistoryPage(0);
                        setHistoryFilters((prev) => ({ ...prev, status: value }));
                      }}
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Start Date"
                      value={historyFilters.startDate ? dayjs(historyFilters.startDate) : null}
                      onChange={(newValue) => {
                        setHistoryPage(0);
                        setHistoryFilters((prev) => ({
                          ...prev,
                          startDate: newValue ? newValue.format("YYYY-MM-DD") : null,
                        }));
                      }}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="End Date"
                      value={historyFilters.endDate ? dayjs(historyFilters.endDate) : null}
                      onChange={(newValue) => {
                        setHistoryPage(0);
                        setHistoryFilters((prev) => ({
                          ...prev,
                          endDate: newValue ? newValue.format("YYYY-MM-DD") : null,
                        }));
                      }}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Employee</InputLabel>
                    <Select
                      value={historyFilters.employeeName}
                      label="Employee"
                      onChange={(e) => {
                        const value = e.target.value;
                        setHistoryPage(0);
                        setHistoryFilters((prev) => ({ ...prev, employeeName: value }));
                      }}
                    >
                      <MenuItem value="">All Employees</MenuItem>
                      {employees.map((emp) => (
                        <MenuItem key={emp} value={emp}>
                          {emp}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Project</InputLabel>
                    <Select
                      value={historyFilters.projectName}
                      label="Project"
                      onChange={(e) => {
                        const value = e.target.value;
                        setHistoryPage(0);
                        setHistoryFilters((prev) => ({ ...prev, projectName: value }));
                      }}
                    >
                      <MenuItem value="">All Projects</MenuItem>
                      {projects.map((proj) => (
                        <MenuItem key={proj} value={proj}>
                          {proj}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setHistoryFilters((prev) => ({
                        ...prev,
                        entityType: "",
                        status: "",
                        startDate: null,
                        endDate: null,
                        employeeName: "",
                        projectName: "",
                      }));
                      setHistoryPage(0);
                    }}
                    size="small"
                  >
                    Clear Filters
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Type</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Entity ID</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Employee</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Project</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Approver</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Level</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Comments</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {approvalHistory?.length > 0 ? (
                    approvalHistory
                      .slice(historyPage * historyRowsPerPage, historyPage * historyRowsPerPage + historyRowsPerPage)
                      .map((history) => (
                        <TableRow key={history.id} hover>
                          <TableCell>
                            <Chip label={history.entity_type} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>{history.entity_id}</TableCell>
                          <TableCell>
                            {history.entityEmployeeName ? (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Person sx={{ fontSize: 16, color: "text.secondary" }} />
                                {history.entityEmployeeName}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">N/A</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {history.entityProjectName ? (
                              <Chip label={history.entityProjectName} size="small" color="info" variant="outlined" />
                            ) : (
                              <Typography variant="body2" color="text.secondary">N/A</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Person sx={{ fontSize: 16, color: "text.secondary" }} />
                              {history.employeeName || history.approver_name || `ID: ${history.approver_id}`}
                            </Box>
                          </TableCell>
                          <TableCell>{history.approval_level}</TableCell>
                          <TableCell>
                            <Chip
                              label={history.status}
                              color={
                                history.status === "approved"
                                  ? "success"
                                  : history.status === "rejected"
                                  ? "error"
                                  : "warning"
                              }
                              size="small"
                              variant={history.status === "approved" ? "filled" : "outlined"}
                            />
                          </TableCell>
                          <TableCell>
                            {history.created_at
                              ? new Date(history.created_at).toLocaleString()
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: 200,
                              }}
                            >
                              {history.comments || "N/A"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          {historyLoading ? "Loading..." : "No approval history found"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {approvalHistory?.length > 0 && (
                <TablePagination
                  component="div"
                  count={approvalHistory.length}
                  page={historyPage}
                  onPageChange={(event, newPage) => setHistoryPage(newPage)}
                  rowsPerPage={historyRowsPerPage}
                  onRowsPerPageChange={(event) => {
                    setHistoryRowsPerPage(parseInt(event.target.value, 10));
                    setHistoryPage(0);
                  }}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  labelRowsPerPage="Rows per page:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`}
                />
              )}
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Approval Dialog */}
      <Dialog
        open={approvalDialog}
        onClose={() => {
          setApprovalDialog(false);
          setComments("");
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              {selectedItem?.status === "approved" ? "Approve" : "Reject"} {selectedItem?.entityType}
            </Typography>
            <IconButton
              onClick={() => {
                setApprovalDialog(false);
                setComments("");
              }}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Comments"
            multiline
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            placeholder="Enter approval comments (optional)"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setApprovalDialog(false);
              setComments("");
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
    </Box>
  );
};

export default ApprovalCenter;

