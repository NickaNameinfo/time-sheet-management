import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";

const LeaveReport = () => {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [projectDetails, setProjectDetails] = useState([]);
  const [workDetails, setWorkDetails] = useState([]);
  const [projectWorkHours, setProjectWorkHours] = React.useState(null);
  console.log(workDetails, "workDetailsworkDetails");

  React.useEffect(() => {
    onGridReady();
  }, []);

  const onGridReady = (params) => {
    axios
      .get("http://192.168.0.10:8081/getLeaveDetails")
      .then((res) => {
        if (res.data.Status === "Success") {
          setProjectDetails(res.data.Result);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const columnDefs = useMemo(
    () => [
      {
        field: "employeeName",
        minWidth: 170,
      },
      {
        field: "leaveType",
        minWidth: 170,
      },
      {
        field: "leaveFrom",
        minWidth: 170,
      },
      {
        field: "leaveTo",
        minWidth: 170,
      },
      {
        field: "leaveHours",
        minWidth: 170,
      },
      {
        field: "totalLeaves",
        minWidth: 170,
      },
      {
        field: "leaveStatus",
        minWidth: 170,
      },
    ],
    [projectWorkHours]
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

  return (
    <>
      <div className="text-center pb-1 my-3">
        <h4>Leave Report</h4>
      </div>
      <div style={containerStyle}>
        <div style={gridStyle} className="ag-theme-alpine leavetable">
          <AgGridReact
            rowData={projectDetails}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            suppressRowClickSelection={true}
            groupSelectsChildren={true}
            rowSelection={"single"}
            rowGroupPanelShow={"always"}
            pivotPanelShow={"always"}
            pagination={true}
            onGridReady={onGridReady}
            onSelectionChanged={(event) => onSelectionChanged(event)}
          />
        </div>
      </div>
    </>
  );
};

export default LeaveReport;
