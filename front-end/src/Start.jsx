import React from "react";
import { useNavigate } from "react-router-dom";
import Login from "./Login";
import commonData from "../common.json";
import axios from "axios";

function Start() {
  const [rowData, setRowData] = React.useState([]);

  React.useEffect(() => {
    axios
      .get(`${commonData?.APIKEY}/settings`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setRowData(res.data.Result);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  }, []);

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
                  <marquee direction="up" scrollamount="5">
                    {rowData?.map((res) => {
                      return (
                        <div className="updates">
                          <div>
                            <h4>{res?.updateTitle}</h4>
                            <p className="m-0">{res?.UpdateDisc}</p>
                          </div>
                        </div>
                      );
                    })}
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
                        src={`${commonData?.BASEURL}/src/assets/banner.jpg`}
                        className="d-block w-100"
                        alt="..."
                      />
                    </div>
                    {rowData?.map((res) => {
                      console.log(res, "res134234234", res?.Announcements);
                      return (
                        <div className="carousel-item" data-bs-interval="2000">
                          <img
                            src="E:\ArulKumar\important-files\ibss\timesheetmanagement\time-sheet-management\back-end\public\images\Announcements_1695582154441.png"
                            className="d-block w-100"
                            alt="..."
                          />
                        </div>
                      );
                    })}
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
                    <div className="d-flex align-items-center justify-content-center h-100 flex-column">
                      <div className="w-100 text-center">
                        <img
                          src={`${commonData?.BASEURL}/src/assets/logo.png`}
                          width={150}
                        />
                      </div>
                      
                      <ul className="updateslist">
                        <li>
                          <a>Circular</a>
                        </li>
                        <li>
                          <a>Photo Gallery</a>
                        </li>
                        <li>
                          <a>View Excel / Word</a>
                        </li>
                      </ul>
                    </div>
                    
                  </div>
                  <div className="col-sm-12">
                    <div className="loginSection">
                      <Login />
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
