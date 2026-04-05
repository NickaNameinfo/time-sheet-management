import React, { useState, useEffect, useMemo } from "react";
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
  IconButton,
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
  Palette,
  Image as ImageIcon,
  Email as EmailIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useApi } from "../../hooks/useApi";
import { useMutation } from "../../hooks/useMutation";
import { apiService } from "../../services/api";
import { useAppTheme, getAppGradient, getAppGradientHover } from "../../context/AppThemeContext";
import { isCompanyAccount } from "../../utils/authClient";

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

const DEFAULT_THEME_PRIMARY = "#4C86F9";
const DEFAULT_THEME_SUCCESS = "#49A84C";
const DEFAULT_THEME_ACCENT = "#F6BC00";
const DEFAULT_THEME_SIDEBAR_BG = "#101835";
const DEFAULT_THEME_SIDEBAR_TEXT = "#FFFFFF";

const AppSettings = () => {
  const { refetch: refetchTheme } = useAppTheme();
  const isCompanyLogin = useMemo(() => isCompanyAccount(), []);
  const [formData, setFormData] = useState({
    country: "UAE",
    language: "en",
    currency: "AED",
    currency_symbol: "د.إ",
    date_format: "DD/MM/YYYY",
    time_format: "24h",
    theme_primary: DEFAULT_THEME_PRIMARY,
    theme_success: DEFAULT_THEME_SUCCESS,
    theme_accent: DEFAULT_THEME_ACCENT,
    theme_sidebar_bg: DEFAULT_THEME_SIDEBAR_BG,
    theme_sidebar_text: DEFAULT_THEME_SIDEBAR_TEXT,
    logo_url: "",
    admin_trail_version_list: [{ email: "", days: "30" }],
  });

  const { data: appSettings, loading: settingsLoading, refetch: refetchSettings } = useApi(
    () => apiService.getAppSettings(),
    []
  );

  const { mutate: saveSettings, loading: saving } = useMutation(apiService.updateAppSettings);

  useEffect(() => {
    if (appSettings) {
      let trailList = [{ email: "", days: "30" }];
      const listRaw = appSettings.admin_trail_version_list;
      const emailsRaw = appSettings.admin_trail_version_emails;
      const daysRaw = appSettings.admin_trail_version_days ?? "30";
      if (listRaw) {
        try {
          const arr = typeof listRaw === "string" ? JSON.parse(listRaw) : listRaw;
          if (Array.isArray(arr) && arr.length > 0) {
            trailList = arr.map((e) => ({
              email: String(e?.email ?? e ?? "").trim(),
              days: String((e?.days ?? e) != null ? e.days ?? e : daysRaw),
            }));
          }
        } catch (_) { /* ignore */ }
      } else if (emailsRaw) {
        try {
          const arr = typeof emailsRaw === "string" ? JSON.parse(emailsRaw) : emailsRaw;
          const emails = Array.isArray(arr) ? arr : String(emailsRaw).split(/[\n,]+/).map((e) => e.trim()).filter(Boolean);
          if (emails.length > 0) {
            trailList = emails.map((e) => ({ email: String(e).trim(), days: String(daysRaw) }));
          }
        } catch (_) {
          const emails = String(emailsRaw).split(/[\n,]+/).map((e) => e.trim()).filter(Boolean);
          if (emails.length > 0) trailList = emails.map((e) => ({ email: e, days: String(daysRaw) }));
        }
      }
      setFormData((prev) => ({
        ...prev,
        country: appSettings.country || "UAE",
        language: appSettings.language || "en",
        currency: appSettings.currency || "AED",
        currency_symbol: appSettings.currency_symbol || "د.إ",
        date_format: appSettings.date_format || "DD/MM/YYYY",
        time_format: appSettings.time_format || "24h",
        theme_primary: appSettings.theme_primary || DEFAULT_THEME_PRIMARY,
        theme_success: appSettings.theme_success || DEFAULT_THEME_SUCCESS,
        theme_accent: appSettings.theme_accent || DEFAULT_THEME_ACCENT,
        theme_sidebar_bg: appSettings.theme_sidebar_bg || DEFAULT_THEME_SIDEBAR_BG,
        theme_sidebar_text: appSettings.theme_sidebar_text || DEFAULT_THEME_SIDEBAR_TEXT,
        logo_url: appSettings.logo_url || "",
        admin_trail_version_list: trailList,
      }));
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
      const payload = { ...formData };
      // Company tenants must not overwrite platform-wide admin trail email list
      if (!isCompanyLogin) {
        const list = (formData.admin_trail_version_list || [])
          .filter((r) => (r?.email ?? "").toString().trim())
          .map((r) => ({
            email: (r?.email ?? "").toString().trim(),
            days: Math.max(1, Math.min(365, parseInt(r?.days ?? r, 10) || 30)),
          }));
        payload.admin_trail_version_list = list;
      } else {
        delete payload.admin_trail_version_list;
        delete payload.admin_trail_version_emails;
        delete payload.admin_trail_version_days;
        delete payload.admin_trail_version_companies;
      }
      await saveSettings(payload);
      alert("App settings saved successfully!");
      refetchSettings();
      refetchTheme();
    } catch (error) {
      console.error("Error saving app settings:", error);
      alert(error.message || "Failed to save app settings");
    }
  };

  const updateTrailRow = (index, field, value) => {
    setFormData((prev) => {
      const list = [...(prev.admin_trail_version_list || [])];
      if (!list[index]) list[index] = { email: "", days: "30" };
      list[index] = { ...list[index], [field]: value };
      return { ...prev, admin_trail_version_list: list };
    });
  };
  const addTrailRow = () => {
    setFormData((prev) => ({
      ...prev,
      admin_trail_version_list: [...(prev.admin_trail_version_list || []), { email: "", days: "30" }],
    }));
  };
  const removeTrailRow = (index) => {
    setFormData((prev) => {
      const list = (prev.admin_trail_version_list || []).filter((_, i) => i !== index);
      return { ...prev, admin_trail_version_list: list.length ? list : [{ email: "", days: "30" }] };
    });
  };

  const handleResetTheme = () => {
    setFormData((prev) => ({
      ...prev,
      theme_primary: DEFAULT_THEME_PRIMARY,
      theme_success: DEFAULT_THEME_SUCCESS,
      theme_accent: DEFAULT_THEME_ACCENT,
      theme_sidebar_bg: DEFAULT_THEME_SIDEBAR_BG,
      theme_sidebar_text: DEFAULT_THEME_SIDEBAR_TEXT,
    }));
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
                background: getAppGradient({ primary: formData.theme_primary, success: formData.theme_success }),
                "&:hover": {
                  background: getAppGradientHover({ primary: formData.theme_primary, success: formData.theme_success }),
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

        {/* Logo URL - global logo */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <ImageIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Logo
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter a full URL to an image to use as the application logo (sidebar and start page). Leave empty to use the default logo.
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Logo URL"
                    value={formData.logo_url || ""}
                    onChange={handleChange("logo_url")}
                    placeholder="https://example.com/logo.png"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  {formData.logo_url ? (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setFormData((p) => ({ ...p, logo_url: "" }))}
                    >
                      Clear logo
                    </Button>
                  ) : null}
                </Grid>
                <Grid item xs={12} md={4}>
                  {formData.logo_url ? (
                    <Box
                      component="img"
                      src={formData.logo_url}
                      alt="Logo preview"
                      onError={(e) => (e.target.style.display = "none")}
                      sx={{ maxHeight: 56, maxWidth: 120, objectFit: "contain" }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">Default logo will be used</Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Admin trail version — platform super-admin only (not company tenant logins) */}
        {!isCompanyLogin && (
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                  <EmailIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Admin trail version (by email)
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Set trial access per email with its own duration (days). Each user sees trial status (days used, expiry) on their profile. Trial starts on first access.
                </Typography>
                <Stack spacing={2}>
                  {(formData.admin_trail_version_list || []).map((row, index) => (
                    <Box key={index} sx={{ display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
                      <TextField
                        size="small"
                        label="Email"
                        type="email"
                        placeholder="user@example.com"
                        value={row?.email ?? ""}
                        onChange={(e) => updateTrailRow(index, "email", e.target.value)}
                        sx={{ minWidth: 240, flex: 1 }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ min: 1, max: 365 }}
                        label="Trial days"
                        value={row?.days ?? "30"}
                        onChange={(e) => updateTrailRow(index, "days", e.target.value)}
                        sx={{ width: 120 }}
                      />
                      <IconButton
                        color="error"
                        onClick={() => removeTrailRow(index)}
                        title="Remove row"
                        sx={{ mt: 0.5 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={addTrailRow} size="small">
                    Add email
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Application color - global theme */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <Palette color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Application color
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Change these colors to apply a global theme across the entire application (buttons, headers, links).{" "}
                <strong>Sidebar background</strong> controls the left navigation rail only; active menu highlights use{" "}
                <strong>Primary</strong>.
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <TextField
                      type="color"
                      value={formData.theme_primary}
                      onChange={handleChange("theme_primary")}
                      sx={{ width: 56, height: 40, "& .MuiInput-input": { cursor: "pointer", height: 40 } }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Primary"
                      value={formData.theme_primary}
                      onChange={handleChange("theme_primary")}
                      placeholder="#4C86F9"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <TextField
                      type="color"
                      value={formData.theme_success}
                      onChange={handleChange("theme_success")}
                      sx={{ width: 56, height: 40, "& .MuiInput-input": { cursor: "pointer", height: 40 } }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Success"
                      value={formData.theme_success}
                      onChange={handleChange("theme_success")}
                      placeholder="#49A84C"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <TextField
                      type="color"
                      value={formData.theme_accent}
                      onChange={handleChange("theme_accent")}
                      sx={{ width: 56, height: 40, "& .MuiInput-input": { cursor: "pointer", height: 40 } }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Accent"
                      value={formData.theme_accent}
                      onChange={handleChange("theme_accent")}
                      placeholder="#F6BC00"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <TextField
                      type="color"
                      value={formData.theme_sidebar_bg}
                      onChange={handleChange("theme_sidebar_bg")}
                      sx={{ width: 56, height: 40, "& .MuiInput-input": { cursor: "pointer", height: 40 } }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Sidebar background"
                      value={formData.theme_sidebar_bg}
                      onChange={handleChange("theme_sidebar_bg")}
                      placeholder="#101835"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <TextField
                      type="color"
                      value={formData.theme_sidebar_text}
                      onChange={handleChange("theme_sidebar_text")}
                      sx={{ width: 56, height: 40, "& .MuiInput-input": { cursor: "pointer", height: 40 } }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Sidebar menu text"
                      value={formData.theme_sidebar_text}
                      onChange={handleChange("theme_sidebar_text")}
                      placeholder="#FFFFFF"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Button variant="outlined" size="small" onClick={handleResetTheme}>
                    Reset to default colors
                  </Button>
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
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Logo
                </Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ wordBreak: "break-all" }}>
                  {formData.logo_url ? "Custom URL" : "Default"}
                </Typography>
              </Grid>
              {!isCompanyLogin && (
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Admin trail version (per-email days)
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {(formData.admin_trail_version_list || []).filter((r) => (r?.email ?? "").toString().trim()).length
                      ? (formData.admin_trail_version_list || []).filter((r) => (r?.email ?? "").toString().trim()).length + " email(s)"
                      : "None"}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Theme colors
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: formData.theme_primary, border: "1px solid rgba(0,0,0,0.2)" }} />
                    <Typography variant="body2">{formData.theme_primary}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: formData.theme_success, border: "1px solid rgba(0,0,0,0.2)" }} />
                    <Typography variant="body2">{formData.theme_success}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: formData.theme_accent, border: "1px solid rgba(0,0,0,0.2)" }} />
                    <Typography variant="body2">{formData.theme_accent}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: formData.theme_sidebar_bg, border: "1px solid rgba(0,0,0,0.2)" }} />
                    <Typography variant="body2">Sidebar {formData.theme_sidebar_bg}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: 1,
                        bgcolor: formData.theme_sidebar_text,
                        border: "1px solid rgba(0,0,0,0.2)",
                      }}
                    />
                    <Typography variant="body2">Menu text {formData.theme_sidebar_text}</Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AppSettings;
