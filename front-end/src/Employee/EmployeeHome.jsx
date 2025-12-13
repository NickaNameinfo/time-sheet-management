import React, { useEffect, useState, useCallback, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Button,
  Chip,
  Snackbar,
  Alert,
  IconButton,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  EventAvailable,
  LocalHospital,
  BeachAccess,
  Work,
  CalendarToday,
  AccessTime,
  Login,
  Logout,
  Close,
  Refresh,
} from "@mui/icons-material";
import { apiService } from "../services/api";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

const EmployeeHome = () => {
  const { user } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [weekData, setWeekData] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [timeSheetLoading, setTimeSheetLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clockInDialog, setClockInDialog] = useState(false);
  const [clockOutDialog, setClockOutDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [clockInData, setClockInData] = useState({
    projectName: "",
    referenceNo: "",
    areaOfWork: "",
  });
  const [todayClockStatus, setTodayClockStatus] = useState(null);
  const [todayHours, setTodayHours] = useState(0);
  const [todayTimeFormatted, setTodayTimeFormatted] = useState("0:00:00");

  // Generate week numbers (1-52)
  const weekNumberList = useMemo(() => Array.from({ length: 52 }, (_, i) => i + 1), []);

  // Fetch leave balance from API
  const currentYear = new Date().getFullYear();
  const { data: leaveBalanceData, loading: balanceLoading, refetch: refetchBalance } = useApi(
    () => apiService.getLeaveBalance({ employeeId: user?.id, year: currentYear }),
    [user?.id, currentYear],
    !!user?.id
  );

  // Fetch approved leave details to calculate used leaves (filtered by employeeId)
  const { data: leaveDetails, loading: leaveLoading } = useApi(
    () => apiService.getLeaveDetails({ employeeId: user?.id }),
    [user?.id],
    !!user?.id
  );

  // Fetch approved comp-off details
  const { data: compOffDetails, loading: compOffLoading } = useApi(
    () => apiService.getCompOffDetails({ employeeId: user?.id }),
    [user?.id],
    !!user?.id
  );

  // Fetch today's clock status
  const { data: todayWorkDetails, loading: clockStatusLoading, refetch: refetchClockStatus } = useApi(
    () => {
      if (!user?.id) return Promise.resolve({ data: { Status: "Success", Result: [] } });
      const today = new Date().toISOString().split('T')[0];
      return apiService.getWorkDetails({ 
        employeeId: user.id,
        startDate: today,
        endDate: today 
      });
    },
    [user?.id],
    !!user?.id
  );

  // Parse today's work details
  const todayWorkDetailsList = useMemo(() => {
    if (!todayWorkDetails) return [];
    if (Array.isArray(todayWorkDetails)) return todayWorkDetails;
    return todayWorkDetails?.Result || todayWorkDetails?.data?.Result || [];
  }, [todayWorkDetails]);

  // Format time as HH:MM:SS
  const formatTime = useCallback((totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);

  // Check for active clock-in
  useEffect(() => {
    if (todayWorkDetailsList.length > 0) {
      const activeClockIn = todayWorkDetailsList.find(
        (item) => item.status === 'active' || (!item.status && item.totalHours === null)
      );
      if (activeClockIn) {
        // Use clockInTime column (preferred) or sentDate as fallback
        const clockInTime = activeClockIn.clockInTime || activeClockIn.sentDate;
        setTodayClockStatus({
          id: activeClockIn.id,
          clockInTime: clockInTime,
          status: 'active',
        });
        // Calculate initial hours immediately if clocked in using UTC
        if (clockInTime) {
          const clockInDate = new Date(clockInTime);
          const nowUtc = new Date();
          // Calculate difference in UTC milliseconds
          const diffMs = Math.max(0, nowUtc.getTime() - clockInDate.getTime());
          const totalSeconds = Math.floor(diffMs / 1000);
          const hours = totalSeconds / 3600.0; // Use seconds for accurate calculation
          setTodayHours(hours);
          setTodayTimeFormatted(formatTime(totalSeconds));
        }
      } else {
        // Check for completed clock-out today
        const completedToday = todayWorkDetailsList.find(
          (item) => item.status === 'completed' && item.totalHours
        );
        if (completedToday) {
          // Use clockInTime and clockOutTime columns (preferred) for accurate calculation
          const clockInTime = completedToday.clockInTime || completedToday.sentDate;
          const clockOutTime = completedToday.clockOutTime || completedToday.approvedDate;
          
          setTodayClockStatus({
            id: completedToday.id,
            clockInTime: clockInTime,
            clockOutTime: clockOutTime,
            status: 'completed',
          });
          
          // Calculate hours using check-in and check-out datetime (most accurate)
          let hours = 0;
          if (clockInTime && clockOutTime) {
            try {
              const clockInDate = new Date(clockInTime);
              const clockOutDate = new Date(clockOutTime);
              if (!isNaN(clockInDate.getTime()) && !isNaN(clockOutDate.getTime())) {
                // Calculate difference in UTC milliseconds
                const diffMs = clockOutDate.getTime() - clockInDate.getTime();
                const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
                hours = totalSeconds / 3600.0; // Use seconds for accurate calculation
              }
            } catch (e) {
              console.error('Error calculating hours from datetime:', e);
              // Fallback to backend totalHours
              hours = parseFloat(completedToday.totalHours) || 0;
            }
          } else {
            // Fallback to backend totalHours if datetime not available
            hours = parseFloat(completedToday.totalHours) || 0;
          }
          
          setTodayHours(hours);
          const totalSeconds = Math.floor(hours * 3600);
          setTodayTimeFormatted(formatTime(totalSeconds));
        } else {
          setTodayClockStatus(null);
          setTodayHours(0);
          setTodayTimeFormatted("0:00:00");
        }
      }
    } else {
      setTodayClockStatus(null);
      setTodayHours(0);
      setTodayTimeFormatted("0:00:00");
    }
  }, [todayWorkDetailsList, formatTime]);

  // Update today's hours every second if clocked in (real-time timer)
  useEffect(() => {
    if (todayClockStatus?.status === 'active' && todayClockStatus?.clockInTime) {
      // Calculate immediately using UTC for accuracy
      const calculateHours = () => {
        const clockInDate = new Date(todayClockStatus.clockInTime);
        const nowUtc = new Date();
        // Calculate difference in UTC milliseconds
        const diffMs = Math.max(0, nowUtc.getTime() - clockInDate.getTime());
        const totalSeconds = Math.floor(diffMs / 1000);
        const hours = totalSeconds / 3600.0; // Use seconds for accurate calculation
        
        setTodayHours(hours);
        setTodayTimeFormatted(formatTime(totalSeconds));
      };

      // Calculate immediately on mount
      calculateHours();

      // Then update every second for real-time display
      const interval = setInterval(calculateHours, 1000); // Update every second

      return () => clearInterval(interval);
    } else if (todayClockStatus?.status === 'completed') {
      // For completed clock-out, calculate from clockInTime and clockOutTime
      if (todayClockStatus.clockInTime && todayClockStatus.clockOutTime) {
        try {
          const clockInDate = new Date(todayClockStatus.clockInTime);
          const clockOutDate = new Date(todayClockStatus.clockOutTime);
          const diffMs = clockOutDate.getTime() - clockInDate.getTime();
          const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
          const hours = totalSeconds / 3600.0;
          setTodayHours(hours);
          setTodayTimeFormatted(formatTime(totalSeconds));
        } catch (e) {
          // Fallback to existing hours
          const totalSeconds = Math.floor(todayHours * 3600);
          setTodayTimeFormatted(formatTime(totalSeconds));
        }
      } else {
        // Fallback to existing hours
        const totalSeconds = Math.floor(todayHours * 3600);
        setTodayTimeFormatted(formatTime(totalSeconds));
      }
    } else {
      setTodayTimeFormatted("0:00:00");
    }
  }, [todayClockStatus, formatTime, todayHours]);

  // Fetch projects and area of work for clock-in form
  const { data: projects } = useApi(apiService.getProjects);
  const { data: areaOfWork } = useApi(apiService.getAreaOfWork);

  const projectsList = useMemo(() => {
    if (!projects) return [];
    if (Array.isArray(projects)) return projects;
    return projects?.Result || projects?.data?.Result || [];
  }, [projects]);

  const areaOfWorkList = useMemo(() => {
    if (!areaOfWork) return [];
    if (Array.isArray(areaOfWork)) return areaOfWork;
    return areaOfWork?.Result || areaOfWork?.data?.Result || [];
  }, [areaOfWork]);


  const { mutate: clockIn, loading: clockingIn } = useMutation(apiService.clockIn);
  const { mutate: clockOut, loading: clockingOut } = useMutation(apiService.clockOut);

  // Get current week number
  const getCurrentWeekNumber = useCallback(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const diff = now - startOfYear;
    const oneWeekInMilliseconds = 7 * 24 * 60 * 60 * 1000;
    return Math.floor(diff / oneWeekInMilliseconds) + 1;
  }, []);

  // Calculate week dates
  const getWeekDates = useCallback((weekNumber, year) => {
    const startDate = new Date(year, 0, 1);
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? 1 : 1);
    const weekStart = new Date(startDate.setDate(diff));
    const daysToAdd = (weekNumber - 1) * 7;
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + daysToAdd + i);
      dates.push(date.toLocaleDateString());
    }
    return dates;
  }, []);

  // Initialize week data
  useEffect(() => {
    const currentWeek = selectedWeek || getCurrentWeekNumber();
    const currentYear = new Date().getFullYear();
    const dates = getWeekDates(currentWeek, currentYear);
    setWeekData(dates);
  }, [selectedWeek, getCurrentWeekNumber, getWeekDates]);

  // Calculate leave balances from API
  const leaveBalances = useMemo(() => {
    // Handle API response format: { Status: "Success", Result: [...] }
    // useApi hook returns the Result array directly if Status is "Success"
    let balanceArray = [];
    
    if (Array.isArray(leaveBalanceData)) {
      balanceArray = leaveBalanceData;
    } else if (leaveBalanceData?.Result && Array.isArray(leaveBalanceData.Result)) {
      balanceArray = leaveBalanceData.Result;
    } else if (leaveBalanceData?.data?.Result && Array.isArray(leaveBalanceData.data.Result)) {
      balanceArray = leaveBalanceData.data.Result;
    }

    if (!balanceArray || balanceArray.length === 0) {
      return {
        total: 0,
        casual: 0,
        sick: 0,
        earned: 0,
        compOff: 0,
      };
    }

    const balances = {
      total: 0,
      casual: 0,
      sick: 0,
      earned: 0,
      compOff: 0,
    };

    // API response has: leave_type, balance, accrued, used
    balanceArray.forEach((item) => {
      const leaveType = (item.leave_type || item.leaveType || "").toLowerCase().trim();
      const balance = parseFloat(item.balance || 0) || 0;

      if (leaveType === "casual") {
        balances.casual = balance;
      } else if (leaveType === "sick") {
        balances.sick = balance;
      } else if (leaveType === "annual") {
        balances.earned = balance;
      } else if (leaveType === "emergency") {
        // Emergency can be added to casual if needed
        balances.casual += balance;
      }

      balances.total += balance;
    });

    // Calculate comp-off from approved comp-off details
    let compOffArray = [];
    if (Array.isArray(compOffDetails)) {
      compOffArray = compOffDetails;
    } else if (compOffDetails?.Result && Array.isArray(compOffDetails.Result)) {
      compOffArray = compOffDetails.Result;
    } else if (compOffDetails?.data?.Result && Array.isArray(compOffDetails.data.Result)) {
      compOffArray = compOffDetails.data.Result;
    }

    if (compOffArray && compOffArray.length > 0) {
      const approvedCompOff = compOffArray
        .filter((item) => item.leaveStatus?.toLowerCase() === "approved")
        .reduce((total, item) => {
          const eligibility = parseFloat(item.eligibility || 0) || 0;
          return total + Math.round(eligibility / 9);
        }, 0);

      // Subtract used comp-off from approved leave details (already filtered by employeeId)
      let leaveDetailsArray = [];
      if (Array.isArray(leaveDetails)) {
        leaveDetailsArray = leaveDetails;
      } else if (leaveDetails?.Result && Array.isArray(leaveDetails.Result)) {
        leaveDetailsArray = leaveDetails.Result;
      } else if (leaveDetails?.data?.Result && Array.isArray(leaveDetails.data.Result)) {
        leaveDetailsArray = leaveDetails.data.Result;
      }

      const usedCompOff = leaveDetailsArray
        .filter(
          (item) =>
            item.leaveType === "Comp-off" &&
            item.leaveStatus?.toLowerCase() === "approved"
        )
        .reduce((total, item) => {
          return total + (parseFloat(item.leaveHours || 0) || 0);
        }, 0) || 0;

      balances.compOff = Math.max(0, approvedCompOff - usedCompOff);
      balances.total += balances.compOff;
    }

    return balances;
  }, [leaveBalanceData, compOffDetails, leaveDetails]);

  // Format date helper
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Handle MM/DD/YYYY format
      const parts = dateString.split("/");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
      }
      return dateString;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Fetch time sheet data
  const { mutate: filterTimeSheet } = useMutation(apiService.filterTimeSheet);

  const getInOutTime = useCallback(
    async (dates) => {
      if (!dates || !user?.id) return;

      try {
        setTimeSheetLoading(true);
        setError(null);

        const convertedDates = dates.map((date) => formatDate(date));

        const result = await filterTimeSheet({
          userId: Number(user.id),
          logDates: convertedDates,
        });

        if (result.success && result.data?.Result) {
          const timeSheetData = result.data.Result;
          const dateWiseData = {};

          timeSheetData.forEach((item) => {
            const formattedLogDate = item.FormattedLogDate?.slice(0, 10);
            const time = item.FormattedLogDate?.slice(11, 16);

            if (!formattedLogDate || !time) return;

            if (!dateWiseData[formattedLogDate]) {
              dateWiseData[formattedLogDate] = { IN: [], OUT: [] };
            }

            const hour = parseInt(time.split(":")[0]);
            if (hour < 12) {
              dateWiseData[formattedLogDate]["IN"].push(time);
            } else {
              dateWiseData[formattedLogDate]["OUT"].push(time);
            }
          });

          const rowData = [
            {
              type: "IN / OUT",
              item: dateWiseData,
            },
          ];

          setRowData(rowData);
        }
      } catch (err) {
        setError("Failed to load time sheet data");
        console.error("Error in getInOutTime:", err);
      } finally {
        setTimeSheetLoading(false);
      }
    },
    [user?.id, formatDate, filterTimeSheet]
  );

  // Fetch time sheet when week data changes
  // useEffect(() => {
  //   if (weekData && weekData.length > 0) {
  //     getInOutTime(weekData);
  //   }
  // }, [weekData, getInOutTime]);

  // Column definitions for AG Grid
  const columnDefs = useMemo(() => {
    if (!weekData || weekData.length === 0) {
      return [{ field: "type", headerName: "Type" }];
    }

    const columns = [
      {
        field: "type",
        headerName: "Type",
        minWidth: 120,
      },
    ];

    weekData.forEach((date, index) => {
      const formattedDate = formatDate(date);
      columns.push({
        field: formattedDate,
        headerName: `${date} (${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]})`,
        cellRenderer: (params) => {
          const dateKey = formattedDate;
          const item = params.data?.item || {};
          const dateData = item[dateKey];

          if (!dateData || (!dateData.IN?.length && !dateData.OUT?.length)) {
            return <Typography color="text.secondary">NP</Typography>;
          }

          const inTime = dateData.IN?.[0] || "NP";
          const outTime = dateData.OUT?.[dateData.OUT?.length - 1] || "NP";

          return (
            <Typography variant="body2">
              {inTime} / {outTime}
            </Typography>
          );
        },
        minWidth: 150,
      });
    });

    return columns;
  }, [weekData, formatDate]);

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

  const leaveCards = useMemo(
    () => [
      {
        title: "Total Leave",
        value: leaveBalances.total.toFixed(1),
        icon: <EventAvailable />,
        color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      },
      {
        title: "Casual Leave",
        value: leaveBalances.casual.toFixed(1),
        icon: <BeachAccess />,
        color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      },
      {
        title: "Sick Leave",
        value: leaveBalances.sick.toFixed(1),
        icon: <LocalHospital />,
        color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      },
      {
        title: "Earned Leave",
        value: leaveBalances.earned.toFixed(1),
        icon: <Work />,
        color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      },
      {
        title: "Comp-off Leave",
        value: leaveBalances.compOff.toFixed(1),
        icon: <CalendarToday />,
        color: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      },
    ],
    [leaveBalances]
  );

  // Handle clock in
  const handleClockIn = async () => {
    // Project and reference number are now optional - all users can clock in
    // Get project details if project or referenceNo is provided
    // Match the logic from TimeManagement.jsx - find by referenceNo first, then by projectName
    let projectDetails = {};
    let selectedProject = null;
    
    if (clockInData.referenceNo) {
      // Find by referenceNo (like TimeManagement.jsx does)
      selectedProject = projectsList.find(
        (p) => p.referenceNo === clockInData.referenceNo
      );
    } else if (clockInData.projectName) {
      // Fallback to projectName
      selectedProject = projectsList.find(
        (p) => p.projectName === clockInData.projectName
      );
    }
    
    if (selectedProject) {
      projectDetails = {
        referenceNo: selectedProject.referenceNo || clockInData.referenceNo,
        projectName: selectedProject.projectName || clockInData.projectName,
        projectNo: selectedProject.projectNo,
        taskNo: selectedProject.taskJobNo || selectedProject.taskNo,
        variation: selectedProject.variation,
        subDivision: selectedProject.subDivision,
        subDivisionList: selectedProject.subDivision,
        allotatedHours: selectedProject.allotatedHours,
        desciplineCode: selectedProject.desciplineCode,
        // Note: tlName will be extracted by backend from project.tlID or employee's team lead
      };
    }

    // Send UTC time for clock-in to match backend and ensure accurate calculation
    // All fields are optional - users can clock in without project information
    const result = await clockIn({
      employeeId: user?.id,
      employeeName: user?.employeeName || user?.name,
      projectName: projectDetails.projectName || clockInData.projectName || "",
      referenceNo: projectDetails.referenceNo || clockInData.referenceNo || "",
      areaOfWork: clockInData.areaOfWork || "",
      ...projectDetails, // Spread all project details
      date: new Date().toISOString().split('T')[0],
      clockInTime: new Date().toISOString(), // UTC time in ISO format
    });

    if (result.success) {
      setClockInDialog(false);
      setClockInData({ projectName: "", referenceNo: "", areaOfWork: "" });
      refetchClockStatus();
      setSnackbar({
        open: true,
        message: "Clocked in successfully",
        severity: "success",
      });
    } else {
      setSnackbar({
        open: true,
        message: result.error || "Failed to clock in",
        severity: "error",
      });
    }
  };

  // Handle clock out
  const handleClockOut = async () => {
    if (!todayClockStatus?.id) {
      setSnackbar({
        open: true,
        message: "No active clock-in found",
        severity: "error",
      });
      return;
    }

    // Send UTC time for clock-out to match backend and ensure accurate calculation
    const result = await clockOut({
      employeeId: user?.id,
      workDetailId: todayClockStatus.id,
      clockOutTime: new Date().toISOString(), // UTC time in ISO format
    });

    if (result.success) {
      setClockOutDialog(false);
      refetchClockStatus();
      setSnackbar({
        open: true,
        message: `Clocked out successfully. Total hours: ${result.data?.totalHours || todayHours.toFixed(2)} hours`,
        severity: "success",
      });
      // Trigger a custom event to notify TimeManagement to refresh
      window.dispatchEvent(new CustomEvent('workDetailsUpdated'));
    } else {
      setSnackbar({
        open: true,
        message: result.error || "Failed to clock out",
        severity: "error",
      });
    }
  };

  const loading = balanceLoading || leaveLoading || compOffLoading;

  if (loading && !leaveBalances.total) {
    return <Loading message="Loading employee dashboard..." />;
  }

  return (
    <Box sx={{ p: 3, bgcolor: "grey.50", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
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
          Employee Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View your leave balance and timesheet
        </Typography>
      </Box>

      {/* Error Message */}
      {error && <ErrorMessage error={error} onClose={() => setError(null)} />}

      {/* Clock In/Out Card */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <AccessTime color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Today's Attendance
            </Typography>
          </Box>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                {todayClockStatus ? (
                  <Chip
                    label={todayClockStatus.status === 'active' ? 'Clocked In' : 'Clocked Out'}
                    color={todayClockStatus.status === 'active' ? 'success' : 'default'}
                    icon={todayClockStatus.status === 'active' ? <Login /> : <Logout />}
                    sx={{ mb: 1 }}
                  />
                ) : (
                  <Chip label="Not Clocked In" color="default" />
                )}
                {todayClockStatus?.clockInTime && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Clock In: {new Date(todayClockStatus.clockInTime).toLocaleTimeString()}
                  </Typography>
                )}
                {todayClockStatus?.clockOutTime && (
                  <Typography variant="body2" color="text.secondary">
                    Clock Out: {new Date(todayClockStatus.clockOutTime).toLocaleTimeString()}
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Today's Hours
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {todayTimeFormatted}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({todayHours.toFixed(2)}h)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={2}>
                {!todayClockStatus || todayClockStatus.status !== 'active' ? (
                  <Button
                    variant="contained"
                    startIcon={<Login />}
                    onClick={() => setClockInDialog(true)}
                    disabled={clockingIn}
                    sx={{
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      "&:hover": {
                        background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                      },
                    }}
                  >
                    {clockingIn ? <CircularProgress size={20} /> : "Clock In"}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Logout />}
                    onClick={() => setClockOutDialog(true)}
                    disabled={clockingOut}
                    sx={{
                      background: "linear-gradient(135deg, #f5576c 0%, #f093fb 100%)",
                      "&:hover": {
                        background: "linear-gradient(135deg, #e53935 0%, #e91e63 100%)",
                      },
                    }}
                  >
                    {clockingOut ? <CircularProgress size={20} /> : "Clock Out"}
                  </Button>
                )}
                <IconButton onClick={refetchClockStatus} size="small">
                  <Refresh />
                </IconButton>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Leave Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {leaveCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                background: card.color,
                color: "white",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
                <Typography variant="h3" fontWeight="bold" gutterBottom>
                  {card.value}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Timesheet Section */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Time Sheet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View your weekly time entries
              </Typography>
            </Box>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Select Week</InputLabel>
              <Select
                value={selectedWeek || String(getCurrentWeekNumber())}
                label="Select Week"
                onChange={(e) => setSelectedWeek(e.target.value)}
              >
                {weekNumberList.map((week) => (
                  <MenuItem key={week} value={week}>
                    Week {week}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
                loading={timeSheetLoading}
              />
            </div>
          </Box>
        </CardContent>
      </Card>

      {/* Clock In Dialog */}
      <Dialog
        open={clockInDialog}
        onClose={() => setClockInDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              Clock In
            </Typography>
            <IconButton onClick={() => setClockInDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              All fields are optional. You can clock in without selecting a project.
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Project Name (Optional)</InputLabel>
              <Select
                value={clockInData.projectName}
                label="Project Name (Optional)"
                onChange={(e) => {
                  const selectedProject = projectsList.find(p => p.projectName === e.target.value);
                  setClockInData({
                    ...clockInData,
                    projectName: e.target.value,
                    referenceNo: selectedProject?.referenceNo || clockInData.referenceNo,
                  });
                }}
              >
                <MenuItem value="">None</MenuItem>
                {projectsList.map((project) => (
                  <MenuItem key={project.id} value={project.projectName}>
                    {project.projectName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Reference Number (Optional)"
              value={clockInData.referenceNo}
              onChange={(e) => setClockInData({ ...clockInData, referenceNo: e.target.value })}
              fullWidth
              helperText="Optional - Enter if you know the project reference number"
            />
            <FormControl fullWidth>
              <InputLabel>Area of Work (Optional)</InputLabel>
              <Select
                value={clockInData.areaOfWork}
                label="Area of Work (Optional)"
                onChange={(e) => setClockInData({ ...clockInData, areaOfWork: e.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                {areaOfWorkList.map((area) => (
                  <MenuItem key={area.id || area.areaofwork} value={area.areaofwork}>
                    {area.areaofwork}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setClockInDialog(false)}>Cancel</Button>
          <Button
            onClick={handleClockIn}
            variant="contained"
            disabled={clockingIn}
            startIcon={clockingIn ? <CircularProgress size={20} /> : <Login />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            {clockingIn ? "Clocking In..." : "Clock In"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clock Out Dialog */}
      <Dialog
        open={clockOutDialog}
        onClose={() => setClockOutDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              Clock Out
            </Typography>
            <IconButton onClick={() => setClockOutDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Clock In Time: {todayClockStatus?.clockInTime ? new Date(todayClockStatus.clockInTime).toLocaleString() : 'N/A'}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Current Time: {new Date().toLocaleString()}
            </Typography>
            <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
              Total Hours: {todayHours.toFixed(2)} hours
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setClockOutDialog(false)}>Cancel</Button>
          <Button
            onClick={handleClockOut}
            variant="contained"
            color="error"
            disabled={clockingOut}
            startIcon={clockingOut ? <CircularProgress size={20} /> : <Logout />}
            sx={{
              background: "linear-gradient(135deg, #f5576c 0%, #f093fb 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #e53935 0%, #e91e63 100%)",
              },
            }}
          >
            {clockingOut ? "Clocking Out..." : "Clock Out"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => setSnackbar({ ...snackbar, open: false })}
            >
              <Close fontSize="small" />
            </IconButton>
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeHome;
