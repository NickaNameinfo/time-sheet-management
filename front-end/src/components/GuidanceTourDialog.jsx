import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  useTheme,
  alpha,
} from "@mui/material";
import {
  School,
  CheckCircleOutline,
  Close as CloseIcon,
  ArrowBackIosNew,
  ArrowForwardIos,
} from "@mui/icons-material";
import { GUIDANCE_SECTIONS } from "../constants/guidanceContent";

const INTRO_STEP = {
  id: "intro",
  title: "Welcome to your setup guide",
  description:
    "Walk through the same steps as the full Guidance checklist. Use Next to continue, then Finish on the last step. After you finish, the guided tour shortcuts in the sidebar will be hidden until you choose to show them again.",
  checklist: [],
};

const STEPS = [INTRO_STEP, ...GUIDANCE_SECTIONS];

export default function GuidanceTourDialog({ open, onClose, onFinish }) {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const maxSteps = STEPS.length;
  const progressPct = maxSteps ? ((activeStep + 1) / maxSteps) * 100 : 0;

  useEffect(() => {
    if (open) {
      setActiveStep(0);
    }
  }, [open]);

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, maxSteps - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleFinish = () => {
    onFinish();
  };

  const step = STEPS[activeStep];
  const isLast = activeStep === maxSteps - 1;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.14)}`,
        },
      }}
      BackdropProps={{
        sx: { backdropFilter: "blur(6px)", backgroundColor: alpha(theme.palette.common.black, 0.35) },
      }}
    >
      <Box
        sx={{
          background: `linear-gradient(125deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.dark} 100%)`,
          color: "common.white",
          px: 2.5,
          pt: 2.5,
          pb: 2,
          position: "relative",
        }}
      >
        <Button
          aria-label="Close"
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            minWidth: 0,
            p: 0.5,
            color: "common.white",
            opacity: 0.9,
            "&:hover": { opacity: 1, bgcolor: alpha("#fff", 0.12) },
          }}
        >
          <CloseIcon />
        </Button>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, pr: 4 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha("#fff", 0.2),
              backdropFilter: "blur(8px)",
            }}
          >
            <School sx={{ fontSize: 28 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" sx={{ opacity: 0.95, letterSpacing: 1.2, fontWeight: 700 }}>
              Interactive tour
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.25, mt: 0.25 }}>
              Setup walkthrough
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, display: "block", mt: 0.5 }}>
              Step {activeStep + 1} of {maxSteps}
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressPct}
          sx={{
            mt: 2,
            height: 6,
            borderRadius: 99,
            bgcolor: alpha("#fff", 0.25),
            "& .MuiLinearProgress-bar": {
              borderRadius: 99,
              background: alpha("#fff", 0.95),
            },
          }}
        />
      </Box>

      <DialogContent sx={{ px: 2.5, pt: 3, pb: 1 }}>
        <Box sx={{ display: "flex", gap: 0.6, mb: 2, flexWrap: "wrap", justifyContent: "center" }}>
          {STEPS.map((_, i) => (
            <Box
              key={i}
              sx={{
                height: 6,
                borderRadius: 99,
                transition: "all 0.25s ease",
                width: i === activeStep ? 28 : 6,
                bgcolor:
                  i === activeStep
                    ? "primary.main"
                    : i < activeStep
                      ? alpha(theme.palette.success.main, 0.6)
                      : alpha(theme.palette.action.disabledBackground, 1),
              }}
            />
          ))}
        </Box>

        <Typography variant="subtitle1" fontWeight={800} gutterBottom sx={{ color: "text.primary" }}>
          {step.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: step.checklist?.length ? 2 : 0 }}>
          {step.description}
        </Typography>

        {step.checklist?.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 1.75,
              borderRadius: 2,
              background: alpha(theme.palette.primary.main, 0.04),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            }}
          >
            <Typography
              variant="caption"
              color="primary"
              fontWeight={800}
              sx={{ letterSpacing: 0.6, textTransform: "uppercase" }}
            >
              In this step
            </Typography>
            <List dense disablePadding sx={{ mt: 1 }}>
              {step.checklist.map((c) => (
                <ListItem key={c.id} disablePadding sx={{ py: 0.5, alignItems: "flex-start" }}>
                  <ListItemIcon sx={{ minWidth: 32, mt: 0.15 }}>
                    <CheckCircleOutline sx={{ fontSize: 20, color: "success.main", opacity: 0.85 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={c.label}
                    primaryTypographyProps={{ variant: "body2", sx: { lineHeight: 1.5, fontWeight: 500 } }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.5,
          py: 2,
          pt: 1,
          gap: 1,
          flexWrap: "wrap",
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          bgcolor: alpha(theme.palette.grey[50], 0.8),
        }}
      >
        <Button onClick={onClose} color="inherit" startIcon={<CloseIcon />} sx={{ textTransform: "none", fontWeight: 600 }}>
          Close
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
          startIcon={<ArrowBackIosNew sx={{ fontSize: 12 }} />}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Back
        </Button>
        {isLast ? (
          <Button
            variant="contained"
            size="large"
            onClick={handleFinish}
            sx={{
              px: 3,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.dark} 100%)`,
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
            }}
          >
            Finish
          </Button>
        ) : (
          <Button
            variant="contained"
            size="large"
            onClick={handleNext}
            endIcon={<ArrowForwardIos sx={{ fontSize: 12 }} />}
            sx={{
              px: 3,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
            }}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
