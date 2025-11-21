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
  Assessment,
  FileDownload,
  Refresh,
} from "@mui/icons-material";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import commonData from "../../../common.json";

const ConsolidatedReport = () => {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [workDetails, setWorkDetails] = useState([]);
  const [exportApi, setExportApi] = React.useState(null);

  console.log(workDetails, "workDetailsworkDetails");

  React.useEffect(() => {
    onGetWorkDetails();
  }, []);

  const onGetWorkDetails = (params) => {
    setExportApi(params?.api);
    axios
      .get(`${commonData?.APIKEY}/getWrokDetails`)
      .then((res) => {
        if (res.data.Status === "Success") {
          let resultData = res.data.Result?.filter(
            (item) => item.status === "approved"
          );
          setWorkDetails(resultData);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const columnDefs = useMemo(
    () => [
      {
        field: "approvedDate",
        headerName: "Year",
        minWidth: 170,
        valueGetter: (params) => {
          return new Date(params.data?.approvedDate).getFullYear();
        },
      },
      {
        field: "weekNumber",
        minWidth: 170,
        headerName: "Week",
      },
      {
        field: "desciplineCode",
        minWidth: 170,
        headerName: "Code",
      },
      {
        field: "projectNo",
        minWidth: 170,
      },
      {
        field: "projectName",
        minWidth: 170,
      },
      {
        field: "subDivision",
        minWidth: 170,
      },
      {
        field: "employeeName",
        minWidth: 170,
      },
      {
        field: "employeeNo",
        minWidth: 170,
      },
      {
        field: "designation",
        minWidth: 170,
      },
      {
        field: "discipline",
        minWidth: 170,
      },
      {
        field: "areaofWork",
        minWidth: 170,
      },
      {
        field: "variation",
        minWidth: 170,
      },
      {
        field: "totalHours",
        minWidth: 170,
      },
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
              Consolidated Report
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comprehensive view of all approved work details by year, week, and employee
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={onGetWorkDetails}
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
            <Assessment color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Consolidated Work Details
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
                onGridReady={onGetWorkDetails}
                onSelectionChanged={onSelectionChanged}
              />
            </div>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ConsolidatedReport;
