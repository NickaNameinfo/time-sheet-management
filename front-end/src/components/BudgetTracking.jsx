import React, { useState, useEffect } from "react";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import { apiService } from "../services/api";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
  Divider,
} from "@mui/material";
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Add,
  Close,
  CheckCircle,
  AttachMoney,
  AccessTime,
} from "@mui/icons-material";
import ErrorMessage from "./ErrorMessage";
import Loading from "./Loading";
import ErrorBoundary from "./ErrorBoundary";
import { useParams } from "react-router-dom";

const BudgetTracking = () => {
  const { projectId } = useParams();
  
  // Debug logging
  useEffect(() => {
    console.log("BudgetTracking mounted, projectId:", projectId);
  }, [projectId]);
  
  const [budgetDialog, setBudgetDialog] = useState(false);
  const [costDialog, setCostDialog] = useState(false);
  const [budgetData, setBudgetData] = useState({
    budgetAmount: 0,
    budgetHours: 0,
    currency: "AED",
  });
  const [costData, setCostData] = useState({
    costDate: new Date().toISOString().split("T")[0],
    employeeCost: 0,
    overheadCost: 0,
    materialCost: 0,
    hoursSpent: 0,
  });

  // Only make API calls if projectId exists
  const { data: budget, loading: budgetLoading, error: budgetError, refetch: refetchBudget } = useApi(
    () => {
      if (!projectId) {
        return Promise.resolve({ data: { Status: "Success", Result: [] } });
      }
      return apiService.getProjectBudget(projectId);
    },
    [projectId],
    !!projectId
  );

  const { data: budgetVsActual, loading: vsLoading, error: vsError } = useApi(
    () => {
      if (!projectId) {
        return Promise.resolve({ data: { Status: "Success", Result: {} } });
      }
      return apiService.getBudgetVsActual(projectId);
    },
    [projectId],
    !!projectId
  );

  const { data: profitability, loading: profitLoading, error: profitError } = useApi(
    () => {
      if (!projectId) {
        return Promise.resolve({ data: { Status: "Success", Result: {} } });
      }
      return apiService.getProfitabilityReport(projectId);
    },
    [projectId],
    !!projectId
  );

  const { mutate: setBudget, loading: settingBudget } = useMutation((data) =>
    apiService.setProjectBudget(projectId, data)
  );
  const { mutate: trackCost, loading: trackingCost } = useMutation((data) =>
    apiService.trackProjectCost(projectId, data)
  );

  const handleSetBudget = async () => {
    const result = await setBudget(budgetData);
    if (result.success) {
      setBudgetDialog(false);
      refetchBudget();
      alert("Budget set successfully");
    }
  };

  const handleTrackCost = async () => {
    const result = await trackCost(costData);
    if (result.success) {
      setCostDialog(false);
      alert("Cost tracked successfully");
    }
  };

  // Show error if projectId is missing
  if (!projectId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Project ID is required. Please navigate from a project page.</Alert>
      </Box>
    );
  }

  if (budgetLoading || vsLoading || profitLoading) {
    return <Loading message="Loading budget data..." />;
  }

  // Show errors if any
  if (budgetError || vsError || profitError) {
    return (
      <Box sx={{ p: 3 }}>
        <ErrorMessage 
          error={budgetError || vsError || profitError} 
          message="Failed to load budget data"
        />
      </Box>
    );
  }

  // Safely extract data with fallbacks
  let currentBudget = {};
  let budgetVsActualData = {};
  let variance = {};
  let profit = {};
  
  try {
    currentBudget = budget?.[0] || budget?.Result?.[0] || {};
    budgetVsActualData = budgetVsActual?.Result || budgetVsActual || {};
    variance = budgetVsActualData?.variance || {};
    profit = profitability?.Result || profitability || {};
  } catch (error) {
    console.error("Error extracting budget data:", error);
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Budget Tracking
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor project budget, costs, and profitability
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setCostDialog(true)}
            >
              Track Cost
            </Button>
            <Button
              variant="contained"
              startIcon={<AccountBalance />}
              onClick={() => setBudgetDialog(true)}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                },
              }}
            >
              Set Budget
            </Button>
          </Stack>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Budget vs Actual */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <AccountBalance color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Budget vs Actual
                </Typography>
              </Box>
              {budgetVsActualData && Object.keys(budgetVsActualData).length > 0 ? (
                <Box>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, bgcolor: "primary.light", borderRadius: 2, color: "white" }}>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Budget
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {budgetVsActualData.budget?.amount || 0} {budgetVsActualData.budget?.currency || "AED"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, bgcolor: "secondary.light", borderRadius: 2, color: "white" }}>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Actual
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {budgetVsActualData.actual?.cost || 0} {budgetVsActualData.budget?.currency || "AED"}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      {(variance.amount || 0) >= 0 ? (
                        <TrendingUp color="success" />
                      ) : (
                        <TrendingDown color="error" />
                      )}
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        color={(variance.amount || 0) >= 0 ? "success.main" : "error.main"}
                      >
                        Variance: {variance.amount || 0} ({variance.percent || "0.00"}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(
                        ((budgetVsActualData.actual?.cost || 0) / 
                         (budgetVsActualData.budget?.amount || 1)) * 100,
                        100
                      )}
                      color={(variance.amount || 0) >= 0 ? "success" : "error"}
                      sx={{ height: 12, borderRadius: 6, mb: 2 }}
                    />
                    <Alert
                      severity={(variance.amount || 0) >= 0 ? "success" : "warning"}
                      icon={(variance.amount || 0) >= 0 ? <TrendingUp /> : <TrendingDown />}
                    >
                      {(variance.amount || 0) >= 0 ? "Under Budget" : "Over Budget"}
                    </Alert>
                  </Box>
                </Box>
              ) : (
                <Alert severity="info">No budget data available. Set a budget to get started.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Profitability */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <TrendingUp color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Profitability
                </Typography>
              </Box>
              {profit && Object.keys(profit).length > 0 ? (
                <Box>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, bgcolor: "success.light", borderRadius: 2, color: "white" }}>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Revenue
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {profit.revenue || 0} {profit.currency || "AED"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, bgcolor: "error.light", borderRadius: 2, color: "white" }}>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Cost
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {profit.cost || 0} {profit.currency || "AED"}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="h4"
                      fontWeight="bold"
                      color={(profit.profit || 0) >= 0 ? "success.main" : "error.main"}
                      gutterBottom
                    >
                      {(profit.profit || 0) >= 0 ? "+" : ""}{profit.profit || 0} {profit.currency || "AED"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Margin: {profit.margin || "0.00"}% | ROI: {profit.roi || "0.00"}%
                    </Typography>
                    <Alert
                      severity={profit.status === "profitable" ? "success" : "error"}
                      icon={profit.status === "profitable" ? <TrendingUp /> : <TrendingDown />}
                      sx={{ mt: 2 }}
                    >
                      {profit.status === "profitable" ? "Profitable" : "Loss Making"}
                    </Alert>
                  </Box>
                </Box>
              ) : (
                <Alert severity="info">No profitability data available</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Set Budget Dialog */}
      <Dialog
        open={budgetDialog}
        onClose={() => setBudgetDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              Set Project Budget
            </Typography>
            <IconButton onClick={() => setBudgetDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Budget Amount"
              type="number"
              value={budgetData.budgetAmount}
              onChange={(e) =>
                setBudgetData({ ...budgetData, budgetAmount: parseFloat(e.target.value) })
              }
              fullWidth
              InputProps={{
                startAdornment: <AttachMoney sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
            <TextField
              label="Budget Hours"
              type="number"
              value={budgetData.budgetHours}
              onChange={(e) =>
                setBudgetData({ ...budgetData, budgetHours: parseFloat(e.target.value) })
              }
              fullWidth
              InputProps={{
                startAdornment: <AccessTime sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
            <TextField
              label="Currency"
              value={budgetData.currency}
              onChange={(e) => setBudgetData({ ...budgetData, currency: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBudgetDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSetBudget}
            variant="contained"
            disabled={settingBudget}
            startIcon={<CheckCircle />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            {settingBudget ? "Setting..." : "Set Budget"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Track Cost Dialog */}
      <Dialog
        open={costDialog}
        onClose={() => setCostDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              Track Project Cost
            </Typography>
            <IconButton onClick={() => setCostDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Cost Date"
              type="date"
              value={costData.costDate}
              onChange={(e) => setCostData({ ...costData, costDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Employee Cost"
              type="number"
              value={costData.employeeCost}
              onChange={(e) =>
                setCostData({ ...costData, employeeCost: parseFloat(e.target.value) })
              }
              fullWidth
              InputProps={{
                startAdornment: <AttachMoney sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
            <TextField
              label="Overhead Cost"
              type="number"
              value={costData.overheadCost}
              onChange={(e) =>
                setCostData({ ...costData, overheadCost: parseFloat(e.target.value) })
              }
              fullWidth
              InputProps={{
                startAdornment: <AttachMoney sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
            <TextField
              label="Material Cost"
              type="number"
              value={costData.materialCost}
              onChange={(e) =>
                setCostData({ ...costData, materialCost: parseFloat(e.target.value) })
              }
              fullWidth
              InputProps={{
                startAdornment: <AttachMoney sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
            <TextField
              label="Hours Spent"
              type="number"
              value={costData.hoursSpent}
              onChange={(e) =>
                setCostData({ ...costData, hoursSpent: parseFloat(e.target.value) })
              }
              fullWidth
              InputProps={{
                startAdornment: <AccessTime sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCostDialog(false)}>Cancel</Button>
          <Button
            onClick={handleTrackCost}
            variant="contained"
            disabled={trackingCost}
            startIcon={<CheckCircle />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            {trackingCost ? "Tracking..." : "Track Cost"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Wrap with error boundary to catch any rendering errors
const BudgetTrackingWithBoundary = () => (
  <ErrorBoundary>
    <BudgetTracking />
  </ErrorBoundary>
);

export default BudgetTrackingWithBoundary;

