import React from "react";
import "./i18n";
import Login from "./Login";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./Admin/Dashboard";
import Employee from "./Admin/Employee";
import Projects from "./Admin/Projects";
import ProjectPlanning from "./Admin/ProjectPlanning";
import Profile from "./Employee/Profile";
import Home from "./Admin/Home";
import AddEmployee from "./Admin/AddEmployee";
import AddProject from "./Admin/AddProject";
// import EditEmployee from "./Admin/EditEmployee";
import Start from "./Start";
import EmployeeDetail from "./Employee/EmployeeDetail";
import EmployeeLogin from "./EmployeeLogin";
import TeamLeadLogin from "./TeamLeadLogin";
import EmployeeDashboard from "./Employee/EmployeeDashboard";
import TeamLeadDashboard from "./TeamLead/TeamLeadDashboard";
import EmployeeHome from "./Employee/EmployeeHome";
import TeamLeadHome from "./TeamLead/TeamLeadHome";
// import ProjectsList from "./TeamLead/ProjectsList";
import Leaves from "./Admin/Leaves";
import HrLogin from "./HrLogin";
import HrDashboard from "./Hr/HrDashboard";
import HrHome from "./Hr/HrHome";
import EmployeeHr from "./Hr/EmployeeHr";
import AddEmployeeHr from "./Hr/AddEmployeeHr";
import EditEmployeeHr from "./Hr/EditEmployeeHr";
import AddProjectDetails from "./Employee/addProjectDetails";
import AddLeaveDetails from "./Employee/addLeaveDetails";
import ProjectWorkDetails from "./TeamLead/ProjectWorkDetails";
import TimeManagement from "./Employee/TimeManagement";
import MyPayslips from "./Employee/MyPayslips";
import ProjectReport from "./Admin/Reports/ProjectReport";
import WeeklyReport from "./Admin/Reports/WeeklyReport";
import YearlyReport from "./Admin/Reports/YearlyReport";
import DesciplineCodeReport from "./Admin/Reports/DesciplineCodeReport";
import MonthlyReport from "./Admin/Reports/MonthlyReport";
import LeaveReport from "./Admin/Reports/LeaveReport";
import { Settings } from "./Admin/Settings";
import AddUpdates from "./Admin/AddUpdates";
import { Discipline } from "./Admin/Discipline";
import { Designation } from "./Admin/Designation";
import { Areaofwork } from "./Admin/Areaofwork";
import { Variations } from "./Admin/Variations";
import { Roles } from "./Admin/Roles";
import MenuPermissions from "./Admin/Settings/MenuPermissions";
import OvertimeRules from "./Admin/Settings/OvertimeRules";
import AppSettings from "./Admin/Settings/AppSettings";
import UserAccess from "./Admin/Settings/UserAccess";
import RequestAccess from "./pages/RequestAccess";
import CompOff from "./Employee/CompOff";
import CompOffLIst from "./Admin/compOffLIst";
import ConsolidatedReport from "./Admin/Reports/ConsolidatedReport";
import EmployeeReport from "./Admin/Reports/EmployeeReport";
import AutomatedReports from "./Admin/Reports/AutomatedReports";
// Phase 1 & 2 Components
import OvertimeManagement from "./components/OvertimeManagement";
import LeaveBalance from "./components/LeaveBalance";
import ShiftManagement from "./components/ShiftManagement";
import PayrollExport from "./components/PayrollExport";
import SalaryAndPayslip from "./components/SalaryAndPayslip";
import BudgetTracking from "./components/BudgetTracking";
import BillingManagement from "./components/BillingManagement";
import ProductivityDashboard from "./components/ProductivityDashboard";
import ApprovalCenter from "./components/ApprovalCenter";
// Sales/CRM Components
import AddCrmDate from "./Admin/Sales/AddCrmDate";
import CrmList from "./Admin/Sales/CrmList";
import CrmSummary from "./Admin/Sales/CrmSummary";
import LeadList from "./Admin/Sales/LeadList";
// Investment / KYC
import InvestmentGate from "./pages/Investment/InvestmentGate";
import InvestmentDashboard from "./pages/Investment/InvestmentDashboard";
import KycStatus from "./pages/Investment/KycStatus";
import KycForm from "./pages/Investment/KycForm";
import MySelfReports from "./pages/Investment/MySelfReports";
import InvestmentReports from "./pages/Investment/InvestmentReports";
import UpdateKycStatus from "./pages/Investment/UpdateKycStatus";
import AdminUserReports from "./pages/Investment/AdminUserReports";
import WithdrawalRequests from "./pages/Investment/WithdrawalRequests";
import ReferralEarnings from "./pages/Investment/ReferralEarnings";
import ReferralReports from "./pages/Investment/ReferralReports";
import PrivacyPolicy from "./pages/Legal/PrivacyPolicy";
import TermsAndConditions from "./pages/Legal/TermsAndConditions";
import Support from "./pages/Legal/Support";
import Guidance from "./pages/Legal/Guidance";
import { GuidanceTourProvider } from "./context/GuidanceTourContext";
import SuperAdminHome from "./SuperAdmin/SuperAdminHome";
import SuperAdminNewLeads from "./SuperAdmin/SuperAdminNewLeads";
import SuperAdminCompanies from "./SuperAdmin/SuperAdminCompanies";
import SuperAdminTrailVersions from "./SuperAdmin/SuperAdminTrailVersions";
import SuperAdminCompanyLogins from "./SuperAdmin/SuperAdminCompanyLogins";
import RequestCompanyLogin from "./Admin/RequestCompanyLogin";
import SuperAdminCompanyMenuPermissions from "./SuperAdmin/SuperAdminCompanyMenuPermissions";
import SuperAdminMenuTrailSettings from "./SuperAdmin/SuperAdminMenuTrailSettings";
import SuperAdminCompanyCreate from "./SuperAdmin/SuperAdminCompanyCreate";
import SuperAdminCompanySubscriptions from "./SuperAdmin/SuperAdminCompanySubscriptions";
import SuperAdminCompanyBilling from "./SuperAdmin/SuperAdminCompanyBilling";

/** Public /guidance: full-page for guests; logged-in users go to role-scoped /…/guidance (inside sidebar layout). */
function GuidanceEntryRoute() {
  const { isAuthenticated, roles, loading } = useAuth();
  const location = useLocation();
  const q = location.search || "";

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Guidance />;
  }

  const r = roles || [];
  let to = "/Dashboard/guidance";
  if (r.includes("HR")) to = "/Hr/guidance";
  else if (r.includes("TL") || r.includes("teamLead")) to = "/TeamLead/guidance";
  else if (r.includes("Employee")) to = "/Employee/guidance";
  else if (r.includes("Admin")) to = "/Dashboard/guidance";

  return <Navigate to={`${to}${q}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GuidanceTourProvider>
        <Routes>
        {/* Public Routes - Login Pages */}
        <Route path="/" element={<Start />}></Route>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/employee-login" element={<EmployeeLogin />}></Route>
        <Route path="/teamlead-login" element={<TeamLeadLogin />}></Route>
        <Route path="/hr-login" element={<HrLogin />}></Route>
        {/* Public Routes - Mobile app legal pages & support */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />}></Route>
        <Route path="/terms-and-conditions" element={<TermsAndConditions />}></Route>
        <Route path="/support" element={<Support />}></Route>
        <Route path="/guidance" element={<GuidanceEntryRoute />}></Route>
        <Route path="/request-access" element={<RequestAccess />}></Route>
        
        {/* Protected Routes */}
        <Route path="/Dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
          <Route path="" index element={<Home />}></Route>
          <Route path="/Dashboard/guidance" element={<Guidance />}></Route>
          {/* Super Admin (menus are filtered server-side for super admin email) */}
          <Route path="/Dashboard/SuperAdmin" element={<SuperAdminHome />}></Route>
          <Route path="/Dashboard/SuperAdmin/NewLeads" element={<SuperAdminNewLeads />}></Route>
          <Route path="/Dashboard/SuperAdmin/Companies" element={<SuperAdminCompanies />}></Route>
          <Route path="/Dashboard/SuperAdmin/TrailVersions" element={<SuperAdminTrailVersions />}></Route>
          <Route path="/Dashboard/SuperAdmin/CompanyLogins" element={<SuperAdminCompanyLogins />}></Route>
          <Route path="/Dashboard/company-login-request" element={<RequestCompanyLogin />}></Route>
          <Route path="/Dashboard/SuperAdmin/CompanyMenuPermissions" element={<SuperAdminCompanyMenuPermissions />}></Route>
          <Route path="/Dashboard/SuperAdmin/MenuTrailSettings" element={<SuperAdminMenuTrailSettings />}></Route>
          <Route path="/Dashboard/SuperAdmin/CompanyCreate" element={<SuperAdminCompanyCreate />}></Route>
          <Route path="/Dashboard/SuperAdmin/CompanySubscriptions" element={<SuperAdminCompanySubscriptions />}></Route>
          <Route path="/Dashboard/SuperAdmin/CompanyBilling" element={<SuperAdminCompanyBilling />}></Route>
          <Route path="/Dashboard/employee" element={<Employee />}></Route>
          <Route path="/Dashboard/Settings" element={<Settings />}></Route>
          <Route path="/Dashboard/AddUpdates" element={<AddUpdates />}></Route>
          <Route path="/Dashboard/Discipline" element={<Discipline />}></Route>
          <Route path="/Dashboard/Areaofwork" element={<Areaofwork />}></Route>
          <Route path="/Dashboard/Variations" element={<Variations />}></Route>
          <Route path="/Dashboard/Designation" element={<Designation />}></Route>
          <Route path="/Dashboard/Roles" element={<Roles />}></Route>
          <Route path="/Dashboard/Settings/MenuPermissions" element={<MenuPermissions />}></Route>
          <Route path="/Dashboard/Settings/OvertimeRules" element={<OvertimeRules />}></Route>
          <Route path="/Dashboard/Settings/AppSettings" element={<AppSettings />}></Route>
          <Route path="/Dashboard/Settings/UserAccess" element={<UserAccess />}></Route>
          <Route path="/Dashboard/projects" element={<Projects />}></Route>
          <Route path="/Dashboard/project-planning" element={<ProjectPlanning />}></Route>
          {/* Keep leave approvals in one place: Approval Center */}
          <Route path="/Dashboard/leaves" element={<ApprovalCenter />}></Route>
          <Route path="/Dashboard/CompOffList" element={<CompOffLIst />}></Route>
          <Route path="/Dashboard/profile" element={<Profile />}></Route>
          <Route path="/Dashboard/create/:id?" element={<AddEmployee />}></Route>
          <Route path="/Dashboard/addProject/:id?" element={<AddProject />}></Route>
          <Route path="/Dashboard/Reports/ProjectReport"  element={<ProjectReport />}></Route>
          <Route path="/Dashboard/Reports/ConsolidatedReport"  element={<ConsolidatedReport />}></Route>
          <Route path="/Dashboard/Reports/EmployeeReport"  element={<EmployeeReport />}></Route>
          <Route path="/Dashboard/Reports/WeeklyReport"  element={<WeeklyReport />}></Route>
          <Route path="/Dashboard/Reports/MonthlyReport"  element={<MonthlyReport />}></Route>
          <Route path="/Dashboard/Reports/YearlyReport"  element={<YearlyReport />}></Route>
          <Route path="/Dashboard/Reports/CodeReport"  element={<DesciplineCodeReport />}></Route>
          <Route path="/Dashboard/Reports/LeaveReport"  element={<LeaveReport />}></Route>
          <Route path="/Dashboard/Reports/Automated"  element={<AutomatedReports />}></Route>
          {/* Phase 1 & 2 Routes */}
          <Route path="/Dashboard/Overtime" element={<OvertimeManagement />}></Route>
          <Route path="/Dashboard/LeaveBalance" element={<LeaveBalance />}></Route>
          <Route path="/Dashboard/Shifts" element={<ShiftManagement />}></Route>
          <Route path="/Dashboard/Payroll" element={<PayrollExport />}></Route>
          <Route path="/Dashboard/SalaryPayslip" element={<SalaryAndPayslip />}></Route>
          <Route path="/Dashboard/Budget" element={<BudgetTracking />}></Route>
          <Route path="/Dashboard/Projects/:projectId/Budget" element={<BudgetTracking />}></Route>
          <Route path="/Dashboard/Billing" element={<BillingManagement />}></Route>
          <Route path="/Dashboard/Productivity" element={<ProductivityDashboard />}></Route>
          <Route path="/Dashboard/Approvals" element={<ApprovalCenter />}></Route>
          {/* Sales/CRM Routes */}
          <Route path="/Dashboard/Sales" element={<CrmList />}></Route>
          <Route path="/Dashboard/Sales/AddCrmDate/:id?" element={<AddCrmDate />}></Route>
          <Route path="/Dashboard/Sales/CrmList" element={<CrmList />}></Route>
          <Route path="/Dashboard/Sales/CrmSummary" element={<CrmSummary />}></Route>
          <Route path="/Dashboard/Sales/LeadList" element={<LeadList />}></Route>
          {/* Investment / KYC (My Self auth) */}
          <Route path="/Dashboard/Investment" element={<InvestmentGate><InvestmentDashboard /></InvestmentGate>}></Route>
          <Route path="/Dashboard/Investment/KYC" element={<InvestmentGate><KycStatus /></InvestmentGate>}></Route>
          <Route path="/Dashboard/Investment/KYC/Submit" element={<InvestmentGate><KycForm /></InvestmentGate>}></Route>
          <Route path="/Dashboard/Investment/MySelfReports" element={<InvestmentGate><MySelfReports /></InvestmentGate>}></Route>
          <Route path="/Dashboard/Investment/Reports" element={<InvestmentGate><InvestmentReports /></InvestmentGate>}></Route>
          <Route path="/Dashboard/Investment/UpdateKycStatus" element={<UpdateKycStatus />}></Route>
          <Route path="/Dashboard/Investment/AdminUserReports" element={<AdminUserReports />}></Route>
          <Route path="/Dashboard/Investment/WithdrawalRequests" element={<WithdrawalRequests />}></Route>
          <Route path="/Dashboard/Investment/ReferralEarnings" element={<ReferralEarnings />}></Route>
          <Route path="/Dashboard/Investment/ReferralReports" element={<ReferralReports />}></Route>
          {/* <Route path="/Dashboard/employeeEdit/:id" element={<EditEmployee />}></Route> */}
          <Route path="/Dashboard/EmployeeHome" element={<EmployeeHome />}></Route>
          <Route path="/Dashboard/AddProjectDetails" element={<AddProjectDetails />}></Route>
          <Route path="/Dashboard/AddLeaves" element={<AddLeaveDetails />}></Route>
          <Route path="/Dashboard/CompOff" element={<CompOff />}></Route>
          <Route path="/Dashboard/TimeManagement" element={<TimeManagement />}></Route>
          <Route path="/Dashboard/TeamLeadHome" element={<TeamLeadHome />}></Route>
          {/* <Route path="/Dashboard/TeamLeadProject" element={<ProjectsList />}></Route> */}
          <Route path="/Dashboard/TeamLeadProjectWorks" element={<ProjectWorkDetails />}></Route>
        </Route>

        <Route path="/Employee" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>}>
          <Route path="" index element={<EmployeeHome />}></Route>
          <Route path="/Employee/guidance" element={<Guidance />}></Route>
          <Route path="/Employee/EmployeeHome" element={<EmployeeHome />}></Route>
          <Route path="/Employee/TimeManagement" element={<TimeManagement />}></Route>
          <Route path="/Employee/AddLeaves" element={<AddLeaveDetails />}></Route>
          <Route path="/Employee/CompOff" element={<CompOff />}></Route>
          <Route path="/Employee/Profile" element={<Profile />}></Route>
          <Route path="/Employee/ShiftDetails" element={<ShiftManagement />}></Route>
          <Route path="/Employee/MyPayslips" element={<MyPayslips />}></Route>
        </Route>

        <Route path="/TeamLead" element={<ProtectedRoute><TeamLeadDashboard /></ProtectedRoute>}>
          <Route path="" index element={<TeamLeadHome />}></Route>
          <Route path="/TeamLead/guidance" element={<Guidance />}></Route>
          {/* <Route path="/TeamLead/LeadHome" element={<TeamLeadHome />}></Route> */}
          <Route path="/TeamLead/TimeManagement" element={<TimeManagement />}></Route>
          <Route path="/TeamLead/AddLeaves" element={<AddLeaveDetails />}></Route>
          <Route path="/TeamLead/CompOff" element={<CompOff />}></Route>
          <Route path="/TeamLead/Profile" element={<Profile />}></Route>
          <Route path="/TeamLead/ProjectWorkDetails" element={<ProjectWorkDetails />}></Route>
          <Route path="/TeamLead/Approvals" element={<ApprovalCenter />}></Route>
          <Route path="/TeamLead/Productivity" element={<ProductivityDashboard />}></Route>
          <Route path="/TeamLead/ShiftManagement" element={<ShiftManagement />}></Route>
          <Route path="/TeamLead/OvertimeManagement" element={<OvertimeManagement />}></Route>
        </Route>

        <Route path="/Hr" element={<ProtectedRoute><HrDashboard /></ProtectedRoute>}>
          <Route path="" index element={<LeaveBalance />}></Route>
          <Route path="/Hr/guidance" element={<Guidance />}></Route>
          <Route path="/Hr/LeaveBalance" element={<LeaveBalance />}></Route>
          <Route path="/Hr/create/:id?" element={<AddEmployee from="hr"/>}></Route>
          <Route path="/Hr/employee" element={<Employee from="hr"/>}></Route>
          <Route path="/Hr/Settings" element={<Settings from="hr"/>}></Route>
          <Route path="/Hr/AddUpdates" element={<AddUpdates from="hr"/>}></Route>
          <Route path="/Hr/Profile" element={<Profile />}></Route>
          <Route path="/Hr/TimeManagement" element={<TimeManagement />}></Route>
          <Route path="/Hr/AddLeaves" element={<AddLeaveDetails />}></Route>
          <Route path="/Hr/CompOff" element={<CompOff />}></Route>
        </Route>
        </Routes>
        </GuidanceTourProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
