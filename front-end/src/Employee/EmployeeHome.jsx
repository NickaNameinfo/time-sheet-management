import axios from "axios";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import Dialog from "@mui/material/Dialog";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import AddProjectDetails from "./addProjectDetails";
import { DialogTitle } from "@mui/material";
import { grey } from "@mui/material/colors";
function EmployeeHome() {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [rowData, setRowData] = useState([]);
  const [refresh, setRefresh] = React.useState(false);
  const [isUpdate, setIsUpdate] = React.useState(false);
  axios.defaults.withCredentials = true;
  const gridRef = React.createRef();
  console.log(rowData, "rowDatarowData");

  const [open, setOpen] = React.useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setRefresh(true);
  };

  React.useEffect(() => {
    initData();
  }, [open]);

  const onHandleDelete = (index, data) => {
    let deletData = [...data];
    deletData.splice(index, 1);
    console.log(deletData, "deletDatadeletData23", index);

    setRowData(deletData);
    setRefresh(true);
  };

  const onBtStartEditing = (index) => {
    if (gridRef.current) {
      const api = gridRef.current.api;
      api?.setFocusedCell(1, "projectName");
      api?.startEditingCell({ rowIndex: index, colKey: "projectName" });
    }
  };

  const columnDefs = useMemo(
    () => [
      {
        field: "projectName",
        minWidth: 100,
        pinned: "left",
        editable: false,
      },
      { field: "tlName", editable: false },
      { field: "taskNo" },
      { field: "areaofWork" },
      { field: "monday" },
      { field: "tuesday" },
      { field: "wednesday" },
      { field: "thursday" },
      { field: "friday" },
      { field: "saturday" },
      { field: "sunday" },
      { field: "totalHours" },
      { field: "Week Number" },
      {
        field: "status",
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
            {params?.data?.newItem ? (
              <>
                <i class="fa-regular fa-paper-plane"></i>
                <i
                  class="fa-solid fa-trash"
                  onClick={() => onHandleDelete(params?.rowIndex, rowData)}
                ></i>
              </>
            ) : (
              <>
                {isUpdate && (
                  <i
                    class="fa-solid fa-floppy-disk"
                    onClick={() => updateProjectDetails(params)}
                  ></i>
                )}
                <i
                  class="fa-solid fa-pen-to-square"
                  onClick={() => onBtStartEditing(params?.rowIndex)}
                ></i>
              </>
            )}
          </div>
        ),
      },
    ],
    [isUpdate, rowData]
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

  const gridOptions = useMemo(
    () => ({
      editType: "fullRow",
      rowIndex: 1,
      editable: true,
      rowPinned: true,
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

  const initData = () => {
    axios
      .get("http://localhost:8081/getWrokDetails")
      .then(async (res) => {
        let userDetails = await axios.get("http://localhost:8081/dashboard");
        console.log(res, "resres324", userDetails);
        if (res.data.Status === "Success") {
          let filterData = res.data.Result.filter(
            (items) => items.employeeName === userDetails.data.employeeName
          );
          setRowData(filterData);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const updateProjectDetails = (params) => {
    axios
      .put(
        `http://localhost:8081/project/updateWorkDetails/` + params.data.id,
        params.data
      )
      .then(async (res) => {
        setRefresh(true);
        setIsUpdate(false);
        alert("Update Successfully");
      });
    console.log(params.data, "datadatadatadata");
  };

  const onSelectionChanged = (event) => {
    const selectedItem = event.api.getSelectedRows();
    console.log(selectedItem, "selectedItemselectedItem");
  };

  const onChangeValue = (value) => {
    console.log(value, "valuevalue", isUpdate);
    if (value.value) {
      setIsUpdate(true);
    }
  };

  return (
    <>
      {/* <div className="text-center pb-1 my-3 d-flex align-items-center justify-content-between px-3"> */}
      <div className=" pb-1 my-3 d-flex align-items-center  px-3">
        <div className="container">
          <div className="row p-0">
            <div className="col-4 ">
              <p>
                NAME : <b>test</b>
              </p> <p></p>
            </div>
            <div className="col-4">
              <p>
                EMPLOYEE ID : <b>34</b>
              </p>
            </div>
            <div className="col-4">
              <p>
                MONTH & YEAR :<b>2023 agust</b>
              </p>
            </div>
          </div>
          <div className="row p-0" >
            <div className="col" >
              <p>
                DESIGNATION : <b>ENGINEER</b>
              </p>
            </div>
            <div className="col">
              <p>
                DESCIPLINE : <b>PARTS</b>
              </p>
            </div>
            <div className="col">
              <p>
                CALENDAR WEEK :<b> 12</b>
              </p>
            </div>
          </div>
        </div>

        <div className="actions">
          <i class="fa-solid fa-plus" onClick={() => handleClickOpen()}></i>
        </div>
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
            // onGridReady={onGridReady}
            onSelectionChanged={(event) => onSelectionChanged(event)}
          />
        </div>
      </div>

      <Dialog
        fullWidth
        open={open}
        maxWidth="md"
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle
          id="alert-dialog-title"
          className="d-flex align-items-center justify-content-between"
        >
          <h2>{"Add Work Details"}</h2>
          <i class="fa-solid fa-xmark cursor-pointer" onClick={() => setOpen(false)} style={{cursor: "pointer"}}></i>
        </DialogTitle>
        <AddProjectDetails onSubmitValue={(value) => setOpen(false)} />
      </Dialog>
    </>
  );
}

export default EmployeeHome;
