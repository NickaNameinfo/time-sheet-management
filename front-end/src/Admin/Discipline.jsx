import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  TextField,
  InputAdornment,
  Stack,
  IconButton,
} from "@mui/material";
import {
  Add,
  Delete,
  Search,
  Refresh,
  Close,
  School,
} from "@mui/icons-material";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import commonData from "../../common.json";

export const Discipline = () => {
  const [rowData, setRowData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [disciplineToDelete, setDisciplineToDelete] = useState(null);
  const [modalValue, setModalValue] = useState({ discipline: "" });
  const [searchText, setSearchText] = useState("");
  const [gridApi, setGridApi] = useState(null);
  const [loading, setLoading] = useState(false);

  const columnDefs = useMemo(
    () => [
      {
        field: "discipline",
        headerName: "Discipline",
        minWidth: 200,
        checkboxSelection: true,
        cellRenderer: (params) => {
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
              <School color="primary" sx={{ fontSize: 20 }} />
              <Typography variant="body2" fontWeight="medium">
                {params.value || "N/A"}
              </Typography>
            </Box>
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
    fetchDisciplineData();
  }, []);

  const fetchDisciplineData = useCallback(() => {
    setLoading(true);
    axios
      .get(`${commonData?.APIKEY}/discipline`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setRowData(res.data.Result);
        } else {
          alert("Error loading discipline data");
        }
      })
      .catch((err) => {
        console.log(err);
        alert("Error loading discipline data");
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

  const handleDeleteClick = (discipline) => {
    setDisciplineToDelete(discipline);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (disciplineToDelete) {
      axios
        .delete(`${commonData?.APIKEY}/discipline/delete/` + disciplineToDelete.id)
        .then((res) => {
          if (res.data.Status === "Success") {
            setDeleteDialogOpen(false);
            setDisciplineToDelete(null);
            setSelectedRows([]);
            fetchDisciplineData();
          } else {
            alert("Error deleting discipline");
          }
        })
        .catch((err) => {
          console.log(err);
          alert("Error deleting discipline");
        });
    }
  };

  const onSelectionChanged = useCallback((event) => {
    const selectedItems = event.api.getSelectedRows();
    setSelectedRows(selectedItems);
  }, []);

  const handleBulkDelete = () => {
    if (selectedRows.length > 0) {
      setDisciplineToDelete(selectedRows[0]);
      setDeleteDialogOpen(true);
    }
  };

  const handleAddDiscipline = () => {
    if (!modalValue.discipline || !modalValue.discipline.trim()) {
      alert("Please enter a discipline");
      return;
    }

    axios
      .post(`${commonData?.APIKEY}/create/discipline`, modalValue)
      .then((res) => {
        if (res.data.Status === "Success") {
          setAddDialogOpen(false);
          setModalValue({ discipline: "" });
          fetchDisciplineData();
        } else {
          alert("Error creating discipline");
        }
      })
      .catch((err) => {
        console.log(err);
        alert("Error creating discipline");
      });
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
              Discipline Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and view all disciplines in your organization
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchDisciplineData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddDialogOpen(true)}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                },
              }}
            >
              Add Discipline
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
            placeholder="Search disciplines..."
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

      {/* Add Discipline Dialog */}
      <Dialog
        fullWidth
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setModalValue({ discipline: "" });
        }}
        maxWidth="sm"
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Add Discipline</Typography>
            <IconButton
              onClick={() => {
                setAddDialogOpen(false);
                setModalValue({ discipline: "" });
              }}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Discipline"
              variant="outlined"
              value={modalValue.discipline}
              onChange={(e) => {
                setModalValue({ discipline: e.target.value });
              }}
              placeholder="Enter discipline description"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setAddDialogOpen(false);
              setModalValue({ discipline: "" });
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddDiscipline}
            variant="contained"
            startIcon={<Add />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

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
          <Typography>
            Are you sure you want to delete discipline{" "}
            <strong>{disciplineToDelete?.discipline}</strong>?
            <br />
            <br />
            This action cannot be undone.
          </Typography>
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
