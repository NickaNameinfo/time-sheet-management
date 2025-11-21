import React, { useState } from "react";
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
} from "@mui/icons-material";
import ErrorMessage from "./ErrorMessage";
import Loading from "./Loading";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";

const LeaveBalance = () => {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [openDialog, setOpenDialog] = useState(false);
  const [accrualDialog, setAccrualDialog] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: "annual",
    initialBalance: 21,
    accrualAmount: 1.75,
  });

  const { data: leaveBalance, loading, refetch } = useApi(
    () => apiService.getLeaveBalance({ employeeId: user?.id, year }),
    [user?.id, year]
  );

  const { data: accruals, refetch: refetchAccruals } = useApi(
    () => apiService.getLeaveAccruals({ employeeId: user?.id }),
    [user?.id],
    false
  );

  const { mutate: initializeBalance, loading: initializing } = useMutation(
    apiService.initializeLeaveBalance
  );
  const { mutate: accrueLeave, loading: accruing } = useMutation(apiService.accrueLeave);

  const handleInitialize = async () => {
    const result = await initializeBalance({
      employeeId: user?.id,
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
      employeeId: user?.id,
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

  if (loading) {
    return <Loading message="Loading leave balance..." />;
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
              Leave Balance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage employee leave balances
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <TextField
              type="number"
              label="Year"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              sx={{ width: 120 }}
              InputProps={{
                startAdornment: <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
            >
              Initialize
            </Button>
            <Button
              variant="contained"
              startIcon={<TrendingUp />}
              onClick={() => setAccrualDialog(true)}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                },
              }}
            >
              Accrue Leave
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refetch}
            >
              Refresh
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Leave Balance Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {leaveBalance?.map((balance) => {
          const usedPercent = balance.balance > 0
            ? (parseFloat(balance.used) / (parseFloat(balance.used) + parseFloat(balance.balance))) * 100
            : 0;
          return (
            <Grid item xs={12} sm={6} md={3} key={balance.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <EventAvailable />
                    <Typography variant="h6" fontWeight="bold">
                      {balance.leave_type.toUpperCase()} Leave
                    </Typography>
                  </Box>
                  <Typography variant="h3" fontWeight="bold" gutterBottom>
                    {parseFloat(balance.balance).toFixed(2)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={usedPercent}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: "rgba(255,255,255,0.3)",
                      mb: 1,
                      "& .MuiLinearProgress-bar": {
                        bgcolor: "white",
                      },
                    }}
                  />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Accrued: {parseFloat(balance.accrued).toFixed(2)} | Used: {parseFloat(balance.used).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Accrual History */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <EventAvailable color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Accrual History
            </Typography>
          </Box>
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "primary.main" }}>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Date</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Leave Type</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Amount</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accruals?.length > 0 ? (
                  accruals.map((accrual) => (
                    <TableRow key={accrual.id} hover>
                      <TableCell>{accrual.accrual_date}</TableCell>
                      <TableCell>
                        <Chip label={accrual.leave_type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="bold" color="success.main">
                          {accrual.accrual_amount}
                        </Typography>
                      </TableCell>
                      <TableCell>{accrual.accrual_type}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No accrual history found</Typography>
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

