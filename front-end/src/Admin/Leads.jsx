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
  DialogContentText,
  DialogActions,
  Chip,
  Paper,
  TextField,
  InputAdornment,
  Stack,
} from "@mui/material";
import {
  Add,
  Delete,
  Search,
  Person,
  Refresh,
  Group,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import commonData from "../../common.json";

function Leads() {
  const navigate = useNavigate();
  const [rowData, setRowData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [gridApi, setGridApi] = useState(null);
  const [loading, setLoading] = useState(false);

  const columnDefs = useMemo(
    () => [
      {
        field: "leadName",
        headerName: "Lead Name",
        minWidth: 200,
        checkboxSelection: true,
        cellRenderer: (params) => {
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
              <Person color="primary" sx={{ fontSize: 20 }} />
              <Typography variant="body2" fontWeight="medium">
                {params.value}
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "teamName",
        headerName: "Team Name",
        minWidth: 200,
        cellRenderer: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Group sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="body2">{params.value || "N/A"}</Typography>
          </Box>
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
    fetchLeadData();
  }, []);

  const fetchLeadData = useCallback(() => {
    setLoading(true);
    axios
      .get(`${commonData?.APIKEY}/getLead`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setRowData(res.data.Result);
        } else {
          alert("Error loading leads data");
        }
      })
      .catch((err) => {
        console.log(err);
        alert("Error loading leads data");
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

  const handleDeleteClick = (lead) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (leadToDelete) {
      axios
        .delete(`${commonData?.APIKEY}/lead/delete/` + leadToDelete.id)
        .then((res) => {
          if (res.data.Status === "Success") {
            setDeleteDialogOpen(false);
            setLeadToDelete(null);
            setSelectedRows([]);
            fetchLeadData();
          } else {
            alert("Error deleting lead");
          }
        })
        .catch((err) => {
          console.log(err);
          alert("Error deleting lead");
        });
    }
  };

  const onSelectionChanged = useCallback((event) => {
    const selectedItems = event.api.getSelectedRows();
    setSelectedRows(selectedItems);
  }, []);

  const handleBulkDelete = () => {
    if (selectedRows.length > 0) {
      setLeadToDelete(selectedRows[0]);
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
              Team Lead Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and view all team leads in your organization
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchLeadData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate("/Dashboard/addLead")}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                },
              }}
            >
              Add Lead
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
            placeholder="Search leads..."
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
            Are you sure you want to delete lead{" "}
            <strong>{leadToDelete?.leadName}</strong> (Team: {leadToDelete?.teamName})?
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

export default Leads;
