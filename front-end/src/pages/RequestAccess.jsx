import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Box, Button, Card, CardContent, TextField, Typography, Alert } from "@mui/material";
import { apiService } from "../services/api";

const RequestAccess = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus({ type: "error", message: "Enter your email" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus({ type: "error", message: "Enter a valid email address" });
      return;
    }
    setLoading(true);
    setStatus({ type: "", message: "" });
    apiService
      .requestUserAccess(trimmed)
      .then(() => {
        setStatus({ type: "success", message: "Request submitted. An admin will review and grant access." });
        setEmail("");
      })
      .catch((err) => {
        const msg = err?.response?.data?.Error || err?.message || "Request failed. Try again.";
        setStatus({ type: "error", message: msg });
      })
      .finally(() => setLoading(false));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.100",
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: "100%" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Request access
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Access to this application is restricted. Enter the email address you use to log in. An admin will review and grant access.
          </Typography>
          {status.message && (
            <Alert severity={status.type === "error" ? "error" : "success"} sx={{ mb: 2 }}>
              {status.message}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              sx={{ mb: 2 }}
            />
            <Button fullWidth variant="contained" type="submit" disabled={loading}>
              {loading ? "Submitting…" : "Submit request"}
            </Button>
          </form>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            <Link to="/employee-login">Back to login</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RequestAccess;
