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
  Category,
  FileDownload,
  Refresh,
} from "@mui/icons-material";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import commonData from "../../../common.json";

const DesciplineCodeReport = () => {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [projectDetails, setProjectDetails] = useState([]);
  const [workDetails, setWorkDetails] = useState([]);
  const [projectWorkHours, setProjectWorkHours] = React.useState(null);
  const [exportApi, setExportApi] = React.useState(null);

  console.log(workDetails, "workDetailsworkDetails", projectWorkHours);
  React.useEffect(() => {
    onGetWorkDetails();
    onGridReady();
  }, []);

  React.useEffect(() => {
    const disciplineCodeTotals = {};

    // Iterate through the data and calculate the totals
    workDetails.forEach((item) => {
      const year = new Date(item.sentDate).getFullYear();
      const disciplineCode = item.desciplineCode;

      // Initialize the disciplineCode's total for the year if not already created
      if (!disciplineCodeTotals[year]) {
        disciplineCodeTotals[year] = {};
      }

      // Initialize the disciplineCode's total for the specific disciplineCode if not already created
      if (!disciplineCodeTotals[year][disciplineCode]) {
        disciplineCodeTotals[year][disciplineCode] = 0;
      }

      // Add the totalHours to the disciplineCode's total for the year and disciplineCode
      disciplineCodeTotals[year][disciplineCode] += Number(item.totalHours);
    });

    // Convert the disciplineCodeTotals object into an array of objects
    const resultArray = Object.keys(disciplineCodeTotals).map((year) => ({
      year: parseInt(year),
      disciplineCodeTotals: disciplineCodeTotals[year],
    }));

    setProjectWorkHours(resultArray);
  }, [workDetails]);

  const onGridReady = (params) => {
    setExportApi(params?.api);
    axios
      .get(`${commonData?.APIKEY}/getProject`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setProjectDetails(res.data.Result);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const onGetWorkDetails = (params) => {
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
    () => {
      // Extract all unique discipline codes from the data
      const uniqueDisciplineCodes = Array.from(
        new Set(
          projectWorkHours?.reduce((codes, item) => {
            return codes.concat(Object.keys(item.disciplineCodeTotals));
          }, [])
        )
      );

      // Generate column definitions for "year" and each discipline code
      const columns = [
        {
          field: "year",
          headerName: "Year",
          minWidth: 170,
        },
        ...uniqueDisciplineCodes.map((code) => ({
          field: `disciplineCodeTotals.${code}`,
          headerName: `${code}`,
          minWidth: 170,
        })),
      ];

      return columns;
    },
    [projectWorkHours] // Include "data" as a dependency
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
              Project Discipline Code Report
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View project hours by discipline code and year
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                onGridReady();
                onGetWorkDetails();
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

      {/* Grid Card */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <Category color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Discipline Code Analysis
            </Typography>
          </Box>
          <Box sx={{ width: "100%", height: "600px" }}>
            <div style={gridStyle} className="ag-theme-alpine">
              <AgGridReact
                rowData={projectWorkHours}
                columnDefs={columnDefs}
                autoGroupColumnDef={autoGroupColumnDef}
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

export default DesciplineCodeReport;
