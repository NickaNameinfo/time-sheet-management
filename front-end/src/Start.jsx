import React from "react";
import { useNavigate } from "react-router-dom";

function Start() {
  const navigate = useNavigate();
  return (
    <>
      <div className="vh-100 loginPage">
        <div className="w-100 h-100 container-fluid">
          <div className="row h-100">
            <div className="col-sm-3 p-0">
              <div className="startDesign">
                <div className="w-100">
                  <h3 className="text-center bg-white py-2 border-bottom">
                    Updates
                  </h3>
                  <marquee direction="up">
                    <div className="updates">
                      <div>
                        <h4>Update 1</h4>
                        <p className="m-0">Test</p>
                      </div>
                    </div>
                    <div className="updates">
                      <div>
                        <h4>Update 1</h4>
                        <p className="m-0">Test</p>
                      </div>
                    </div>
                    <div className="updates">
                      <div>
                        <h4>Update 1</h4>
                        <p className="m-0">Test</p>
                      </div>
                    </div>
                    <div className="updates">
                      <div>
                        <h4>Update 1</h4>
                        <p className="m-0">Test</p>
                      </div>
                    </div>
                  </marquee>
                </div>
              </div>
            </div>
            <div className="col-sm-6 p-0">
              <div className="banner">
                <div
                  id="carouselExampleInterval"
                  className="carousel slide"
                  data-bs-ride="carousel"
                >
                  <div className="carousel-inner">
                    <div
                      className="carousel-item active"
                      data-bs-interval="10000"
                    >
                      <img
                        src="http://localhost:5173/src/assets/banner.jpg"
                        className="d-block w-100"
                        alt="..."
                      />
                    </div>
                    <div className="carousel-item" data-bs-interval="2000">
                      <img
                        src="http://localhost:5173/src/assets/banner.jpg"
                        className="d-block w-100"
                        alt="..."
                      />
                    </div>
                    <div className="carousel-item">
                      <img
                        src="http://localhost:5173/src/assets/banner.jpg"
                        className="d-block w-100"
                        alt="..."
                      />
                    </div>
                  </div>
                  <button
                    className="carousel-control-prev"
                    type="button"
                    data-bs-target="#carouselExampleInterval"
                    data-bs-slide="prev"
                  >
                    <span
                      className="carousel-control-prev-icon"
                      aria-hidden="true"
                    ></span>
                    <span className="visually-hidden">Previous</span>
                  </button>
                  <button
                    className="carousel-control-next"
                    type="button"
                    data-bs-target="#carouselExampleInterval"
                    data-bs-slide="next"
                  >
                    <span
                      className="carousel-control-next-icon"
                      aria-hidden="true"
                    ></span>
                    <span className="visually-hidden">Next</span>
                  </button>
                </div>
              </div>
              <div className="flashUpdate">
                <p>Announcements</p>
              </div>
            </div>
            <div className="col-sm-3 p-0">
              <div className="startDesign">
                <div className="row">
                  <div className="col-sm-12">
                    <div className="d-flex align-items-center justify-content-center h-100">
                      <img
                        src="http://localhost:5173/src/assets/logo.png"
                        width={250}
                      />
                    </div>
                  </div>
                  <div className="col-sm-12">
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
        </div>
      </div>
    </>
  );
}

export default Start;
