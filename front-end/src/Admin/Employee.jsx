import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Employee() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8081/getEmployee")
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
      .delete("http://localhost:8081/delete/" + id)
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
        <h3>Employee List</h3>
      </div>
      <Link to="/Dashboard/create" className="btn btn-success">
        Add Employee
      </Link>
      <div className="mt-3">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Image</th>
              <th>Email</th>
              <th>EMPID</th>
              <th>User Name</th>
              <th>Discipline</th>
              <th>Designation</th>
              <th>Join Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((result, index) => {
              return (
                <tr key={index}>
                  <td>{result.employeeName}</td>
                  <td>
                    {
                      <img
                        src={
                          `http://localhost:8081/images/` + result.employeeImage
                        }
                        alt=""
                        className="employee_image"
                      />
                    }
                  </td>
                  <td>{result.employeeEmail}</td>
                  <td>{result.EMPID}</td>
                  <td>{result.userName}</td>
                  <td>{result.discipline}</td>
                  <td>{result.designation}</td>
                  <td>{result.date}</td>
                  <td>
                    <Link
                      to={`/Dashboard/employeeEdit/` + result.id}
                      className="btn btn-primary btn-sm me-2"
                    >
                      edit
                    </Link>
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

export default Employee;
