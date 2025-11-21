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
  Divider,
  Avatar,
  IconButton,
  Collapse,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  Chip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People,
  PersonAdd,
  Business,
  Settings,
  Assessment,
  Logout,
  ExpandLess,
  ExpandMore,
  Schedule,
  EventAvailable,
  WorkHistory,
  Payments,
  AccountBalance,
  TrendingUp,
  CheckCircle,
  AccessTime,
  Assignment,
  Notifications,
  Menu,
  LocationOn,
  Face,
  PhoneAndroid,
  Email,
  AccountTree,
} from "@mui/icons-material";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import config from "../config/index.js";
import { useAuth } from "../context/AuthContext";

const drawerWidth = 280;

function Dashboard() {
  const { roles, logout, user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});

  // Normalize roles - trim whitespace and handle null/undefined
  const normalizedRoles = React.useMemo(() => {
    if (!roles || !Array.isArray(roles)) return [];
    return roles.map(role => role?.trim()).filter(Boolean);
  }, [roles]);

  const handleMenuToggle = (menu) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: <DashboardIcon />,
      path: "/Dashboard",
      roles: ["Admin"],
    },
    {
      title: "Manage Employees",
      icon: <People />,
      path: "/Dashboard/employee",
      roles: ["Admin", "HR"],
    },
    {
      title: "Manage TL",
      icon: <PersonAdd />,
      path: "/Dashboard/lead",
      roles: ["Admin"],
    },
    {
      title: "Manage Projects",
      icon: <Business />,
      path: "/Dashboard/projects",
      roles: ["Admin"],
    },
  ];

  const approvalItems = [
    { title: "Leave Details", path: "/Dashboard/leaves" },
    { title: "Comp-Off Details", path: "/Dashboard/CompOffList" },
  ];

  const reportItems = [
    { title: "Employee Report", path: "/Dashboard/Reports/EmployeeReport" },
    { title: "Consolidated Report", path: "/Dashboard/Reports/ConsolidatedReport" },
    { title: "Project Report", path: "/Dashboard/Reports/ProjectReport" },
    { title: "Weekly Report", path: "/Dashboard/Reports/WeeklyReport" },
    { title: "Monthly Report", path: "/Dashboard/Reports/MonthlyReport" },
    { title: "Yearly Report", path: "/Dashboard/Reports/YearlyReport" },
    { title: "Discipline Report", path: "/Dashboard/Reports/CodeReport" },
    { title: "Leave Report", path: "/Dashboard/Reports/LeaveReport" },
  ];

  // Phase 1 & 2 - Implemented Features
  const phase1Phase2Items = [
    { title: "Overtime Management", icon: <Schedule />, path: "/Dashboard/Overtime" },
    { title: "Leave Balance", icon: <EventAvailable />, path: "/Dashboard/LeaveBalance" },
    { title: "Shift Management", icon: <WorkHistory />, path: "/Dashboard/Shifts" },
    { title: "Payroll Export", icon: <Payments />, path: "/Dashboard/Payroll" },
    { title: "Billing & Invoicing", icon: <AccountBalance />, path: "/Dashboard/Billing" },
    { title: "Budget Tracking", icon: <AccountTree />, path: "/Dashboard/Budget" },
    { title: "Productivity", icon: <TrendingUp />, path: "/Dashboard/Productivity" },
    { title: "Approval Center", icon: <CheckCircle />, path: "/Dashboard/Approvals" },
    { title: "Automated Reports", icon: <Email />, path: "/Dashboard/Reports/Automated" },
  ];

  // Phase 3 - Coming Soon Features
  const comingSoonItems = [
    { title: "GPS & Geolocation Tracking", icon: <LocationOn />, path: "#", comingSoon: true },
    { title: "Face Recognition Attendance", icon: <Face />, path: "#", comingSoon: true },
    { title: "Mobile App", icon: <PhoneAndroid />, path: "#", comingSoon: true },
    { title: "Push Notifications", icon: <Notifications />, path: "#", comingSoon: true },
  ];

  const commonItems = [
    { title: "Employee Dashboard", icon: <DashboardIcon />, path: "/Dashboard/EmployeeHome", roles: ["TL", "Admin", "Employee", "HR"] },
    { title: "Team Lead Dashboard", icon: <DashboardIcon />, path: "/Dashboard/TeamLeadHome", roles: ["TL", "Admin"] },
    { title: "Project Work Details", icon: <Assignment />, path: "/Dashboard/TeamLeadProjectWorks", roles: ["TL", "Admin"] },
    { title: "Time Management", icon: <AccessTime />, path: "/Dashboard/TimeManagement" },
    { title: "Apply Leave", icon: <EventAvailable />, path: "/Dashboard/AddLeaves" },
    { title: "Comp-Off", icon: <Assignment />, path: "/Dashboard/CompOff" },
  ];

  const settingsItems = [
    { title: "Updates", path: "/Dashboard/Settings" },
    { title: "Discipline", path: "/Dashboard/Discipline" },
    { title: "Designation", path: "/Dashboard/Designation" },
    { title: "Area of Work", path: "/Dashboard/Areaofwork" },
    { title: "Variation", path: "/Dashboard/Variations" },
  ];

  const hasRole = (requiredRoles) => {
    if (!requiredRoles || !Array.isArray(requiredRoles)) return true;
    if (!normalizedRoles || normalizedRoles.length === 0) return false;
    return requiredRoles.some((role) => 
      normalizedRoles.some((userRole) => 
        userRole?.trim().toLowerCase() === role?.trim().toLowerCase()
      )
    );
  };

  const isAdmin = () => hasRole(["Admin"]);
  const isTL = () => hasRole(["TL", "teamLead"]);
  const isHR = () => hasRole(["HR"]);

  const renderMenuItem = (item) => {
    if (item.roles && !hasRole(item.roles)) return null;

    const isActive = location.pathname === item.path;
    const isComingSoon = item.comingSoon;
    
    return (
      <ListItem key={item.path || item.title} disablePadding>
        <ListItemButton
          component={isComingSoon ? "div" : Link}
          to={isComingSoon ? undefined : item.path}
          selected={isActive}
          disabled={isComingSoon}
          onClick={isComingSoon ? (e) => e.preventDefault() : undefined}
          sx={{
            mb: 0.5,
            mx: 1,
            borderRadius: 2,
            opacity: isComingSoon ? 0.6 : 1,
            cursor: isComingSoon ? "not-allowed" : "pointer",
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
              bgcolor: isComingSoon ? "transparent" : "action.hover",
              transform: isComingSoon ? "none" : "translateX(5px)",
            },
            transition: "all 0.3s ease",
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: isActive ? "white" : "inherit" }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span>{item.title}</span>
                {isComingSoon && (
                  <Chip
                    label="Coming Soon"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: "0.65rem",
                      bgcolor: "warning.light",
                      color: "warning.contrastText",
                    }}
                  />
                )}
              </Box>
            }
            primaryTypographyProps={{
              fontSize: "0.95rem",
              fontWeight: isActive ? 600 : 400,
            }}
          />
        </ListItemButton>
      </ListItem>
    );
  };

  const renderNestedMenu = (title, icon, items, menuKey) => {
    const isOpen = openMenus[menuKey];
    const hasActiveItem = items.some((item) => location.pathname === item.path);

    return (
      <>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleMenuToggle(menuKey)}
            sx={{
              mb: 0.5,
              mx: 1,
              borderRadius: 2,
              bgcolor: hasActiveItem ? "action.selected" : "transparent",
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
            <ListItemText primary={title} />
            {isOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={isActive}
                    sx={{
                      pl: 4,
                      mb: 0.5,
                      mx: 1,
                      borderRadius: 2,
                      "&.Mui-selected": {
                        bgcolor: "primary.light",
                        color: "white",
                        "&:hover": {
                          bgcolor: "primary.main",
                        },
                      },
                    }}
                  >
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{
                        fontSize: "0.9rem",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Collapse>
      </>
    );
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo Section */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <Box
          component="img"
          src={`${config.baseUrl}/src/assets/logo.png`}
          alt="Logo"
          sx={{ width: 50, height: 50, borderRadius: 1 }}
        />
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Time Sheet
          </Typography>
          <Typography variant="caption">Management System</Typography>
        </Box>
      </Box>

      <Divider />

      {/* User Info */}
      {user && (
        <Box sx={{ p: 2, bgcolor: "grey.50" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
              {user.employeeName?.charAt(0) || "U"}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight="bold" noWrap>
                {user.employeeName || "User"}
              </Typography>
              <Chip
                label={normalizedRoles?.[0] || "User"}
                size="small"
                sx={{ height: 20, fontSize: "0.7rem", mt: 0.5 }}
                color="primary"
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>
      )}

      <Divider />

      {/* Menu Items */}
      <Box sx={{ flex: 1, overflow: "auto", py: 1 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        ) : (
          <List>
            {isAdmin() && (
            <>
              <Typography variant="overline" sx={{ px: 2, py: 1, color: "text.secondary", fontSize: "0.75rem" }}>
                Main Menu
              </Typography>
              {menuItems.map((item) => hasRole(item.roles) && renderMenuItem(item))}

              <Divider sx={{ my: 1 }} />

              <Typography variant="overline" sx={{ px: 2, py: 1, color: "text.secondary", fontSize: "0.75rem" }}>
                Phase 1 & 2 Features ✅
              </Typography>
              {phase1Phase2Items.map((item) => renderMenuItem(item))}

              <Divider sx={{ my: 1 }} />

              {renderNestedMenu("Approvals", <CheckCircle />, approvalItems, "approvals")}
              {renderNestedMenu("Reports", <Assessment />, reportItems, "reports")}
              {isAdmin() && renderNestedMenu("Settings", <Settings />, settingsItems, "settings")}

              <Divider sx={{ my: 1 }} />

              <Typography variant="overline" sx={{ px: 2, py: 1, color: "text.secondary", fontSize: "0.75rem" }}>
                Phase 3 - Coming Soon 🚀
              </Typography>
              {comingSoonItems.map((item) => renderMenuItem(item))}
            </>
          )}

            {(isTL() || isAdmin()) && (
              <>
                <Typography variant="overline" sx={{ px: 2, py: 1, color: "text.secondary", fontSize: "0.75rem" }}>
                  Team Lead
                </Typography>
                {commonItems
                  .filter((item) => !item.roles || hasRole(item.roles))
                  .map((item) => renderMenuItem(item))}
              </>
            )}

            <Divider sx={{ my: 1 }} />

            <Typography variant="overline" sx={{ px: 2, py: 1, color: "text.secondary", fontSize: "0.75rem" }}>
              Common
            </Typography>
            {commonItems
              .filter((item) => !item.roles || hasRole(item.roles))
              .map((item) => renderMenuItem(item))}
          </List>
        )}
      </Box>

      <Divider />

      {/* Logout */}
      <Box sx={{ p: 1 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            mx: 1,
            color: "error.main",
            "&:hover": {
              bgcolor: "error.light",
              color: "white",
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
            <Logout />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* App Bar for Mobile */}
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
              Time Sheet Management
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar Drawer */}
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

      {/* Main Content */}
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

export default Dashboard;
