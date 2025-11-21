import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import {
  EventAvailable,
  FileDownload,
  Refresh,
} from "@mui/icons-material";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import commonData from "../../../common.json";

const LeaveReport = () => {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [projectDetails, setProjectDetails] = useState([]);
  const [exportApi, setExportApi] = React.useState(null);
  const [totalLeave, setTotalLeave] = React.useState(0);

  console.log(projectDetails, "projectDetails");
  React.useEffect(() => {
    onGridReady();
  }, []);

  const getTotalLeaves = (data) => {
    console.log(data, "data123213412370429");
    const employeeLeaveData = {};

    // Iterate through the data array and sum leaveHours for each leaveType and employee
    for (const entry of data) {
      const { leaveType, leaveHours, employeeName, employeeId } = entry;
      const key = `${employeeName}-${employeeId}`;

      if (!employeeLeaveData[key]) {
        employeeLeaveData[key] = {};
      }

      if (!employeeLeaveData[key][leaveType]) {
        employeeLeaveData[key][leaveType] = parseInt(leaveHours, 10) || 0; // Initialize to leaveHours for a new combination
      } else {
        employeeLeaveData[key][leaveType] += parseInt(leaveHours, 10) || 0; // Increment by leaveHours for an existing combination
      }
    }

    // Convert the data into an array of objects
    const resultArray = Object.keys(employeeLeaveData).map((key) => {
      const [employeeName, employeeId] = key.split("-");
      const leaveTypeData = employeeLeaveData[key];
      const totalCount = Object.values(leaveTypeData).reduce(
        (total, count) => total + count,
        0
      );
      // console.log(totalCount, "totalCount");
      // setTotalLeave(totalCount);
      return {
        employeeName,
        employeeId,
        ...leaveTypeData,
        totalCount,
      };
    });

    console.log(resultArray, "resultArray");

    return resultArray;
  };

  const onGridReady = (params) => {
    setExportApi(params?.api);
    axios
      .get(`${commonData?.APIKEY}/getLeaveDetails`)
      .then((res) => {
        if (res.data.Status === "Success") {
          let result = getTotalLeaves(res.data.Result);
          setProjectDetails(result);

          console.log(result, "2342result");
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
        minWidth: 100,
      },
      {
        field: "employeeId",
        minWidth: 100,
      },
      {
        field: "Casual Leave",
        minWidth: 100,
      },
      {
        field: "Sick Leave",
        minWidth: 100,
      },
      {
        field: "Earned Leave",
        minWidth: 100,
      },
      {
        field: "Comp-off",
        minWidth: 100,
      },
      {
        field: "LOP",
        minWidth: 100,
      },
      {
        headerName: "Total Leaves",
        field: "totalCount",
        minWidth: 100,
        // valueGetter: (params, index) => {
        //   return totalLeave;
        // },
      },
    ],
    [projectDetails]
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
              Leave Report
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View employee leave details by leave type
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={onGridReady}
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

      {/* Grid Card */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <EventAvailable color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Employee Leave Summary
            </Typography>
          </Box>
          <Box sx={{ width: "100%", height: "600px" }}>
            <div style={gridStyle} className="ag-theme-alpine">
              <AgGridReact
                rowData={projectDetails}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                suppressRowClickSelection={true}
                groupSelectsChildren={true}
                rowSelection={"single"}
                rowGroupPanelShow={"always"}
                pivotPanelShow={"always"}
                pagination={true}
                onGridReady={onGridReady}
                onSelectionChanged={onSelectionChanged}
              />
            </div>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LeaveReport;
