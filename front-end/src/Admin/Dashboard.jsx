import React, { createContext, useContext, useState, useEffect } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Link, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import commonData from "../../common.json";

function Dashboard() {
  const [roles, setRoles] = React.useState(null);
  console.log(roles, "rolesroles");
  const navigate = useNavigate();
  axios.defaults.withCredentials = true;

  useEffect(() => {
    axios.get(`${commonData?.APIKEY}/dashboard`).then((res) => {
      console.log(res, "resresresres12345");
      if (res.data.Status === "Success") {
        setRoles(res.data.role?.split(","));
      }
    });
  }, []);

  const handleLogout = () => {
    axios
      .get(`${commonData?.APIKEY}/logout`)
      .then((res) => {
        navigate("/");
      })
      .catch((err) => console.log(err));
  };

  return (
    <div className="container-fluid arris-page">
      <div className="row flex-nowrap">
        <div className="col-auto px-sm-2 px-0 sidebar">
          <div className="logo">
            <img
              src={`${commonData?.BASEURL}/src/assets/logo.png`}
              width={100}
            />
            {/* <h2> Arris</h2> */}
          </div>

          <ul className="links">
            {/* Admin List */}
            {roles?.[0] === "Admin" && (
              <>
                <h4 className="fs-4 text-center mb-2 txt_col">Dashboard</h4>
                <li>
                  <span className="material-symbols-outlined fs-5 bi-collection"></span>
                  <Link to="/Dashboard">
                    <span className="txt_col">Dashboard</span>
                  </Link>
                </li>
                {roles?.[0] === "Hr" ||
                  (roles?.[0] === "Admin" && (
                    <li>
                      <span className="material-symbols-outlined fs-5 bi-explicit-fill"></span>
                      <Link to="/Dashboard/employee">
                        <span className="txt_col">Manage Employees</span>
                      </Link>
                    </li>
                  ))}
                <li>
                  <span className="material-symbols-outlined fs-5 bi-person-bounding-box"></span>
                  <Link to="/Dashboard/lead">
                    <span className="txt_col">Manage TL</span>
                  </Link>
                </li>
                <li>
                  <span className="material-symbols-outlined fs-5 bi-laptop-fill"></span>
                  <Link to="/Dashboard/projects">
                    <span className="txt_col">Manage Projects</span>
                  </Link>
                </li>
                {/* <li>
                  <span className="material-symbols-outlined fs-5 bi-people-fill"></span>
                  <Link to="/Dashboard/hr">
                    <span className="txt_col">Manage Hr</span>
                  </Link>
                </li> */}
                <li className="multimenu">
                  <div className="d-flex justify-content-center">
                    <span className="material-symbols-outlined fa-solid fa-gear"></span>
                    <Link>
                      <span className="txt_col">Approvals</span>
                    </Link>
                  </div>
                  <ul className="submenu">
                    <Link to="/Dashboard/Leaves">Leave Details</Link>
                    <Link to="/Dashboard/CompOffList">Comp-Off Details</Link>
                  </ul>
                </li>
                {/* <li>
                  <span className="material-symbols-outlined fs-5  bi-journal-check "></span>
                  <Link to="/Dashboard/Leaves">
                    <span className="txt_col">Leave Details</span>
                  </Link>
                </li> */}
                <li className="multimenu">
                  <div className="d-flex justify-content-center">
                    <span className="material-symbols-outlined fs-5  bi-clipboard-data-fill"></span>
                    <Link>
                      <span className="txt_col">Report</span>
                    </Link>
                  </div>
                  <ul className="submenu">
                    <Link to="/Dashboard/Reports/ProjectReport">
                      Project Report
                    </Link>
                    <Link to="/Dashboard/Reports/WeeklyReport">
                      Weekly Report
                    </Link>
                    <Link to="/Dashboard/Reports/MonthlyReport">
                      Monthly Report
                    </Link>
                    <Link to="/Dashboard/Reports/YearlyReport">
                      Yearly Report
                    </Link>
                    <Link to="/Dashboard/Reports/CodeReport">
                      Discipline Report
                    </Link>
                    <Link to="/Dashboard/Reports/LeaveReport">
                      Leave Report
                    </Link>
                  </ul>
                </li>
              </>
            )}

            {/* Team Lead List */}
            {roles?.[0] === "Tl" && (
              <>
                <li>
                  <span className="material-symbols-outlined fs-5 bi-collection"></span>
                  <Link to="/Dashboard/TeamLeadHome">
                    <span className="txt_col">Dashboard</span>
                  </Link>
                </li>
                <li>
                  <span className="material-symbols-outlined fs-5 bi-person-workspace"></span>
                  <Link to="/Dashboard/TeamLeadProjectWorks">
                    <span className="txt_col">Project Work Details</span>
                  </Link>
                </li>
              </>
            )}

            {/* Employee List */}
            {(roles?.[0] === "Tl" ||
              roles?.[0] === "Admin" ||
              roles?.[0] === "Employee") && (
              <>
                <li>
                  <span className="material-symbols-outlined fs-5 bi-collection"></span>
                  <Link to="/Dashboard/EmployeeHome">
                    <span className="txt_col">Employee Dashboard</span>
                  </Link>
                </li>
              </>
            )}

            <li>
              <span className="material-symbols-outlined fs-5 bi-person-bounding-box"></span>
              <Link to="/Dashboard/TimeManagement">
                <span className="txt_col">Time Management</span>
              </Link>
            </li>

            {/* Common List */}
            <li>
              <span className="material-symbols-outlined fs-5 bi-bell-fill"></span>
              <Link to="#">
                <span className="txt_col">Notifications</span>
              </Link>
            </li>
            <li>
              <span className="material-symbols-outlined fs-5  bi-journal-check "></span>
              <Link to="/Dashboard/AddLeaves">
                <span className="txt_col">Apply Leave</span>
              </Link>
            </li>
            <li>
              <span className="material-symbols-outlined fs-5  bi-journal-check "></span>
              <Link to="/Dashboard/CompOff">
                <span className="txt_col">Comp-Off</span>
              </Link>
            </li>
            {roles?.[0] === "Admin" && (
              <li className="multimenu">
                <div className="d-flex justify-content-center">
                  <span className="material-symbols-outlined fa-solid fa-gear"></span>
                  <Link>
                    <span className="txt_col">Settings</span>
                  </Link>
                </div>
                <ul className="submenu">
                  <Link to="/Dashboard/Settings">Updates</Link>
                  <Link to="/Dashboard/Discipline">Discipline</Link>
                  <Link to="/Dashboard/Designation">Designation</Link>
                  <Link to="/Dashboard/Areaofwork">Area of Work</Link>
                  <Link to="/Dashboard/Variations">Variation</Link>
                </ul>
              </li>
            )}

            <li onClick={() => handleLogout()}>
              <span className="material-symbols-outlined  fs-5 bi-power"></span>
              <Link>
                <span className="txt_col">Logout</span>
              </Link>
            </li>
          </ul>
        </div>
        <div className="col p-0 m-0 Arristable">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
