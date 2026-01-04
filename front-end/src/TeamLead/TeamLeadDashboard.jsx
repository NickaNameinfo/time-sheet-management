import React from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import CommonSidebar from "../components/CommonSidebar";

const drawerWidth = 280;

function TeamLeadDashboard() {

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <CommonSidebar 
        drawerWidth={drawerWidth}
        dashboardTitle="Team Lead Dashboard"
        basePath="/TeamLead"
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, md: 0 },
          bgcolor: "grey.50",
          minHeight: "100vh",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default TeamLeadDashboard;
