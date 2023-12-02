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

  console.log(projectDetails, "projectDetails");
  React.useEffect(() => {
    onGridReady();
  }, []);

  const getTotalLeaves = (data) => {
    const countsByEmployee = {};

    // Iterate through the data array and count entries for each employee
    for (const entry of data) {
      const { employeeId, employeeName } = entry;
      const employeeKey = `${employeeId}-${employeeName}`;

      if (!countsByEmployee[employeeKey]) {
        countsByEmployee[employeeKey] = 1; // Initialize the count to 1 for a new employee
      } else {
        countsByEmployee[employeeKey]++; // Increment the count for an existing employee
      }
    }

    // Convert the counts into an array of objects
    const countsArray = Object.keys(countsByEmployee).map((employeeKey) => {
      const [employeeId, employeeName] = employeeKey.split("-");
      const count = countsByEmployee[employeeKey];
      return {
        employeeId,
        employeeName,
        count,
      };
    });

    return countsArray;
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
        minWidth: 170,
      },
      {
        field: "employeeId",
        minWidth: 170,
      },
      {
        field: "count",
        headerName: "Total Leaves",
        minWidth: 170,
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
