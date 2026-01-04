import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api.js";

const AuthContext = createContext(null);

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
        setUser({
          id: userData.id,
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
        });
        // Normalize roles - split by comma, trim whitespace, filter empty
        const roleString = userData.role || "";
        const roleArray = roleString.split(",")
          .map(role => role.trim())
          .filter(role => role.length > 0);
        setRoles(roleArray);
        setIsAuthenticated(true);
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
        setUser({
          id: apiRespone.id,
          userName: apiRespone.userName,
          employeeName: apiRespone.employeeName,
          employeeId: apiRespone.employeeId,
          role: apiRespone.role,
          tlName: apiRespone.tlName,
          hrName: apiRespone.hrName,
          designation: apiRespone.designation,
          discipline: apiRespone.discipline,
          dateOfJoining: apiRespone.dateOfJoining,
        });
        
        // Normalize roles - handle both string and array formats
        let roleArray = [];
        if (Array.isArray(apiRespone.role)) {
          roleArray = apiRespone.role.map(role => role?.trim()).filter(role => role.length > 0);
        } else if (typeof apiRespone.role === 'string') {
          roleArray = apiRespone.role.split(",")
            .map(role => role.trim())
            .filter(role => role.length > 0);
        }
        
        // Normalize role case: convert "hr" to "HR", "tl" to "TL", etc.
        roleArray = roleArray.map(role => {
          const normalized = role.toLowerCase();
          if (normalized === 'hr') return 'HR';
          if (normalized === 'tl' || normalized === 'teamlead') return 'TL';
          if (normalized === 'admin') return 'Admin';
          if (normalized === 'employee') return 'Employee';
          return role; // Keep original if not recognized
        });
        
        setRoles(roleArray);
        setIsAuthenticated(true);
        return { success: true };
      }

      return {
        success: false,
        error: response.data?.Error || "Login failed",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.Error ||
          error.response?.data?.error ||
          "Login failed. Please try again.",
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
    }
  };

  const hasRole = (role) => {
    return roles?.includes(role) || false;
  };

  const isAdmin = () => hasRole("Admin");
  const isHR = () => hasRole("HR");
  const isTeamLead = () => hasRole("TL") || hasRole("teamLead");
  const isEmployee = () => hasRole("Employee");

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

