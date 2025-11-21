import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  TextareaAutosize,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  Assignment,
  CheckCircle,
  Cancel,
  Refresh,
  Close,
  Comment,
  Send,
} from "@mui/icons-material";
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
        minWidth: 120,
        width: 120,
        filter: false,
        editable: false,
        cellRenderer: (params) => {
          const status = params?.data?.status?.toLowerCase();
          return (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Chip
                label={status || "Pending"}
                color={
                  status === "approved"
                    ? "success"
                    : status === "rejected"
                    ? "error"
                    : "warning"
                }
                size="small"
                variant={status === "approved" ? "filled" : "outlined"}
                icon={
                  status === "approved" ? (
                    <CheckCircle fontSize="small" />
                  ) : status === "rejected" ? (
                    <Cancel fontSize="small" />
                  ) : null
                }
              />
            </Box>
          );
        },
      },
      {
        headerName: "Action",
        pinned: "right",
        minWidth: 150,
        width: 150,
        field: "id",
        filter: false,
        editable: false,
        cellRenderer: (params) => (
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
            {params?.data?.status?.toLowerCase() !== "approved" && (
              <>
                <Tooltip title="Approve">
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => updateProjectDetails("approved", params)}
                    sx={{
                      "&:hover": {
                        bgcolor: "success.light",
                        color: "white",
                      },
                    }}
                  >
                    <CheckCircle fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reject">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => updateProjectDetails("rejected", params)}
                    sx={{
                      "&:hover": {
                        bgcolor: "error.light",
                        color: "white",
                      },
                    }}
                  >
                    <Cancel fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
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
    setMessage("");
  };

  const handleSubmit = () => {
    console.log(formData, "tests213");
    axios
      .post(`${commonData?.APIKEY}/sendNotification`, formData)
      .then((res) => {
        if (res.data.Error) {
          alert(res.data.Error);
        } else {
          alert("Notification sent successfully");
          setOpen(false);
          setMessage("");
        }
      })
      .catch((err) => {
        console.log(err);
        alert("Error sending notification");
      });
  };

  const onSelectionChanged = (event) => {
    // Handle selection if needed
  };

  const onChangeValue = (value) => {
    // Handle cell editing if needed
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Team Project Work Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and approve team member work submissions
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              setRefresh(!refresh);
              onGridReady();
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Grid Card */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <Assignment color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Work Submissions
            </Typography>
          </Box>
          <Box sx={{ width: "100%", height: "600px" }}>
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
                onSelectionChanged={onSelectionChanged}
              />
            </div>
          </Box>
        </CardContent>
      </Card>

      {/* Notification Dialog */}
      <Dialog
        fullWidth
        open={open}
        maxWidth="sm"
        onClose={handleClose}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Comment color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Add Comment
              </Typography>
            </Box>
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextareaAutosize
            minRows={4}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontFamily: "inherit",
              fontSize: "14px",
            }}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave a message..."
            value={message}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<Send />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProjectWorkDetails;
