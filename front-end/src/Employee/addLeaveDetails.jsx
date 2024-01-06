import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
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
        minWidth: 100,
        width: 100,
        field: "id",
        filter: false,
        editable: false,
        cellRenderer: (params, index) => (
          <div className="actions">
            {params?.data?.leaveStatus === "" || !params?.data?.leaveStatus ? (
              <i
                class="fa-solid fa-trash"
                onClick={() => handleDelete(params?.data?.id)}
              ></i>
            ) : (
              params?.data?.leaveStatus === "approved" && (
                <i
                  class="fa-regular fa-circle-xmark"
                  onClick={() => updateLeaveDetails("Cancel Reqest", params)}
                ></i>
              )
            )}
          </div>
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
    axios
      .delete(`${commonData?.APIKEY}/deleteLeave/` + id)
      .then((res) => {
        if (res.data.Status === "Success") {
          getLeaves();
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <div className="mainBody">
      <div className="mt-4">
        <h2 className="heading">Apply Leave</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="gy-3 row">
            <div className="col-sm-12">
              <Box sx={{}}>
                <FormControl fullWidth>
                  <InputLabel id="demo-simple-select-label">
                    Leave Type is Required
                  </InputLabel>
                  <Controller
                    name="leaveType" // Make sure the name matches the field name in your form
                    control={control}
                    rules={{ required: "Leave Type is Required" }}
                    defaultValue="" // Set the default value here if needed
                    render={({ field }) => (
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        label="Leave Type is Required"
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
              </Box>
            </div>
            <div className="col-sm-12 d-flex align-items-center">
              <div className="col-sm-4">
                <Box sx={{}}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Controller
                      fullWidth
                      name="leaveFrom" // Make sure the name matches the field name in your form
                      control={control}
                      rules={{ required: "Work Date From is Required." }}
                      render={({ field }) => (
                        <DatePicker
                          label="Work Date From"
                          {...field}
                          error={Boolean(errors.leaveFrom)}
                          helperText={
                            errors.leaveFrom && errors.leaveFrom.message
                          }
                          renderInput={(props) => (
                            <TextField {...props} fullWidth />
                          )}
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
                  <FormHelperText>
                    {errors.leaveFrom && errors.leaveFrom.message}
                  </FormHelperText>
                </Box>
              </div>
              <div className="col-sm-4">
                <Box>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Controller
                      fullWidth:fullWidth
                      name="leaveTo" // Make sure the name matches the field name in your form
                      control={control}
                      rules={{ required: "Leave To is Required." }}
                      render={({ field }) => (
                        <DatePicker
                          minDate={dayjs(formData?.leaveFrom)}
                          label="Leave To"
                          {...field}
                          error={Boolean(errors.leaveTo)}
                          helperText={errors.leaveTo && errors.leaveTo.message}
                          renderInput={(props) => (
                            <TextField {...props} fullWidth />
                          )}
                          disabled={formData?.leaveFrom ? false : true}
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
                  <FormHelperText>
                    {errors.leaveTo && errors.leaveTo.message}
                  </FormHelperText>
                </Box>{" "}
              </div>
            </div>

            <div className="col-sm-12">
              <Controller
                control={control}
                name="leaveHours"
                defaultValue=""
                rules={{ required: "Leave Days required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="Leave Days"
                    variant="outlined"
                    type="number"
                    {...field}
                    error={Boolean(errors.leaveHours)}
                    helperText={errors.leaveHours && errors.leaveHours.message}
                  />
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="reason"
                defaultValue=""
                rules={{ required: "Reason is required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="Reason"
                    variant="outlined"
                    type="text"
                    {...field}
                    error={Boolean(errors.reason)}
                    helperText={errors.reason && errors.reason.message}
                  />
                )}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary button">
            Submit
          </button>
        </form>
      </div>
      <div style={{ width: "100%", height: "500px", marginBottom: "10%" }}>
        <div className="text-center pb-1 my-3">
          <h4>Leave Details</h4>
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
              onSelectionChanged={(event) => onSelectionChanged(event)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default addLeaveDetails;
