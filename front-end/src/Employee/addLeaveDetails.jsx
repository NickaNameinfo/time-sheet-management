import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  EventAvailable,
  Delete,
  Add,
  Refresh,
  CalendarToday,
  AccessTime,
  Description,
  Cancel,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import commonData from "../../common.json";
function addLeaveDetails() {
  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm();
  const navigate = useNavigate();
  let formData = watch();
  const token = localStorage.getItem("token");
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [rowData, setRowData] = useState([]);
  const [refresh, setRefresh] = useState(false);

  const updateLeaveDetails = (status, params) => {
    let apiTemp = {
      ...params.data,
      approvedDate: new Date(),
      leaveStatus: status,
    };
    axios
      .put(`${commonData?.APIKEY}/updateLeave/` + params.data.id, apiTemp)
      .then(async (res) => {
        setRefresh(true);
        alert("Update Successfully");
        location.reload();
      });
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
      { field: "leaveType" },
      { field: "leaveFrom" },
      { field: "leaveTo" },
      { field: "leaveHours", headerName: "No of Days" },
      { field: "reason" },
      { field: "leaveStatus", headerName: "Approval Status" },
      {
        headerName: "Action",
        pinned: "right",
        minWidth: 120,
        width: 120,
        field: "id",
        filter: false,
        editable: false,
        cellRenderer: (params) => (
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
            {params?.data?.leaveStatus === "" || !params?.data?.leaveStatus ? (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(params?.data?.id)}
                  sx={{
                    "&:hover": {
                      bgcolor: "error.light",
                      color: "white",
                    },
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              params?.data?.leaveStatus === "approved" && (
                <Tooltip title="Cancel Request">
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={() => updateLeaveDetails("Cancel Reqest", params)}
                    sx={{
                      "&:hover": {
                        bgcolor: "warning.light",
                        color: "white",
                      },
                    }}
                  >
                    <Cancel fontSize="small" />
                  </IconButton>
                </Tooltip>
              )
            )}
          </Box>
        ),
      },
    ],
    []
  );


  useEffect(() => {
    axios
      .post(`${commonData?.APIKEY}/dashboard`, { tokensss: token })
      .then((result) => {
        setValue("employeeName", result?.data?.employeeName);
        setValue("employeeId", result?.data?.employeeId);
      });
    getLeaves();
  }, [refresh]);

  const getLeaves = () => {
    axios
      .get(`${commonData?.APIKEY}/getLeaveDetails`)
      .then((res) => {
        if (res.data.Status === "Success") {
          axios
            .post(`${commonData?.APIKEY}/dashboard`, { tokensss: token })
            .then((result) => {
              let tempFinalResult = res?.data?.Result?.filter(
                (item) => item.employeeId === result?.data?.employeeId
              );
              setRowData(tempFinalResult);
            });
        }
      })
      .catch((err) => console.log(err));
  };

  const onSubmit = (data) => {
    let storedData = localStorage.getItem("leaveDetails");
    let retrievedUserData = JSON.parse(storedData);
    let errorMessage = {};
    console.log(errorMessage, "errorMessagedfasdf", retrievedUserData);
    if (
      (retrievedUserData?.vacationLeave === 0 ||
        Number(formData?.leaveHours) > retrievedUserData?.vacationLeave) &&
      formData?.leaveType === "Casual Leave"
    ) {
      errorMessage =
        "You don't have Casual Leave select the lop option or check the leave balance";
    }
    if (
      (retrievedUserData?.sickLeave === 0 ||
        Number(formData?.leaveHours) > retrievedUserData?.sickLeave) &&
      formData?.leaveType === "Sick Leave"
    ) {
      errorMessage =
        "You don't have Sick Leave select the lop option or check the leave balance";
    }
    if (
      (retrievedUserData?.earnedLeave === 0 ||
        Number(formData?.leaveHours) > retrievedUserData?.earnedLeave) &&
      formData?.leaveType === "Earned Leave"
    ) {
      errorMessage =
        "You don't have Earned Leave select the lop option or check the leave balance";
    }
    if (
      (retrievedUserData?.compOffLeave === 0 ||
        Number(formData?.leaveHours) > retrievedUserData?.compOffLeave) &&
      formData?.leaveType === "Comp-off"
    ) {
      errorMessage =
        "You don't have Comp-Off Leave select the lop option or check the leave balance";
    }
    if (Object.entries(errorMessage).length === 0) {
      axios
        .post(`${commonData?.APIKEY}/applyLeave`, data)
        .then((res) => {
          if (res.data.Error) {
            alert(res.data.Error);
          } else {
            location.reload();
            setRefresh(true);
          }
        })
        .catch((err) => console.log(err));
    } else {
      console.log(errorMessage, "eroorers");
      alert(errorMessage);
    }
  };

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

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this leave request?")) {
      axios
        .delete(`${commonData?.APIKEY}/deleteLeave/` + id)
        .then((res) => {
          if (res.data.Status === "Success") {
            getLeaves();
            alert("Leave deleted successfully");
          } else {
            alert("Error deleting leave");
          }
        })
        .catch((err) => console.log(err));
    }
  };

  const onSelectionChanged = (event) => {
    // Handle selection if needed
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
              Apply Leave
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Submit and manage your leave requests
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              setRefresh(!refresh);
              getLeaves();
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Form Card */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <EventAvailable color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Leave Application Form
            </Typography>
          </Box>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="leave-type-label">Leave Type</InputLabel>
                  <Controller
                    name="leaveType"
                    control={control}
                    rules={{ required: "Leave Type is Required" }}
                    defaultValue=""
                    render={({ field }) => (
                      <Select
                        labelId="leave-type-label"
                        id="leave-type"
                        label="Leave Type"
                        {...field}
                        error={Boolean(errors.leaveType)}
                      >
                        <MenuItem value={"Casual Leave"}>Casual Leave</MenuItem>
                        <MenuItem value={"Sick Leave"}>Sick Leave</MenuItem>
                        <MenuItem value={"Earned Leave"}>Earned Leave</MenuItem>
                        <MenuItem value={"Comp-off"}>Comp-Off</MenuItem>
                        <MenuItem value={"LOP"}>LOP</MenuItem>
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    {errors.leaveType && errors.leaveType.message}
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name="leaveFrom"
                    control={control}
                    rules={{ required: "Work Date From is Required." }}
                    render={({ field }) => (
                      <DatePicker
                        label="Leave From"
                        {...field}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: Boolean(errors.leaveFrom),
                            helperText: errors.leaveFrom && errors.leaveFrom.message,
                            InputProps: {
                              startAdornment: <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />,
                            },
                          },
                        }}
                        onChange={(newValue) =>
                          setValue(
                            "leaveFrom",
                            dayjs(newValue).format("YYYY-MM-DD")
                          )
                        }
                        format="YYYY-MM-DD"
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name="leaveTo"
                    control={control}
                    rules={{ required: "Leave To is Required." }}
                    render={({ field }) => (
                      <DatePicker
                        minDate={dayjs(formData?.leaveFrom)}
                        label="Leave To"
                        {...field}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: Boolean(errors.leaveTo),
                            helperText: errors.leaveTo && errors.leaveTo.message,
                            disabled: formData?.leaveFrom ? false : true,
                            InputProps: {
                              startAdornment: <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />,
                            },
                          },
                        }}
                        onChange={(newValue) =>
                          setValue(
                            "leaveTo",
                            dayjs(newValue).format("YYYY-MM-DD")
                          )
                        }
                        format="YYYY-MM-DD"
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  control={control}
                  name="leaveHours"
                  defaultValue=""
                  rules={{ required: "Leave Days required." }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Leave Days"
                      variant="outlined"
                      type="number"
                      {...field}
                      error={Boolean(errors.leaveHours)}
                      helperText={errors.leaveHours && errors.leaveHours.message}
                      InputProps={{
                        startAdornment: <AccessTime sx={{ mr: 1, color: "text.secondary" }} />,
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  control={control}
                  name="reason"
                  defaultValue=""
                  rules={{ required: "Reason is required." }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Reason"
                      variant="outlined"
                      multiline
                      rows={3}
                      {...field}
                      error={Boolean(errors.reason)}
                      helperText={errors.reason && errors.reason.message}
                      InputProps={{
                        startAdornment: <Description sx={{ mr: 1, color: "text.secondary", alignSelf: "flex-start", mt: 1 }} />,
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Add />}
                  sx={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                    },
                  }}
                >
                  Submit Leave Request
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Grid Card */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <EventAvailable color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Leave Details
            </Typography>
          </Box>
          <Box sx={{ width: "100%", height: "500px" }}>
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
                onSelectionChanged={onSelectionChanged}
              />
            </div>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default addLeaveDetails;
