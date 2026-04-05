import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Stack,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  Refresh,
  TrendingUp,
  Business,
  CalendarToday,
  People,
  Assessment,
} from "@mui/icons-material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { apiService } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext";

function CrmSummary() {
  const { user } = useAuth();
  const [summaryData, setSummaryData] = useState({
    totalEntries: 0,
    totalClients: 0,
    thisMonth: 0,
    thisYear: 0,
  });
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));
  const [filterType, setFilterType] = useState("month");
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  
  // Check if user is Admin or TL (can filter by employee)
  const canFilterByEmployee = user?.role?.toLowerCase() === 'admin' || 
                              user?.role?.toLowerCase() === 'tl' || 
                              user?.role?.toLowerCase() === 'teamlead';

  useEffect(() => {
    if (canFilterByEmployee) {
      fetchEmployees();
    }
    fetchSummary();
  }, [startDate, endDate, selectedEmployeeId]);

  const fetchEmployees = async () => {
    try {
      const response = await apiService.getEmployees();
      if (response.data.Status === "Success") {
        setEmployees(response.data.Result || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
      };
      
      if (canFilterByEmployee && selectedEmployeeId) {
        params.employeeId = selectedEmployeeId;
      }

      const response = await apiService.getCrmSummary(params);

      if (response.data.Status === "Success") {
        setSummaryData(response.data.Result || summaryData);
      } else {
        alert(response.data.Error || "Error loading CRM summary");
      }
    } catch (error) {
      console.error("Error fetching CRM summary:", error);
      alert(error.response?.data?.Error || "Error loading CRM summary");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    let newStartDate, newEndDate;

    switch (type) {
      case "today":
        newStartDate = dayjs();
        newEndDate = dayjs();
        break;
      case "week":
        newStartDate = dayjs().startOf("week");
        newEndDate = dayjs().endOf("week");
        break;
      case "month":
        newStartDate = dayjs().startOf("month");
        newEndDate = dayjs().endOf("month");
        break;
      case "year":
        newStartDate = dayjs().startOf("year");
        newEndDate = dayjs().endOf("year");
        break;
      default:
        newStartDate = dayjs().startOf("month");
        newEndDate = dayjs().endOf("month");
    }

    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card
      sx={{
        height: "100%",
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`,
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" color={color}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: `${color}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon sx={{ fontSize: 40, color: color }} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            CRM Summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview and analytics of CRM entries
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchSummary}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={canFilterByEmployee ? 2 : 3}>
            <TextField
              select
              fullWidth
              label="Quick Filter"
              value={filterType}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={canFilterByEmployee ? 3 : 4}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={canFilterByEmployee ? 3 : 4}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </LocalizationProvider>
          </Grid>
          {canFilterByEmployee && (
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Employee</InputLabel>
                <Select
                  value={selectedEmployeeId}
                  label="Filter by Employee"
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                >
                  <MenuItem value="">All Employees</MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.employeeName} ({emp.EMPID})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Entries"
            value={summaryData.totalEntries || 0}
            icon={CalendarToday}
            color="#4C86F9"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Clients"
            value={summaryData.totalClients || 0}
            icon={Business}
            color="#49A84C"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="This Month"
            value={summaryData.thisMonth || 0}
            icon={TrendingUp}
            color="#f093fb"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="This Year"
            value={summaryData.thisYear || 0}
            icon={Assessment}
            color="#4facfe"
          />
        </Grid>
      </Grid>

      {/* Additional Summary Information */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Summary Details
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                <Typography variant="body2" color="text.secondary">
                  Date Range
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {startDate.format("MMM DD, YYYY")} - {endDate.format("MMM DD, YYYY")}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                <Typography variant="body2" color="text.secondary">
                  Filter Type
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default CrmSummary;

