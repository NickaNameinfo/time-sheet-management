import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import {
  Add,
  Delete,
  Refresh,
  Folder,
  Assignment,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import commonData from "../../common.json";
function Projects() {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [rowData, setRowData] = useState([]);
  const [selectedRows, setSelectedRows] = useState(null);

  const columnDefs = useMemo(
    () => [
      {
        field: "tlName",
        minWidth: 170,
      },
      { field: "orderId", minWidth: 170 },
      { field: "positionNumber", minWidth: 170 },
      { field: "subPositionNumber", minWidth: 170 },
      { field: "projectNo", minWidth: 170 },
      { field: "taskJobNo", minWidth: 170 },
      { field: "projectName", minWidth: 170 },
      { field: "referenceNo", minWidth: 170 },
      { field: "subDivision", minWidth: 170 },
      { field: "startDate", minWidth: 170 },
      { field: "targetDate", minWidth: 170 },
      { field: "allotatedHours", headerName: "Allotted Hours", minWidth: 170 },
    ],
    []
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
      editable: true,
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

  const onGridReady = useCallback((params) => {
    axios
      .get(`${commonData?.APIKEY}/getProject`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setRowData(res.data.Result);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  }, []);

  const handleDelete = (id) => {
    axios
      .delete(`${commonData?.APIKEY}/project/delete/` + id)
      .then((res) => {
        if (res.data.Status === "Success") {
          window.location.reload(true);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const onSelectionChanged = (event) => {
    const selectedItem = event.api.getSelectedRows();
    setSelectedRows(selectedItem);
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
              Projects
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage assigned projects
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
              component={Link}
              to="/Dashboard/addProject"
              variant="contained"
              startIcon={<Add />}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                },
              }}
            >
              Add Project
            </Button>
            {selectedRows?.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this project?")) {
                    handleDelete(selectedRows?.[0]?.id);
                  }
                }}
              >
                Delete
              </Button>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Grid Card */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <Folder color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Project List
            </Typography>
          </Box>
          <Box sx={{ width: "100%", height: "600px" }}>
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
                onGridReady={onGridReady}
                onSelectionChanged={(event) => onSelectionChanged(event)}
              />
            </div>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Projects;
