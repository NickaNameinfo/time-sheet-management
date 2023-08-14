import React from "react";
import { useNavigate } from "react-router-dom";

function Start() {
  const navigate = useNavigate();
  return (
    <>
      <div className="vh-100 loginPage d-flex justify-content-center align-items-center">
        <div className="w-50">
          <div className="startDesign">
            <div className="row">
              <div className="col-sm-6">
                <div className="d-flex align-items-center justify-content-center h-100">
                  <img
                    src="http://localhost:5173/src/assets/logo.png"
                    width={250}
                  />
                </div>
              </div>
              <div className="col-sm-6">
                <div className="loginSection">
                  <button
                    className="btn btn-success btn-lg"
                    onClick={(e) => navigate("/login")}
                  >
                    Admin
                  </button>

                  <button
                    className="btn btn-primary btn-lg"
                    onClick={(e) => navigate("/TeamLeadLogin")}
                  >
                    Team Tl
                  </button>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={(e) => navigate("/HrLogin")}
                  >
                    HR
                  </button>
                  <button
                    className="btn  btn-success btn-lg"
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
