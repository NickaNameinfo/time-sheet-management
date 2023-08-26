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
    <div className="container-fluid h-100">
      <div
        className={isExpand ? "colaps expandMenu" : "expandMenu"}
        onClick={() => setIsExpand((prev) => !prev)}
      >
        <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
      </div>
      <div className="row h-100">
        <div className={isExpand ? "d-none" : "col-sm-2 px-sm-2 px-0 sideBar"}>
          <div className="text-center">
            <img src="http://localhost:5173/src/assets/logo.png" width={100} />
          </div>
          <div className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-2 text-white">
            <a
              href="#"
              className="d-flex align-items-center pb-3 mb-md-1 me-md-auto text-white text-decoration-none"
            >
              <span className="fs-5 fw-bolder d-none d-sm-inline text-center">
                Employee Dashboard
              </span>
            </a>
            <ul
              className="nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start"
              id="menu"
            >
              <li>
                <Link
                  to="/Employee"
                  className="nav-link text-white px-0 align-middle"
                >
                  <i className="fs-4 bi-speedometer2"></i>{" "}
                  <span className="ms-1 d-none d-sm-inline">Dashboard</span>{" "}
                </Link>
              </li>
              <li>
                <Link
                  to="/employee/TimeManagement"
                  className="nav-link text-white px-0 align-middle"
                >
                  <i className="fs-4 bi-speedometer2"></i>{" "}
                  <span className="ms-1 d-none d-sm-inline">
                    Time Management
                  </span>{" "}
                </Link>
              </li>
              <li>
                <Link
                  to="/employee/Projects"
                  className="nav-link text-white px-0 align-middle"
                >
                  <i className="fs-4 bi-speedometer2"></i>{" "}
                  <span className="ms-1 d-none d-sm-inline">Projects</span>{" "}
                </Link>
              </li>
              <li>
                <Link to="#" className="nav-link px-0 align-middle text-white">
                  <i className="fs-4 bi-people"></i>{" "}
                  <span className="ms-1 d-none d-sm-inline">Notifications</span>{" "}
                </Link>
              </li>
              <li>
                <Link
                  to="/employee/Leaves"
                  className="nav-link px-0 align-middle text-white"
                >
                  <i className="fs-4 bi-people"></i>{" "}
                  <span className="ms-1 d-none d-sm-inline">Apply Leave</span>{" "}
                </Link>
              </li>
              {/* <li>
								<Link to="profile" className="nav-link px-0 align-middle text-white">
									<i className="fs-4 bi-person"></i> <span className="ms-1 d-none d-sm-inline">Profile</span></Link>
							</li> */}
              <li onClick={handleLogout}>
                <a href="#" className="nav-link px-0 align-middle text-white">
                  <i className="fs-4 bi-power"></i>{" "}
                  <span className="ms-1 d-none d-sm-inline">Logout</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className={isExpand ? "col-sm-12 p-0 m-0" : "col-sm-10 p-0 m-0"}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default EmployeeDashboard;
