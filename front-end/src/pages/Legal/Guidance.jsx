import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import {
  HelpOutline,
  Refresh,
  TrendingUp,
  CheckCircle,
  SupportAgent,
  AutoAwesome,
} from "@mui/icons-material";
import { GUIDANCE_SECTIONS } from "../../constants/guidanceContent";
import { useGuidanceTourOptional } from "../../context/GuidanceTourContext";

export default function Guidance() {
  const theme = useTheme();
  const [checkedIds, setCheckedIds] = useState(() => new Set());
  const [searchParams, setSearchParams] = useSearchParams();
  const tour = useGuidanceTourOptional();

  const items = useMemo(() => GUIDANCE_SECTIONS, []);

  useEffect(() => {
    if (searchParams.get("tour") === "1" && tour?.startTour) {
      tour.startTour();
      const next = new URLSearchParams(searchParams);
      next.delete("tour");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, tour]);

  const toggleChecked = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const progress = useMemo(() => {
    const total = items.reduce((acc, s) => acc + s.checklist.length, 0);
    const done = items.reduce(
      (acc, s) => acc + s.checklist.filter((c) => checkedIds.has(c.id)).length,
      0
    );
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, percent };
  }, [items, checkedIds]);

  const handleFinishFromPage = () => {
    tour?.completeTour?.();
  };

  return (
    <Box
      sx={{
        py: { xs: 2, sm: 4 },
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.grey[100], 1)} 45%, ${alpha(theme.palette.success.main, 0.04)} 100%)`,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3.5 },
            borderRadius: 3,
            overflow: "hidden",
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.06)}`,
          }}
        >
          {/* Hero strip */}
          <Box
            sx={{
              borderRadius: 2.5,
              p: { xs: 2, sm: 2.5 },
              mb: 3,
              background: `linear-gradient(125deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.dark} 100%)`,
              color: "common.white",
              position: "relative",
              overflow: "hidden",
              "&::after": {
                content: '""',
                position: "absolute",
                right: -40,
                top: -40,
                width: 180,
                height: 180,
                borderRadius: "50%",
                bgcolor: alpha("#fff", 0.08),
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, position: "relative", zIndex: 1 }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha("#fff", 0.2),
                }}
              >
                <AutoAwesome sx={{ fontSize: 30 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Chip
                  label="Onboarding"
                  size="small"
                  sx={{
                    mb: 1,
                    bgcolor: alpha("#fff", 0.22),
                    color: "common.white",
                    fontWeight: 700,
                    fontSize: "0.7rem",
                  }}
                />
                <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: "1.5rem", sm: "2rem" }, lineHeight: 1.2 }}>
                  New Company Guidance Book
                </Typography>
                <Typography variant="body2" sx={{ mt: 1.25, opacity: 0.95, maxWidth: 560, lineHeight: 1.6 }}>
                  A clear checklist from system settings through daily workflow so your company can go live without missing critical steps.
                </Typography>
              </Box>
            </Box>
          </Box>

          <Grid container spacing={2.5} alignItems="stretch">
            <Grid item xs={12} md={7}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <HelpOutline color="primary" sx={{ fontSize: 28 }} />
                <Typography variant="h6" fontWeight={800} color="text.primary">
                  Your setup checklist
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                Expand each step and tick items as you complete them. Your progress updates automatically.
              </Typography>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.25,
                  height: "100%",
                  borderRadius: 2.5,
                  background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.common.white, 1)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                  boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.9)}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                    Progress
                  </Typography>
                  <Chip
                    icon={<TrendingUp sx={{ fontSize: 18 }} />}
                    label={`${progress.done}/${progress.total}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
                <Typography variant="h3" fontWeight={800} sx={{ color: "primary.main", lineHeight: 1 }}>
                  {progress.percent}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progress.percent}
                  sx={{
                    mt: 1.5,
                    borderRadius: 99,
                    height: 12,
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 99,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                  Items completed across all steps
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  startIcon={<Refresh />}
                  sx={{ mt: 1, color: "text.secondary", fontWeight: 600 }}
                  onClick={() => setCheckedIds(new Set())}
                >
                  Reset checklist
                </Button>
                {progress.percent === 100 && tour && !tour.completed && (
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    size="large"
                    sx={{ mt: 2, borderRadius: 2, textTransform: "none", fontWeight: 800 }}
                    startIcon={<CheckCircle />}
                    onClick={handleFinishFromPage}
                  >
                    Finish &amp; hide tour shortcuts
                  </Button>
                )}
                {tour?.completed && (
                  <>
                    <Typography variant="caption" color="success.dark" sx={{ display: "block", mt: 1.5, fontWeight: 600 }}>
                      Setup tour completed — sidebar shortcuts are hidden. Restore them anytime below.
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      sx={{ mt: 1.5, borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                      onClick={() => tour.resetTourCompletion?.()}
                    >
                      Show tour shortcuts again
                    </Button>
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {items.map((section, idx) => {
            const completedCount = section.checklist.filter((c) => checkedIds.has(c.id)).length;
            const totalCount = section.checklist.length;
            const isComplete = completedCount === totalCount;
            const firstIncompleteIdx = items.findIndex((s) =>
              s.checklist.some((c) => !checkedIds.has(c.id))
            );
            const defaultExpanded = idx === firstIncompleteIdx && !isComplete;

            return (
              <Accordion
                key={section.id}
                defaultExpanded={defaultExpanded}
                sx={{
                  mb: 1.5,
                  borderRadius: "12px !important",
                  overflow: "hidden",
                  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                  background: alpha(theme.palette.background.paper, 0.85),
                  transition: "box-shadow 0.2s ease, transform 0.2s ease",
                  "&:hover": {
                    boxShadow: `0 8px 28px ${alpha(theme.palette.common.black, 0.06)}`,
                  },
                  "&:before": { display: "none" },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: "primary.main" }} />}
                  sx={{
                    px: 2,
                    py: 1.5,
                    "& .MuiAccordionSummary-content": { my: 1, alignItems: "flex-start" },
                  }}
                >
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, flex: 1, pr: 1 }}>
                    <Chip
                      label={`Step ${idx + 1}`}
                      size="small"
                      sx={{ alignSelf: "flex-start", fontWeight: 700, fontSize: "0.65rem", height: 22 }}
                      color={isComplete ? "success" : "default"}
                      variant={isComplete ? "filled" : "outlined"}
                    />
                    <Typography variant="subtitle1" fontWeight={800}>
                      {section.title.replace(/^Step \d+:\s*/, "")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                      {section.description}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right", minWidth: 72 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {completedCount}/{totalCount}
                    </Typography>
                    {isComplete && (
                      <Chip
                        label="Done"
                        size="small"
                        color="success"
                        sx={{ display: "block", mt: 0.75, fontWeight: 700 }}
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
                  <FormGroup sx={{ width: "100%", gap: 1 }}>
                    {section.checklist.map((c) => (
                      <FormControlLabel
                        key={c.id}
                        sx={{
                          m: 0,
                          py: 1,
                          px: 1.25,
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                          background: checkedIds.has(c.id)
                            ? alpha(theme.palette.primary.main, 0.08)
                            : alpha(theme.palette.grey[50], 0.8),
                          transition: "background 0.2s ease",
                          "&:hover": {
                            borderColor: alpha(theme.palette.primary.main, 0.25),
                          },
                        }}
                        control={
                          <Checkbox
                            checked={checkedIds.has(c.id)}
                            onChange={() => toggleChecked(c.id)}
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.45 }}>
                            {c.label}
                          </Typography>
                        }
                      />
                    ))}
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
            );
          })}

          <Paper
            elevation={0}
            sx={{
              mt: 4,
              p: 2.5,
              borderRadius: 2.5,
              background: alpha(theme.palette.info.main, 0.06),
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { sm: "center" },
              gap: 2,
            }}
          >
            <SupportAgent color="info" sx={{ fontSize: 40 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={800} gutterBottom>
                Need help?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                Contact support or your administrator. For product questions, visit the{" "}
                <RouterLink
                  to="/support"
                  style={{
                    color: theme.palette.primary.main,
                    textDecoration: "none",
                    fontWeight: 800,
                  }}
                >
                  Support page
                </RouterLink>
                .
              </Typography>
            </Box>
          </Paper>
        </Paper>
      </Container>
    </Box>
  );
}
