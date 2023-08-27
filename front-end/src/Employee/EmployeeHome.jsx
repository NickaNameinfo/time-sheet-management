import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import {  BsBadgeTmFill, BsBarChartLineFill, BsFillHCircleFill, BsFillPersonBadgeFill, BsPersonCircle } from "react-icons/bs";

function EmployeeHome() {
  const [sickLeave, setSickLeave] = useState(null);
  const [vacationLeave, setVacationLeave] = useState(null);
  const [reamaining, setRemaining] = useState(null);
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [rowData, setRowData] = useState([]);
  const columnDefs = useMemo(
    () => [
      {
        field: "employeeName",
        minWidth: 170,
      },
      { field: "leaveType" },
      { field: "leaveFrom" },
      { field: "leaveTo" },
      { field: "leaveHours" },
      { field: "reason" },
      { field: "leaveStatus" },
      {
        headerName: "Action",
        pinned: "right",
        minWidth: 100,
        width: 100,
        field: "id",
        filter: false,
        editable: false,
        cellRenderer: (params, index) => (
          <div className="actions">
            {params?.data?.leaveStatus !== "approved" && (
              <i
                class="fa-solid fa-trash"
                onClick={() => handleDelete(params?.data?.id)}
              ></i>
            )}
          </div>
        ),
      },
    ],
    []
  );

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

            axios.get("http://localhost:8081/getLeaveDetails").then((res) => {
              if (res.data.Status === "Success") {
                let tempFinalResult = res?.data?.Result?.filter(
                  (item) => item.employeeName === result?.data?.userName
                );
                setRowData(tempFinalResult);
              } else {
                alert("Error");
              }
            });
          });
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const autoGroupColumnDef = useMemo(
    () => ({
      headerName: "Group",
      minWidth: 170,
      field: "athlete",
      valueGetter: (params) => {
        if (params.node.group) {
          return params.node.key;
        } else {
          return params.data[params.colDef.field];
        }
      },
      headerCheckboxSelection: false,
      cellRenderer: "agGroupCellRenderer",
      cellRendererParams: {
        checkbox: false,
      },
    }),
    []
  );

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
      .delete("http://localhost:8081/deleteLeave/" + id)
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
            <div className="col-sm-3">
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
            <div className="col-sm-3">
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
            <div className="col-sm-3">
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
                  <p className="counterCardTitle">Vacation Leave</p>
                </div>
              </div>
            </div>
            <div className="col-sm-3">
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
          </div>
        </div>
        <div className="text-center pb-1 my-3">
          <h4>Leave Details</h4>
        </div>
        <div style={containerStyle}>
          <div style={gridStyle} className="ag-theme-alpine">
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              autoGroupColumnDef={autoGroupColumnDef}
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
