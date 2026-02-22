import React, { useState } from "react";
import { Box, Button, TextField, Typography, Alert } from "@mui/material";
import { getInvestmentToken, setInvestmentToken, investmentApiService } from "../../services/investmentApi";
import InvestmentPageLayout, { sectionCardSx } from "./InvestmentPageLayout";

/**
 * If challenge token exists, render children.
 * Otherwise show Investment login (My Self email/password) or SSO with employee token.
 */
export default function InvestmentGate({ children }) {
  const token = getInvestmentToken();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChallengeLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await investmentApiService.challengeLogin(email, password);
      const data = res?.data;
      if (data?.Status === "Error") {
        setError(data?.Error || "Login failed");
        setLoading(false);
        return;
      }
      const t = data?.Result?.token;
      if (t) {
        setInvestmentToken(t);
        window.location.reload();
      } else {
        setError("No token received");
      }
    } catch (err) {
      setError(err?.response?.data?.Error || err?.message || "Login failed");
    }
    setLoading(false);
  };

  const employeeToken = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const trySso = async () => {
    if (!employeeToken) {
      setError("Not logged in as employee. Use My Self email and password below.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await investmentApiService.accessWithEmployee(employeeToken);
      const data = res?.data;
      if (data?.Status === "Error") {
        setError(data?.Error || "SSO failed");
        setLoading(false);
        return;
      }
      const t = data?.Result?.token;
      if (t) {
        setInvestmentToken(t);
        window.location.reload();
      } else {
        setError("No token received. Use email and password.");
      }
    } catch (err) {
      setError(err?.response?.data?.Error || err?.message || "SSO failed. Use email and password.");
    }
    setLoading(false);
  };

  if (token) {
    return children;
  }

  return (
    <InvestmentPageLayout
      title="Investment / My Self"
      subtitle="Sign in with your My Self (challenge) account to access KYC and Investment."
      maxWidth={420}
    >
      <Box sx={sectionCardSx} component="form" onSubmit={handleChallengeLogin} noValidate>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")} role="alert">
            {error}
          </Alert>
        )}
        {employeeToken && (
          <Button fullWidth variant="outlined" onClick={trySso} disabled={loading} sx={{ mb: 2 }} aria-label="Use Time Sheet login SSO">
            Use Time Sheet login (SSO)
          </Button>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
          Or sign in with email and password
        </Typography>
        <TextField
          fullWidth
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          margin="normal"
          size="small"
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          margin="normal"
          size="small"
        />
        <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 2 }} aria-busy={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </Box>
    </InvestmentPageLayout>
  );
}
