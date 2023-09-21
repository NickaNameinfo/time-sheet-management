import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import {
  BsBadgeTmFill,
  BsBarChartLineFill,
  BsFillHCircleFill,
  BsFillPersonBadgeFill,
  BsPersonCircle,
} from "react-icons/bs";
import commonData from "../../common.json";
function EmployeeHome() {
  const [totalLeaves, setTotalLeaves] = React.useState(null);
  const [sickLeave, setSickLeave] = useState(null);
  const [vacationLeave, setVacationLeave] = useState(null);
  const [reamaining, setRemaining] = useState(null);
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [rowData, setRowData] = useState(null);
  const [weekData, setWeekDate] = React.useState(null);
  const [inOutTIme, setInOutTime] = React.useState(null);
  const [userDetails, setUserDetails] = React.useState(null);
  const [appliedLeaves, setAppliedLeaves] = React.useState(null);
  console.log(userDetails, "rowDatarowData", rowData);

  React.useEffect(() => {
    if (userDetails) {
      getUserInfo();
    }
    getLeaves();
  }, [userDetails]);

  const getWorkMonth = (startDateString, endDateString) => {
    const currentDate = new Date();
    let totalMonths = 0;
    let currentDateIterator = new Date(startDateString);
    while (currentDateIterator < currentDate) {
      if (currentDateIterator.getDate() >= 20) {
        // If the current date is 20 or later in the month, increment the total months
        totalMonths++;
      }
      // Move to the next month
      currentDateIterator.setMonth(currentDateIterator.getMonth() + 1);
      currentDateIterator.setDate(21);
    }
    console.log(totalMonths, "totalMonthstotalMonths");
    return totalMonths; // Moved the return statement outside of the while loop
  };

  const getCurrentDateInFormat = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Adding 1 because JavaScript months are zero-based
    const day = String(currentDate.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  };

  const calculateAvailableLeaves = (
    workingMonthsPerYear,
    annualLeaveAllocation,
    status
  ) => {
    let months = status === "Probation" ? 6 : 12;
    const leavesPerMonth = annualLeaveAllocation / months; // Divide by 12 months in a year
    const availableLeaves = Math.round(leavesPerMonth * workingMonthsPerYear);
    return availableLeaves;
  };

  const getUserInfo = async () => {
    let useResult = await axios.get(
      `${commonData?.APIKEY}/get/${userDetails?.data?.id}`
    );
    let monthData = getWorkMonth(
      useResult?.data?.Result[0]?.date,
      getCurrentDateInFormat()
    );

    const annualLeaves =
      useResult?.data?.Result[0]?.employeeStatus === "Probation" ? 6 : 18; // Total annual leave allocation
    const availableLeaves = calculateAvailableLeaves(
      monthData,
      annualLeaves,
      useResult?.data?.Result[0]?.employeeStatus
    );
    setTotalLeaves(availableLeaves);
    setRemaining(availableLeaves - appliedLeaves?.length);
    console.log(availableLeaves, "useResultuseResult", useResult);
  };

  const getLeaves = () => {
    axios
      .get(`${commonData?.APIKEY}/getLeaveDetails`)
      .then((res) => {
        if (res.data.Status === "Success") {
          axios.get(`${commonData?.APIKEY}/dashboard`).then((result) => {
            let tempFinalResult = res?.data?.Result?.filter(
              (item) => item.employeeName === result?.data?.userName
            );
            setAppliedLeaves(tempFinalResult);

            const vacationLeaveCount = tempFinalResult.filter(
              (item) => item.leaveType === "Vecation"
            ).length;
            const scikLeaveCount = tempFinalResult.filter(
              (item) => item.leaveType === "Sick Leave"
            ).length;
            console.log(tempFinalResult, "tempFinalResult", vacationLeaveCount);
            setSickLeave(scikLeaveCount);
            setVacationLeave(vacationLeaveCount);
          });
        }
      })

      .catch((err) => console.log(err));
  };

  const columnDefs = useMemo(
    () => [
      {
        field: "type",
      },
      {
        field: weekData?.[0],
        cellRenderer: (params) => (
          <p>
            {formatDate(params.data?.item?.LogDate) === params.colDef.field
              ? getInTime(params.data?.item?.LogDate)
              : null}

            {console.log(
              formatDate(inOutTIme?.[0]?.LogDate),
              "params.data",
              params.data,
              params.colDef.field
            )}
          </p>
        ),
      },
      {
        field: weekData?.[1],
        cellRenderer: (params) => (
          <p>
            {formatDate(params.data?.item?.LogDate) === params.colDef.field
              ? getInTime(params.data?.item?.LogDate)
              : null}
          </p>
        ),
      },
      {
        field: weekData?.[2],
        cellRenderer: (params) => (
          <p>
            {formatDate(params.data?.item?.LogDate) === params.colDef.field
              ? getInTime(params.data?.item?.LogDate)
              : null}
          </p>
        ),
      },
      {
        field: weekData?.[3],
        cellRenderer: (params) => (
          <p>
            {formatDate(params.data?.item?.LogDate) === params.colDef.field
              ? getInTime(params.data?.item?.LogDate)
              : null}
          </p>
        ),
      },
      {
        field: weekData?.[4],
        cellRenderer: (params) => (
          <p>
            {formatDate(params.data?.item?.LogDate) === params.colDef.field
              ? getInTime(params.data?.item?.LogDate)
              : null}
          </p>
        ),
      },
      {
        field: weekData?.[5],
        cellRenderer: (params) => (
          <p>
            {formatDate(params.data?.item?.LogDate) === params.colDef.field
              ? getInTime(params.data?.item?.LogDate)
              : null}
          </p>
        ),
      },
      {
        field: weekData?.[6],
        cellRenderer: (params) => (
          <p>
            {formatDate(params.data?.item?.LogDate) === params.colDef.field
              ? getInTime(params.data?.item?.LogDate)
              : null}
          </p>
        ),
      },
    ],
    [weekData, rowData]
  );

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    let datesss = getWeekDates(getCurrentWeekNumber(), currentYear);
    setWeekDate(datesss);
    getInOutTime();
  }, []);

  const getInTime = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const amOrPm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
    const formattedMinutes = minutes.toString().padStart(2, "0"); // Ensure minutes are always two digits

    return `${formattedHours}:${formattedMinutes} ${amOrPm}`;
  };

  const formatDate = (inputDate) => {
    const date = new Date(inputDate);
    const month = date.getMonth() + 1; // Month is zero-based, so add 1
    const day = date.getDate();
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  };

  const getCurrentWeekNumber = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1); // Changed day from 0 to 1
    const diff = now - startOfYear;
    const oneWeekInMilliseconds = 7 * 24 * 60 * 60 * 1000;
    const weekNumber = Math.floor(diff / oneWeekInMilliseconds) + 1; // Added 1 to account for week 0
    console.log(weekNumber, "weekNumber");
    return weekNumber;
  };

  const startOfWeek = (date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? 1 : 1); // Adjust for Sunday as start of week
    return new Date(date.setDate(diff));
  };

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const getWeekDates = (weekNumber, year) => {
    const startDate = startOfWeek(new Date(year, 0, 1)); // January 1st of the year
    const daysToAdd = (weekNumber - 1) * 7; // Adjust for the selected week number
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(startDate, daysToAdd + i);
      dates.push(date.toLocaleDateString());
    }
    return dates;
  };

  const getInOutTime = () => {
    axios
      .get(`${commonData?.APIKEY}/getBioDetails`)
      .then(async (res) => {
        if (res.data.Status === "Success") {
          let userDetails = await axios.get(`${commonData?.APIKEY}/dashboard`);
          setUserDetails(userDetails);
          console.log(userDetails, "userDetails", res);
          let result = res.data.Result?.filter(
            (item) =>
              String(item.UserId) === String(userDetails?.data?.employeeId)
          );
          setInOutTime(result);
          let rowData = [
            {
              type: "IN",
              item: result[0],
            },
            {
              type: "OUT",
              item: result[1],
            },
          ];
          setRowData(rowData);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };
  const defaultColDef = useMemo(
    () => ({
      editable: false,
      enableRowGroup: true,
      enablePivot: true,
      enableValue: true,
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter: true,
      flex: 1,
      minWidth: 100,
    }),
    []
  );

  return (
    <>
      {/* <div className="text-center pb-1 my-3 d-flex align-items-center justify-content-between px-3"> */}
      <div className="mainBody">
        <div className="mt-4">
          <div className="row">
            <div className="col">
              <div className="counterCard">
                <div className="counterCardmain">
                  <div className="smallboxTL">
                    <BsBadgeTmFill className="icon_admin" />
                  </div>
                  <div className="counts">
                    <p>Count</p>
                    <h3>{totalLeaves}</h3>
                  </div>
                </div>
                <div className="counterCardname">
                  <p className="counterCardTitle">Leave</p>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="counterCard">
                <div className="counterCardmain">
                  <div className="smallboxE">
                    <BsPersonCircle className="icon_admin" />
                  </div>
                  <div className="counts">
                    <p>Count</p>
                    <h3>{sickLeave} </h3>
                  </div>
                </div>
                <div className="counterCardname">
                  <p className="counterCardTitle">Sick Leave</p>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="counterCard">
                <div className="counterCardmain">
                  <div className="smallboxHR">
                    <BsFillHCircleFill className="icon_admin" />
                  </div>
                  <div className="counts">
                    <p>Count</p>
                    <h3>{vacationLeave} </h3>
                  </div>
                </div>
                <div className="counterCardname">
                  <p className="counterCardTitle">Casual Leave</p>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="counterCard">
                <div className="counterCardmain">
                  <div className="smallboxP">
                    <BsBarChartLineFill className="icon_admin" />
                  </div>
                  <div className="counts">
                    <p>Count</p>
                    <h3>{reamaining} </h3>
                  </div>
                </div>
                <div className="counterCardname">
                  <p className="counterCardTitle">Remaining Leave</p>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="counterCard">
                <div className="counterCardmain">
                  <div className="smallboxP">
                    <BsBarChartLineFill className="icon_admin" />
                  </div>
                  <div className="counts">
                    <p>Count</p>
                    <h3>{reamaining} </h3>
                  </div>
                </div>
                <div className="counterCardname">
                  <p className="counterCardTitle">Earned Leave</p>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="counterCard">
                <div className="counterCardmain">
                  <div className="smallboxP">
                    <BsBarChartLineFill className="icon_admin" />
                  </div>
                  <div className="counts">
                    <p>Count</p>
                    <h3>{reamaining} </h3>
                  </div>
                </div>
                <div className="counterCardname">
                  <p className="counterCardTitle">Composition Leave</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center pb-1 my-3">
          <h4>Time Sheet</h4>
        </div>
        <div style={containerStyle}>
          <div style={gridStyle} className="ag-theme-alpine">
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              suppressRowClickSelection={true}
              groupSelectsChildren={true}
              rowSelection={"single"}
              rowGroupPanelShow={"always"}
              pivotPanelShow={"always"}
              pagination={true}
              onSelectionChanged={(event) => onSelectionChanged(event)}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default EmployeeHome;
