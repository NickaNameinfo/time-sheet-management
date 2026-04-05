import React from "react";
import { Box, Typography } from "@mui/material";
import LeadList from "../Admin/Sales/LeadList";

export default function SuperAdminNewLeads() {
  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        New Leads
      </Typography>
      <LeadList />
    </Box>
  );
}

