import axios from "axios";
import React, { useEffect, useState } from "react";
import commonData from "../../common.json"
function HrHome() {
  return (
    <div>
      <div className="p-3 d-flex justify-content-around mt-3">
        <div className="px-3 pt-2 pb-3 border shadow-sm w-25">
          <div className="text-center pb-1">
            <h4>Employees</h4>
          </div>
          <hr />
          <div className="">
            <h5>Total:50 </h5>
          </div>
        </div>
      </div>

      {/* List of admin  */}
      <div className="mt-4 px-5 pt-3">
        <h3>List of Employee</h3>
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
              <td>
                <p className="statustd">Approved</p>
              </td>
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
              <td>
                <p className="statustd">Approved</p>
              </td>
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
              <td>
                <p className="statustd">Approved</p>
              </td>
              <td>
                <button>Approve</button>
                <button>Reject</button>
              </td>
            </tr>
            {/* {data.map((employee, index) => {
              return <tr key={index}>
                  <td>{employee.name}</td>
                  <td>{
                    <img src={``${commonData?.APIKEY}/images/`+employee.image} alt="" className='employee_image'/>
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

export default HrHome;
