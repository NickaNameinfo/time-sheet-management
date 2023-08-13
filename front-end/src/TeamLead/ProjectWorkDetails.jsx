import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

function ProjectWorkDetails() {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [rowData, setRowData] = useState([]);
  const [refresh, setRefresh] = React.useState(false);
  const [isUpdate, setIsUpdate] = React.useState(false);
  axios.defaults.withCredentials = true;
  const gridRef = React.createRef();
  console.log(rowData, "rowDatarowData");
  axios.defaults.withCredentials = true;

  const gridOptions = useMemo(
    () => ({
      editType: "fullRow",
      rowIndex: 1,
      editable: true,
      rowPinned: true,
    }),
    []
  );

  const updateProjectDetails = (params) => {
    let apiTemp = { ...params.data, approvedDate: new Date() };
    console.log(apiTemp, "apiTempapiTempapiTemp", params.data);
    axios
      .put(
        `http://localhost:8081/project/updateWorkDetails/` + params.data.id,
        apiTemp
      )
      .then(async (res) => {
        setRefresh(true);
        setIsUpdate(false);
        alert("Update Successfully");
        location.reload();
      });
    console.log(params.data, "datadatadatadata");
  };

  const columnDefs = useMemo(
    () => [
      {
        field: "employeeName",
        minWidth: 170,
        filter: true,
      },
      { field: "areaofWork" },
      { field: "projectName" },
      { field: "taskNo" },
      { field: "monday" },
      { field: "tuesday" },
      { field: "wednesday" },
      { field: "thursday" },
      { field: "friday" },
      { field: "saturday" },
      { field: "sunday" },
      { field: "totalHours", filter: false },
      {
        field: "status",
        filter: false,
        headerName: "Update Status",
        pinned: "right",
        editable: true,
        minWidth: 80,
        width: 100,
      },
      {
        field: "Current Status",
        pinned: "right",
        minWidth: 80,
        width: 50,
        filter: false,
        editable: false,
        cellRenderer: (params) => (
          <div className="d-flex justify-content-center align-items-center h-100">
            {params?.data?.status?.toLowerCase() === "approved" ? (
              <i
                class="fa-regular fa-circle-check"
                style={{ fontSize: "20px", color: "green" }}
              ></i>
            ) : params?.data?.status?.toLowerCase() === "rejected" ? (
              <i
                class="fa-regular fa-circle-xmark"
                style={{ fontSize: "20px", color: "red" }}
              ></i>
            ) : (
              <i
                class="fa-solid fa-circle"
                style={{ fontSize: "20px", color: "orange" }}
              ></i>
            )}
          </div>
        ),
      },
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
              class="fa-solid fa-floppy-disk"
              onClick={() => updateProjectDetails(params)}
            ></i>
          </div>
        ),
      },
    ],
    [isUpdate, rowData, refresh]
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
      filter: false,
      floatingFilter: true,
      flex: 1,
      minWidth: 100,
    }),
    []
  );

  const onGridReady = useCallback((params) => {
    axios
      .get("http://localhost:8081/getWrokDetails")
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
        <h4>Team Project Work Details</h4>
      </div>
      <div style={containerStyle}>
        <div style={gridStyle} className="ag-theme-alpine">
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            onRowEditingStarted={(value) => console.log(value, "ajdflajsdlfk")}
            columnDefs={columnDefs}
            autoGroupColumnDef={autoGroupColumnDef}
            defaultColDef={defaultColDef}
            suppressRowClickSelection={true}
            groupSelectsChildren={true}
            gridOptions={gridOptions}
            stopEditingWhenCellsLoseFocus={true}
            rowSelection={"single"}
            rowGroupPanelShow={"always"}
            pivotPanelShow={"always"}
            pagination={true}
            refresh={refresh}
            onCellEditingStarted={(value) => onChangeValue(value)}
            onGridReady={onGridReady}
            onSelectionChanged={(event) => onSelectionChanged(event)}
          />
        </div>
      </div>
    </>
  );
}

export default ProjectWorkDetails;
