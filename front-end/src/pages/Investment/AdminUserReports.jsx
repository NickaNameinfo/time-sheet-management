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
  Tabs,
  Tab,
} from "@mui/material";
import { apiService } from "../../services/api";
import CloseIcon from "@mui/icons-material/Close";
import InvestmentPageLayout, { sectionCardSx, cardWithAccentSx, filterRowSx } from "./InvestmentPageLayout";

export default function AdminUserReports() {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [tab, setTab] = useState(0);

  // Investment reports (admin)
  const [invReports, setInvReports] = useState([]);
  const [invLoading, setInvLoading] = useState(false);
  const [invFilters, setInvFilters] = useState({ date_from: "", date_to: "", status: "", plan_type: "", amount_min: "", amount_max: "" });
  const [reportById, setReportById] = useState("");
  const [invDetail, setInvDetail] = useState(null);
  const [invDetailOpen, setInvDetailOpen] = useState(false);
  const [invDetailLoading, setInvDetailLoading] = useState(false);

  // My Self (challenge) reports (admin)
  const [challengeData, setChallengeData] = useState(null);
  const [challengeLoading, setChallengeLoading] = useState(false);

  const [error, setError] = useState("");

  const getApiErrorMessage = (err, fallback) => {
    const status = err?.response?.status;
    const msg = err?.response?.data?.Error || err?.message || fallback;
    if (status === 401) return "Session expired or invalid. Please log in again with an admin account.";
    if (status === 403) return "You don't have permission. Log in with an admin account to view user reports.";
    return msg;
  };

  useEffect(() => {
    let cancelled = false;
    apiService
      .getAdminChallengeUsers()
      .then((res) => {
        if (cancelled) return;
        const result = res?.data?.Result ?? res?.data;
        setUsers(result?.users ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, "Failed to load users"));
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setInvReports([]);
      setChallengeData(null);
      return;
    }
    setError("");
    setInvLoading(true);
    setChallengeLoading(true);
    const baseParams = { user_id: selectedUserId };
    const invParams = { ...baseParams };
    Object.keys(invFilters).forEach((k) => {
      if (invFilters[k] !== "") invParams[k] = invFilters[k];
    });
    apiService
      .getAdminInvestmentReports(invParams)
      .then((res) => {
        const result = res?.data?.Result ?? res?.data;
        setInvReports(result?.reports ?? []);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Failed to load investment reports")))
      .finally(() => setInvLoading(false));
    apiService
      .getAdminChallengeReports(selectedUserId)
      .then((res) => {
        const result = res?.data?.Result ?? res?.data;
        setChallengeData(result);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Failed to load challenge reports")))
      .finally(() => setChallengeLoading(false));
  }, [selectedUserId]);

  const loadInvReports = () => {
    if (!selectedUserId) return;
    setInvLoading(true);
    setError("");
    const params = { user_id: selectedUserId };
    Object.keys(invFilters).forEach((k) => {
      if (invFilters[k] !== "") params[k] = invFilters[k];
    });
    apiService
      .getAdminInvestmentReports(params)
      .then((res) => {
        const result = res?.data?.Result ?? res?.data;
        setInvReports(result?.reports ?? []);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Failed to load reports")))
      .finally(() => setInvLoading(false));
  };

  const handleViewInvDetail = (id) => {
    const idStr = typeof id === "number" ? String(id) : (id || "").trim();
    if (!idStr) return;
    setInvDetailLoading(true);
    setInvDetail(null);
    setInvDetailOpen(true);
    apiService
      .getAdminInvestmentReportById(idStr)
      .then((res) => {
        const result = res?.data?.Result ?? res?.data;
        setInvDetail(result);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Report not found")))
      .finally(() => setInvDetailLoading(false));
  };

  const formatCurrency = (n) => (n != null ? `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—");
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

  return (
    <InvestmentPageLayout
      title="User Investment &amp; My Self Reports"
      subtitle="Admin: select a user to view their investment reports and My Self (challenge) reports."
      maxWidth={1100}
    >
      <Box sx={{ ...cardWithAccentSx(), mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="600" gutterBottom>Select user</Typography>
        <TextField
          select
          fullWidth
          size="small"
          SelectProps={{ native: true }}
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          disabled={usersLoading}
          label="User"
          InputLabelProps={{ shrink: true }}
        >
          <option value="">— Select user —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || u.email || `User #${u.id}`} ({u.email})
            </option>
          ))}
        </TextField>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")} role="alert">{error}</Alert>}

      {!selectedUserId ? (
        <Box sx={{ ...sectionCardSx, py: 4, textAlign: "center" }}>
          <Typography color="text.secondary">Select a user above to view their reports.</Typography>
        </Box>
      ) : (
        <>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Investment Reports" />
            <Tab label="My Self Reports" />
          </Tabs>

          {tab === 0 && (
            <>
              <Box sx={{ ...cardWithAccentSx(), mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>View report by ID</Typography>
                <Box sx={filterRowSx}>
                  <TextField size="small" label="Investment ID" placeholder="Enter ID" value={reportById} onChange={(e) => setReportById(e.target.value)} sx={{ minWidth: 160 }} />
                  <Button variant="outlined" onClick={() => handleViewInvDetail(reportById)} disabled={invDetailLoading || !reportById.trim()} aria-busy={invDetailLoading}>
                    {invDetailLoading ? "Loading…" : "View by ID"}
                  </Button>
                </Box>
              </Box>
              <Box sx={{ ...cardWithAccentSx(), mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>Filters</Typography>
                <Box sx={filterRowSx}>
                  <TextField size="small" label="From" type="date" value={invFilters.date_from} onChange={(e) => setInvFilters((f) => ({ ...f, date_from: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
                  <TextField size="small" label="To" type="date" value={invFilters.date_to} onChange={(e) => setInvFilters((f) => ({ ...f, date_to: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
                  <TextField size="small" label="Status" select SelectProps={{ native: true }} value={invFilters.status} onChange={(e) => setInvFilters((f) => ({ ...f, status: e.target.value }))} sx={{ width: 130 }}>
                    <option value="">All</option>
                    <option value="ACTIVE">Active</option>
                    <option value="MATURED">Matured</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                  </TextField>
                  <TextField size="small" label="Plan" select SelectProps={{ native: true }} value={invFilters.plan_type} onChange={(e) => setInvFilters((f) => ({ ...f, plan_type: e.target.value }))} sx={{ width: 130 }}>
                    <option value="">All</option>
                    <option value="below_5000">Below 5K</option>
                    <option value="above_5000">5K+</option>
                  </TextField>
                  <TextField size="small" label="Min amount" type="number" value={invFilters.amount_min} onChange={(e) => setInvFilters((f) => ({ ...f, amount_min: e.target.value }))} sx={{ width: 110 }} />
                  <TextField size="small" label="Max amount" type="number" value={invFilters.amount_max} onChange={(e) => setInvFilters((f) => ({ ...f, amount_max: e.target.value }))} sx={{ width: 110 }} />
                  <Button variant="contained" onClick={loadInvReports}>Apply</Button>
                </Box>
              </Box>
              {invLoading ? (
                <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
              ) : (
                <TableContainer sx={{ ...sectionCardSx, overflow: "auto", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                  <Table size="small" aria-label="Investment reports for selected user">
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
                      {invReports.length === 0 ? (
                        <TableRow><TableCell colSpan={9} align="center">No records</TableCell></TableRow>
                      ) : (
                        invReports.map((r) => (
                          <TableRow key={r.id} hover onClick={() => handleViewInvDetail(r.id)} sx={{ cursor: "pointer" }}>
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
            </>
          )}

          {tab === 1 && (
            <>
              {challengeLoading ? (
                <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
              ) : !challengeData ? (
                <Box sx={{ ...sectionCardSx, py: 4, textAlign: "center" }}><Typography color="text.secondary">No challenge data.</Typography></Box>
              ) : (
                <Box>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
                    <Chip label={`Active: ${challengeData.total_active ?? 0}`} color="primary" />
                    <Chip label={`Completed: ${challengeData.total_completed ?? 0}`} color="success" />
                    <Chip label={`Longest streak: ${challengeData.streak?.longest ?? 0}`} />
                    <Chip label={`Success rate: ${challengeData.challenge_success_rate ?? 0}%`} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Challenges</Typography>
                  {(challengeData.challenges ?? []).length === 0 ? (
                    <Box sx={{ ...sectionCardSx, py: 4, textAlign: "center" }}><Typography color="text.secondary">No challenges.</Typography></Box>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {(challengeData.challenges ?? []).map((ch) => (
                        <Box key={ch.id} sx={{ ...sectionCardSx, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                          <Box>
                            <Typography fontWeight="600">{ch.title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {ch.completed_days} / {ch.total_days} days • Missed: {ch.missed_days} • Pending: {ch.pending_days}
                            </Typography>
                          </Box>
                          <Chip label={`${ch.completion_percent}%`} color={ch.success ? "success" : "default"} size="small" />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </>
          )}
        </>
      )}

      <Dialog open={invDetailOpen} onClose={() => setInvDetailOpen(false)} maxWidth="sm" fullWidth aria-labelledby="admin-report-dialog-title">
        <DialogTitle id="admin-report-dialog-title">Report #{invDetail?.id} <IconButton onClick={() => setInvDetailOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }} aria-label="Close dialog"><CloseIcon /></IconButton></DialogTitle>
        <DialogContent>
          {invDetail && (
            <Box component="dl" sx={{ "& dt": { fontWeight: 600, color: "text.secondary", fontSize: "0.75rem" }, "& dd": { ml: 0, mb: 1.5 } }}>
              <dt>Amount</dt><dd>{formatCurrency(invDetail.amount)}</dd>
              <dt>Plan</dt><dd>{invDetail.plan_name}</dd>
              <dt>Interest %</dt><dd>{invDetail.interest_percentage}%</dd>
              <dt>Lock-in days</dt><dd>{invDetail.lockin_days}</dd>
              <dt>Start date</dt><dd>{formatDate(invDetail.start_date)}</dd>
              <dt>Maturity date</dt><dd>{formatDate(invDetail.maturity_date)}</dd>
              <dt>Days held</dt><dd>{invDetail.days_held ?? "—"}</dd>
              <dt>Earned amount</dt><dd>{formatCurrency(invDetail.earned_amount)}</dd>
              <dt>Status</dt><dd><Chip label={invDetail.status} size="small" /></dd>
              {invDetail.transaction_id && <><dt>Transaction ID</dt><dd>{invDetail.transaction_id}</dd></>}
              {invDetail.withdrawn_at && <><dt>Withdrawn at</dt><dd>{formatDate(invDetail.withdrawn_at)}</dd></>}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </InvestmentPageLayout>
  );
}
