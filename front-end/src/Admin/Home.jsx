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
      {/* List of admin  */}
      <div className="mt-4">
        {/* <h3 className="title">List of Projects</h3> */}
        <table className="table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Lead Name</th>
              <th>Team Members</th>
              <th>Project Start Date</th>
              <th>Project End Date</th>
              <th>Total Hours</th>
              <th>Remaining Hours</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Project 1</td>
              <td>Wateer Supply</td>
              <td>Admin</td>
              <td>09/05/2023</td>
              <td>08/011/2023</td>
              <td>90</td>
              <td>70</td>
            </tr>
            <tr>
              <td>Project 1</td>
              <td>Wateer Supply</td>
              <td>Admin</td>
              <td>09/05/2023</td>
              <td>08/011/2023</td>
              <td>90</td>
              <td>70</td>
            </tr>
            <tr>
              <td>Project 1</td>
              <td>Wateer Supply</td>
              <td>Admin</td>
              <td>09/05/2023</td>
              <td>08/011/2023</td>
              <td>90</td>
              <td>70</td>
            </tr>
            <tr>
              <td>Project 1</td>
              <td>Wateer Supply</td>
              <td>Admin</td>
              <td>09/05/2023</td>
              <td>08/011/2023</td>
              <td>90</td>
              <td>70</td>
            </tr>
            <tr>
              <td>Project 1</td>
              <td>Wateer Supply</td>
              <td>Admin</td>
              <td>09/05/2023</td>
              <td>08/011/2023</td>
              <td>90</td>
              <td>70</td>
            </tr>
            <tr>
              <td>Project 1</td>
              <td>Wateer Supply</td>
              <td>Admin</td>
              <td>09/05/2023</td>
              <td>08/011/2023</td>
              <td>90</td>
              <td>70</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Home;
