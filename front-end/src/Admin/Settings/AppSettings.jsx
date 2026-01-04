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
  Divider,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Language,
  Public,
  AttachMoney,
  Save,
  Refresh,
  Info,
  CalendarToday,
  AccessTime,
} from "@mui/icons-material";
import { useApi } from "../../hooks/useApi";
import { useMutation } from "../../hooks/useMutation";
import { apiService } from "../../services/api";

// Country to Currency mapping
const COUNTRY_CURRENCIES = {
  UAE: { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  India: { code: "INR", symbol: "₹", name: "Indian Rupee" },
  USA: { code: "USD", symbol: "$", name: "US Dollar" },
  UK: { code: "GBP", symbol: "£", name: "British Pound" },
  Saudi: { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  Qatar: { code: "QAR", symbol: "﷼", name: "Qatari Riyal" },
  Kuwait: { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar" },
  Bahrain: { code: "BHD", symbol: ".د.ب", name: "Bahraini Dinar" },
  Oman: { code: "OMR", symbol: "ر.ع.", name: "Omani Rial" },
  Other: { code: "USD", symbol: "$", name: "US Dollar" },
};

const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "fr", name: "French", native: "Français" },
  { code: "es", name: "Spanish", native: "Español" },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (e.g., 25/12/2024)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (e.g., 12/25/2024)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (e.g., 2024-12-25)" },
  { value: "DD-MM-YYYY", label: "DD-MM-YYYY (e.g., 25-12-2024)" },
];

const TIME_FORMATS = [
  { value: "24h", label: "24 Hour (e.g., 14:30)" },
  { value: "12h", label: "12 Hour (e.g., 2:30 PM)" },
];

const AppSettings = () => {
  const [formData, setFormData] = useState({
    country: "UAE",
    language: "en",
    currency: "AED",
    currency_symbol: "د.إ",
    date_format: "DD/MM/YYYY",
    time_format: "24h",
  });

  const { data: appSettings, loading: settingsLoading, refetch: refetchSettings } = useApi(
    () => apiService.getAppSettings(),
    []
  );

  const { mutate: saveSettings, loading: saving } = useMutation(apiService.updateAppSettings);

  useEffect(() => {
    if (appSettings) {
      setFormData({
        country: appSettings.country || "UAE",
        language: appSettings.language || "en",
        currency: appSettings.currency || "AED",
        currency_symbol: appSettings.currency_symbol || "د.إ",
        date_format: appSettings.date_format || "DD/MM/YYYY",
        time_format: appSettings.time_format || "24h",
      });
    }
  }, [appSettings]);

  const handleCountryChange = (country) => {
    const currencyInfo = COUNTRY_CURRENCIES[country] || COUNTRY_CURRENCIES.UAE;
    setFormData((prev) => ({
      ...prev,
      country,
      currency: currencyInfo.code,
      currency_symbol: currencyInfo.symbol,
    }));
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    try {
      await saveSettings(formData);
      alert("App settings saved successfully!");
      refetchSettings();
    } catch (error) {
      console.error("Error saving app settings:", error);
      alert(error.message || "Failed to save app settings");
    }
  };

  if (settingsLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  const selectedCurrency = COUNTRY_CURRENCIES[formData.country] || COUNTRY_CURRENCIES.UAE;

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
              App Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure overall application settings including country, language, and currency
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refetchSettings}
              disabled={settingsLoading}
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
              {saving ? <CircularProgress size={20} color="inherit" /> : "Save Settings"}
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" icon={<Info />} sx={{ mb: 3 }}>
        These settings will be applied across the entire application. Changes will affect currency display, date/time formats, and language preferences.
      </Alert>

      <Grid container spacing={3}>
        {/* Country & Language */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <Public color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Country & Language
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Country</InputLabel>
                    <Select
                      value={formData.country}
                      label="Country"
                      onChange={(e) => handleCountryChange(e.target.value)}
                    >
                      {Object.keys(COUNTRY_CURRENCIES).map((country) => (
                        <MenuItem key={country} value={country}>
                          {country}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    Selecting a country will automatically update the currency settings
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={formData.language}
                      label="Language"
                      onChange={handleChange("language")}
                    >
                      {LANGUAGES.map((lang) => (
                        <MenuItem key={lang.code} value={lang.code}>
                          {lang.native} ({lang.name})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Currency Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <AttachMoney color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Currency Settings
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Currency Code"
                    value={formData.currency}
                    onChange={handleChange("currency")}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoney />
                        </InputAdornment>
                      ),
                    }}
                    helperText="ISO currency code (e.g., AED, USD)"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Currency Symbol"
                    value={formData.currency_symbol}
                    onChange={handleChange("currency_symbol")}
                    helperText="Symbol to display (e.g., د.إ, $, ₹)"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: "primary.light",
                      borderRadius: 2,
                      color: "white",
                    }}
                  >
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      Currency Name
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {selectedCurrency.name}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Date & Time Format */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <CalendarToday color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Date & Time Format
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Date Format</InputLabel>
                    <Select
                      value={formData.date_format}
                      label="Date Format"
                      onChange={handleChange("date_format")}
                    >
                      {DATE_FORMATS.map((format) => (
                        <MenuItem key={format.value} value={format.value}>
                          {format.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Time Format</InputLabel>
                    <Select
                      value={formData.time_format}
                      label="Time Format"
                      onChange={handleChange("time_format")}
                    >
                      {TIME_FORMATS.map((format) => (
                        <MenuItem key={format.value} value={format.value}>
                          {format.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Settings Summary */}
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
              Current Settings Summary
            </Typography>
            <Divider sx={{ my: 2, bgcolor: "rgba(255,255,255,0.3)" }} />
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4} md={2}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Country
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formData.country}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Language
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {LANGUAGES.find((l) => l.code === formData.language)?.native || formData.language}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Currency
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formData.currency}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Symbol
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formData.currency_symbol}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Date Format
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formData.date_format}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Time Format
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formData.time_format}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AppSettings;
