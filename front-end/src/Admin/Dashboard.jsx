import React from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import CommonSidebar from "../components/CommonSidebar";

/** Matches CommonSidebar narrow rail (desktop) */
const drawerWidth = 104;

function Dashboard() {
  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <CommonSidebar 
        drawerWidth={drawerWidth}
        dashboardTitle="Admin Dashboard"
        basePath="/Dashboard"
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: "56px", md: "64px" },
          bgcolor: "grey.50",
          minHeight: "100vh",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default Dashboard;
