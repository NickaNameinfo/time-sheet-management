/**
 * Application color palette (used across the app)
 * #F6BC00 - Amber / accent / warning
 * #49A84C - Green / success
 * #4C86F9 - Blue / primary
 */
export const appColors = {
  primary: "#4C86F9",
  primaryDark: "#3d6dd1",
  success: "#49A84C",
  successDark: "#3d8b40",
  accent: "#F6BC00",
  accentDark: "#e0a800",
};

/** Main gradient: blue → green (primary to success) */
export const appGradient = `linear-gradient(135deg, ${appColors.primary} 0%, ${appColors.success} 100%)`;

/** Hover gradient (darker) */
export const appGradientHover = `linear-gradient(135deg, ${appColors.primaryDark} 0%, ${appColors.successDark} 100%)`;

/** Sidebar/selection highlight (transparent primary) */
export const appGradientAlpha = (alpha = 0.15) =>
  `linear-gradient(135deg, rgba(76, 134, 249, ${alpha}) 0%, rgba(73, 168, 76, ${alpha}) 100%)`;

export default appColors;
