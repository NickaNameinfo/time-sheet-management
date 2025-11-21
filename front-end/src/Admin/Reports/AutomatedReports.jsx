import React, { useState } from "react";
import { useApi } from "../../hooks/useApi";
import { useMutation } from "../../hooks/useMutation";
import { apiService } from "../../services/api";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Email,
  Add,
  Close,
  CheckCircle,
  Delete,
  Edit,
  Send,
  Schedule,
} from "@mui/icons-material";
import ErrorMessage from "../../components/ErrorMessage";
import Loading from "../../components/Loading";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const AutomatedReports = () => {
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [sendDialog, setSendDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleData, setScheduleData] = useState({
    reportType: "weekly",
    reportName: "",
    recipients: [{ email: "", role: "admin" }],
    scheduleConfig: {
      frequency: "weekly",
      time: "09:00",
      day: "monday",
    },
    isActive: true,
  });
  const [sendReportData, setSendReportData] = useState({
    reportType: "weekly",
    startDate: dayjs().subtract(7, "days").format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD"),
    recipients: [],
  });

  const { data: schedules, loading: schedulesLoading, error: schedulesError, refetch: refetchSchedules } = useApi(
    () => apiService.getReportSchedules(),
    []
  );

  const { mutate: createSchedule, loading: creatingSchedule } = useMutation((data) =>
    apiService.createReportSchedule(data)
  );
  const { mutate: updateSchedule, loading: updatingSchedule } = useMutation((data) =>
    apiService.updateReportSchedule(editingSchedule?.id, data)
  );
  const { mutate: deleteSchedule, loading: deletingSchedule } = useMutation(() =>
    apiService.deleteReportSchedule(editingSchedule?.id)
  );
  const { mutate: sendReport, loading: sendingReport } = useMutation((data) =>
    apiService.sendReport(data)
  );

  const handleCreateSchedule = async () => {
    const result = await createSchedule(scheduleData);
    if (result.success) {
      setScheduleDialog(false);
      resetScheduleForm();
      refetchSchedules();
      alert("Report schedule created successfully");
    }
  };

  const handleUpdateSchedule = async () => {
    const result = await updateSchedule(scheduleData);
    if (result.success) {
      setScheduleDialog(false);
      setEditingSchedule(null);
      resetScheduleForm();
      refetchSchedules();
      alert("Report schedule updated successfully");
    }
  };

  const handleDeleteSchedule = async () => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      const result = await deleteSchedule();
      if (result.success) {
        setEditingSchedule(null);
        refetchSchedules();
        alert("Schedule deleted successfully");
      }
    }
  };

  const handleSendReport = async () => {
    const result = await sendReport(sendReportData);
    if (result.success) {
      setSendDialog(false);
      resetSendForm();
      alert("Report sent successfully");
    }
  };

  const resetScheduleForm = () => {
    setScheduleData({
      reportType: "weekly",
      reportName: "",
      recipients: [{ email: "", role: "admin" }],
      scheduleConfig: {
        frequency: "weekly",
        time: "09:00",
        day: "monday",
      },
      isActive: true,
    });
  };

  const resetSendForm = () => {
    setSendReportData({
      reportType: "weekly",
      startDate: dayjs().subtract(7, "days").format("YYYY-MM-DD"),
      endDate: dayjs().format("YYYY-MM-DD"),
      recipients: [],
    });
  };

  const openEditDialog = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleData({
      reportType: schedule.report_type || "weekly",
      reportName: schedule.report_name || "",
      recipients: schedule.recipients || [{ email: "", role: "admin" }],
      scheduleConfig: schedule.schedule_config || {
        frequency: "weekly",
        time: "09:00",
        day: "monday",
      },
      isActive: schedule.is_active !== false,
    });
    setScheduleDialog(true);
  };

  const addRecipient = () => {
    setScheduleData({
      ...scheduleData,
      recipients: [...scheduleData.recipients, { email: "", role: "admin" }],
    });
  };

  const removeRecipient = (index) => {
    setScheduleData({
      ...scheduleData,
      recipients: scheduleData.recipients.filter((_, i) => i !== index),
    });
  };

  const updateRecipient = (index, field, value) => {
    const newRecipients = [...scheduleData.recipients];
    newRecipients[index][field] = value;
    setScheduleData({ ...scheduleData, recipients: newRecipients });
  };

  if (schedulesLoading) {
    return <Loading message="Loading report schedules..." />;
  }

  if (schedulesError) {
    return (
      <Box sx={{ p: 3 }}>
        <ErrorMessage error={schedulesError} message="Failed to load report schedules" />
      </Box>
    );
  }

  const schedulesList = schedules?.Result || schedules || [];

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
              Automated Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Schedule and manage automated report delivery
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Send />}
              onClick={() => setSendDialog(true)}
            >
              Send Report Now
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditingSchedule(null);
                resetScheduleForm();
                setScheduleDialog(true);
              }}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                },
              }}
            >
              Create Schedule
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Schedules List */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <Schedule color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Report Schedules
            </Typography>
          </Box>
          {schedulesList.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Report Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Frequency</TableCell>
                    <TableCell>Recipients</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedulesList.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>{schedule.report_name || "N/A"}</TableCell>
                      <TableCell>
                        <Chip label={schedule.report_type || "N/A"} size="small" />
                      </TableCell>
                      <TableCell>
                        {schedule.schedule_config?.frequency || "N/A"} at{" "}
                        {schedule.schedule_config?.time || "N/A"}
                      </TableCell>
                      <TableCell>
                        {schedule.recipients?.length || 0} recipient(s)
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={schedule.is_active ? "Active" : "Inactive"}
                          color={schedule.is_active ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog(schedule)}
                            color="primary"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingSchedule(schedule);
                              handleDeleteSchedule();
                            }}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No report schedules found. Create one to get started.</Alert>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Schedule Dialog */}
      <Dialog
        open={scheduleDialog}
        onClose={() => {
          setScheduleDialog(false);
          setEditingSchedule(null);
          resetScheduleForm();
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              {editingSchedule ? "Edit Report Schedule" : "Create Report Schedule"}
            </Typography>
            <IconButton
              onClick={() => {
                setScheduleDialog(false);
                setEditingSchedule(null);
                resetScheduleForm();
              }}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Report Name"
              value={scheduleData.reportName}
              onChange={(e) =>
                setScheduleData({ ...scheduleData, reportName: e.target.value })
              }
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={scheduleData.reportType}
                label="Report Type"
                onChange={(e) =>
                  setScheduleData({ ...scheduleData, reportType: e.target.value })
                }
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                value={scheduleData.scheduleConfig.frequency}
                label="Frequency"
                onChange={(e) =>
                  setScheduleData({
                    ...scheduleData,
                    scheduleConfig: { ...scheduleData.scheduleConfig, frequency: e.target.value },
                  })
                }
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Time"
              type="time"
              value={scheduleData.scheduleConfig.time}
              onChange={(e) =>
                setScheduleData({
                  ...scheduleData,
                  scheduleConfig: { ...scheduleData.scheduleConfig, time: e.target.value },
                })
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            {scheduleData.scheduleConfig.frequency === "weekly" && (
              <FormControl fullWidth>
                <InputLabel>Day</InputLabel>
                <Select
                  value={scheduleData.scheduleConfig.day}
                  label="Day"
                  onChange={(e) =>
                    setScheduleData({
                      ...scheduleData,
                      scheduleConfig: { ...scheduleData.scheduleConfig, day: e.target.value },
                    })
                  }
                >
                  <MenuItem value="monday">Monday</MenuItem>
                  <MenuItem value="tuesday">Tuesday</MenuItem>
                  <MenuItem value="wednesday">Wednesday</MenuItem>
                  <MenuItem value="thursday">Thursday</MenuItem>
                  <MenuItem value="friday">Friday</MenuItem>
                  <MenuItem value="saturday">Saturday</MenuItem>
                  <MenuItem value="sunday">Sunday</MenuItem>
                </Select>
              </FormControl>
            )}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Recipients
              </Typography>
              {scheduleData.recipients.map((recipient, index) => (
                <Box key={index} sx={{ display: "flex", gap: 1, mb: 1 }}>
                  <TextField
                    label="Email"
                    type="email"
                    value={recipient.email}
                    onChange={(e) => updateRecipient(index, "email", e.target.value)}
                    fullWidth
                  />
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={recipient.role}
                      label="Role"
                      onChange={(e) => updateRecipient(index, "role", e.target.value)}
                    >
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="hr">HR</MenuItem>
                      <MenuItem value="manager">Manager</MenuItem>
                    </Select>
                  </FormControl>
                  {scheduleData.recipients.length > 1 && (
                    <IconButton onClick={() => removeRecipient(index)} color="error">
                      <Close />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button startIcon={<Add />} onClick={addRecipient} size="small">
                Add Recipient
              </Button>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={scheduleData.isActive}
                  onChange={(e) =>
                    setScheduleData({ ...scheduleData, isActive: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setScheduleDialog(false);
              setEditingSchedule(null);
              resetScheduleForm();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={editingSchedule ? handleUpdateSchedule : handleCreateSchedule}
            variant="contained"
            disabled={creatingSchedule || updatingSchedule}
            startIcon={<CheckCircle />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            {creatingSchedule || updatingSchedule
              ? "Saving..."
              : editingSchedule
              ? "Update"
              : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Report Dialog */}
      <Dialog
        open={sendDialog}
        onClose={() => {
          setSendDialog(false);
          resetSendForm();
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              Send Report Now
            </Typography>
            <IconButton onClick={() => setSendDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={sendReportData.reportType}
                label="Report Type"
                onChange={(e) =>
                  setSendReportData({ ...sendReportData, reportType: e.target.value })
                }
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Start Date"
                value={dayjs(sendReportData.startDate)}
                onChange={(date) =>
                  setSendReportData({
                    ...sendReportData,
                    startDate: date ? date.format("YYYY-MM-DD") : "",
                  })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="End Date"
                value={dayjs(sendReportData.endDate)}
                onChange={(date) =>
                  setSendReportData({
                    ...sendReportData,
                    endDate: date ? date.format("YYYY-MM-DD") : "",
                  })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
            <TextField
              label="Recipients (comma-separated emails)"
              value={sendReportData.recipients.join(", ")}
              onChange={(e) =>
                setSendReportData({
                  ...sendReportData,
                  recipients: e.target.value.split(",").map((email) => email.trim()),
                })
              }
              fullWidth
              placeholder="email1@example.com, email2@example.com"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSendDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSendReport}
            variant="contained"
            disabled={sendingReport}
            startIcon={<Send />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            {sendingReport ? "Sending..." : "Send Report"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AutomatedReports;

