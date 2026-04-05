import React from "react";
import { Box, Card, CardContent, Typography, Grid, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const tiles = [
  { title: "New Leads", to: "/Dashboard/SuperAdmin/NewLeads" },
  { title: "All Company List", to: "/Dashboard/SuperAdmin/Companies" },
  { title: "Trail Version (List & Details)", to: "/Dashboard/SuperAdmin/TrailVersions" },
  { title: "Company Profile Login List", to: "/Dashboard/SuperAdmin/CompanyLogins" },
  { title: "Company Menu Permission", to: "/Dashboard/SuperAdmin/CompanyMenuPermissions" },
  { title: "Menu Trail Version Setting", to: "/Dashboard/SuperAdmin/MenuTrailSettings" },
  { title: "Company Subscription Details", to: "/Dashboard/SuperAdmin/CompanySubscriptions" },
  { title: "Company Billing Details", to: "/Dashboard/SuperAdmin/CompanyBilling" },
];

export default function SuperAdminHome() {
  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Super Admin
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        This console is shown only for super admin accounts and contains a restricted set of menus.
      </Typography>

      <Grid container spacing={2}>
        {tiles.map((t) => (
          <Grid item xs={12} sm={6} md={4} key={t.to}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  {t.title}
                </Typography>
                <Button component={RouterLink} to={t.to} variant="contained" size="small">
                  Open
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

