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
import EditEmployee from "./Admin/EditEmployee";
import Start from "./Start";
import EmployeeDetail from "./Employee/EmployeeDetail";
import EmployeeLogin from "./EmployeeLogin";
import TeamLeadLogin from "./TeamLeadLogin";
import EmployeeDashboard from "./Employee/EmployeeDashboard";
import TeamLeadDashboard from "./TeamLead/TeamLeadDashboard";
import EmployeeHome from "./Employee/EmployeeHome";
import TeamLeadHome from "./TeamLead/TeamLeadHome";
import ProjectsList from "./TeamLead/ProjectsList";
import Hr from "./Admin/Hr";
import AddHr from "./Admin/AddHr";
import Leaves from "./Admin/Leaves";
import HrLogin from "./HrLogin";
import HrDashboard from "./Hr/HrDashboard";
import HrHome from "./Hr/HrHome";
import EmployeeHr from "./Hr/EmployeeHr";
import AddEmployeeHr from "./Hr/AddEmployeeHr";
import EditEmployeeHr from "./Hr/EditEmployeeHr";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Start />}></Route>
        <Route path="/Dashboard" element={<Dashboard />}>
          <Route path="" index element={<Home />}></Route>
          <Route path="/Dashboard/employee" element={<Employee />}></Route>
          <Route path="/Dashboard/lead" element={<Leads />}></Route>
          <Route path="/Dashboard/hr" element={<Hr />}></Route>
          <Route path="/Dashboard/projects" element={<Projects />}></Route>
          <Route path="/Dashboard/leaves" element={<Leaves />}></Route>
          <Route path="/Dashboard/profile" element={<Profile />}></Route>
          <Route path="/Dashboard/create" element={<AddEmployee />}></Route>
          <Route path="/Dashboard/addLead" element={<AddLead />}></Route>
          <Route path="/Dashboard/addHr" element={<AddHr />}></Route>
          <Route path="/Dashboard/addProject" element={<AddProject />}></Route>
          <Route
            path="/Dashboard/employeeEdit/:id"
            element={<EditEmployee />}
          ></Route>
        </Route>

        <Route path="/Employee" element={<EmployeeDashboard />}>
          <Route path="" index element={<EmployeeHome />}></Route>
          <Route path="/Employee/ProjectDetails" element={<p>Project Details</p>}></Route>
          <Route path="/Employee/Leaves" element={<p>Leave Details</p>}></Route>
        </Route>

        <Route path="/TeamLead" element={<TeamLeadDashboard />}>
          <Route path="" index element={<TeamLeadHome />}></Route>
          <Route path="/TeamLead/ProjectDetails" element={<ProjectsList />}></Route>
          <Route path="/TeamLead/Leaves" element={<Leaves />}></Route>
        </Route>

        <Route path="/Hr" element={<HrDashboard />}>
          <Route path="" index element={<HrHome />}></Route>
          <Route path="/Hr/employee" element={<EmployeeHr />}></Route>
          <Route path="/Hr/create" element={<AddEmployeeHr />}></Route>
          <Route path="/Hr/employeeEdit/:id" element={<EditEmployeeHr />}
          ></Route>
        </Route>

        <Route path="/login" element={<Login />}></Route>
        <Route path="/employeeLogin" element={<EmployeeLogin />}></Route>
        <Route path="/TeamLeadLogin" element={<TeamLeadLogin />}></Route>
        <Route path="/HrLogin" element={<HrLogin />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
