import React, { useEffect } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Link, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";

function Dashboard() {
  const navigate = useNavigate();
  axios.defaults.withCredentials = true;
  useEffect(() => {
    axios.get("http://localhost:8081/dashboard").then((res) => {
      console.log(res, "resresresres");
      if (res.data.Status === "Success") {
        if (res.data.role === "admin") {
          navigate("/Dashboard");
        }
      } else {
        navigate("/start");
      }
    });
  }, []);

  const handleLogout = () => {
    axios
      .get("http://localhost:8081/logout")
      .then((res) => {
        navigate("/");
      })
      .catch((err) => console.log(err));
  };
  return (
    <div className="container-fluid arris-page">
      <div className="row flex-nowrap min-vh-91">
        <div className="col-auto px-sm-2 px-0 sidebar">
          <div className="logo">
            <img src="http://localhost:5173/src/assets/logo.png" width={100} />
            {/* <h2> Arris</h2> */}
          </div>
          <ul className="links">
            <h4 className="fs-4 text-center mb-2 txt_col">Admin Dashboard</h4>
            <li>
              <span className="material-symbols-outlined fs-5 bi-collection"></span>
              <Link to="/Dashboard">
                <span className="txt_col">Dashboard</span>
              </Link>
            </li>

            <li>
              <span className="material-symbols-outlined fs-5 bi-person-bounding-box"></span>
              <Link to="/Dashboard/lead">
                <span className="txt_col">Manage Tl</span>
              </Link>
            </li>
            <li>
              <span className="material-symbols-outlined fs-5 bi-explicit-fill"></span>
              <Link to="/Dashboard/employee">
                <span className="txt_col">Manage Employees</span>
              </Link>
            </li>
            <li>
              <span className="material-symbols-outlined fs-5 bi-people-fill"></span>
              <Link to="/Dashboard/hr">
                <span className="txt_col">Manage Hr</span>
              </Link>
            </li>
            <li>
              <span className="material-symbols-outlined fs-5 bi-laptop-fill"></span>
              <Link to="/Dashboard/projects">
                <span className="txt_col">Manage Projects</span>
              </Link>
            </li>
            <li>
              <span className="material-symbols-outlined fs-5  bi-journal-check "></span>
              <Link to="/Dashboard/Leaves">
                <span className="txt_col">Leave Details</span>
              </Link>
            </li>

            <li className="multimenu">
              <span className="material-symbols-outlined fs-5  bi-clipboard-data-fill"></span>
              <Link to="/Dashboard/Leaves">
                <span className="txt_col">Report</span>
              </Link>
              <ul className="submenu">
                <Link to="/Dashboard/Reports/ProjectReport">
                  Project Report
                </Link>
                <Link>Weekly Report</Link>
                <Link>Yearly Report</Link>
              </ul>
            </li>

            <li onClick={() => handleLogout()}>
              <span className="material-symbols-outlined  fs-5 bi-power"></span>
              <Link>
                <span className="txt_col">Logout</span>
              </Link>
            </li>
          </ul>
        </div>
        <div className="col p-0 m-0 Arristable">
          {/* <div className="p-2 d-flex justify-content-center shadow">
            <h4>Employee Management System</h4>
          </div> */}
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
