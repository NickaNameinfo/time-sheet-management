import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Chip,
  CircularProgress,
  LinearProgress,
  alpha,
  useTheme,
} from "@mui/material";
import { Assignment, CalendarMonth } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

export default function EmployeeAssignedProjectPlansCard({
  assignedProjectsList = [],
  assignedProjectsLoading,
  planWorkDetailsLoading,
  assignedPlansWithProgress = [],
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Card sx={{ mb: 3, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Assignment color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              {t("plans.yourProjectPlans", { defaultValue: "Your project plans" })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("plans.subtitle", {
                defaultValue:
                  "Plans you are assigned to on Project Planning, and your logged hours in the plan period vs allotted hours.",
              })}
            </Typography>
          </Box>
        </Box>
        {assignedProjectsLoading || (assignedProjectsList.length > 0 && planWorkDetailsLoading) ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : assignedPlansWithProgress.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t("plans.noActiveAssignments", {
              defaultValue:
                "You have no active assignments from project plans. When a manager assigns you on Project Planning, it will appear here with progress.",
            })}
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {assignedPlansWithProgress.map((row) => (
              <Grid item xs={12} md={6} key={`${row.plan_id}-${row.assignment_id}`}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                    height: "100%",
                  }}
                >
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={800} noWrap title={row.plan_name}>
                        {row.plan_name || t("plans.plan", { defaultValue: "Plan" })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap title={row.projectName}>
                        {row.projectName || t("plans.project", { defaultValue: "Project" })}
                        {row.projectNo ? ` · #${row.projectNo}` : ""}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={(row.plan_status || "active").replace(/_/g, " ")}
                      variant="outlined"
                      sx={{ textTransform: "capitalize" }}
                    />
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1.5 }}>
                    <CalendarMonth sx={{ fontSize: 18, color: "text.secondary" }} />
                    <Typography variant="caption" color="text.secondary">
                      {row.start_date ? String(row.start_date).slice(0, 10) : "—"}
                      {" → "}
                      {row.end_date ? String(row.end_date).slice(0, 10) : "—"}
                      {row.time_period ? ` · ${row.time_period}` : ""}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                    {row.progressLabel}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <LinearProgress
                      variant="determinate"
                      value={row.progressCap > 0 ? row.progressPercent : 0}
                      sx={{
                        flex: 1,
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 4,
                          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
                        },
                      }}
                    />
                    <Typography variant="body2" fontWeight={700} sx={{ minWidth: 48, textAlign: "right" }}>
                      {row.progressCap > 0 ? `${row.progressPercent}%` : "—"}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                    {t("plans.logged", { defaultValue: "Logged" })} {row.usedHours}h
                    {row.progressCap > 0 ? ` / ${row.progressCap}h` : ""}
                    {row.allotted_hours != null && parseFloat(row.allotted_hours) > 0
                      ? ` (${t("plans.yourAllotment", { defaultValue: "your allotment" })})`
                      : row.plan_total_hours != null
                        ? ` (${t("plans.planTotal", { defaultValue: "plan total" })})`
                        : ""}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}
