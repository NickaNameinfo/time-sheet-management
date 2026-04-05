import { createTheme } from "@mui/material/styles";
import { appColors } from "./colors";

/**
 * MUI theme using app color pattern:
 * #4C86F9 (blue) - primary
 * #49A84C (green) - success
 * #F6BC00 (amber) - warning / accent
 */
const appTheme = createTheme({
  palette: {
    primary: {
      main: appColors.primary,
      dark: appColors.primaryDark,
    },
    success: {
      main: appColors.success,
      dark: appColors.successDark,
    },
    warning: {
      main: appColors.accent,
      dark: appColors.accentDark,
    },
    // MUI v5 uses 'secondary' for accent; map to amber
    secondary: {
      main: appColors.accent,
      dark: appColors.accentDark,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

export default appTheme;
