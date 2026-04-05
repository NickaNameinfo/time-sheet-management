import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  FormControlLabel,
  Switch,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  Chip,
} from "@mui/material";
import { Send, History } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/api";
import PageHeaderBreadcrumbs from "../components/PageHeaderBreadcrumbs";

export default function RequestCompanyLogin() {
  const { user, isCompanyAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("company_user");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);

  const loadHistory = () => {
    apiService
      .listMyCompanyLoginRequests()
      .then((res) => {
        const data = res?.data?.Result ?? res?.data ?? [];
        setHistory(Array.isArray(data) ? data : []);
      })
      .catch(() => setHistory([]));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  if (!user?.isCompanyUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Sign in with a company profile login to request additional logins.</Alert>
      </Box>
    );
  }

  if (!isCompanyAdmin()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Only the company admin can submit login requests for Super Admin approval.</Alert>
      </Box>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    apiService
      .createCompanyLoginRequest({ email, password, role, is_active: isActive })
      .then(() => {
        setSuccess("Request sent. Super Admin will review it under Company Profile Login List.");
        setEmail("");
        setPassword("");
        setRole("company_user");
        setIsActive(true);
        loadHistory();
      })
      .catch((err) => setError(err?.response?.data?.Error || err?.message || "Request failed"))
      .finally(() => setSubmitting(false));
  };

  const companyLabel =
    user.company_name && user.company_code
      ? `${user.company_name} (${user.company_code})`
      : user.company_name || user.company_code || `Company #${user.company_id}`;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeaderBreadcrumbs
        items={[{ label: "Dashboard", to: "/Dashboard" }, { label: "Request company login" }]}
        title="Request company login"
        subtitle="Submit a new profile login for Super Admin approval. Same details as creating a login directly."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Card variant="outlined" sx={{ mb: 3, maxWidth: 560 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Company
          </Typography>
          <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>
            {companyLabel}
          </Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                helperText="Min 6 characters. Stored until Super Admin approves."
              />
              <TextField select label="Role" value={role} onChange={(e) => setRole(e.target.value)} fullWidth>
                <MenuItem value="company_user">company_user</MenuItem>
                <MenuItem value="company_admin">company_admin</MenuItem>
              </TextField>
              <FormControlLabel
                control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
                label="Active (when approved)"
              />
              <Button type="submit" variant="contained" disabled={submitting} startIcon={<Send />}>
                {submitting ? "Sending…" : "Send request to Super Admin"}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <History fontSize="small" /> Your requests
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Requested</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No requests yet
                </TableCell>
              </TableRow>
            ) : (
              history.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>{r.role}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={r.status}
                      color={r.status === "pending" ? "warning" : r.status === "approved" ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell>{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
