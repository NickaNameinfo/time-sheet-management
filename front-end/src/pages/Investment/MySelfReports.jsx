import React, { useState, useEffect } from "react";
import { Box, Typography, Chip, Skeleton, Alert, LinearProgress } from "@mui/material";
import { investmentApiService } from "../../services/investmentApi";
import InvestmentPageLayout, { sectionCardSx, cardWithAccentSx } from "./InvestmentPageLayout";
import { appColors } from "../../theme/colors";

export default function MySelfReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    investmentApiService
      .getChallengeReports()
      .then((res) => {
        if (cancelled) return;
        const result = res?.data?.Result ?? res?.data;
        setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.Error || err?.message || "Failed to load reports");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <InvestmentPageLayout title="My Self Reports">
        <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={200} sx={{ mt: 2, borderRadius: 3 }} />
      </InvestmentPageLayout>
    );
  }

  if (error) {
    return (
      <InvestmentPageLayout title="My Self Reports">
        <Alert severity="error" role="alert">{error}</Alert>
      </InvestmentPageLayout>
    );
  }

  const challenges = data?.challenges ?? [];
  const totalActive = data?.total_active ?? 0;
  const totalCompleted = data?.total_completed ?? 0;
  const streak = data?.streak ?? { current: 0, longest: 0 };
  const successRate = data?.challenge_success_rate ?? 0;

  return (
    <InvestmentPageLayout
      title="My Self – Reports"
      subtitle="Challenge progress, streaks, and success rate."
      maxWidth={900}
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 3 }} role="group" aria-label="Summary stats">
        <Chip label={`Active: ${totalActive}`} color="primary" size="medium" sx={{ borderRadius: 2 }} />
        <Chip label={`Completed: ${totalCompleted}`} color="success" size="medium" sx={{ borderRadius: 2 }} />
        <Chip label={`Longest streak: ${streak.longest}`} variant="outlined" size="medium" sx={{ borderRadius: 2 }} />
        <Chip label={`Success rate: ${successRate}%`} variant="outlined" size="medium" sx={{ borderRadius: 2 }} />
      </Box>

      <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
        Challenges
      </Typography>
      {challenges.length === 0 ? (
        <Box sx={{ ...sectionCardSx, py: 4, textAlign: "center" }}>
          <Typography color="text.secondary">No challenges yet.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }} role="list">
          {challenges.map((ch) => (
            <Box
              key={ch.id}
              role="listitem"
              sx={{
                ...cardWithAccentSx(ch.success ? appColors.success : appColors.primary),
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight="600" sx={{ mb: 0.5 }}>{ch.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {ch.completed_days} / {ch.total_days} days · Missed: {ch.missed_days} · Pending: {ch.pending_days}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={ch.completion_percent ?? 0}
                  sx={{ mt: 1.5, height: 8, borderRadius: 1 }}
                  color={ch.success ? "success" : "primary"}
                  aria-label={`${ch.title} progress ${ch.completion_percent}%`}
                />
              </Box>
              <Chip
                label={`${ch.completion_percent}%`}
                color={ch.success ? "success" : "default"}
                size="medium"
                aria-label={`Completion: ${ch.completion_percent} percent`}
              />
            </Box>
          ))}
        </Box>
      )}
    </InvestmentPageLayout>
  );
}
