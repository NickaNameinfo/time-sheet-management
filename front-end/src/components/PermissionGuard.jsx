import React from "react";
import { useMenuPermission } from "../hooks/usePermissions";

/**
 * Component to conditionally render children based on menu permissions
 * @param {string} menuPath - The menu path to check
 * @param {string} menuKey - The menu key to check (alternative to path)
 * @param {string} permissionType - Type of permission: 'view', 'add', 'edit', 'delete', 'all'
 * @param {ReactNode} children - Children to render if permission is granted
 * @param {ReactNode} fallback - Optional fallback to render if permission is denied
 */
export const PermissionGuard = ({
  menuPath,
  menuKey,
  permissionType = "view",
  children,
  fallback = null,
}) => {
  const { hasPermission, loading } = useMenuPermission(
    menuPath,
    menuKey,
    permissionType
  );

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!hasPermission) {
    return fallback;
  }

  return <>{children}</>;
};

export default PermissionGuard;
