import React, { useEffect } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Link, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";

function EmployeeDashboard() {
  const navigate = useNavigate();
  axios.defaults.withCredentials = true;
  const [isExpand, setIsExpand] = React.useState(false);
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
    <div className="container-fluid arris-page">
      <div className="row flex-nowrap min-vh-91">
        <div className="col-auto px-sm-2 px-0 sidebar">
          <div className="logo">
            <img src="http://localhost:5173/src/assets/logo.png" width={100} />
            {/* <h2> Arris</h2> */}
          </div>
          <ul className="links">
            <h4 className="fs-4 text-center mb-2 txt_col">
              Employee Dashboard
            </h4>
            <li>
              <span className="material-symbols-outlined fs-5 bi-collection"></span>
              <Link to="/Employee">
                <span className="txt_col">Dashboard</span>
              </Link>
            </li>

            <li>
              <span className="material-symbols-outlined fs-5 bi-person-bounding-box"></span>
              <Link to="/employee/TimeManagement">
                <span className="txt_col">Time Management</span>
              </Link>
            </li>
            <li>
              <span className="material-symbols-outlined fs-5 bi-laptop-fill"></span>
              <Link to="/employee/Projects">
                <span className="txt_col">Projects</span>
              </Link>
            </li>
            <li>
              <span className="material-symbols-outlined fs-5 bi-bell-fill"></span>
              <Link to="#">
                <span className="txt_col">Notifications</span>
              </Link>
            </li>
            <li>
              <span className="material-symbols-outlined fs-5  bi-journal-check "></span>
              <Link to="/employee/Leaves">
                <span className="txt_col">Apply Leave</span>
              </Link>
            </li>
            <li onClick={() => handleLogout()}>
              <span className="material-symbols-outlined  fs-5 bi-power"></span>
              <Link>
                <span className="txt_col">Logout</span>
              </Link>
            </li>
          </ul>
        </div>
        <div className={"col p-0 m-0 Arristable"}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default EmployeeDashboard;
