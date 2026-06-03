import React, { useCallback, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Chip,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { FileDownload, Refresh } from "@mui/icons-material";
import api from "../../services/api";
import { workDetailHours } from "../../utils/formatWorkDetailClock";
import dayjs from "dayjs";

export const pageCardSx = {
  borderRadius: 3,
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  border: "1px solid",
  borderColor: "divider",
};

function resolveAccent(theme, accent) {
  if (typeof accent === "string" && accent.startsWith("#")) return accent;
  if (accent === "text.secondary") return theme.palette.text.secondary;
  return theme.palette[accent]?.main || theme.palette.primary.main;
}

export function StatCard({ icon: Icon, label, value, sub, accent = "primary", valueColor }) {
  const theme = useTheme();
  const main = resolveAccent(theme, accent);
  return (
    <Card
      sx={{
        ...pageCardSx,
        height: "100%",
        borderLeft: `4px solid ${main}`,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 28px rgba(0,0,0,0.1)" },
      }}
    >
      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          {Icon && (
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha(main, 0.12),
                color: main,
                display: "flex",
                flexShrink: 0,
              }}
            >
              <Icon fontSize="small" />
            </Box>
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {label}
            </Typography>
            <Typography variant="h6" fontWeight={700} color={valueColor || "text.primary"} sx={{ lineHeight: 1.25 }}>
              {value}
            </Typography>
            {sub && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                {sub}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function ReportPageHeader({ icon: Icon, title, subtitle, onRefresh, loading, onExport, exportDisabled, exportLabel = "Export CSV" }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        mb: 3,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
        {Icon && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
              color: "#fff",
              display: { xs: "none", sm: "flex" },
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
            }}
          >
            <Icon />
          </Box>
        )}
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -0.5 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      <Stack direction="row" spacing={1.5} flexWrap="wrap">
        {onRefresh && (
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={onRefresh}
            disabled={loading}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Refresh
          </Button>
        )}
        {onExport && (
          <Button
            variant="contained"
            startIcon={<FileDownload />}
            onClick={onExport}
            disabled={loading || exportDisabled}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
            }}
          >
            {exportLabel}
          </Button>
        )}
      </Stack>
    </Box>
  );
}

export function ReportFilterCard({ title = "Filters", children, chips }) {
  return (
    <Card sx={{ ...pageCardSx, mb: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
          {chips}
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

export function ReportGridCard({ icon: Icon, title, rowCount, chips, children, loading }) {
  return (
    <Card sx={pageCardSx}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
          {Icon && <Icon color="primary" />}
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
          {rowCount != null && <Chip label={`${rowCount} rows`} size="small" />}
          {chips}
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ width: "100%", height: 620, position: "relative" }}>
          {loading && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(255,255,255,0.75)",
                zIndex: 2,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          {children}
        </Box>
      </CardContent>
    </Card>
  );
}

export function ReportStatsGrid({ children }) {
  return (
    <Box
      sx={{
        mb: 3,
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(3, 1fr)",
          md: "repeat(4, 1fr)",
          lg: "repeat(6, 1fr)",
        },
        gap: 2,
      }}
    >
      {children}
    </Box>
  );
}

export function useReportSnackbar() {
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const notify = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);
  const SnackbarAlert = (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        severity={snackbar.severity}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        sx={{ width: "100%" }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
  return { notify, SnackbarAlert };
}

export function useProjectsAndWorkDetails() {
  const [projectDetails, setProjectDetails] = useState([]);
  const [workDetails, setWorkDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectRes, workRes] = await Promise.all([
        api.get("/getProject"),
        api.get("/getWorkDetails"),
      ]);
      if (projectRes.data?.Status === "Success") {
        setProjectDetails(projectRes.data.Result || []);
      } else {
        throw new Error(projectRes.data?.Message || "Failed to load projects");
      }
      if (workRes.data?.Status === "Success") {
        const approved = (workRes.data.Result || []).filter(
          (item) => String(item.status || "").toLowerCase() === "approved"
        );
        setWorkDetails(approved);
      } else {
        throw new Error(workRes.data?.Message || "Failed to load work details");
      }
    } catch (e) {
      setError(e?.message || "Failed to load report data");
      setProjectDetails([]);
      setWorkDetails([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { projectDetails, workDetails, loading, error, loadData };
}

export function useWorkDetailsOnly() {
  const [workDetails, setWorkDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const workRes = await api.get("/getWorkDetails");
      if (workRes.data?.Status === "Success") {
        const approved = (workRes.data.Result || []).filter(
          (item) => String(item.status || "").toLowerCase() === "approved"
        );
        setWorkDetails(approved);
      } else {
        throw new Error(workRes.data?.Message || "Failed to load work details");
      }
    } catch (e) {
      setError(e?.message || "Failed to load report data");
      setWorkDetails([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { workDetails, loading, error, loadData };
}

export function hoursFromEntry(item) {
  return workDetailHours(item);
}

export function entryYear(item) {
  const raw = item?.sentDate || item?.clockInTime;
  if (!raw) return null;
  const d = dayjs(raw);
  return d.isValid() ? d.year() : null;
}

export function projectNamesFromData(projects, workDetails) {
  const names = new Set((projects || []).map((p) => p.projectName).filter(Boolean));
  (workDetails || []).forEach((w) => {
    if (w.projectName) names.add(w.projectName);
  });
  return [...names].sort();
}

export const gridStyle = { height: "100%", width: "100%" };

export const defaultReportColDef = {
  editable: false,
  sortable: true,
  resizable: true,
  filter: false,
  minWidth: 90,
};
