import React, { useState, useMemo } from "react";
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
  Collapse,
  Divider,
  alpha,
  Chip,
} from "@mui/material";
import {
  Logout,
  Menu,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/api";
import { useApi } from "../hooks/useApi";
import commonData from "../../common.json";
import config from "../config/index.js";

import {
  Dashboard as DashboardIcon,
  People,
  Business,
  Settings,
  Assessment,
  Schedule,
  EventAvailable,
  WorkHistory,
  Payments,
  AccountBalance,
  TrendingUp,
  CheckCircle,
  AccessTime,
  Assignment,
  Person,
  AccountTree,
  LocationOn,
  Face,
  PhoneAndroid,
  Email,
  Notifications,
} from "@mui/icons-material";

// Icon mapping for menu items
const iconMap = {
  Dashboard: DashboardIcon,
  People: People,
  Business: Business,
  Settings: Settings,
  Assessment: Assessment,
  Schedule: Schedule,
  EventAvailable: EventAvailable,
  WorkHistory: WorkHistory,
  Payments: Payments,
  AccountBalance: AccountBalance,
  TrendingUp: TrendingUp,
  CheckCircle: CheckCircle,
  AccessTime: AccessTime,
  Assignment: Assignment,
  Person: Person,
  AccountTree: AccountTree,
  LocationOn: LocationOn,
  Face: Face,
  PhoneAndroid: PhoneAndroid,
  Email: Email,
  Notifications: Notifications,
};

const CommonSidebar = ({ 
  drawerWidth = 280, 
  dashboardTitle = "Dashboard",
  basePath = "/Dashboard" 
}) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const { logout, roles, user } = useAuth();

  // Fetch menu permissions from database
  const { data: menuPermissionsData, loading: permissionsLoading } = useApi(
    () => apiService.getMenuPermissions(),
    []
  );

  // Normalize roles - ensure consistent case matching
  const normalizedRoles = useMemo(() => {
    if (!roles || !Array.isArray(roles)) return [];
    // Normalize to lowercase for comparison, but also handle case variations
    return roles
      .map(role => {
        const trimmed = role?.trim();
        if (!trimmed) return null;
        // Normalize common role variations
        const lower = trimmed.toLowerCase();
        if (lower === 'hr') return 'hr';
        if (lower === 'tl' || lower === 'teamlead') return 'tl';
        if (lower === 'admin') return 'admin';
        if (lower === 'employee') return 'employee';
        return lower;
      })
      .filter(Boolean);
  }, [roles]);

  // Create menu permissions map
  const menuPermissionsMap = useMemo(() => {
    if (!menuPermissionsData) return {};
    const data = Array.isArray(menuPermissionsData) 
      ? menuPermissionsData 
      : menuPermissionsData?.Result || [];
    
    const map = {};
    data.forEach((item) => {
      if (item.is_active) {
        let allowedRoles = [];
        try {
          if (Array.isArray(item.allowed_roles)) {
            allowedRoles = item.allowed_roles.map(r => r?.trim()?.toLowerCase());
          } else if (typeof item.allowed_roles === 'string') {
            allowedRoles = JSON.parse(item.allowed_roles).map(r => r?.trim()?.toLowerCase());
          }
        } catch (e) {
          console.error('Error parsing allowed_roles:', e);
        }
        if (item.menu_path) {
          map[item.menu_path] = {
            allowed_roles: allowedRoles,
            is_active: item.is_active,
            menu_key: item.menu_key,
            menu_title: item.menu_title,
            menu_icon: item.menu_icon,
            parent_menu: item.parent_menu,
            display_order: item.display_order || 0,
          };
        }
        if (item.menu_key) {
          map[item.menu_key] = {
            allowed_roles: allowedRoles,
            is_active: item.is_active,
            menu_path: item.menu_path,
            menu_title: item.menu_title,
            menu_icon: item.menu_icon,
            parent_menu: item.parent_menu,
            display_order: item.display_order || 0,
          };
        }
      }
    });
    return map;
  }, [menuPermissionsData]);

  // Check if user has permission for a menu item
  const hasPermission = (menuPath, menuKey) => {
    const perm = menuPermissionsMap[menuPath] || menuPermissionsMap[menuKey];
    if (!perm || !perm.is_active) return false;
    
    // If no roles specified, deny access
    if (!perm.allowed_roles || perm.allowed_roles.length === 0) return false;
    
    // If user has no roles, deny access
    if (!normalizedRoles || normalizedRoles.length === 0) return false;
    
    // Check if any of user's roles match allowed roles (case-insensitive)
    const hasAccess = normalizedRoles.some(userRole => 
      perm.allowed_roles.some(allowedRole => 
        userRole === allowedRole?.toLowerCase()
      )
    );
    
    return hasAccess;
  };

  // Build menu structure from permissions
  // Menu items should remain stable regardless of current location
  const menuItems = useMemo(() => {
    if (!menuPermissionsData || permissionsLoading) return { rootItems: [], grouped: {} };
    
    const data = Array.isArray(menuPermissionsData) 
      ? menuPermissionsData 
      : menuPermissionsData?.Result || [];
    
    // Common menu path mappings - map Dashboard paths to current base path
    const getMappedPath = (originalPath) => {
      // If path already matches basePath, return as is
      if (originalPath.startsWith(basePath)) {
        return originalPath;
      }
      
      // Map Dashboard paths to current base path
      const pathMappings = {
        // Common menus
        '/Dashboard/TimeManagement': basePath + '/TimeManagement',
        '/Dashboard/AddLeaves': basePath + '/AddLeaves',
        '/Dashboard/CompOff': basePath + '/CompOff',
        '/Dashboard/Profile': basePath + '/Profile',
        '/Dashboard/EmployeeHome': basePath.replace('/Hr', '/Employee').replace('/TeamLead', '/Employee').replace('/Dashboard', '/Employee') + '/EmployeeHome',
        
        // HR-specific mappings - only map routes that actually exist in App.jsx
        '/Dashboard/LeaveBalance': basePath === '/Hr' ? '/Hr/LeaveBalance' : originalPath,
        '/Dashboard/employee': basePath === '/Hr' ? '/Hr/employee' : originalPath,
        '/Dashboard/Settings': basePath === '/Hr' ? '/Hr/Settings' : originalPath,
        // Note: HR doesn't have /Hr/Overtime, /Hr/Shifts, /Hr/Payroll routes
        // So these should stay as Dashboard routes or be filtered out
        '/Dashboard/Overtime': basePath === '/Hr' ? '/Dashboard/Overtime' : basePath === '/TeamLead' ? '/TeamLead/OvertimeManagement' : originalPath,
        '/Dashboard/Shifts': basePath === '/Hr' ? '/Dashboard/Shifts' : originalPath,
        '/Dashboard/Payroll': basePath === '/Hr' ? '/Dashboard/Payroll' : originalPath,
        '/Dashboard/Billing': basePath === '/Hr' ? '/Dashboard/Billing' : originalPath,
        '/Dashboard/Budget': basePath === '/Hr' ? '/Dashboard/Budget' : originalPath,
        '/Dashboard/Productivity': basePath === '/Hr' ? '/Dashboard/Productivity' : originalPath,
        '/Dashboard/Approvals': basePath === '/Hr' ? '/Dashboard/Approvals' : originalPath,
      };
      
      return pathMappings[originalPath] || originalPath;
    };
    
    // Filter and sort menu items
    const items = data
      .filter(item => {
        if (!item.is_active) return false;
        if (!item.menu_path) return false;
        
        // Define feature menu keys that should be shown for HR even if they use Dashboard routes
        const featureMenuKeys = [
          'overtime_management',
          'leave_balance',
          'shift_management',
          'payroll_export',
          'billing_invoicing',
          'budget_tracking',
          'productivity',
          'approval_center',
          'automated_reports'
        ];
        
        // Check if path starts with basePath (direct match)
        if (item.menu_path.startsWith(basePath)) {
          return hasPermission(item.menu_path, item.menu_key);
        }
        
        // Check common menus that can be mapped to current base path
        const mappedPath = getMappedPath(item.menu_path);
        
        // If mapped path starts with basePath, include it
        if (mappedPath.startsWith(basePath)) {
          return hasPermission(item.menu_path, item.menu_key);
        }
        
        // For non-Admin roles (HR, TeamLead, Employee): Allow Dashboard feature routes
        // This handles features that don't have role-specific routes but user has permission
        // Only allow if user is not on Admin dashboard (basePath !== '/Dashboard')
        if (basePath !== '/Dashboard' && item.menu_path.startsWith('/Dashboard/')) {
          // Check if it's a feature menu item by menu_key first
          if (featureMenuKeys.includes(item.menu_key)) {
            // Check permission - if user has permission, include it
            return hasPermission(item.menu_path, item.menu_key);
          }
          
          // Also check by path patterns for features (fallback)
          const dashboardFeaturePaths = [
            '/Dashboard/Overtime',
            '/Dashboard/LeaveBalance',
            '/Dashboard/Shifts', 
            '/Dashboard/Payroll',
            '/Dashboard/Billing',
            '/Dashboard/Budget',
            '/Dashboard/Productivity',
            '/Dashboard/Approvals',
            '/Dashboard/Reports'
          ];
          
          if (dashboardFeaturePaths.some(feature => item.menu_path.startsWith(feature))) {
            // Check permission - if user has permission, include it
            return hasPermission(item.menu_path, item.menu_key);
          }
        }
        
        return false;
      })
      .map(item => {
        // Map menu paths to current base path for routing
        // But keep original path for permission checking
        let menuPath = item.menu_path;
        if (!menuPath.startsWith(basePath)) {
          menuPath = getMappedPath(item.menu_path);
        }
        
        // For non-Admin roles, if the mapped path is still Dashboard (features without role-specific routes),
        // keep it as Dashboard path so it routes correctly
        if (basePath !== '/Dashboard' && menuPath.startsWith('/Dashboard/')) {
          // Keep Dashboard path for features that don't have role-specific routes
          menuPath = item.menu_path;
        }
        
        return {
          ...item,
          menu_path: menuPath, // Mapped path for routing
          original_path: item.menu_path, // Keep original for reference
          display_order: item.display_order || 999,
        };
      })
      .sort((a, b) => {
        // Sort by parent_menu (null first), then by display_order
        if (a.parent_menu !== b.parent_menu) {
          if (!a.parent_menu) return -1;
          if (!b.parent_menu) return 1;
          return a.parent_menu.localeCompare(b.parent_menu);
        }
        return a.display_order - b.display_order;
      });

    // Group by parent_menu
    const grouped = {};
    const rootItems = [];
    const parentMenuKeys = new Set();
    
    // First pass: identify parent menu keys and group children
    items.forEach(item => {
      if (item.parent_menu) {
        parentMenuKeys.add(item.parent_menu);
        if (!grouped[item.parent_menu]) {
          grouped[item.parent_menu] = [];
        }
        grouped[item.parent_menu].push(item);
      }
    });
    
    // Second pass: add root items (items without parent_menu OR items that are parents themselves)
    items.forEach(item => {
      if (!item.parent_menu) {
        // Check if this item is a parent menu (has children)
        if (parentMenuKeys.has(item.menu_key)) {
          // This is a parent menu item, add it to rootItems
          rootItems.push(item);
        } else {
          // Regular root item
          rootItems.push(item);
        }
      }
    });

    return { rootItems, grouped };
  }, [menuPermissionsData, permissionsLoading, basePath, menuPermissionsMap, normalizedRoles]);

  const handleMenuToggle = (menuKey) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getIcon = (iconName) => {
    if (!iconName) return null;
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent /> : null;
  };

  const renderMenuItem = (item, level = 0) => {
    const isActive = location.pathname === item.menu_path || 
                     location.pathname.startsWith(item.menu_path + '/');
    const hasChildren = menuItems.grouped[item.menu_key]?.length > 0;
    const isOpen = openMenus[item.menu_key];
    const hasActiveChild = hasChildren && menuItems.grouped[item.menu_key]?.some(
      child => location.pathname === child.menu_path || location.pathname.startsWith(child.menu_path + '/')
    );

    return (
      <React.Fragment key={item.menu_key || item.menu_path}>
        <ListItem disablePadding sx={{ mb: 0.5, px: 1.5 }}>
          <ListItemButton
            component={hasChildren ? 'div' : Link}
            to={hasChildren ? undefined : item.menu_path}
            onClick={hasChildren ? () => handleMenuToggle(item.menu_key) : undefined}
            selected={isActive && !hasChildren}
            sx={{
              borderRadius: 3,
              minHeight: 48,
              px: 2,
              py: 1.25,
              pl: 2 + level * 2,
              bgcolor: hasActiveChild ? alpha(theme.palette.primary.main, 0.08) : "transparent",
              "&.Mui-selected": {
                background: "linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)",
                color: "primary.main",
                "&:hover": {
                  background: "linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)",
                },
                "& .MuiListItemIcon-root": {
                  color: "primary.main",
                },
              },
              "&:hover": {
                bgcolor: hasActiveChild 
                  ? alpha(theme.palette.primary.main, 0.12)
                  : "action.hover",
                transform: "translateX(4px)",
              },
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <ListItemIcon 
              sx={{ 
                minWidth: 44,
                color: (isActive && !hasChildren) || hasActiveChild ? "primary.main" : "text.secondary",
              }}
            >
              {getIcon(item.menu_icon) || <Menu />}
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: (isActive && !hasChildren) || hasActiveChild ? 600 : 500,
                    fontSize: "0.875rem",
                    color: (isActive && !hasChildren) || hasActiveChild ? "primary.main" : "text.primary",
                  }}
                >
                  {item.menu_title}
                </Typography>
              }
            />
            {hasChildren && (
              <Box
                sx={{
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                  color: "text.secondary",
                }}
              >
                {isOpen ? <ExpandLess /> : <ExpandMore />}
              </Box>
            )}
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 2 }}>
              {menuItems.grouped[item.menu_key].map(child => 
                renderMenuItem(child, level + 1)
              )}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo Section - Match Admin Dashboard */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: alpha("#fff", 0.1),
          },
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: -30,
            left: -30,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: alpha("#fff", 0.08),
          },
        }}
      >
        <Box
          component="img"
          src={`${config?.baseUrl || commonData?.BASEURL}/src/assets/logo.png`}
          alt="Logo"
          sx={{ 
            width: 56, 
            height: 56, 
            borderRadius: 2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1,
          }}
        />
        <Box sx={{ zIndex: 1 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ fontSize: "1.25rem" }}>
            Time Sheet
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9, fontSize: "0.75rem" }}>
            Management System
          </Typography>
        </Box>
      </Box>

      {/* User Info - Match Admin Dashboard */}
      {user && (
        <Box
          sx={{ 
            p: 2.5, 
            mx: 1.5,
            mt: 2,
            mb: 1,
            borderRadius: 3,
            background: "linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar 
              sx={{ 
                bgcolor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                width: 48, 
                height: 48,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                fontSize: "1.25rem",
                fontWeight: 600,
              }}
            >
              {user.employeeName?.charAt(0) || user.name?.charAt(0) || user.userName?.charAt(0) || "U"}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="subtitle2" 
                fontWeight="bold" 
                noWrap
                sx={{ 
                  fontSize: "0.875rem",
                  color: "text.primary",
                  mb: 0.25,
                }}
              >
                {user.employeeName || user.name || user.userName || "User"}
              </Typography>
              <Chip
                label={normalizedRoles?.[0] || "User"}
                size="small"
                sx={{ 
                  height: 22, 
                  fontSize: "0.7rem", 
                  fontWeight: 600,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: "primary.main",
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              />
            </Box>
          </Box>
        </Box>
      )}

      <Divider sx={{ my: 1.5, mx: 2 }} />
      {/* Menu Items - Match Admin Dashboard structure */}
      <Box 
        sx={{ 
          flex: 1, 
          overflow: "auto", 
          py: 1,
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: alpha(theme.palette.primary.main, 0.2),
            borderRadius: "3px",
            "&:hover": {
              background: alpha(theme.palette.primary.main, 0.3),
            },
          },
        }}
      >
        {permissionsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        ) : menuItems.rootItems && menuItems.rootItems.length > 0 ? (
          <List sx={{ px: 0.5 }}>
            {(() => {
              // Separate items into categories based on menu_key patterns
              // Use menu_key to categorize, not path, so items stay in correct category even when path changes
              const mainMenuItems = menuItems.rootItems.filter(item => 
                ['dashboard', 'manage_employees', 'manage_projects', 'project_planning'].includes(item.menu_key)
              );
              // Feature items - check by menu_key first, then by path as fallback
              const featureItems = menuItems.rootItems.filter(item => {
                const featureMenuKeys = [
                  'overtime_management', 
                  'leave_balance', 
                  'shift_management', 
                  'payroll_export', 
                  'billing_invoicing', 
                  'budget_tracking', 
                  'productivity', 
                  'approval_center', 
                  'automated_reports'
                ];
                
                // Check by menu_key
                if (featureMenuKeys.includes(item.menu_key)) {
                  return true;
                }
                
                // Fallback: check by path pattern for Dashboard features
                const featurePaths = [
                  '/Dashboard/Overtime',
                  '/Dashboard/LeaveBalance',
                  '/Dashboard/Shifts',
                  '/Dashboard/Payroll',
                  '/Dashboard/Billing',
                  '/Dashboard/Budget',
                  '/Dashboard/Productivity',
                  '/Dashboard/Approvals',
                  '/Dashboard/Reports'
                ];
                
                return featurePaths.some(path => 
                  item.menu_path?.startsWith(path) || item.original_path?.startsWith(path)
                );
              });
              const commonItems = menuItems.rootItems.filter(item => 
                ['time_management', 'apply_leave', 'compoff', 'employee_dashboard', 
                 'teamlead_dashboard', 'project_work_details'].includes(item.menu_key)
              );
              // Get parent menu items (items that have children) - for nested menus
              const nestedMenuItems = menuItems.rootItems.filter(item => {
                const hasChildren = menuItems.grouped[item.menu_key]?.length > 0;
                const isInCategory = mainMenuItems.includes(item) || 
                                    featureItems.includes(item) || 
                                    commonItems.includes(item);
                return hasChildren && !isInCategory;
              });
              
              // Sort nested menus: Approvals, Reports, Settings
              nestedMenuItems.sort((a, b) => {
                const order = { 'approval_center': 1, 'reports': 2, 'settings': 3 };
                const aOrder = order[a.menu_key] || 999;
                const bOrder = order[b.menu_key] || 999;
                return aOrder - bOrder;
              });

              return (
                <>
                  {/* MAIN MENU Section - Only show if has items */}
                  {mainMenuItems.length > 0 && (
                    <>
                      <Box sx={{ px: 2, py: 1.5, mb: 0.5 }}>
                        <Typography 
                          variant="overline" 
                          sx={{ 
                            color: "text.secondary", 
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                          }}
                        >
                          Main Menu
                        </Typography>
                      </Box>
                      {mainMenuItems.map(item => renderMenuItem(item))}
                      <Divider sx={{ my: 1.5, mx: 2 }} />
                    </>
                  )}

                  {/* FEATURES Section - Only show if has items */}
                  {featureItems.length > 0 && (
                    <>
                      <Box sx={{ px: 2, py: 1.5, mb: 0.5 }}>
                        <Typography 
                          variant="overline" 
                          sx={{ 
                            color: "text.secondary", 
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                          }}
                        >
                          Features ✅
                        </Typography>
                      </Box>
                      {featureItems.map(item => renderMenuItem(item))}
                      <Divider sx={{ my: 1.5, mx: 2 }} />
                    </>
                  )}

                  {/* Nested Menus (Approvals, Reports, Settings) */}
                  {nestedMenuItems.map(parentItem => (
                    <React.Fragment key={parentItem.menu_key}>
                      {renderMenuItem(parentItem)}
                    </React.Fragment>
                  ))}
                  
                  {/* Add divider before Common section if there are nested menus */}
                  {nestedMenuItems.length > 0 && commonItems.length > 0 && (
                    <Divider sx={{ my: 1.5, mx: 2 }} />
                  )}

                  {/* Common Items Section - Always show if has items */}
                  {commonItems.length > 0 && (
                    <>
                      <Box sx={{ px: 2, py: 1.5, mb: 0.5 }}>
                        <Typography 
                          variant="overline" 
                          sx={{ 
                            color: "text.secondary", 
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                          }}
                        >
                          Common
                        </Typography>
                      </Box>
                      {commonItems.map(item => renderMenuItem(item))}
                    </>
                  )}
                </>
              );
            })()}
          </List>
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No menu items available
            </Typography>
          </Box>
        )}
      </Box>
      <Divider sx={{ my: 1.5, mx: 2 }} />

      {/* Logout - Match Admin Dashboard */}
      <Box sx={{ p: 1.5, px: 2 }}>
        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: 3,
            minHeight: 48,
            px: 2,
            py: 1.25,
            color: "error.main",
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            background: alpha(theme.palette.error.main, 0.05),
            "&:hover": {
              bgcolor: alpha(theme.palette.error.main, 0.1),
              borderColor: alpha(theme.palette.error.main, 0.3),
              transform: "translateY(-2px)",
              boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.2)}`,
            },
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <ListItemIcon sx={{ minWidth: 44, color: "inherit" }}>
            <Logout />
          </ListItemIcon>
          <ListItemText 
            primary={
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Logout
              </Typography>
            }
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
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
              {dashboardTitle}
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
    </>
  );
};

export default CommonSidebar;

