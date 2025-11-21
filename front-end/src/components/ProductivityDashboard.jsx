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
  Grid,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
} from "@mui/material";
import {
  TrendingUp,
  Calculate,
  Person,
  CalendarToday,
  AccessTime,
  CheckCircle,
  Group,
} from "@mui/icons-material";
import ErrorMessage from "./ErrorMessage";
import Loading from "./Loading";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";

const ProductivityDashboard = () => {
  const { user } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState(user?.id || "");
  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));
  const [period, setPeriod] = useState("daily");

  const { data: employees } = useApi(apiService.getEmployees);
  const { data: metrics, loading: metricsLoading } = useApi(
    () =>
      apiService.getProductivityMetrics({
        employeeId: selectedEmployee,
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
      }),
    [selectedEmployee, startDate, endDate],
    false
  );

  const { data: teamProductivity, loading: teamLoading } = useApi(
    () =>
      apiService.getTeamProductivity({
        teamLeadId: user?.id,
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
      }),
    [user?.id, startDate, endDate],
    false
  );

  const { data: trends, loading: trendsLoading } = useApi(
    () =>
      apiService.getProductivityTrends({
        employeeId: selectedEmployee,
        period,
      }),
    [selectedEmployee, period],
    false
  );

  const { mutate: calculateProductivity, loading: calculating } = useMutation(
    apiService.calculateProductivity
  );

  const handleCalculate = async () => {
    if (!selectedEmployee) {
      alert("Please select an employee");
      return;
    }

    const result = await calculateProductivity({
      employeeId: selectedEmployee,
      date: dayjs().format("YYYY-MM-DD"),
    });

    if (result.success) {
      alert("Productivity calculated successfully");
    }
  };

  if (metricsLoading && teamLoading) {
    return <Loading message="Loading productivity data..." />;
  }

  const avgProductivity =
    metrics?.length > 0
      ? metrics.reduce((sum, m) => sum + parseFloat(m.productivity_score || 0), 0) / metrics.length
      : 0;

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
              Productivity Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track and analyze employee productivity metrics
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Calculate />}
            onClick={handleCalculate}
            disabled={calculating}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            {calculating ? "Calculating..." : "Calculate Today"}
          </Button>
        </Box>

        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                label="Employee"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                SelectProps={{ native: true }}
                fullWidth
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: "text.secondary" }} />,
                }}
              >
                <option value="">All Employees</option>
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
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      InputProps: {
                        startAdornment: <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />,
                      },
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      InputProps: {
                        startAdornment: <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />,
                      },
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Period</InputLabel>
                <Select value={period} onChange={(e) => setPeriod(e.target.value)} label="Period">
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Average Productivity Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <TrendingUp color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Average Productivity
                </Typography>
              </Box>
              <Typography variant="h3" color="primary" fontWeight="bold" gutterBottom>
                {avgProductivity.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={avgProductivity}
                color={avgProductivity >= 80 ? "success" : avgProductivity >= 60 ? "warning" : "error"}
                sx={{ mt: 2, height: 12, borderRadius: 6 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Team Average */}
        {teamProductivity?.teamAverage && (
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <Group color="secondary" />
                  <Typography variant="h6" fontWeight="bold">
                    Team Average
                  </Typography>
                </Box>
                <Typography variant="h3" color="secondary" fontWeight="bold" gutterBottom>
                  {teamProductivity.teamAverage.avgProductivity}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completion: {teamProductivity.teamAverage.avgCompletionRate}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={teamProductivity.teamAverage.avgProductivity}
                  color="secondary"
                  sx={{ mt: 2, height: 12, borderRadius: 6 }}
                />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Productivity Metrics Table */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <TrendingUp color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Productivity Metrics
            </Typography>
          </Box>
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "primary.main" }}>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Date</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Employee</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Total Hours</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Productive Hours</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Idle Time</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Productivity Score</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Task Completion</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metrics?.length > 0 ? (
                  metrics.map((metric) => {
                    const score = parseFloat(metric.productivity_score || 0);
                    return (
                      <TableRow key={metric.id} hover>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <CalendarToday sx={{ fontSize: 14, color: "text.secondary" }} />
                            {metric.metric_date}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Person sx={{ fontSize: 16, color: "text.secondary" }} />
                            {metric.employeeName}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <AccessTime sx={{ fontSize: 14, color: "text.secondary" }} />
                            {metric.total_hours}
                          </Box>
                        </TableCell>
                        <TableCell>{metric.productive_hours}</TableCell>
                        <TableCell>
                          <Chip label={`${metric.idle_time_minutes} min`} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography fontWeight="bold" color={score >= 80 ? "success.main" : score >= 60 ? "warning.main" : "error.main"}>
                              {score}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={score}
                              color={score >= 80 ? "success" : score >= 60 ? "warning" : "error"}
                              sx={{ width: 100, height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${metric.task_completion_rate}%`}
                            size="small"
                            color={metric.task_completion_rate >= 80 ? "success" : "default"}
                            variant={metric.task_completion_rate >= 80 ? "filled" : "outlined"}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No productivity metrics found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Team Productivity */}
      {teamProductivity && (
        <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <Group color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Team Productivity
              </Typography>
            </Box>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Employee</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Avg Productivity</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Avg Completion</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Total Hours</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Days Worked</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamProductivity.teamMetrics?.length > 0 ? (
                    teamProductivity.teamMetrics.map((member, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Person sx={{ fontSize: 16, color: "text.secondary" }} />
                            {member.employeeName}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography fontWeight="bold" color="primary">
                              {member.avgProductivity}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={member.avgProductivity}
                              sx={{ width: 80, height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${member.avgCompletionRate}%`}
                            size="small"
                            color={member.avgCompletionRate >= 80 ? "success" : "default"}
                            variant={member.avgCompletionRate >= 80 ? "filled" : "outlined"}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <AccessTime sx={{ fontSize: 14, color: "text.secondary" }} />
                            {member.totalHours}
                          </Box>
                        </TableCell>
                        <TableCell>{member.daysWorked}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No team productivity data found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ProductivityDashboard;

