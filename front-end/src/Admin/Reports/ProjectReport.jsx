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
  Folder,
  FileDownload,
  Refresh,
} from "@mui/icons-material";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import commonData from "../../../common.json";

const ProjectReport = () => {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [projectDetails, setProjectDetails] = useState([]);
  const [workDetails, setWorkDetails] = useState([]);
  const [projectWorkHours, setProjectWorkHours] = React.useState(null);
  const [exportApi, setExportApi] = React.useState(null);
  console.log(projectWorkHours, "workDetailsworkDetails", workDetails);
  React.useEffect(() => {
    onGetWorkDetails();
    onGridReady();
  }, []);

  React.useEffect(() => {
    const projectData = workDetails.reduce((acc, entry) => {
      const referenceNo = entry.referenceNo;
      if (!acc[referenceNo]) {
        acc[referenceNo] = [];
      }
      acc[referenceNo].push(Number(entry.totalHours));
      return acc;
    }, {});

    const projectTotalHours = Object.keys(projectData).map((referenceNo) => {
      const totalHours = projectData[referenceNo].reduce(
        (sum, hours) => sum + hours,
        0
      );
      return { referenceNo, totalHours };
    });
    setProjectWorkHours(projectTotalHours);
    console.log(projectTotalHours, "projectTotalHours");
  }, [workDetails]);

  const onGridReady = (params) => {
    console.log(params, "paramsparams212");
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

  const calculateProjectValues = (params, projectWorkHours) => {
    const project = projectWorkHours?.find(
      (items) => items.referenceNo === params.data.referenceNo
    );
    console.log(projectWorkHours, "items234123");
    if (project) {
      const completionPercentage =
        (Number(project.totalHours) / params.data.allotatedHours) * 100;
      const remainingPercentage = 100 - completionPercentage;

      return {
        completionPercentage: completionPercentage.toFixed(2) + "%",
        utilizationPercentage: remainingPercentage.toFixed(2) + "%",
        consumedHours: Number(project.totalHours),
      };
    }

    return {
      completionPercentage: "0%",
      utilizationPercentage: "0%",
      consumedHours: 0,
    };
  };

  const columnDefs = useMemo(
    () => [
      {
        field: "orderId",
        minWidth: 170,
      },
      { field: "projectNo" },
      { field: "projectName" },
      { field: "referenceNo" },
      { field: "desciplineCode", headerName: "Discipline Code" },
      {
        field: "completion",
        // valueGetter: (params) =>
        //   calculateProjectValues(params, projectWorkHours).completionPercentage,
      },
      {
        field: "% Utilized",
        valueGetter: (params) =>
          calculateProjectValues(params, projectWorkHours).completionPercentage,
      },
      { field: "allotatedHours", headerName: "Allotted Hours" },
      {
        field: "Consumed Hours",
        valueGetter: (params) =>
          calculateProjectValues(params, projectWorkHours).consumedHours,
      },
      { field: "startDate" },
      { field: "targetDate" },
    ],
    [projectWorkHours]
  );

  // Rest of your code...

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
              Project Report
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View project details, completion percentages, and utilization metrics
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
            <Folder color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Project Details
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

export default ProjectReport;
