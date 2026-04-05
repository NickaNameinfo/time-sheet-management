import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { investmentApiService } from "../../services/investmentApi";
import InvestmentPageLayout, { cardWithAccentSx, sectionCardSx } from "./InvestmentPageLayout";
import { appColors } from "../../theme/colors";

function toNum(v) {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function inr(v, digits = 0) {
  return `₹${toNum(v).toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export default function InvestmentDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [investDialogOpen, setInvestDialogOpen] = useState(false);
  const [investSubmitting, setInvestSubmitting] = useState(false);
  const [investForm, setInvestForm] = useState({
    plan_id: "",
    amount: "",
    transaction_id: "",
  });
  const [investError, setInvestError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashRes, listRes] = await Promise.all([
        investmentApiService.getDashboard(),
        investmentApiService.listInvestments(),
      ]);
      const plansRes = await investmentApiService.getPlans();
      const dash = dashRes?.data?.Result ?? dashRes?.data ?? {};
      const listData = listRes?.data?.Result ?? listRes?.data ?? {};
      const plansData = plansRes?.data?.Result ?? plansRes?.data ?? {};
      setDashboard(dash);
      setInvestments(Array.isArray(listData?.investments) ? listData.investments : []);
      setPlans(Array.isArray(plansData?.plans) ? plansData.plans : []);
    } catch (err) {
      setError(err?.response?.data?.Error || err?.message || "Failed to load investment dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const activeInvestments = useMemo(
    () => investments.filter((i) => String(i?.status || "").toUpperCase() === "ACTIVE"),
    [investments]
  );
  const selectedPlan = useMemo(
    () => plans.find((p) => String(p.id) === String(investForm.plan_id)) || null,
    [plans, investForm.plan_id]
  );

  const submitInvest = async () => {
    setInvestError("");
    const planId = Number(investForm.plan_id);
    const amount = Number(investForm.amount);
    const transactionId = String(investForm.transaction_id || "").trim();
    if (!planId || !amount || !transactionId) {
      setInvestError("Plan, amount, and transaction ID are required.");
      return;
    }

    setInvestSubmitting(true);
    try {
      await investmentApiService.validateCheckout({ plan_id: planId, amount });
      await investmentApiService.paymentSuccess({
        plan_id: planId,
        amount,
        transaction_id: transactionId,
      });
      setInvestDialogOpen(false);
      setInvestForm({ plan_id: "", amount: "", transaction_id: "" });
      await load();
    } catch (err) {
      setInvestError(err?.response?.data?.Error || err?.message || "Failed to create investment");
    } finally {
      setInvestSubmitting(false);
    }
  };

  if (loading) {
    return (
      <InvestmentPageLayout title="Investment Dashboard" subtitle="Loading your investment summary.">
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress />
        </Box>
      </InvestmentPageLayout>
    );
  }

  return (
    <InvestmentPageLayout
      title="Investment Dashboard"
      subtitle="My Self investment summary, KYC status, active investments, and quick actions."
      maxWidth={1100}
    >
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} role="alert" action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>
          {error}
        </Alert>
      ) : null}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2, mb: 2 }}>
        <Box sx={cardWithAccentSx(appColors.primary)}>
          <Typography variant="overline" color="text.secondary">Total invested</Typography>
          <Typography variant="h5" fontWeight={800}>{inr(dashboard?.total_invested)}</Typography>
          <Typography variant="body2" color="text.secondary">Active: {toNum(dashboard?.total_active)} | Matured: {toNum(dashboard?.total_matured)}</Typography>
        </Box>
        <Box sx={cardWithAccentSx(appColors.success)}>
          <Typography variant="overline" color="text.secondary">Withdrawable + earnings</Typography>
          <Typography variant="h5" fontWeight={800}>{inr(dashboard?.withdrawable_balance, 2)}</Typography>
          <Typography variant="body2" color="text.secondary">
            Earnings: {inr(dashboard?.total_earnings)} | Referral approved: {inr(dashboard?.referral_balance_approved, 2)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ ...sectionCardSx, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>KYC & quick actions</Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip
            label={`KYC: ${dashboard?.kyc_status || "NOT_SUBMITTED"}`}
            color={dashboard?.kyc_status === "VERIFIED" ? "success" : "warning"}
            variant={dashboard?.kyc_status === "VERIFIED" ? "filled" : "outlined"}
          />
          <Button component={Link} to="/Dashboard/Investment/KYC" variant="outlined" size="small">KYC Status</Button>
          <Button component={Link} to="/Dashboard/Investment/KYC/Submit" variant="outlined" size="small">Submit / Update KYC</Button>
          <Button component={Link} to="/Dashboard/Investment/MySelfReports" variant="outlined" size="small">My Self Reports</Button>
          <Button component={Link} to="/Dashboard/Investment/Reports" variant="outlined" size="small">Investment Reports</Button>
          <Button variant="contained" size="small" onClick={() => setInvestDialogOpen(true)}>Invest now</Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Investment is allowed even before KYC verification (same as mobile). Withdrawal needs verified KYC.
        </Typography>
      </Box>

      <Box sx={{ ...sectionCardSx, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Active investments</Typography>
        {activeInvestments.length === 0 ? (
          <Typography color="text.secondary">No active investments.</Typography>
        ) : (
          activeInvestments.slice(0, 8).map((inv, idx) => (
            <Box key={inv.id || idx}>
              <Box sx={{ py: 1.2, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Typography fontWeight={600}>
                  {inr(inv.amount)} - {inv.plan_name || "Plan"}
                </Typography>
                <Typography color="text.secondary">
                  Maturity: {inv.maturity_date ? new Date(inv.maturity_date).toLocaleDateString() : "-"}
                </Typography>
              </Box>
              {idx < activeInvestments.slice(0, 8).length - 1 ? <Divider /> : null}
            </Box>
          ))
        )}
      </Box>

      <Box sx={sectionCardSx}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>All investment details</Typography>
        {investments.length === 0 ? (
          <Typography color="text.secondary">No investment records found.</Typography>
        ) : (
          investments.slice(0, 20).map((inv, idx) => (
            <Box key={inv.id || idx}>
              <Box sx={{ py: 1.2, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
                <Typography fontWeight={600}>
                  #{inv.id} - {inr(inv.amount)} - {inv.plan_name || "Plan"}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                  <Chip
                    size="small"
                    label={String(inv.status || "UNKNOWN")}
                    color={String(inv.status || "").toUpperCase() === "ACTIVE" ? "primary" : String(inv.status || "").toUpperCase() === "WITHDRAWN" ? "default" : "success"}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Start: {inv.start_date ? new Date(inv.start_date).toLocaleDateString() : "-"} | Maturity: {inv.maturity_date ? new Date(inv.maturity_date).toLocaleDateString() : "-"}
                  </Typography>
                </Box>
              </Box>
              {idx < investments.slice(0, 20).length - 1 ? <Divider /> : null}
            </Box>
          ))
        )}
      </Box>

      <Dialog open={investDialogOpen} onClose={() => !investSubmitting && setInvestDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create investment</DialogTitle>
        <DialogContent>
          {investError ? (
            <Alert severity="error" sx={{ mb: 2 }}>{investError}</Alert>
          ) : null}
          <TextField
            select
            fullWidth
            margin="dense"
            label="Plan"
            value={investForm.plan_id}
            onChange={(e) => setInvestForm((p) => ({ ...p, plan_id: e.target.value }))}
          >
            {plans.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name} ({inr(p.min_amount)} - {inr(p.max_amount)})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            margin="dense"
            label="Amount"
            type="number"
            value={investForm.amount}
            onChange={(e) => setInvestForm((p) => ({ ...p, amount: e.target.value }))}
            helperText={selectedPlan ? `Plan range: ${inr(selectedPlan.min_amount)} to ${inr(selectedPlan.max_amount)}` : ""}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Transaction ID"
            value={investForm.transaction_id}
            onChange={(e) => setInvestForm((p) => ({ ...p, transaction_id: e.target.value }))}
            helperText="Use payment reference/transaction id"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvestDialogOpen(false)} disabled={investSubmitting}>Cancel</Button>
          <Button onClick={submitInvest} variant="contained" disabled={investSubmitting}>
            {investSubmitting ? "Creating..." : "Invest"}
          </Button>
        </DialogActions>
      </Dialog>
    </InvestmentPageLayout>
  );
}

