import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
  Button,
  Stack,
  Paper,
  Popover,
  MenuList,
  MenuItem,
  ListSubheader,
} from "@mui/material";
import {
  Logout,
  Menu,
  ExpandLess,
  ExpandMore,
  PlayArrow,
  MenuBook,
  KeyboardArrowDown,
  ViewList,
  MoreHoriz,
  OpenInNew,
  PendingActions,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/api";
import { useApi } from "../hooks/useApi";
import { commonData } from "../config";
import config from "../config/index.js";
import logoImage from "../assets/logo.png";
import { useAppTheme } from "../context/AppThemeContext";
import { useGuidanceTourOptional } from "../context/GuidanceTourContext";
import { useTranslation } from "react-i18next";

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
  CalendarToday,
  Savings,
} from "@mui/icons-material";

const FALLBACK_SIDEBAR_BG = "#101835";
const FALLBACK_SIDEBAR_TEXT = "#FFFFFF";
const MOBILE_DRAWER_WIDTH = 280;
const DEFAULT_RAIL_WIDTH = 104;
const TOP_BAR_HEIGHT = 64;

function localeTagFromAppSettings(language, dateFormat) {
  const lang = String(language || "").trim();
  if (lang && lang.length === 2 && /^[a-z]{2}$/i.test(lang)) return lang;
  if (lang && lang.includes("-")) return lang;
  const df = String(dateFormat || "").toUpperCase();
  if (df.includes("DD/MM")) return "en-GB";
  if (df.includes("MM/DD")) return "en-US";
  if (df.includes("YYYY-MM") || /YYYY.*MM.*DD/i.test(df)) return "en-CA";
  return undefined;
}

/** Format live clock for staff top bar using App Settings (time_format, date_format, language). */
function formatTopBarDateTime(date, prefs) {
  const p = prefs || {};
  const tf = String(p.time_format || "24h").toLowerCase();
  const hour12 = tf === "12h" || tf === "12" || tf.includes("12");
  const loc = localeTagFromAppSettings(p.language, p.date_format);
  const opts = {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12,
  };
  try {
    return new Intl.DateTimeFormat(loc, opts).format(date);
  } catch {
    return date.toLocaleString(undefined, opts);
  }
}

/** Synthetic popover key: one "More" rail slot for multiple bottom-group items */
const RAIL_OVERFLOW_POPOVER_KEY = "__rail_overflow__";

/** Root menu keys that share the bottom rail "More" flyout (with reports / automation). */
const RAIL_BOTTOM_MENU_KEYS = new Set([
  "reports",
  "automation",
  "settings",
  "payroll_finance",
  "approvals",
  "productivity_tracking",
]);

/** Only move last two roots to the bottom section when there are many roots (avoid "Dashboard + More" for users with few menus). */
const RAIL_MIN_ROOTS_FOR_LAST_TWO_SPLIT = 9;
/** Single "More" flyout only when 3+ items land in the bottom group; otherwise show each icon on the rail. */
const RAIL_MIN_BOTTOM_FOR_OVERFLOW_CLUSTER = 3;

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
  CalendarToday: CalendarToday,
  List: ViewList,
  Savings: Savings,
  PendingActions: PendingActions,
};

/** When `menu_icon` is null in DB, infer icon from `menu_key` */
const MENU_KEY_FALLBACK_ICONS = {
  employee_report: Assessment,
  project_report: Assessment,
  weekly_report: Assessment,
  monthly_report: Assessment,
  yearly_report: Assessment,
  leave_report: Assessment,
  discipline_report: Assessment,
  consolidated_report: Assessment,
  automated_reports: Email,
  settings_updates: Settings,
  settings_discipline: Settings,
  settings_designation: Settings,
  settings_roles: Settings,
  settings_areaofwork: Settings,
  settings_variation: Settings,
  menu_permissions: Settings,
  settings_overtime_rules: Settings,
  settings_app_settings: Settings,
  leave_details: EventAvailable,
  compoff_details: Assignment,
};

/**
 * Many menu rows reuse the same menu_path (e.g. /Dashboard/EmployeeHome). Only one should look "active".
 * Prefer leaf items (no submenu children) over parent rows, then lowest display_order.
 */
function resolveActiveMenuKey(pathname, flatItems, grouped) {
  if (!flatItems?.length) return null;
  const exactItems = flatItems.filter((i) => i.menu_path && pathname === i.menu_path);
  if (exactItems.length === 1) return exactItems[0].menu_key;
  if (exactItems.length > 1) {
    const leaves = exactItems.filter((i) => !(grouped[i.menu_key]?.length > 0));
    const pool = leaves.length > 0 ? leaves : exactItems;
    pool.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    return pool[0].menu_key;
  }
  const prefixItems = flatItems.filter(
    (i) => i.menu_path && i.menu_path.length > 1 && pathname.startsWith(`${i.menu_path}/`)
  );
  if (!prefixItems.length) return null;
  prefixItems.sort((a, b) => (b.menu_path?.length || 0) - (a.menu_path?.length || 0));
  return prefixItems[0].menu_key;
}

function subtreeContainsActive(menuKey, activeKey, grouped) {
  if (!activeKey) return false;
  for (const c of grouped[menuKey] || []) {
    if (c.menu_key === activeKey) return true;
    if (subtreeContainsActive(c.menu_key, activeKey, grouped)) return true;
  }
  return false;
}

const CommonSidebar = ({ 
  drawerWidth = DEFAULT_RAIL_WIDTH, 
  dashboardTitle = "Dashboard",
  basePath = "/Dashboard" 
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isRailLayout = !isMobile && drawerWidth <= 140;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [railPopover, setRailPopover] = useState({ key: null, anchor: null });
  const menuScrollRef = useRef(null);
  const [menuScrollDownHint, setMenuScrollDownHint] = useState(false);
  const { logout, roles, user, isCompanyAdmin, isAdmin, isTeamLead, isEmployee, isHR } = useAuth();
  const { logoUrl, colors: themeColors, localePrefs } = useAppTheme();
  const sidebarBg = themeColors?.sidebarBg || FALLBACK_SIDEBAR_BG;
  const sidebarText = themeColors?.sidebarText || FALLBACK_SIDEBAR_TEXT;
  const railActive = themeColors?.primary || "#4C86F9";
  const logoSrc = logoUrl || logoImage;
  const tour = useGuidanceTourOptional();

  // Fetch menu permissions for logged-in employee (filtered by role and employee-specific permissions)
  const { data: menuPermissionsData, loading: permissionsLoading } = useApi(
    () => apiService.getMenuPermissionsByEmployee(),
    []
  );

  // Fetch trail version status for admin (show "Working with trail version" tag when true)
  const isAdminDashboard = basePath === "/Dashboard";
  const { data: trailCheckData, loading: trailCheckLoading } = useApi(
    () => (isAdminDashboard ? apiService.getAdminTrailVersionCheck() : Promise.resolve({ data: { Status: "Success", Result: {} } })),
    [isAdminDashboard]
  );
  // Support multiple response shapes (Result wrapper or raw payload); normalize booleans (1/0 from DB)
  const trailResult = useMemo(() => {
    const raw = trailCheckData?.Result ?? trailCheckData?.data ?? trailCheckData;
    if (!raw || typeof raw !== "object") return {};
    return {
      ...raw,
      isTrial: raw.isTrial === true || raw.isTrial === 1,
      allowed: raw.allowed === true || raw.allowed === 1,
      expired: raw.expired === true || raw.expired === 1,
    };
  }, [trailCheckData]);
  const isTrailVersion = trailResult.isTrial === true || trailResult.allowed === true;
  // Days left and expiry date from trail version
  const trailDaysLeft = useMemo(() => {
    if (!isTrailVersion || trailResult.expired) return null;
    const exp = trailResult.trialExpiresAt;
    if (!exp) return trailResult.trialDaysTotal != null ? Math.max(0, (trailResult.trialDaysTotal || 0) - (trailResult.trialDaysUsed || 0)) : null;
    const expiresAt = new Date(exp);
    const now = new Date();
    if (expiresAt <= now) return 0;
    return Math.max(0, Math.ceil((expiresAt - now) / 86400000));
  }, [isTrailVersion, trailResult.expired, trailResult.trialExpiresAt, trailResult.trialDaysTotal, trailResult.trialDaysUsed]);
  const trailExpiresAtFormatted = useMemo(() => {
    const exp = trailResult.trialExpiresAt;
    if (!exp) return null;
    return new Date(exp).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }, [trailResult.trialExpiresAt]);

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

  /** Sidebar chip: for company portal, prefer actual menu role over generic "Company user" */
  const displayRoleChipLabel = useMemo(() => {
    if (user?.isCompanyUser && user?.employee_table_role) {
      return user.employee_table_role;
    }
    if (user?.isCompanyUser && user?.company_menu_role) {
      return user.company_menu_role;
    }
    if (user?.isCompanyUser) {
      const explicitRole = (roles || []).find((r) => {
        const n = String(r || "").trim().toLowerCase();
        return n && n !== "company_user" && n !== "company_admin" && n !== "admin";
      });
      if (explicitRole) return explicitRole;
    }
    if (user?.isCompanyUser && user?.company_role) {
      const cr = String(user.company_role).toLowerCase();
      if (cr === "company_admin") return t("role.companyAdmin", { defaultValue: "Company admin" });
      if (cr === "company_user") return t("role.companyUser", { defaultValue: "Company user" });
      return user.company_role;
    }
    const r = normalizedRoles?.[0];
    if (!r) return t("role.user", { defaultValue: "User" });
    const map = {
      admin: t("role.admin", { defaultValue: "Admin" }),
      hr: t("role.hr", { defaultValue: "HR" }),
      tl: t("role.tl", { defaultValue: "TL" }),
      teamlead: t("role.tl", { defaultValue: "TL" }),
      employee: t("role.employee", { defaultValue: "Employee" }),
    };
    const key = String(r).toLowerCase();
    return map[key] || (String(r).charAt(0).toUpperCase() + String(r).slice(1));
  }, [user, roles, normalizedRoles]);

  const approvalsPath =
    basePath === "/TeamLead" ? "/TeamLead/Approvals" : "/Dashboard/Approvals";
  const showTopBarApprovals =
    (isAdmin() || isTeamLead()) && (basePath === "/Dashboard" || basePath === "/TeamLead");
  /** Company staff (e.g. Sales) are not `isEmployee()` but should see the clock instead of "Admin Dashboard". */
  const isCompanyNonAdminStaff =
    Boolean(user?.isCompanyUser) &&
    String(user?.company_role || "").toLowerCase() !== "company_admin";
  const showTopBarEmployeeDateTime =
    !isAdmin() && !isTeamLead() && !isHR() && (isEmployee() || isCompanyNonAdminStaff);

  const [topBarNow, setTopBarNow] = useState(() => new Date());
  useEffect(() => {
    if (!showTopBarEmployeeDateTime) return undefined;
    const id = setInterval(() => setTopBarNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [showTopBarEmployeeDateTime]);

  const topBarTitleDateTime = useMemo(
    () => formatTopBarDateTime(topBarNow, localePrefs),
    [topBarNow, localePrefs]
  );

  /** menu_permissions.is_active may be 0 while Super Admin still enabled the menu for the company — company API only returns allowed rows */
  const isMenuPermissionRowVisible = useCallback((item) => {
    if (user?.isCompanyUser) return true;
    return (
      item.is_active === true ||
      item.is_active === 1 ||
      item.is_active === "1"
    );
  }, [user?.isCompanyUser]);

  // Create menu permissions map
  const menuPermissionsMap = useMemo(() => {
    if (!menuPermissionsData) return {};
    const data = Array.isArray(menuPermissionsData) 
      ? menuPermissionsData 
      : menuPermissionsData?.Result || [];
    
    const map = {};
    data.forEach((item) => {
      if (isMenuPermissionRowVisible(item)) {
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
  }, [menuPermissionsData, isMenuPermissionRowVisible]);

  // Check if user has permission for a menu item
  // Since we're using getMenuPermissionsByEmployee, all returned menus are already filtered
  // So if a menu is in the data, the user has permission to view it
  const hasPermission = (menuPath, menuKey) => {
    const perm = menuPermissionsMap[menuPath] || menuPermissionsMap[menuKey];
    if (user?.isCompanyUser && perm) return true;
    // Handle both boolean and number (1/0) for is_active
    const isActive = perm?.is_active === true || perm?.is_active === 1 || perm?.is_active === '1';
    const hasPerm = perm && isActive;
    if (!hasPerm) {
      console.log(`No permission for menu: ${menuKey} (${menuPath})`, {
        foundInMap: !!perm,
        isActive: perm?.is_active,
        isActiveType: typeof perm?.is_active,
        menuPermissionsMapKeys: Object.keys(menuPermissionsMap)
      });
    }
    // If menu exists in the filtered data, user has permission
    return hasPerm;
  };

  // Build menu structure from permissions
  // Menu items should remain stable regardless of current location
  const menuItems = useMemo(() => {
    if (!menuPermissionsData || permissionsLoading) {
      return { rootItems: [], grouped: {}, openKeysFromPath: new Set(), flatItems: [] };
    }
    
    const data = Array.isArray(menuPermissionsData) 
      ? menuPermissionsData 
      : menuPermissionsData?.Result || [];
    
    console.log("CommonSidebar - Processing menu data:", {
      dataLength: data.length,
      basePath,
      menuItems: data.map(item => ({ key: item.menu_key, path: item.menu_path, is_active: item.is_active }))
    });
    
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
        '/Dashboard/SalaryPayslip':
          basePath === '/Employee'
            ? '/Employee/MyPayslips'
            : basePath === '/Hr'
              ? '/Dashboard/SalaryPayslip'
              : originalPath,
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
        if (!isMenuPermissionRowVisible(item)) return false;
        if (!item.menu_path) return false;
        // Removed product features: no Team Leads / HR Management admin menus
        if (item.menu_key === "manage_team_leads" || item.menu_key === "manage_hr") return false;
        // Hide legacy Leave Approvals shortcut menu item
        if (item.menu_key === "leave_details") return false;
        // Hide Employee Productivity shortcut menu item
        if (item.menu_key === "employee_productivity") return false;
        // Admin payroll screen — employees use My Payslips only
        if (basePath === "/Employee" && item.menu_key === "salary_payslip") return false;
        // Time Management removed from Productivity Tracking (still available under Workforce if enabled)
        if (item.menu_key === "time_management") return false;
        
        // Menu keys that may use Dashboard routes (for non-Admin visibility)
        const featureMenuKeys = [
          'dashboard', 'employee_management', 'project_management', 'sales', 'investment_management',
          'investment_kyc_management', 'investment_referral_management', 'workforce_management', 'leave_management',
          'payroll_finance', 'approvals', 'approval_center', 'reports', 'productivity_tracking', 'automation', 'settings',
          'manage_employees', 'roles_permissions', 'manage_projects', 'project_planning', 'project_work_details',
          'add_crm_date', 'crm_list', 'crm_summary', 'lead_list', 'investment_kyc', 'investment_kyc_submit', 'investment_update_kyc_status',
          'investment_reports', 'investment_admin_user_reports', 'investment_myself_reports', 'investment_withdrawal_requests',
          'investment_referral_earnings', 'investment_referral_reports', 'time_tracking', 'shift_management', 'overtime_management',
          'leave_balance', 'apply_leave', 'compoff', 'payroll_export', 'salary_payslip', 'billing_invoicing', 'budget_tracking',
          'leave_details', 'compoff_details', 'employee_report', 'project_report', 'weekly_report', 'monthly_report', 'yearly_report',
          'leave_report', 'discipline_report', 'consolidated_report', 'employee_productivity', 'employee_dashboard', 'teamlead_dashboard', 'productivity',
          'automated_reports', 'settings_updates', 'settings_discipline', 'settings_designation', 'settings_roles', 'settings_areaofwork',
          'settings_variation', 'menu_permissions', 'settings_overtime_rules', 'settings_app_settings', 'user_access'
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
          if (basePath === '/Employee' && item.menu_key === 'salary_payslip') return false;
          // Check if it's a feature menu item by menu_key first
          if (featureMenuKeys.includes(item.menu_key)) {
            // Check permission - if user has permission, include it
            return hasPermission(item.menu_path, item.menu_key);
          }
          
          // Also check by path patterns for features (fallback)
          if (item.menu_path.startsWith('/Dashboard')) {
            return hasPermission(item.menu_path, item.menu_key);
          }
        }
        
        // If menu is in the filtered data from API, user has permission - include it
        // This handles cases where the menu path doesn't match basePath but user has permission
        if (hasPermission(item.menu_path, item.menu_key)) {
          return true;
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
          // This includes Sales menu and other Dashboard-only features
          menuPath = item.menu_path;
        }
        
        // Keep all Dashboard paths for correct routing
        if (item.menu_path && item.menu_path.startsWith('/Dashboard')) {
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

    // Auto-expand: which parent keys should be open when current path is under them
    const pathname = location.pathname;
    const openKeysFromPath = new Set();
    items.forEach((item) => {
      if (!item.menu_path || item.menu_path === "/") return;
      if (pathname === item.menu_path || pathname.startsWith(item.menu_path + "/")) {
        let key = item.parent_menu;
        while (key) {
          openKeysFromPath.add(key);
          const parentItem = items.find((i) => i.menu_key === key);
          key = parentItem?.parent_menu;
        }
      }
    });
    // Super Admin: always expand so "Company Profile Login List" and other sub-items are visible and selectable
    if (items.some((i) => i.menu_key === "super_admin" || i.parent_menu === "super_admin")) {
      openKeysFromPath.add("super_admin");
    }
    // Investment / My Self (merged into super-admin menu API): keep section headers expanded
    const investmentParents = [
      "investment",
      "investment_management",
      "investment_kyc_management",
      "investment_referral_management",
    ];
    for (const p of investmentParents) {
      if (items.some((i) => i.menu_key === p || i.parent_menu === p)) {
        openKeysFromPath.add(p);
      }
    }

    return { rootItems, grouped, openKeysFromPath, flatItems: items };
  }, [menuPermissionsData, permissionsLoading, basePath, menuPermissionsMap, normalizedRoles, location.pathname, isMenuPermissionRowVisible]);

  const activeMenuKey = useMemo(
    () => resolveActiveMenuKey(location.pathname, menuItems.flatItems, menuItems.grouped),
    [location.pathname, menuItems]
  );

  const { railMainItems, railBottomItems } = useMemo(() => {
    const roots = menuItems.rootItems || [];
    const bottom = [];
    const main = [];
    const scoreBottom = (item) => {
      const k = String(item.menu_key || "").toLowerCase();
      const t = String(item.menu_title || "").toLowerCase();
      if (RAIL_BOTTOM_MENU_KEYS.has(k)) return true;
      if (
        /\breport\b|consolidated|weekly_report|monthly_report|yearly_report|discipline_report|leave_report|automated_reports|employee_report|project_report|crm_summary/.test(
          k
        )
      )
        return true;
      if (/\breport\b|analytics\b|summary\b/.test(t)) return true;
      if (/approval_center|automated|automation/.test(k)) return true;
      return false;
    };
    roots.forEach((i) => (scoreBottom(i) ? bottom : main).push(i));
    if (bottom.length === 0 && roots.length >= RAIL_MIN_ROOTS_FOR_LAST_TWO_SPLIT) {
      return {
        railMainItems: roots.slice(0, -2),
        railBottomItems: roots.slice(-2),
      };
    }
    return {
      railMainItems: main.length > 0 ? main : bottom.length > 0 ? [] : roots,
      railBottomItems: bottom,
    };
  }, [menuItems.rootItems]);

  const railBottomHasActive = useMemo(
    () =>
      railBottomItems.some(
        (item) =>
          activeMenuKey === item.menu_key ||
          subtreeContainsActive(item.menu_key, activeMenuKey, menuItems.grouped)
      ),
    [railBottomItems, activeMenuKey, menuItems.grouped]
  );

  const closeRailPopover = useCallback(() => {
    setRailPopover({ key: null, anchor: null });
  }, []);

  useEffect(() => {
    closeRailPopover();
  }, [location.pathname, closeRailPopover]);

  const updateMenuScrollHint = useCallback(() => {
    const el = menuScrollRef.current;
    if (!el) {
      setMenuScrollDownHint(false);
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = el;
    const canScroll = scrollHeight > clientHeight + 2;
    const notAtBottom = scrollTop + clientHeight < scrollHeight - 8;
    setMenuScrollDownHint(Boolean(canScroll && notAtBottom));
  }, []);

  useEffect(() => {
    updateMenuScrollHint();
  }, [updateMenuScrollHint, permissionsLoading, menuItems.rootItems, isRailLayout, mobileOpen]);

  useEffect(() => {
    const el = menuScrollRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => updateMenuScrollHint());
    ro.observe(el);
    el.addEventListener("scroll", updateMenuScrollHint, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateMenuScrollHint);
    };
  }, [updateMenuScrollHint, permissionsLoading]);

  const handleMenuToggle = (menuKey) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const resolveMenuIcon = useCallback((item) => {
    if (!item) return <Menu />;
    const raw = item.menu_icon;
    if (raw != null && String(raw).trim()) {
      const k = String(raw).trim();
      const IconC = iconMap[k];
      if (IconC) return <IconC />;
    }
    const mk = item.menu_key;
    if (mk && MENU_KEY_FALLBACK_ICONS[mk]) {
      const F = MENU_KEY_FALLBACK_ICONS[mk];
      return <F />;
    }
    return <Menu />;
  }, []);

  const railLabelSx = useMemo(
    () => ({
      mt: 0.5,
      fontSize: "0.65rem",
      fontWeight: 600,
      color: sidebarText,
      textAlign: "center",
      lineHeight: 1.15,
      maxWidth: "100%",
      px: 0.25,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
    }),
    [sidebarText]
  );

  const getMenuTitle = useCallback(
    (item) => {
      const key = String(item?.menu_key || "").trim();
      const fallback = String(item?.menu_title || "").trim();
      if (!key) return fallback;
      return t(`menu.${key}`, { defaultValue: fallback });
    },
    [t]
  );

  const renderFlyoutItem = (child, depth = 0) => {
    const subs = menuItems.grouped[child.menu_key] || [];
    if (!subs.length) {
      return (
        <MenuItem
          key={child.menu_key}
          component={Link}
          to={child.menu_path || "#"}
          onClick={closeRailPopover}
          dense
          sx={{ pl: Math.min(1.5 + depth * 1.5, 6) }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            {resolveMenuIcon(child)}
          </ListItemIcon>
          <ListItemText
            primary={getMenuTitle(child)}
            primaryTypographyProps={{ variant: "body2" }}
          />
        </MenuItem>
      );
    }
    return (
      <React.Fragment key={child.menu_key}>
        <ListSubheader
          sx={{
            lineHeight: "28px",
            fontWeight: 700,
            fontSize: "0.7rem",
            bgcolor: "grey.100",
            color: "text.secondary",
          }}
        >
          {getMenuTitle(child)}
        </ListSubheader>
        {subs.map((s) => renderFlyoutItem(s, depth + 1))}
      </React.Fragment>
    );
  };

  const renderRailRootRow = (item) => {
    const hasChildren = menuItems.grouped[item.menu_key]?.length > 0;
    const isActive = !hasChildren && activeMenuKey === item.menu_key;
    const hasActiveChild =
      hasChildren && subtreeContainsActive(item.menu_key, activeMenuKey, menuItems.grouped);
    const popOpen = railPopover.key === item.menu_key;
    const iconHighlight = isActive || (hasChildren && hasActiveChild);

    const iconWrap = (
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: iconHighlight ? railActive : alpha("#fff", 0.06),
          transition: "background-color 0.2s ease",
        }}
      >
        <Box sx={{ color: sidebarText, "& .MuiSvgIcon-root": { fontSize: 24 } }}>
          {resolveMenuIcon(item)}
        </Box>
      </Box>
    );

    if (hasChildren) {
      return (
        <React.Fragment key={item.menu_key}>
          <ListItem disablePadding sx={{ mb: 0.25, justifyContent: "center", width: "100%" }}>
            <ListItemButton
              onClick={(e) => {
                setRailPopover((p) =>
                  p.key === item.menu_key
                    ? { key: null, anchor: null }
                    : { key: item.menu_key, anchor: e.currentTarget }
                );
              }}
              sx={{
                flexDirection: "column",
                alignItems: "center",
                py: 1,
                px: 0.5,
                borderRadius: 2,
                minHeight: "auto",
                maxWidth: "100%",
                "&:hover": { bgcolor: alpha(sidebarText, 0.08) },
              }}
            >
              {iconWrap}
              <Typography variant="caption" sx={railLabelSx}>
                {getMenuTitle(item)}
              </Typography>
            </ListItemButton>
          </ListItem>
          <Popover
            open={popOpen}
            anchorEl={railPopover.anchor}
            onClose={closeRailPopover}
            disableRestoreFocus
            disableScrollLock
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            slotProps={{
              paper: {
                sx: {
                  ml: 0.5,
                  minWidth: 240,
                  maxHeight: "70vh",
                  overflow: "auto",
                  boxShadow: 4,
                },
              },
            }}
          >
            <MenuList dense autoFocusItem={false} sx={{ py: 0 }}>
              {(menuItems.grouped[item.menu_key] || []).map((c) => renderFlyoutItem(c, 0))}
            </MenuList>
          </Popover>
        </React.Fragment>
      );
    }

    return (
      <ListItem key={item.menu_key} disablePadding sx={{ mb: 0.25, justifyContent: "center", width: "100%" }}>
        <Link
          to={item.menu_path || "#"}
          style={{
            textDecoration: "none",
            color: "inherit",
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <ListItemButton
            sx={{
              flexDirection: "column",
              alignItems: "center",
              py: 1,
              px: 0.5,
              borderRadius: 2,
              minHeight: "auto",
              maxWidth: "100%",
              "&:hover": { bgcolor: alpha(sidebarText, 0.08) },
            }}
          >
            {iconWrap}
            <Typography variant="caption" sx={railLabelSx}>
              {getMenuTitle(item)}
            </Typography>
          </ListItemButton>
        </Link>
      </ListItem>
    );
  };

  /** One rail slot: "More" + side popover listing every bottom-group section (nested like single-parent flyouts). */
  const renderRailOverflowCluster = () => {
    const popOpen = railPopover.key === RAIL_OVERFLOW_POPOVER_KEY;
    const iconHighlight = railBottomHasActive || popOpen;
    const iconWrap = (
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: iconHighlight ? railActive : alpha("#fff", 0.06),
          transition: "background-color 0.2s ease",
        }}
      >
        <Box sx={{ color: sidebarText, "& .MuiSvgIcon-root": { fontSize: 24 } }}>
          <MoreHoriz />
        </Box>
      </Box>
    );
    return (
      <React.Fragment key={RAIL_OVERFLOW_POPOVER_KEY}>
        <ListItem disablePadding sx={{ mb: 0.25, justifyContent: "center", width: "100%" }}>
          <ListItemButton
            aria-label={t("layout.moreNavigation", { defaultValue: "More navigation" })}
            onClick={(e) => {
              setRailPopover((p) =>
                p.key === RAIL_OVERFLOW_POPOVER_KEY
                  ? { key: null, anchor: null }
                  : { key: RAIL_OVERFLOW_POPOVER_KEY, anchor: e.currentTarget }
              );
            }}
            sx={{
              flexDirection: "column",
              alignItems: "center",
              py: 1,
              px: 0.5,
              borderRadius: 2,
              minHeight: "auto",
              maxWidth: "100%",
              "&:hover": { bgcolor: alpha(sidebarText, 0.08) },
            }}
          >
            {iconWrap}
            <Typography variant="caption" sx={railLabelSx}>
              {t("layout.more", { defaultValue: "More" })}
            </Typography>
          </ListItemButton>
        </ListItem>
        <Popover
          open={popOpen}
          anchorEl={railPopover.anchor}
          onClose={closeRailPopover}
          disableRestoreFocus
          disableScrollLock
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          slotProps={{
            paper: {
              sx: {
                ml: 0.5,
                minWidth: 260,
                maxHeight: "70vh",
                overflow: "auto",
                boxShadow: 4,
              },
            },
          }}
        >
          <MenuList dense autoFocusItem={false} sx={{ py: 0 }}>
            {railBottomItems.map((item) => {
              const children = menuItems.grouped[item.menu_key] || [];
              if (!children.length) {
                return (
                  <MenuItem
                    key={item.menu_key}
                    component={Link}
                    to={item.menu_path || "#"}
                    onClick={closeRailPopover}
                    dense
                    sx={{ pl: 1.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>{resolveMenuIcon(item)}</ListItemIcon>
                    <ListItemText
                      primary={getMenuTitle(item)}
                      primaryTypographyProps={{ variant: "body2" }}
                    />
                  </MenuItem>
                );
              }
              return (
                <React.Fragment key={item.menu_key}>
                  <ListSubheader
                    sx={{
                      lineHeight: "28px",
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      bgcolor: "grey.100",
                      color: "text.secondary",
                    }}
                  >
                    {getMenuTitle(item)}
                  </ListSubheader>
                  {children.map((c) => renderFlyoutItem(c, 0))}
                </React.Fragment>
              );
            })}
          </MenuList>
        </Popover>
      </React.Fragment>
    );
  };

  const renderMenuItem = (item, level = 0) => {
    if (isRailLayout && level === 0) {
      return renderRailRootRow(item);
    }

    const hasChildren = menuItems.grouped[item.menu_key]?.length > 0;
    const isOpen = openMenus[item.menu_key] ?? menuItems.openKeysFromPath?.has(item.menu_key);
    const isActive = !hasChildren && activeMenuKey === item.menu_key;
    const hasActiveChild = hasChildren && subtreeContainsActive(item.menu_key, activeMenuKey, menuItems.grouped);
    const isRoot = level === 0;
    const lightOnNavy = isMobile || !isRailLayout;

    const buttonSx = lightOnNavy
      ? {
          borderRadius: 2,
          minHeight: isRoot ? 48 : 42,
          px: 1.5,
          py: 1,
          pl: 1.5 + level * 2.5,
          borderLeft: isActive ? `3px solid ${railActive}` : "3px solid transparent",
          bgcolor: hasActiveChild ? alpha(railActive, 0.2) : "transparent",
          "&.Mui-selected": {
            bgcolor: alpha(railActive, 0.22),
            color: sidebarText,
            borderLeftColor: railActive,
            "&:hover": { bgcolor: alpha(railActive, 0.28) },
            "& .MuiListItemIcon-root": { color: sidebarText },
          },
          "&:hover": {
            bgcolor: hasActiveChild ? alpha(railActive, 0.25) : alpha(sidebarText, 0.08),
          },
          transition: "all 0.2s ease",
        }
      : {
          borderRadius: 2,
          minHeight: isRoot ? 44 : 40,
          px: 1.5,
          py: 1,
          pl: 1.5 + level * 2.5,
          borderLeft: isActive ? `3px solid ${theme.palette.primary.main}` : "3px solid transparent",
          bgcolor: hasActiveChild ? alpha(theme.palette.primary.main, 0.06) : "transparent",
          "&.Mui-selected": {
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: "primary.main",
            borderLeftColor: theme.palette.primary.main,
            "&:hover": {
              bgcolor: alpha(theme.palette.primary.main, 0.16),
            },
            "& .MuiListItemIcon-root": {
              color: "primary.main",
            },
          },
          "&:hover": {
            bgcolor: hasActiveChild ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.primary.main, 0.04),
          },
          transition: "all 0.2s ease",
        };

    const iconColor = lightOnNavy
      ? isActive || hasActiveChild
        ? sidebarText
        : alpha(sidebarText, 0.85)
      : isActive || hasActiveChild
        ? "primary.main"
        : "text.secondary";
    const textColor = lightOnNavy
      ? isActive || hasActiveChild
        ? sidebarText
        : alpha(sidebarText, 0.92)
      : isActive || hasActiveChild
        ? "primary.main"
        : "text.primary";

    const buttonContent = (
      <>
        <ListItemIcon
          sx={{
            minWidth: 40,
            color: iconColor,
            "& .MuiSvgIcon-root": { fontSize: isRoot ? 22 : 20 },
          }}
        >
          {resolveMenuIcon(item)}
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography
              variant="body2"
              sx={{
                fontWeight: isRoot ? 600 : isActive || hasActiveChild ? 600 : 500,
                fontSize: isRoot ? "0.9rem" : "0.8125rem",
                color: textColor,
              }}
            >
              {getMenuTitle(item)}
            </Typography>
          }
        />
        {hasChildren && (
          <Box
            sx={{
              color: lightOnNavy ? alpha(sidebarText, 0.8) : "text.secondary",
              display: "flex",
              alignItems: "center",
            }}
          >
            {isOpen ? <ExpandLess /> : <ExpandMore />}
          </Box>
        )}
      </>
    );

    return (
      <React.Fragment key={item.menu_key || item.menu_path}>
        <ListItem disablePadding sx={{ mb: 0.25, px: 1 }}>
          {hasChildren ? (
            <ListItemButton
              component="div"
              onClick={() => handleMenuToggle(item.menu_key)}
              selected={false}
              sx={buttonSx}
            >
              {buttonContent}
            </ListItemButton>
          ) : (
            <Link
              to={item.menu_path || "#"}
              onClick={() => isMobile && setMobileOpen(false)}
              style={{ textDecoration: "none", color: "inherit", display: "block", width: "100%" }}
            >
              <ListItemButton component="div" selected={isActive} sx={buttonSx}>
                {buttonContent}
              </ListItemButton>
            </Link>
          )}
        </ListItem>
        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List
              component="div"
              disablePadding
              sx={{
                pl: 0,
                borderLeft: `1px solid ${
                  lightOnNavy ? alpha(railActive, 0.35) : alpha(theme.palette.primary.main, 0.12)
                }`,
                ml: 2.5,
                my: 0.25,
              }}
            >
              {menuItems.grouped[item.menu_key].map((child) => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerPaperWidth = isMobile ? MOBILE_DRAWER_WIDTH : drawerWidth;

  const scrollThumb = isRailLayout
    ? alpha(sidebarText, 0.22)
    : alpha(theme.palette.primary.main, 0.25);

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: sidebarBg,
        color: sidebarText,
      }}
    >
      {/* Logo — compact (reference: small mark at top) */}
      <Box
        sx={{
          pt: 2,
          pb: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          component="img"
          src={logoSrc}
          alt={t("layout.logoAlt", { defaultValue: "Logo" })}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = logoImage;
          }}
          sx={{
            width: isRailLayout ? 40 : 48,
            height: isRailLayout ? 40 : 48,
            borderRadius: 1.5,
            objectFit: "contain",
          }}
        />
      </Box>

      {/* User + trial — show in drawer on mobile only (desktop: top bar) */}
      {user && isMobile && (
        <Box
          sx={{
            p: 1.5,
            mx: 1,
            mb: 1,
            borderRadius: 2,
            bgcolor: alpha("#fff", 0.06),
            border: `1px solid ${alpha("#fff", 0.12)}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: railActive,
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              {user.employeeName?.charAt(0) || user.name?.charAt(0) || user.userName?.charAt(0) || "U"}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ fontSize: "0.8125rem", color: sidebarText }}>
                {user.employeeName || user.name || user.userName || "User"}
              </Typography>
              <Chip
                label={displayRoleChipLabel}
                size="small"
                sx={{
                  height: 20,
                  mt: 0.5,
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  bgcolor: alpha("#fff", 0.12),
                  color: sidebarText,
                  border: `1px solid ${alpha("#fff", 0.2)}`,
                }}
              />
              {isTrailVersion && (
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label="Trial"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: "0.6rem",
                      bgcolor: "#FFF3E0",
                      color: "#E65100",
                    }}
                  />
                  {(trailDaysLeft != null || trailExpiresAtFormatted) && !trailResult.expired && (
                    <Typography variant="caption" sx={{ fontSize: "0.65rem", color: alpha(sidebarText, 0.75), display: "block", mt: 0.25 }}>
                      {trailDaysLeft != null && trailDaysLeft >= 0 && `${trailDaysLeft}d left`}
                      {trailExpiresAtFormatted && ` · ${trailExpiresAtFormatted}`}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      )}

      {isMobile && isCompanyAdmin() && (
        <Box sx={{ px: 1.5, pb: 1 }}>
          <Button
            component={Link}
            to="/Dashboard/company-login-request"
            fullWidth
            variant="outlined"
            size="small"
            onClick={() => setMobileOpen(false)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderColor: alpha("#fff", 0.35),
              color: sidebarText,
            }}
          >
            Request company login
          </Button>
        </Box>
      )}

      {/* Menu */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          ref={menuScrollRef}
          sx={{
            flex: 1,
            overflow: "auto",
            py: 0.5,
            px: isRailLayout ? 0.25 : 0.5,
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              background: scrollThumb,
              borderRadius: 3,
              "&:hover": { background: alpha(scrollThumb, 1) },
            },
          }}
        >
          {permissionsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <Typography variant="body2" sx={{ color: alpha(sidebarText, 0.7) }}>
                Loading menu…
              </Typography>
            </Box>
          ) : menuItems.rootItems?.length > 0 ? (
            isRailLayout ? (
              <>
                <List disablePadding sx={{ py: 0 }}>
                  {railMainItems.map((item) => renderRailRootRow(item))}
                </List>
                {railBottomItems.length > 0 && (
                  <>
                    <Divider sx={{ borderColor: alpha(sidebarText, 0.15), my: 1, mx: 0.5 }} />
                    <List disablePadding sx={{ py: 0 }}>
                      {railBottomItems.length === 1
                        ? renderRailRootRow(railBottomItems[0])
                        : railBottomItems.length >= RAIL_MIN_BOTTOM_FOR_OVERFLOW_CLUSTER
                          ? renderRailOverflowCluster()
                          : railBottomItems.map((item) => renderRailRootRow(item))}
                    </List>
                  </>
                )}
              </>
            ) : (
              <List disablePadding sx={{ py: 0 }}>
                {menuItems.rootItems.map((item) => renderMenuItem(item))}
              </List>
            )
          ) : (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <Typography variant="body2" sx={{ color: alpha(sidebarText, 0.7) }}>
                No menu items available
              </Typography>
            </Box>
          )}
        </Box>
        {menuScrollDownHint && (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 40,
              pointerEvents: "none",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              pb: 0.25,
              background: `linear-gradient(to bottom, transparent, ${sidebarBg})`,
            }}
          >
            <KeyboardArrowDown
              sx={{
                color: alpha(sidebarText, 0.9),
                fontSize: 28,
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))",
              }}
            />
          </Box>
        )}
      </Box>

      {/* Help & onboarding — always show tour + guide when provider exists (not gated on tour completion) */}
      {tour && (
        <Box sx={{ px: isRailLayout ? 0.75 : 1.5, pt: 0.5, pb: 0.5 }}>
          {isRailLayout ? (
            <Stack spacing={0.75}>
              <Button
                fullWidth
                size="small"
                variant="contained"
                startIcon={<PlayArrow sx={{ fontSize: 18 }} />}
                onClick={() => tour.startTour()}
                sx={{
                  minWidth: 0,
                  py: 0.75,
                  fontSize: "0.65rem",
                  textTransform: "none",
                  fontWeight: 700,
                  bgcolor: railActive,
                  "&:hover": { bgcolor: alpha(railActive, 0.9) },
                }}
              >
                {tour.completed
                  ? t("layout.replay", { defaultValue: "Replay" })
                  : t("layout.tour", { defaultValue: "Tour" })}
              </Button>
              <Button
                fullWidth
                size="small"
                component={Link}
                to={`${basePath}/guidance`}
                variant="outlined"
                startIcon={<MenuBook sx={{ fontSize: 18 }} />}
                endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                sx={{
                  minWidth: 0,
                  py: 0.5,
                  fontSize: "0.65rem",
                  textTransform: "none",
                  borderColor: alpha("#fff", 0.35),
                  color: sidebarText,
                }}
              >
                {t("layout.guide", { defaultValue: "Guide" })}
              </Button>
            </Stack>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 1.25,
                borderRadius: 2,
                bgcolor: alpha("#fff", 0.08),
                border: `1px solid ${alpha("#fff", 0.12)}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25, flexWrap: "wrap" }}>
                <Chip
                  label={
                    tour.showTourButtons
                      ? t("layout.setup", { defaultValue: "Setup" })
                      : t("layout.help", { defaultValue: "Help" })
                  }
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    height: 22,
                    bgcolor: railActive,
                    color: "#fff",
                  }}
                />
                <Typography variant="body2" sx={{ color: alpha(sidebarText, 0.9), fontWeight: 600 }}>
                  {t("layout.helpOnboarding", { defaultValue: "Help & onboarding" })}
                </Typography>
              </Box>
              <Stack spacing={1}>
                <Button
                  fullWidth
                  size="small"
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={() => tour.startTour()}
                  sx={{ textTransform: "none", fontWeight: 700, bgcolor: railActive }}
                >
                  {tour.completed
                    ? t("layout.replayGuidedTour", { defaultValue: "Replay guided tour" })
                    : t("layout.startGuidedTour", { defaultValue: "Start guided tour" })}
                </Button>
                <Button
                  fullWidth
                  size="small"
                  component={Link}
                  to={`${basePath}/guidance`}
                  variant="outlined"
                  startIcon={<MenuBook />}
                  endIcon={<OpenInNew sx={{ fontSize: 18 }} />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: alpha("#fff", 0.35),
                    color: sidebarText,
                  }}
                >
                  {t("layout.openFullGuide", { defaultValue: "Open full guide" })}
                </Button>
              </Stack>
            </Paper>
          )}
        </Box>
      )}

      {/* Logout */}
      <Box sx={{ p: 1, pb: 1.5 }}>
        <ListItemButton
          onClick={logout}
          sx={{
            flexDirection: isRailLayout ? "column" : "row",
            borderRadius: 2,
            minHeight: isRailLayout ? "auto" : 44,
            py: isRailLayout ? 1 : 1.25,
            px: 1,
            color: alpha("#FF8A80", 1),
            "&:hover": { bgcolor: alpha("#fff", 0.06) },
            transition: "all 0.2s ease",
          }}
        >
          <Box
            sx={{
              width: isRailLayout ? 40 : "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Logout sx={{ fontSize: isRailLayout ? 22 : 24 }} />
          </Box>
          {isRailLayout ? (
            <Typography variant="caption" sx={{ mt: 0.25, fontSize: "0.65rem", fontWeight: 600 }}>
              {t("layout.logout")}
            </Typography>
          ) : (
            <ListItemText
              primary={
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.875rem" }}>
                  {t("layout.logout")}
                </Typography>
              }
            />
          )}
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      {isMobile && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            bgcolor: "#fff",
            color: "text.primary",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Toolbar
            sx={{
              justifyContent: "space-between",
              gap: 1,
              flexWrap: "nowrap",
              minHeight: TOP_BAR_HEIGHT,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", minWidth: 0, flex: 1 }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 1 }}
                aria-label={t("layout.openMenu", { defaultValue: "open menu" })}
              >
                <Menu />
              </IconButton>
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{
                  fontWeight: 700,
                  fontSize: showTopBarEmployeeDateTime ? "0.9rem" : "1rem",
                  minWidth: 0,
                  ...(showTopBarEmployeeDateTime ? { fontVariantNumeric: "tabular-nums" } : {}),
                }}
              >
                {showTopBarEmployeeDateTime ? topBarTitleDateTime : topBarTitleDateTime}
              </Typography>
            </Box>
            <Stack direction="row" alignItems="center" spacing={1} flexShrink={0}>
              {showTopBarApprovals && (
                <Button
                  component={Link}
                  to={approvalsPath}
                  size="small"
                  variant="contained"
                  startIcon={<PendingActions sx={{ fontSize: 18 }} />}
                  sx={{ textTransform: "none", fontWeight: 700, whiteSpace: "nowrap" }}
                >
                  {t("layout.approvals")}
                </Button>
              )}
            </Stack>
          </Toolbar>
        </AppBar>
      )}

      {!isMobile && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            zIndex: theme.zIndex.drawer - 1,
            width: `calc(100% - ${drawerPaperWidth}px)`,
            ml: `${drawerPaperWidth}px`,
            bgcolor: "#fff",
            color: "text.primary",
            borderBottom: 1,
            borderColor: "divider",
            minHeight: TOP_BAR_HEIGHT,
          }}
        >
          <Toolbar
            sx={{
              minHeight: TOP_BAR_HEIGHT,
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 700,
                fontSize: showTopBarEmployeeDateTime ? "1rem" : "1.05rem",
                ...(showTopBarEmployeeDateTime ? { fontVariantNumeric: "tabular-nums" } : {}),
              }}
            >
              {showTopBarEmployeeDateTime ? topBarTitleDateTime : topBarTitleDateTime}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} flexShrink={0}>
              {showTopBarApprovals && (
                <Button
                  component={Link}
                  to={approvalsPath}
                  size="small"
                  variant="contained"
                  startIcon={<PendingActions sx={{ fontSize: 20 }} />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    display: { xs: "none", sm: "inline-flex" },
                  }}
                >
                  {t("layout.approvals")}
                </Button>
              )}
              {isCompanyAdmin() && (
                <Button
                  component={Link}
                  to="/Dashboard/company-login-request"
                  size="small"
                  variant="outlined"
                  sx={{ textTransform: "none", fontWeight: 600, display: { xs: "none", sm: "inline-flex" } }}
                >
                  {t("layout.requestLogin")}
                </Button>
              )}
              {isTrailVersion && (
                <Chip
                  label={
                    trailResult.expired
                      ? t("layout.trialEnded", { defaultValue: "Trial ended" })
                      : t("layout.trial", { defaultValue: "Trial" })
                  }
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    bgcolor: trailResult.expired ? alpha(theme.palette.error.main, 0.12) : "#FFF3E0",
                    color: trailResult.expired ? "error.dark" : "#E65100",
                  }}
                />
              )}
              <Chip label={displayRoleChipLabel} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
              {user && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 160, display: { xs: "none", sm: "block" } }}>
                    {user.employeeName || user.name || user.userName || t("role.user", { defaultValue: "User" })}
                  </Typography>
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: railActive,
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    {user.employeeName?.charAt(0) || user.name?.charAt(0) || user.userName?.charAt(0) || "U"}
                  </Avatar>
                </Stack>
              )}
            </Stack>
          </Toolbar>
        </AppBar>
      )}

      <Box component="nav" sx={{ width: { md: drawerPaperWidth }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerPaperWidth,
                bgcolor: sidebarBg,
                borderRight: "none",
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
                width: drawerPaperWidth,
                borderRight: "none",
                bgcolor: sidebarBg,
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

