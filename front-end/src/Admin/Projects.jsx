import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Projects() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8081/getProject")
      .then((res) => {
        if (res.data.Status === "Success") {
          setData(res.data.Result);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  }, []);

  const handleDelete = (id) => {
    axios
      .delete("http://localhost:8081/project/delete/" + id)
      .then((res) => {
        if (res.data.Status === "Success") {
          window.location.reload(true);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <div className="px-5 py-3">
      <div className="d-flex justify-content-center mt-2">
        <h3>Project List</h3>
      </div>
      <Link to="/Dashboard/addProject" className="btn btn-success">
        Add Project
      </Link>
      <div className="mt-3">
        <table className="table">
          <thead>
            <tr>
              <th>Tl Name</th>
              <th>Order Id</th>
              <th>Position Number</th>
              <th>Sub Position Number</th>
              <th>Project Number</th>
              <th>Task job Number</th>
              <th>Project Name</th>
              <th>Sub Division</th>
              <th>Start Date</th>
              <th>Target Date</th>
              <th>Allotated Hours</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((result, index) => {
              return (
                <tr key={index}>
                  <td>{result.tlName}</td>
                  <td>{result.orderId}</td>
                  <td>{result.positionNumber}</td>
                  <td>{result.subPositionNumber}</td>
                  <td>{result.projectNo}</td>
                  <td>{result.taskJobNo}</td>
                  <td>{result.prjectName}</td>
                  <td>{result.subDivision}</td>
                  <td>{result.startDateOrderreleasedDate}</td>
                  <td>{result.targetDate}</td>
                  <td>{result.allotatedHours}</td>
                  <td>
                    <button
                      onClick={(e) => handleDelete(result.id)}
                      className="btn btn-sm btn-danger"
                    >
                      delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Projects;
