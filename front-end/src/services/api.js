import axios from "axios";
import config from "../config/index.js";

// Create axios instance
const api = axios.create({
  baseURL: config.apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // For endpoints that expect token in body (like /dashboard)
      if (config.method === "post" && config.url?.includes("/dashboard")) {
        config.data = { ...config.data, tokensss: token };
      }
      // For other POST/PUT/DELETE requests that require auth, add token to body
      // The backend verifyUser middleware checks req.body.tokensss, req.cookies.token, or Authorization header
      else if (["post", "put", "delete"].includes(config.method?.toLowerCase())) {
        // Add token to request body for POST/PUT/DELETE
        if (config.data && typeof config.data === "object" && !(config.data instanceof FormData)) {
          config.data = { ...config.data, tokensss: token };
        }
      }
      // Also add to Authorization header as fallback
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 429 Too Many Requests - Rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers["retry-after"] || 60;
      const errorMessage = error.response?.data?.Error || "Too many requests. Please wait a moment and try again.";
      console.warn(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
      
      // Show user-friendly error
      if (error.response?.data?.Error) {
        error.rateLimitError = true;
        error.retryAfter = retryAfter;
      }
    }

    // Handle 401 Unauthorized - Token expired or invalid
    // Only logout on 401 if it's not from a public endpoint
    if (error.response?.status === 401) {
      const publicEndpoints = ["/settings", "/discipline", "/designation", "/areaofwork", "/variation"];
      const isPublicEndpoint = publicEndpoints.some(endpoint => 
        error.config?.url?.includes(endpoint)
      );
      
      // Only logout if it's not a public endpoint
      if (!isPublicEndpoint) {
        // Clear token and redirect to login
        localStorage.removeItem("token");
        if (window.location.pathname !== "/" && !window.location.pathname.includes("/login")) {
          window.location.href = "/";
        }
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error("Network Error:", error.message);
    }

    return Promise.reject(error);
  }
);

// API service methods
export const apiService = {
  // Authentication
  login: (data) => api.post("/employeelogin", data),
  adminLogin: (data) => api.post("/login", data),
  teamLeadLogin: (data) => api.post("/teamLeadlogin", data),
  hrLogin: (data) => api.post("/hrLogin", data),
  dashboard: (token) => api.post("/dashboard", { tokensss: token }),
  logout: () => api.get("/logout"),

  // Employee
  getEmployees: () => api.get("/getEmployee"),
  getEmployee: (id) => api.get(`/get/${id}`),
  createEmployee: (data) => {
    // If data is already FormData, use it directly
    if (data instanceof FormData) {
      return api.post("/create", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    // Otherwise, convert to FormData
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.post("/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  updateEmployee: (id, data) => {
    // If data is already FormData, use it directly
    if (data instanceof FormData) {
      return api.put(`/update/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    // Otherwise, convert to FormData
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.put(`/update/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteEmployee: (id) => api.delete(`/delete/${id}`),
  getEmployeeCount: () => api.get("/employeeCount"),

  // Leave Management
  applyLeave: (data) => api.post("/applyLeave", data),
  applyCompOff: (data) => api.post("/applycompOff", data),
  getLeaveDetails: (params) => api.get("/getLeaveDetails", { params }),
  getCompOffDetails: (params) => api.get("/getcompOffDetails", { params }),
  updateLeave: (id, data) => api.put(`/updateLeave/${id}`, data),
  updateCompOff: (compOffId, data) => api.put(`/updateCompOff/${compOffId}`, data),
  deleteLeave: (id) => api.delete(`/deleteLeave/${id}`),
  deleteCompOff: (id) => api.delete(`/deletecompOff/${id}`),

  // Project Management
  createProject: (data) => api.post("/project/create", data),
  getProjects: () => api.get("/getProject"),
  getProject: (id) => api.get(`/getProject/${id}`),
  updateProject: (projectId, data) => api.put(`/project/update/${projectId}`, data),
  updateProjectCompletion: (projectId, completion) =>
    api.put(`/project/update/completion/${projectId}`, { completion }),
  deleteProject: (id) => api.delete(`/project/delete/${id}`),
  
  // Project Planning
  createProjectPlan: (data) => api.post("/project-plan/create", data),
  getProjectPlans: (params) => api.get("/project-plan", { params }),
  getProjectPlan: (id) => api.get(`/project-plan/${id}`),
  updateProjectPlan: (id, data) => api.put(`/project-plan/${id}`, data),
  assignEmployeesToPlan: (id, data) => api.put(`/project-plan/${id}/assign-employees`, data),
  getProjectEmployees: (projectId) => api.get(`/project/${projectId}/employees`),
  getEmployeeAssignedProjects: (params) => api.get("/project-plan/employee/assigned", { params }),
  deleteProjectPlan: (id) => api.delete(`/project-plan/${id}`),
  
  addWorkDetails: (data) => api.post("/project/addWorkDetails", data),
  updateWorkDetails: (id, data) => api.put(`/project/updateWorkDetails/${id}`, data),
  getWorkDetails: (params) => api.get("/getWorkDetails", { params }),
  getBioDetails: () => api.get("/getBioDetails"),
  filterTimeSheet: (data) => api.post("/filterTimeSheet", data),
  clockIn: (data) => api.post("/project/workDetails/clockIn", data),
  clockOut: (data) => api.post("/project/workDetails/clockOut", data),
  getTodayClockStatus: (params) => api.get("/getWorkDetails", { params }),

  // CRM Management
  createCrm: (data) => api.post("/crm/create", data),
  getCrmList: (params) => api.get("/crm/list", { params }),
  getCrmSummary: (params) => api.get("/crm/summary", { params }),
  getCrm: (id) => api.get(`/crm/${id}`),
  updateCrm: (id, data) => api.put(`/crm/update/${id}`, data),
  deleteCrm: (id) => api.delete(`/crm/delete/${id}`),

  // Team Lead
  createTeamLead: (data) => api.post("/lead/create", data),
  getTeamLeads: () => api.get("/getLead"),
  deleteTeamLead: (id) => api.delete(`/lead/delete/${id}`),

  // HR
  createHr: (data) => api.post("/hr/create", data),
  getHr: () => api.get("/getHr"),
  deleteHr: (id) => api.delete(`/hr/delete/${id}`),

  // Settings
  getSettings: () => api.get("/settings"),
  createUpdate: (data) => api.post("/create/updates", data),
  deleteUpdate: (id) => api.delete(`/updates/delete/${id}`),
  getDisciplines: () => api.get("/discipline"),
  createDiscipline: (data) => api.post("/create/discipline", data),
  deleteDiscipline: (id) => api.delete(`/discipline/delete/${id}`),
  getDesignations: () => api.get("/designation"),
  
  // Menu Permissions
  getMenuPermissions: (params) => api.get("/menu-permissions", { params }),
  getMenuPermissionsByRole: (role) => api.get("/menu-permissions/role", { params: { role } }),
  getMenuPermissionsByEmployee: () => api.get("/menu-permissions/my-permissions"), // Gets menus for logged-in employee based on their role and employee-specific permissions
  updateMenuPermission: (id, data) => api.put(`/menu-permissions/${id}`, data),
  bulkUpdateMenuPermissions: (data) => api.put("/menu-permissions/admin/bulk", data),
  
  // Employee Menu Permissions
  getEmployeeMenuPermissions: (params) => api.get("/menu-permissions/employee", { params }),
  updateEmployeeMenuPermission: (data) => api.post("/menu-permissions/employee", data),
  bulkUpdateEmployeeMenuPermissions: (data) => api.put("/menu-permissions/employee/bulk", data),
  deleteEmployeeMenuPermission: (params) => api.delete("/menu-permissions/employee", { params }),
  
  // Roles
  getRoles: () => api.get("/roles"),
  createRole: (data) => api.post("/create/role", data),
  updateRole: (id, data) => api.put(`/role/update/${id}`, data),
  deleteRole: (id) => api.delete(`/role/delete/${id}`),
  createDesignation: (data) => api.post("/create/designation", data),
  deleteDesignation: (id) => api.delete(`/designation/delete/${id}`),
  getAreaOfWork: () => api.get("/areaofwork"),
  createAreaOfWork: (data) => api.post("/create/areaofwork", data),
  deleteAreaOfWork: (id) => api.delete(`/areaofwork/delete/${id}`),
  getVariations: () => api.get("/variation"),
  createVariation: (data) => api.post("/create/variation", data),
  deleteVariation: (id) => api.delete(`/variation/delete/${id}`),
  getAdminCount: () => api.get("/adminCount"),

  // Notifications
  sendNotification: (data) => api.post("/sendNotification", data),

  // Phase 1 & 2: Overtime
  getOTRules: (params) => api.get("/overtime/rules", { params }),
  createOTRule: (data) => api.post("/overtime/rules", data),
  calculateOvertime: (data) => api.post("/overtime/calculate", data),
  getOTRecords: (params) => api.get("/overtime/records", { params }),
  approveOT: (id, data) => api.post(`/overtime/approve/${id}`, data),
  bulkInsertOT: (data) => api.post("/overtime/bulk", data),

  // Leave Balance
  getLeaveBalance: (params) => api.get("/leave/balance", { params }),
  initializeLeaveBalance: (data) => api.post("/leave/balance/initialize", data),
  updateLeaveBalance: (data) => api.put("/leave/balance/update", data),
  accrueLeave: (data) => api.post("/leave/accrue", data),
  useLeave: (data) => api.post("/leave/use", data),
  getLeaveAccruals: (params) => api.get("/leave/accruals", { params }),
  uploadLeaveDocument: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.post("/leave/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getLeaveDocuments: (leaveId) => api.get(`/leave/documents/${leaveId}`),

  // Shifts
  getShifts: (params) => api.get("/shifts", { params }),
  createShift: (data) => api.post("/shifts", data),
  updateShift: (id, data) => api.put(`/shifts/${id}`, data),
  deleteShift: (id) => api.delete(`/shifts/${id}`),
  assignShift: (data) => api.post("/shifts/assign", data),
  getShiftAssignments: (params) => api.get("/shifts/assignments", { params }),
  requestShiftSwap: (data) => api.post("/shifts/swap", data),
  approveShiftSwap: (id, data) => api.put(`/shifts/swap/${id}`, data),
  getShiftSwaps: (params) => api.get("/shifts/swaps", { params }),

  // Payroll
  generatePayrollSummary: (params) => api.get("/payroll/summary", { params }),
  exportToTally: (params) => api.get("/payroll/export/tally", { params, responseType: "blob" }),
  exportToQuickBooks: (params) => api.get("/payroll/export/quickbooks", { params, responseType: "blob" }),

  // Budget
  getProjectBudget: (projectId) => api.get(`/projects/${projectId}/budget`),
  setProjectBudget: (projectId, data) => api.post(`/projects/${projectId}/budget`, data),
  updateProjectBudget: (id, data) => api.put(`/projects/budget/${id}`, data),
  deleteProjectBudget: (id) => api.delete(`/projects/budget/${id}`),
  trackProjectCost: (projectId, data) => api.post(`/projects/${projectId}/costs`, data),
  updateProjectCost: (id, data) => api.put(`/projects/costs/${id}`, data),
  deleteProjectCost: (id) => api.delete(`/projects/costs/${id}`),
  getProjectCosts: (projectId, params) => api.get(`/projects/${projectId}/costs`, { params }),
  getBudgetVsActual: (projectId) => api.get(`/projects/${projectId}/budget-vs-actual`),
  getProfitabilityReport: (projectId) => api.get(`/projects/${projectId}/profitability`),

  // Billing
  getClients: (params) => api.get("/clients", { params }),
  createClient: (data) => api.post("/clients", data),
  updateClient: (id, data) => api.put(`/clients/${id}`, data),
  getBillingRates: (params) => api.get("/billing/rates", { params }),
  createBillingRate: (data) => api.post("/billing/rates", data),
  updateBillingRate: (id, data) => api.put(`/billing/rates/${id}`, data),
  deleteBillingRate: (id) => api.delete(`/billing/rates/${id}`),
  generateInvoice: (data) => api.post("/invoices/generate", data),
  getInvoices: (params) => api.get("/invoices", { params }),
  getInvoiceDetails: (id) => api.get(`/invoices/${id}`),
  updateInvoice: (id, data) => api.put(`/invoices/${id}`, data),
  recordPayment: (invoiceId, data) => api.post(`/invoices/${invoiceId}/payments`, data),

  // Productivity
  calculateProductivity: (data) => api.post("/productivity/calculate", data),
  getProductivityMetrics: (params) => api.get("/productivity/metrics", { params }),
  getTeamProductivity: (params) => api.get("/productivity/team", { params }),
  getProductivityTrends: (params) => api.get("/productivity/trends", { params }),

  // Approvals
  getApprovalWorkflows: (params) => api.get("/approvals/workflows", { params }),
  createApprovalWorkflow: (data) => api.post("/approvals/workflows", data),
  approveEntity: (entityType, entityId, data) => api.post(`/approvals/${entityType}/${entityId}`, data),
  getApprovalHistory: (params) => api.get("/approvals/history", { params }),
  getPendingApprovals: (params) => api.get("/approvals/pending", { params }),
  bulkApprove: (data) => api.post("/approvals/bulk", data),

  // Automated Reports
  getReportSchedules: (params) => api.get("/reports/schedules", { params }),
  createReportSchedule: (data) => api.post("/reports/schedules", data),
  updateReportSchedule: (id, data) => api.put(`/reports/schedules/${id}`, data),
  deleteReportSchedule: (id) => api.delete(`/reports/schedules/${id}`),
  generateAndSendReport: (scheduleId) => api.post(`/reports/send/${scheduleId}`),
  generateReport: (params) => api.get("/reports/generate", { params }),
  sendReport: (data) => api.post("/reports/generate", data),

  // App Settings
  getAppSettings: () => api.get("/settings/app-settings"),
  updateAppSettings: (data) => api.put("/settings/app-settings", data),
};

export default api;

