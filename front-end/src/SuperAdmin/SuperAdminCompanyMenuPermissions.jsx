import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Alert,
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

export default function SuperAdminCompanyMenuPermissions() {
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
      .getCompanyMenuPermissions(id)
      .then((res) => {
        const payload = res?.data;
        if (payload?.Status === "Error") {
          setError(payload?.Error || "Failed to load company menu permissions");
          setRows([]);
          return;
        }
        const data = payload?.Result ?? payload?.data ?? [];
        setRows(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e?.response?.data?.Error || e?.message || "Failed to load company menu permissions"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    apiService.listCompanies().then((res) => {
      const data = res?.data?.Result ?? res?.Result ?? [];
      setCompanies(Array.isArray(data) ? data : []);
    }).catch(() => setCompanies([]));
  }, []);

  const toggle = (menu_key, enabled) => {
    setRows((prev) => prev.map((r) => (r.menu_key === menu_key ? { ...r, enabled } : r)));
  };

  const save = () => {
    const id = Number(companyId);
    if (!id) return;
    setError("");
    setSuccess("");
    apiService
      .setCompanyMenuPermissions(
        id,
        rows.map((r) => ({ menu_key: r.menu_key, enabled: !!r.enabled }))
      )
      .then(() => setSuccess("Saved"))
      .catch((e) => setError(e?.response?.data?.Error || e?.message || "Save failed"));
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Company Menu Permission
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
              isOptionEqualToValue={(a, b) => a?.id === b?.id}
              getOptionLabel={(opt) =>
                opt?.company_name ? `${opt.company_name} (${opt.company_code ?? opt.id})` : ""
              }
              value={selectedCompany || null}
              onChange={(_, v) => {
                setSelectedCompany(v || null);
                setCompanyId(v?.id != null ? String(v.id) : "");
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
              <TableCell>Path</TableCell>
              <TableCell>Parent</TableCell>
              <TableCell align="right">Enabled</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  Load a company to edit permissions
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.menu_key}>
                  <TableCell>{r.menu_title}</TableCell>
                  <TableCell>{r.menu_key}</TableCell>
                  <TableCell>{r.menu_path || "—"}</TableCell>
                  <TableCell>{r.parent_menu || "—"}</TableCell>
                  <TableCell align="right">
                    <Switch checked={!!r.enabled} onChange={(e) => toggle(r.menu_key, e.target.checked)} />
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

