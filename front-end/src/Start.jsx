import React from "react";
import { useNavigate } from "react-router-dom";

function Start() {
  const navigate = useNavigate();
  return (
    <>
      <div className="vh-100 loginPage d-flex justify-content-center align-items-center">
        <div>
          <div className="text-center w-100">
            <img src="./src/assets/logo.png" width={100} />
          </div>
          <div className="d-flex justify-content-center align-items-center ">
            <div className="p-3 rounded  border loginForm text-center d-flex align-items-center ">
              <div className="w-100">
                <div className="">
                  <button
                    className="btn btn-success btn-lg"
                    onClick={(e) => navigate("/login")}
                  >
                    Admin
                  </button>
                </div>
              </div>
            </div>
            <div className="p-3 rounded  border loginForm text-center d-flex align-items-center ">
              <div className="w-100">
                <div className="">
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={(e) => navigate("/TeamLeadLogin")}
                  >
                    Team Tl
                  </button>
                </div>
              </div>
            </div>
            <div className="p-3 rounded  border loginForm text-center d-flex align-items-center ">
              <div className="w-100">
                <div className="">
                  <button
                    className="btn btn-success btn-lg"
                    onClick={(e) => navigate("/HrLogin")}
                  >
                    HR
                  </button>
                </div>
              </div>
            </div>
            <div className="p-3 rounded  border loginForm text-center d-flex align-items-center ">
              <div className="w-100">
                <div className="">
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={(e) => navigate("/employeeLogin")}
                  >
                    Employee
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Start;
