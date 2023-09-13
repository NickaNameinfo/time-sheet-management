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

function EmployeeHome() {
  const [sickLeave, setSickLeave] = useState(null);
  const [vacationLeave, setVacationLeave] = useState(null);
  const [reamaining, setRemaining] = useState(null);
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [rowData, setRowData] = useState(null);
  const [weekData, setWeekDate] = React.useState(null);

  const columnDefs = useMemo(
    () => [
      { field: weekData?.[0], cellRenderer: () => <p>9.30AM / 7.30PM</p> },
      { field: weekData?.[1], cellRenderer: () => <p>9.30AM / 7.30PM</p> },
      { field: weekData?.[2], cellRenderer: () => <p>9.30AM / 7.30PM</p> },
      { field: weekData?.[3], cellRenderer: () => <p>9.30AM / 7.30PM</p> },
      { field: weekData?.[4], cellRenderer: () => <p>9.30AM / 7.30PM</p> },
      { field: weekData?.[5], cellRenderer: () => <p>9.30AM / 7.30PM</p> },
      { field: weekData?.[6], cellRenderer: () => <p>9.30AM / 7.30PM</p> },
    ],
    [weekData]
  );

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    let datesss = getWeekDates(getCurrentWeekNumber(), currentYear);
    setWeekDate(datesss);
    let data = [
      {
        inTime: "9.30AM",
        outTIme: "7.30PM",
      },
    ];
    console.log(datesss, "datesssdatesss");
    setRowData(data);
  }, []);

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
    console.log(dates, "datesdates123234123");
    return dates;
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

  const handleDelete = (id) => {
    axios
      .delete("http://192.168.0.10:8081/deleteLeave/" + id)
      .then((res) => {
        if (res.data.Status === "Success") {
          getLeaves();
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
            <div className="col">
              <div className="counterCard">
                <div className="counterCardmain">
                  <div className="smallboxTL">
                    <BsBadgeTmFill className="icon_admin" />
                  </div>
                  <div className="counts">
                    <p>Count</p>
                    <h3>18</h3>
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
