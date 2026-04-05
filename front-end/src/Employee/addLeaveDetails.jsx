import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Chip,
} from "@mui/material";
import {
  EventAvailable,
  Delete,
  Add,
  Refresh,
  CalendarToday,
  AccessTime,
  Description,
  Cancel,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { apiService } from "../services/api";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";

const AddLeaveDetails = () => {
  const { user } = useAuth();
  const location = useLocation();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm();
  const formData = watch();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [validationMessage, setValidationMessage] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  // Fetch leave details (filtered by employeeId)
  const {
    data: leaveDetails,
    loading: leaveLoading,
    error: leaveError,
    refetch: refetchLeaves,
  } = useApi(
    // Backend can resolve employee from JWT; employeeId param is optional.
    () => apiService.getLeaveDetails(user?.id ? { employeeId: user.id } : undefined),
    [user?.id, token],
    !!token
  );

  // Fetch leave balance from API
  const currentYear = new Date().getFullYear();
  const {
    data: leaveBalanceData,
    loading: balanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useApi(
    // Backend can resolve employee from JWT; employeeId param is optional.
    () => apiService.getLeaveBalance({ ...(user?.id ? { employeeId: user.id } : {}), year: currentYear }),
    [user?.id, currentYear, token],
    !!token
  );

  // Ensure balance loads automatically once user is available (some sessions require an explicit refetch)
  useEffect(() => {
    if (token && leaveBalanceData == null && !balanceLoading) {
      refetchBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, leaveBalanceData, balanceLoading]);

  // When user returns to this route, aggressively refresh both leaves and balances.
  useEffect(() => {
    const onAddLeaveRoute = location.pathname?.toLowerCase().includes("/dashboard/addleaves");
    if (token && onAddLeaveRoute) {
      refetchLeaves();
      refetchBalance();
    }
  }, [location.pathname, token, refetchLeaves, refetchBalance]);

  // If API failed (network / 401 / etc.), do a single retry when coming back to this screen.
  const hasRetriedRef = React.useRef(false);
  useEffect(() => {
    const onAddLeaveRoute = location.pathname?.toLowerCase().includes("/dashboard/addleaves");
    if (!token || !onAddLeaveRoute) return;
    if (hasRetriedRef.current) return;
    if (leaveError || balanceError) {
      hasRetriedRef.current = true;
      refetchLeaves();
      refetchBalance();
    }
  }, [location.pathname, token, leaveError, balanceError, refetchLeaves, refetchBalance]);

  // Also refetch when tab regains focus/visibility after navigating around.
  useEffect(() => {
    if (!token) return undefined;

    const refreshAll = () => {
      refetchLeaves();
      refetchBalance();
    };

    const handleFocus = () => refreshAll();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshAll();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [token, refetchLeaves, refetchBalance]);

  const apiErrorMessage = useMemo(() => {
    const e = leaveError || balanceError;
    if (!e) return null;
    if (typeof e === "string") return e;
    if (typeof e?.message === "string") return e.message;
    return "Failed to load leave data. Please try Refresh.";
  }, [leaveError, balanceError]);

  // Use leave details directly (already filtered by backend)
  const rowData = useMemo(() => {
    if (!leaveDetails) return [];
    // Handle both array and object with Result property
    return Array.isArray(leaveDetails) 
      ? leaveDetails 
      : leaveDetails?.Result || leaveDetails?.data?.Result || [];
  }, [leaveDetails]);


  // Mutations
  const { mutate: applyLeave, loading: applyingLeave } = useMutation(apiService.applyLeave);
  const { mutate: updateLeave, loading: updatingLeave } = useMutation(
    (params) => apiService.updateLeave(params.id, params.data)
  );
  const { mutate: deleteLeave, loading: deletingLeave } = useMutation(
    (id) => apiService.deleteLeave(id)
  );

  // Calculate days between two dates (inclusive)
  const calculateLeaveDays = useCallback((fromDate, toDate) => {
    if (!fromDate || !toDate) return 0;
    
    const start = dayjs(fromDate);
    const end = dayjs(toDate);
    
    if (end.isBefore(start)) return 0;
    
    // Calculate difference in days (inclusive, so add 1)
    const days = end.diff(start, "day") + 1;
    
    return days;
  }, []);

  // Auto-calculate leave days when dates change
  useEffect(() => {
    if (formData?.leaveFrom && formData?.leaveTo) {
      const calculatedDays = calculateLeaveDays(formData.leaveFrom, formData.leaveTo);
      if (calculatedDays > 0) {
        setValue("leaveHours", calculatedDays.toString());
      }
    } else if (!formData?.leaveFrom || !formData?.leaveTo) {
      // Clear leave hours if dates are not complete
      setValue("leaveHours", "");
    }
  }, [formData?.leaveFrom, formData?.leaveTo, calculateLeaveDays, setValue]);

  // Set user details in form
  useEffect(() => {
    if (user) {
      setValue("employeeName", user.employeeName || user.name);
      setValue("employeeId", user?.id);
    }
  }, [user, setValue]);

  // Column definitions for AG Grid
  const columnDefs = useMemo(
    () => [
      {
        field: "employeeName",
        headerName: "Employee Name",
        minWidth: 170,
      },
      {
        field: "employeeId",
        headerName: "Employee ID",
        minWidth: 120,
      },
      {
        field: "leaveType",
        headerName: "Leave Type",
        minWidth: 130,
      },
      {
        field: "leaveFrom",
        headerName: "Leave From",
        minWidth: 120,
        valueFormatter: (params) => {
          if (!params.value) return "";
          return dayjs(params.value).format("YYYY-MM-DD");
        },
      },
      {
        field: "leaveTo",
        headerName: "Leave To",
        minWidth: 120,
        valueFormatter: (params) => {
          if (!params.value) return "";
          return dayjs(params.value).format("YYYY-MM-DD");
        },
      },
      {
        field: "leaveHours",
        headerName: "No of Days",
        minWidth: 100,
      },
      {
        field: "reason",
        headerName: "Reason",
        minWidth: 200,
        flex: 1,
      },
      {
        field: "leaveStatus",
        headerName: "Approval Status",
        minWidth: 140,
        cellRenderer: (params) => {
          const status = params.value?.toLowerCase();
          if (status === "approved") {
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "success.main",
                  }}
                />
                <Typography variant="body2" color="success.main">
                  Approved
                </Typography>
              </Box>
            );
          } else if (status === "rejected") {
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "error.main",
                  }}
                />
                <Typography variant="body2" color="error.main">
                  Rejected
                </Typography>
              </Box>
            );
          }
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "warning.main",
                }}
              />
              <Typography variant="body2" color="warning.main">
                Pending
              </Typography>
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
        cellRenderer: (params) => {
          const status = params?.data?.leaveStatus?.toLowerCase();
          const hasStatus = status && status !== "";

          return (
            <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
              {!hasStatus ? (
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteDialog({ open: true, id: params?.data?.id })}
                    sx={{
                      "&:hover": {
                        bgcolor: "error.light",
                        color: "white",
                      },
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Box>
          );
        },
      },
    ],
    [updatingLeave]
  );

  const defaultColDef = useMemo(
    () => ({
      editable: false,
      enableRowGroup: true,
      enablePivot: true,
      enableValue: true,
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter: true,
      flex: 1,
      minWidth: 100,
    }),
    []
  );

  // Get leave balance from API data
  const getLeaveBalance = useCallback(() => {
    // Handle API response format: { Status: "Success", Result: [...] }
    // useApi hook returns the Result array directly if Status is "Success"
    let balanceArray = [];
    
    if (Array.isArray(leaveBalanceData)) {
      balanceArray = leaveBalanceData;
    } else if (leaveBalanceData?.Result && Array.isArray(leaveBalanceData.Result)) {
      balanceArray = leaveBalanceData.Result;
    }

    if (!balanceArray || balanceArray.length === 0) {
      return {
        vacationLeave: 0,
        sickLeave: 0,
        earnedLeave: 0,
        emergencyLeave: 0,
        compOffLeave: 0,
      };
    }

    // Map API response to expected format
    // API returns: leave_type can be "annual", "sick", "casual", "emergency"
    const balanceMap = {};
    balanceArray.forEach((item) => {
      const leaveType = (item.leave_type || "").toLowerCase().trim();
      const balance = parseFloat(item.balance || 0) || 0;
      
      // Map API leave types to form leave types
      if (leaveType === "casual") {
        balanceMap.vacationLeave = balance; // Casual Leave
      } else if (leaveType === "sick") {
        balanceMap.sickLeave = balance; // Sick Leave
      } else if (leaveType === "annual") {
        balanceMap.earnedLeave = balance; // Earned Leave (annual)
      } else if (leaveType === "emergency") {
        balanceMap.emergencyLeave = balance; // Emergency Leave
      }
      // Note: Comp-off might not be in the leave balance API, it could be separate
    });

    return {
      vacationLeave: balanceMap.vacationLeave || 0,
      sickLeave: balanceMap.sickLeave || 0,
      earnedLeave: balanceMap.earnedLeave || 0,
      emergencyLeave: balanceMap.emergencyLeave || 0,
      compOffLeave: balanceMap.compOffLeave || 0,
    };
  }, [leaveBalanceData]);

  // Validate leave balance
  const validateLeaveBalance = useCallback(
    (leaveType, leaveHours) => {
      if (balanceLoading) {
        return null; // Don't validate while loading
      }

      const balance = getLeaveBalance();
      const hours = Number(leaveHours);

      // Map form leave types to API leave types
      const leaveTypeMap = {
        ANNUAL: {
          balance: balance.earnedLeave,
          name: "ANNUAL",
          apiType: "annual",
        },
        CASUAL: {
          balance: balance.vacationLeave,
          name: "CASUAL",
          apiType: "casual",
        },
        EMERGENCY: {
          balance: balance.emergencyLeave ?? 0,
          name: "EMERGENCY",
          apiType: "emergency",
        },
        SICK: {
          balance: balance.sickLeave,
          name: "SICK",
          apiType: "sick",
        },
        COMP_OFF: {
          balance: balance.sickLeave,
          name: "COMP OFF", // Capitalize the first letter
          apiType: "comp_off",
        },
      };

      const leaveInfo = leaveTypeMap[leaveType];
      if (!leaveInfo) return null;

      if (leaveInfo.balance === 0 || hours > leaveInfo.balance) {
        return `You don't have sufficient ${leaveInfo.name} balance (Available: ${leaveInfo.balance} days). Select the LOP option or check the leave balance.`;
      }

      return null;
    },
    [getLeaveBalance, balanceLoading]
  );

  // Prevent duplicate/overlapping leave applications for the same employee.
  const hasLeaveDateConflict = useCallback(
    (fromDate, toDate) => {
      if (!fromDate || !toDate) return false;
      const nextFrom = dayjs(fromDate).startOf("day");
      const nextTo = dayjs(toDate).endOf("day");
      if (!nextFrom.isValid() || !nextTo.isValid()) return false;

      return rowData.some((row) => {
        const status = String(row?.leaveStatus || "").trim().toLowerCase();
        // Allow re-apply only for terminal states.
        if (status === "rejected" || status === "canceled") return false;

        const existingFrom = dayjs(row?.leaveFrom).startOf("day");
        const existingTo = dayjs(row?.leaveTo || row?.leaveFrom).endOf("day");
        if (!existingFrom.isValid() || !existingTo.isValid()) return false;

        // Overlap check: A starts before/equal B end && A end after/equal B start
        return (
          !nextFrom.isAfter(existingTo, "day") &&
          !nextTo.isBefore(existingFrom, "day")
        );
      });
    },
    [rowData]
  );

  // Handle form submission
  const onSubmit = useCallback(
    async (data) => {
      setValidationMessage("");

      if (hasLeaveDateConflict(data.leaveFrom, data.leaveTo)) {
        const msg = "Leave already applied for selected date range. Please choose different dates.";
        setValidationMessage(msg);
        setSnackbar({
          open: true,
          message: msg,
          severity: "error",
        });
        return;
      }

      const balanceError = validateLeaveBalance(data.leaveType, data.leaveHours);
      if (balanceError) {
        setValidationMessage(balanceError);
        setSnackbar({
          open: true,
          message: balanceError,
          severity: "error",
        });
        return;
      }

      const submitData = {
        ...data,
        employeeName: user?.employeeName || user?.name,
        employeeId: user?.id,
        approverId: data.approverId || null, // Optional: can be set during submission or approval
      };

      const result = await applyLeave(submitData);
      if (result.success) {
        setValidationMessage("");
        setSnackbar({
          open: true,
          message: "Leave request submitted successfully",
          severity: "success",
        });
        reset();
        refetchLeaves();
        refetchBalance(); // Refresh leave balance after submission
      } else {
        setSnackbar({
          open: true,
          message: result.error || "Failed to submit leave request",
          severity: "error",
        });
      }
    },
    [user, applyLeave, validateLeaveBalance, hasLeaveDateConflict, reset, refetchLeaves, refetchBalance]
  );

  // Handle cancel request
  const handleCancelRequest = useCallback(
    async (params) => {
      const updateData = {
        ...params.data,
        approvedDate: new Date(),
        leaveStatus: "Cancel Request",
      };

      const result = await updateLeave({ id: params.data.id, data: updateData });
      if (result.success) {
        setSnackbar({
          open: true,
          message: "Leave request cancelled successfully",
          severity: "success",
        });
        refetchLeaves();
      } else {
        setSnackbar({
          open: true,
          message: result.error || "Failed to cancel leave request",
          severity: "error",
        });
      }
    },
    [updateLeave, refetchLeaves]
  );

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!deleteDialog.id) return;

    const result = await deleteLeave(deleteDialog.id);
    if (result.success) {
      setSnackbar({
        open: true,
        message: "Leave request deleted successfully",
        severity: "success",
      });
      setDeleteDialog({ open: false, id: null });
      refetchLeaves();
    } else {
      setSnackbar({
        open: true,
        message: result.error || "Failed to delete leave request",
        severity: "error",
      });
    }
  }, [deleteDialog.id, deleteLeave, refetchLeaves]);

  if (apiErrorMessage && !rowData.length && leaveBalanceData == null) {
    return (
      <ErrorMessage
        message={apiErrorMessage}
        onRetry={() => {
          refetchLeaves();
          refetchBalance();
        }}
      />
    );
  }

  if ((leaveLoading || balanceLoading) && !rowData.length) {
    return <Loading message="Loading leave details..." />;
  }

  return (
    <Box sx={{ p: 3, bgcolor: "grey.50", minHeight: "100vh" }}>
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
            <Typography
              variant="h4"
              fontWeight="bold"
              gutterBottom
              sx={{
                background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Apply Leave
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Submit and manage your leave requests
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={refetchLeaves}
            disabled={leaveLoading}
            sx={{
              borderRadius: 2,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Form Card */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "primary.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <EventAvailable sx={{ color: "primary.main", fontSize: 24 }} />
            </Box>
            <Typography variant="h6" fontWeight="bold">
              Leave Application Form
            </Typography>
          </Box>

          {/* Available leaves */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: (t) => (t.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(76,134,249,0.04)"),
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <Typography variant="subtitle2" fontWeight={800}>
                Available leaves
              </Typography>
              <Button size="small" variant="text" onClick={refetchBalance} disabled={balanceLoading}>
                {balanceLoading ? "Loading…" : "Refresh balance"}
              </Button>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
              {(() => {
                const b = getLeaveBalance();
                const hasLoaded = leaveBalanceData != null && !balanceLoading;
                const selected = String(formData?.leaveType || "").trim().toUpperCase();
                const items = [
                  { key: "ANNUAL", label: "ANNUAL", value: b.earnedLeave },
                  { key: "CASUAL", label: "CASUAL", value: b.vacationLeave },
                  { key: "EMERGENCY", label: "EMERGENCY", value: b.emergencyLeave },
                  { key: "SICK", label: "SICK", value: b.sickLeave },
                ];
                return items.map((it) => (
                  <Chip
                    key={it.key}
                    label={`${it.label}: ${hasLoaded ? Number(it.value || 0) : "…"}`}
                    color={selected === it.key ? "primary" : "default"}
                    variant={selected === it.key ? "filled" : "outlined"}
                    sx={{ fontWeight: 800 }}
                  />
                ));
              })()}
            </Box>
          </Paper>
          <form onSubmit={handleSubmit(onSubmit)}>
            {validationMessage ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {validationMessage}
              </Alert>
            ) : null}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="leave-type-label">Leave Type</InputLabel>
                  <Controller
                    name="leaveType"
                    control={control}
                    rules={{ required: "Leave Type is Required" }}
                    defaultValue=""
                    render={({ field }) => (
                      <Select
                        labelId="leave-type-label"
                        id="leave-type"
                        label="Leave Type"
                        {...field}
                        error={Boolean(errors.leaveType)}
                      >
                        <MenuItem value={"ANNUAL"}>ANNUAL</MenuItem>
                        <MenuItem value={"CASUAL"}>CASUAL</MenuItem>
                        <MenuItem value={"EMERGENCY"}>EMERGENCY</MenuItem>
                        <MenuItem value={"SICK"}>SICK</MenuItem>
                        <MenuItem value={"COMP_OFF"}>COMP OFF</MenuItem>
                      </Select>
                    )}
                  />
                  <FormHelperText error={Boolean(errors.leaveType)}>
                    {errors.leaveType && errors.leaveType.message}
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name="leaveFrom"
                    control={control}
                    rules={{ required: "Leave From date is Required" }}
                    render={({ field }) => (
                      <DatePicker
                        label="Leave From"
                        {...field}
                        minDate={dayjs()}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: Boolean(errors.leaveFrom),
                            helperText: errors.leaveFrom && errors.leaveFrom.message,
                            InputProps: {
                              startAdornment: (
                                <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />
                              ),
                            },
                          },
                        }}
                        onChange={(newValue) => {
                          setValue("leaveFrom", dayjs(newValue).format("YYYY-MM-DD"));
                        }}
                        format="YYYY-MM-DD"
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name="leaveTo"
                    control={control}
                    rules={{ required: "Leave To date is Required" }}
                    render={({ field }) => (
                      <DatePicker
                        minDate={formData?.leaveFrom ? dayjs(formData.leaveFrom) : dayjs()}
                        label="Leave To"
                        {...field}
                        disabled={!formData?.leaveFrom}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: Boolean(errors.leaveTo),
                            helperText: errors.leaveTo && errors.leaveTo.message,
                            InputProps: {
                              startAdornment: (
                                <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />
                              ),
                            },
                          },
                        }}
                        onChange={(newValue) => {
                          setValue("leaveTo", dayjs(newValue).format("YYYY-MM-DD"));
                        }}
                        format="YYYY-MM-DD"
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  control={control}
                  name="leaveHours"
                  defaultValue=""
                  rules={{
                    required: "Leave Days is required",
                    min: { value: 1, message: "Minimum 1 day required" },
                  }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Leave Days (Auto-calculated)"
                      variant="outlined"
                      type="number"
                      inputProps={{ step: 1, min: 1, readOnly: formData?.leaveFrom && formData?.leaveTo }}
                      {...field}
                      disabled={formData?.leaveFrom && formData?.leaveTo}
                      error={Boolean(errors.leaveHours)}
                      helperText={
                        formData?.leaveFrom && formData?.leaveTo
                          ? "Automatically calculated from selected dates"
                          : errors.leaveHours && errors.leaveHours.message
                      }
                      InputProps={{
                        startAdornment: (
                          <AccessTime sx={{ mr: 1, color: "text.secondary" }} />
                        ),
                      }}
                      sx={{
                        "& .MuiInputBase-input:disabled": {
                          WebkitTextFillColor: "rgba(0, 0, 0, 0.87)",
                          bgcolor: "action.disabledBackground",
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  control={control}
                  name="reason"
                  defaultValue=""
                  rules={{ required: "Reason is required" }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Reason"
                      variant="outlined"
                      multiline
                      rows={3}
                      {...field}
                      error={Boolean(errors.reason)}
                      helperText={errors.reason && errors.reason.message}
                      InputProps={{
                        startAdornment: (
                          <Description
                            sx={{
                              mr: 1,
                              color: "text.secondary",
                              alignSelf: "flex-start",
                              mt: 1,
                            }}
                          />
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={applyingLeave ? <CircularProgress size={16} /> : <Add />}
                  disabled={applyingLeave}
                  sx={{
                    borderRadius: 2,
                    textTransform: "uppercase",
                    fontWeight: 600,
                    px: 3,
                    background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
                    boxShadow: "0 4px 15px rgba(76, 134, 249, 0.4)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
                      boxShadow: "0 6px 20px rgba(76, 134, 249, 0.6)",
                    },
                  }}
                >
                  {applyingLeave ? "Submitting..." : "Submit Leave Request"}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Grid Card */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "primary.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <EventAvailable sx={{ color: "primary.main", fontSize: 24 }} />
            </Box>
            <Typography variant="h6" fontWeight="bold">
              Leave Details
            </Typography>
          </Box>
          <Box sx={{ width: "100%", height: "500px" }}>
            <div style={{ width: "100%", height: "100%" }} className="ag-theme-alpine">
              <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                suppressRowClickSelection={true}
                rowSelection={"single"}
                pagination={true}
                paginationPageSize={10}
                animateRows={true}
                loading={leaveLoading}
              />
            </div>
          </Box>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this leave request? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deletingLeave}
            startIcon={deletingLeave ? <CircularProgress size={16} /> : <Delete />}
          >
            {deletingLeave ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddLeaveDetails;
