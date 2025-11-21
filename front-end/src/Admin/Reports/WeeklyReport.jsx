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
  CalendarToday,
  FileDownload,
  Refresh,
} from "@mui/icons-material";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import commonData from "../../../common.json";

const WeeklyReport = () => {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [projectDetails, setProjectDetails] = useState([]);
  const [workDetails, setWorkDetails] = useState([]);
  const [projectWorkHours, setProjectWorkHours] = React.useState(null);
  const [exportApi, setExportApi] = React.useState(null);

  console.log(workDetails, "workDetailsworkDetails", projectDetails);
  React.useEffect(() => {
    onGetWorkDetails();
    onGridReady();
  }, []);

  React.useEffect(() => {
    const projectData = workDetails.reduce((acc, entry) => {
      const projectName = entry.projectName;
      if (!acc[projectName]) {
        acc[projectName] = [];
      }
      acc[projectName].push(Number(entry.totalHours));
      return acc;
    }, {});

    const projectTotalHours = Object.keys(projectData).map((projectName) => {
      const totalHours = projectData[projectName].reduce(
        (sum, hours) => sum + hours,
        0
      );
      return { projectName, totalHours };
    });
    setProjectWorkHours(projectTotalHours);
    console.log(projectTotalHours, "projectTotalHours");
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

  const getTotalHoursForWeek = (data) => {
    const totalHours = data.reduce(
      (acc, item) => acc + Number(item.totalHours),
      0
    );
    console.log(totalHours, "totalHours");
    return totalHours;
  };

  const columnDefs = useMemo(() => {
    const weekFields = [];

    // Generate fields for weeks 1 to 52
    for (let weekNumber = 1; weekNumber <= 52; weekNumber++) {
      const field = {
        field: weekNumber.toString(),
        filter: false,
        minWidth: 60,
        valueGetter: (params, index) => {
          const filteredData = workDetails.filter(
            (item) =>
              item.weekNumber === weekNumber.toString() &&
              item.projectName === String(params.data.projectName)
          );
          return getTotalHoursForWeek(filteredData);
        },
      };
      weekFields.push(field);
    }

    return [
      {
        field: "referenceNo",
        minWidth: 170,
      },
      {
        field: "allotatedHours",
        minWidth: 170,
        headerName: "Allotted Hours",
      },
      {
        field: "Consumed",
        headerName: "Consumed Hours",
        minWidth: 170,
        valueGetter: (params) => {
          const project = projectWorkHours?.find(
            (items) => items.projectName === params.data.projectName
          );

          return project?.totalHours || 0;
        },
      },
      // { field: "discipline" },
      { field: "projectName", minWidth: 170 },
      { field: "desciplineCode", headerName: "Discipline Code" },
      ...weekFields, // Include dynamically generated week fields
    ];
  }, [projectWorkHours]);

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
      valueGetter: "agGroupvalueGetter",
      valueGetterParams: {
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
              Project Weekly Report
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View project hours breakdown by week (1-52)
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
            <CalendarToday color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Weekly Project Hours
            </Typography>
          </Box>
          <Box sx={{ width: "100%", height: "600px" }}>
            <div style={gridStyle} className="ag-theme-alpine">
              <AgGridReact
                rowData={projectDetails}
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

export default WeeklyReport;
