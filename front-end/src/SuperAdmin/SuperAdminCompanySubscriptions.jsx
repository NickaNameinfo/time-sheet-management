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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Autocomplete,
} from "@mui/material";
import { apiService } from "../services/api";

export default function SuperAdminCompanySubscriptions() {
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [filterCompany, setFilterCompany] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({
    company_id: "",
    plan_name: "",
    status: "active",
    start_date: "",
    end_date: "",
    amount: "",
    currency: "",
    notes: "",
  });

  const load = () => {
    setLoading(true);
    setError("");
    apiService
      .listCompanySubscriptions({ company_id: companyId || undefined })
      .then((res) => {
        const data = res?.data?.Result ?? [];
        setRows(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e?.response?.data?.Error || e?.message || "Failed to load subscriptions"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    apiService.listCompanies().then((res) => {
      const data = res?.data?.Result ?? res?.Result ?? [];
      setCompanies(Array.isArray(data) ? data : []);
    }).catch(() => setCompanies([]));
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEdit(null);
    setForm({
      company_id: filterCompany?.id ?? companyId ?? "",
      plan_name: "",
      status: "active",
      start_date: "",
      end_date: "",
      amount: "",
      currency: "",
      notes: "",
    });
    setOpen(true);
  };

  const openEdit = (r) => {
    setEdit(r);
    setForm({
      company_id: String(r.company_id || ""),
      plan_name: r.plan_name || "",
      status: r.status || "active",
      start_date: r.start_date || "",
      end_date: r.end_date || "",
      amount: r.amount ?? "",
      currency: r.currency ?? "",
      notes: r.notes ?? "",
    });
    setOpen(true);
  };

  const handleSave = () => {
    setError("");
    setSuccess("");
    const payload = {
      company_id: Number(form.company_id),
      plan_name: form.plan_name,
      status: form.status,
      start_date: form.start_date,
      end_date: form.end_date || null,
      amount: form.amount === "" ? null : Number(form.amount),
      currency: form.currency || null,
      notes: form.notes || null,
    };
    const action = edit
      ? apiService.updateCompanySubscription(edit.id, payload)
      : apiService.createCompanySubscription(payload);
    action
      .then(() => {
        setSuccess(edit ? "Subscription updated" : "Subscription created");
        setOpen(false);
        load();
      })
      .catch((e) => setError(e?.response?.data?.Error || e?.message || "Save failed"));
  };

  const handleDelete = (r) => {
    setError("");
    setSuccess("");
    apiService
      .deleteCompanySubscription(r.id)
      .then(() => {
        setSuccess("Subscription deleted");
        load();
      })
      .catch((e) => setError(e?.response?.data?.Error || e?.message || "Delete failed"));
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Company Subscription Details
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
            <Autocomplete
              size="small"
              options={companies}
              getOptionLabel={(opt) => opt.company_name ? `${opt.company_name} (${opt.company_code || opt.id})` : ""}
              value={filterCompany || null}
              onChange={(_, v) => { setFilterCompany(v || null); setCompanyId(v?.id ?? ""); }}
              sx={{ minWidth: 260 }}
              renderInput={(params) => <TextField {...params} label="Company" placeholder="All companies" />}
            />
            <Button variant="outlined" onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Filter"}
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" onClick={openCreate}>
              Create subscription
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  No subscriptions
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.company_name} ({r.company_code})
                  </TableCell>
                  <TableCell>{r.plan_name}</TableCell>
                  <TableCell>
                    <Chip label={r.status} size="small" />
                  </TableCell>
                  <TableCell>{r.start_date || "—"}</TableCell>
                  <TableCell>{r.end_date || "—"}</TableCell>
                  <TableCell>
                    {r.amount != null ? `${r.amount} ${r.currency || ""}` : "—"}
                  </TableCell>
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
        <DialogTitle>{edit ? "Edit subscription" : "Create subscription"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              options={companies}
              getOptionLabel={(opt) => opt.company_name ? `${opt.company_name} (${opt.company_code || opt.id})` : ""}
              value={companies.find((c) => Number(c.id) === Number(form.company_id)) || null}
              onChange={(_, v) => setForm((p) => ({ ...p, company_id: v?.id ?? "" }))}
              disabled={!!edit}
              renderInput={(params) => <TextField {...params} label="Company" />}
            />
            <TextField
              label="Plan name"
              value={form.plan_name}
              onChange={(e) => setForm((p) => ({ ...p, plan_name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Status"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              fullWidth
              helperText='active | paused | cancelled | expired'
            />
            <TextField
              label="Start date"
              value={form.start_date}
              onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
              fullWidth
              placeholder="YYYY-MM-DD"
            />
            <TextField
              label="End date"
              value={form.end_date}
              onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
              fullWidth
              placeholder="YYYY-MM-DD"
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                label="Amount"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Currency"
                value={form.currency}
                onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                fullWidth
              />
            </Stack>
            <TextField
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              fullWidth
              multiline
              minRows={3}
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

