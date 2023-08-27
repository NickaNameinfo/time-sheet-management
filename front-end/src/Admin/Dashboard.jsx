import React, { useEffect } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Link, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";

function Dashboard() {
  const navigate = useNavigate()
  ;
  axios.defaults.withCredentials = true;
  useEffect(() => {
    axios.get("http://localhost:8081/dashboard").then((res) => {
      console.log(res, "resresresres");
      if (res.data.Status === "Success") {
        if (res.data.role === "admin") {
          navigate("/Dashboard");
        }
      } else {
        navigate('/start')
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
      <div className ="col-auto px-sm-2 px-0 sidebar">
        <div className ="logo">
          <img src="http://localhost:5173/src/assets/logo.png" width={100} />
          {/* <h2> Arris</h2> */}
        </div>
        <ul className ="links">
          <h4 className="fs-4 text-center mb-2">Admin Dashboard</h4>
          <li>
            <span className ="material-symbols-outlined fs-5 bi-speedometer2"></span>
            <Link to="/Dashboard">
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <span className ="material-symbols-outlined fs-5 bi-people"></span>
            <Link to="/Dashboard/employee">
              <span>Manage Employees</span>
            </Link>
          </li>
          <li>
            <span className ="material-symbols-outlined fs-5 bi-people"></span>
            <Link to="/Dashboard/sidenaw">
              <span>Manage Sidenaw</span>
            </Link>
          </li>
          <li>
            <span className ="material-symbols-outlined fs-5 bi-people"></span>
            <Link to="/Dashboard/lead">
              <span>Manage Tl</span>
            </Link>
          </li>
          <li>
            <span className ="material-symbols-outlined fs-5 bi-people" ></span>
            <Link to="/Dashboard/hr">
              <span>Manage Hr</span>
            </Link>
          </li>
          <li>
            <span className ="material-symbols-outlined fs-5 bi-people"></span>
            <Link to="/Dashboard/projects">
              <span>Manage Projects</span>
            </Link>
          </li>
          <li>
            <span className ="material-symbols-outlined fs-5 bi-people"></span>
            <Link  to="/Dashboard/Leaves">
              <span>Leave Details</span>
            </Link>
          </li>
          <li>
            <span className ="material-symbols-outlined fs-5 bi-people"></span>
            <Link  to="/Dashboard/Leaves">
              <span>Leave Details</span>
            </Link>
          </li>
          <li  onClick={() => handleLogout()}>
            <span className ="material-symbols-outlined  fs-5 bi-power"></span>
                        <Link>
              <span>Logout</span>
            </Link>
          </li>
        </ul>
      </div>
        <div class="col p-0 m-0">
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
