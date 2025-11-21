import React, { useState, useEffect } from "react";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import { apiService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  Grid,
  Divider,
} from "@mui/material";
import {
  AccessTime,
  Calculate,
  CheckCircle,
  Cancel,
  Refresh,
  Settings,
  TrendingUp,
} from "@mui/icons-material";
import ErrorMessage from "./ErrorMessage";
import Loading from "./Loading";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const OvertimeManagement = () => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [calculationResult, setCalculationResult] = useState(null);

  const { data: employees, loading: employeesLoading } = useApi(apiService.getEmployees);
  const { data: otRules, loading: rulesLoading } = useApi(apiService.getOTRules);
  const { data: otRecords, loading: recordsLoading, refetch: refetchRecords } = useApi(
    () => apiService.getOTRecords({ startDate: startDate.format("YYYY-MM-DD"), endDate: endDate.format("YYYY-MM-DD") }),
    [],
    false
  );

  const { mutate: calculateOT, loading: calculating } = useMutation(apiService.calculateOvertime);
  const { mutate: approveOT, loading: approving } = useMutation((data) =>
    apiService.approveOT(data.id, { status: data.status, approverId: data.approverId, comments: data.comments })
  );

  const handleCalculate = async () => {
    if (!selectedEmployee) {
      alert("Please select an employee");
      return;
    }

    try {
      const result = await calculateOT({
        employeeId: selectedEmployee,
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
      });

      if (result.success) {
        setCalculationResult(result.data);
      } else {
        alert(result.error || "Failed to calculate overtime");
      }
    } catch (error) {
      console.error("Error calculating overtime:", error);
      alert(error.message || "An error occurred while calculating overtime");
    }
  };

  const handleApprove = async (otId, status) => {
    const approverId = user?.id || user?.employeeId || 1;
    const result = await approveOT({
      id: otId,
      status,
      approverId,
      comments: "",
    });

    if (result.success) {
      refetchRecords();
      alert(`OT ${status} successfully`);
    }
  };

  if (employeesLoading || rulesLoading) {
    return <Loading message="Loading overtime data..." />;
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
              Overtime Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Calculate, track, and approve overtime hours
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={refetchRecords}
            disabled={recordsLoading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* OT Rules Card */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Settings color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Overtime Rules
            </Typography>
          </Box>
          {otRules && otRules.length > 0 ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 2, bgcolor: "primary.light", borderRadius: 2, color: "white" }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Daily Limit
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {otRules[0].daily_hours_limit} hrs
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 2, bgcolor: "secondary.light", borderRadius: 2, color: "white" }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Weekly Limit
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {otRules[0].weekly_hours_limit} hrs
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 2, bgcolor: "warning.light", borderRadius: 2, color: "white" }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Friday Multiplier
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {otRules[0].friday_multiplier}x
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 2, bgcolor: "error.light", borderRadius: 2, color: "white" }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Holiday Multiplier
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {otRules[0].holiday_multiplier}x
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="info">No OT rules configured. Please configure OT rules first.</Alert>
          )}
        </CardContent>
      </Card>

      {/* Calculate OT */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <Calculate color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Calculate Overtime
            </Typography>
          </Box>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                label="Employee"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                SelectProps={{ native: true }}
                fullWidth
              >
                <option value="">Select Employee</option>
                {employees?.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeName} ({emp.EMPID})
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{ textField: { fullWidth: true, variant: "outlined" } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{ textField: { fullWidth: true, variant: "outlined" } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                onClick={handleCalculate}
                disabled={calculating || !selectedEmployee}
                fullWidth
                startIcon={<Calculate />}
                sx={{
                  height: "100%",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                  },
                }}
              >
                {calculating ? "Calculating..." : "Calculate OT"}
              </Button>
            </Grid>
          </Grid>

          {calculationResult && (
            <Card sx={{ mt: 2, bgcolor: "success.light", color: "white" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <TrendingUp />
                  <Typography variant="h6" fontWeight="bold">
                    Calculation Results
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total OT Hours
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {calculationResult.totalOTHours}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Daily OT
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {calculationResult.dailyOT}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Weekly OT
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {calculationResult.weeklyOT}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Estimated Amount
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      AED {calculationResult.estimatedOTAmount?.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* OT Records */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", overflow: "auto" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <AccessTime color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Overtime Records
            </Typography>
          </Box>
          {recordsLoading ? (
            <Loading />
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Employee</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Regular Hours</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>OT Hours</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>OT Type</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>OT Amount</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {otRecords?.length > 0 ? (
                    otRecords.map((record) => (
                      <TableRow key={record.id} hover>
                        <TableCell>{record.employeeName}</TableCell>
                        <TableCell>{record.attendance_date}</TableCell>
                        <TableCell>{record.regular_hours}</TableCell>
                        <TableCell>
                          <Chip label={record.ot_hours} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell>{record.ot_type}</TableCell>
                        <TableCell>
                          <Typography fontWeight="bold" color="success.main">
                            AED {parseFloat(record.ot_amount || 0).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={record.approval_status}
                            color={
                              record.approval_status === "approved"
                                ? "success"
                                : record.approval_status === "rejected"
                                ? "error"
                                : "warning"
                            }
                            size="small"
                            variant={record.approval_status === "approved" ? "filled" : "outlined"}
                          />
                        </TableCell>
                        <TableCell>
                          {record.approval_status === "pending" && (
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Tooltip title="Approve">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleApprove(record.id, "approved")}
                                  disabled={approving}
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
                                  onClick={() => handleApprove(record.id, "rejected")}
                                  disabled={approving}
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
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No overtime records found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default OvertimeManagement;

