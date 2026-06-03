import React from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import CommonSidebar from "../components/CommonSidebar";
import { useTranslation } from "react-i18next";

const drawerWidth = 104;

function TeamLeadDashboard() {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <CommonSidebar 
        drawerWidth={drawerWidth}
        dashboardTitle={t("layout.teamLeadDashboard")}
        basePath="/TeamLead"
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

export default TeamLeadDashboard;
