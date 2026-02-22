import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Alert, Chip, Skeleton, IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { investmentApiService } from "../../services/investmentApi";
import InvestmentPageLayout, { sectionCardSx, cardWithAccentSx } from "./InvestmentPageLayout";

function MaskedRow({ label, value, show, onToggle }) {
  if (value == null || value === "") return null;
  const display = show ? value : "••••••••";
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
      <Typography component="dt" sx={{ fontWeight: 600, fontSize: "0.8rem", color: "text.secondary", minWidth: 140 }}>
        {label}
      </Typography>
      <Typography component="dd" sx={{ m: 0, flex: 1, fontFamily: "monospace", fontSize: "0.95rem" }}>{display}</Typography>
      <IconButton
        size="small"
        onClick={onToggle}
        aria-label={show ? `Hide ${label}` : `Show ${label}`}
        sx={{ p: 0.75 }}
      >
        {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </IconButton>
    </Box>
  );
}

export default function KycStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAccount, setShowAccount] = useState(false);
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [showPan, setShowPan] = useState(false);

  useEffect(() => {
    let cancelled = false;
    investmentApiService
      .getKycStatus()
      .then((res) => {
        if (cancelled) return;
        const result = res?.data?.Result ?? res?.data;
        setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.Error || err?.message || "Failed to load KYC");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <InvestmentPageLayout title="KYC Status">
        <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={80} sx={{ mt: 2, borderRadius: 3 }} />
      </InvestmentPageLayout>
    );
  }

  if (error) {
    return (
      <InvestmentPageLayout title="KYC Status">
        <Alert severity="error" role="alert" onClose={() => setError("")}>{error}</Alert>
      </InvestmentPageLayout>
    );
  }

  const status = data?.status ?? null;
  const kyc = data?.kyc ?? null;

  return (
    <InvestmentPageLayout
      title="KYC Status"
      subtitle="Bank and identity details for Investment. Aadhaar and PAN are verified within 24 hours."
      maxWidth={720}
    >
      {!kyc ? (
        <Box sx={{ ...sectionCardSx, textAlign: "center", py: 4 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>No KYC submitted yet.</Typography>
          <Button component={Link} to="/Dashboard/Investment/KYC/Submit" variant="contained" size="large" sx={{ borderRadius: 2, px: 3 }}>
            Submit KYC
          </Button>
        </Box>
      ) : (
        <Box sx={cardWithAccentSx()}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="600">Status</Typography>
            <Chip
              label={status === "VERIFIED" ? "Verified" : "Pending verification"}
              color={status === "VERIFIED" ? "success" : "warning"}
              size="medium"
              aria-label={`KYC status: ${status === "VERIFIED" ? "Verified" : "Pending verification"}`}
            />
          </Box>
          <Box component="dl" sx={{ m: 0, "& dd": { m: 0, mb: 1.5 }, "& dt": { fontWeight: 600, fontSize: "0.8rem", color: "text.secondary", mb: 0.25 } }}>
            <dt>Bank account holder</dt>
            <dd>{kyc.bank_holder_name}</dd>
            <dt>Bank name</dt>
            <dd>{kyc.bank_name}</dd>
            <MaskedRow label="Account number" value={kyc.account_number_masked ?? "****"} show={showAccount} onToggle={() => setShowAccount((p) => !p)} />
            <dt>IFSC</dt>
            <dd>{kyc.ifsc_code}</dd>
            <dt>Branch</dt>
            <dd>{kyc.branch}</dd>
            <dt>Address</dt>
            <dd>{kyc.address}</dd>
            <MaskedRow label="Aadhaar" value={kyc.aadhaar_masked} show={showAadhaar} onToggle={() => setShowAadhaar((p) => !p)} />
            <MaskedRow label="PAN" value={kyc.pan_masked} show={showPan} onToggle={() => setShowPan((p) => !p)} />
            {kyc.submitted_at && (<><dt>Submitted</dt><dd>{new Date(kyc.submitted_at).toLocaleString()}</dd></>)}
            {kyc.verified_at && (<><dt>Verified at</dt><dd>{new Date(kyc.verified_at).toLocaleString()}</dd></>)}
          </Box>
          <Button component={Link} to="/Dashboard/Investment/KYC/Submit" variant="outlined" sx={{ mt: 3, borderRadius: 2 }} aria-label="Update KYC">
            {status === "VERIFIED" ? "Update KYC (re-submit)" : "Update KYC"}
          </Button>
        </Box>
      )}
    </InvestmentPageLayout>
  );
}
