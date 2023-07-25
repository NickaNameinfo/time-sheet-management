import axios from "axios";
import React, { useEffect, useState } from "react";

function Home() {
  const [adminCount, setAdminCount] = useState();
  const [employeeCount, setEmployeeCount] = useState();
  const [salary, setSalary] = useState();

  useEffect(() => {
    axios
      .get("http://localhost:8081/adminCount")
      .then((res) => {
        setAdminCount(res.data[0].admin);
      })
      .catch((err) => console.log(err));

    axios
      .get("http://localhost:8081/employeeCount")
      .then((res) => {
        setEmployeeCount(res.data[0].employee);
      })
      .catch((err) => console.log(err));

    axios
      .get("http://localhost:8081/salary")
      .then((res) => {
        setSalary(res.data[0].sumOfSalary);
      })
      .catch((err) => console.log(err));
  }, []);
  return (
    <div>
      <div className="p-3 row justify-content-around mt-3">
        <div className="col-sm-3">
          <div className="px-3 pt-2 pb-3 border shadow-sm">
            <div className="text-center pb-1">
              <h4>Team Lead</h4>
            </div>
            <hr />
            <div className="">
              <h5>Total: {adminCount}</h5>
            </div>
          </div>
        </div>
        <div className="col-sm-3">
          <div className="px-3 pt-2 pb-3 border shadow-sm">
            <div className="text-center pb-1">
              <h4>Employee</h4>
            </div>
            <hr />
            <div className="">
              <h5>Total: {adminCount}</h5>
            </div>
          </div>
        </div>
        <div className="col-sm-3">
          <div className="px-3 pt-2 pb-3 border shadow-sm">
            <div className="text-center pb-1">
              <h4>Hr</h4>
            </div>
            <hr />
            <div className="">
              <h5>Total: {adminCount}</h5>
            </div>
          </div>
        </div>
        <div className="col-sm-3">
          <div className="px-3 pt-2 pb-3 border shadow-sm">
            <div className="text-center pb-1">
              <h4>Projects</h4>
            </div>
            <hr />
            <div className="">
              <h5>Total: {adminCount}</h5>
            </div>
          </div>
        </div>
        <div className="col-sm-12">
          {/* List of admin  */}
          <div className="mt-4 pt-3">
            <h3>List of Lead</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Project Name</th>
                  <th>Project Start Date</th>
                  <th>Project End Date</th>
                  <th>Team Members</th>
                  <th>Lead Id</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Mohan</td>
                  <td>Water Supply</td>
                  <td>01/08/23</td>
                  <td>01/12/23</td>
                  <td>23</td>
                  <td>1</td>
                </tr>
                <tr>
                  <td>Arun</td>
                  <td>Water Supply</td>
                  <td>01/08/23</td>
                  <td>01/12/23</td>
                  <td>23</td>
                  <td>2</td>
                </tr>
                <tr>
                  <td>kumar</td>
                  <td>Water Supply</td>
                  <td>01/08/23</td>
                  <td>01/12/23</td>
                  <td>23</td>
                  <td>3</td>
                </tr>
                <tr>
                  <td>Mohan</td>
                  <td>Water Supply</td>
                  <td>01/08/23</td>
                  <td>01/12/23</td>
                  <td>23</td>
                  <td>4</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
