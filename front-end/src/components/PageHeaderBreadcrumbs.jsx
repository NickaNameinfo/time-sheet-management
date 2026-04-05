import React from "react";
import { Box, Breadcrumbs, Typography, Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

/**
 * Page header: breadcrumb trail + main title + optional subtitle.
 * Pass only **parent** segments in `items` (each with `label` and `to`). Current page is `title` (not in breadcrumbs).
 *
 * @param {Array<{ label: string, to: string }>} [items=[]]
 * @param {string} title - Current page heading
 * @param {string} [subtitle]
 */
export default function PageHeaderBreadcrumbs({ items = [], title, subtitle }) {
  return (
    <Box sx={{ mb: 3 }}>
      {items.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" sx={{ color: "text.secondary" }} />}
          aria-label="breadcrumb"
          sx={{ "& .MuiBreadcrumbs-separator": { mx: 0.5 } }}
        >
          {items.map((item, i) => (
            <Link
              key={i}
              component={RouterLink}
              to={item.to}
              underline="hover"
              color="inherit"
              variant="body2"
              sx={{ fontWeight: 500 }}
            >
              {item.label}
            </Link>
          ))}
        </Breadcrumbs>
      )}
      {title ? (
        <Typography variant="h4" fontWeight="bold" sx={{ mt: items.length ? 1.5 : 0, letterSpacing: -0.3 }}>
          {title}
        </Typography>
      ) : null}
      {subtitle ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}
