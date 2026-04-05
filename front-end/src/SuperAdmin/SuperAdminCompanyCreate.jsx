import React from "react";
import { Box, Typography, Alert, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function SuperAdminCompanyCreate() {
  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Company Create
      </Typography>
      <Alert severity="success" sx={{ mb: 2 }}>
        Company creation is available in <b>All Company List</b>.
      </Alert>
      <Button component={RouterLink} to="/Dashboard/SuperAdmin/Companies" variant="contained">
        Go to Companies
      </Button>
    </Box>
  );
}

