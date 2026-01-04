import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "./useApi";
import { apiService } from "../services/api";

/**
 * Custom hook to check menu permissions
 * @param {string} menuPath - The menu path to check
 * @param {string} menuKey - The menu key to check (alternative to path)
 * @param {string} permissionType - Type of permission: 'view', 'add', 'edit', 'delete', 'all'
 * @returns {Object} - { hasPermission: boolean, loading: boolean, error: any }
 */
export const useMenuPermission = (menuPath, menuKey, permissionType = 'view') => {
  const { roles, user } = useAuth();
  
  // Fetch menu permissions
  const { data: menuPermissionsData, loading, error } = useApi(
    () => apiService.getMenuPermissions(),
    []
  );

  // Fetch employee permissions for current user
  const currentEmployeeId = user?.employeeId || user?.id;
  const { data: employeePermissionsData } = useApi(
    () => {
      if (!currentEmployeeId || !menuPermissionsData) return null;
      const data = Array.isArray(menuPermissionsData) 
        ? menuPermissionsData 
        : menuPermissionsData?.Result || [];
      const menuItem = data.find(
        (item) => item.menu_path === menuPath || item.menu_key === menuKey
      );
      return menuItem ? apiService.getEmployeeMenuPermissions({ menuPermissionId: menuItem.id, employeeId: currentEmployeeId }) : null;
    },
    [currentEmployeeId, menuPath, menuKey, menuPermissionsData]
  );

  // Normalize roles
  const normalizedRoles = useMemo(() => {
    if (!roles || !Array.isArray(roles)) return [];
    return roles.map(role => role?.trim()).filter(Boolean);
  }, [roles]);

  // Create permission map
  const permissionMap = useMemo(() => {
    if (!menuPermissionsData) return {};
    const data = Array.isArray(menuPermissionsData) 
      ? menuPermissionsData 
      : menuPermissionsData?.Result || [];
    
    const map = {};
    data.forEach((item) => {
      if (item.is_active) {
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

        const permissionKey = item.menu_path || item.menu_key;
        if (permissionKey) {
          map[permissionKey] = {
            view_permission: parseJsonField(item.view_permission),
            add_permission: parseJsonField(item.add_permission),
            edit_permission: parseJsonField(item.edit_permission),
            delete_permission: parseJsonField(item.delete_permission),
            all_permission: parseJsonField(item.all_permission),
            is_active: item.is_active,
          };
        }
        if (item.menu_key) {
          map[item.menu_key] = {
            view_permission: parseJsonField(item.view_permission),
            add_permission: parseJsonField(item.add_permission),
            edit_permission: parseJsonField(item.edit_permission),
            delete_permission: parseJsonField(item.delete_permission),
            all_permission: parseJsonField(item.all_permission),
            is_active: item.is_active,
          };
        }
      }
    });
    return map;
  }, [menuPermissionsData]);

  // Check permission
  const hasPermission = useMemo(() => {
    const perm = permissionMap[menuPath] || permissionMap[menuKey];
    if (!perm || !perm.is_active) return false;

    // Check role-based permissions first
    const hasAllRolePermission = normalizedRoles.some((userRole) =>
      perm.all_permission?.some((role) =>
        userRole?.toLowerCase() === role?.toLowerCase()
      )
    );
    if (hasAllRolePermission) return true;

    const permissionField = `${permissionType}_permission`;
    const allowedRoles = perm[permissionField] || [];
    const hasRolePermission = normalizedRoles.some((userRole) =>
      allowedRoles.some((role) =>
        userRole?.toLowerCase() === role?.toLowerCase()
      )
    );

    // Check employee-based permissions
    if (employeePermissionsData && currentEmployeeId) {
      const empPerms = Array.isArray(employeePermissionsData) 
        ? employeePermissionsData 
        : employeePermissionsData?.Result || [];
      const empPerm = empPerms.find((ep) => ep.employee_id === currentEmployeeId);
      
      if (empPerm) {
        // Check if employee has "all" permission
        if (empPerm.all_permission) return true;
        // Check specific permission type
        if (empPerm[permissionField]) return true;
      }
    }

    return hasRolePermission;
  }, [permissionMap, menuPath, menuKey, permissionType, normalizedRoles, employeePermissionsData, currentEmployeeId]);

  return {
    hasPermission,
    loading,
    error,
  };
};

/**
 * Hook to get all permissions for a menu item
 */
export const useMenuPermissions = (menuPath, menuKey) => {
  const { roles, user } = useAuth();
  
  const { data: menuPermissionsData, loading, error } = useApi(
    () => apiService.getMenuPermissions(),
    []
  );

  const currentEmployeeId = user?.employeeId || user?.id;
  const { data: employeePermissionsData } = useApi(
    () => {
      if (!currentEmployeeId || !menuPermissionsData) return null;
      const data = Array.isArray(menuPermissionsData) 
        ? menuPermissionsData 
        : menuPermissionsData?.Result || [];
      const menuItem = data.find(
        (item) => item.menu_path === menuPath || item.menu_key === menuKey
      );
      return menuItem ? apiService.getEmployeeMenuPermissions({ menuPermissionId: menuItem.id, employeeId: currentEmployeeId }) : null;
    },
    [currentEmployeeId, menuPath, menuKey, menuPermissionsData]
  );

  const normalizedRoles = useMemo(() => {
    if (!roles || !Array.isArray(roles)) return [];
    return roles.map(role => role?.trim()).filter(Boolean);
  }, [roles]);

  const permissions = useMemo(() => {
    if (!menuPermissionsData) return {};
    const data = Array.isArray(menuPermissionsData) 
      ? menuPermissionsData 
      : menuPermissionsData?.Result || [];
    
    const item = data.find(
      (item) => item.menu_path === menuPath || item.menu_key === menuKey
    );
    
    if (!item || !item.is_active) {
      return {
        canView: false,
        canAdd: false,
        canEdit: false,
        canDelete: false,
        canAll: false,
      };
    }

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

    const checkPermission = (permissionField) => {
      // Check role-based permissions
      const allowedRoles = parseJsonField(item[permissionField]) || [];
      const allRoles = parseJsonField(item.all_permission) || [];
      
      const hasAllRole = normalizedRoles.some((userRole) =>
        allRoles.some((role) => userRole?.toLowerCase() === role?.toLowerCase())
      );
      if (hasAllRole) return true;
      
      const hasRolePermission = normalizedRoles.some((userRole) =>
        allowedRoles.some((role) => userRole?.toLowerCase() === role?.toLowerCase())
      );

      // Check employee-based permissions
      if (employeePermissionsData && currentEmployeeId) {
        const empPerms = Array.isArray(employeePermissionsData) 
          ? employeePermissionsData 
          : employeePermissionsData?.Result || [];
        const empPerm = empPerms.find((ep) => ep.employee_id === currentEmployeeId);
        
        if (empPerm) {
          if (empPerm.all_permission) return true;
          if (empPerm[permissionField]) return true;
        }
      }

      return hasRolePermission;
    };

    return {
      canView: checkPermission('view_permission'),
      canAdd: checkPermission('add_permission'),
      canEdit: checkPermission('edit_permission'),
      canDelete: checkPermission('delete_permission'),
      canAll: checkPermission('all_permission'),
    };
  }, [menuPermissionsData, menuPath, menuKey, normalizedRoles, employeePermissionsData, currentEmployeeId]);

  return {
    permissions,
    loading,
    error,
  };
};
