import axios from "axios";
import React, { useEffect, useState } from "react";

function Home() {
  const [lead, setLead] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [hr, setHr] = useState(null);
  const [project, setProject] = useState(null);

  useEffect(() => {
    getHr();
    getProject()
    getTl()
    getEmployee()
  }, []);

  const getProject = () => {
    axios
      .get("http://localhost:8081/getProject")
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
      .get("http://localhost:8081/getLead")
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
      .get("http://localhost:8081/getEmployee")
      .then((res) => {
        if (res.data.Status === "Success") {
          setEmployee(res.data.Result.length);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };
  const getHr = () => {
    axios
      .get("http://localhost:8081/getHr")
      .then((res) => {
        if (res.data.Status === "Success") {
          setHr(res.data.Result.length);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };
  return (
    <div className="mainBody">
      <div className="mt-4">
        <div className="row">
          <div className="col-sm-3">
            <div className="counterCard">
              <div className="text-center pb-1">
                <h4>Team Lead</h4>
              </div>
              <div className="count">
                <h5>{lead}</h5>
              </div>
            </div>
          </div>
          <div className="col-sm-3">
            <div className="counterCard">
              <div className="text-center pb-1">
                <h4>Employee</h4>
              </div>
              <div className="count">
                <h5>{employee}</h5>
              </div>
            </div>
          </div>
          <div className="col-sm-3">
            <div className="counterCard">
              <div className="text-center pb-1">
                <h4>Hr</h4>
              </div>
              <div className="count">
                <h5>{hr}</h5>
              </div>
            </div>
          </div>
          <div className="col-sm-3">
            <div className="counterCard">
              <div className="text-center pb-1">
                <h4>Projects</h4>
              </div>
              <div className="count">
                <h5>{project}</h5>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
