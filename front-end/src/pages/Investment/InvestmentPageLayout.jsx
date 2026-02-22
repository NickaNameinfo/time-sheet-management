import React from "react";
import { Box, Typography } from "@mui/material";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import {
  pageHeaderSx,
  sectionCardSx as themeSectionCardSx,
  sectionTitleSx,
  filterRowSx as themeFilterRowSx,
  cardWithAccentSx as themeCardWithAccentSx,
} from "./investmentTheme";

/**
 * Consistent layout for Investment & My Self: modern header, max width, padding.
 */
export function InvestmentPageLayout({ children, title, subtitle, maxWidth = 900 }) {
  return (
    <Box
      component="main"
      role="main"
      aria-label={title ? `${title} page` : "Investment"}
      sx={{
        minHeight: "60vh",
        p: { xs: 2, sm: 3 },
        maxWidth: maxWidth,
        mx: "auto",
        bgcolor: "#F1F5F9",
      }}
    >
      {title && (
        <Box
          sx={{
            ...pageHeaderSx,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AccountBalanceWalletRoundedIcon sx={{ fontSize: 26, color: "white" }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "white",
                lineHeight: 1.3,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  color: "rgba(255,255,255,0.9)",
                  maxWidth: 560,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      {children}
    </Box>
  );
}

/** Card style for sections – rounded, shadow, border (re-export from theme) */
export const sectionCardSx = themeSectionCardSx;

/** Section title typography */
export const sectionTitleTypographySx = sectionTitleSx;

/** Stack of filter/action row */
export const filterRowSx = themeFilterRowSx;

/** Card with left accent stripe (e.g. primary color) */
export const cardWithAccentSx = themeCardWithAccentSx;

export default InvestmentPageLayout;
