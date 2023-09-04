import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";

const YearlyReport = () => {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [projectDetails, setProjectDetails] = useState([]);
  const [workDetails, setWorkDetails] = useState([]);
  const [projectWorkHours, setProjectWorkHours] = React.useState(null);
  const [yearBasedDetails, setYearBasedDetails] = React.useState();
  console.log(workDetails, "workDetailsworkDetails");
  React.useEffect(() => {
    onGetWorkDetails();
    onGridReady();
  }, []);

  React.useEffect(() => {
    const projectData = workDetails.reduce((acc, entry) => {
      const projectName = entry.projectName;
      if (!acc[projectName]) {
        acc[projectName] = [];
      }
      acc[projectName].push(entry.totalHours);
      return acc;
    }, {});

    const projectTotalHours = Object.keys(projectData).map((projectName) => {
      const totalHours = projectData[projectName].reduce(
        (sum, hours) => sum + hours,
        0
      );
      return { projectName, totalHours };
    });
    setProjectWorkHours(projectTotalHours);

    // Create an array to store data for each year
    const yearlyData = workDetails?.reduce((acc, item) => {
      // Extract the year from the sentDate
      const year = new Date(item.sentDate).getFullYear();

      // Find the corresponding year's data in the accumulator
      const yearData = acc.find((dataItem) => dataItem.year === year);

      if (!yearData) {
        // If the year's data doesn't exist, create it
        const newYearData = {
          year,
          totalHours: 0,
          projectName: item.projectName,
          referenceNo: item.referenceNo,
          allotatedHours: item.allotatedHours,
        };
        newYearData.totalHours += item.totalHours;
        acc.push(newYearData);
      } else {
        // If the year's data already exists, update it
        yearData.totalHours += item.totalHours;
      }

      return acc;
    }, []);
    setYearBasedDetails(yearlyData);
    console.log(yearlyData, "totalHoursPerYeartotalHoursPerYear");
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

  const columnDefs = useMemo(
    () => [
      {
        field: "referenceNo",
        minWidth: 170,
      },
      {
        field: "year",
      },
      { field: "projectName", minWidth: 170 },
      { field: "allotatedHours" },
      { field: "totalHours", headerName: "Total Work Hours" },
      {
        field: "Utilization",
        cellRenderer: (params, index) => {
          const completionPercentage =
            (params?.data?.totalHours / params?.data?.allotatedHours) * 100;
          const remainingPercentage = 100 - completionPercentage;

          return (
            <div style={{ color: "green" }}>
              {remainingPercentage?.toFixed(2)}%
            </div>
          );
        },
      },
      {
        field: "Idle Hours",
        cellRenderer: (params, index) => {
          const idleHours =
            params?.data?.allotatedHours - params?.data?.totalHours;

          return <div>{idleHours}</div>;
        },
      },
    ],
    [yearBasedDetails]
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
        <h4>Project Yearly Report</h4>
      </div>
      <div style={containerStyle}>
        <div style={gridStyle} className="ag-theme-alpine leavetable">
          <AgGridReact
            rowData={yearBasedDetails}
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

export default YearlyReport;
