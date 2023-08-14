import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

function TeamLeadHome() {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [rowData, setRowData] = useState([]);
  console.log(rowData, "rowDatarowData")
  axios.defaults.withCredentials = true;

  const columnDefs = useMemo(
    () => [
      {
        field: "projectName",
        minWidth: 170,
        checkboxSelection: true,
        headerCheckboxSelection: true,
      },
      { field: "orderId" },
      { field: "positionNumber" },
      { field: "projectNo" },
      { field: "allotatedHours" },
      { field: "startDate" },
      { field: "subDivision" },
      { field: "subPositionNumber" },
      { field: "targetDate" },
      { field: "taskJobNo" },
    ],
    []
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
  const onGridReady = useCallback((params) => {
    axios
      .get("http://localhost:8081/getProject")
      .then(async (res) => {
        let userDetails = await axios.get("http://localhost:8081/dashboard");
        console.log(res, "resres324", userDetails);
        if (res.data.Status === "Success") {
          let filterData = res.data.Result.filter(
            (items) => items.tlName === userDetails.data.tlName
          );
          setRowData(filterData);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <>
      <div className="text-center pb-1 my-3">
        <h4>Project Details</h4>
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
            onGridReady={onGridReady}
            onSelectionChanged={(event) => onSelectionChanged(event)}
          />
        </div>
      </div>
    </>
  );
}

export default TeamLeadHome;
