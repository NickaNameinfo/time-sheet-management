import React, { useEffect, useState } from "react";
import {
  Box,
  Alert,
  Typography,
  Card,
  CardContent,
  Stack,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Autocomplete,
  Tabs,
  Tab,
} from "@mui/material";
import { apiService } from "../services/api";

export default function SuperAdminCompanyLogins() {
  const [tab, setTab] = useState(0);
  const [rows, setRows] = useState([]);
  const [pendingRows, setPendingRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [filterCompany, setFilterCompany] = useState(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [roleNameOptions, setRoleNameOptions] = useState([]);
  const [form, setForm] = useState({
    company_id: "",
    email: "",
    password: "",
    role: "company_user",
    /** Must match Settings → Roles → role_name (e.g. Video Editor) for Menu Permissions sidebar */
    menu_role_name: "",
    is_active: true,
  });

  const loadPending = () => {
    setLoadingPending(true);
    apiService
      .listCompanyLoginRequestsAdmin({ status: "pending" })
      .then((res) => {
        const data = res?.data?.Result ?? [];
        setPendingRows(Array.isArray(data) ? data : []);
      })
      .catch(() => setPendingRows([]))
      .finally(() => setLoadingPending(false));
  };

  const load = () => {
    setLoading(true);
    setError("");
    apiService
      .listCompanyUsers({
        company_id: companyId || undefined,
        q: q || undefined,
      })
      .then((res) => {
        const data = res?.data?.Result ?? [];
        setRows(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e?.response?.data?.Error || e?.message || "Failed to load company users"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    apiService.listCompanies().then((res) => {
      const data = res?.data?.Result ?? res?.Result ?? [];
      setCompanies(Array.isArray(data) ? data : []);
    }).catch(() => setCompanies([]));
  }, []);

  useEffect(() => {
    apiService
      .getRoles()
      .then((res) => {
        const raw = res?.data?.Result ?? res?.data ?? [];
        const arr = Array.isArray(raw) ? raw : [];
        setRoleNameOptions(arr.map((r) => r.role_name).filter(Boolean));
      })
      .catch(() => setRoleNameOptions([]));
  }, []);

  useEffect(() => {
    load();
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when the selected company or search text changes
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, q]);

  const openCreate = () => {
    setEdit(null);
    setForm({
      company_id: filterCompany?.id ?? companyId ?? "",
      email: "",
      password: "",
      role: "company_user",
      menu_role_name: "",
      is_active: true,
    });
    setOpen(true);
  };

  const openEdit = (r) => {
    setEdit(r);
    setForm({
      company_id: String(r.company_id || ""),
      email: r.email || "",
      password: "",
      role: r.role || "company_user",
      menu_role_name: r.menu_role_name || "",
      is_active: !!r.is_active,
    });
    setOpen(true);
  };

  const handleSave = () => {
    setError("");
    setSuccess("");
    const payload = {
      company_id: Number(form.company_id),
      email: form.email,
      role: form.role,
      menu_role_name: (form.menu_role_name || "").trim() || null,
      is_active: form.is_active,
      ...(form.password ? { password: form.password } : {}),
    };
    const action = edit ? apiService.updateCompanyUser(edit.id, payload) : apiService.createCompanyUser(payload);
    action
      .then(() => {
        setSuccess(edit ? "Company user updated" : "Company user created");
        setOpen(false);
        load();
        loadPending();
      })
      .catch((e) => setError(e?.response?.data?.Error || e?.message || "Save failed"));
  };

  const handleDelete = (r) => {
    setError("");
    setSuccess("");
    apiService
      .deleteCompanyUser(r.id)
      .then(() => {
        setSuccess("Company user deleted");
        load();
      })
      .catch((e) => setError(e?.response?.data?.Error || e?.message || "Delete failed"));
  };

  const handleApproveRequest = (id) => {
    setError("");
    setSuccess("");
    apiService
      .approveCompanyLoginRequest(id)
      .then(() => {
        setSuccess("Request approved; login created");
        loadPending();
        load();
      })
      .catch((e) => setError(e?.response?.data?.Error || e?.message || "Approve failed"));
  };

  const openReject = (id) => {
    setRejectId(id);
    setRejectReason("");
    setRejectOpen(true);
  };

  const confirmReject = () => {
    if (!rejectId) return;
    apiService
      .rejectCompanyLoginRequest(rejectId, { reason: rejectReason })
      .then(() => {
        setSuccess("Request rejected");
        setRejectOpen(false);
        setRejectId(null);
        loadPending();
      })
      .catch((e) => setError(e?.response?.data?.Error || e?.message || "Reject failed"));
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Company Profile Login List
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        <strong>Pending requests</strong> are submitted by company admins from <em>Request company login</em>. Approve to
        create the login, or reject with an optional reason.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Pending requests (${pendingRows.length})`} />
        <Tab label="Active logins" />
      </Tabs>

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

      {tab === 0 && (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Requested</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingPending ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : pendingRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    No pending requests
                  </TableCell>
                </TableRow>
              ) : (
                pendingRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>
                      {r.company_name} ({r.company_code})
                    </TableCell>
                    <TableCell>{r.role}</TableCell>
                    <TableCell>{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</TableCell>
                    <TableCell align="right">
                      <Button size="small" color="success" variant="outlined" onClick={() => handleApproveRequest(r.id)}>
                        Approve
                      </Button>
                      <Button size="small" color="error" onClick={() => openReject(r.id)} sx={{ ml: 1 }}>
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 1 && (
        <>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
            <Autocomplete
              size="small"
              options={companies}
              getOptionLabel={(opt) => opt.company_name ? `${opt.company_name} (${opt.company_code || opt.id})` : ""}
              value={filterCompany || null}
              onChange={(_, v) => { setFilterCompany(v || null); setCompanyId(v?.id ?? ""); }}
              sx={{ minWidth: 260 }}
              renderInput={(params) => <TextField {...params} label="Company" placeholder="All companies" />}
            />
            <TextField
              size="small"
              label="Search email"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="user@company.com"
              sx={{ minWidth: 260 }}
            />
            <Button variant="outlined" onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Filter"}
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" onClick={openCreate}>
              Create login
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Created Tag</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last login</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  No logins
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>
                    {r.company_name} ({r.company_code})
                  </TableCell>
                  <TableCell>{r.role}</TableCell>
                  <TableCell>{r.menu_role_name || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={r.created_tag === "company_created" ? "company_created" : "super_admin_created"}
                      color={r.created_tag === "company_created" ? "info" : "default"}
                      variant={r.created_tag === "company_created" ? "filled" : "outlined"}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={r.is_active ? "active" : "inactive"} size="small" color={r.is_active ? "success" : "default"} />
                  </TableCell>
                  <TableCell>{r.last_login_at ? new Date(r.last_login_at).toLocaleString() : "—"}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => openEdit(r)}>
                      Edit
                    </Button>
                    <Button size="small" color="error" onClick={() => handleDelete(r)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
        </>
      )}

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Reject request</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmReject}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{edit ? "Edit login" : "Create login"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              options={companies}
              getOptionLabel={(opt) => opt.company_name ? `${opt.company_name} (${opt.company_code || opt.id})` : ""}
              value={companies.find((c) => Number(c.id) === Number(form.company_id)) || null}
              onChange={(_, v) => setForm((p) => ({ ...p, company_id: v?.id ?? "" }))}
              disabled={!!edit}
              renderInput={(params) => <TextField {...params} label="Company" helperText={edit ? "Company cannot be changed" : ""} />}
            />
            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              fullWidth
              helperText={edit ? "Email can be updated (password optional)." : ""}
            />
            <TextField
              label={edit ? "New password (optional)" : "Password"}
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Role"
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value === "company_admin" ? "company_admin" : "company_user" }))}
              fullWidth
              helperText='Use "company_admin" or "company_user"'
            />
            <Autocomplete
              freeSolo
              options={roleNameOptions}
              inputValue={form.menu_role_name}
              onInputChange={(_, v) => setForm((p) => ({ ...p, menu_role_name: v }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Menu role (optional)"
                  helperText='Exact match to Settings → Roles name (e.g. "Video Editor"). Company users see only menus where this role is checked in Menu Permissions.'
                />
              )}
            />
            <FormControlLabel
              control={<Switch checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />}
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

