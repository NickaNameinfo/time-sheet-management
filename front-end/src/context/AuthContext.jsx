import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api.js";
import { refetchAppThemeFromAuth } from "./appThemeRefetch";

const AuthContext = createContext(null);

/** Align JWT/dashboard role strings with hasRole() checks (HR, Admin, TL, …) */
function normalizeRolesFromDashboard(role) {
  let roleArray = [];
  if (Array.isArray(role)) {
    roleArray = role.map((r) => String(r ?? "").trim()).filter(Boolean);
  } else if (typeof role === "string") {
    roleArray = role.split(",").map((r) => r.trim()).filter(Boolean);
  }
  return roleArray.map((r) => {
    const normalized = String(r).toLowerCase();
    if (normalized === "hr") return "HR";
    if (normalized === "tl" || normalized === "teamlead") return "TL";
    if (normalized === "admin") return "Admin";
    if (normalized === "employee") return "Employee";
    if (normalized === "company_admin" || normalized === "company_user") return normalized;
    return r;
  });
}

/**
 * Company portal JWT always sends role "admin"; use company_role for real access checks and sidebar.
 */
function sessionRolesFromDashboard(userData) {
  if (userData?.isCompanyUser && userData?.company_role) {
    const cr = String(userData.company_role).toLowerCase();
    const employeeTableRole = String(userData?.employee_table_role || "").trim();
    const menuRole = String(userData?.company_menu_role || "").trim();
    const effectiveCompanyRole = employeeTableRole || menuRole;
    if (cr === "company_admin") return effectiveCompanyRole ? [effectiveCompanyRole, "Admin", "company_admin"] : ["Admin", "company_admin"];
    if (cr === "company_user") return effectiveCompanyRole ? [effectiveCompanyRole, "company_user"] : ["company_user"];
    return effectiveCompanyRole ? [effectiveCompanyRole, "company_user"] : ["company_user"];
  }
  return normalizeRolesFromDashboard(userData?.role);
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiService.dashboard(token);
      // Handle both response structures: response.data.Result or response.data directly
      const userData = response.data.Result || response.data;
      const status = response.data.Status || (userData ? "Success" : null);
      
      if (status === "Success" && userData) {
        const resolvedEmployeePk = userData.employeeRecordId ?? userData.id;
        setUser({
          id: resolvedEmployeePk,
          employeeRecordId: userData.employeeRecordId ?? userData.id,
          userName: userData.userName,
          employeeName: userData.employeeName,
          employeeId: userData.employeeId,
          role: userData.role,
          tlName: userData.tlName,
          hrName: userData.hrName,
          designation: userData.designation,
          discipline: userData.discipline,
          dateOfJoining: userData.dateOfJoining,
          employeeStatus: userData.employeeStatus,
          employeeImage: userData.employeeImage,
          employeeAddress: userData.employeeAddress,
          employeePhone: userData.employeePhone,
          employeeEmail: userData.employeeEmail,
          employeeDepartment: userData.employeeDepartment,
          employeeDesignation: userData.employeeDesignation,
          employeeDiscipline: userData.employeeDiscipline,
          isCompanyUser: !!userData.isCompanyUser,
          company_id: userData.company_id,
          company_user_id: userData.company_user_id,
          company_role: userData.company_role,
          company_menu_role: userData.company_menu_role,
          employee_table_role: userData.employee_table_role,
          company_name: userData.company_name,
          company_code: userData.company_code,
        });
        setRoles(sessionRolesFromDashboard(userData));
        setIsAuthenticated(true);
        refetchAppThemeFromAuth();
      } else {
        logout();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (loginData, loginType = "employee") => {
    try {
      // Call appropriate login API based on login type
      let response;
      if (loginType === "hr") {
        response = await apiService.hrLogin(loginData);
      } else if (loginType === "teamLead" || loginType === "tl") {
        response = await apiService.teamLeadLogin(loginData);
      } else if (loginType === "admin") {
        response = await apiService.adminLogin(loginData);
      } else {
        response = await apiService.login(loginData);
      }

      // Extract token from response
      const token = response.data?.Result?.token || 
                    response.data?.Result?.tokensss || 
                    response.data?.token || 
                    response.data?.tokensss;
      
      if (!token) {
        return {
          success: false,
          error: response.data?.Error || "Login failed - no token received",
        };
      }

      localStorage.setItem("token", token);

      // Get user details from dashboard
      const dashboardResponse = await apiService.dashboard(token);
      const apiRespone = dashboardResponse.data?.Result || dashboardResponse.data;
      
      if (apiRespone !== null && apiRespone !== undefined) {
        const resolvedEmployeePk = apiRespone.employeeRecordId ?? apiRespone.id;
        setUser({
          id: resolvedEmployeePk,
          employeeRecordId: apiRespone.employeeRecordId ?? apiRespone.id,
          userName: apiRespone.userName,
          employeeName: apiRespone.employeeName,
          employeeId: apiRespone.employeeId,
          role: apiRespone.role,
          tlName: apiRespone.tlName,
          hrName: apiRespone.hrName,
          designation: apiRespone.designation,
          discipline: apiRespone.discipline,
          dateOfJoining: apiRespone.dateOfJoining,
          isCompanyUser: !!apiRespone.isCompanyUser,
          company_id: apiRespone.company_id,
          company_user_id: apiRespone.company_user_id,
          company_role: apiRespone.company_role,
          company_menu_role: apiRespone.company_menu_role,
          employee_table_role: apiRespone.employee_table_role,
          company_name: apiRespone.company_name,
          company_code: apiRespone.company_code,
        });
        
        setRoles(sessionRolesFromDashboard(apiRespone));
        setIsAuthenticated(true);
        refetchAppThemeFromAuth();
        return { success: true };
      }

      return {
        success: false,
        error: response.data?.Error || "Login failed",
      };
    } catch (error) {
      const isAccessDenied = error.response?.status === 403;
      return {
        success: false,
        error:
          error.response?.data?.Error ||
          error.response?.data?.error ||
          "Login failed. Please try again.",
        accessDenied: isAccessDenied,
      };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
      setRoles(null);
      setIsAuthenticated(false);
      navigate("/");
      refetchAppThemeFromAuth();
    }
  };

  const hasRole = (role) => {
    return roles?.includes(role) || false;
  };

  const isAdmin = () => hasRole("Admin");
  const isHR = () => hasRole("HR");
  const isTeamLead = () => hasRole("TL") || hasRole("teamLead");
  const isEmployee = () => hasRole("Employee");

  /** Company profile login: admin can request new logins; company_user cannot */
  const isCompanyAdmin = () => {
    if (!user?.isCompanyUser) return false;
    if (user.company_role === "company_user") return false;
    return true;
  };

  const value = {
    user,
    roles,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    hasRole,
    isAdmin,
    isHR,
    isTeamLead,
    isEmployee,
    isCompanyAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

