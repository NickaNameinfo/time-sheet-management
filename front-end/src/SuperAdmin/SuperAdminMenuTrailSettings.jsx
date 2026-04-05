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
  Switch,
  Autocomplete,
} from "@mui/material";
import { apiService } from "../services/api";

export default function SuperAdminMenuTrailSettings() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyId, setCompanyId] = useState("");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    const id = Number(companyId);
    if (!id) {
      setError("Select a company from the list");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    apiService
      .getCompanyMenuTrialSettings(id)
      .then((res) => {
        const data = res?.data?.Result ?? [];
        setRows(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e?.response?.data?.Error || e?.message || "Failed to load menu trial settings"))
      .finally(() => setLoading(false));
  };

  const toggle = (menu_key, trial_enabled) => {
    setRows((prev) => prev.map((r) => (r.menu_key === menu_key ? { ...r, trial_enabled } : r)));
  };

  const setDays = (menu_key, trial_days) => {
    setRows((prev) => prev.map((r) => (r.menu_key === menu_key ? { ...r, trial_days } : r)));
  };

  const save = () => {
    const id = Number(companyId);
    if (!id) return;
    setError("");
    setSuccess("");
    apiService
      .setCompanyMenuTrialSettings(
        id,
        rows.map((r) => ({
          menu_key: r.menu_key,
          trial_enabled: !!r.trial_enabled,
          trial_days: Number(r.trial_days || 30),
        }))
      )
      .then(() => setSuccess("Saved"))
      .catch((e) => setError(e?.response?.data?.Error || e?.message || "Save failed"));
  };

  useEffect(() => {
    apiService.listCompanies().then((res) => {
      const data = res?.data?.Result ?? res?.Result ?? [];
      setCompanies(Array.isArray(data) ? data : []);
    }).catch(() => setCompanies([]));
  }, []);

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Menu Trail Version Setting
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
              value={selectedCompany || null}
              onChange={(_, v) => {
                setSelectedCompany(v || null);
                setCompanyId(v?.id ?? "");
              }}
              sx={{ minWidth: 260 }}
              renderInput={(params) => <TextField {...params} label="Company" />}
            />
            <Button variant="outlined" onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Load"}
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" onClick={save} disabled={rows.length === 0}>
              Save
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Menu</TableCell>
              <TableCell>Key</TableCell>
              <TableCell>Trial enabled</TableCell>
              <TableCell>Trial days</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  Load a company to edit menu trial settings
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.menu_key}>
                  <TableCell>{r.menu_title}</TableCell>
                  <TableCell>{r.menu_key}</TableCell>
                  <TableCell>
                    <Switch checked={!!r.trial_enabled} onChange={(e) => toggle(r.menu_key, e.target.checked)} />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={r.trial_days ?? 30}
                      onChange={(e) => setDays(r.menu_key, e.target.value)}
                      sx={{ width: 120 }}
                      disabled={!r.trial_enabled}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

