import React, { useState, useEffect } from "react";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import { apiService } from "../services/api";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  IconButton,
  Grid,
  LinearProgress,
} from "@mui/material";
import {
  EventAvailable,
  Add,
  Refresh,
  Close,
  CheckCircle,
  CalendarToday,
  TrendingUp,
  Person,
  Email,
  Badge,
  Business,
} from "@mui/icons-material";
import ErrorMessage from "./ErrorMessage";
import Loading from "./Loading";
import ClockInOutCard from "./ClockInOutCard";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";

const LeaveBalance = () => {
  const { user, isHR } = useAuth();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [openDialog, setOpenDialog] = useState(false);
  const [accrualDialog, setAccrualDialog] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: "annual",
    initialBalance: 21,
    accrualAmount: 1.75,
  });

  // Fetch employees list (for HR role)
  const { data: employeesData, loading: employeesLoading } = useApi(
    () => apiService.getEmployees(),
    [],
    isHR() // Only fetch if HR
  );

  // Set default employee ID
  useEffect(() => {
    const employees = Array.isArray(employeesData) ? employeesData : employeesData?.Result || [];
    if (isHR() && employees.length > 0 && !selectedEmployeeId) {
      // HR can select any employee, default to first one
      setSelectedEmployeeId(employees[0].id);
      setSelectedEmployee(employees[0]);
    } else if (!isHR() && user?.id) {
      // Regular users see their own data
      setSelectedEmployeeId(user.id);
      setSelectedEmployee(user);
    }
  }, [isHR(), employeesData, user, selectedEmployeeId]);

  // Update selected employee when selection changes
  useEffect(() => {
    const employees = Array.isArray(employeesData) ? employeesData : employeesData?.Result || [];
    if (isHR() && employees.length > 0 && selectedEmployeeId) {
      const employee = employees.find(emp => emp.id === selectedEmployeeId);
      setSelectedEmployee(employee || null);
    }
  }, [selectedEmployeeId, employeesData, isHR]);

  const { data: leaveBalance, loading, refetch } = useApi(
    () => apiService.getLeaveBalance({ employeeId: selectedEmployeeId, year }),
    [selectedEmployeeId, year],
    !!selectedEmployeeId
  );

  const { data: accruals, refetch: refetchAccruals } = useApi(
    () => apiService.getLeaveAccruals({ employeeId: selectedEmployeeId }),
    [selectedEmployeeId],
    false
  );

  const { mutate: initializeBalance, loading: initializing } = useMutation(
    apiService.initializeLeaveBalance
  );
  const { mutate: accrueLeave, loading: accruing } = useMutation(apiService.accrueLeave);

  const handleInitialize = async () => {
    const result = await initializeBalance({
      employeeId: selectedEmployeeId,
      leaveType: formData.leaveType,
      initialBalance: formData.initialBalance,
      year,
    });

    if (result.success) {
      setOpenDialog(false);
      refetch();
      alert("Leave balance initialized successfully");
    }
  };

  const handleAccrue = async () => {
    const result = await accrueLeave({
      employeeId: selectedEmployeeId,
      leaveType: formData.leaveType,
      accrualAmount: formData.accrualAmount,
      accrualType: "monthly",
    });

    if (result.success) {
      setAccrualDialog(false);
      refetch();
      refetchAccruals();
      alert("Leave accrued successfully");
    }
  };

  if (loading || employeesLoading) {
    return <Loading message="Loading leave balance..." />;
  }

  if (!selectedEmployeeId) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          Please select an employee
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: "grey.50", minHeight: "100vh" }}>
      {/* Clock In/Out Card - Available for all users including HR */}
      <Box sx={{ mb: 3 }}>
        <ClockInOutCard />
      </Box>
      
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <Typography 
              variant="h4" 
              fontWeight="bold" 
              gutterBottom
              sx={{ 
                fontSize: { xs: "1.75rem", md: "2rem" },
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Leave Balance
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              View and manage employee leave balances
            </Typography>
          </Box>
          <Stack 
            direction="row" 
            spacing={2} 
            sx={{ 
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {isHR() && (
              <FormControl 
                sx={{ 
                  minWidth: 250,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: "white",
                  },
                }}
              >
                <InputLabel>Select Employee</InputLabel>
                <Select
                  value={selectedEmployeeId || ""}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  label="Select Employee"
                >
                  {(Array.isArray(employeesData) ? employeesData : employeesData?.Result || []).map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.employeeName || employee.userName} ({employee.EMPID || employee.id || "N/A"})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField
              type="number"
              label="Year"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              sx={{ 
                width: 120,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "white",
                },
              }}
              InputProps={{
                startAdornment: <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
              sx={{
                borderRadius: 2,
                textTransform: "uppercase",
                fontWeight: 600,
                px: 2,
                borderColor: "primary.main",
                color: "primary.main",
                "&:hover": {
                  borderColor: "primary.dark",
                  bgcolor: "primary.light",
                  color: "primary.dark",
                },
              }}
            >
              Initialize
            </Button>
            <Button
              variant="contained"
              startIcon={<TrendingUp />}
              onClick={() => setAccrualDialog(true)}
              sx={{
                borderRadius: 2,
                textTransform: "uppercase",
                fontWeight: 600,
                px: 2,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                "&:hover": {
                  background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                  boxShadow: "0 6px 20px rgba(102, 126, 234, 0.6)",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Accrue Leave
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refetch}
              sx={{
                borderRadius: 2,
                textTransform: "uppercase",
                fontWeight: 600,
                px: 2,
                borderColor: "primary.main",
                color: "primary.main",
                "&:hover": {
                  borderColor: "primary.dark",
                  bgcolor: "primary.light",
                  color: "primary.dark",
                },
              }}
            >
              Refresh
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Employee Details Card */}
      {selectedEmployee && (
        <Card 
          sx={{ 
            borderRadius: 3, 
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)", 
            mb: 3,
            bgcolor: "white",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: "primary.light",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Person sx={{ fontSize: 32, color: "primary.main" }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {selectedEmployee.employeeName || selectedEmployee.userName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Employee Details
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box 
                  sx={{ 
                    display: "flex", 
                    alignItems: "flex-start", 
                    gap: 1.5,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "grey.50",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Badge sx={{ color: "primary.main", mt: 0.5 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                      Employee ID
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="text.primary">
                      {selectedEmployee.EMPID || selectedEmployee.id || "N/A"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box 
                  sx={{ 
                    display: "flex", 
                    alignItems: "flex-start", 
                    gap: 1.5,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "grey.50",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Email sx={{ color: "primary.main", mt: 0.5 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                      Username
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="text.primary">
                      {selectedEmployee.userName || "N/A"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              {selectedEmployee.designation && (
                <Grid item xs={12} sm={6} md={3}>
                  <Box 
                    sx={{ 
                      display: "flex", 
                      alignItems: "flex-start", 
                      gap: 1.5,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "grey.50",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Business sx={{ color: "primary.main", mt: 0.5 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                        Designation
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="text.primary">
                        {selectedEmployee.designation}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
              {selectedEmployee.email && (
                <Grid item xs={12} sm={6} md={3}>
                  <Box 
                    sx={{ 
                      display: "flex", 
                      alignItems: "flex-start", 
                      gap: 1.5,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "grey.50",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Email sx={{ color: "primary.main", mt: 0.5 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                        Email
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="text.primary">
                        {selectedEmployee.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Leave Balance Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {leaveBalance?.map((balance) => {
          const usedPercent = balance.balance > 0
            ? (parseFloat(balance.used) / (parseFloat(balance.used) + parseFloat(balance.balance))) * 100
            : 0;
          return (
            <Grid item xs={12} sm={6} md={3} key={balance.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 12px 32px rgba(102, 126, 234, 0.4)",
                  },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: -50,
                    right: -50,
                    width: 150,
                    height: 150,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                <CardContent sx={{ p: 3, position: "relative", zIndex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: "rgba(255, 255, 255, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <EventAvailable sx={{ fontSize: 24 }} />
                    </Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: "1rem" }}>
                      {balance.leave_type.toUpperCase()} Leave
                    </Typography>
                  </Box>
                  <Typography 
                    variant="h3" 
                    fontWeight="bold" 
                    gutterBottom
                    sx={{ 
                      fontSize: { xs: "2rem", md: "2.5rem" },
                      mb: 2,
                    }}
                  >
                    {parseFloat(balance.balance).toFixed(2)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={usedPercent}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: "rgba(255,255,255,0.3)",
                      mb: 2,
                      "& .MuiLinearProgress-bar": {
                        bgcolor: "white",
                        borderRadius: 5,
                      },
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      opacity: 0.95,
                      fontSize: "0.875rem",
                      lineHeight: 1.6,
                    }}
                  >
                    Accrued: {parseFloat(balance.accrued).toFixed(2)} | Used: {parseFloat(balance.used).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Accrual History */}
      <Card 
        sx={{ 
          borderRadius: 3, 
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          bgcolor: "white",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box 
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 1.5, 
              mb: 3,
            }}
          >
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
              Accrual History
            </Typography>
          </Box>
          <TableContainer 
            component={Paper} 
            sx={{ 
              borderRadius: 2,
              boxShadow: "none",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Table>
              <TableHead>
                <TableRow 
                  sx={{ 
                    bgcolor: "primary.main",
                    "& .MuiTableCell-head": {
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    },
                  }}
                >
                  <TableCell>Date</TableCell>
                  <TableCell>Leave Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accruals?.length > 0 ? (
                  accruals.map((accrual, index) => (
                    <TableRow 
                      key={accrual.id} 
                      hover
                      sx={{
                        "&:nth-of-type(even)": {
                          bgcolor: "grey.50",
                        },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>
                        {new Date(accrual.accrual_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={accrual.leave_type} 
                          size="small" 
                          variant="outlined"
                          sx={{
                            fontWeight: 600,
                            borderColor: "primary.main",
                            color: "primary.main",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="bold" color="success.main" sx={{ fontSize: "1rem" }}>
                          +{parseFloat(accrual.accrual_amount).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textTransform: "capitalize", fontWeight: 500 }}>
                        {accrual.accrual_type}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                        <EventAvailable sx={{ fontSize: 48, color: "text.disabled", opacity: 0.5 }} />
                        <Typography color="text.secondary" variant="body1">
                          No accrual history found
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Initialize Balance Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              Initialize Leave Balance
            </Typography>
            <IconButton onClick={() => setOpenDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Leave Type</InputLabel>
              <Select
                value={formData.leaveType}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
              >
                <MenuItem value="annual">Annual</MenuItem>
                <MenuItem value="sick">Sick</MenuItem>
                <MenuItem value="casual">Casual</MenuItem>
                <MenuItem value="emergency">Emergency</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Initial Balance"
              type="number"
              value={formData.initialBalance}
              onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleInitialize}
            variant="contained"
            disabled={initializing}
            startIcon={<CheckCircle />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            {initializing ? "Initializing..." : "Initialize"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Accrue Leave Dialog */}
      <Dialog
        open={accrualDialog}
        onClose={() => setAccrualDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              Accrue Leave
            </Typography>
            <IconButton onClick={() => setAccrualDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Leave Type</InputLabel>
              <Select
                value={formData.leaveType}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
              >
                <MenuItem value="annual">Annual</MenuItem>
                <MenuItem value="sick">Sick</MenuItem>
                <MenuItem value="casual">Casual</MenuItem>
                <MenuItem value="emergency">Emergency</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Accrual Amount"
              type="number"
              value={formData.accrualAmount}
              onChange={(e) => setFormData({ ...formData, accrualAmount: parseFloat(e.target.value) })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAccrualDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAccrue}
            variant="contained"
            disabled={accruing}
            startIcon={<TrendingUp />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            {accruing ? "Accruing..." : "Accrue"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaveBalance;

