import axios from "axios";
import React, { useEffect, useState } from "react";

function Home() {
  const [adminCount, setAdminCount] = useState(null);
  const [employeeCount, setEmployeeCount] = useState(null);
  const [salary, setSalary] = useState(null);

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
                <h5>{adminCount}</h5>
              </div>
            </div>
          </div>
          <div className="col-sm-3">
            <div className="counterCard">
              <div className="text-center pb-1">
                <h4>Employee</h4>
              </div>
              <div className="count">
                <h5>{adminCount}</h5>
              </div>
            </div>
          </div>
          <div className="col-sm-3">
            <div className="counterCard">
              <div className="text-center pb-1">
                <h4>Hr</h4>
              </div>
              <div className="count">
                <h5>{adminCount}</h5>
              </div>
            </div>
          </div>
          <div className="col-sm-3">
            <div className="counterCard">
              <div className="text-center pb-1">
                <h4>Projects</h4>
              </div>
              <div className="count">
                <h5>{adminCount}</h5>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
