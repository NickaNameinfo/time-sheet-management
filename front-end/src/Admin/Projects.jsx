import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Tooltip,
  Paper,
  TextField,
  InputAdornment,
  Stack,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  Business,
  CalendarToday,
  AccessTime,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import commonData from "../../common.json";

function Projects(props) {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [rowData, setRowData] = useState([]);
  const [roles, setRoles] = React.useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [gridApi, setGridApi] = useState(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    axios
      .post(`${commonData?.APIKEY}/dashboard`, { tokensss: token })
      .then((res) => {
        if (res.data.Status === "Success") {
          setRoles(res.data.role?.split(","));
        }
      });
  }, []);

  const onClickEdit = (id) => {
    navigate(`/Dashboard/addProject/${id}`);
  };

  const columnDefs = useMemo(
    () => [
      {
        field: "projectName",
        headerName: "Project Name",
        minWidth: 200,
        checkboxSelection: roles?.[0] === "Admin",
        cellRenderer: (params) => {
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
              <Business color="primary" sx={{ fontSize: 20 }} />
              <Typography variant="body2" fontWeight="medium">
                {params.value || "N/A"}
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "tlName",
        headerName: "TL Name",
        minWidth: 150,
      },
      {
        field: "projectNo",
        headerName: "Project No",
        minWidth: 120,
      },
      {
        field: "orderId",
        headerName: "Order ID",
        minWidth: 120,
      },
      {
        field: "desciplineCode",
        headerName: "Discipline Code",
        minWidth: 150,
        cellRenderer: (params) => (
          <Chip label={params.value || "N/A"} size="small" variant="outlined" />
        ),
      },
      {
        field: "startDate",
        headerName: "Start Date",
        minWidth: 130,
        cellRenderer: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <CalendarToday sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="body2">
              {params.value ? new Date(params.value).toLocaleDateString() : "N/A"}
            </Typography>
          </Box>
        ),
      },
      {
        field: "targetDate",
        headerName: "Target Date",
        minWidth: 130,
        cellRenderer: (params) => (
          <Typography variant="body2">
            {params.value ? new Date(params.value).toLocaleDateString() : "N/A"}
          </Typography>
        ),
      },
      {
        field: "allotatedHours",
        headerName: "Allotted Hours",
        minWidth: 140,
        cellRenderer: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <AccessTime sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="body2">{params.value || "N/A"}</Typography>
          </Box>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        minWidth: 120,
        filter: false,
        sortable: false,
        cellRenderer: (params) => {
          return (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Edit Project">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => onClickEdit(params.data.id)}
                  sx={{
                    "&:hover": {
                      bgcolor: "primary.light",
                      color: "white",
                    },
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [roles]
  );

  const defaultColDef = useMemo(
    () => ({
      editable: false,
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
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
    fetchProjectData();
  }, []);

  const fetchProjectData = useCallback(() => {
    setLoading(true);
    axios
      .get(`${commonData?.APIKEY}/getProject`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setRowData(res.data.Result);
        } else {
          alert("Error loading projects data");
        }
      })
      .catch((err) => {
        console.log(err);
        alert("Error loading projects data");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (gridApi) {
        if (searchText) {
          gridApi.setQuickFilter(searchText);
        } else {
          gridApi.setQuickFilter("");
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText, gridApi]);

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (projectToDelete) {
      axios
        .delete(`${commonData?.APIKEY}/project/delete/` + projectToDelete.id)
        .then((res) => {
          if (res.data.Status === "Success") {
            setDeleteDialogOpen(false);
            setProjectToDelete(null);
            setSelectedRows([]);
            fetchProjectData();
          } else {
            alert("Error deleting project");
          }
        })
        .catch((err) => {
          console.log(err);
          alert("Error deleting project");
        });
    }
  };

  const onSelectionChanged = useCallback((event) => {
    const selectedItems = event.api.getSelectedRows();
    setSelectedRows(selectedItems);
  }, []);

  const handleBulkDelete = () => {
    if (selectedRows.length > 0) {
      setProjectToDelete(selectedRows[0]);
      setDeleteDialogOpen(true);
    }
  };

  return (
    <Box>
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
                Project Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and view all projects in your organization
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchProjectData}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate("/Dashboard/addProject")}
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                  },
                }}
              >
                Add Project
              </Button>
            </Stack>
          </Box>

          {/* Search and Actions Bar */}
          <Paper
            elevation={1}
            sx={{
              p: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <TextField
              placeholder="Search projects..."
              variant="outlined"
              size="small"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, minWidth: 250 }}
            />
            {selectedRows.length > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label={`${selectedRows.length} selected`}
                  color="primary"
                  size="small"
                />
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={handleBulkDelete}
                  size="small"
                >
                  Delete Selected
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      {/* AG Grid */}
      <Card
        sx={{
          height: "calc(100vh - 300px)",
          minHeight: 500,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 0, height: "100%" }}>
          <Box sx={{ height: "100%", width: "100%" }} className="ag-theme-alpine">
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              suppressRowClickSelection={true}
              rowSelection={roles?.[0] === "Admin" ? "multiple" : false}
              pagination={true}
              paginationPageSize={20}
              onGridReady={onGridReady}
              onSelectionChanged={onSelectionChanged}
              animateRows={true}
              rowHeight={60}
              headerHeight={50}
              enableRangeSelection={true}
              suppressCellFocus={true}
              loading={loading}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Delete color="error" />
            <Typography variant="h6">Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete project{" "}
            <strong>{projectToDelete?.projectName}</strong> (Project No: {projectToDelete?.projectNo})?
            <br />
            <br />
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            startIcon={<Delete />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Projects;
