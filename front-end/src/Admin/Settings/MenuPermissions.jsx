import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Chip,
  Stack,
  Paper,
  TextField,
  InputAdornment,
  Checkbox,
  FormGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Grid,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  alpha,
  useTheme,
  Fade,
  Zoom,
} from "@mui/material";
import {
  Save,
  Refresh,
  Settings,
  Search,
  Lock,
  LockOpen,
  CheckCircle,
  Cancel,
  People,
  PersonAdd,
  ExpandMore,
  ExpandLess,
  ChevronRight,
} from "@mui/icons-material";
import { apiService } from "../../services/api";
import { useApi, useMutation } from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";
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

const MenuPermissions = () => {
  const theme = useTheme();
  const { roles } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedMenuFilter, setSelectedMenuFilter] = useState("all");
  const [permissions, setPermissions] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [employeePermissionsDialog, setEmployeePermissionsDialog] = useState(false);
  const [employeePermissions, setEmployeePermissions] = useState({});
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState({});

  // Available roles
  const availableRoles = ["Admin", "HR", "TL", "Employee"];

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

  // Initialize permissions state
  useEffect(() => {
    if (menuPermissionsData) {
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
    }
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
    
    // Filter by role
    if (selectedRole !== "All") {
      filtered = filtered.filter((item) => {
        const allowedRoles = Array.isArray(item.allowed_roles) 
          ? item.allowed_roles 
          : typeof item.allowed_roles === 'string' 
            ? JSON.parse(item.allowed_roles) 
            : [];
        return allowedRoles.includes(selectedRole);
      });
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
  }, [menuPermissionsData, searchText, selectedRole, selectedMenuFilter]);

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
        message: "No changes to save",
        severity: "info",
      });
      return;
    }

    try {
      const result = await bulkUpdatePermissions({ permissions: updates });
      if (result.success) {
        setSnackbar({
          open: true,
          message: `Successfully updated ${updates.length} menu permission(s)`,
          severity: "success",
        });
        setHasChanges(false);
        refetch();
      } else {
        setSnackbar({
          open: true,
          message: result.error || "Failed to update permissions",
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || "Failed to update permissions",
        severity: "error",
      });
    }
  };

  const handleReset = () => {
    if (menuPermissionsData) {
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
    }
  };

  // Render tree node recursively
  const renderTreeNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.menu_key] || false;
    const perm = permissions[node.id] || {
      allowed_roles: parseJsonField(node.allowed_roles),
      view_permission: parseJsonField(node.view_permission),
      add_permission: parseJsonField(node.add_permission),
      edit_permission: parseJsonField(node.edit_permission),
      delete_permission: parseJsonField(node.delete_permission),
      all_permission: parseJsonField(node.all_permission),
      is_active: node.is_active !== undefined ? node.is_active : true,
    };
    
    const permissionTypes = [
      { key: 'view_permission', label: 'View', color: 'info' },
      { key: 'add_permission', label: 'Add', color: 'success' },
      { key: 'edit_permission', label: 'Edit', color: 'warning' },
      { key: 'delete_permission', label: 'Delete', color: 'error' },
      { key: 'all_permission', label: 'All', color: 'primary' },
    ];

    return (
      <Fade in={true} timeout={300}>
        <Box key={node.id} sx={{ mb: 2 }}>
          <Card
            elevation={0}
            sx={{
              background: perm.is_active 
                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`
                : alpha(theme.palette.grey[50], 0.5),
              border: `2px solid ${perm.is_active 
                ? alpha(theme.palette.primary.main, 0.2) 
                : alpha(theme.palette.grey[300], 0.5)}`,
              borderRadius: 3,
              opacity: perm.is_active ? 1 : 0.6,
              ml: level * 4,
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: perm.is_active ? 4 : 0,
                background: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
                transition: "width 0.3s ease",
              },
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                borderColor: perm.is_active 
                  ? alpha(theme.palette.primary.main, 0.4) 
                  : alpha(theme.palette.grey[400], 0.5),
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Header with expand/collapse */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
                  {hasChildren && (
                    <IconButton
                      size="small"
                      onClick={() => toggleNode(node.menu_key)}
                      sx={{
                        p: 1,
                        bgcolor: isExpanded 
                          ? alpha(theme.palette.primary.main, 0.1) 
                          : "transparent",
                        color: isExpanded ? "primary.main" : "text.secondary",
                        border: `1px solid ${isExpanded 
                          ? alpha(theme.palette.primary.main, 0.3) 
                          : alpha(theme.palette.grey[300], 0.5)}`,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.15),
                          borderColor: theme.palette.primary.main,
                          transform: "scale(1.1)",
                        },
                      }}
                    >
                      {isExpanded ? <ExpandLess /> : <ChevronRight />}
                    </IconButton>
                  )}
                  {!hasChildren && <Box sx={{ width: 40 }} />}
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="h6" 
                      fontWeight={700}
                      sx={{
                        background: perm.is_active 
                          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                          : "none",
                        backgroundClip: perm.is_active ? "text" : "unset",
                        WebkitBackgroundClip: perm.is_active ? "text" : "unset",
                        WebkitTextFillColor: perm.is_active ? "transparent" : "inherit",
                        mb: 0.5,
                        fontSize: "1.1rem",
                      }}
                    >
                      {node.menu_title}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{
                        color: "text.secondary",
                        fontFamily: "monospace",
                        bgcolor: alpha(theme.palette.grey[200], 0.5),
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        display: "inline-block",
                      }}
                    >
                      {node.menu_path || node.menu_key}
                    </Typography>
                  </Box>
                </Box>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<People />}
                    onClick={() => {
                      setSelectedMenuId(node.id);
                      setEmployeePermissionsDialog(true);
                      refetchEmployeePermissions();
                    }}
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      px: 2,
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      color: "primary.main",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        transform: "translateY(-1px)",
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    Employees
                  </Button>
                  <Chip
                    icon={perm.is_active ? <CheckCircle /> : <Cancel />}
                    label={perm.is_active ? "Active" : "Inactive"}
                    color={perm.is_active ? "success" : "default"}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      "& .MuiChip-icon": {
                        fontSize: "1rem",
                      },
                    }}
                  />
                  <Switch
                    checked={perm.is_active}
                    onChange={() => handleActiveToggle(node.id)}
                    size="small"
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: theme.palette.success.main,
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                        backgroundColor: theme.palette.success.main,
                      },
                    }}
                  />
                </Stack>
              </Box>
              
              <Divider 
                sx={{ 
                  my: 3,
                  background: `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.primary.main, 0.2)} 50%, transparent 100%)`,
                  height: 1,
                }} 
              />
              
              {/* Permission Types */}
              <Grid container spacing={3}>
                {permissionTypes.map((permType, idx) => (
                  <Grid item xs={12} md={6} key={permType.key}>
                    <Zoom in={true} timeout={300 + idx * 100}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette[permType.color].main, 0.05),
                          border: `1px solid ${alpha(theme.palette[permType.color].main, 0.2)}`,
                          transition: "all 0.2s ease",
                          "&:hover": {
                            bgcolor: alpha(theme.palette[permType.color].main, 0.08),
                            borderColor: alpha(theme.palette[permType.color].main, 0.4),
                            transform: "translateY(-2px)",
                            boxShadow: `0 4px 12px ${alpha(theme.palette[permType.color].main, 0.15)}`,
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                          <Chip 
                            label={permType.label} 
                            size="small" 
                            color={permType.color}
                            sx={{ 
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              height: 28,
                            }}
                          />
                          <Typography variant="body2" fontWeight={600} color="text.secondary">
                            Permissions
                          </Typography>
                        </Box>
                        <FormGroup>
                          {availableRoles.map((role) => {
                            const isChecked = (perm[permType.key] || []).includes(role);
                            return (
                              <FormControlLabel
                                key={role}
                                control={
                                  <Checkbox
                                    checked={isChecked}
                                    onChange={() => handleRoleToggle(node.id, role, permType.key)}
                                    size="small"
                                    disabled={!perm.is_active}
                                    sx={{
                                      "&.Mui-checked": {
                                        color: theme.palette[permType.color].main,
                                      },
                                    }}
                                  />
                                }
                                label={
                                  <Chip
                                    label={role}
                                    size="small"
                                    sx={{
                                      height: 26,
                                      fontSize: "0.7rem",
                                      fontWeight: isChecked ? 600 : 400,
                                      bgcolor: isChecked 
                                        ? alpha(theme.palette[permType.color].main, 0.15)
                                        : "transparent",
                                      color: isChecked 
                                        ? theme.palette[permType.color].main
                                        : "text.secondary",
                                      border: `1px solid ${isChecked 
                                        ? alpha(theme.palette[permType.color].main, 0.3)
                                        : alpha(theme.palette.grey[300], 0.5)}`,
                                      transition: "all 0.2s ease",
                                      "&:hover": {
                                        borderColor: theme.palette[permType.color].main,
                                        transform: "scale(1.05)",
                                      },
                                    }}
                                  />
                                }
                                sx={{
                                  mb: 0.5,
                                  "&:hover": {
                                    "& .MuiFormControlLabel-label": {
                                      transform: "translateX(4px)",
                                    },
                                  },
                                  transition: "all 0.2s ease",
                                }}
                              />
                            );
                          })}
                        </FormGroup>
                      </Paper>
                    </Zoom>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        
          {/* Render children */}
          {hasChildren && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 2, ml: 1 }}>
                {node.children.map((child) => renderTreeNode(child, level + 1))}
              </Box>
            </Collapse>
          )}
        </Box>
      </Fade>
    );
  };

  if (loading) {
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
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    mb: 0.5,
                  }}
                >
                  Menu Permissions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Configure which menu items are visible to different user roles and employees
                </Typography>
              </Box>
            </Box>
            {hasChanges && (
              <Chip
                icon={<CheckCircle />}
                label="Unsaved Changes"
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
              Refresh
            </Button>
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={!hasChanges}
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
              Reset
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
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                "&:hover:not(:disabled)": {
                  background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                  transform: "translateY(-2px)",
                  boxShadow: `0 6px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
                "&:disabled": {
                  background: alpha(theme.palette.grey[400], 0.3),
                },
                transition: "all 0.3s ease",
              }}
            >
              {updating ? "Saving..." : "Save Changes"}
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
                  label="Select Menu"
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
                    <em>All Menus</em>
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
                placeholder="Search menu items..."
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
                  label="All Roles"
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
                {availableRoles.map((role) => (
                  <Chip
                    key={role}
                    label={role}
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
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Menu Permissions Tree */}
      {menuTree.length > 0 ? (
        <Box>
          {menuTree.map((node) => renderTreeNode(node, 0))}
        </Box>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              No menu permissions found. Please run the migration to create the menu_permissions table.
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
              Close
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
                      message: "Employee permissions updated successfully",
                      severity: "success",
                    });
                    refetchEmployeePermissions();
                  }
                } catch (error) {
                  setSnackbar({
                    open: true,
                    message: error.message || "Failed to update employee permissions",
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
