import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  TextField,
  Button,
  Chip,
  Autocomplete,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  IconButton,
} from "@mui/material";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import { apiService } from "../services/api";

export default function SuperAdminTrailVersions() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [details, setDetails] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [defaultDays, setDefaultDays] = useState("30");
  const [entries, setEntries] = useState([]);

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [newDays, setNewDays] = useState("30");
  const [newEmail, setNewEmail] = useState("");
  const [newEmailDays, setNewEmailDays] = useState("30");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      apiService.getTrailVersionDetails().catch(() => null),
      apiService.listCompanies().catch(() => ({ data: { Result: [] }, Result: [] })),
    ])
      .then(([detailsRes, companiesRes]) => {
        const list = companiesRes?.data?.Result ?? companiesRes?.Result ?? companiesRes?.data ?? [];
        setCompanies(Array.isArray(list) ? list : []);
        const d = detailsRes?.data?.Result ?? detailsRes?.data ?? detailsRes?.Result ?? detailsRes;
        if (d && (Array.isArray(d.config) || Array.isArray(d.entries) || d.default_days != null)) {
          setDetails({
            config: d.config ?? d.entries ?? [],
            default_days: d.default_days ?? 30,
            active_access: d.active_access ?? [],
          });
          setDefaultDays(String(d.default_days ?? 30));
          setEntries((Array.isArray(d.config) ? d.config : Array.isArray(d.entries) ? d.entries : []).map((r) => ({ ...r, type: r.type || (r.email ? "email" : "company") })));
        } else {
          apiService.getTrailVersionConfig().then((r) => {
            const data = r?.data?.Result ?? r?.Result ?? r?.data ?? r ?? {};
            const ent = Array.isArray(data.entries) ? data.entries : [];
            setDefaultDays(String(data.default_days ?? 30));
            setEntries(ent.map((e) => ({ ...e, type: e.type || (e.email ? "email" : "company") })));
            setDetails({ config: ent, default_days: data.default_days ?? 30, active_access: [] });
          }).catch(() => {
            setEntries([]);
            setDefaultDays("30");
            setDetails({ config: [], default_days: 30, active_access: [] });
          });
        }
      })
      .catch((e) => {
        setError(e?.response?.data?.Error || e?.message || "Failed to load");
        setDetails({ config: [], default_days: 30, active_access: [] });
      })
      .finally(() => setLoading(false));
  }, []);

  const companyEntries = useMemo(() => entries.filter((e) => e.type === "company"), [entries]);
  const emailEntries = useMemo(() => entries.filter((e) => e.type === "email"), [entries]);
  const companyIdsInList = useMemo(() => new Set(companyEntries.map((c) => c.company_id)), [companyEntries]);

  const handleAddCompany = () => {
    if (!selectedCompany) {
      setError("Select a company");
      return;
    }
    const id = selectedCompany.id ?? selectedCompany.company_id;
    const name = selectedCompany.company_name ?? selectedCompany.name ?? "";
    if (!id || !name) {
      setError("Invalid company");
      return;
    }
    if (companyIdsInList.has(id)) {
      setError("Company already in trial list");
      return;
    }
    setError("");
    setSuccess("");
    const days = Math.max(1, Math.min(365, parseInt(newDays, 10) || 30));
    setEntries((prev) =>
      [...prev, { type: "company", company_id: id, company_name: name, days }].sort((a, b) => {
        const na = a.company_name || a.email || "";
        const nb = b.company_name || b.email || "";
        return na.localeCompare(nb);
      })
    );
    setSelectedCompany(null);
    setNewDays("30");
  };

  const handleAddEmail = () => {
    const email = (newEmail || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email");
      return;
    }
    if (entries.some((e) => e.type === "email" && (e.email || "").toLowerCase() === email)) {
      setError("Email already in list");
      return;
    }
    setError("");
    setSuccess("");
    const days = Math.max(1, Math.min(365, parseInt(newEmailDays, 10) || 30));
    setEntries((prev) =>
      [...prev, { type: "email", email, days }].sort((a, b) => {
        const na = a.company_name || a.email || "";
        const nb = b.company_name || b.email || "";
        return na.localeCompare(nb);
      })
    );
    setNewEmail("");
    setNewEmailDays("30");
  };

  const handleRemove = (idx) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    setSaving(true);
    setError("");
    setSuccess("");
    const payload = {
      default_days: Math.max(1, Math.min(365, parseInt(defaultDays, 10) || 30)),
      entries: entries.map((e) =>
        e.type === "email"
          ? { type: "email", email: e.email, days: e.days }
          : { type: "company", company_id: e.company_id, company_name: e.company_name, days: e.days }
      ),
    };
    apiService
      .saveTrailVersionConfig(payload)
      .then((res) => {
        const data = res?.data?.Result ?? res?.Result ?? res?.data ?? {};
        if (data.entries) setEntries(data.entries);
        if (data.default_days != null) setDefaultDays(String(data.default_days));
        setSuccess("Trail version config saved. Access is based on the table below.");
        return apiService.getTrailVersionDetails().then((r) => {
          const d = r?.data?.Result ?? r?.Result ?? r?.data ?? {};
          setDetails(d);
        });
      })
      .catch((e) => setError(e?.response?.data?.Error || e?.message || "Failed to save"))
      .finally(() => setSaving(false));
  };

  const active_access = details?.active_access ?? [];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Trail Version (List & Details)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        <strong>Who can use a trial</strong> is stored in <strong>trail_version_config</strong> (companies/emails below). When an allowed user first logs in, a row is created in{" "}
        <strong>trail_version_access</strong> with start and end times. The table at the bottom lists those records:{" "}
        <strong>Status</strong> shows whether the trial period is still active or already ended (compare <em>Expires</em> to today). This page does not measure general “software usage” after trial—only trial window dates.
      </Typography>

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

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Default trial days
          </Typography>
          <TextField
            size="small"
            label="Days"
            value={defaultDays}
            onChange={(e) => setDefaultDays(e.target.value)}
            sx={{ maxWidth: 200 }}
          />
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Trail version config (who gets access)
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }} alignItems={{ sm: "center" }}>
            <Autocomplete
              size="small"
              options={companies.filter((c) => !companyIdsInList.has(c.id ?? c.company_id))}
              getOptionLabel={(opt) => opt.company_name ?? opt.name ?? ""}
              value={selectedCompany}
              onChange={(_, v) => setSelectedCompany(v)}
              sx={{ minWidth: 260 }}
              renderInput={(params) => <TextField {...params} label="Company" placeholder="Select company" />}
            />
            <TextField size="small" label="Days" value={newDays} onChange={(e) => setNewDays(e.target.value)} sx={{ width: 100 }} />
            <Button variant="outlined" onClick={handleAddCompany}>
              Add company
            </Button>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }} alignItems={{ sm: "center" }}>
            <TextField
              size="small"
              label="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="user@example.com"
              sx={{ minWidth: 260 }}
            />
            <TextField size="small" label="Days" value={newEmailDays} onChange={(e) => setNewEmailDays(e.target.value)} sx={{ width: 100 }} />
            <Button variant="outlined" onClick={handleAddEmail}>
              Add email
            </Button>
          </Stack>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Company / Email</TableCell>
                  <TableCell>Days</TableCell>
                  <TableCell width={60} align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
                      No entries. Add companies or emails above.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((e, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Chip label={e.type} size="small" color={e.type === "company" ? "primary" : "default"} />
                      </TableCell>
                      <TableCell>{e.type === "company" ? `${e.company_name} (ID ${e.company_id})` : e.email}</TableCell>
                      <TableCell>{e.days}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="error" onClick={() => handleRemove(idx)} aria-label="Remove">
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ mb: 2 }}>
        {saving ? "Saving…" : "Save settings"}
      </Button>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Trial access records (who started a trial)
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            <strong>Active</strong> = now is before Expires (still in trial). <strong>Expired</strong> = trial window ended; they may still use the app if you have a separate subscription—this list only tracks the trial period.
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User / Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Days left</TableCell>
                  <TableCell>Started</TableCell>
                  <TableCell>Expires</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {active_access.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 2 }}>
                      No trial access records yet (no one on the allowlist has logged in to start a trial).
                    </TableCell>
                  </TableRow>
                ) : (
                  active_access.map((a) => {
                    const expired =
                      a.is_expired === true ||
                      a.trial_status === "expired" ||
                      (a.expires_at && new Date(a.expires_at) < new Date());
                    const active = !expired;
                    return (
                      <TableRow key={a.id}>
                        <TableCell>{a.label}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={active ? "Active" : "Expired"}
                            color={active ? "success" : "default"}
                            variant={active ? "filled" : "outlined"}
                          />
                        </TableCell>
                        <TableCell>
                          {active && a.days_remaining != null ? `${a.days_remaining} day(s)` : "—"}
                        </TableCell>
                        <TableCell>{a.started_at ? new Date(a.started_at).toLocaleString() : "—"}</TableCell>
                        <TableCell>{a.expires_at ? new Date(a.expires_at).toLocaleString() : "—"}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
