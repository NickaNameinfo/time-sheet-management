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
  TextareaAutosize,
} from "@mui/material";
import {
  Add,
  Delete,
  Search,
  Refresh,
  Close,
  Category,
} from "@mui/icons-material";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import commonData from "../../common.json";

export const Variations = () => {
  const [rowData, setRowData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [variationToDelete, setVariationToDelete] = useState(null);
  const [modalValue, setModalValue] = useState({ variation: "" });
  const [searchText, setSearchText] = useState("");
  const [gridApi, setGridApi] = useState(null);
  const [loading, setLoading] = useState(false);

  const columnDefs = useMemo(
    () => [
      {
        field: "variation",
        headerName: "Variation",
        minWidth: 200,
        checkboxSelection: true,
        cellRenderer: (params) => {
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
              <Category color="primary" sx={{ fontSize: 20 }} />
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
    fetchVariationData();
  }, []);

  const fetchVariationData = useCallback(() => {
    setLoading(true);
    axios
      .get(`${commonData?.APIKEY}/variation`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setRowData(res.data.Result);
        } else {
          alert("Error loading variations data");
        }
      })
      .catch((err) => {
        console.log(err);
        alert("Error loading variations data");
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

  const handleDeleteClick = (variation) => {
    setVariationToDelete(variation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (variationToDelete) {
      axios
        .delete(`${commonData?.APIKEY}/variation/delete/` + variationToDelete.id)
        .then((res) => {
          if (res.data.Status === "Success") {
            setDeleteDialogOpen(false);
            setVariationToDelete(null);
            setSelectedRows([]);
            fetchVariationData();
          } else {
            alert("Error deleting variation");
          }
        })
        .catch((err) => {
          console.log(err);
          alert("Error deleting variation");
        });
    }
  };

  const onSelectionChanged = useCallback((event) => {
    const selectedItems = event.api.getSelectedRows();
    setSelectedRows(selectedItems);
  }, []);

  const handleBulkDelete = () => {
    if (selectedRows.length > 0) {
      setVariationToDelete(selectedRows[0]);
      setDeleteDialogOpen(true);
    }
  };

  const handleAddVariation = () => {
    if (!modalValue.variation || !modalValue.variation.trim()) {
      alert("Please enter a variation");
      return;
    }

    axios
      .post(`${commonData?.APIKEY}/create/variation`, modalValue)
      .then((res) => {
        if (res.data.Status === "Success") {
          setAddDialogOpen(false);
          setModalValue({ variation: "" });
          fetchVariationData();
        } else {
          alert("Error creating variation");
        }
      })
      .catch((err) => {
        console.log(err);
        alert("Error creating variation");
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
              Variations Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and view all variations in your organization
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchVariationData}
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
              Add Variation
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
            placeholder="Search variations..."
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

      {/* Add Variation Dialog */}
      <Dialog
        fullWidth
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setModalValue({ variation: "" });
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
            <Typography variant="h6">Add Variation</Typography>
            <IconButton
              onClick={() => {
                setAddDialogOpen(false);
                setModalValue({ variation: "" });
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
              label="Variation"
              variant="outlined"
              value={modalValue.variation}
              onChange={(e) => {
                setModalValue({ variation: e.target.value });
              }}
              placeholder="Enter variation description"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setAddDialogOpen(false);
              setModalValue({ variation: "" });
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddVariation}
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
            Are you sure you want to delete variation{" "}
            <strong>{variationToDelete?.variation}</strong>?
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
