import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Leads() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8081/getLead")
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
      .delete("http://localhost:8081/lead/delete/" + id)
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
        <h3>Lead List</h3>
      </div>
      <Link to="/Dashboard/addLead" className="btn btn-success">
        Add Lead
      </Link>
      <div className="mt-3">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Team Name</th>
              <th>User Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((result, index) => {
              return (
                <tr key={index}>
                  <td>{result.leadName}</td>
                  <td>{result.teamName}</td>
                  <td>{result.userName}</td>
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

export default Leads;
