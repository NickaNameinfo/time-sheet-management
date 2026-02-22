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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { apiService } from "../../services/api";
import InvestmentPageLayout, { sectionCardSx, cardWithAccentSx } from "./InvestmentPageLayout";

const SETTLEMENT_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SETTLED", label: "Settled" },
];

export default function WithdrawalRequests() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updating, setUpdating] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({ open: false, row: null });
  const [rejectNote, setRejectNote] = useState("");
  const [settlementDialog, setSettlementDialog] = useState({ open: false, row: null });
  const [settlementStatus, setSettlementStatus] = useState("PENDING");
  const [settlementDate, setSettlementDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING_APPROVAL");

  const loadList = () => {
    setLoading(true);
    setError("");
    apiService
      .getWithdrawalRequests({ status: statusFilter })
      .then((res) => {
        const result = res?.data?.Result ?? res?.data;
        const data = result?.requests ?? [];
        setList(data);
      })
      .catch((err) => setError(err?.response?.data?.Error || err?.message || "Failed to load withdrawal requests"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
  }, [statusFilter]);

  const handleApprove = (row) => {
    setUpdating(row.id);
    setError("");
    setSuccess("");
    apiService
      .updateWithdrawalRequestStatus(row.id, { status: "APPROVED" })
      .then(() => {
        setSuccess("Withdrawal approved and processed.");
        loadList();
      })
      .catch((err) => setError(err?.response?.data?.Error || err?.message || "Failed to approve"))
      .finally(() => setUpdating(null));
  };

  const handleReject = (row, note) => {
    setUpdating(row.id);
    setError("");
    setSuccess("");
    apiService
      .updateWithdrawalRequestStatus(row.id, { status: "REJECTED", admin_note: note || null })
      .then(() => {
        setSuccess("Withdrawal request rejected.");
        setRejectDialog({ open: false, row: null });
        setRejectNote("");
        loadList();
      })
      .catch((err) => setError(err?.response?.data?.Error || err?.message || "Failed to reject"))
      .finally(() => setUpdating(null));
  };

  const openSettlementDialog = (row) => {
    setSettlementDialog({ open: true, row });
    setSettlementStatus(row.settlement_status || "PENDING");
    setSettlementDate(row.settlement_date ? String(row.settlement_date).slice(0, 10) : "");
  };

  const handleUpdateSettlement = () => {
    const row = settlementDialog.row;
    if (!row) return;
    setUpdating(row.id);
    setError("");
    setSuccess("");
    apiService
      .updateWithdrawalRequestStatus(row.id, {
        settlement_status: settlementStatus,
        settlement_date: settlementDate.trim() || null,
      })
      .then(() => {
        setSuccess("Settlement updated.");
        setSettlementDialog({ open: false, row: null });
        loadList();
      })
      .catch((err) => setError(err?.response?.data?.Error || err?.message || "Failed to update settlement"))
      .finally(() => setUpdating(null));
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "–");
  const formatDateOnly = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "–");
  const formatMoney = (n) => (n != null ? `₹${Number(n).toFixed(2)}` : "–");

  return (
    <InvestmentPageLayout
      title="Withdrawal requests"
      subtitle="Early withdrawals (before 15 days) – 3% deducted. Approve or reject requests."
    >
      <Box sx={cardWithAccentSx()}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {["PENDING_APPROVAL", "APPROVED", "REJECTED"].map((s) => (
            <Chip key={s} label={s.replace("_", " ")} color={s === "PENDING_APPROVAL" ? "primary" : s === "APPROVED" ? "success" : "default"} variant={statusFilter === s ? "filled" : "outlined"} onClick={() => setStatusFilter(s)} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
        {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 2 }}>{success}</Alert>}
        {loading ? (
          <Skeleton variant="rectangular" height={200} />
        ) : list.length === 0 ? (
          <Typography color="text.secondary">No withdrawal requests found.</Typography>
        ) : (
          <TableContainer sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Requested</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell align="right">Requested</TableCell>
                  <TableCell align="right">Deduction (3%)</TableCell>
                  <TableCell align="right">Amount to pay</TableCell>
                  <TableCell>Days held</TableCell>
                  {(statusFilter === "APPROVED" || statusFilter === "REJECTED") && (
                    <>
                      <TableCell>Settlement status</TableCell>
                      <TableCell>Settlement date</TableCell>
                    </>
                  )}
                  {statusFilter === "PENDING_APPROVAL" && <TableCell align="right">Actions</TableCell>}
                  {statusFilter === "APPROVED" && <TableCell align="right">Settlement</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.requested_at)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{row.user_name || "–"}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.user_email}</Typography>
                    </TableCell>
                    <TableCell align="right">{formatMoney(row.requested_amount)}</TableCell>
                    <TableCell align="right">-{formatMoney(row.deduction_amount)}</TableCell>
                    <TableCell align="right">{formatMoney(row.amount_after_deduction)}</TableCell>
                    <TableCell>{row.days_held ?? "–"}</TableCell>
                    {(statusFilter === "APPROVED" || statusFilter === "REJECTED") && (
                      <>
                        <TableCell>{row.settlement_status ?? "–"}</TableCell>
                        <TableCell>{row.settlement_date ? formatDateOnly(row.settlement_date) : "–"}</TableCell>
                      </>
                    )}
                    {statusFilter === "PENDING_APPROVAL" && (
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="primary"
                          disabled={updating === row.id}
                          onClick={() => handleApprove(row)}
                        >
                          {updating === row.id ? "..." : "Approve"}
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          disabled={updating === row.id}
                          onClick={() => setRejectDialog({ open: true, row })}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    )}
                    {statusFilter === "APPROVED" && (
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={updating === row.id}
                          onClick={() => openSettlementDialog(row)}
                        >
                          {updating === row.id ? "..." : "Update"}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, row: null })}>
        <DialogTitle>Reject withdrawal request</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Note (optional)"
            multiline
            rows={2}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            sx={{ mt: 1, minWidth: 320 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, row: null })}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => rejectDialog.row && handleReject(rejectDialog.row, rejectNote)}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={settlementDialog.open} onClose={() => setSettlementDialog({ open: false, row: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Update settlement</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Settlement status</InputLabel>
            <Select
              value={settlementStatus}
              label="Settlement status"
              onChange={(e) => setSettlementStatus(e.target.value)}
            >
              {SETTLEMENT_STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            type="date"
            label="Settlement date"
            value={settlementDate}
            onChange={(e) => setSettlementDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettlementDialog({ open: false, row: null })}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateSettlement} disabled={updating === settlementDialog.row?.id}>
            {updating === settlementDialog.row?.id ? "Updating…" : "Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </InvestmentPageLayout>
  );
}
