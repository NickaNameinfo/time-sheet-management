import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Alert,
  Skeleton,
  TextField,
  InputAdornment,
} from "@mui/material";
import FilterList from "@mui/icons-material/FilterList";
import Search from "@mui/icons-material/Search";
import { apiService } from "../../services/api";
import InvestmentPageLayout, { sectionCardSx, cardWithAccentSx } from "./InvestmentPageLayout";

export default function ReferralEarnings() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updating, setUpdating] = useState(null);
  const [backfilling, setBackfilling] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [referrerSearch, setReferrerSearch] = useState("");
  const [referredSearch, setReferredSearch] = useState("");

  const buildParams = () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (referrerSearch.trim()) params.referrer_email = referrerSearch.trim();
    if (referredSearch.trim()) params.referred_email = referredSearch.trim();
    return params;
  };

  const loadList = () => {
    setLoading(true);
    setError("");
    apiService
      .getReferralEarnings(buildParams())
      .then((res) => {
        const result = res?.data?.Result ?? res?.data;
        const data = result?.referral_earnings ?? [];
        setList(Array.isArray(data) ? data : []);
      })
      .catch((err) => setError(err?.response?.data?.Error || err?.message || "Failed to load referral earnings"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
  }, [statusFilter]);

  const resetFilters = () => {
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setReferrerSearch("");
    setReferredSearch("");
  };

  const handleApprove = (row) => {
    setUpdating(row.id);
    setError("");
    setSuccess("");
    apiService
      .updateReferralEarningStatus(row.id, { status: "APPROVED" })
      .then(() => {
        setSuccess("Referral approved. Amount is now withdrawable for the referrer.");
        loadList();
      })
      .catch((err) => setError(err?.response?.data?.Error || err?.message || "Failed to approve"))
      .finally(() => setUpdating(null));
  };

  const handleReject = (row) => {
    setUpdating(row.id);
    setError("");
    setSuccess("");
    apiService
      .updateReferralEarningStatus(row.id, { status: "REJECTED" })
      .then(() => {
        setSuccess("Referral rejected.");
        loadList();
      })
      .catch((err) => setError(err?.response?.data?.Error || err?.message || "Failed to reject"))
      .finally(() => setUpdating(null));
  };

  const handleBackfill = () => {
    setBackfilling(true);
    setError("");
    apiService
      .backfillReferralEarnings()
      .then((res) => {
        const result = res?.data?.Result ?? res?.data;
        const created = result?.created ?? 0;
        setSuccess(created > 0 ? `Created ${created} missing referral record(s).` : "No missing records.");
        loadList();
      })
      .catch((err) => setError(err?.response?.data?.Error || err?.message || "Backfill failed"))
      .finally(() => setBackfilling(false));
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "–");
  const formatMoney = (n) => (n != null ? `₹${Number(n).toFixed(2)}` : "–");

  return (
    <InvestmentPageLayout
      title="Referral earnings"
      subtitle="Approve or reject referral payouts. Referrers earn 2% of referred user's first investment; after approval the amount is withdrawable."
    >
      <Box sx={cardWithAccentSx()}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          <Chip label="All" variant={statusFilter === "" ? "filled" : "outlined"} color="primary" onClick={() => setStatusFilter("")} sx={{ borderRadius: 2 }} />
          {["PENDING_APPROVAL", "APPROVED", "REJECTED"].map((s) => (
            <Chip key={s} label={s.replace(/_/g, " ")} color={s === "PENDING_APPROVAL" ? "warning" : s === "APPROVED" ? "success" : "default"} variant={statusFilter === s ? "filled" : "outlined"} onClick={() => setStatusFilter(s)} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
        {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 2 }}>{success}</Alert>}
        <Box sx={{ mb: 2 }}>
          <Button variant="outlined" size="small" disabled={backfilling} onClick={handleBackfill}>
            {backfilling ? "Running…" : "Create missing referral records"}
          </Button>
        </Box>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 0.5 }}>
          <FilterList fontSize="small" /> Filters & user-based report
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2, alignItems: "flex-start" }}>
          <TextField size="small" label="Date from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 140 }} />
          <TextField size="small" label="Date to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 140 }} />
          <TextField size="small" label="Referrer (email)" placeholder="Search referrer" value={referrerSearch} onChange={(e) => setReferrerSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} sx={{ minWidth: 180 }} />
          <TextField size="small" label="Referred user (email)" placeholder="Search referred" value={referredSearch} onChange={(e) => setReferredSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} sx={{ minWidth: 180 }} />
          <Button size="small" variant="outlined" onClick={resetFilters}>Reset</Button>
          <Button size="small" variant="contained" onClick={loadList}>Apply</Button>
        </Box>
        {loading ? (
          <Skeleton variant="rectangular" height={200} />
        ) : list.length === 0 ? (
          <Typography color="text.secondary">No referral earnings found.</Typography>
        ) : (
          <TableContainer sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Referrer</TableCell>
                  <TableCell>Referred user</TableCell>
                  <TableCell align="right">First investment</TableCell>
                  <TableCell align="right">Referral (2%)</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.created_at)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{row.referrer_name || "–"}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.referrer_email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{row.referred_name || "–"}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.referred_email}</Typography>
                    </TableCell>
                    <TableCell align="right">{formatMoney(row.first_investment_amount)}</TableCell>
                    <TableCell align="right">{formatMoney(row.referral_amount)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.status?.replace(/_/g, " ")}
                        color={row.status === "PENDING_APPROVAL" ? "warning" : row.status === "APPROVED" ? "success" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {row.status === "PENDING_APPROVAL" ? (
                        <>
                          <Button
                            size="small"
                            color="primary"
                            variant="contained"
                            disabled={updating === row.id}
                            onClick={() => handleApprove(row)}
                            sx={{ mr: 0.5 }}
                          >
                            {updating === row.id ? "..." : "Approve"}
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            disabled={updating === row.id}
                            onClick={() => handleReject(row)}
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        "–"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </InvestmentPageLayout>
  );
}
