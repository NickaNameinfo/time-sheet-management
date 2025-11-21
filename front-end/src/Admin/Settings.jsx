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
  Delete,
  Search,
  Refresh,
  Settings as SettingsIcon,
  Article,
  Announcement,
  Description,
  PhotoLibrary,
  TableChart,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import commonData from "../../common.json";

export const Settings = () => {
  const navigate = useNavigate();
  const [rowData, setRowData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [gridApi, setGridApi] = useState(null);
  const [loading, setLoading] = useState(false);

  const columnDefs = useMemo(
    () => [
      {
        field: "updateTitle",
        headerName: "Update Title",
        minWidth: 200,
        checkboxSelection: true,
        cellRenderer: (params) => {
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
              <Article color="primary" sx={{ fontSize: 20 }} />
              <Typography variant="body2" fontWeight="medium">
                {params.value || "N/A"}
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "UpdateDisc",
        headerName: "Update Description",
        minWidth: 250,
        cellRenderer: (params) => (
          <Typography
            variant="body2"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {params.value || "N/A"}
          </Typography>
        ),
      },
      {
        field: "Announcements",
        headerName: "Announcements",
        minWidth: 150,
        cellRenderer: (params) => (
          <Chip
            icon={<Announcement />}
            label={params.value ? "Yes" : "No"}
            size="small"
            color={params.value ? "info" : "default"}
            variant={params.value ? "filled" : "outlined"}
          />
        ),
      },
      {
        field: "Circular",
        headerName: "Circular",
        minWidth: 120,
        cellRenderer: (params) => (
          <Chip
            icon={<Description />}
            label={params.value ? "Yes" : "No"}
            size="small"
            color={params.value ? "warning" : "default"}
            variant={params.value ? "filled" : "outlined"}
          />
        ),
      },
      {
        field: "Gallery",
        headerName: "Gallery",
        minWidth: 120,
        cellRenderer: (params) => (
          <Chip
            icon={<PhotoLibrary />}
            label={params.value ? "Yes" : "No"}
            size="small"
            color={params.value ? "success" : "default"}
            variant={params.value ? "filled" : "outlined"}
          />
        ),
      },
      {
        field: "ViewExcel",
        headerName: "View Excel",
        minWidth: 130,
        cellRenderer: (params) => (
          <Chip
            icon={<TableChart />}
            label={params.value ? "Yes" : "No"}
            size="small"
            color={params.value ? "secondary" : "default"}
            variant={params.value ? "filled" : "outlined"}
          />
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
            <Tooltip title="Delete Update">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDeleteClick(params.data)}
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
          );
        },
      },
    ],
    []
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
    fetchSettingsData();
  }, []);

  const fetchSettingsData = useCallback(() => {
    setLoading(true);
    axios
      .get(`${commonData?.APIKEY}/settings`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setRowData(res.data.Result);
        } else {
          alert("Error loading settings data");
        }
      })
      .catch((err) => {
        console.log(err);
        alert("Error loading settings data");
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

  const handleDeleteClick = (setting) => {
    setSettingToDelete(setting);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (settingToDelete) {
      axios
        .delete(`${commonData?.APIKEY}/updates/delete/` + settingToDelete.id)
        .then((res) => {
          if (res.data.Status === "Success") {
            setDeleteDialogOpen(false);
            setSettingToDelete(null);
            setSelectedRows([]);
            fetchSettingsData();
          } else {
            alert("Error deleting update");
          }
        })
        .catch((err) => {
          console.log(err);
          alert("Error deleting update");
        });
    }
  };

  const onSelectionChanged = useCallback((event) => {
    const selectedItems = event.api.getSelectedRows();
    setSelectedRows(selectedItems);
  }, []);

  const handleBulkDelete = () => {
    if (selectedRows.length > 0) {
      setSettingToDelete(selectedRows[0]);
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
              Settings & Updates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage announcements, circulars, gallery, and other updates
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchSettingsData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate("/Dashboard/AddUpdates")}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                },
              }}
            >
              Add Update
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
            placeholder="Search updates..."
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
              rowSelection="multiple"
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
            Are you sure you want to delete update{" "}
            <strong>{settingToDelete?.updateTitle}</strong>?
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
};
