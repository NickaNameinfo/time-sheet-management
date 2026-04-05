import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Stack,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
} from "@mui/material";
import { PersonAdd, Delete, CheckCircle, Cancel, Refresh } from "@mui/icons-material";
import { apiService } from "../../services/api";

const UserAccess = () => {
  const [settings, setSettings] = useState({ mode: "all", allowedEmails: [] });
  const [newEmail, setNewEmail] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", severity: "success" });

  const loadSettings = () => {
    apiService
      .getUserAccessSettings()
      .then((res) => {
        const data = res?.data?.Result ?? res?.Result ?? res?.data ?? {};
        setSettings({
          mode: data.mode || "all",
          allowedEmails: Array.isArray(data.allowedEmails) ? data.allowedEmails : [],
        });
      })
      .catch(() => setMessage({ text: "Failed to load settings", severity: "error" }));
  };

  const loadRequests = () => {
    apiService
      .getUserAccessRequests()
      .then((res) => {
        const data = res?.data?.Result ?? res?.Result ?? res?.data;
        setRequests(Array.isArray(data) ? data : []);
      })
      .catch(() => setRequests([]));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiService.getUserAccessSettings(),
      apiService.getUserAccessRequests(),
    ])
      .then(([settingsRes, requestsRes]) => {
        const s = settingsRes?.data?.Result ?? settingsRes?.Result ?? settingsRes?.data ?? {};
        setSettings({
          mode: s.mode || "all",
          allowedEmails: Array.isArray(s.allowedEmails) ? s.allowedEmails : [],
        });
        const r = requestsRes?.data?.Result ?? requestsRes?.Result ?? requestsRes?.data;
        setRequests(Array.isArray(r) ? r : []);
      })
      .catch(() => setMessage({ text: "Failed to load data", severity: "error" }))
      .finally(() => setLoading(false));
  }, []);

  const handleModeChange = (e) => {
    const mode = e.target.checked ? "allowlist" : "all";
    setSettings((prev) => ({ ...prev, mode }));
  };

  const handleSaveSettings = () => {
    setSaving(true);
    apiService
      .updateUserAccessSettings({ mode: settings.mode, allowedEmails: settings.allowedEmails })
      .then(() => {
        setMessage({ text: "Settings saved", severity: "success" });
        loadSettings();
      })
      .catch((err) => setMessage({ text: err?.response?.data?.Error || err?.message || "Failed to save", severity: "error" }))
      .finally(() => setSaving(false));
  };

  const handleAddEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ text: "Enter a valid email", severity: "error" });
      return;
    }
    if (settings.allowedEmails.includes(email)) {
      setMessage({ text: "Email already in list", severity: "info" });
      return;
    }
    setSettings((prev) => ({
      ...prev,
      allowedEmails: [...prev.allowedEmails, email],
    }));
    setNewEmail("");
  };

  const handleRemoveEmail = (email) => {
    setSettings((prev) => ({
      ...prev,
      allowedEmails: prev.allowedEmails.filter((e) => e !== email),
    }));
  };

  const handleApprove = (id) => {
    apiService
      .approveUserAccessRequest(id)
      .then(() => {
        setMessage({ text: "Access granted", severity: "success" });
        loadSettings();
        loadRequests();
      })
      .catch((err) => setMessage({ text: err?.response?.data?.Error || "Failed to approve", severity: "error" }));
  };

  const handleReject = (id) => {
    apiService
      .rejectUserAccessRequest(id)
      .then(() => {
        setMessage({ text: "Request rejected", severity: "success" });
        loadRequests();
      })
      .catch((err) => setMessage({ text: err?.response?.data?.Error || "Failed to reject", severity: "error" }));
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        User Access
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Control who can access the application by email. When &quot;Allow by email&quot; is on, only listed emails can log in. Super admin can grant access from pending requests.
      </Typography>

      {message.text && (
        <Alert severity={message.severity} onClose={() => setMessage({ text: "", severity: "success" })} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Access mode
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={settings.mode === "allowlist"}
                onChange={handleModeChange}
                color="primary"
              />
            }
            label={settings.mode === "allowlist" ? "Only allowed emails can access" : "All users can access"}
          />
          {settings.mode === "allowlist" && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Allowed emails
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
                {settings.allowedEmails.map((email) => (
                  <Chip
                    key={email}
                    label={email}
                    onDelete={() => handleRemoveEmail(email)}
                    size="small"
                    sx={{ mb: 0.5 }}
                  />
                ))}
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddEmail())}
                  sx={{ minWidth: 260 }}
                />
                <Button variant="outlined" startIcon={<PersonAdd />} onClick={handleAddEmail}>
                  Add
                </Button>
              </Stack>
            </Box>
          )}
          <Button
            variant="contained"
            onClick={handleSaveSettings}
            disabled={saving}
            sx={{ mt: 2 }}
          >
            {saving ? <CircularProgress size={20} /> : "Save settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">
              Access requests
            </Typography>
            <Button size="small" startIcon={<Refresh />} onClick={loadRequests}>
              Refresh
            </Button>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Requested</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      No requests
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>
                        {row.requested_at
                          ? new Date(row.requested_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.status}
                          size="small"
                          color={row.status === "approved" ? "success" : row.status === "rejected" ? "error" : "default"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {row.status === "pending" && (
                          <>
                            <Button size="small" color="success" startIcon={<CheckCircle />} onClick={() => handleApprove(row.id)}>
                              Approve
                            </Button>
                            <Button size="small" color="error" startIcon={<Cancel />} onClick={() => handleReject(row.id)}>
                              Reject
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserAccess;
