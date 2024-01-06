import React from "react";
import Login from "./Login";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./Admin/Dashboard";
import Employee from "./Admin/Employee";
import Leads from "./Admin/Leads";
import Projects from "./Admin/Projects";
import Profile from "./Employee/Profile";
import Home from "./Admin/Home";
import AddEmployee from "./Admin/AddEmployee";
import AddLead from "./Admin/AddLead";
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
import Hr from "./Admin/Hr";
import AddHr from "./Admin/AddHr";
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
import CompOff from "./Employee/CompOff";
import CompOffLIst from "./Admin/compOffLIst";
import ConsolidatedReport from "./Admin/Reports/ConsolidatedReport";
import EmployeeReport from "./Admin/Reports/EmployeeReport";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Start />}></Route>
        <Route path="/Dashboard" element={<Dashboard />}>
          <Route path="" index element={<Home />}></Route>
          <Route path="/Dashboard/employee" element={<Employee />}></Route>
          <Route path="/Dashboard/Settings" element={<Settings />}></Route>
          <Route path="/Dashboard/AddUpdates" element={<AddUpdates />}></Route>
          <Route path="/Dashboard/Discipline" element={<Discipline />}></Route>
          <Route path="/Dashboard/Areaofwork" element={<Areaofwork />}></Route>
          <Route path="/Dashboard/Variations" element={<Variations />}></Route>
          <Route path="/Dashboard/Designation" element={<Designation />}></Route>
          <Route path="/Dashboard/lead" element={<Leads />}></Route>
          <Route path="/Dashboard/hr" element={<Hr />}></Route>
          <Route path="/Dashboard/projects" element={<Projects />}></Route>
          <Route path="/Dashboard/leaves" element={<Leaves />}></Route>
          <Route path="/Dashboard/CompOffList" element={<CompOffLIst />}></Route>
          <Route path="/Dashboard/profile" element={<Profile />}></Route>
          <Route path="/Dashboard/create/:id?" element={<AddEmployee />}></Route>
          <Route path="/Dashboard/addLead" element={<AddLead />}></Route>
          <Route path="/Dashboard/addHr" element={<AddHr />}></Route>
          <Route path="/Dashboard/addProject/:id?" element={<AddProject />}></Route>
          <Route path="/Dashboard/Reports/ProjectReport"  element={<ProjectReport />}></Route>
          <Route path="/Dashboard/Reports/ConsolidatedReport"  element={<ConsolidatedReport />}></Route>
          <Route path="/Dashboard/Reports/EmployeeReport"  element={<EmployeeReport />}></Route>
          <Route path="/Dashboard/Reports/WeeklyReport"  element={<WeeklyReport />}></Route>
          <Route path="/Dashboard/Reports/MonthlyReport"  element={<MonthlyReport />}></Route>
          <Route path="/Dashboard/Reports/YearlyReport"  element={<YearlyReport />}></Route>
          <Route path="/Dashboard/Reports/CodeReport"  element={<DesciplineCodeReport />}></Route>
          <Route path="/Dashboard/Reports/LeaveReport"  element={<LeaveReport />}></Route>
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

        <Route path="/Employee" element={<EmployeeDashboard />}>
         
        </Route>

        <Route path="/TeamLead" element={<TeamLeadDashboard />}>
        
        </Route>

        <Route path="/Hr" element={<HrDashboard />}>
          
        </Route>

        <Route path="/login" element={<Login />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
