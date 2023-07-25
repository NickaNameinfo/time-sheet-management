import axios from 'axios'
import React, { useEffect, useState } from 'react'

function EmployeeHome() {
  return (
    <div>
      <div className='p-3 d-flex justify-content-around mt-3'>
        <div className='px-3 pt-2 pb-3 border shadow-sm w-25'>
          <div className='text-center pb-1'>
            <h4>Assigned Projects</h4>
          </div>
          <hr />
          <div className=''>
            <h5>Total:2 </h5>
          </div>
        </div>
        <div className='px-3 pt-2 pb-3 border shadow-sm w-25'>
          <div className='text-center pb-1'>
            <h4>Applied Leaves</h4>
          </div>
          <hr />
          <div className=''>
            <h5>Total: 3</h5>
          </div>
        </div>
        <div className='px-3 pt-2 pb-3 border shadow-sm w-25'>
          <div className='text-center pb-1'>
            <h4>Remaining  Leaves</h4>
          </div>
          <hr />
          <div className=''>
            <h5>Total: 1</h5>
          </div>
        </div>
      </div>

      {/* List of admin  */}
      <div className='mt-4 px-5 pt-3'>
        <h3>List of Projects</h3>
        <table className='table'>
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
  )
}

export default EmployeeHome