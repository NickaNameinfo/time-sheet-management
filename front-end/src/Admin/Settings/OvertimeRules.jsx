import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Divider,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  AccessTime,
  Settings,
  Save,
  Refresh,
  CheckCircle,
  Info,
} from "@mui/icons-material";
import { useApi } from "../../hooks/useApi";
import { useMutation } from "../../hooks/useMutation";
import { apiService } from "../../services/api";

const OvertimeRules = () => {
  const [formData, setFormData] = useState({
    country: "UAE",
    daily_hours_limit: 8.0,
    weekly_hours_limit: 48.0,
    friday_multiplier: 1.5,
    holiday_multiplier: 2.0,
    night_shift_multiplier: 1.25,
    night_shift_start: "22:00:00",
    night_shift_end: "06:00:00",
    is_active: true,
  });

  // Fetch app settings to get the default country
  const { data: appSettings, loading: appSettingsLoading } = useApi(
    () => apiService.getAppSettings(),
    []
  );

  const { data: otRules, loading: rulesLoading, refetch: refetchRules } = useApi(
    () => apiService.getOTRules(),
    []
  );

  const { mutate: saveRule, loading: saving } = useMutation(apiService.createOTRule);

  useEffect(() => {
    // Always use country from app settings as the source of truth
    if (appSettings && appSettings.country) {
      setFormData((prev) => ({
        ...prev,
        country: appSettings.country,
      }));
    }
  }, [appSettings]);

  useEffect(() => {
    if (otRules && otRules.length > 0) {
      const rule = otRules[0];
      // Use country from app settings, fallback to rule country, then default
      const countryFromSettings = appSettings?.country || rule.country || "UAE";
      setFormData((prev) => ({
        ...prev,
        country: countryFromSettings,
        daily_hours_limit: parseFloat(rule.daily_hours_limit) || 8.0,
        weekly_hours_limit: parseFloat(rule.weekly_hours_limit) || 48.0,
        friday_multiplier: parseFloat(rule.friday_multiplier) || 1.5,
        holiday_multiplier: parseFloat(rule.holiday_multiplier) || 2.0,
        night_shift_multiplier: parseFloat(rule.night_shift_multiplier) || 1.25,
        night_shift_start: rule.night_shift_start || "22:00:00",
        night_shift_end: rule.night_shift_end || "06:00:00",
        is_active: rule.is_active !== undefined ? rule.is_active : true,
      }));
    } else if (appSettings && appSettings.country) {
      // If no OT rules exist, use country from app settings
      setFormData((prev) => ({
        ...prev,
        country: appSettings.country,
      }));
    }
  }, [otRules, appSettings]);

  const handleChange = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumericChange = (field) => (e) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      // Ensure country is always from app settings when saving
      const countryToSave = appSettings?.country || formData.country;
      const dataToSave = {
        ...formData,
        country: countryToSave,
      };
      await saveRule(dataToSave);
      alert("Overtime rules saved successfully!");
      refetchRules();
    } catch (error) {
      console.error("Error saving overtime rules:", error);
      alert(error.message || "Failed to save overtime rules");
    }
  };

  if (rulesLoading || appSettingsLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
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
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Overtime Rules Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure overtime calculation rules and multipliers
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refetchRules}
              disabled={rulesLoading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSubmit}
              disabled={saving}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                },
              }}
            >
              {saving ? <CircularProgress size={20} color="inherit" /> : "Save Rules"}
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" icon={<Info />} sx={{ mb: 3 }}>
        These rules will be used to calculate overtime hours for all employees. Changes will affect future calculations.
      </Alert>

      <Grid container spacing={3}>
        {/* Basic Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <Settings color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Basic Settings
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Country</InputLabel>
                    <Select
                      value={appSettings?.country || formData.country || "UAE"}
                      label="Country"
                      disabled={true}
                    >
                      <MenuItem value="UAE">UAE</MenuItem>
                      <MenuItem value="India">India</MenuItem>
                      <MenuItem value="USA">USA</MenuItem>
                      <MenuItem value="UK">UK</MenuItem>
                      <MenuItem value="Saudi">Saudi</MenuItem>
                      <MenuItem value="Qatar">Qatar</MenuItem>
                      <MenuItem value="Kuwait">Kuwait</MenuItem>
                      <MenuItem value="Bahrain">Bahrain</MenuItem>
                      <MenuItem value="Oman">Oman</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    Country is automatically fetched from App Settings. To change the country, please update it in{" "}
                    <strong>Settings → App Settings</strong>.
                  </Typography>
                  {appSettings?.country && (
                    <Typography variant="caption" color="primary.main" sx={{ mt: 0.5, display: "block" }}>
                      Current country from App Settings: <strong>{appSettings.country}</strong>
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Daily Hours Limit"
                    type="number"
                    value={formData.daily_hours_limit}
                    onChange={handleNumericChange("daily_hours_limit")}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccessTime />
                        </InputAdornment>
                      ),
                      inputProps: { min: 0, step: 0.5 },
                    }}
                    helperText="Standard working hours per day"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Weekly Hours Limit"
                    type="number"
                    value={formData.weekly_hours_limit}
                    onChange={handleNumericChange("weekly_hours_limit")}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccessTime />
                        </InputAdornment>
                      ),
                      inputProps: { min: 0, step: 0.5 },
                    }}
                    helperText="Standard working hours per week"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_active}
                        onChange={handleChange("is_active")}
                        color="primary"
                      />
                    }
                    label="Active"
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Enable or disable these overtime rules
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Multipliers */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <CheckCircle color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Overtime Multipliers
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Friday Multiplier"
                    type="number"
                    value={formData.friday_multiplier}
                    onChange={handleNumericChange("friday_multiplier")}
                    InputProps={{
                      inputProps: { min: 1, step: 0.1 },
                    }}
                    helperText="Multiplier for Friday overtime (e.g., 1.5 = 1.5x)"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Holiday Multiplier"
                    type="number"
                    value={formData.holiday_multiplier}
                    onChange={handleNumericChange("holiday_multiplier")}
                    InputProps={{
                      inputProps: { min: 1, step: 0.1 },
                    }}
                    helperText="Multiplier for holiday overtime (e.g., 2.0 = 2x)"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Night Shift Multiplier"
                    type="number"
                    value={formData.night_shift_multiplier}
                    onChange={handleNumericChange("night_shift_multiplier")}
                    InputProps={{
                      inputProps: { min: 1, step: 0.1 },
                    }}
                    helperText="Multiplier for night shift overtime"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Night Shift Settings */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <AccessTime color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Night Shift Settings
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Night Shift Start Time"
                    type="time"
                    value={formData.night_shift_start}
                    onChange={handleChange("night_shift_start")}
                    InputLabelProps={{ shrink: true }}
                    helperText="Start time for night shift (HH:MM:SS)"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Night Shift End Time"
                    type="time"
                    value={formData.night_shift_end}
                    onChange={handleChange("night_shift_end")}
                    InputLabelProps={{ shrink: true }}
                    helperText="End time for night shift (HH:MM:SS)"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Rules Summary */}
        {otRules && otRules.length > 0 && (
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                bgcolor: "primary.light",
                borderRadius: 3,
                color: "white",
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Current Rules Summary
              </Typography>
              <Divider sx={{ my: 2, bgcolor: "rgba(255,255,255,0.3)" }} />
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Daily Limit
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formData.daily_hours_limit} hrs
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Weekly Limit
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formData.weekly_hours_limit} hrs
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Friday Multiplier
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formData.friday_multiplier}x
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Holiday Multiplier
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formData.holiday_multiplier}x
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default OvertimeRules;
