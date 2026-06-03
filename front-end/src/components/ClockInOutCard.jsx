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
import { useTranslation } from "react-i18next";

const ClockInOutCard = () => {
  const { t } = useTranslation();
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
        // Use clockInTime column (preferred) or sentDate as fallback
        const clockInTime = activeClockIn.clockInTime || activeClockIn.sentDate;
        setTodayClockStatus({
          id: activeClockIn.id,
          clockInTime: clockInTime,
          status: 'active',
        });
        // Calculate initial hours immediately if clocked in
        if (clockInTime) {
          // Parse clock-in time - handle both UTC ISO strings and MySQL DATETIME format
          let clockInDate;
          if (typeof clockInTime === 'string') {
            // If it's an ISO string with 'Z' or timezone, parse directly
            if (clockInTime.includes('T') || clockInTime.includes('Z') || clockInTime.includes('+') || clockInTime.includes('-')) {
              clockInDate = new Date(clockInTime);
            } else {
              // MySQL DATETIME format (YYYY-MM-DD HH:MM:SS) - treat as UTC since backend stores UTC
              // Append 'Z' to indicate UTC
              clockInDate = new Date(clockInTime + (clockInTime.includes('Z') ? '' : 'Z'));
            }
          } else {
            clockInDate = new Date(clockInTime);
          }
          
          // Get current time
          const now = new Date();
          
          // Calculate difference in milliseconds
          const diffMs = Math.max(0, now.getTime() - clockInDate.getTime());
          const totalSeconds = Math.floor(diffMs / 1000);
          const hours = totalSeconds / 3600.0;
          
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
      // Calculate immediately for accuracy
      const calculateHours = () => {
        // Parse clock-in time - handle both UTC ISO strings and MySQL DATETIME format
        let clockInDate;
        const clockInTime = todayClockStatus.clockInTime;
        if (typeof clockInTime === 'string') {
          // If it's an ISO string with 'Z' or timezone, parse directly
          if (clockInTime.includes('T') && (clockInTime.includes('Z') || clockInTime.includes('+') || clockInTime.includes('-'))) {
            clockInDate = new Date(clockInTime);
          } else {
            // MySQL DATETIME format (YYYY-MM-DD HH:MM:SS) - backend stores as UTC
            // Convert to ISO format with UTC indicator
            const mysqlDateTime = clockInTime.replace(' ', 'T');
            clockInDate = new Date(mysqlDateTime + 'Z');
          }
        } else {
          clockInDate = new Date(clockInTime);
        }
        
        // Get current time (local time)
        const now = new Date();
        
        // Calculate difference in milliseconds
        const diffMs = Math.max(0, now.getTime() - clockInDate.getTime());
        const totalSeconds = Math.floor(diffMs / 1000);
        const hours = totalSeconds / 3600.0;
        
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

  // Fetch assigned projects from project plans and regular projects
  const { data: assignedProjectsFromPlans, loading: assignedProjectsLoading } = useApi(
    () => {
      if (!user?.id) return Promise.resolve({ data: { Status: "Success", Result: [] } });
      return apiService.getEmployeeAssignedProjects({ employee_id: user.id });
    },
    [user?.id],
    !!user?.id
  );
  
  const { data: projects } = useApi(apiService.getProjects);
  const { data: areaOfWork } = useApi(apiService.getAreaOfWork);

  // Process assigned projects from project plans
  const assignedProjectsList = useMemo(() => {
    if (!assignedProjectsFromPlans) return [];
    if (Array.isArray(assignedProjectsFromPlans)) return assignedProjectsFromPlans;
    return assignedProjectsFromPlans?.Result || assignedProjectsFromPlans?.data?.Result || [];
  }, [assignedProjectsFromPlans]);

  // Process regular projects list
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
        message: t("clock.pleaseSelectProjectOrReference", {
          defaultValue: "Please select a project or enter reference number",
        }),
        severity: "warning",
      });
      return;
    }

    // Get project details if project or referenceNo is provided
    // Match the logic from TimeManagement.jsx - find by referenceNo first, then by projectName
    // Prefer assigned projects from plans, then fallback to regular projects
    let projectDetails = {};
    let selectedProject = null;
    
    if (clockInData.referenceNo) {
      // Find by referenceNo in assigned projects first, then regular projects
      selectedProject = assignedProjectsList.find(
        (p) => p.referenceNo === clockInData.referenceNo
      ) || projectsList.find(
        (p) => p.referenceNo === clockInData.referenceNo
      );
    } else if (clockInData.projectName) {
      // Fallback to projectName
      selectedProject = assignedProjectsList.find(
        (p) => p.projectName === clockInData.projectName
      ) || projectsList.find(
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
        allotatedHours: selectedProject.allotted_hours || selectedProject.allotatedHours, // Use allotted_hours from plan if available
        desciplineCode: selectedProject.desciplineCode,
        designation: selectedProject.designation,
        // Note: tlName will be extracted by backend from project.tlID or employee's team lead
      };
    }

    // Send UTC time for clock-in to match backend and ensure accurate calculation
    const result = await clockIn({
      employeeNo: user?.id,
      tlName: selectedProject?.tlName,
      employeeId: user?.id,
      employeeName: user?.employeeName || user?.name,
      projectName: projectDetails.projectName || clockInData.projectName,
      referenceNo: projectDetails.referenceNo || clockInData.referenceNo,
      areaOfWork: clockInData.areaOfWork,
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
        message: t("clock.clockedInSuccess", { defaultValue: "Clocked in successfully" }),
        severity: "success",
      });
      // Trigger event to notify TimeManagement
      window.dispatchEvent(new CustomEvent('workDetailsUpdated'));
    } else {
      setSnackbar({
        open: true,
        message: result.error || t("clock.clockInFailed", { defaultValue: "Failed to clock in" }),
        severity: "error",
      });
    }
  };

  // Handle clock out
  const handleClockOut = async () => {
    if (!todayClockStatus?.id) {
      setSnackbar({
        open: true,
        message: t("clock.noActiveClockIn", { defaultValue: "No active clock-in found" }),
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
        message: t("clock.clockedOutSuccessWithHours", {
          defaultValue:
            "Clocked out successfully. Total hours: {{hours}} hours",
          hours: result.data?.totalHours || todayHours.toFixed(2),
        }),
        severity: "success",
      });
      // Trigger event to notify TimeManagement
      window.dispatchEvent(new CustomEvent('workDetailsUpdated'));
    } else {
      setSnackbar({
        open: true,
        message: result.error || t("clock.clockOutFailed", { defaultValue: "Failed to clock out" }),
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
              {t("clock.todaysAttendance", { defaultValue: "Today's Attendance" })}
            </Typography>
          </Box>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t("clock.status", { defaultValue: "Status" })}
                </Typography>
                {todayClockStatus ? (
                  <Chip
                    label={
                      todayClockStatus.status === "active"
                        ? t("clock.clockedIn", { defaultValue: "Clocked In" })
                        : t("clock.clockedOut", { defaultValue: "Clocked Out" })
                    }
                    color={todayClockStatus.status === 'active' ? 'success' : 'default'}
                    icon={todayClockStatus.status === 'active' ? <Login /> : <Logout />}
                    sx={{ mb: 1 }}
                  />
                ) : (
                  <Chip label={t("clock.notClockedIn", { defaultValue: "Not Clocked In" })} color="default" />
                )}
                {todayClockStatus?.clockInTime && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {t("clock.clockInTime", { defaultValue: "Clock In" })}:{" "}
                    {new Date(todayClockStatus.clockInTime).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit',
                      hour12: false 
                    })}
                  </Typography>
                )}
                {todayClockStatus?.clockOutTime && (
                  <Typography variant="body2" color="text.secondary">
                    {t("clock.clockOutTime", { defaultValue: "Clock Out" })}:{" "}
                    {new Date(todayClockStatus.clockOutTime).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit',
                      hour12: false 
                    })}
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t("clock.todaysHours", { defaultValue: "Today's Hours" })}
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
                      background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
                      "&:hover": {
                        background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
                      },
                    }}
                  >
                    {clockingIn ? <CircularProgress size={20} /> : t("clock.clockIn", { defaultValue: "Clock In" })}
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
                    {clockingOut ? <CircularProgress size={20} /> : t("clock.clockOut", { defaultValue: "Clock Out" })}
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
              {t("clock.clockIn", { defaultValue: "Clock In" })}
            </Typography>
            <IconButton onClick={() => setClockInDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>{t("clock.projectNameOptional", { defaultValue: "Project Name (Optional)" })}</InputLabel>
              <Select
                value={clockInData.projectName}
                label={t("clock.projectNameOptional", { defaultValue: "Project Name (Optional)" })}
                onChange={(e) => {
                  // Find in assigned projects first, then regular projects
                  const selectedProject = assignedProjectsList.find(p => p.projectName === e.target.value) 
                    || projectsList.find(p => p.projectName === e.target.value);
                  setClockInData({
                    ...clockInData,
                    projectName: e.target.value,
                    referenceNo: selectedProject?.referenceNo || clockInData.referenceNo,
                  });
                }}
                disabled={assignedProjectsLoading}
              >
                <MenuItem value="">{t("common.none", { defaultValue: "None" })}</MenuItem>
                {assignedProjectsList.length > 0 ? (
                  // Show only assigned projects from plans with allotted hours
                  assignedProjectsList.map((project) => (
                    <MenuItem key={project.project_id || project.id} value={project.projectName}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                        <Typography variant="body2">{project.projectName}</Typography>
                        {project.allotted_hours && (
                          <Chip 
                            label={`${project.allotted_hours}h`} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ ml: 1, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </MenuItem>
                  ))
                ) : (
                  // Show message when no assigned projects
                  !assignedProjectsLoading && (
                    <MenuItem value="" disabled>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {t("clock.noAssignedProjectsFromPlans", { defaultValue: "No assigned projects from project plans" })}
                      </Typography>
                    </MenuItem>
                  )
                )}
              </Select>
              {assignedProjectsList.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {t("clock.showingAssignedProjectsFromPlans", { defaultValue: "Showing assigned projects from project plans" })}
                </Typography>
              )}
              {assignedProjectsList.length === 0 && !assignedProjectsLoading && (
                <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
                  {t("clock.noProjectsAssignedContactManager", {
                    defaultValue: "No projects assigned in project plans. Please contact your manager.",
                  })}
                </Typography>
              )}
            </FormControl>
            <TextField
              label={t("clock.referenceNumberOptional", { defaultValue: "Reference Number (Optional)" })}
              value={clockInData.referenceNo}
              onChange={(e) => setClockInData({ ...clockInData, referenceNo: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>{t("clock.areaOfWorkOptional", { defaultValue: "Area of Work (Optional)" })}</InputLabel>
              <Select
                value={clockInData.areaOfWork}
                label={t("clock.areaOfWorkOptional", { defaultValue: "Area of Work (Optional)" })}
                onChange={(e) => setClockInData({ ...clockInData, areaOfWork: e.target.value })}
              >
                <MenuItem value="">{t("common.none", { defaultValue: "None" })}</MenuItem>
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
          <Button onClick={() => setClockInDialog(false)}>{t("common.cancel", { defaultValue: "Cancel" })}</Button>
          <Button
            onClick={handleClockIn}
            variant="contained"
            disabled={clockingIn}
            startIcon={clockingIn ? <CircularProgress size={20} /> : <Login />}
            sx={{
              background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
              },
            }}
          >
            {clockingIn
              ? t("clock.clockingIn", { defaultValue: "Clocking In..." })
              : t("clock.clockIn", { defaultValue: "Clock In" })}
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
              {t("clock.clockOut", { defaultValue: "Clock Out" })}
            </Typography>
            <IconButton onClick={() => setClockOutDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              {t("clock.clockInTime", { defaultValue: "Clock In" })}:{" "}
              {todayClockStatus?.clockInTime ? new Date(todayClockStatus.clockInTime).toLocaleString() : t("common.na", { defaultValue: "N/A" })}
            </Typography>
            <Typography variant="body1" gutterBottom>
              {t("clock.currentTime", { defaultValue: "Current Time" })}: {new Date().toLocaleString()}
            </Typography>
            <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
              {t("clock.totalHours", { defaultValue: "Total Hours" })}: {todayHours.toFixed(2)}{" "}
              {t("common.hours", { defaultValue: "hours" })}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setClockOutDialog(false)}>{t("common.cancel", { defaultValue: "Cancel" })}</Button>
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
            {clockingOut
              ? t("clock.clockingOut", { defaultValue: "Clocking Out..." })
              : t("clock.clockOut", { defaultValue: "Clock Out" })}
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
              aria-label={t("common.close", { defaultValue: "close" })}
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

