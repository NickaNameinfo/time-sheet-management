import React, { useState } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  IconButton,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Schedule,
  Add,
  PersonAdd,
  Refresh,
  Close,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import ErrorMessage from "./ErrorMessage";
import Loading from "./Loading";
import { LocalizationProvider, TimePicker, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const ShiftManagement = () => {
  const { user, isEmployee } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [formData, setFormData] = useState({
    name: "",
    startTime: dayjs("08:00", "HH:mm"),
    endTime: dayjs("17:00", "HH:mm"),
    breakDuration: 60,
  });
  const [assignData, setAssignData] = useState({
    employeeId: "",
    shiftId: "",
    assignmentDate: dayjs(),
  });

  // For employees: only fetch their assigned shift
  // For HR/Admin: fetch all shifts and assignments
  const isEmployeeUser = isEmployee();

  const { data: shifts, loading: shiftsLoading, refetch: refetchShifts } = useApi(
    apiService.getShifts,
    [],
    !isEmployeeUser // Only fetch all shifts if not employee
  );
  const { data: employees, loading: employeesLoading } = useApi(
    apiService.getEmployees,
    [],
    !isEmployeeUser // Only fetch employees if not employee (for assignment)
  );
  
  // Fetch shift assignments - filtered by employeeId for employees
  const { data: assignments, loading: assignmentsLoading, refetch: refetchAssignments } = useApi(
    () => apiService.getShiftAssignments(
      isEmployeeUser ? { employeeId: user?.id, isActive: "true" } : {}
    ),
    [user?.id, isEmployeeUser],
    !!user?.id || !isEmployeeUser
  );

  const { mutate: createShift, loading: creating } = useMutation(apiService.createShift);
  const { mutate: assignShift, loading: assigning } = useMutation(apiService.assignShift);

  const handleCreateShift = async () => {
    const result = await createShift({
      name: formData.name,
      startTime: formData.startTime.format("HH:mm:ss"),
      endTime: formData.endTime.format("HH:mm:ss"),
      breakDuration: formData.breakDuration,
    });

    if (result.success) {
      setOpenDialog(false);
      setSnackbar({
        open: true,
        message: "Shift created successfully",
        severity: "success",
      });
      refetchShifts();
    } else {
      setSnackbar({
        open: true,
        message: result.error || "Failed to create shift",
        severity: "error",
      });
    }
  };

  const handleAssignShift = async () => {
    const result = await assignShift({
      employeeId: assignData.employeeId,
      shiftId: assignData.shiftId,
      assignmentDate: assignData.assignmentDate.format("YYYY-MM-DD"),
    });

    if (result.success) {
      setAssignDialog(false);
      setSnackbar({
        open: true,
        message: "Shift assigned successfully",
        severity: "success",
      });
      refetchAssignments();
    } else {
      setSnackbar({
        open: true,
        message: result.error || "Failed to assign shift",
        severity: "error",
      });
    }
  };

  if ((shiftsLoading || employeesLoading || assignmentsLoading) && !assignments) {
    return <Loading message="Loading shift details..." />;
  }

  // Handle assignments data format
  const assignmentsList = Array.isArray(assignments)
    ? assignments
    : assignments?.Result || assignments?.data?.Result || [];

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
              {isEmployeeUser ? "My Shift Details" : "Shift Management"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEmployeeUser
                ? "View your assigned shift schedule"
                : "Create and manage employee shift schedules"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                if (!isEmployeeUser) refetchShifts();
                refetchAssignments();
              }}
              disabled={assignmentsLoading}
              sx={{
                borderRadius: 2,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Refresh
            </Button>
            {!isEmployeeUser && (
              <>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setOpenDialog(true)}
                  sx={{
                    borderRadius: 2,
                    textTransform: "uppercase",
                    fontWeight: 600,
                    background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
                    boxShadow: "0 4px 15px rgba(76, 134, 249, 0.4)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
                      boxShadow: "0 6px 20px rgba(76, 134, 249, 0.6)",
                    },
                  }}
                >
                  Create Shift
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PersonAdd />}
                  onClick={() => setAssignDialog(true)}
                  sx={{
                    borderRadius: 2,
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  Assign Shift
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Shifts List - Only show for HR/Admin */}
      {!isEmployeeUser && (
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
                <Schedule sx={{ color: "primary.main", fontSize: 24 }} />
              </Box>
              <Typography variant="h6" fontWeight="bold">
                Available Shifts
              </Typography>
            </Box>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Name</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Start Time</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>End Time</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Break Duration</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shifts?.length > 0 ? (
                    shifts.map((shift) => (
                      <TableRow key={shift.id} hover>
                        <TableCell>
                          <Typography fontWeight="medium">{shift.name}</Typography>
                        </TableCell>
                        <TableCell>{shift.start_time}</TableCell>
                        <TableCell>{shift.end_time}</TableCell>
                        <TableCell>{shift.break_duration} minutes</TableCell>
                        <TableCell>
                          <Chip
                            label={shift.is_active ? "Active" : "Inactive"}
                            color={shift.is_active ? "success" : "default"}
                            size="small"
                            variant={shift.is_active ? "filled" : "outlined"}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No shifts available</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Shift Assignments */}
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
              <PersonAdd sx={{ color: "primary.main", fontSize: 24 }} />
            </Box>
            <Typography variant="h6" fontWeight="bold">
              {isEmployeeUser ? "My Shift Assignment" : "Shift Assignments"}
            </Typography>
          </Box>
          {assignmentsLoading ? (
            <Loading />
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    {!isEmployeeUser && (
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Employee</TableCell>
                    )}
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Shift Name</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Start Time</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>End Time</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Start Date</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>End Date</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
                    {/* Note: Shift assignments are read-only - no edit/delete actions available */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignmentsList.length > 0 ? (
                    assignmentsList.map((assignment) => (
                      <TableRow key={assignment.id} hover>
                        {!isEmployeeUser && (
                          <TableCell>
                            <Typography fontWeight="medium">
                              {assignment.employeeName || "N/A"}
                            </Typography>
                            {assignment.EMPID && (
                              <Typography variant="caption" color="text.secondary">
                                ID: {assignment.EMPID}
                              </Typography>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          <Typography fontWeight="medium">
                            {assignment.shift_name || "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell>{assignment.start_time || "N/A"}</TableCell>
                        <TableCell>{assignment.end_time || "N/A"}</TableCell>
                        <TableCell>
                          {assignment.assignment_date
                            ? dayjs(assignment.assignment_date).format("YYYY-MM-DD")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {assignment.end_date
                            ? dayjs(assignment.end_date).format("YYYY-MM-DD")
                            : "Ongoing"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={assignment.is_active ? "Active" : "Inactive"}
                            color={assignment.is_active ? "success" : "default"}
                            size="small"
                            variant={assignment.is_active ? "filled" : "outlined"}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={isEmployeeUser ? 6 : 7}
                        align="center"
                        sx={{ py: 4 }}
                      >
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                          <Schedule sx={{ fontSize: 48, color: "text.disabled", opacity: 0.5 }} />
                          <Typography color="text.secondary">
                            {isEmployeeUser
                              ? "No shift assigned yet"
                              : "No shift assignments found"}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create Shift Dialog */}
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
              Create New Shift
            </Typography>
            <IconButton onClick={() => setOpenDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Shift Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <TimePicker
                label="Start Time"
                value={formData.startTime}
                onChange={(newValue) => setFormData({ ...formData, startTime: newValue })}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <TimePicker
                label="End Time"
                value={formData.endTime}
                onChange={(newValue) => setFormData({ ...formData, endTime: newValue })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
            <TextField
              label="Break Duration (minutes)"
              type="number"
              value={formData.breakDuration}
              onChange={(e) => setFormData({ ...formData, breakDuration: parseInt(e.target.value) })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateShift}
            variant="contained"
            disabled={creating}
            startIcon={<CheckCircle />}
            sx={{
              background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
              },
            }}
          >
            {creating ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Shift Dialog */}
      <Dialog
        open={assignDialog}
        onClose={() => setAssignDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              Assign Shift to Employee
            </Typography>
            <IconButton onClick={() => setAssignDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              select
              label="Employee"
              value={assignData.employeeId}
              onChange={(e) => setAssignData({ ...assignData, employeeId: e.target.value })}
              SelectProps={{ native: true }}
              fullWidth
              required
            >
              <option value="">Select Employee</option>
              {employees?.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeName} ({emp.EMPID})
                </option>
              ))}
            </TextField>
            <TextField
              select
              label="Shift"
              value={assignData.shiftId}
              onChange={(e) => setAssignData({ ...assignData, shiftId: e.target.value })}
              SelectProps={{ native: true }}
              fullWidth
              required
            >
              <option value="">Select Shift</option>
              {shifts?.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.name} ({shift.start_time} - {shift.end_time})
                </option>
              ))}
            </TextField>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Assignment Date"
                value={assignData.assignmentDate}
                onChange={(newValue) => setAssignData({ ...assignData, assignmentDate: newValue })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAssignDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAssignShift}
            variant="contained"
            disabled={assigning}
            startIcon={<CheckCircle />}
            sx={{
              background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
              },
            }}
          >
            {assigning ? "Assigning..." : "Assign"}
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

export default ShiftManagement;

