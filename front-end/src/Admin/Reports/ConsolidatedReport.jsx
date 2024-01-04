import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import commonData from "../../../common.json";

const ConsolidatedReport = () => {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [workDetails, setWorkDetails] = useState([]);
  const [exportApi, setExportApi] = React.useState(null);

  console.log(workDetails, "workDetailsworkDetails");

  React.useEffect(() => {
    onGetWorkDetails();
  }, []);

  const onGetWorkDetails = (params) => {
    setExportApi(params?.api);
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

  const columnDefs = useMemo(
    () => [
      {
        field: "approvedDate",
        headerName: "Year",
        minWidth: 170,
        valueGetter: (params) => {
          return new Date(params.data?.approvedDate).getFullYear();
        },
      },
      {
        field: "weekNumber",
        minWidth: 170,
        headerName: "Week",
      },
      {
        field: "desciplineCode",
        minWidth: 170,
        headerName: "Code",
      },
      {
        field: "projectNo",
        minWidth: 170,
      },
      {
        field: "projectName",
        minWidth: 170,
      },
      {
        field: "subDivision",
        minWidth: 170,
      },
      {
        field: "employeeName",
        minWidth: 170,
      },
      {
        field: "employeeNo",
        minWidth: 170,
      },
      {
        field: "designation",
        minWidth: 170,
      },
      {
        field: "discipline",
        minWidth: 170,
      },
      {
        field: "areaofWork",
        minWidth: 170,
      },
      {
        field: "variation",
        minWidth: 170,
      },
      {
        field: "totalHours",
        minWidth: 170,
      },
    ],
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
        <h4>Consolidated Report</h4>
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
            rowData={workDetails}
            columnDefs={columnDefs}
            // autoGroupColumnDef={autoGroupColumnDef}
            defaultColDef={defaultColDef}
            suppressRowClickSelection={true}
            groupSelectsChildren={true}
            // rowSelection={"single"}
            rowGroupPanelShow={"always"}
            pivotPanelShow={"always"}
            pagination={true}
            onGridReady={onGetWorkDetails}
            onSelectionChanged={(event) => onSelectionChanged(event)}
          />
        </div>
      </div>
    </>
  );
};

export default ConsolidatedReport;
