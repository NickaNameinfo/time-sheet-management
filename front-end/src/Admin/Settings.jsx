import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import commonData from "../../common.json";

export const Settings = () => {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [rowData, setRowData] = useState([]);
  const [selectedRows, setSelectedRows] = useState(null);

  const columnDefs = useMemo(
    () => [
      {
        field: "updateTitle",
        minWidth: 170,
      },
      { field: "UpdateDisc" },
      { field: "Announcements" },
      { field: "UpdateDisc" },
      { field: "Circular" },
      { field: "Gallery" },
      { field: "ViewExcel" },
      {
        field: "Action",
        headerName: "Action",
        cellRenderer: (params) => {
          return (
            <i
              class="fa-solid fa-trash"
              onClick={() => handleDelete(params?.data?.id)}
            ></i>
          );
        },
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
      editable: true,
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
      .get(`${commonData?.APIKEY}/settings`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setRowData(res.data.Result);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  }, []);

  const handleDelete = (id) => {
    axios
      .delete(`${commonData?.APIKEY}/updates/delete/` + id)
      .then((res) => {
        if (res.data.Status === "Success") {
          window.location.reload(true);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <>
      <div className="addBtn pb-1 my-3">
        <Link to="/Dashboard/AddUpdates" className="btn">
          Add Update
        </Link>
        {selectedRows?.length > 0 && (
          <Button
            variant="contained"
            onClick={() => handleDelete(selectedRows?.[0]?.id)}
          >
            Delete
          </Button>
        )}
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
};
