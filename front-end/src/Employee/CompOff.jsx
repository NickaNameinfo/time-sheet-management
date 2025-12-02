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
} from "@mui/material";
import {
  EventAvailable,
  Delete,
  Add,
  Refresh,
  Work,
  AccessTime,
  Description,
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
import Loading from "../components/Loading";

const CompOff = () => {
  const { user } = useAuth();
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
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  // Fetch comp-off details filtered by employeeId
  const { data: compOffDetails, loading: compOffLoading, refetch: refetchCompOff } = useApi(
    () => apiService.getCompOffDetails({ employeeId: user?.id }),
    [user?.id],
    !!user?.id
  );

  // Use comp-off details directly (already filtered by backend)
  const rowData = useMemo(() => {
    if (!compOffDetails) return [];
    // Handle both array and object with Result property
    return Array.isArray(compOffDetails) 
      ? compOffDetails 
      : compOffDetails?.Result || compOffDetails?.data?.Result || [];
  }, [compOffDetails]);

  // Mutations
  const { mutate: applyCompOff, loading: applyingCompOff } = useMutation(apiService.applyCompOff);
  const { mutate: deleteCompOff, loading: deletingCompOff } = useMutation(
    (id) => apiService.deleteCompOff(id)
  );

  // Set user details in form
  useEffect(() => {
    if (user) {
      setValue("employeeName", user.employeeName || user.name);
      setValue("employeeId", user.id);
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
        field: "workHours",
        headerName: "Work Hours",
        minWidth: 120,
      },
      {
        field: "eligibility",
        headerName: "Compensation Eligibility",
        minWidth: 180,
      },
      {
        field: "leaveFrom",
        headerName: "Worked On",
        minWidth: 120,
        valueFormatter: (params) => {
          if (!params.value) return "";
          return dayjs(params.value).format("YYYY-MM-DD");
        },
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
          const isApproved = status === "approved";

          return (
            <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
              {!isApproved && (
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
              )}
            </Box>
          );
        },
      },
    ],
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
      filter: true,
      floatingFilter: true,
      flex: 1,
      minWidth: 100,
    }),
    []
  );

  // Handle form submission
  const onSubmit = useCallback(
    async (data) => {
      const submitData = {
        ...data,
        employeeName: user?.employeeName || user?.name,
        employeeId: user?.id,
        leaveType: "CompOff",
        approverId: data.approverId || null, // Optional: can be set during submission or approval
      };

      const result = await applyCompOff(submitData);
      if (result.success) {
        setSnackbar({
          open: true,
          message: "Comp-off request submitted successfully",
          severity: "success",
        });
        reset();
        refetchCompOff();
      } else {
        setSnackbar({
          open: true,
          message: result.error || "Failed to submit comp-off request",
          severity: "error",
        });
      }
    },
    [user, applyCompOff, reset, refetchCompOff]
  );

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!deleteDialog.id) return;

    const result = await deleteCompOff(deleteDialog.id);
    if (result.success) {
      setSnackbar({
        open: true,
        message: "Comp-off request deleted successfully",
        severity: "success",
      });
      setDeleteDialog({ open: false, id: null });
      refetchCompOff();
    } else {
      setSnackbar({
        open: true,
        message: result.error || "Failed to delete comp-off request",
        severity: "error",
      });
    }
  }, [deleteDialog.id, deleteCompOff, refetchCompOff]);

  if (compOffLoading && !rowData.length) {
    return <Loading message="Loading comp-off details..." />;
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
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Comp-Off Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Apply and manage compensation off requests
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={refetchCompOff}
            disabled={compOffLoading}
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
              Apply Comp-Off
            </Typography>
          </Box>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="comp-off-type-label">Comp Off Type</InputLabel>
                  <Controller
                    name="leaveType"
                    control={control}
                    rules={{ required: "Comp Off Type is Required" }}
                    defaultValue="CompOff"
                    render={({ field }) => (
                      <Select
                        labelId="comp-off-type-label"
                        id="comp-off-type"
                        label="Comp Off Type"
                        {...field}
                        error={Boolean(errors.leaveType)}
                      >
                        <MenuItem value={"CompOff"}>Comp Off</MenuItem>
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
                    rules={{ required: "Work Date is Required" }}
                    render={({ field }) => (
                      <DatePicker
                        label="Work Date"
                        minDate={dayjs().subtract(1, "year")}
                        maxDate={dayjs()}
                        {...field}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: Boolean(errors.leaveFrom),
                            helperText: errors.leaveFrom && errors.leaveFrom.message,
                            InputProps: {
                              startAdornment: (
                                <Work sx={{ mr: 1, color: "text.secondary" }} />
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
                <Controller
                  name="workHours"
                  control={control}
                  defaultValue=""
                  rules={{
                    required: "Work Hours is Required",
                    min: { value: 0.5, message: "Minimum 0.5 hours required" },
                  }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Work Hours"
                      variant="outlined"
                      type="number"
                      inputProps={{ step: 0.5, min: 0.5 }}
                      {...field}
                      error={Boolean(errors.workHours)}
                      helperText={errors.workHours && errors.workHours.message}
                      InputProps={{
                        startAdornment: (
                          <AccessTime sx={{ mr: 1, color: "text.secondary" }} />
                        ),
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
                  rules={{ required: "Project Details is required" }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Project Details"
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
                  startIcon={applyingCompOff ? <CircularProgress size={16} /> : <Add />}
                  disabled={applyingCompOff}
                  sx={{
                    borderRadius: 2,
                    textTransform: "uppercase",
                    fontWeight: 600,
                    px: 3,
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                      boxShadow: "0 6px 20px rgba(102, 126, 234, 0.6)",
                    },
                  }}
                >
                  {applyingCompOff ? "Submitting..." : "Submit Comp-Off Request"}
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
              Comp-off Details
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
                loading={compOffLoading}
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
            Are you sure you want to delete this comp-off request? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deletingCompOff}
            startIcon={deletingCompOff ? <CircularProgress size={16} /> : <Delete />}
          >
            {deletingCompOff ? "Deleting..." : "Delete"}
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

export default CompOff;
