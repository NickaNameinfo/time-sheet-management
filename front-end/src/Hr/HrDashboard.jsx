import React, { useEffect } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Link, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";

function HrDashboard() {
  const navigate = useNavigate();
  axios.defaults.withCredentials = true;
  useEffect(() => {
    axios.get("http://localhost:8081/dashboard").then((res) => {
      console.log(res, "resresresres");
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
    <div className="container-fluid">
      <div className="row flex-nowrap min-vh-91">
        <div className="col-auto col-md-3 col-xl-2 px-sm-2 px-0 sideBar">
        <div className="text-center">
            <img src="http://localhost:5173/src/assets/logo.png" width={100} />
          </div>
          <div className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-2 text-white">
            <a
              href="/Hr"
              className="d-flex align-items-center pb-3 mb-md-1  me-md-auto text-white text-decoration-none"
            >
              <span className="fs-5 fw-bolder d-none d-sm-inline text-center">
                HR Dashboard
              </span>
            </a>
            <ul
              className="nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start"
              id="menu"
            >
              <li>
                <Link
                  to="/Hr"
                  data-bs-toggle="collapse"
                  className="nav-link text-white px-0 align-middle"
                >
                  <i className="fs-4 bi-speedometer2"></i>{" "}
                  <span className="ms-1 d-none d-sm-inline">Dashboard</span>{" "}
                </Link>
              </li>
              <li>
                <Link
                  to="/Hr/employee"
                  className="nav-link px-0 align-middle text-white"
                >
                  <i className="fs-4 bi-people"></i>{" "}
                  <span className="ms-1 d-none d-sm-inline">
                    Manage Employee
                  </span>{" "}
                </Link>
              </li>
              
              <li onClick={handleLogout}>
                <a href="#" className="nav-link px-0 align-middle text-white">
                  <i className="fs-4 bi-power"></i>{" "}
                  <span className="ms-1 d-none d-sm-inline">Logout</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className ="col p-0 m-0 Arristable">
          <div className="p-2 d-flex justify-content-center shadow">
            <h4>Employee Management System</h4>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default HrDashboard;
