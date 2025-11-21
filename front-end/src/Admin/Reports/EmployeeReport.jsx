import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  TextField,
  Stack,
  Grid,
  Paper,
} from "@mui/material";
import {
  People,
  FileDownload,
  Refresh,
  CalendarToday,
  FilterList,
  Clear,
} from "@mui/icons-material";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import commonData from "../../../common.json";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const EmployeeReport = () => {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [workDetails, setWorkDetails] = useState([]);
  const [exportApi, setExportApi] = React.useState(null);
  const [startDate, setStartData] = React.useState(null);
  const [endDate, setEnddate] = React.useState(null);
  const [filterValue, setFilterValue] = React.useState({
    exEmployee: false,
    permanent: false,
    probation: false,
  });

  console.log(filterValue, "workDetailsworkDetails", startDate, endDate);

  React.useEffect(() => {
    onGetWorkDetails();
  }, [startDate, endDate, filterValue]);

  React.useEffect(() => {
    onGetUserData();
  }, []);

  const handleFilterChange = (filterType) => {
    setFilterValue((prevState) => {
      if (filterType === "exEmployee") {
        return {
          ...prevState,
          exEmployee: true,
          permanent: false,
          probation: false,
        };
      } else if (filterType === "permanent") {
        return {
          ...prevState,
          exEmployee: false,
          permanent: true,
          probation: false,
        };
      } else {
        return {
          ...prevState,
          exEmployee: false,
          permanent: false,
          probation: true,
        };
      }
    });
  };

  const onGetUserData = (params) => {
    console.log(params, "params2342");
    setExportApi(params?.api);
  };

  const onGetWorkDetails = (params) => {
    axios
      .get(`${commonData?.APIKEY}/getEmployee`)
      .then((res) => {
        if (res.data.Status === "Success") {
          let tempFilter = filterValue.exEmployee
            ? "Ex-Employee"
            : filterValue.permanent
              ? "Permanent"
              : filterValue.probation
                ? "Probation"
                : null;
          const filteredData = res.data?.Result?.filter((item) => {
            if (startDate || endDate) {
              let tempDate = filterValue.exEmployee
                ? item.relievingDate
                : item?.date;
              const itemDate = new Date(tempDate);
              return (
                itemDate >= new Date(startDate) && itemDate <= new Date(endDate)
              );
            } else {
              return item?.employeeStatus === tempFilter;
            }
          });
          console.log(filteredData, "filteredData24523");
          if (filteredData.length > 0) {
            setWorkDetails(filteredData);
          } else {
            setWorkDetails(res.data.Result);
          }
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const columnDefs = useMemo(
    () => [
      {
        field: "employeeName",
        minWidth: 170,
        checkboxSelection: false,
      },
      { field: "EMPID", headerName: "Employee ID" },
      { field: "employeeEmail" },
      { field: "userName" },
      { field: "role" },
      { field: "discipline" },
      { field: "designation" },
      { field: "employeeStatus" },
      { field: "date", headerName: "Join Date" },
      { field: "relievingDate", headerName: "Relieving Date" },
      { field: "permanentDate", headerName: "Permanent Date" },
    ],
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

  const onClickExport = () => {
    if (exportApi) {
      exportApi.exportDataAsCsv();
      alert("Report exported successfully");
    } else {
      alert("Please wait for the grid to load");
    }
  };

  const onSelectionChanged = (event) => {
    // Handle selection if needed
  };

  const handleClearFilter = () => {
    setStartData(null);
    setEnddate(null);
    setFilterValue({
      exEmployee: false,
      permanent: false,
      probation: false,
    });
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
              Employee Report
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and filter employee information by status and date range
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                onGetWorkDetails();
                onGetUserData();
              }}
            >
              Refresh
            </Button>
            <Button
              onClick={onClickExport}
              variant="contained"
              startIcon={<FileDownload />}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                },
              }}
            >
              Export CSV
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Filters Card */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <FilterList color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Filters
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Employee Status
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    label="Ex-Employee"
                    onClick={() => handleFilterChange("exEmployee")}
                    color={filterValue.exEmployee ? "success" : "default"}
                    variant={filterValue.exEmployee ? "filled" : "outlined"}
                    clickable
                  />
                  <Chip
                    label="Permanent"
                    onClick={() => handleFilterChange("permanent")}
                    color={filterValue.permanent ? "success" : "default"}
                    variant={filterValue.permanent ? "filled" : "outlined"}
                    clickable
                  />
                  <Chip
                    label="Probation"
                    onClick={() => handleFilterChange("probation")}
                    color={filterValue.probation ? "success" : "default"}
                    variant={filterValue.probation ? "filled" : "outlined"}
                    clickable
                  />
                  <Chip
                    label="Clear Filter"
                    onClick={handleClearFilter}
                    color="warning"
                    variant="outlined"
                    icon={<Clear />}
                    clickable
                  />
                </Stack>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={startDate ? dayjs(startDate) : null}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      InputProps: {
                        startAdornment: <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />,
                      },
                    },
                  }}
                  onChange={(newValue) => {
                    const formattedDate = dayjs(newValue).format("YYYY-MM-DD");
                    setStartData(formattedDate);
                  }}
                  format="YYYY-MM-DD"
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="End Date"
                  value={endDate ? dayjs(endDate) : null}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      InputProps: {
                        startAdornment: <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />,
                      },
                    },
                  }}
                  onChange={(newValue) => {
                    const formattedDate = dayjs(newValue).format("YYYY-MM-DD");
                    setEnddate(formattedDate);
                  }}
                  format="YYYY-MM-DD"
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Grid Card */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <People color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Employee Details
            </Typography>
          </Box>
          <Box sx={{ width: "100%", height: "600px" }}>
            <div style={gridStyle} className="ag-theme-alpine">
              <AgGridReact
                rowData={workDetails}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                suppressRowClickSelection={true}
                groupSelectsChildren={true}
                rowGroupPanelShow={"always"}
                pivotPanelShow={"always"}
                pagination={true}
                onGridReady={(value) => onGetUserData(value)}
                onSelectionChanged={onSelectionChanged}
              />
            </div>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmployeeReport;
