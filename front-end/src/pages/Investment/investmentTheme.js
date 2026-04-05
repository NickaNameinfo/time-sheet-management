/**
 * Shared theme for Investment & My Self pages: colors, gradients, and common sx.
 */
export const investmentColors = {
  primary: "#4C86F9",
  primaryDark: "#3d6dd1",
  success: "#49A84C",
  info: "#4C86F9",
  warning: "#F6BC00",
  surface: "#FFFFFF",
  background: "#F1F5F9",
};

export const investmentGradient = `linear-gradient(135deg, ${investmentColors.primary} 0%, ${investmentColors.success} 100%)`;

/** Page header wrapper - gradient bar + title */
export const pageHeaderSx = {
  background: investmentGradient,
  color: "white",
  borderRadius: 3,
  px: { xs: 2, sm: 3 },
  py: 2.5,
  mb: 3,
  boxShadow: "0 4px 14px rgba(76, 134, 249, 0.25)",
};

/** Section card: rounded, soft shadow, border */
export const sectionCardSx = {
  p: { xs: 2, sm: 3 },
  borderRadius: 3,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
  bgcolor: "background.paper",
  border: "1px solid",
  borderColor: "rgba(0,0,0,0.06)",
  transition: "box-shadow 0.2s ease",
  "&:focus-within": {
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
};

/** Card with left accent stripe (primary color) */
export const cardWithAccentSx = (color = investmentColors.primary) => ({
  ...sectionCardSx,
  borderLeft: `4px solid ${color}`,
});

/** Section title (h2-style) */
export const sectionTitleSx = {
  fontSize: "1.125rem",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: "text.primary",
  mb: 1.5,
};

/** Filter/action row */
export const filterRowSx = {
  display: "flex",
  flexWrap: "wrap",
  gap: 1.5,
  alignItems: "center",
};

/** Stat chip / metric box */
export const statChipSx = {
  px: 1.5,
  py: 1,
  borderRadius: 2,
  fontWeight: 600,
  fontSize: "0.875rem",
};

export default {
  investmentColors,
  investmentGradient,
  pageHeaderSx,
  sectionCardSx,
  cardWithAccentSx,
  sectionTitleSx,
  filterRowSx,
  statChipSx,
};
