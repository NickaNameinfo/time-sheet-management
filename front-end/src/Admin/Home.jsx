import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  BsBadgeTmFill,
  BsBarChartLineFill,
  BsFillHCircleFill,
  BsFillPersonBadgeFill,
  BsPersonCircle,
} from "react-icons/bs";
import commonData from "../../common.json";
// import "./style.css";

function Home() {
  const [lead, setLead] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [hr, setHr] = useState(null);
  const [project, setProject] = useState(null);

  useEffect(() => {
    // getHr();
    getProject();
    getTl();
    getEmployee();
  }, []);

  const getProject = () => {
    axios
      .get(`${commonData?.APIKEY}/getProject`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setProject(res.data.Result.length);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const getTl = () => {
    axios
      .get(`${commonData?.APIKEY}/getLead`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setLead(res.data.Result.length);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const getEmployee = () => {
    axios
      .get(`${commonData?.APIKEY}/getEmployee`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setEmployee(res.data.Result.length);
          let htCount = res?.data?.Result?.filter(
            (item) => item?.role === "HR"
          );
          let tlCount = res?.data?.Result?.filter(
            (item) => item?.role === "TL"
          );
          setLead(tlCount.length)
          setHr(htCount?.length);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };
  // const getHr = () => {
  //   axios
  //     .get(`${commonData?.APIKEY}/getHr`)
  //     .then((res) => {
  //       if (res.data.Status === "Success") {
  //         setHr(res.data.Result.length);
  //       } else {
  //         alert("Error");
  //       }
  //     })
  //     .catch((err) => console.log(err));
  // };
  return (
    <div className="mainBody">
      <div className="mt-5">
        <div className="row">
          <div className="col-sm-3">
            <div className="counterCard">
              <div className="counterCardmain">
                <div className="smallboxTL">
                  <BsBadgeTmFill className="icon_admin" />
                </div>
                <div className="counts">
                  <p>TL Count's</p>
                  <h3>{lead} </h3>
                </div>
              </div>
              <div className="counterCardname">
                <p className="counterCardTitle">Team Lead</p>
              </div>
            </div>
          </div>
          <div className="col-sm-3">
            <div className="counterCard">
              <div className="counterCardmain">
                <div className="smallboxE">
                  <BsPersonCircle className="icon_admin" />
                </div>
                <div className="counts">
                  <p>EMP Count's</p>
                  <h3>{employee} </h3>
                </div>
              </div>
              <div className="counterCardname">
                <p className="counterCardTitle">Employee Detail</p>
              </div>
            </div>
          </div>
          <div className="col-sm-3">
            <div className="counterCard">
              <div className="counterCardmain">
                <div className="smallboxHR">
                  <BsFillHCircleFill className="icon_admin" />
                </div>
                <div className="counts">
                  <p>HR Count's</p>
                  <h3>{hr} </h3>
                </div>
              </div>
              <div className="counterCardname">
                <p className="counterCardTitle"> Human Resources</p>
              </div>
            </div>
          </div>
          <div className="col-sm-3">
            <div className="counterCard">
              <div className="counterCardmain">
                <div className="smallboxP">
                  <BsBarChartLineFill className="icon_admin" />
                </div>
                <div className="counts">
                  <p>Project's</p>
                  <h3>{project} </h3>
                </div>
              </div>
              <div className="counterCardname">
                <p className="counterCardTitle">Project Detail</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
