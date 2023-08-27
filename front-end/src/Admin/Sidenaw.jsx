import React from "react";
import { Link } from "react-router-dom";
const Sidenaw = () => {
  return (
    <>
      <h2>SideNamve</h2>
      <div className ="sidebar">
        <div className ="logo">
          <img src="http://localhost:5173/src/assets/logo.png" width={100} />
          {/* <h2> Arris</h2> */}
        </div>
        <ul className ="links">
          <h4 className="fs-4">Admin Dashboard</h4>
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
          <li  >
            <span className ="material-symbols-outlined  fs-5 bi-power"></span>
                        <Link>
              <span>Logout</span>
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};
export default Sidenaw;
