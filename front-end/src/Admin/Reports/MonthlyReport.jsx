import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";

const MonthlyReport = () => {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [projectDetails, setProjectDetails] = useState([]);
  const [workDetails, setWorkDetails] = useState([]);
  const [projectWorkHours, setProjectWorkHours] = React.useState(null);
  console.log(workDetails, "workDetailsworkDetails");
  React.useEffect(() => {
    onGetWorkDetails();
    onGridReady();
  }, []);
  React.useEffect(() => {
    const workingHoursByMonth = {};

    // Loop through the data and organize it by month
    workDetails.forEach((item) => {
      const date = new Date(item.sentDate);
      const monthKey = date.toLocaleString("default", { month: "long" }); // Example: "2023-9"

      if (!workingHoursByMonth[monthKey]) {
        workingHoursByMonth[monthKey] = 0;
      }

      workingHoursByMonth[monthKey] += item.totalHours;
    });

    setProjectWorkHours(workingHoursByMonth);
    console.log(workingHoursByMonth, "projectTotalHours");
  }, [workDetails]);

  const onGridReady = (params) => {
    axios
      .get("http://localhost:8081/getProject")
      .then((res) => {
        if (res.data.Status === "Success") {
          setProjectDetails(res.data.Result);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const onGetWorkDetails = (params) => {
    axios
      .get("http://localhost:8081/getWrokDetails")
      .then((res) => {
        if (res.data.Status === "Success") {
          setWorkDetails(res.data.Result);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const getTotalHoursForWeek = (data) => {
    const totalHours = data.reduce((acc, item) => acc + item.totalHours, 0);
    return totalHours;
  };

  const columnDefs = useMemo(
    () => [
      {
        field: "referenceNo",
        minWidth: 170,
      },
      // { field: "discipline" },
      { field: "projectName", minWidth: 170 },
      {
        field: "January",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          return (
            <>
              {projectWorkHours[String(params.colDef.field)]
                ? projectWorkHours[String(params.colDef.field)]
                : 0}
            </>
          );
        },
      },
      {
        field: "Februbary",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          return (
            <>
              {projectWorkHours[String(params.colDef.field)]
                ? projectWorkHours[String(params.colDef.field)]
                : 0}
            </>
          );
        },
      },
      {
        field: "March",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          return (
            <>
              {projectWorkHours[String(params.colDef.field)]
                ? projectWorkHours[String(params.colDef.field)]
                : 0}
            </>
          );
        },
      },
      {
        field: "April",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          return (
            <>
              {projectWorkHours[String(params.colDef.field)]
                ? projectWorkHours[String(params.colDef.field)]
                : 0}
            </>
          );
        },
      },
      {
        field: "May",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          return (
            <>
              {projectWorkHours[String(params.colDef.field)]
                ? projectWorkHours[String(params.colDef.field)]
                : 0}
            </>
          );
        },
      },
      {
        field: "June",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          return (
            <>
              {projectWorkHours[String(params.colDef.field)]
                ? projectWorkHours[String(params.colDef.field)]
                : 0}
            </>
          );
        },
      },
      {
        field: "July",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          return (
            <>
              {projectWorkHours[String(params.colDef.field)]
                ? projectWorkHours[String(params.colDef.field)]
                : 0}
            </>
          );
        },
      },
      {
        field: "August",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          return (
            <>
              {projectWorkHours[String(params.colDef.field)]
                ? projectWorkHours[String(params.colDef.field)]
                : 0}
            </>
          );
        },
      },
      {
        field: "September",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          return (
            <>
              {projectWorkHours[String(params.colDef.field)]
                ? projectWorkHours[String(params.colDef.field)]
                : 0}
            </>
          );
        },
      },
      {
        field: "October",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          return (
            <>
              {projectWorkHours[String(params.colDef.field)]
                ? projectWorkHours[String(params.colDef.field)]
                : 0}
            </>
          );
        },
      },
      {
        field: "Novermber",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          return (
            <>
              {projectWorkHours[String(params.colDef.field)]
                ? projectWorkHours[String(params.colDef.field)]
                : 0}
            </>
          );
        },
      },
      {
        field: "December",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          return (
            <>
              {projectWorkHours[String(params.colDef.field)]
                ? projectWorkHours[String(params.colDef.field)]
                : 0}
            </>
          );
        },
      },
    ],
    [projectWorkHours]
  );

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

  return (
    <>
      <div className="text-center pb-1 my-3">
        <h4>Project Monthly Report</h4>
      </div>
      <div style={containerStyle}>
        <div style={gridStyle} className="ag-theme-alpine leavetable">
          <AgGridReact
            rowData={projectDetails}
            columnDefs={columnDefs}
            autoGroupColumnDef={autoGroupColumnDef}
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

export default MonthlyReport;
