import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import commonData from "../../../common.json";

const LeaveReport = () => {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [projectDetails, setProjectDetails] = useState([]);
  const [exportApi, setExportApi] = React.useState(null);
  const [totalLeave, setTotalLeave] = React.useState(0);

  console.log(projectDetails, "projectDetails");
  React.useEffect(() => {
    onGridReady();
  }, []);

  const getTotalLeaves = (data) => {
    console.log(data, "data123213412370429");
    const employeeLeaveData = {};

    // Iterate through the data array and sum leaveHours for each leaveType and employee
    for (const entry of data) {
      const { leaveType, leaveHours, employeeName, employeeId } = entry;
      const key = `${employeeName}-${employeeId}`;

      if (!employeeLeaveData[key]) {
        employeeLeaveData[key] = {};
      }

      if (!employeeLeaveData[key][leaveType]) {
        employeeLeaveData[key][leaveType] = parseInt(leaveHours, 10) || 0; // Initialize to leaveHours for a new combination
      } else {
        employeeLeaveData[key][leaveType] += parseInt(leaveHours, 10) || 0; // Increment by leaveHours for an existing combination
      }
    }

    // Convert the data into an array of objects
    const resultArray = Object.keys(employeeLeaveData).map((key) => {
      const [employeeName, employeeId] = key.split("-");
      const leaveTypeData = employeeLeaveData[key];
      const totalCount = Object.values(leaveTypeData).reduce(
        (total, count) => total + count,
        0
      );
      // console.log(totalCount, "totalCount");
      // setTotalLeave(totalCount);
      return {
        employeeName,
        employeeId,
        ...leaveTypeData,
        totalCount,
      };
    });

    console.log(resultArray, "resultArray");

    return resultArray;
  };

  const onGridReady = (params) => {
    setExportApi(params?.api);
    axios
      .get(`${commonData?.APIKEY}/getLeaveDetails`)
      .then((res) => {
        if (res.data.Status === "Success") {
          let result = getTotalLeaves(res.data.Result);
          setProjectDetails(result);

          console.log(result, "2342result");
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
        minWidth: 100,
      },
      {
        field: "employeeId",
        minWidth: 100,
      },
      {
        field: "Casual Leave",
        minWidth: 100,
      },
      {
        field: "Sick Leave",
        minWidth: 100,
      },
      {
        field: "Earned Leave",
        minWidth: 100,
      },
      {
        field: "Comp-off",
        minWidth: 100,
      },
      {
        field: "LOP",
        minWidth: 100,
      },
      {
        headerName: "Total Leaves",
        field: "totalCount",
        minWidth: 100,
        // valueGetter: (params, index) => {
        //   return totalLeave;
        // },
      },
    ],
    [projectDetails]
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

  const onClickExport = () => {
    console.log(exportApi, "grdiApigrdiApi");
    exportApi.exportDataAsCsv();
  };

  return (
    <>
      <div className="text-center pb-1 my-3">
        <h4>Leave Report</h4>
      </div>
      <div style={containerStyle}>
        <Button
          onClick={() => onClickExport()}
          variant="contained"
          className="mb-3 mx-3"
        >
          Export{" "}
        </Button>
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
