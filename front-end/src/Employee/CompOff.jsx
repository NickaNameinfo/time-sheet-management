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
  Paper,
} from "@mui/material";
import {
  EventAvailable,
  Delete,
  Add,
  Refresh,
  Work,
  AccessTime,
  Description,
} from "@mui/icons-material";
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
  const token = localStorage.getItem("token");
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
      { field: "eligibility", headerName: "Compensation eligibility" },
      { field: "leaveFrom", headerName: "Worked on" },
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
            {params?.data?.leaveStatus !== "approved" && (
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
            )}
          </Box>
        ),
      },
    ],
    []
  );

  console.log(formData, "formData");

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
      .get(`${commonData?.APIKEY}/getcompOffDetails`)
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
    if (window.confirm("Are you sure you want to delete this comp-off request?")) {
      axios
        .delete(`${commonData?.APIKEY}/deletecompOff/` + id)
        .then((res) => {
          if (res.data.Status === "Success") {
            getLeaves();
            alert("Comp-off deleted successfully");
          } else {
            alert("Error deleting comp-off");
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
              Comp-Off Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Apply and manage compensation off requests
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
              Apply Comp-Off
            </Typography>
          </Box>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="comp-off-type-label">Comp Off Type</InputLabel>
                  <Controller
                    name="leaveType"
                    control={control}
                    rules={{ required: "Comp Off is Required" }}
                    defaultValue="CompOff"
                    render={({ field }) => (
                      <Select
                        labelId="comp-off-type-label"
                        id="comp-off-type"
                        label="Comp Off Type"
                        {...field}
                        error={Boolean(errors.leaveType)}
                        startAdornment={<EventAvailable sx={{ mr: 1, color: "text.secondary" }} />}
                      >
                        <MenuItem value={"CompOff"}>Comp off</MenuItem>
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
                    defaultValue=""
                    rules={{ required: "Work Date From is Required." }}
                    render={({ field }) => (
                      <DatePicker
                        label="Work Date From"
                        {...field}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: Boolean(errors.leaveFrom),
                            helperText: errors.leaveFrom && errors.leaveFrom.message,
                            InputProps: {
                              startAdornment: <Work sx={{ mr: 1, color: "text.secondary" }} />,
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
                <Controller
                  name="workHours"
                  control={control}
                  defaultValue=""
                  rules={{ required: "Work Hours is Required." }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Work Hours"
                      variant="outlined"
                      type="number"
                      {...field}
                      error={Boolean(errors.workHours)}
                      helperText={errors.workHours && errors.workHours.message}
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
                      label="Project Details"
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
                  Submit
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
              Comp-off Details
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

export default CompOff;
