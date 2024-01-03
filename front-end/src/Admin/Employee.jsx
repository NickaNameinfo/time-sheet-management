import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import commonData from "../../common.json";
function Employee() {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [rowData, setRowData] = useState([]);
  const [selectedRows, setSelectedRows] = useState(null);
  console.log(selectedRows, "selectedRows342342")
  const navigate = useNavigate();

  const onClickEdit = (id) => {
    navigate(`/Dashboard/create/${id}`);
  };

  React.useEffect(() => {
    setSelectedRows(null)
  },[])
  const columnDefs = useMemo(
    () => [
      {
        field: "employeeName",
        minWidth: 170,
        checkboxSelection: true,
      },
      { field: "EMPID", headerName : "Employee ID" },
      { field: "employeeEmail" },
      { field: "userName" },
      { field: "role" },
      { field: "discipline" },
      { field: "designation" },
      { field: "employeeStatus" },
      { field: "date", headerName: "Join Date" },
      { field: "relievingDate", headerName: "Relieving Date" },
      { field: "permanentDate", headerName: "Permanent Date" },
      {
        field: "Action",
        headerName: "Action",
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
      .get(`${commonData?.APIKEY}/getEmployee`)
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
      .delete(`${commonData?.APIKEY}/delete/` + id)
      .then((res) => {
        if (res.data.Status === "Success") {
          onGridReady();
          location.reload()
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
      <div className="addBtn pb-1 my-3">
        <Link to="/Dashboard/create" className="btn">
          Add Employee
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
}

export default Employee;
