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
import api from "../services/api";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

export const Discipline = () => {
  const [rowData, setRowData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [disciplineToDelete, setDisciplineToDelete] = useState(null);
  const [modalValue, setModalValue] = useState({ discipline: "", discipline_code: "" });
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
          const code = params.data?.discipline_code;
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
              <School color="primary" sx={{ fontSize: 20 }} />
              <Typography variant="body2" fontWeight="medium">
                {params.value || "N/A"}
                {code != null && code !== "" && (
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    – {code}
                  </Typography>
                )}
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "discipline_code",
        headerName: "Code",
        minWidth: 100,
        cellRenderer: (params) => (
          <Chip size="small" label={params.value || "—"} sx={{ fontWeight: 600 }} />
        ),
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
    api
      .get("/discipline")
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
      api
        .delete("/discipline/delete/" + disciplineToDelete.id)
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
      alert("Please enter a discipline name");
      return;
    }
    if (!modalValue.discipline_code || !modalValue.discipline_code.trim()) {
      alert("Please enter a discipline code (e.g. 101, 201)");
      return;
    }
    api
      .post("/create/discipline", {
        discipline: modalValue.discipline.trim(),
        discipline_code: modalValue.discipline_code.trim(),
      })
      .then((res) => {
        if (res.data.Status === "Success") {
          setAddDialogOpen(false);
          setModalValue({ discipline: "", discipline_code: "" });
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
              Discipline Rules
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add discipline name and code (e.g. Marketing – 101). Codes are used when creating projects.
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
                background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
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
          setModalValue({ discipline: "", discipline_code: "" });
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
            <Typography variant="h6">Add Discipline Rule</Typography>
            <IconButton
              onClick={() => {
                setAddDialogOpen(false);
                setModalValue({ discipline: "", discipline_code: "" });
              }}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Discipline name"
              variant="outlined"
              value={modalValue.discipline}
              onChange={(e) => setModalValue((p) => ({ ...p, discipline: e.target.value }))}
              placeholder="e.g. Marketing, Sales"
            />
            <TextField
              fullWidth
              label="Discipline code"
              variant="outlined"
              value={modalValue.discipline_code}
              onChange={(e) => setModalValue((p) => ({ ...p, discipline_code: e.target.value }))}
              placeholder="e.g. 101, 201 (used in project creation)"
              helperText="Code used when creating projects"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setAddDialogOpen(false);
              setModalValue({ discipline: "", discipline_code: "" });
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddDiscipline}
            variant="contained"
            startIcon={<Add />}
            sx={{
              background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
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
            <strong>{disciplineToDelete?.discipline}</strong>
            {disciplineToDelete?.discipline_code ? ` (${disciplineToDelete.discipline_code})` : ""}?
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
