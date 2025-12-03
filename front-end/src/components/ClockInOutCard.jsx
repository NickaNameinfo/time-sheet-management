import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Stack,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import {
  AccessTime,
  Login,
  Logout,
  Refresh,
  Close,
} from "@mui/icons-material";
import { apiService } from "../services/api";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import { useAuth } from "../context/AuthContext";

const ClockInOutCard = () => {
  const { user } = useAuth();
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
        setTodayClockStatus({
          id: activeClockIn.id,
          clockInTime: activeClockIn.sentDate,
          status: 'active',
        });
        // Calculate initial hours immediately if clocked in
        if (activeClockIn.sentDate) {
          const clockInTime = new Date(activeClockIn.sentDate);
          const now = new Date();
          const diffMs = Math.max(0, now - clockInTime);
          const totalSeconds = Math.floor(diffMs / 1000);
          const hours = diffMs / (1000 * 60 * 60);
          setTodayHours(hours);
          setTodayTimeFormatted(formatTime(totalSeconds));
        }
      } else {
        // Check for completed clock-out today
        const completedToday = todayWorkDetailsList.find(
          (item) => item.status === 'completed' && item.totalHours
        );
        if (completedToday) {
          setTodayClockStatus({
            id: completedToday.id,
            clockInTime: completedToday.sentDate,
            clockOutTime: completedToday.approvedDate || completedToday.sentDate,
            status: 'completed',
          });
          const hours = parseFloat(completedToday.totalHours) || 0;
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
      // Calculate immediately
      const calculateHours = () => {
        const clockInTime = new Date(todayClockStatus.clockInTime);
        const now = new Date();
        const diffMs = Math.max(0, now - clockInTime);
        const totalSeconds = Math.floor(diffMs / 1000);
        const hours = diffMs / (1000 * 60 * 60);
        
        setTodayHours(hours);
        setTodayTimeFormatted(formatTime(totalSeconds));
      };

      // Calculate immediately on mount
      calculateHours();

      // Then update every second for real-time display
      const interval = setInterval(calculateHours, 1000); // Update every second

      return () => clearInterval(interval);
    } else if (todayClockStatus?.status === 'completed') {
      // For completed clock-out, format the hours
      const totalSeconds = Math.floor(todayHours * 3600);
      setTodayTimeFormatted(formatTime(totalSeconds));
    } else {
      setTodayTimeFormatted("0:00:00");
    }
  }, [todayClockStatus, formatTime]);

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

  // Handle clock in
  const handleClockIn = async () => {
    if (!clockInData.projectName && !clockInData.referenceNo) {
      setSnackbar({
        open: true,
        message: "Please select a project or enter reference number",
        severity: "warning",
      });
      return;
    }

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
        designation: selectedProject.designation,
        // Note: tlName will be extracted by backend from project.tlID or employee's team lead
      };
    }

    const result = await clockIn({
      employeeNo: user?.id,
      tlName: selectedProject.tlName,
      employeeId: user?.id,
      employeeName: user?.employeeName || user?.name,
      projectName: projectDetails.projectName || clockInData.projectName,
      referenceNo: projectDetails.referenceNo || clockInData.referenceNo,
      areaOfWork: clockInData.areaOfWork,
      ...projectDetails, // Spread all project details
      date: new Date().toISOString().split('T')[0],
      clockInTime: new Date().toISOString(),
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
      // Trigger event to notify TimeManagement
      window.dispatchEvent(new CustomEvent('workDetailsUpdated'));
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

    const result = await clockOut({
      employeeId: user?.id,
      workDetailId: todayClockStatus.id,
      clockOutTime: new Date().toISOString(),
    });

    if (result.success) {
      setClockOutDialog(false);
      refetchClockStatus();
      setSnackbar({
        open: true,
        message: `Clocked out successfully. Total hours: ${result.data?.totalHours || todayHours.toFixed(2)} hours`,
        severity: "success",
      });
      // Trigger event to notify TimeManagement
      window.dispatchEvent(new CustomEvent('workDetailsUpdated'));
    } else {
      setSnackbar({
        open: true,
        message: result.error || "Failed to clock out",
        severity: "error",
      });
    }
  };

  return (
    <>
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
    </>
  );
};

export default ClockInOutCard;

