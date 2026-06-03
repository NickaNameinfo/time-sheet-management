import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  Chip,
  Stack,
  Paper,
  TextField,
  InputAdornment,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  alpha,
  useTheme,
  Tooltip,
} from "@mui/material";
import {
  Save,
  Refresh,
  Settings,
  Search,
  CheckCircle,
  Cancel,
  People,
  ExpandMore,
  ExpandLess,
  ChevronRight,
} from "@mui/icons-material";
import { apiService } from "../../services/api";
import { useApi, useMutation } from "../../hooks/useApi";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";

/** Table columns: Access (sidebar) + View / Add / Edit / Delete / All — each cell = one checkbox per role */
const PERMISSION_COLUMNS = [
  { key: "allowed_roles", labelKey: "menuPerms.columns.access", fallback: "Access" },
  { key: "view_permission", labelKey: "menuPerms.columns.view", fallback: "View" },
  { key: "add_permission", labelKey: "menuPerms.columns.add", fallback: "Add" },
  { key: "edit_permission", labelKey: "menuPerms.columns.edit", fallback: "Edit" },
  { key: "delete_permission", labelKey: "menuPerms.columns.delete", fallback: "Delete" },
  { key: "all_permission", labelKey: "menuPerms.columns.all", fallback: "All" },
];

const ROLE_FILTER_KEYS = PERMISSION_COLUMNS.map((c) => c.key);

function parseJsonFieldForRoleFilter(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch {
      return [];
    }
  }
  return [];
}

/** Role filter: check every column (Access, View, …, All), not only allowed_roles. */
function menuRowIncludesRoleName(menuRow, roleName) {
  if (!menuRow || roleName == null || roleName === "") return false;
  const target = String(roleName).trim().toLowerCase();
  return ROLE_FILTER_KEYS.some((key) => {
    const arr = parseJsonFieldForRoleFilter(menuRow[key]);
    return arr.some((r) => String(r ?? "").trim().toLowerCase() === target);
  });
}

/** Reset / “default” state: no role checks, menu inactive (matches “uncheck all”). */
function buildEmptyPermissions(menuItemsList) {
  const perms = {};
  menuItemsList.forEach((item) => {
    perms[item.id] = {
      allowed_roles: [],
      view_permission: [],
      add_permission: [],
      edit_permission: [],
      delete_permission: [],
      all_permission: [],
      is_active: false,
    };
  });
  return perms;
}

/** Used only if Settings → Roles has no rows (legacy / empty DB). */
const FALLBACK_SYSTEM_ROLES = [
  { role_name: "Admin", role_display_name: "Admin", display_order: 0 },
  { role_name: "HR", role_display_name: "HR", display_order: 1 },
  { role_name: "TL", role_display_name: "TL", display_order: 2 },
  { role_name: "Employee", role_display_name: "Employee", display_order: 3 },
];

const MenuPermissions = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedMenuFilter, setSelectedMenuFilter] = useState("all");
  const permissionColumns = useMemo(
    () =>
      PERMISSION_COLUMNS.map((c) => ({
        ...c,
        label: t(c.labelKey, { defaultValue: c.fallback }),
      })),
    [t]
  );
  const [permissions, setPermissions] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [employeePermissionsDialog, setEmployeePermissionsDialog] = useState(false);
  const [employeePermissions, setEmployeePermissions] = useState({});
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState({});

  // Roles from Settings → Roles (system); drives filters and permission matrix columns
  const { data: rolesData, loading: rolesLoading } = useApi(
    () => apiService.getRoles(),
    []
  );

  /** role_name values are stored in menu permission JSON; labels come from Settings → Roles */
  const systemRoles = useMemo(() => {
    let list = [];
    if (rolesData != null) {
      const raw = Array.isArray(rolesData) ? rolesData : rolesData?.Result || [];
      list = [...raw]
        .filter((r) => r && r.is_active !== false)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
    return list.length > 0 ? list : FALLBACK_SYSTEM_ROLES;
  }, [rolesData]);

  // If selected filter role was removed from system settings, reset to "All"
  useEffect(() => {
    if (selectedRole === "All") return;
    const names = systemRoles.map((r) => r.role_name).filter(Boolean);
    if (names.length > 0 && !names.includes(selectedRole)) {
      setSelectedRole("All");
    }
  }, [systemRoles, selectedRole]);

  // Fetch employees
  const { data: employeesData } = useApi(
    () => apiService.getEmployees(),
    []
  );

  const employees = useMemo(() => {
    if (!employeesData) return [];
    return Array.isArray(employeesData) 
      ? employeesData 
      : employeesData?.Result || [];
  }, [employeesData]);

  // Fetch employee permissions for selected menu
  const { data: employeeMenuPermissionsData, refetch: refetchEmployeePermissions } = useApi(
    () => selectedMenuId ? apiService.getEmployeeMenuPermissions({ menuPermissionId: selectedMenuId }) : null,
    [selectedMenuId]
  );

  const { mutate: bulkUpdateEmployeePermissions, loading: updatingEmployeePermissions } = useMutation(
    apiService.bulkUpdateEmployeeMenuPermissions
  );

  // Fetch menu permissions
  const { data: menuPermissionsData, loading, error, refetch } = useApi(
    () => apiService.getMenuPermissions(),
    []
  );

  const { mutate: bulkUpdatePermissions, loading: updating } = useMutation(
    apiService.bulkUpdateMenuPermissions
  );

  // Helper function to parse JSON field
  const parseJsonField = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  // Sync permissions from API whenever menu data loads or refetches (browser refresh, Save, Refresh).
  // Reset uses buildEmptyPermissions() only via handleReset — not on first paint.
  useEffect(() => {
    if (!menuPermissionsData) return;
    const data = Array.isArray(menuPermissionsData)
      ? menuPermissionsData
      : menuPermissionsData?.Result || [];

    const perms = {};
    data.forEach((item) => {
      perms[item.id] = {
        allowed_roles: parseJsonField(item.allowed_roles),
        view_permission: parseJsonField(item.view_permission),
        add_permission: parseJsonField(item.add_permission),
        edit_permission: parseJsonField(item.edit_permission),
        delete_permission: parseJsonField(item.delete_permission),
        all_permission: parseJsonField(item.all_permission),
        is_active: item.is_active !== undefined ? item.is_active : true,
      };
    });
    setPermissions(perms);
    setHasChanges(false);
  }, [menuPermissionsData]);

  // Get all menu items for select dropdown
  const allMenuItems = useMemo(() => {
    if (!menuPermissionsData) return [];
    const data = Array.isArray(menuPermissionsData) 
      ? menuPermissionsData 
      : menuPermissionsData?.Result || [];
    return data.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [menuPermissionsData]);

  // Build tree structure
  const menuTree = useMemo(() => {
    if (!menuPermissionsData) return [];
    const data = Array.isArray(menuPermissionsData) 
      ? menuPermissionsData 
      : menuPermissionsData?.Result || [];
    
    let filtered = data;
    
    // Filter by selected menu
    if (selectedMenuFilter !== "all") {
      const selectedMenu = data.find(item => item.menu_key === selectedMenuFilter || item.id === parseInt(selectedMenuFilter));
      if (selectedMenu) {
        // Include the selected menu and all its children
        const menuKeysToInclude = new Set([selectedMenu.menu_key]);
        
        // Find all children recursively
        const findChildren = (parentKey) => {
          data.forEach(item => {
            if (item.parent_menu === parentKey) {
              menuKeysToInclude.add(item.menu_key);
              findChildren(item.menu_key);
            }
          });
        };
        
        findChildren(selectedMenu.menu_key);
        
        // Also include parent chain
        let current = selectedMenu;
        while (current && current.parent_menu) {
          const parent = data.find(item => item.menu_key === current.parent_menu);
          if (parent) {
            menuKeysToInclude.add(parent.menu_key);
            current = parent;
          } else {
            break;
          }
        }
        
        filtered = filtered.filter(item => menuKeysToInclude.has(item.menu_key));
      }
    }
    
    // Filter by search text
    if (searchText) {
      filtered = filtered.filter((item) =>
        item.menu_title?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.menu_key?.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Filter by role: match role_name in any permission column (not only Access / allowed_roles)
    if (selectedRole !== "All") {
      const rowForRoleFilter = (item) => {
        const live = permissions[item.id];
        if (!live) return item;
        return {
          ...item,
          allowed_roles: live.allowed_roles,
          view_permission: live.view_permission,
          add_permission: live.add_permission,
          edit_permission: live.edit_permission,
          delete_permission: live.delete_permission,
          all_permission: live.all_permission,
        };
      };
      const directMatchKeys = new Set();
      filtered.forEach((item) => {
        if (menuRowIncludesRoleName(rowForRoleFilter(item), selectedRole)) {
          directMatchKeys.add(item.menu_key);
        }
      });
      const includeKeys = new Set(directMatchKeys);
      // Keep parent rows so the tree stays navigable when only a child matches
      directMatchKeys.forEach((mk) => {
        let row = data.find((d) => d.menu_key === mk);
        while (row?.parent_menu) {
          includeKeys.add(row.parent_menu);
          row = data.find((d) => d.menu_key === row.parent_menu);
        }
      });
      filtered = filtered.filter((item) => includeKeys.has(item.menu_key));
    }
    
    // Build tree structure
    const itemMap = new Map();
    const rootItems = [];
    
    // First pass: create all items
    filtered.forEach((item) => {
      itemMap.set(item.menu_key, { ...item, children: [] });
    });
    
    // Second pass: build tree
    filtered.forEach((item) => {
      const node = itemMap.get(item.menu_key);
      if (item.parent_menu && itemMap.has(item.parent_menu)) {
        itemMap.get(item.parent_menu).children.push(node);
      } else {
        rootItems.push(node);
      }
    });
    
    // Sort by display_order
    const sortItems = (items) => {
      items.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      items.forEach(item => {
        if (item.children.length > 0) {
          sortItems(item.children);
        }
      });
    };
    
    sortItems(rootItems);
    return rootItems;
  }, [menuPermissionsData, searchText, selectedRole, selectedMenuFilter, permissions]);

  // Auto-expand selected menu and its parents when menu filter changes
  useEffect(() => {
    if (selectedMenuFilter !== "all" && menuTree.length > 0) {
      const expandPath = (node) => {
        setExpandedNodes(prev => ({ ...prev, [node.menu_key]: true }));
        if (node.children && node.children.length > 0) {
          node.children.forEach(child => expandPath(child));
        }
      };
      menuTree.forEach(node => expandPath(node));
    }
  }, [selectedMenuFilter, menuTree]);

  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const handleRoleToggle = (menuId, role, permissionType = 'allowed_roles') => {
    setPermissions((prev) => {
      const current = prev[menuId] || { 
        allowed_roles: [], 
        view_permission: [],
        add_permission: [],
        edit_permission: [],
        delete_permission: [],
        all_permission: [],
        is_active: true 
      };
      const currentPerms = [...(current[permissionType] || [])];
      const roleIndex = currentPerms.indexOf(role);
      
      if (roleIndex > -1) {
        currentPerms.splice(roleIndex, 1);
      } else {
        currentPerms.push(role);
      }
      
      return {
        ...prev,
        [menuId]: {
          ...current,
          [permissionType]: currentPerms,
        },
      };
    });
    setHasChanges(true);
  };

  const handleActiveToggle = (menuId) => {
    setPermissions((prev) => {
      const current = prev[menuId] || { allowed_roles: [], is_active: true };
      return {
        ...prev,
        [menuId]: {
          ...current,
          is_active: !current.is_active,
        },
      };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    const updates = Object.keys(permissions).map((menuId) => {
      const menuItem = menuPermissionsData.find((item) => item.id === parseInt(menuId));
      if (!menuItem) return null;
      
      const current = permissions[menuId];
      const original = {
        allowed_roles: parseJsonField(menuItem.allowed_roles),
        view_permission: parseJsonField(menuItem.view_permission),
        add_permission: parseJsonField(menuItem.add_permission),
        edit_permission: parseJsonField(menuItem.edit_permission),
        delete_permission: parseJsonField(menuItem.delete_permission),
        all_permission: parseJsonField(menuItem.all_permission),
        is_active: menuItem.is_active,
      };
      
      // Check if any field changed
      const hasChanges = 
        JSON.stringify(current.allowed_roles?.sort()) !== JSON.stringify(original.allowed_roles?.sort()) ||
        JSON.stringify(current.view_permission?.sort()) !== JSON.stringify(original.view_permission?.sort()) ||
        JSON.stringify(current.add_permission?.sort()) !== JSON.stringify(original.add_permission?.sort()) ||
        JSON.stringify(current.edit_permission?.sort()) !== JSON.stringify(original.edit_permission?.sort()) ||
        JSON.stringify(current.delete_permission?.sort()) !== JSON.stringify(original.delete_permission?.sort()) ||
        JSON.stringify(current.all_permission?.sort()) !== JSON.stringify(original.all_permission?.sort()) ||
        current.is_active !== original.is_active;
      
      if (hasChanges) {
        return {
          id: parseInt(menuId),
          allowed_roles: current.allowed_roles,
          view_permission: current.view_permission,
          add_permission: current.add_permission,
          edit_permission: current.edit_permission,
          delete_permission: current.delete_permission,
          all_permission: current.all_permission,
          is_active: current.is_active,
        };
      }
      return null;
    }).filter(Boolean);

    if (updates.length === 0) {
      setSnackbar({
        open: true,
        message: t("menuPerms.noChangesToSave", { defaultValue: "No changes to save" }),
        severity: "info",
      });
      return;
    }

    try {
      const result = await bulkUpdatePermissions({ permissions: updates });
      if (result.success) {
        setSnackbar({
          open: true,
          message: t("menuPerms.updatedCount", {
            defaultValue: "Successfully updated {{count}} menu permission(s)",
            count: updates.length,
          }),
          severity: "success",
        });
        setHasChanges(false);
        refetch();
      } else {
        setSnackbar({
          open: true,
          message:
            result.error ||
            t("menuPerms.failedToUpdate", { defaultValue: "Failed to update permissions" }),
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.message ||
          t("menuPerms.failedToUpdate", { defaultValue: "Failed to update permissions" }),
        severity: "error",
      });
    }
  };

  /** Reset to default: all checkboxes off, all menus inactive (not a reload from server). */
  const handleReset = () => {
    if (!menuPermissionsData) return;
    const data = Array.isArray(menuPermissionsData)
      ? menuPermissionsData
      : menuPermissionsData?.Result || [];
    if (!data.length) return;
    setPermissions(buildEmptyPermissions(data));
    setHasChanges(true);
  };

  /** Hierarchical table rows: menu column + View/Add/Edit/Delete/All (checkbox per role) */
  const renderPermissionTableRows = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.menu_key] !== false;
    const perm = permissions[node.id] || {
      allowed_roles: parseJsonField(node.allowed_roles),
      view_permission: parseJsonField(node.view_permission),
      add_permission: parseJsonField(node.add_permission),
      edit_permission: parseJsonField(node.edit_permission),
      delete_permission: parseJsonField(node.delete_permission),
      all_permission: parseJsonField(node.all_permission),
      is_active: node.is_active !== undefined ? node.is_active : true,
    };

    const row = (
      <TableRow
        key={node.id}
        hover
        sx={{
          opacity: perm.is_active ? 1 : 0.55,
          "&:nth-of-type(even)": { bgcolor: alpha(theme.palette.action.hover, 0.06) },
        }}
      >
        <TableCell
          sx={{
            position: "sticky",
            left: 0,
            zIndex: 2,
            bgcolor: "background.paper",
            borderRight: `1px solid ${theme.palette.divider}`,
            py: 1.25,
            pl: 1 + depth * 2,
            minWidth: 240,
            maxWidth: 400,
            boxShadow: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
            {hasChildren ? (
              <IconButton
                size="small"
                onClick={() => toggleNode(node.menu_key)}
                sx={{ mt: -0.25, p: 0.25 }}
                aria-label={
                  isExpanded
                    ? t("common.collapse", { defaultValue: "Collapse" })
                    : t("common.expand", { defaultValue: "Expand" })
                }
              >
                {isExpanded ? <ExpandLess fontSize="small" /> : <ChevronRight fontSize="small" />}
              </IconButton>
            ) : (
              <Box sx={{ width: 28, flexShrink: 0 }} />
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                fontWeight={depth === 0 ? 700 : depth === 1 ? 600 : 500}
                color="text.primary"
                lineHeight={1.3}
              >
                {node.menu_title}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block" title={node.menu_path || node.menu_key}>
                {node.menu_key}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        {permissionColumns.map((col) => (
          <TableCell key={col.key} align="center" sx={{ py: 0.75, px: 0.5, minWidth: 112, verticalAlign: "middle" }}>
            <Stack direction="row" spacing={0} justifyContent="center" alignItems="center" flexWrap="wrap" useFlexGap>
              {systemRoles.map((roleRow) => {
                const role = roleRow.role_name;
                const roleLabel = roleRow.role_display_name || roleRow.role_name || role;
                const isChecked = (perm[col.key] || []).includes(role);
                const tip =
                  col.key === "allowed_roles"
                    ? t("menuPerms.tooltipSidebar", {
                        defaultValue: "{{role}}: show this menu in the sidebar",
                        role: roleLabel,
                      })
                    : col.key === "edit_permission" &&
                        (node.menu_key === "salary_payslip" || node.menu_key === "my_payslips")
                      ? t("menuPerms.tooltipPayslipEdit", {
                          defaultValue:
                            "{{role}} — {{col}}. For employees, use My Payslips with View/Access only (not Edit on Salary & Payslip).",
                          role: roleLabel,
                          col: col.label,
                        })
                      : `${roleLabel} — ${col.label}`;
                return (
                  <Tooltip key={role} title={tip} arrow placement="top">
                    <span>
                      <Checkbox
                        checked={isChecked}
                        onChange={() => handleRoleToggle(node.id, role, col.key)}
                        disabled={!perm.is_active}
                        size="small"
                        sx={{ p: 0.2 }}
                      />
                    </span>
                  </Tooltip>
                );
              })}
            </Stack>
          </TableCell>
        ))}
        <TableCell align="center" sx={{ width: 88 }}>
          <Switch
            checked={!!perm.is_active}
            onChange={() => handleActiveToggle(node.id)}
            size="small"
            color="success"
          />
        </TableCell>
        <TableCell align="center" sx={{ width: 100 }}>
          <Button
            size="small"
            variant="text"
            startIcon={<People fontSize="small" />}
            onClick={() => {
              setSelectedMenuId(node.id);
              setEmployeePermissionsDialog(true);
              refetchEmployeePermissions();
            }}
            sx={{ textTransform: "none", fontSize: "0.75rem", minWidth: 0, px: 0.5 }}
          >
            Staff
          </Button>
        </TableCell>
      </TableRow>
    );

    const childRows =
      hasChildren && isExpanded
        ? node.children.flatMap((child) => renderPermissionTableRows(child, depth + 1))
        : [];

    return [row, ...childRows];
  };

  /** Full-page spinner only before first data arrives; refetch keeps UI and shows spinner on Refresh */
  const hasMenuData = menuPermissionsData != null;
  const isInitialLoading = (loading || rolesLoading) && !hasMenuData;

  if (isInitialLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box 
      sx={{ 
        p: 4,
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 3,
            p: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Settings sx={{ color: "white", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography 
                  variant="h4" 
                  fontWeight={800}
                  sx={{
                    background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    mb: 0.5,
                  }}
                >
                  Menu Permissions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {t("menuPerms.subtitle", {
                    defaultValue:
                      "Tree of menus with Access / View / Add / Edit / Delete / All — checkboxes per role (A H T E).",
                  })}
                </Typography>
              </Box>
            </Box>
            {hasChanges && (
              <Chip
                icon={<CheckCircle />}
                label={t("menuPerms.unsavedChanges", { defaultValue: "Unsaved Changes" })}
                color="warning"
                size="small"
                sx={{ mt: 1, fontWeight: 600 }}
              />
            )}
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refetch}
              disabled={loading}
              sx={{
                borderRadius: 2,
                px: 2.5,
                textTransform: "none",
                fontWeight: 600,
                borderColor: alpha(theme.palette.primary.main, 0.3),
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  transform: "translateY(-2px)",
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
                transition: "all 0.2s ease",
              }}
            >
              {loading && hasMenuData
                ? t("common.loading", { defaultValue: "Loading..." })
                : t("common.refresh", { defaultValue: "Refresh" })}
            </Button>
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={loading || !menuPermissionsData}
              title={t("menuPerms.resetTooltip", {
                defaultValue:
                  "Clear all permissions to default (everything unchecked, menus inactive). Save to apply.",
              })}
              sx={{
                borderRadius: 2,
                px: 2.5,
                textTransform: "none",
                fontWeight: 600,
                borderColor: alpha(theme.palette.grey[400], 0.5),
                "&:hover:not(:disabled)": {
                  borderColor: "grey.600",
                  bgcolor: alpha(theme.palette.grey[500], 0.08),
                  transform: "translateY(-2px)",
                },
                transition: "all 0.2s ease",
              }}
            >
              {t("menuPerms.reset", { defaultValue: "Reset" })}
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={!hasChanges || updating}
              sx={{
                borderRadius: 2,
                px: 3,
                textTransform: "none",
                fontWeight: 700,
                background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
                boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                "&:hover:not(:disabled)": {
                  background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
                  transform: "translateY(-2px)",
                  boxShadow: `0 6px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
                "&:disabled": {
                  background: alpha(theme.palette.grey[400], 0.3),
                },
                transition: "all 0.3s ease",
              }}
            >
              {updating
                ? t("common.saving", { defaultValue: "Saving..." })
                : t("menuPerms.saveChanges", { defaultValue: "Save Changes" })}
            </Button>
          </Stack>
        </Box>

        {/* Filters */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            mb: 4,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            backdropFilter: "blur(10px)",
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.08)}`,
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel 
                  sx={{
                    fontWeight: 600,
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  }}
                >
                  Select Menu
                </InputLabel>
                <Select
                  value={selectedMenuFilter}
                  label={t("menuPerms.selectMenu", { defaultValue: "Select Menu" })}
                  onChange={(e) => setSelectedMenuFilter(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.primary.main,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.primary.main,
                      borderWidth: 2,
                    },
                  }}
                >
                  <MenuItem value="all">
                    <em>{t("menuPerms.allMenus", { defaultValue: "All Menus" })}</em>
                  </MenuItem>
                  {allMenuItems.map((menu) => (
                    <MenuItem key={menu.id} value={menu.menu_key}>
                      {menu.menu_title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder={t("menuPerms.searchPlaceholder", { defaultValue: "Search menu items..." })}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "& fieldset": {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                    "&:hover fieldset": {
                      borderColor: theme.palette.primary.main,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.primary.main,
                      borderWidth: 2,
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "primary.main" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label={t("menuPerms.allRoles", { defaultValue: "All Roles" })}
                  onClick={() => setSelectedRole("All")}
                  color={selectedRole === "All" ? "primary" : "default"}
                  variant={selectedRole === "All" ? "filled" : "outlined"}
                  clickable
                  sx={{
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "scale(1.05)",
                      boxShadow: selectedRole === "All" 
                        ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                        : "none",
                    },
                  }}
                />
                {systemRoles.map((roleRow) => {
                  const role = roleRow.role_name;
                  const label = roleRow.role_display_name || roleRow.role_name || role;
                  return (
                  <Chip
                    key={role}
                    label={label}
                    onClick={() => setSelectedRole(role)}
                    color={selectedRole === role ? "primary" : "default"}
                    variant={selectedRole === role ? "filled" : "outlined"}
                    clickable
                    sx={{
                      fontWeight: 600,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        transform: "scale(1.05)",
                        boxShadow: selectedRole === role 
                          ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                          : "none",
                      },
                    }}
                  />
                );
                })}
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Hierarchical permission matrix (tree + View/Add/Edit/Delete/All × roles) */}
      {menuTree.length > 0 ? (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            maxHeight: "calc(100vh - 280px)",
            overflow: "auto",
          }}
        >
          <Table size="small" stickyHeader sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell
                  rowSpan={2}
                  sx={{
                    position: "sticky",
                    left: 0,
                    zIndex: 3,
                    bgcolor: "background.paper",
                    fontWeight: 700,
                    borderRight: `1px solid ${theme.palette.divider}`,
                    verticalAlign: "bottom",
                    minWidth: 240,
                  }}
                >
                  {t("menuPerms.menu", { defaultValue: "Menu" })}
                </TableCell>
                {permissionColumns.map((col) => (
                  <TableCell key={col.key} align="center" sx={{ fontWeight: 700, py: 1, borderBottom: 0 }}>
                    {col.label}
                  </TableCell>
                ))}
                <TableCell rowSpan={2} align="center" sx={{ fontWeight: 700, verticalAlign: "bottom", whiteSpace: "nowrap" }}>
                  {t("menuPerms.active", { defaultValue: "Active" })}
                </TableCell>
                <TableCell rowSpan={2} align="center" sx={{ fontWeight: 700, verticalAlign: "bottom", whiteSpace: "nowrap" }}>
                  {t("menuPerms.staff", { defaultValue: "Staff" })}
                </TableCell>
              </TableRow>
              <TableRow>
                {permissionColumns.map((col) => (
                  <TableCell key={`${col.key}-roles`} align="center" sx={{ py: 0.5, pt: 0, borderTop: 0 }}>
                    <Stack direction="row" spacing={0.25} justifyContent="center" alignItems="center" flexWrap="wrap" useFlexGap>
                      {systemRoles.map((roleRow) => {
                        const role = roleRow.role_name;
                        const short =
                          (roleRow.role_display_name || role || "").trim().charAt(0).toUpperCase() ||
                          "?";
                        return (
                        <Tooltip key={role} title={roleRow.role_display_name || role} arrow>
                          <Typography
                            variant="caption"
                            component="span"
                            sx={{
                              width: 18,
                              textAlign: "center",
                              fontWeight: 700,
                              color: "text.secondary",
                              fontSize: "0.65rem",
                            }}
                          >
                            {short}
                          </Typography>
                        </Tooltip>
                        );
                      })}
                    </Stack>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>{menuTree.flatMap((node) => renderPermissionTableRows(node, 0))}</TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              No menu permissions found. Run the menu migration or check your database connection.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Employee Permissions Dialog */}
      <Dialog
        open={employeePermissionsDialog}
        onClose={() => setEmployeePermissionsDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Employee Permissions</Typography>
            <Button
              size="small"
              onClick={() => setEmployeePermissionsDialog(false)}
            >
              {t("common.close", { defaultValue: "Close" })}
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedMenuId && (
            <EmployeePermissionsManager
              menuId={selectedMenuId}
              employees={employees}
              employeePermissions={employeeMenuPermissionsData}
              onSave={async (employeePerms) => {
                try {
                  const result = await bulkUpdateEmployeePermissions({
                    menuPermissionId: selectedMenuId,
                    employeePermissions: employeePerms,
                  });
                  if (result.success) {
                    setSnackbar({
                      open: true,
                      message: t("menuPerms.employeePermsUpdated", {
                        defaultValue: "Employee permissions updated successfully",
                      }),
                      severity: "success",
                    });
                    refetchEmployeePermissions();
                  }
                } catch (error) {
                  setSnackbar({
                    open: true,
                    message:
                      error.message ||
                      t("menuPerms.failedToUpdateEmployeePerms", {
                        defaultValue: "Failed to update employee permissions",
                      }),
                    severity: "error",
                  });
                }
              }}
              loading={updatingEmployeePermissions}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Employee Permissions Manager Component
const EmployeePermissionsManager = ({ menuId, employees, employeePermissions, onSave, loading }) => {
  const [localPermissions, setLocalPermissions] = useState({});
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (employeePermissions) {
      const data = Array.isArray(employeePermissions) 
        ? employeePermissions 
        : employeePermissions?.Result || [];
      
      const perms = {};
      data.forEach((ep) => {
        perms[ep.employee_id] = {
          view_permission: ep.view_permission || false,
          add_permission: ep.add_permission || false,
          edit_permission: ep.edit_permission || false,
          delete_permission: ep.delete_permission || false,
          all_permission: ep.all_permission || false,
        };
      });
      setLocalPermissions(perms);
    }
  }, [employeePermissions]);

  const handlePermissionToggle = (employeeId, permissionType) => {
    setLocalPermissions((prev) => {
      const current = prev[employeeId] || {
        view_permission: false,
        add_permission: false,
        edit_permission: false,
        delete_permission: false,
        all_permission: false,
      };
      return {
        ...prev,
        [employeeId]: {
          ...current,
          [permissionType]: !current[permissionType],
        },
      };
    });
  };

  const handleSave = () => {
    const employeePerms = Object.keys(localPermissions).map((employeeId) => ({
      employee_id: parseInt(employeeId),
      ...localPermissions[employeeId],
    }));
    onSave(employeePerms);
  };

  const filteredEmployees = employees.filter((emp) => {
    const searchLower = searchText.toLowerCase();
    const empName = (emp.employeeName || '').toString().toLowerCase();
    const empId = (emp.EMPID || '').toString().toLowerCase();
    return empName.includes(searchLower) || empId.includes(searchLower);
  });

  const permissionTypes = [
    { key: 'view_permission', label: 'View', color: 'info' },
    { key: 'add_permission', label: 'Add', color: 'success' },
    { key: 'edit_permission', label: 'Edit', color: 'warning' },
    { key: 'delete_permission', label: 'Delete', color: 'error' },
    { key: 'all_permission', label: 'All', color: 'primary' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search employees..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
          startIcon={<Save />}
        >
          {loading ? "Saving..." : "Save Employee Permissions"}
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              {permissionTypes.map((pt) => (
                <TableCell key={pt.key} align="center">
                  <Chip label={pt.label} size="small" color={pt.color} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.map((employee) => {
              const perm = localPermissions[employee.id] || {
                view_permission: false,
                add_permission: false,
                edit_permission: false,
                delete_permission: false,
                all_permission: false,
              };
              return (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {employee.employeeName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {employee.EMPID}
                      </Typography>
                    </Box>
                  </TableCell>
                  {permissionTypes.map((pt) => (
                    <TableCell key={pt.key} align="center">
                      <Checkbox
                        checked={perm[pt.key]}
                        onChange={() => handlePermissionToggle(employee.id, pt.key)}
                        color={pt.color}
                        size="small"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MenuPermissions;
