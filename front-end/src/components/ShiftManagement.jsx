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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  IconButton,
  Grid,
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
  const [openDialog, setOpenDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
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

  const { data: shifts, loading: shiftsLoading, refetch: refetchShifts } = useApi(
    apiService.getShifts
  );
  const { data: employees, loading: employeesLoading } = useApi(apiService.getEmployees);
  const { data: assignments, loading: assignmentsLoading, refetch: refetchAssignments } = useApi(
    apiService.getShiftAssignments,
    [],
    false
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
      refetchShifts();
      alert("Shift created successfully");
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
      refetchAssignments();
      alert("Shift assigned successfully");
    }
  };

  if (shiftsLoading || employeesLoading) {
    return <Loading message="Loading shifts..." />;
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
              Shift Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create and manage employee shift schedules
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                refetchShifts();
                refetchAssignments();
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                },
              }}
            >
              Create Shift
            </Button>
            <Button
              variant="outlined"
              startIcon={<PersonAdd />}
              onClick={() => setAssignDialog(true)}
            >
              Assign Shift
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Shifts List */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <Schedule color="primary" />
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

      {/* Shift Assignments */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <PersonAdd color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Shift Assignments
            </Typography>
          </Box>
          {assignmentsLoading ? (
            <Loading />
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Employee</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Shift</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Start Date</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>End Date</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignments?.length > 0 ? (
                    assignments.map((assignment) => (
                      <TableRow key={assignment.id} hover>
                        <TableCell>{assignment.employeeName}</TableCell>
                        <TableCell>{assignment.shift_name}</TableCell>
                        <TableCell>{assignment.assignment_date}</TableCell>
                        <TableCell>{assignment.end_date || "Ongoing"}</TableCell>
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
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No shift assignments found</Typography>
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
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
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
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            {assigning ? "Assigning..." : "Assign"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShiftManagement;

