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

function CompOff() {
  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm();

  let formData = watch();
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [rowData, setRowData] = useState([]);
  const [refresh, setRefresh] = useState(false);

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
      { field: "leaveFrom", headerName : "Worked on" },
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
            {params?.data?.leaveStatus !== "approved" && (
              <i
                class="fa-solid fa-trash"
                onClick={() => handleDelete(params?.data?.id)}
              ></i>
            )}
          </div>
        ),
      },
    ],
    []
  );

  console.log(formData, "formData");

  useEffect(() => {
    axios.get(`${commonData?.APIKEY}/dashboard`).then((result) => {
      console.log(result, "result12121");
      setValue("employeeName", result?.data?.userName);
      setValue(
        "employeeId",
        result?.data?.employeeId?.replace(/[A-Za-z]/g, "")
      );
    });
    getLeaves();
  }, [refresh]);

  const getLeaves = () => {
    axios
      .get(`${commonData?.APIKEY}/getcompOffDetails`)
      .then((res) => {
        console.log(res, "resr23234");
        if (res.data.Status === "Success") {
          axios.get(`${commonData?.APIKEY}/dashboard`).then((result) => {
            console.log(result, "resultresult");
            let tempFinalResult = res?.data?.Result?.filter(
              (item) =>
                Number(item.employeeId?.replace(/[A-Za-z]/g, "")) ===
                Number(result?.data?.employeeId?.replace(/[A-Za-z]/g, ""))
            );
            console.log(tempFinalResult, "tempFinalResulttempFinalResult");
            setRowData(tempFinalResult);
          });
        }
      })

      .catch((err) => console.log(err));
  };

  const onSubmit = (data) => {
    console.log(data, "tests213");
    // Perform any other actions you want with the form data
    axios
      .post(`${commonData?.APIKEY}/applycompOff`, data)
      .then((res) => {
        if (res.data.Error) {
          alert(res.data.Error);
        } else {
          location.reload();
        }
      })
      .catch((err) => console.log(err));
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
      .delete(`${commonData?.APIKEY}/deletecompOff/` + id)
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
        {/* <h2 className="heading">Manage Project</h2> */}

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
                    defaultValue="CompOff" // Set the default value here if needed
                    render={({ field }) => (
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        label="Leave Type is Required"
                        {...field}
                        error={Boolean(errors.leaveType)}
                      >
                        <MenuItem value={"CompOff"}>Comp off</MenuItem>
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
                      defaultValue="" // Set the default value here if needed
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
                <Box sx={{}}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Controller
                      fullWidth
                      name="workHours" // Make sure the name matches the field name in your form
                      control={control}
                      defaultValue="" // Set the default value here if needed
                      rules={{ required: "Work Hours is Required." }}
                      render={({ field }) => (
                        <TextField
                          fullWidth
                          id="outlined-basic fullWidth"
                          label="Work Hours"
                          variant="outlined"
                          type="number"
                          {...field}
                          error={Boolean(errors.workHours)}
                          helperText={
                            errors.workHours && errors.workHours.message
                          }
                        />
                      )}
                    />
                  </LocalizationProvider>
                  <FormHelperText>
                    {errors.leaveFrom && errors.leaveFrom.message}
                  </FormHelperText>
                </Box>
              </div>
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
                    label="Project Details"
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
      <div style={{ width: "100%", height: "100%" }}>
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

export default CompOff;
