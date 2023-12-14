import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import commonData from "../../common.json";

function Projects(props) {
  const token = localStorage.getItem("token");
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [rowData, setRowData] = useState([]);
  const [roles, setRoles] = React.useState(null);
  const [selectedRows, setSelectedRows] = useState(null);
  const navigate = useNavigate();
  console.log(roles, "roles1234");

  React.useEffect(() => {
    axios
      .post(`${commonData?.APIKEY}/dashboard`, { tokensss: token })
      .then((res) => {
        console.log(res, "resresresres12345");
        if (res.data.Status === "Success") {
          setRoles(res.data.role?.split(","));
        }
      });
  }, []);

  const onClickEdit = (id) => {
    navigate(`/Dashboard/addProject/${id}`);
  };

  const columnDefs = useMemo(
    () => [
      {
        field: "tlName",
        minWidth: 170,
        checkboxSelection: true,
        headerName: "TL Name",
      },
      { field: "orderId", minWidth: 170 },
      { field: "positionNumber", minWidth: 170 },
      { field: "subPositionNumber", minWidth: 170 },
      { field: "projectNo", minWidth: 170 },
      { field: "taskJobNo", minWidth: 170 },
      { field: "projectName", minWidth: 170 },
      { field: "referenceNo", minWidth: 170 },
      { field: "desciplineCode", minWidth: 170, headerName: "Discipline Code" },
      { field: "subDivision", minWidth: 170 },
      { field: "startDate", minWidth: 170 },
      { field: "targetDate", minWidth: 170 },
      { field: "allotatedHours", minWidth: 170, headerName: "Allotted Hours" },
      // { field: "summary", minWidth: 170 },
      {
        field: "Action",
        headerName: "Action",
        editable: false,
        filter: false,
        cellRenderer: (params) => {
          return (
            <i
              class="fa-solid fa-pen-to-square"
              onClick={() => onClickEdit(params?.data?.id)}
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
      .get(`${commonData?.APIKEY}/getProject`)
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
      .delete(`${commonData?.APIKEY}/project/delete/` + id)
      .then((res) => {
        if (res.data.Status === "Success") {
          window.location.reload(true);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const onSelectionChanged = (event) => {
    const selectedItem = event.api.getSelectedRows();
    setSelectedRows(selectedItem);
  };

  return (
    <>
      {roles?.[0] === "Admin" && (
        <div className="addBtn pb-1 my-3">
          <Link to="/Dashboard/addProject" className="btn">
            Add Project
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
      )}

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

export default Projects;
