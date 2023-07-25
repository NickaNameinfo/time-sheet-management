import axios from 'axios'
import React, { useEffect, useState } from 'react'

function TeamLeadHome() {
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
    </div>
  )
}
export default TeamLeadHome