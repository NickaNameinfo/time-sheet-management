import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";

const ProjectReport = () => {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [projectDetails, setProjectDetails] = useState([]);
  const [workDetails, setWorkDetails] = useState([]);
  const [projectWorkHours, setProjectWorkHours] = React.useState(null);
  console.log(projectWorkHours, "workDetailsworkDetails", workDetails);
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
    console.log(projectTotalHours, "projectTotalHours");
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
        field: "orderId",
        minWidth: 170,
      },
      { field: "projectNo" },
      { field: "projectName" },
      {
        field: "% Completion",
        cellRenderer: (params, index) => {
          // const project = projectWorkHours?.filter(
          //   (items) => items.projectName === params?.data?.projectName
          // );

          // console.log(
          //   project,
          //   "completionPercentagecompletionPercentage",
          //   projectWorkHours
          // );
          // const completionPercentage =
          //   (project?.[0]?.totalHours / params?.data?.allotatedHours) * 100;
          // console.log(
          //   completionPercentage,
          //   "completionPercentagecompletionPercentage"
          // );
          // return (
          //   <div style={{ color: "green" }}>
          //     {completionPercentage?.toFixed(2)}%
          //   </div>
          // );
          return null
        },
      },
      {
        field: "% Utilized",
        cellRenderer: (params, index) => {
          const project = projectWorkHours?.filter(
            (items) => items.projectName === params?.data?.projectName
          );
          const completionPercentage =
            (project?.[0]?.totalHours / params?.data?.allotatedHours) * 100;
          const remainingPercentage = 100 - completionPercentage;

          return (
            <div style={{ color: "red" }}>
              {remainingPercentage?.toFixed(2)}%
            </div>
          );
        },
      },
      { field: "allotatedHours" },
      {
        field: "Consumed Hours",
        cellRenderer: (params, index) => {
          const project = projectWorkHours?.filter(
            (items) => items.projectName === params?.data?.projectName
          );
          console.log(project, "projectproject");
          return <>{project?.[0]?.totalHours}</>;
        },
      },
      { field: "startDate" },
      { field: "targetDate" },
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
        <h4>Project Report</h4>
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

export default ProjectReport;
