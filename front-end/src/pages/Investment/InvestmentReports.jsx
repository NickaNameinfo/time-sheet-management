import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { investmentApiService } from "../../services/investmentApi";
import InvestmentPageLayout, { sectionCardSx, cardWithAccentSx, filterRowSx } from "./InvestmentPageLayout";

export default function InvestmentReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ date_from: "", date_to: "", status: "", plan_type: "", amount_min: "", amount_max: "" });
  const [reportById, setReportById] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadReports = (params = {}) => {
    setLoading(true);
    setError("");
    const queryParams = { ...filters, ...params };
    Object.keys(queryParams).forEach((k) => (queryParams[k] === "" ? delete queryParams[k] : null));
    investmentApiService
      .getInvestmentReports(queryParams)
      .then((res) => {
        const result = res?.data?.Result ?? res?.data;
        setReports(result?.reports ?? []);
      })
      .catch((err) => setError(err?.response?.data?.Error || err?.message || "Failed to load reports"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleViewDetail = (id) => {
    if (id == null) return;
    const idStr = typeof id === "number" ? String(id) : (id || "").trim();
    if (!idStr) return;
    setLoadingDetail(true);
    setDetail(null);
    setDetailOpen(true);
    investmentApiService
      .getInvestmentReportById(idStr)
      .then((res) => {
        const result = res?.data?.Result ?? res?.data;
        setDetail(result);
      })
      .catch((err) => setError(err?.response?.data?.Error || err?.message || "Report not found"))
      .finally(() => setLoadingDetail(false));
  };

  const handleViewById = () => handleViewDetail(reportById.trim());

  const formatCurrency = (n) => (n != null ? `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—");
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

  return (
    <InvestmentPageLayout
      title="Investment Reports"
      subtitle="Filter by date range, status, plan type, and amount. View a single report by ID."
      maxWidth={1100}
    >
      <Box sx={{ ...cardWithAccentSx(), mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="600" gutterBottom>View report by ID</Typography>
        <Box sx={filterRowSx}>
          <TextField
            size="small"
            label="Investment ID"
            placeholder="Enter ID"
            value={reportById}
            onChange={(e) => setReportById(e.target.value)}
            sx={{ minWidth: 160 }}
            inputProps={{ "aria-label": "Investment report ID" }}
          />
          <Button variant="outlined" onClick={handleViewById} disabled={loadingDetail || !reportById.trim()} aria-busy={loadingDetail}>
            {loadingDetail ? "Loading…" : "View by ID"}
          </Button>
        </Box>
      </Box>

      <Box sx={{ ...cardWithAccentSx(), mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="600" gutterBottom>Filters</Typography>
        <Box sx={filterRowSx}>
          <TextField size="small" label="From" type="date" value={filters.date_from} onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
          <TextField size="small" label="To" type="date" value={filters.date_to} onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
          <TextField size="small" label="Status" select SelectProps={{ native: true }} value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} sx={{ width: 130 }}>
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="MATURED">Matured</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </TextField>
          <TextField size="small" label="Plan" select SelectProps={{ native: true }} value={filters.plan_type} onChange={(e) => setFilters((f) => ({ ...f, plan_type: e.target.value }))} sx={{ width: 130 }}>
            <option value="">All</option>
            <option value="below_5000">Below 5K</option>
            <option value="above_5000">5K+</option>
          </TextField>
          <TextField size="small" label="Min amount" type="number" value={filters.amount_min} onChange={(e) => setFilters((f) => ({ ...f, amount_min: e.target.value }))} sx={{ width: 110 }} />
          <TextField size="small" label="Max amount" type="number" value={filters.amount_max} onChange={(e) => setFilters((f) => ({ ...f, amount_max: e.target.value }))} sx={{ width: 110 }} />
          <Button variant="contained" onClick={() => loadReports(filters)}>Apply</Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")} role="alert">
          {error}
        </Alert>
      )}

      {loading ? (
        <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
      ) : (
        <TableContainer sx={{ ...sectionCardSx, overflow: "auto", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
          <Table size="small" stickyHeader aria-label="Investment reports">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Interest %</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>Maturity</TableCell>
                <TableCell>Days held</TableCell>
                <TableCell>Earned</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center">No records</TableCell></TableRow>
              ) : (
                reports.map((r) => (
                  <TableRow
                    key={r.id}
                    hover
                    onClick={() => handleViewDetail(r.id)}
                    sx={{ cursor: "pointer" }}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleViewDetail(r.id)}
                    aria-label={`View report ${r.id}, ${formatCurrency(r.amount)}, ${r.status}`}
                  >
                    <TableCell>{r.id}</TableCell>
                    <TableCell align="right">{formatCurrency(r.amount)}</TableCell>
                    <TableCell>{r.plan_name ?? "—"}</TableCell>
                    <TableCell>{r.interest_percentage ?? "—"}%</TableCell>
                    <TableCell>{formatDate(r.start_date)}</TableCell>
                    <TableCell>{formatDate(r.maturity_date)}</TableCell>
                    <TableCell>{r.days_held ?? "—"}</TableCell>
                    <TableCell>{formatCurrency(r.earned_amount)}</TableCell>
                    <TableCell><Chip label={r.status} size="small" color={r.status === "ACTIVE" ? "primary" : r.status === "WITHDRAWN" ? "default" : "success"} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth aria-labelledby="report-dialog-title">
        <DialogTitle id="report-dialog-title">
          Report #{detail?.id}
          <IconButton onClick={() => setDetailOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }} aria-label="Close dialog">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {detail && (
            <Box component="dl" sx={{ "& dt": { fontWeight: 600, color: "text.secondary", fontSize: "0.8rem", mt: 1.5 }, "& dd": { ml: 0, mb: 0.5 } }}>
              <dt>Amount</dt><dd>{formatCurrency(detail.amount)}</dd>
              <dt>Plan</dt><dd>{detail.plan_name}</dd>
              <dt>Interest %</dt><dd>{detail.interest_percentage}%</dd>
              <dt>Lock-in days</dt><dd>{detail.lockin_days}</dd>
              <dt>Start date</dt><dd>{formatDate(detail.start_date)}</dd>
              <dt>Maturity date</dt><dd>{formatDate(detail.maturity_date)}</dd>
              <dt>Days held</dt><dd>{detail.days_held ?? "—"}</dd>
              <dt>Earned amount</dt><dd>{formatCurrency(detail.earned_amount)}</dd>
              <dt>Status</dt><dd><Chip label={detail.status} size="small" /></dd>
              {detail.transaction_id && <><dt>Transaction ID</dt><dd>{detail.transaction_id}</dd></>}
              {detail.withdrawn_at && <><dt>Withdrawn at</dt><dd>{formatDate(detail.withdrawn_at)}</dd></>}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </InvestmentPageLayout>
  );
}
