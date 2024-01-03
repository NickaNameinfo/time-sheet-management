import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import commonData from "../../../common.json";

const YearlyReport = () => {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [projectDetails, setProjectDetails] = useState([]);
  const [workDetails, setWorkDetails] = useState([]);
  const [projectWorkHours, setProjectWorkHours] = React.useState(null);
  const [yearBasedDetails, setYearBasedDetails] = React.useState([]);
  const [exportApi, setExportApi] = React.useState(null);

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
      acc[projectName].push(Number(entry.totalHours));
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

    const yearlyDataByProject = [];

    workDetails?.forEach((item) => {
      const year = new Date(item.sentDate).getFullYear();
      const projectName = item.projectName;

      // Find the corresponding project's data in the accumulator
      const projectData = yearlyDataByProject.find(
        (dataItem) => dataItem.projectName === projectName
      );

      if (!projectData) {
        // If the project's data doesn't exist, create it
        const newProjectData = {
          projectName,
          yearlyData: [],
        };

        const yearData = {
          year,
          totalHours: 0,
          referenceNo: item.referenceNo,
          allottedHours: item.allottedHours,
        };

        yearData.totalHours += Number(item.totalHours);
        newProjectData.yearlyData.push(yearData);
        yearlyDataByProject.push(newProjectData);
      } else {
        // If the project's data already exists, find the corresponding year's data
        const yearData = projectData.yearlyData.find(
          (dataItem) => dataItem.year === year
        );

        if (!yearData) {
          // If the year's data doesn't exist, create it
          const newYearData = {
            year,
            totalHours: 0,
            referenceNo: item.referenceNo,
            allottedHours: item.allottedHours,
          };

          newYearData.totalHours += Number(item.totalHours);
          projectData.yearlyData.push(newYearData);
        } else {
          // If the year's data already exists, update it
          yearData.totalHours += Number(item.totalHours);
        }
      }
    });
    setYearBasedDetails(yearlyDataByProject);
    console.log(yearlyDataByProject, "totalHoursPerYeartotalHoursPerYear");
  }, [workDetails]);

  const onGridReady = (params) => {
    setExportApi(params?.api);
    axios
      .get(`${commonData?.APIKEY}/getProject`)
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
      .get(`${commonData?.APIKEY}/getWrokDetails`)
      .then((res) => {
        if (res.data.Status === "Success") {
          let resultData = res.data.Result?.filter(
            (item) => item.status === "approved"
          );
          setWorkDetails(resultData);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };
  // Extract unique years from all projects' yearlyData arrays
  const uniqueYears = [
    ...new Set(
      yearBasedDetails.flatMap((project) =>
        project.yearlyData.map((yearData) => yearData.year)
      )
    ),
  ];

  // Map the unique years to header columns
  const yearColumns = uniqueYears.map((year) => ({
    field: year.toString(),
    headerName: year.toString(),
    valueGetter: (params) => {
      // Find the corresponding yearlyData for the project
      const project = yearBasedDetails.find(
        (item) => item.projectName === params.data.projectName
      );
      if (project) {
        const yearData = project.yearlyData.find((item) => item.year === year);
        return yearData ? yearData.totalHours : 0;
      }
      return 0;
    },
    minWidth: 100,
  }));

  const columnDefs = useMemo(
    () => [
      {
        field: "referenceNo",
        minWidth: 170,
      },
      { field: "projectName", minWidth: 170 },
      { field: "desciplineCode" },
      { field: "allotatedHours", headerName: "Allotted Hours" },

      {
        field: "totalHours",
        headerName: "Total Work Hours",
        valueGetter: (params) => {
          const totalWorkHours = workDetails.reduce((total, entry) => {
            if (entry.projectName === String(params.data.projectName)) {
              return total + Number(entry.totalHours);
            } else {
              return total;
            }
          }, 0);
          return totalWorkHours || 0;
        },
      },
      {
        field: "Utilization",
        valueGetter: (params, index) => {
          const totalWorkHours = workDetails.reduce((total, entry) => {
            if (entry.projectName === String(params.data.projectName)) {
              return total + Number(entry.totalHours);
            } else {
              return total;
            }
          }, 0);
          const completionPercentage =
            (totalWorkHours / params?.data?.allotatedHours) * 100;
          const remainingPercentage = 100 - completionPercentage;

          return remainingPercentage?.toFixed(2);
        },
      },
      {
        field: "Idle Hours",
        valueGetter: (params, index) => {
          const totalWorkHours = workDetails.reduce((total, entry) => {
            if (entry.projectName === String(params.data.projectName)) {
              return total + Number(entry.totalHours);
            } else {
              return total;
            }
          }, 0);
          const idleHours = params?.data?.allotatedHours - totalWorkHours;

          return idleHours;
        },
      },
      ...yearColumns,
    ],
    [yearBasedDetails, workDetails] // Include workDetails as a dependency if it's used elsewhere
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

  const onClickExport = () => {
    console.log(exportApi, "grdiApigrdiApi");
    exportApi.exportDataAsCsv();
  };

  return (
    <>
      <div className="text-center pb-1 my-3">
        <h4>Project Yearly Report</h4>
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
