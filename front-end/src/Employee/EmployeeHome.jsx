import axios from "axios";
import React, { useEffect, useState } from "react";

function EmployeeHome() {
  const [sickLeave, setSickLeave] = useState(null);
  const [vacationLeave, setVacationLeave] = useState(null);
  const [reamaining, setRemaining] = useState(null);

  useEffect(() => {
    getLeaves();
  }, []);

  const getLeaves = () => {
    axios
      .get("http://localhost:8081/getLeaveDetails")
      .then((res) => {
        if (res.data.Status === "Success") {
          axios.get("http://localhost:8081/dashboard").then((result) => {
            let tempFinalResult = res?.data?.Result?.filter(
              (item) => item.employeeName === result?.data?.userName
            );
            const vacationLeaveCount = tempFinalResult.filter(
              (item) => item.leaveType === "Vecation"
            ).length;
            const scikLeaveCount = tempFinalResult.filter(
              (item) => item.leaveType === "Sick Leave"
            ).length;
            const remainingCount = 18 - tempFinalResult?.length;
            console.log("tempFinalResult", vacationLeaveCount);
            setSickLeave(scikLeaveCount);
            setVacationLeave(vacationLeaveCount);
            setRemaining(remainingCount);
          });
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <>
      {/* <div className="text-center pb-1 my-3 d-flex align-items-center justify-content-between px-3"> */}
      <div className="mainBody">
        <div className="mt-4">
          <div className="row">
            <div className="col-sm-3">
              <div className="counterCard">
                <div className="text-center pb-1">
                  <h4>Total Leave</h4>
                </div>
                <div className="count">
                  <h5>18</h5>
                </div>
              </div>
            </div>
            <div className="col-sm-3">
              <div className="counterCard">
                <div className="text-center pb-1">
                  <h4>Sick Leave</h4>
                </div>
                <div className="count">
                  <h5>{sickLeave}</h5>
                </div>
              </div>
            </div>
            <div className="col-sm-3">
              <div className="counterCard">
                <div className="text-center pb-1">
                  <h4>Vacation Leave</h4>
                </div>
                <div className="count">
                  <h5>{vacationLeave}</h5>
                </div>
              </div>
            </div>
            <div className="col-sm-3">
              <div className="counterCard">
                <div className="text-center pb-1">
                  <h4>Remaining</h4>
                </div>
                <div className="count">
                  <h5>{reamaining}</h5>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default EmployeeHome;
