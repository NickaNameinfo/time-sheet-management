import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import commonData from "../../../common.json";

const MonthlyReport = () => {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [projectDetails, setProjectDetails] = useState([]);
  const [workDetails, setWorkDetails] = useState([]);
  const [projectWorkHours, setProjectWorkHours] = React.useState(null);
  const [exportApi, setExportApi] = React.useState(null);

  console.log(workDetails, "workDetailsworkDetails");
  React.useEffect(() => {
    onGetWorkDetails();
    onGridReady();
  }, []);
  React.useEffect(() => {
    const workingHoursByMonthAndProject = {};

    // Loop through the data and organize it by month and project
    workDetails.forEach((item) => {
      const date = new Date(item.sentDate);
      const monthKey = date.toLocaleString("default", { month: "long" }); // Example: "September"

      if (!workingHoursByMonthAndProject[monthKey]) {
        workingHoursByMonthAndProject[monthKey] = {};
      }

      const projectKey = item.projectName;

      if (!workingHoursByMonthAndProject[monthKey][projectKey]) {
        workingHoursByMonthAndProject[monthKey][projectKey] = 0;
      }

      workingHoursByMonthAndProject[monthKey][projectKey] += Number(
        item.totalHours
      );
    });

    // Set the state with the organized data
    setProjectWorkHours(workingHoursByMonthAndProject);
    console.log(workingHoursByMonthAndProject, "projectTotalHours");
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

  const generateMonthColumn = (month) => {
    return {
      field: month,
      filter: false,
      minWidth: 100,
      valueGetter: (params, index) => {
        const weekField = params.colDef.field.toString();
        const value =
          projectWorkHours[weekField]?.[params.data.projectName] || 0;
        return value;
      },
    };
  };

  const monthColumns = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const columnDefs = useMemo(
    () => [
      {
        field: "referenceNo",
        minWidth: 170,
      },
      {
        field: "allotatedHours",
        minWidth: 170,
        headerName: "Allotted Hours",
      },
      {
        field: "Consumed",
        headerName: "Consumed Hours",
        minWidth: 170,
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
      { field: "projectName", minWidth: 170 },
      { field: "desciplineCode" },
      ...monthColumns.map(generateMonthColumn),
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

  const onClickExport = () => {
    console.log(exportApi, "grdiApigrdiApi");
    exportApi.exportDataAsCsv();
  };

  return (
    <>
      <div className="text-center pb-1 my-3">
        <h4>Project Monthly Report</h4>
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

export default MonthlyReport;
