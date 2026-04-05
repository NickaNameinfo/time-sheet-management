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

export default function SuperAdminCompanyBilling() {
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
    invoice_no: "",
    period_start: "",
    period_end: "",
    due_date: "",
    amount_due: "",
    amount_paid: "",
    status: "draft",
    notes: "",
  });

  const load = () => {
    setLoading(true);
    setError("");
    apiService
      .listCompanyBilling({ company_id: companyId || undefined })
      .then((res) => {
        const data = res?.data?.Result ?? [];
        setRows(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e?.response?.data?.Error || e?.message || "Failed to load billing records"))
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
      invoice_no: "",
      period_start: "",
      period_end: "",
      due_date: "",
      amount_due: "",
      amount_paid: "",
      status: "draft",
      notes: "",
    });
    setOpen(true);
  };

  const openEdit = (r) => {
    setEdit(r);
    setForm({
      company_id: String(r.company_id || ""),
      invoice_no: r.invoice_no || "",
      period_start: r.period_start || "",
      period_end: r.period_end || "",
      due_date: r.due_date || "",
      amount_due: r.amount_due ?? "",
      amount_paid: r.amount_paid ?? "",
      status: r.status || "draft",
      notes: r.notes ?? "",
    });
    setOpen(true);
  };

  const handleSave = () => {
    setError("");
    setSuccess("");
    const payload = {
      company_id: Number(form.company_id),
      invoice_no: form.invoice_no,
      period_start: form.period_start || null,
      period_end: form.period_end || null,
      due_date: form.due_date || null,
      amount_due: form.amount_due === "" ? 0 : Number(form.amount_due),
      amount_paid: form.amount_paid === "" ? 0 : Number(form.amount_paid),
      status: form.status,
      notes: form.notes || null,
    };
    const action = edit ? apiService.updateCompanyBilling(edit.id, payload) : apiService.createCompanyBilling(payload);
    action
      .then(() => {
        setSuccess(edit ? "Billing updated" : "Billing created");
        setOpen(false);
        load();
      })
      .catch((e) => setError(e?.response?.data?.Error || e?.message || "Save failed"));
  };

  const handleDelete = (r) => {
    setError("");
    setSuccess("");
    apiService
      .deleteCompanyBilling(r.id)
      .then(() => {
        setSuccess("Billing deleted");
        load();
      })
      .catch((e) => setError(e?.response?.data?.Error || e?.message || "Delete failed"));
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Company Billing Details
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
              Create invoice
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell>Invoice</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Due</TableCell>
              <TableCell>Amount due</TableCell>
              <TableCell>Amount paid</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  No billing records
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.company_name} ({r.company_code})
                  </TableCell>
                  <TableCell>{r.invoice_no}</TableCell>
                  <TableCell>
                    <Chip label={r.status} size="small" color={r.status === "paid" ? "success" : r.status === "overdue" ? "error" : "default"} />
                  </TableCell>
                  <TableCell>{r.due_date || "—"}</TableCell>
                  <TableCell>{r.amount_due}</TableCell>
                  <TableCell>{r.amount_paid}</TableCell>
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
        <DialogTitle>{edit ? "Edit invoice" : "Create invoice"}</DialogTitle>
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
              label="Invoice no"
              value={form.invoice_no}
              onChange={(e) => setForm((p) => ({ ...p, invoice_no: e.target.value }))}
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                label="Period start"
                value={form.period_start}
                onChange={(e) => setForm((p) => ({ ...p, period_start: e.target.value }))}
                fullWidth
                placeholder="YYYY-MM-DD"
              />
              <TextField
                label="Period end"
                value={form.period_end}
                onChange={(e) => setForm((p) => ({ ...p, period_end: e.target.value }))}
                fullWidth
                placeholder="YYYY-MM-DD"
              />
            </Stack>
            <TextField
              label="Due date"
              value={form.due_date}
              onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
              fullWidth
              placeholder="YYYY-MM-DD"
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                label="Amount due"
                value={form.amount_due}
                onChange={(e) => setForm((p) => ({ ...p, amount_due: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Amount paid"
                value={form.amount_paid}
                onChange={(e) => setForm((p) => ({ ...p, amount_paid: e.target.value }))}
                fullWidth
              />
            </Stack>
            <TextField
              label="Status"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              fullWidth
              helperText="draft | sent | paid | overdue | void"
            />
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

