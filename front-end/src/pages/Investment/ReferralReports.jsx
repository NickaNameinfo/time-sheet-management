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
  Skeleton,
  Alert,
  Button,
  TextField,
  InputAdornment,
} from "@mui/material";
import FilterList from "@mui/icons-material/FilterList";
import Search from "@mui/icons-material/Search";
import CalendarToday from "@mui/icons-material/CalendarToday";
import { apiService } from "../../services/api";
import InvestmentPageLayout, { sectionCardSx, cardWithAccentSx } from "./InvestmentPageLayout";
import { investmentColors } from "./investmentTheme";
import People from "@mui/icons-material/People";
import PendingActions from "@mui/icons-material/PendingActions";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Cancel from "@mui/icons-material/Cancel";

export default function ReferralReports() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
      .catch((err) => setError(err?.response?.data?.Error || err?.message || "Failed to load referral data"))
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

  const handleBackfill = () => {
    setBackfilling(true);
    setError("");
    setSuccess("");
    apiService
      .backfillReferralEarnings()
      .then((res) => {
        const result = res?.data?.Result ?? res?.data;
        const created = result?.created ?? 0;
        setSuccess(created > 0 ? `Created ${created} missing referral record(s). Refresh the list.` : "No missing referral records to create.");
        loadList();
      })
      .catch((err) => setError(err?.response?.data?.Error || err?.message || "Backfill failed"))
      .finally(() => setBackfilling(false));
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "–");
  const formatMoney = (n) => (n != null ? `₹${Number(n).toFixed(2)}` : "–");

  const pending = list.filter((r) => r.status === "PENDING_APPROVAL");
  const approved = list.filter((r) => r.status === "APPROVED");
  const rejected = list.filter((r) => r.status === "REJECTED");
  const sumPending = pending.reduce((s, r) => s + Number(r.referral_amount || 0), 0);
  const sumApproved = approved.reduce((s, r) => s + Number(r.referral_amount || 0), 0);
  const sumRejected = rejected.reduce((s, r) => s + Number(r.referral_amount || 0), 0);

  return (
    <InvestmentPageLayout
      title="Referral reports"
      subtitle="View all referral earnings. Referrers earn 2% of referred user's first investment."
    >
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 2 }}>{success}</Alert>}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          color="primary"
          disabled={backfilling}
          onClick={handleBackfill}
        >
          {backfilling ? "Running…" : "Create missing referral records"}
        </Button>
        <Typography variant="body2" color="text.secondary">
          If a referred user already invested but no record appears here, click to create it.
        </Typography>
      </Box>

      {loading ? (
        <Skeleton variant="rectangular" height={120} sx={{ mb: 2, borderRadius: 2 }} />
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
          <Box sx={{ ...cardWithAccentSx("#F59E0B"), minWidth: 160, flex: "1 1 140px", p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <PendingActions sx={{ color: "#F59E0B", fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">Pending approval</Typography>
            </Box>
            <Typography variant="h6" fontWeight={700}>{pending.length}</Typography>
            <Typography variant="body2" color="text.secondary">{formatMoney(sumPending)}</Typography>
          </Box>
          <Box sx={{ ...cardWithAccentSx("#22C55E"), minWidth: 160, flex: "1 1 140px", p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <CheckCircle sx={{ color: "#22C55E", fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">Approved</Typography>
            </Box>
            <Typography variant="h6" fontWeight={700}>{approved.length}</Typography>
            <Typography variant="body2" color="text.secondary">{formatMoney(sumApproved)}</Typography>
          </Box>
          <Box sx={{ ...cardWithAccentSx("#6B7280"), minWidth: 160, flex: "1 1 140px", p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Cancel sx={{ color: "#6B7280", fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">Rejected</Typography>
            </Box>
            <Typography variant="h6" fontWeight={700}>{rejected.length}</Typography>
            <Typography variant="body2" color="text.secondary">{formatMoney(sumRejected)}</Typography>
          </Box>
          <Box sx={{ ...cardWithAccentSx(investmentColors.primary), minWidth: 160, flex: "1 1 140px", p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <People sx={{ color: investmentColors.primary, fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">Total records</Typography>
            </Box>
            <Typography variant="h6" fontWeight={700}>{list.length}</Typography>
            <Typography variant="body2" color="text.secondary">{formatMoney(sumPending + sumApproved + sumRejected)}</Typography>
          </Box>
        </Box>
      )}

      <Box sx={cardWithAccentSx()}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 0.5 }}>
          <FilterList fontSize="small" /> Filters & user-based report
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2, alignItems: "flex-start" }}>
          <TextField
            size="small"
            label="Date from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 140 }}
          />
          <TextField
            size="small"
            label="Date to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 140 }}
          />
          <TextField
            size="small"
            label="Referrer (email)"
            placeholder="Search referrer"
            value={referrerSearch}
            onChange={(e) => setReferrerSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 180 }}
          />
          <TextField
            size="small"
            label="Referred user (email)"
            placeholder="Search referred"
            value={referredSearch}
            onChange={(e) => setReferredSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 180 }}
          />
          <Button size="small" variant="outlined" onClick={resetFilters}>Reset</Button>
          <Button size="small" variant="contained" onClick={loadList}>Apply</Button>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center", mr: 0.5 }}>Status:</Typography>
          <Chip label="All" variant={statusFilter === "" ? "filled" : "outlined"} onClick={() => setStatusFilter("")} sx={{ borderRadius: 2 }} />
          {["PENDING_APPROVAL", "APPROVED", "REJECTED"].map((s) => (
            <Chip key={s} label={s.replace(/_/g, " ")} variant={statusFilter === s ? "filled" : "outlined"} onClick={() => setStatusFilter(s)} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
        {loading ? (
          <Skeleton variant="rectangular" height={200} />
        ) : list.length === 0 ? (
          <Typography color="text.secondary">No referral records found.</Typography>
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
                  <TableCell>Approved at</TableCell>
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
                    <TableCell>{row.approved_at ? formatDate(row.approved_at) : "–"}</TableCell>
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
