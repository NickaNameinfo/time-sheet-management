import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Alert,
  Typography,
  Card,
  CardContent,
  Stack,
  TextField,
  Button,
  Autocomplete,
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
} from "@mui/material";
import { apiService } from "../services/api";

export default function SuperAdminCompanies() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({
    company_code: "",
    company_name: "",
    status: "active",
    admin_email: "",
    admin_password: "",
    admin_role: "company_admin",
  });

  const [adminUserId, setAdminUserId] = useState(null);

  const [leadCompanyQuery, setLeadCompanyQuery] = useState("");
  const [leadCompanies, setLeadCompanies] = useState([]);
  const [leadLoading, setLeadLoading] = useState(false);
  const [selectedLeadCompany, setSelectedLeadCompany] = useState(null);

  const makeCompanyCodeSuggestion = (name) => {
    const cleaned = String(name || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "")
      .slice(0, 10);
    if (cleaned.length >= 3) return cleaned;
    return cleaned || "COMPANY";
  };

  const load = () => {
    setLoading(true);
    setError("");
    apiService
      .listCompanies({ q })
      .then((res) => {
        const data = res?.data?.Result ?? [];
        setRows(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e?.response?.data?.Error || e?.message || "Failed to load companies"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEdit(null);
    setAdminUserId(null);
    setForm({
      company_code: "",
      company_name: "",
      status: "active",
      admin_email: "",
      admin_password: "",
      admin_role: "company_admin",
    });
    setSelectedLeadCompany(null);
    setLeadCompanyQuery("");
    setLeadCompanies([]);
    setOpen(true);
    setTimeout(() => loadLeadCompanies(""), 0);
  };

  const openEdit = (r) => {
    setEdit(r);
    setAdminUserId(null);
    setForm({
      company_code: r.company_code || "",
      company_name: r.company_name || "",
      status: r.status || "active",
      admin_email: "",
      admin_password: "",
      admin_role: "company_admin",
    });
    // Auto-fill admin login details (read-only) from existing company users
    apiService
      .listCompanyUsers({ company_id: r.id })
      .then((res) => {
        const data = res?.data?.Result ?? res?.Result ?? [];
        const adminUser =
          (Array.isArray(data) ? data : []).find((u) => u.role === "company_admin") ||
          (Array.isArray(data) ? data : [])[0];
        if (!adminUser) return;
        setAdminUserId(adminUser.id);
        setForm((p) => ({
          ...p,
          // DB column is `email`; sometimes payload may be `userName` depending on controller.
          admin_email: adminUser.email || adminUser.userName || "",
          admin_role: adminUser.role || "company_admin",
        }));
      })
      .catch((e) => {
        // If token/permission or query fails, show a visible error.
        setError(e?.response?.data?.Error || e?.message || "Failed to load company admin login details");
      });
    setSelectedLeadCompany(null);
    setLeadCompanyQuery("");
    setLeadCompanies([]);
    setOpen(true);
  };

  const loadLeadCompanies = (query) => {
    setLeadLoading(true);
    apiService
      .listLeadCompanies({ q: query || undefined })
      .then((res) => {
        const data = res?.data?.Result ?? [];
        setLeadCompanies(Array.isArray(data) ? data : []);
      })
      .catch(() => setLeadCompanies([]))
      .finally(() => setLeadLoading(false));
  };

  const handleSave = () => {
    setError("");
    setSuccess("");
    if (edit) {
      apiService
        .updateCompany(edit.id, { company_code: form.company_code, company_name: form.company_name, status: form.status })
        .then(() => {
          let loginUpdated = false;
          let loginPromise = Promise.resolve();

          const email = (form.admin_email || "").toString().trim();
          const password = (form.admin_password || "").toString();
          const passwordProvided = password.trim() !== "";
          const role = form.admin_role === "company_admin" ? "company_admin" : "company_user";

          // Update existing company admin login (email/password/role) if we have its user id.
          if (adminUserId) {
            const shouldUpdate =
              email !== "" || passwordProvided || (role === "company_admin" || role === "company_user");

            if (shouldUpdate) {
              const payload = {
                role,
                ...(email ? { email } : {}),
                ...(passwordProvided ? { password } : {}),
              };
              loginUpdated = true;
              loginPromise = apiService.updateCompanyUser(adminUserId, payload);
            }
          } else {
            // If admin user does not exist yet, allow creating it only when password is provided.
            if (email && passwordProvided) {
              loginUpdated = true;
              loginPromise = apiService.createCompanyUser({
                company_id: edit.id,
                email,
                password,
                role,
                is_active: true,
              });
            }
          }

          return loginPromise
            .then(() => {
              setSuccess(loginUpdated ? "Company and admin login updated" : "Company updated");
              setOpen(false);
              load();
            })
            .catch((e) => {
              throw e;
            });
        })
        .catch((e) => setError(e?.response?.data?.Error || e?.message || "Save failed"));
      return;
    }
    apiService
      .createCompany({ company_code: form.company_code, company_name: form.company_name, status: form.status })
      .then((res) => {
        const result = res?.data?.Result ?? res?.Result ?? res?.data ?? res;
        const companyId = result?.id ?? result?.company_id;
        const hasAdmin = (form.admin_email || "").toString().trim() && (form.admin_password || "").toString();
        if (companyId && hasAdmin) {
          return apiService
            .createCompanyUser({
              company_id: companyId,
              email: form.admin_email.trim(),
              password: form.admin_password,
              role: form.admin_role === "company_admin" ? "company_admin" : "company_user",
              is_active: true,
            })
            .then(() => ({ companyCreated: true, userCreated: true }))
            .catch((err) => {
              setError("Company created. Admin user could not be created: " + (err?.response?.data?.Error || err?.message || "Failed"));
              setOpen(false);
              load();
              return Promise.reject({ _handled: true });
            });
        }
        return Promise.resolve({ companyCreated: true, userCreated: false });
      })
      .then((out) => {
        if (out?._handled) return;
        if (out?.userCreated) setSuccess("Company and admin login created. They can sign in with the admin flow and use trail version menus.");
        else if (!edit) setSuccess("Company created");
        setOpen(false);
        load();
      })
      .catch((e) => {
        if (e?._handled) return;
        setError(e?.response?.data?.Error || e?.message || "Save failed");
      });
  };

  const handleDelete = (r) => {
    setError("");
    setSuccess("");
    apiService
      .deleteCompany(r.id)
      .then(() => {
        setSuccess("Company deleted");
        load();
      })
      .catch((e) => setError(e?.response?.data?.Error || e?.message || "Delete failed"));
  };

  const filtered = useMemo(() => rows, [rows]);

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        All Company List
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
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
            <TextField
              size="small"
              label="Search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Company name or code"
              sx={{ minWidth: 260 }}
            />
            <Button variant="outlined" onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Search"}
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" onClick={openCreate}>
              Create company
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  No companies
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.company_code}</TableCell>
                  <TableCell>{r.company_name}</TableCell>
                  <TableCell>
                    <Chip label={r.status} size="small" color={r.status === "active" ? "success" : "default"} />
                  </TableCell>
                  <TableCell>{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</TableCell>
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

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{edit ? "Edit company" : "Create company"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {!edit && (
              <Autocomplete
                options={leadCompanies}
                loading={leadLoading}
                value={selectedLeadCompany}
                onChange={(_, val) => {
                  setSelectedLeadCompany(val);
                  if (val?.company_name) {
                    setForm((p) => ({
                      ...p,
                      company_name: val.company_name,
                      company_code: p.company_code?.trim()
                        ? p.company_code
                        : makeCompanyCodeSuggestion(val.company_name),
                    }));
                  }
                }}
                inputValue={leadCompanyQuery}
                onInputChange={(_, val) => {
                  setLeadCompanyQuery(val);
                  // Load when user types at least 1 char (or clears)
                  loadLeadCompanies(val);
                }}
                getOptionLabel={(opt) => opt?.company_name || ""}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select company from leads (optional)"
                    placeholder="Start typing company name"
                    helperText={
                      selectedLeadCompany
                        ? `Last lead: ${selectedLeadCompany.work_email || "—"} | ${selectedLeadCompany.phone_number || "—"} | ${selectedLeadCompany.company_size || "—"}`
                        : "Pick a company from Lead List to auto-fill Company name/code"
                    }
                  />
                )}
              />
            )}
            <TextField
              label="Company code"
              value={form.company_code}
              onChange={(e) => setForm((p) => ({ ...p, company_code: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Company name"
              value={form.company_name}
              onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Status"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value === "inactive" ? "inactive" : "active" }))}
              fullWidth
              helperText='Use "active" or "inactive"'
            />
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                Admin login (optional) — this user can sign in and use the admin flow with trail version menus
              </Typography>
              <TextField
                label="Admin email (userName)"
                type="email"
                value={form.admin_email}
                onChange={(e) => setForm((p) => ({ ...p, admin_email: e.target.value }))}
                fullWidth
                placeholder="admin@company.com"
              />
              <TextField
                label="Admin password"
                type="password"
                value={form.admin_password}
                onChange={(e) => setForm((p) => ({ ...p, admin_password: e.target.value }))}
                fullWidth
                placeholder="••••••••"
                helperText={edit ? "Leave blank to keep current password. Enter a value to update." : undefined}
              />
              <TextField
                label="Admin role"
                value={form.admin_role}
                onChange={(e) => setForm((p) => ({ ...p, admin_role: e.target.value === "company_user" ? "company_user" : "company_admin" }))}
                fullWidth
                helperText="company_admin or company_user"
              />
            </>
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

