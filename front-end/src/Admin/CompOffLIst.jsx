import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import commonData from "../../common.json";
function CompOffLIst() {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [rowData, setRowData] = useState([]);
  const [refresh, setRefresh] = useState(false);

  const updateLeaveDetails = (status, params) => {
    let apiTemp = {
      ...params.data,
      approvedDate: new Date(),
      leaveStatus: status,
      eligibility: params.data.eligibility,
    };
    console.log(apiTemp, "apiTempapiTempapiTemp", params.data);
    if (params.data.eligibility !== "") {
      axios
        .put(`${commonData?.APIKEY}/updateCompOff/` + params.data.id, apiTemp)
        .then(async (res) => {
          setRefresh(true);
          alert("Update Successfully");
          location.reload();
        });
    } else {
      alert("Please enter eligibility hours");
    }

    console.log(params.data, "datadatadatadata");
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
      { field: "workHours" },
      { field: "eligibility", editable: true },
      { field: "leaveFrom", headerName: "Worked on" },
      { field: "leaveStatus", headerName: "Approval Status" },
      {
        headerName: "Action",
        pinned: "right",
        minWidth: 100,
        width: 100,
        field: "id",
        filter: false,
        editable: false,
        cellRenderer: (params, index) => (
          <div className="actions">
            <i
              style={{ color: "color", backgroundColor: "green" }}
              class="fa-solid fa-check"
              onClick={() => {
                setRefresh(true);
                updateLeaveDetails("approved", params);
              }}
            ></i>
            <i
              class="fa-regular fa-circle-xmark"
              onClick={() => {
                setRefresh(true);
                updateLeaveDetails("rejected", params);
              }}
            ></i>
          </div>
        ),
      },
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
      .get(`${commonData?.APIKEY}/getcompOffDetails`)
      .then((res) => {
        if (res.data.Status === "Success") {
          let filterDat = res.data.Result?.filter(
            (item) => item?.leaveStatus !== "approved"
          );
          console.log(filterDat, "filterDat");
          setRowData(filterDat);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <>
      <div className="text-center pb-1 my-3">
        <h4>Comp-Off Details</h4>
      </div>
      <div style={containerStyle}>
        <div style={gridStyle} className="ag-theme-alpine leavetable">
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

export default CompOffLIst;
