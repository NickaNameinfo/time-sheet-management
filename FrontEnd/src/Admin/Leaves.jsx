import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Leaves() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8081/getHr")
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
      .delete("http://localhost:8081/hr/delete/" + id)
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
        <h3>Leave List</h3>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Image</th>
              <th>Email</th>
              <th>Address</th>
              <th>Requested Date</th>
              <th>Approved Date</th>
              <th>Total Hours</th>
              <th>Remaning Hours</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Arun</td>
              <td>-</td>
              <td>Arun@gmail.com</td>
              <td>t nager</td>
              <td>10/11/23</td>
              <td>2/12/23</td>
              <td>80</td>
              <td>40</td>
              <td><p className="statustd">Approved</p></td>
              <td>
                <button>Approve</button>
                <button>Reject</button>
              </td>
            </tr>
            <tr>
              <td>Arun</td>
              <td>-</td>
              <td>Arun@gmail.com</td>
              <td>t nager</td>
              <td>10/11/23</td>
              <td>2/12/23</td>
              <td>80</td>
              <td>40</td>
              <td><p className="statustd">Approved</p></td>
              <td>
                <button>Approve</button>
                <button>Reject</button>
              </td>
            </tr>
            <tr>
              <td>Arun</td>
              <td>-</td>
              <td>Arun@gmail.com</td>
              <td>t nager</td>
              <td>10/11/23</td>
              <td>2/12/23</td>
              <td>80</td>
              <td>40</td>
              <td><p className="statustd">Approved</p></td>
              <td>
                <button>Approve</button>
                <button>Reject</button>
              </td>
            </tr>
            {/* {data.map((employee, index) => {
              return <tr key={index}>
                  <td>{employee.name}</td>
                  <td>{
                    <img src={`http://localhost:8081/images/`+employee.image} alt="" className='employee_image'/>
                    }</td>
                  <td>{employee.email}</td>
                  <td>{employee.address}</td>
                  <td>
                    {/* <Link to={`/Dashboard/employeeEdit/`+employee.id} className='btn btn-primary btn-sm me-2'>edit</Link> */}
            {/* <button onClick={e => handleDelete(employee.id)} className='btn btn-sm btn-danger'>delete</button>
                  </td> */}
            {/* </tr> */}
            {/* })} */}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Leaves;
