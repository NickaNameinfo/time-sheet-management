import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  Box,
  Dialog,
  DialogTitle,
  TextField,
  TextareaAutosize,
} from "@mui/material";
import commonData from "../../common.json";
function ProjectWorkDetails() {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [rowData, setRowData] = useState([]);
  const [refresh, setRefresh] = React.useState(false);
  const [isUpdate, setIsUpdate] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState(null);
  const [formData, setFormData] = React.useState(null);
  const [onSelectedData, setSelectedData] = React.useState(null);
  const token = localStorage.getItem("token");
  axios.defaults.withCredentials = true;
  const gridRef = React.createRef();
  console.log(rowData, "rowDatarowData", onSelectedData, message);

  const navigate = useNavigate();

  const gridOptions = useMemo(
    () => ({
      editType: "fullRow",
      rowIndex: 1,
      editable: true,
      rowPinned: true,
    }),
    []
  );

  React.useEffect(() => {
    console.log(message, onSelectedData, "onSelectedData123");
    if (onSelectedData) {
      let data = {
        from: onSelectedData?.tlName,
        to: onSelectedData?.userName,
        sendDate: new Date(),
        message: message,
        empId: "",
        tlId: "",
      };
      setFormData(data);
    }
  }, [onSelectedData, message]);

  const updateProjectDetails = (status, params) => {
    let apiTemp = { ...params.data, approvedDate: new Date(), status: status };
    axios
      .put(
        `${commonData?.APIKEY}/project/updateWorkDetails/` + params.data.id,
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
      { field: "areaofWork", minWidth: 170 },
      { field: "projectName", minWidth: 170 },
      { field: "referenceNo", minWidth: 170 },
      { field: "taskNo", minWidth: 170 },
      { field: "monday", minWidth: 170 },
      { field: "tuesday", minWidth: 170 },
      { field: "wednesday", minWidth: 170 },
      { field: "thursday", minWidth: 170 },
      { field: "friday", minWidth: 170 },
      { field: "saturday", minWidth: 170 },
      { field: "sunday", minWidth: 170 },
      { field: "totalHours", filter: false, minWidth: 170 },
      { field: "weekNumber", filter: false, minWidth: 170 },
      { field: "sentDate", filter: false, minWidth: 170 },
      {
        field: "Status",
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
              <>
                <i
                  class="fa-regular fa-circle-xmark"
                  style={{ fontSize: "20px", color: "red" }}
                ></i>
                {/* <i
                  class="fa-regular fa-comment"
                  style={{
                    fontSize: "20px",
                    color: "green",
                    marginLeft: "20px",
                  }}
                  onClick={() => {
                    setSelectedData(params?.data);
                    setOpen(true);
                  }}
                ></i> */}
              </>
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
            {params?.data?.status?.toLowerCase() !== "approved" && (
              <>
                <i
                  style={{ color: "color", backgroundColor: "green" }}
                  class="fa-solid fa-check"
                  onClick={() => updateProjectDetails("approved", params)}
                ></i>
                <i
                  class="fa-regular fa-circle-xmark"
                  onClick={() => updateProjectDetails("rejected", params)}
                ></i>
              </>
            )}
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
      .get(`${commonData?.APIKEY}/getWrokDetails`)
      .then(async (res) => {
        let userDetails = await axios.post(`${commonData?.APIKEY}/dashboard`, {
          tokensss: token,
        });
        if (res.data.Status === "Success") {
          let filterData = res.data.Result.filter(
            (items) => items.userName === userDetails.data.employeeId
          );
          setRowData(filterData);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = () => {
    console.log(formData, "tests213");
    axios
      .post(`${commonData?.APIKEY}/sendNotification`, formData)
      .then((res) => {
        if (res.data.Error) {
          alert(res.data.Error);
        } else {
          // navigate("/Dashboard/hr");
          setOpen(false);
        }
      })
      .catch((err) => console.log(err));
  };

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

      <Dialog
        fullWidth
        open={open}
        maxWidth="sm"
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle
          id="alert-dialog-title"
          className="d-flex align-items-center justify-content-between"
        >
          <h3>{"Add Command"}</h3>
          <i
            class="fa-solid fa-xmark cursor-pointer"
            onClick={() => setOpen(false)}
            style={{ cursor: "pointer" }}
          ></i>
        </DialogTitle>
        <div className="px-3">
          <TextareaAutosize
            fullWidth
            variant="outlined"
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave message"
            className="textarea"
          />
          <div>
            <button
              onClick={() => handleSubmit()}
              className="btn btn-primary button mt-2"
            >
              Submit
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default ProjectWorkDetails;
