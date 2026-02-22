import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  InputAdornment,
  Skeleton,
} from "@mui/material";
import { investmentApiService } from "../../services/investmentApi";
import InvestmentPageLayout, { cardWithAccentSx } from "./InvestmentPageLayout";

export default function KycForm() {
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    bank_holder_name: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    branch: "",
    address: "",
    aadhaar_number: "",
    pan_number: "",
  });

  useEffect(() => {
    let cancelled = false;
    investmentApiService
      .getKycStatus()
      .then((res) => {
        if (cancelled) return;
        const result = res?.data?.Result ?? res?.data;
        const kyc = result?.kyc;
        if (kyc) {
          setForm((prev) => ({
            ...prev,
            bank_holder_name: kyc.bank_holder_name ?? "",
            bank_name: kyc.bank_name ?? "",
            ifsc_code: kyc.ifsc_code ?? "",
            branch: kyc.branch ?? "",
            address: kyc.address ?? "",
            account_number: "",
            aadhaar_number: "",
            pan_number: "",
          }));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const { bank_holder_name, bank_name, account_number, ifsc_code, branch, address, aadhaar_number, pan_number } = form;
    if (!bank_holder_name?.trim() || !bank_name?.trim() || !account_number?.trim() || !ifsc_code?.trim() || !branch?.trim() || !address?.trim() || !aadhaar_number?.trim() || !pan_number?.trim()) {
      setError("All fields are required.");
      return;
    }
    if (aadhaar_number.replace(/\s/g, "").length !== 12) {
      setError("Aadhaar must be 12 digits.");
      return;
    }
    if (pan_number.trim().length !== 10) {
      setError("PAN must be 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await investmentApiService.submitKyc({
        bank_holder_name: bank_holder_name.trim(),
        bank_name: bank_name.trim(),
        account_number: account_number.trim(),
        ifsc_code: ifsc_code.trim().toUpperCase(),
        branch: branch.trim(),
        address: address.trim(),
        aadhaar_number: aadhaar_number.replace(/\s/g, ""),
        pan_number: pan_number.trim().toUpperCase(),
      });
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.Error || err?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <InvestmentPageLayout title="Submit / Update KYC">
        <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rounded" height={56} sx={{ mt: 2, borderRadius: 2 }} />
        <Skeleton variant="rounded" height={56} sx={{ mt: 1, borderRadius: 2 }} />
      </InvestmentPageLayout>
    );
  }

  return (
    <InvestmentPageLayout
      title="Submit / Update KYC"
      subtitle="Bank and identity details are required to invest. Aadhaar and PAN will be verified within 24 hours."
      maxWidth={640}
    >
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} role="status">
          KYC submitted. Verification within 24 hours.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")} role="alert">
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={cardWithAccentSx()} noValidate>
        <TextField
          fullWidth
          label="Bank Account Holder Name"
          value={form.bank_holder_name}
          onChange={handleChange("bank_holder_name")}
          required
          margin="normal"
          size="small"
          inputProps={{ "aria-required": true }}
        />
        <TextField fullWidth label="Bank Name" value={form.bank_name} onChange={handleChange("bank_name")} required margin="normal" size="small" />
        <TextField
          fullWidth
          label="Account Number"
          value={form.account_number}
          onChange={handleChange("account_number")}
          inputProps={{ maxLength: 24 }}
          placeholder="Re-enter to update"
          required
          margin="normal"
          size="small"
        />
        <TextField
          fullWidth
          label="IFSC Code"
          value={form.ifsc_code}
          onChange={handleChange("ifsc_code")}
          inputProps={{ maxLength: 11, "aria-describedby": "ifsc-count" }}
          required
          margin="normal"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Typography id="ifsc-count" variant="caption" color="text.secondary">{form.ifsc_code.length}/11</Typography>
              </InputAdornment>
            ),
          }}
        />
        <TextField fullWidth label="Branch" value={form.branch} onChange={handleChange("branch")} required margin="normal" size="small" />
        <TextField fullWidth label="Address" value={form.address} onChange={handleChange("address")} required multiline rows={2} margin="normal" size="small" />
        <TextField
          fullWidth
          label="Aadhaar Number"
          value={form.aadhaar_number}
          onChange={handleChange("aadhaar_number")}
          inputProps={{ maxLength: 12, "aria-describedby": "aadhaar-count" }}
          placeholder="12 digits (re-enter to update)"
          required
          margin="normal"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Typography id="aadhaar-count" variant="caption" color="text.secondary">{form.aadhaar_number.replace(/\s/g, "").length}/12</Typography>
              </InputAdornment>
            ),
          }}
        />
        <TextField
          fullWidth
          label="PAN Number"
          value={form.pan_number}
          onChange={handleChange("pan_number")}
          inputProps={{ maxLength: 10, "aria-describedby": "pan-count" }}
          placeholder="e.g. ABCDE1234F"
          required
          margin="normal"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Typography id="pan-count" variant="caption" color="text.secondary">{form.pan_number.length}/10</Typography>
              </InputAdornment>
            ),
          }}
        />
        <Button type="submit" variant="contained" size="large" disabled={submitting} sx={{ mt: 3, borderRadius: 2, px: 3 }} aria-busy={submitting}>
          {submitting ? "Submitting…" : "Submit KYC"}
        </Button>
      </Box>
    </InvestmentPageLayout>
  );
}
