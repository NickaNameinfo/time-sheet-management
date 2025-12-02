import React, { useState } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import {
  People,
  Logout,
  Menu,
  EventAvailable,
  Settings as SettingsIcon,
  Person,
  AccessTime,
  Assignment,
} from "@mui/icons-material";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import commonData from "../../common.json";

const drawerWidth = 280;

function HrDashboard() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    {
      title: "Leave Balance",
      icon: <EventAvailable />,
      path: "/Hr/LeaveBalance",
    },
    {
      title: "Manage Employees",
      icon: <People />,
      path: "/Hr/employee",
    },
    {
      title: "Settings",
      icon: <SettingsIcon />,
      path: "/Hr/Settings",
    },
  ];

  const commonMenuItems = [
    {
      title: "Profile",
      icon: <Person />,
      path: "/Hr/Profile",
    },
    {
      title: "Time Management",
      icon: <AccessTime />,
      path: "/Hr/TimeManagement",
    },
    {
      title: "Apply Leave",
      icon: <EventAvailable />,
      path: "/Hr/AddLeaves",
    },
    {
      title: "Comp-Off",
      icon: <Assignment />,
      path: "/Hr/CompOff",
    },
  ];

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid rgba(0,0,0,0.12)",
        }}
      >
        <Avatar
          src={`${commonData?.BASEURL}/src/assets/logo.png`}
          sx={{ width: 80, height: 80, borderRadius: 2 }}
          variant="rounded"
        />
      </Box>
      <Box sx={{ p: 2, textAlign: "center", borderBottom: "1px solid rgba(0,0,0,0.12)" }}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          HR Dashboard
        </Typography>
      </Box>
      <List sx={{ flexGrow: 1, pt: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={isActive}
                sx={{
                  mb: 0.5,
                  mx: 1,
                  borderRadius: 2,
                  "&.Mui-selected": {
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    "&:hover": {
                      background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                    },
                    "& .MuiListItemIcon-root": {
                      color: "white",
                    },
                  },
                  "&:hover": {
                    bgcolor: "action.hover",
                    transform: "translateX(5px)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive ? "white" : "inherit" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontSize: "0.95rem",
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
        
        <Box sx={{ mt: 2, mb: 1, px: 2 }}>
          <Typography variant="overline" sx={{ color: "text.secondary", fontSize: "0.75rem", fontWeight: 600 }}>
            Common
          </Typography>
        </Box>
        
        {commonMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={isActive}
                sx={{
                  mb: 0.5,
                  mx: 1,
                  borderRadius: 2,
                  "&.Mui-selected": {
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    "&:hover": {
                      background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                    },
                    "& .MuiListItemIcon-root": {
                      color: "white",
                    },
                  },
                  "&:hover": {
                    bgcolor: "action.hover",
                    transform: "translateX(5px)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive ? "white" : "inherit" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontSize: "0.95rem",
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ p: 2, borderTop: "1px solid rgba(0,0,0,0.12)" }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            color: "error.main",
            "&:hover": {
              bgcolor: "error.light",
              color: "white",
            },
            transition: "all 0.3s ease",
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
            <Logout />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <Menu />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              HR Dashboard
            </Typography>
          </Toolbar>
        </AppBar>
      )}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                borderRight: "1px solid rgba(0, 0, 0, 0.12)",
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>
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

export default HrDashboard;
