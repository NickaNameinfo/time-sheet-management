import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { apiService } from "../services/api";
import { registerAppThemeRefetch } from "./appThemeRefetch";

const DEFAULT_PRIMARY = "#4C86F9";
const DEFAULT_SUCCESS = "#49A84C";
const DEFAULT_ACCENT = "#F6BC00";
const DEFAULT_SIDEBAR_BG = "#101835";
const DEFAULT_SIDEBAR_TEXT = "#FFFFFF";

/** Date/time display for top bar (from App Settings API) */
export const DEFAULT_LOCALE_PREFS = {
  time_format: "24h",
  date_format: "DD/MM/YYYY",
  language: "en",
};

/** Normalize hex from API (with or without #) */
function normalizeSidebarColor(val, fallback = DEFAULT_SIDEBAR_BG) {
  if (val == null) return fallback;
  const s = String(val).trim();
  if (!s) return fallback;
  const h = s.startsWith("#") ? s : `#${s}`;
  if (/^#[0-9A-Fa-f]{3}$/.test(h) || /^#[0-9A-Fa-f]{6}$/.test(h)) return h;
  return fallback;
}

function normalizeSidebarTextColor(val, fallback = DEFAULT_SIDEBAR_TEXT) {
  return normalizeSidebarColor(val, fallback);
}

/** Axios response → flat settings object */
function unwrapAppSettingsResponse(res) {
  const d = res?.data;
  if (!d || typeof d !== "object") return {};
  if (d.Status === "Success" && d.Result != null && typeof d.Result === "object" && !Array.isArray(d.Result)) {
    return d.Result;
  }
  return d.Result ?? d;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
}
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("");
}
function darkenHex(hex, percent = 0.15) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - percent), g * (1 - percent), b * (1 - percent));
}

function buildThemeFromColors(primary, success, accent) {
  const p = primary || DEFAULT_PRIMARY;
  const s = success || DEFAULT_SUCCESS;
  const a = accent || DEFAULT_ACCENT;
  return createTheme({
    palette: {
      primary: { main: p, dark: darkenHex(p) },
      success: { main: s, dark: darkenHex(s) },
      warning: { main: a, dark: darkenHex(a) },
      secondary: { main: a, dark: darkenHex(a) },
    },
    shape: { borderRadius: 12 },
  });
}

const AppThemeContext = createContext({
  theme: null,
  colors: {
    primary: DEFAULT_PRIMARY,
    success: DEFAULT_SUCCESS,
    accent: DEFAULT_ACCENT,
    sidebarBg: DEFAULT_SIDEBAR_BG,
    sidebarText: DEFAULT_SIDEBAR_TEXT,
  },
  logoUrl: "",
  localePrefs: DEFAULT_LOCALE_PREFS,
  refetch: () => {},
});

export function AppThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => buildThemeFromColors(DEFAULT_PRIMARY, DEFAULT_SUCCESS, DEFAULT_ACCENT));
  const [colors, setColors] = useState({
    primary: DEFAULT_PRIMARY,
    success: DEFAULT_SUCCESS,
    accent: DEFAULT_ACCENT,
    sidebarBg: DEFAULT_SIDEBAR_BG,
    sidebarText: DEFAULT_SIDEBAR_TEXT,
  });
  const [logoUrl, setLogoUrl] = useState("");
  const [localePrefs, setLocalePrefs] = useState(DEFAULT_LOCALE_PREFS);

  const fetchAndApply = useCallback(async () => {
    try {
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setColors({
          primary: DEFAULT_PRIMARY,
          success: DEFAULT_SUCCESS,
          accent: DEFAULT_ACCENT,
          sidebarBg: DEFAULT_SIDEBAR_BG,
          sidebarText: DEFAULT_SIDEBAR_TEXT,
        });
        setTheme(buildThemeFromColors(DEFAULT_PRIMARY, DEFAULT_SUCCESS, DEFAULT_ACCENT));
        setLogoUrl("");
        setLocalePrefs(DEFAULT_LOCALE_PREFS);
        return;
      }

      const res = await apiService.getAppSettings();
      const data = unwrapAppSettingsResponse(res);
      const primary = data.theme_primary || DEFAULT_PRIMARY;
      const success = data.theme_success || DEFAULT_SUCCESS;
      const accent = data.theme_accent || DEFAULT_ACCENT;
      const sidebarBg = normalizeSidebarColor(data.theme_sidebar_bg, DEFAULT_SIDEBAR_BG);
      const sidebarText = normalizeSidebarTextColor(data.theme_sidebar_text, DEFAULT_SIDEBAR_TEXT);
      setColors({ primary, success, accent, sidebarBg, sidebarText });
      setTheme(buildThemeFromColors(primary, success, accent));
      setLogoUrl((data.logo_url && String(data.logo_url).trim()) || "");
      setLocalePrefs({
        time_format: data.time_format || DEFAULT_LOCALE_PREFS.time_format,
        date_format: data.date_format || DEFAULT_LOCALE_PREFS.date_format,
        language: data.language || DEFAULT_LOCALE_PREFS.language,
      });
    } catch (err) {
      setTheme(buildThemeFromColors(DEFAULT_PRIMARY, DEFAULT_SUCCESS, DEFAULT_ACCENT));
      setColors({
        primary: DEFAULT_PRIMARY,
        success: DEFAULT_SUCCESS,
        accent: DEFAULT_ACCENT,
        sidebarBg: DEFAULT_SIDEBAR_BG,
        sidebarText: DEFAULT_SIDEBAR_TEXT,
      });
      setLogoUrl("");
      setLocalePrefs(DEFAULT_LOCALE_PREFS);
    }
  }, []);

  useEffect(() => {
    fetchAndApply();
  }, [fetchAndApply]);

  useEffect(() => {
    registerAppThemeRefetch(fetchAndApply);
    return () => registerAppThemeRefetch(null);
  }, [fetchAndApply]);

  const value = useMemo(
    () => ({
      theme,
      colors,
      logoUrl,
      localePrefs,
      refetch: fetchAndApply,
    }),
    [theme, colors, logoUrl, localePrefs, fetchAndApply]
  );

  return (
    <AppThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppThemeContext.Provider>
  );
}

/** Helper to get gradient from current colors */
export function getAppGradient(colorsObj) {
  const p = colorsObj?.primary || DEFAULT_PRIMARY;
  const s = colorsObj?.success || DEFAULT_SUCCESS;
  return `linear-gradient(135deg, ${p} 0%, ${s} 100%)`;
}

export function getAppGradientHover(colorsObj) {
  const p = colorsObj?.primary || DEFAULT_PRIMARY;
  const s = colorsObj?.success || DEFAULT_SUCCESS;
  return `linear-gradient(135deg, ${darkenHex(p)} 0%, ${darkenHex(s)} 100%)`;
}

export function useAppTheme() {
  const ctx = useContext(AppThemeContext);
  if (!ctx.theme) {
    return {
      theme: buildThemeFromColors(DEFAULT_PRIMARY, DEFAULT_SUCCESS, DEFAULT_ACCENT),
      colors: {
        primary: DEFAULT_PRIMARY,
        success: DEFAULT_SUCCESS,
        accent: DEFAULT_ACCENT,
        sidebarBg: DEFAULT_SIDEBAR_BG,
        sidebarText: DEFAULT_SIDEBAR_TEXT,
      },
      logoUrl: "",
      localePrefs: DEFAULT_LOCALE_PREFS,
      refetch: () => {},
    };
  }
  return ctx;
}
