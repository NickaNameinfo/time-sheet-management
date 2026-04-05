import React, { useState, useEffect, useMemo } from "react";
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
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  Refresh,
  Folder,
  Info,
  ExpandMore,
  ExpandLess,
  Delete,
  Edit,
} from "@mui/icons-material";
import ErrorMessage from "./ErrorMessage";
import Loading from "./Loading";
import ErrorBoundary from "./ErrorBoundary";
import { useParams } from "react-router-dom";

const BudgetTracking = () => {
  const { projectId: urlProjectId } = useParams();
  const [selectedProjectId, setSelectedProjectId] = useState(urlProjectId || "");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  // Use selectedProjectId or fallback to URL projectId
  const projectId = selectedProjectId || urlProjectId;
  
  // Fetch projects list
  const { data: projectsData } = useApi(apiService.getProjects);
  
  // Fetch app settings for default currency and other settings
  const { data: appSettings } = useApi(apiService.getAppSettings);
  
  // Parse projects data
  const projects = useMemo(() => {
    if (!projectsData) return [];
    if (Array.isArray(projectsData)) return projectsData;
    return projectsData?.Result || projectsData?.data?.Result || [];
  }, [projectsData]);
  
  // Set initial project from URL if available
  useEffect(() => {
    if (urlProjectId && !selectedProjectId) {
      setSelectedProjectId(urlProjectId);
    }
  }, [urlProjectId, selectedProjectId]);
  
  const [budgetDialog, setBudgetDialog] = useState(false);
  const [costDialog, setCostDialog] = useState(false);
  const [deleteBudgetDialog, setDeleteBudgetDialog] = useState(false);
  const [deleteCostDialog, setDeleteCostDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [editingCost, setEditingCost] = useState(null);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [costToDelete, setCostToDelete] = useState(null);
  const [budgetData, setBudgetData] = useState({
    budgetAmount: 0,
    budgetHours: 0,
    currency: appSettings?.currency || "AED",
  });
  
  // Update budgetData currency when appSettings loads
  useEffect(() => {
    if (appSettings?.currency && !budgetData.currency) {
      setBudgetData(prev => ({ ...prev, currency: appSettings.currency }));
    }
  }, [appSettings?.currency]);
  const [costData, setCostData] = useState({
    costDate: new Date().toISOString().split("T")[0],
    employeeCost: 0,
    overheadCost: 0,
    materialCost: 0,
    hoursSpent: 0,
  });
  const [budgetDetailsExpanded, setBudgetDetailsExpanded] = useState(false);
  const [profitabilityDetailsExpanded, setProfitabilityDetailsExpanded] = useState(false);

  // Only make API calls if projectId exists
  const { data: budgetDataRaw, loading: budgetLoading, error: budgetError, refetch: refetchBudget } = useApi(
    () => {
      if (!projectId) {
        return Promise.resolve({ data: { Status: "Success", Result: [] } });
      }
      return apiService.getProjectBudget(projectId);
    },
    [projectId],
    !!projectId
  );

  const { data: budgetVsActualRaw, loading: vsLoading, error: vsError, refetch: refetchVsActual } = useApi(
    () => {
      if (!projectId) {
        return Promise.resolve({ data: { Status: "Success", Result: {} } });
      }
      return apiService.getBudgetVsActual(projectId);
    },
    [projectId],
    !!projectId
  );

  const { data: profitabilityRaw, loading: profitLoading, error: profitError, refetch: refetchProfitability } = useApi(
    () => {
      if (!projectId) {
        return Promise.resolve({ data: { Status: "Success", Result: {} } });
      }
      return apiService.getProfitabilityReport(projectId);
    },
    [projectId],
    !!projectId
  );

  // Fetch project costs for detailed breakdown
  const { data: projectCostsRaw, loading: costsLoading, refetch: refetchCosts } = useApi(
    () => {
      if (!projectId) {
        return Promise.resolve({ data: { Status: "Success", Result: [] } });
      }
      return apiService.getProjectCosts(projectId);
    },
    [projectId],
    !!projectId
  );

  // Parse project costs
  const projectCosts = useMemo(() => {
    if (!projectCostsRaw) return [];
    if (Array.isArray(projectCostsRaw)) return projectCostsRaw;
    return projectCostsRaw?.Result || projectCostsRaw?.data?.Result || [];
  }, [projectCostsRaw]);

  // Parse API responses
  const budget = useMemo(() => {
    if (!budgetDataRaw) return [];
    if (Array.isArray(budgetDataRaw)) return budgetDataRaw;
    return budgetDataRaw?.Result || budgetDataRaw?.data?.Result || [];
  }, [budgetDataRaw]);

  const budgetVsActual = useMemo(() => {
    if (!budgetVsActualRaw) return {};
    if (typeof budgetVsActualRaw === 'object' && !Array.isArray(budgetVsActualRaw)) {
      return budgetVsActualRaw?.Result || budgetVsActualRaw?.data?.Result || budgetVsActualRaw;
    }
    return {};
  }, [budgetVsActualRaw]);

  const profitability = useMemo(() => {
    if (!profitabilityRaw) return {};
    if (typeof profitabilityRaw === 'object' && !Array.isArray(profitabilityRaw)) {
      return profitabilityRaw?.Result || profitabilityRaw?.data?.Result || profitabilityRaw;
    }
    return {};
  }, [profitabilityRaw]);

  const { mutate: setBudget, loading: settingBudget } = useMutation((data) => {
    if (!projectId) {
      return Promise.reject(new Error("Please select a project"));
    }
    return apiService.setProjectBudget(projectId, data);
  });
  const { mutate: updateBudget, loading: updatingBudget } = useMutation((params) => {
    return apiService.updateProjectBudget(params.id, params.data);
  });
  const { mutate: deleteBudget, loading: deletingBudget } = useMutation((id) => {
    return apiService.deleteProjectBudget(id);
  });
  const { mutate: trackCost, loading: trackingCost } = useMutation((data) => {
    if (!projectId) {
      return Promise.reject(new Error("Please select a project"));
    }
    return apiService.trackProjectCost(projectId, data);
  });
  const { mutate: updateCost, loading: updatingCost } = useMutation((params) => {
    return apiService.updateProjectCost(params.id, params.data);
  });
  const { mutate: deleteCost, loading: deletingCost } = useMutation((id) => {
    return apiService.deleteProjectCost(id);
  });

  const handleSetBudget = async () => {
    let result;
    if (editingBudget) {
      result = await updateBudget({ id: editingBudget.id, data: budgetData });
    } else {
      result = await setBudget(budgetData);
    }
    
    if (result.success) {
      setBudgetDialog(false);
      setEditingBudget(null);
      setBudgetData({ budgetAmount: 0, budgetHours: 0, currency: appSettings?.currency || "AED" });
      refetchBudget();
      refetchVsActual();
      refetchProfitability();
      setSnackbar({
        open: true,
        message: editingBudget ? "Budget updated successfully" : "Budget set successfully",
        severity: "success",
      });
    } else {
      setSnackbar({
        open: true,
        message: result.error || "Failed to set budget",
        severity: "error",
      });
    }
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setBudgetData({
      budgetAmount: parseFloat(budget.budget_amount || 0),
      budgetHours: parseFloat(budget.budget_hours || 0),
      currency: budget.currency || appSettings?.currency || "AED",
    });
    setBudgetDialog(true);
  };

  const handleDeleteBudget = async () => {
    if (budgetToDelete) {
      const result = await deleteBudget(budgetToDelete.id);
      if (result.success) {
        setDeleteBudgetDialog(false);
        setBudgetToDelete(null);
        refetchBudget();
        refetchVsActual();
        refetchProfitability();
        setSnackbar({
          open: true,
          message: "Budget deleted successfully",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: result.error || "Failed to delete budget",
          severity: "error",
        });
      }
    }
  };

  const handleTrackCost = async () => {
    let result;
    if (editingCost) {
      result = await updateCost({ id: editingCost.id, data: costData });
    } else {
      result = await trackCost(costData);
    }
    
    if (result.success) {
      setCostDialog(false);
      setEditingCost(null);
      setCostData({
        costDate: new Date().toISOString().split("T")[0],
        employeeCost: 0,
        overheadCost: 0,
        materialCost: 0,
        hoursSpent: 0,
      });
      refetchBudget();
      refetchVsActual();
      refetchProfitability();
      refetchCosts();
      setSnackbar({
        open: true,
        message: editingCost ? "Cost updated successfully" : "Cost tracked successfully",
        severity: "success",
      });
    } else {
      setSnackbar({
        open: true,
        message: result.error || "Failed to track cost",
        severity: "error",
      });
    }
  };

  const handleEditCost = (cost) => {
    setEditingCost(cost);
    setCostData({
      costDate: cost.cost_date ? cost.cost_date.split('T')[0] : new Date().toISOString().split("T")[0],
      employeeCost: parseFloat(cost.employee_cost || 0),
      overheadCost: parseFloat(cost.overhead_cost || 0),
      materialCost: parseFloat(cost.material_cost || 0),
      hoursSpent: parseFloat(cost.hours_spent || 0),
    });
    setCostDialog(true);
  };

  const handleDeleteCost = async () => {
    if (costToDelete) {
      const result = await deleteCost(costToDelete.id);
      if (result.success) {
        setDeleteCostDialog(false);
        setCostToDelete(null);
        refetchBudget();
        refetchVsActual();
        refetchProfitability();
        refetchCosts();
        setSnackbar({
          open: true,
          message: "Cost deleted successfully",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: result.error || "Failed to delete cost",
          severity: "error",
        });
      }
    }
  };

  const handleRefresh = () => {
    if (projectId) {
      refetchBudget();
      refetchVsActual();
      refetchProfitability();
    }
  };

  // Safely extract data with fallbacks - ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const currentBudget = useMemo(() => {
    return Array.isArray(budget) && budget.length > 0 ? budget[0] : {};
  }, [budget]);

  const budgetVsActualData = useMemo(() => {
    return budgetVsActual || {};
  }, [budgetVsActual]);

  const variance = useMemo(() => {
    return budgetVsActualData?.variance || {};
  }, [budgetVsActualData]);

  const profit = useMemo(() => {
    return profitability || {};
  }, [profitability]);

  // Show project selector if no project selected - AFTER ALL HOOKS
  if (!projectId) {
    return (
      <Box sx={{ p: 3 }}>
        <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <AccountBalance color="primary" />
              <Typography variant="h5" fontWeight="bold">
                Budget Tracking
              </Typography>
            </Box>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Project</InputLabel>
              <Select
                value={selectedProjectId}
                label="Select Project"
                onChange={(e) => setSelectedProjectId(e.target.value)}
                startAdornment={<Folder sx={{ mr: 1, color: "text.secondary" }} />}
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.projectName} ({project.referenceNo || project.projectNo || project.id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Alert severity="info">
              Please select a project to view budget tracking information.
            </Alert>
          </CardContent>
        </Card>
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
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Budget Tracking
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Monitor project budget, costs, and profitability
            </Typography>
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>Select Project</InputLabel>
              <Select
                value={selectedProjectId}
                label="Select Project"
                onChange={(e) => setSelectedProjectId(e.target.value)}
                startAdornment={<Folder sx={{ mr: 1, color: "text.secondary" }} />}
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.projectName} ({project.referenceNo || project.projectNo || project.id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => {
                setEditingCost(null);
                setCostData({
                  costDate: new Date().toISOString().split("T")[0],
                  employeeCost: 0,
                  overheadCost: 0,
                  materialCost: 0,
                  hoursSpent: 0,
                });
                setCostDialog(true);
              }}
            >
              Track Cost
            </Button>
            <Button
              variant="contained"
              startIcon={<AccountBalance />}
              onClick={() => {
                setEditingBudget(null);
                setBudgetData({ budgetAmount: 0, budgetHours: 0, currency: appSettings?.currency || "AED" });
                setBudgetDialog(true);
              }}
              sx={{
                background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
                },
              }}
            >
              Set Budget
            </Button>
          </Stack>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Information Box */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <Info color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  How It Works
                </Typography>
              </Box>
              
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                    📊 Set Budget
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Define the total budget amount and budget hours for your project. This sets the baseline for tracking.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                    • Budget Amount: Total financial budget allocated<br/>
                    • Budget Hours: Total hours allocated for the project
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                    💰 Track Cost
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Record actual costs incurred on specific dates. Track different cost types separately.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                    • Employee Cost: Labor costs for employees<br/>
                    • Overhead Cost: Administrative and indirect costs<br/>
                    • Material Cost: Materials and supplies<br/>
                    • Hours Spent: Actual hours worked on the project
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                    📈 Budget vs Actual
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Compares your budgeted amount against actual costs spent.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                    <strong>Variance = Budget - Actual</strong><br/>
                    • Positive variance = Under budget ✅<br/>
                    • Negative variance = Over budget ⚠️<br/>
                    • Progress bar shows budget utilization
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                    💵 Profitability
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Calculates project profitability based on revenue and costs.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                    <strong>Profit = Revenue - Total Cost</strong><br/>
                    • Margin = (Profit / Revenue) × 100%<br/>
                    • ROI = (Profit / Cost) × 100%<br/>
                    • Status: Profitable or Loss Making
                  </Typography>
                </Box>

                <Divider />

                <Alert severity="info" sx={{ mt: 1 }}>
                  <Typography variant="caption">
                    <strong>Tip:</strong> Set your budget first, then track costs regularly to monitor project financial health in real-time.
                  </Typography>
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Budget vs Actual */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AccountBalance color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Budget vs Actual
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setBudgetDetailsExpanded(!budgetDetailsExpanded)}
                  size="small"
                  sx={{ color: "primary.main" }}
                >
                  {budgetDetailsExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
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
                          {appSettings?.currency_symbol || ""}{budgetVsActualData.budget?.amount || 0} {budgetVsActualData.budget?.currency || appSettings?.currency || "AED"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, bgcolor: "secondary.light", borderRadius: 2, color: "white" }}>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Actual
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {appSettings?.currency_symbol || ""}{budgetVsActualData.actual?.cost || 0} {budgetVsActualData.budget?.currency || appSettings?.currency || "AED"}
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

                  {/* Detailed Breakdown */}
                  <Collapse in={budgetDetailsExpanded} timeout="auto" unmountOnExit>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Detailed Breakdown
                    </Typography>
                    <TableContainer component={Paper} sx={{ mt: 2, borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "grey.100" }}>
                            <TableCell fontWeight="bold">Category</TableCell>
                            <TableCell align="right" fontWeight="bold">Budget</TableCell>
                            <TableCell align="right" fontWeight="bold">Actual</TableCell>
                            <TableCell align="right" fontWeight="bold">Variance</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>Budget Amount</TableCell>
                            <TableCell align="right">
                              {appSettings?.currency_symbol || ""}{budgetVsActualData.budget?.amount || 0}
                            </TableCell>
                            <TableCell align="right">
                              {appSettings?.currency_symbol || ""}{budgetVsActualData.actual?.cost || 0}
                            </TableCell>
                            <TableCell align="right" sx={{ 
                              color: (variance.amount || 0) >= 0 ? "success.main" : "error.main",
                              fontWeight: "bold"
                            }}>
                              {appSettings?.currency_symbol || ""}{variance.amount || 0}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Budget Hours</TableCell>
                            <TableCell align="right">
                              {budgetVsActualData.budget?.hours || 0} hrs
                            </TableCell>
                            <TableCell align="right">
                              {budgetVsActualData.actual?.hours || 0} hrs
                            </TableCell>
                            <TableCell align="right" sx={{ 
                              color: (budgetVsActualData.variance?.hours || 0) >= 0 ? "success.main" : "error.main",
                              fontWeight: "bold"
                            }}>
                              {budgetVsActualData.variance?.hours || 0} hrs
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Utilization</TableCell>
                            <TableCell align="right" colSpan={3}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(
                                  ((budgetVsActualData.actual?.cost || 0) / 
                                   (budgetVsActualData.budget?.amount || 1)) * 100,
                                  100
                                )}
                                color={(variance.amount || 0) >= 0 ? "success" : "error"}
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                              <Typography variant="caption" sx={{ mt: 0.5, display: "block" }}>
                                {Math.min(
                                  ((budgetVsActualData.actual?.cost || 0) / 
                                   (budgetVsActualData.budget?.amount || 1)) * 100,
                                  100
                                ).toFixed(2)}% of budget used
                              </Typography>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Cost Breakdown by Type */}
                    {projectCosts.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          Cost Breakdown by Type
                        </Typography>
                        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: "grey.100" }}>
                                <TableCell fontWeight="bold">Cost Type</TableCell>
                                <TableCell align="right" fontWeight="bold">Amount</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              <TableRow>
                                <TableCell>Employee Cost</TableCell>
                                <TableCell align="right">
                                  {appSettings?.currency_symbol || ""}
                                  {projectCosts.reduce((sum, cost) => sum + parseFloat(cost.employee_cost || 0), 0).toFixed(2)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Overhead Cost</TableCell>
                                <TableCell align="right">
                                  {appSettings?.currency_symbol || ""}
                                  {projectCosts.reduce((sum, cost) => sum + parseFloat(cost.overhead_cost || 0), 0).toFixed(2)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Material Cost</TableCell>
                                <TableCell align="right">
                                  {appSettings?.currency_symbol || ""}
                                  {projectCosts.reduce((sum, cost) => sum + parseFloat(cost.material_cost || 0), 0).toFixed(2)}
                                </TableCell>
                              </TableRow>
                              <TableRow sx={{ bgcolor: "grey.50" }}>
                                <TableCell sx={{ fontWeight: "bold" }}>Total Cost</TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                  {appSettings?.currency_symbol || ""}
                                  {projectCosts.reduce((sum, cost) => sum + parseFloat(cost.total_cost || 0), 0).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}
                  </Collapse>
                </Box>
              ) : (
                <Alert severity="info">No budget data available. Set a budget to get started.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Profitability */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TrendingUp color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Profitability
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setProfitabilityDetailsExpanded(!profitabilityDetailsExpanded)}
                  size="small"
                  sx={{ color: "primary.main" }}
                >
                  {profitabilityDetailsExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
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
                          {appSettings?.currency_symbol || ""}{profit.revenue || 0} {profit.currency || appSettings?.currency || "AED"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, bgcolor: "error.light", borderRadius: 2, color: "white" }}>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Cost
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {appSettings?.currency_symbol || ""}{profit.cost || 0} {profit.currency || appSettings?.currency || "AED"}
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
                      {(profit.profit || 0) >= 0 ? "+" : ""}{appSettings?.currency_symbol || ""}{profit.profit || 0} {profit.currency || appSettings?.currency || "AED"}
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

                  {/* Detailed Profitability Breakdown */}
                  <Collapse in={profitabilityDetailsExpanded} timeout="auto" unmountOnExit>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Detailed Analysis
                    </Typography>
                    <TableContainer component={Paper} sx={{ mt: 2, borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "grey.100" }}>
                            <TableCell fontWeight="bold">Metric</TableCell>
                            <TableCell align="right" fontWeight="bold">Value</TableCell>
                            <TableCell align="right" fontWeight="bold">Percentage</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>Total Revenue</TableCell>
                            <TableCell align="right">
                              {appSettings?.currency_symbol || ""}{profit.revenue || 0}
                            </TableCell>
                            <TableCell align="right">100%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Total Cost</TableCell>
                            <TableCell align="right">
                              {appSettings?.currency_symbol || ""}{profit.cost || 0}
                            </TableCell>
                            <TableCell align="right">
                              {profit.revenue > 0 
                                ? ((profit.cost / profit.revenue) * 100).toFixed(2) 
                                : "0.00"}%
                            </TableCell>
                          </TableRow>
                          <TableRow sx={{ bgcolor: (profit.profit || 0) >= 0 ? "success.light" : "error.light" }}>
                            <TableCell sx={{ fontWeight: "bold" }}>Net Profit</TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                              {appSettings?.currency_symbol || ""}{profit.profit || 0}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                              {profit.margin || "0.00"}%
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Profit Margin</TableCell>
                            <TableCell align="right" colSpan={2}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.abs(parseFloat(profit.margin || 0))}
                                color={(profit.profit || 0) >= 0 ? "success" : "error"}
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                              <Typography variant="caption" sx={{ mt: 0.5, display: "block" }}>
                                {profit.margin || "0.00"}% margin
                              </Typography>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Return on Investment (ROI)</TableCell>
                            <TableCell align="right" colSpan={2}>
                              <Typography 
                                variant="body1" 
                                fontWeight="bold"
                                color={(profit.roi || 0) >= 0 ? "success.main" : "error.main"}
                              >
                                {profit.roi || "0.00"}%
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {(profit.roi || 0) >= 0 
                                  ? `For every ${appSettings?.currency_symbol || ""}1 invested, you gain ${appSettings?.currency_symbol || ""}${((parseFloat(profit.roi || 0) / 100) + 1).toFixed(2)}`
                                  : `For every ${appSettings?.currency_symbol || ""}1 invested, you lose ${appSettings?.currency_symbol || ""}${Math.abs((parseFloat(profit.roi || 0) / 100) - 1).toFixed(2)}`
                                }
                              </Typography>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Revenue vs Cost Comparison */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Revenue vs Cost Breakdown
                      </Typography>
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                          <Box sx={{ p: 2, bgcolor: "success.light", borderRadius: 2, color: "white", textAlign: "center" }}>
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                              Revenue Share
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                              {profit.revenue > 0 
                                ? ((profit.revenue / (profit.revenue + Math.abs(profit.cost || 0))) * 100).toFixed(1)
                                : "0"}%
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ p: 2, bgcolor: "error.light", borderRadius: 2, color: "white", textAlign: "center" }}>
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                              Cost Share
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                              {profit.revenue > 0 
                                ? ((Math.abs(profit.cost || 0) / (profit.revenue + Math.abs(profit.cost || 0))) * 100).toFixed(1)
                                : "0"}%
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Collapse>
                </Box>
              ) : (
                <Alert severity="info">No profitability data available</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Budgets List Table */}
      {budget.length > 0 && (
        <Card sx={{ mt: 3, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Budget History
              </Typography>
            </Box>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Budget Amount</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Budget Hours</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Currency</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Created Date</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {budget.map((budgetItem) => (
                    <TableRow key={budgetItem.id} hover>
                      <TableCell>
                        {appSettings?.currency_symbol || ""}{parseFloat(budgetItem.budget_amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>{parseFloat(budgetItem.budget_hours || 0).toFixed(2)} hrs</TableCell>
                      <TableCell>{budgetItem.currency || "AED"}</TableCell>
                      <TableCell>
                        {budgetItem.created_at 
                          ? new Date(budgetItem.created_at).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditBudget(budgetItem)}
                            sx={{ "&:hover": { bgcolor: "primary.light", color: "white" } }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setBudgetToDelete(budgetItem);
                              setDeleteBudgetDialog(true);
                            }}
                            sx={{ "&:hover": { bgcolor: "error.light", color: "white" } }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Costs List Table */}
      {projectCosts.length > 0 && (
        <Card sx={{ mt: 3, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Tracked Costs
              </Typography>
            </Box>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }} align="right">Employee Cost</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }} align="right">Overhead Cost</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }} align="right">Material Cost</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }} align="right">Total Cost</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }} align="right">Hours Spent</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projectCosts.map((cost) => (
                    <TableRow key={cost.id} hover>
                      <TableCell>
                        {cost.cost_date 
                          ? new Date(cost.cost_date).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell align="right">
                        {appSettings?.currency_symbol || ""}{parseFloat(cost.employee_cost || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        {appSettings?.currency_symbol || ""}{parseFloat(cost.overhead_cost || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        {appSettings?.currency_symbol || ""}{parseFloat(cost.material_cost || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        {appSettings?.currency_symbol || ""}{parseFloat(cost.total_cost || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">{parseFloat(cost.hours_spent || 0).toFixed(2)} hrs</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditCost(cost)}
                            sx={{ "&:hover": { bgcolor: "primary.light", color: "white" } }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setCostToDelete(cost);
                              setDeleteCostDialog(true);
                            }}
                            sx={{ "&:hover": { bgcolor: "error.light", color: "white" } }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Set Budget Dialog */}
      <Dialog
        open={budgetDialog}
        onClose={() => {
          setBudgetDialog(false);
          setEditingBudget(null);
          setBudgetData({ budgetAmount: 0, budgetHours: 0, currency: appSettings?.currency || "AED" });
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              {editingBudget ? "Edit Project Budget" : "Set Project Budget"}
            </Typography>
            <IconButton onClick={() => {
              setBudgetDialog(false);
              setEditingBudget(null);
              setBudgetData({ budgetAmount: 0, budgetHours: 0, currency: appSettings?.currency || "AED" });
            }} size="small">
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
            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select
                value={budgetData.currency || appSettings?.currency || "AED"}
                label="Currency"
                onChange={(e) => setBudgetData({ ...budgetData, currency: e.target.value })}
              >
                <MenuItem value="AED">AED - UAE Dirham</MenuItem>
                <MenuItem value="INR">INR - Indian Rupee</MenuItem>
                <MenuItem value="USD">USD - US Dollar</MenuItem>
                <MenuItem value="GBP">GBP - British Pound</MenuItem>
                <MenuItem value="SAR">SAR - Saudi Riyal</MenuItem>
                <MenuItem value="QAR">QAR - Qatari Riyal</MenuItem>
                <MenuItem value="KWD">KWD - Kuwaiti Dinar</MenuItem>
                <MenuItem value="BHD">BHD - Bahraini Dinar</MenuItem>
                <MenuItem value="OMR">OMR - Omani Rial</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => {
            setBudgetDialog(false);
            setEditingBudget(null);
            setBudgetData({ budgetAmount: 0, budgetHours: 0, currency: appSettings?.currency || "AED" });
          }}>Cancel</Button>
          <Button
            onClick={handleSetBudget}
            variant="contained"
            disabled={settingBudget || updatingBudget}
            startIcon={<CheckCircle />}
            sx={{
              background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
              },
            }}
          >
            {settingBudget || updatingBudget ? (editingBudget ? "Updating..." : "Setting...") : (editingBudget ? "Update Budget" : "Set Budget")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Track Cost Dialog */}
      <Dialog
        open={costDialog}
        onClose={() => {
          setCostDialog(false);
          setEditingCost(null);
          setCostData({
            costDate: new Date().toISOString().split("T")[0],
            employeeCost: 0,
            overheadCost: 0,
            materialCost: 0,
            hoursSpent: 0,
          });
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              {editingCost ? "Edit Project Cost" : "Track Project Cost"}
            </Typography>
            <IconButton onClick={() => {
              setCostDialog(false);
              setEditingCost(null);
              setCostData({
                costDate: new Date().toISOString().split("T")[0],
                employeeCost: 0,
                overheadCost: 0,
                materialCost: 0,
                hoursSpent: 0,
              });
            }} size="small">
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
          <Button onClick={() => {
            setCostDialog(false);
            setEditingCost(null);
            setCostData({
              costDate: new Date().toISOString().split("T")[0],
              employeeCost: 0,
              overheadCost: 0,
              materialCost: 0,
              hoursSpent: 0,
            });
          }}>Cancel</Button>
          <Button
            onClick={handleTrackCost}
            variant="contained"
            disabled={trackingCost || updatingCost}
            startIcon={<CheckCircle />}
            sx={{
              background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
              },
            }}
          >
            {trackingCost || updatingCost ? (editingCost ? "Updating..." : "Tracking...") : (editingCost ? "Update Cost" : "Track Cost")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Budget Confirmation Dialog */}
      <Dialog
        open={deleteBudgetDialog}
        onClose={() => {
          setDeleteBudgetDialog(false);
          setBudgetToDelete(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Delete color="error" />
            <Typography variant="h6">Confirm Delete Budget</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this budget?
            <br />
            <br />
            <strong>Budget Amount:</strong> {appSettings?.currency_symbol || ""}{budgetToDelete?.budget_amount || 0}
            <br />
            <strong>Budget Hours:</strong> {budgetToDelete?.budget_hours || 0} hrs
            <br />
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => {
            setDeleteBudgetDialog(false);
            setBudgetToDelete(null);
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteBudget}
            variant="contained"
            color="error"
            startIcon={<Delete />}
            disabled={deletingBudget}
          >
            {deletingBudget ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Cost Confirmation Dialog */}
      <Dialog
        open={deleteCostDialog}
        onClose={() => {
          setDeleteCostDialog(false);
          setCostToDelete(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Delete color="error" />
            <Typography variant="h6">Confirm Delete Cost</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this cost entry?
            <br />
            <br />
            <strong>Date:</strong> {costToDelete?.cost_date ? new Date(costToDelete.cost_date).toLocaleDateString() : "N/A"}
            <br />
            <strong>Total Cost:</strong> {appSettings?.currency_symbol || ""}{parseFloat(costToDelete?.total_cost || 0).toFixed(2)}
            <br />
            <strong>Hours Spent:</strong> {parseFloat(costToDelete?.hours_spent || 0).toFixed(2)} hrs
            <br />
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => {
            setDeleteCostDialog(false);
            setCostToDelete(null);
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteCost}
            variant="contained"
            color="error"
            startIcon={<Delete />}
            disabled={deletingCost}
          >
            {deletingCost ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => setSnackbar({ ...snackbar, open: false })}
            >
              <Close fontSize="small" />
            </IconButton>
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
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

