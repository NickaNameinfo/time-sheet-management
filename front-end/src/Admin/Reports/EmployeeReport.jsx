import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import commonData from "../../../common.json";
import { Box, Chip, TextField } from "@mui/material";
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
    console.log(exportApi, "grdiApigrdiApi");
    exportApi.exportDataAsCsv();
  };

  return (
    <>
      <div className="text-center pb-1 my-3">
        <h4>Consolidated Report</h4>
      </div>
      <div style={containerStyle}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            <Button
              onClick={() => onClickExport()}
              variant="contained"
              className="mx-3"
            >
              Export
            </Button>
            <Chip
              label="Ex-Employee"
              onClick={() => handleFilterChange("exEmployee")}
              className="me-3"
              color={!filterValue.exEmployee ? "primary" : "success"}
            />
            <Chip
              label="Permanent"
              onClick={() => handleFilterChange("permanent")}
              className="me-3"
              color={!filterValue.permanent ? "primary" : "success"}
            />
            <Chip
              label="Probation"
              onClick={() => handleFilterChange("probation")}
              color={!filterValue.probation ? "primary" : "success"}
            />
            <Chip
              label="Clear Filter"
              onClick={() => {
                setStartData(null);
                setEnddate(null);
                setFilterValue((prevState) => {
                  return {
                    ...prevState,
                    exEmployee: false,
                    permanent: false,
                    probation: false,
                  };
                });
              }}
              color={"warning"}
              className="ms-3"
            />
          </div>
          <div className="d-flex">
            <div className="me-3">
              <label>Start date</label>
              <Box sx={{}}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    placeholder="Date Of Join"
                    value={dayjs(startDate)}
                    renderInput={(props) => <TextField {...props} fullWidth />}
                    defaultValue={null}
                    onChange={(newValue) => {
                      // Convert the selected date to the desired format (YYYY-MM-DD) and update the state using setValue
                      const formattedDate =
                        dayjs(newValue).format("YYYY-MM-DD");
                      setStartData(formattedDate);
                    }}
                    format="YYYY-MM-DD"
                  />
                </LocalizationProvider>
              </Box>
            </div>
            <div>
              <label>End date</label>
              <Box sx={{}}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    placeholder="Date Of Join"
                    value={dayjs(endDate)}
                    renderInput={(props) => <TextField {...props} fullWidth />}
                    defaultValue={null}
                    onChange={(newValue) => {
                      // Convert the selected date to the desired format (YYYY-MM-DD) and update the state using setValue
                      const formattedDate =
                        dayjs(newValue).format("YYYY-MM-DD");
                      setEnddate(formattedDate);
                    }}
                    format="YYYY-MM-DD"
                  />
                </LocalizationProvider>
              </Box>
            </div>
          </div>
        </div>

        <div style={gridStyle} className="ag-theme-alpine leavetable">
          <AgGridReact
            rowData={workDetails}
            columnDefs={columnDefs}
            // autoGroupColumnDef={autoGroupColumnDef}
            defaultColDef={defaultColDef}
            suppressRowClickSelection={true}
            groupSelectsChildren={true}
            // rowSelection={"single"}
            rowGroupPanelShow={"always"}
            pivotPanelShow={"always"}
            pagination={true}
            onGridReady={(value) => onGetUserData(value)}
            onSelectionChanged={(event) => onSelectionChanged(event)}
          />
        </div>
      </div>
    </>
  );
};

export default EmployeeReport;
