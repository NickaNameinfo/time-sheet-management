import React, { useEffect, useState, useMemo } from "react";
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
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import {
  Add,
  Delete,
  Search,
  Refresh,
  Edit,
  Visibility,
  CalendarToday,
  Business,
  Person,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { apiService } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

function CrmList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rowData, setRowData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [crmToDelete, setCrmToDelete] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [gridApi, setGridApi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  
  // Check if user is Admin or TL (can filter by employee)
  const canFilterByEmployee = user?.role?.toLowerCase() === 'admin' || 
                              user?.role?.toLowerCase() === 'tl' || 
                              user?.role?.toLowerCase() === 'teamlead';

  const columnDefs = useMemo(
    () => [
      {
        field: "crmDate",
        headerName: "CRM Date",
        minWidth: 150,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        cellRenderer: (params) => {
          if (!params.value) return "-";
          const date = new Date(params.value);
          return date.toLocaleDateString();
        },
      },
      {
        field: "clientName",
        headerName: "Client Name",
        minWidth: 200,
        flex: 1,
      },
      {
        field: "contactPerson",
        headerName: "Contact Person",
        minWidth: 150,
      },
      {
        field: "phone",
        headerName: "Phone",
        minWidth: 120,
      },
      {
        field: "email",
        headerName: "Email",
        minWidth: 200,
      },
      {
        field: "location",
        headerName: "Location",
        minWidth: 150,
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: 150,
        cellRenderer: (params) => {
          if (!params.value) return "-";
          const statusColors = {
            "New": "#2196F3",
            "Attended": "#4CAF50",
            "Rescheduled": "#FF9800",
            "Message Send": "#9C27B0",
            "Converted": "#00BCD4",
            "Not Interest": "#F44336",
            "Need Other Service": "#FF5722",
          };
          const color = statusColors[params.value] || "#757575";
          return (
            <Chip
              label={params.value}
              size="small"
              sx={{
                backgroundColor: `${color}20`,
                color: color,
                fontWeight: "bold",
                border: `1px solid ${color}40`,
              }}
            />
          );
        },
      },
      {
        field: "scheduleDate",
        headerName: "Schedule Date",
        minWidth: 150,
        cellRenderer: (params) => {
          if (!params.value) return "-";
          const date = new Date(params.value);
          return date.toLocaleDateString();
        },
      },
      {
        field: "createdByName",
        headerName: "Created By",
        minWidth: 150,
        cellRenderer: (params) => {
          if (!params.value) return "-";
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Person fontSize="small" color="action" />
              <Typography variant="body2">{params.value}</Typography>
            </Box>
          );
        },
      },
      {
        field: "createdAt",
        headerName: "Created At",
        minWidth: 150,
        cellRenderer: (params) => {
          if (!params.value) return "-";
          const date = new Date(params.value);
          return date.toLocaleDateString();
        },
      },
      {
        headerName: "Actions",
        minWidth: 120,
        cellRenderer: (params) => (
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleView(params.data)}
            >
              <Visibility fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleEdit(params.data)}
            >
              <Edit fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteClick(params.data)}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        ),
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter: true,
    }),
    []
  );

  useEffect(() => {
    if (canFilterByEmployee) {
      fetchEmployees();
    }
    fetchCrmList();
  }, [selectedEmployeeId]);

  const fetchEmployees = async () => {
    try {
      const response = await apiService.getEmployees();
      if (response.data.Status === "Success") {
        setEmployees(response.data.Result || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchCrmList = async () => {
    setLoading(true);
    try {
      const params = {};
      if (canFilterByEmployee && selectedEmployeeId) {
        params.employeeId = selectedEmployeeId;
      }
      const response = await apiService.getCrmList(params);
      if (response.data.Status === "Success") {
        setRowData(response.data.Result || []);
      } else {
        alert(response.data.Error || "Error loading CRM list");
      }
    } catch (error) {
      console.error("Error fetching CRM list:", error);
      alert(error.response?.data?.Error || "Error loading CRM list");
    } finally {
      setLoading(false);
    }
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  };

  const onSelectionChanged = (event) => {
    const selectedItems = event.api.getSelectedRows();
    setSelectedRows(selectedItems);
  };

  const handleDeleteClick = (crm) => {
    setCrmToDelete(crm);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!crmToDelete) return;

    try {
      const response = await apiService.deleteCrm(crmToDelete.id);
      
      if (response.data.Status === "Success") {
        alert("CRM entry deleted successfully");
        fetchCrmList();
      } else {
        alert(response.data.Error || "Failed to delete CRM entry");
      }
    } catch (error) {
      console.error("Error deleting CRM:", error);
      alert(error.response?.data?.Error || "Error deleting CRM entry");
    } finally {
      setDeleteDialogOpen(false);
      setCrmToDelete(null);
    }
  };

  const handleView = (crm) => {
    // Navigate to view/details page or show in dialog
    console.log("View CRM:", crm);
  };

  const handleEdit = (crm) => {
    navigate(`/Dashboard/Sales/AddCrmDate/${crm.id}`);
  };

  useEffect(() => {
    if (gridApi) {
      const timeoutId = setTimeout(() => {
        if (searchText) {
          gridApi.setQuickFilter(searchText);
        } else {
          gridApi.setQuickFilter("");
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchText, gridApi]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            CRM List
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage all CRM entries and dates
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate("/Dashboard/Sales/AddCrmDate")}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            Add CRM Date
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchCrmList}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={canFilterByEmployee ? 8 : 12}>
            <TextField
              fullWidth
              placeholder="Search by client name, contact person, email, or location..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          {canFilterByEmployee && (
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Employee</InputLabel>
                <Select
                  value={selectedEmployeeId}
                  label="Filter by Employee"
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                >
                  <MenuItem value="">All Employees</MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.employeeName} ({emp.EMPID})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Actions Bar */}
      {selectedRows.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: "primary.light", color: "white" }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography>
              {selectedRows.length} item(s) selected
            </Typography>
            <Button
              variant="contained"
              color="error"
              startIcon={<Delete />}
              onClick={() => {
                if (selectedRows.length === 1) {
                  handleDeleteClick(selectedRows[0]);
                } else {
                  alert("Please delete items one at a time");
                }
              }}
            >
              Delete Selected
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Grid */}
      <Card>
        <CardContent>
          <div
            className="ag-theme-alpine"
            style={{ height: "600px", width: "100%" }}
          >
            <AgGridReact
              columnDefs={columnDefs}
              rowData={rowData}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              onSelectionChanged={onSelectionChanged}
              rowSelection="multiple"
              animateRows={true}
              loading={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete CRM Entry</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the CRM entry for{" "}
            <strong>{crmToDelete?.clientName}</strong> dated{" "}
            {crmToDelete?.crmDate
              ? new Date(crmToDelete.crmDate).toLocaleDateString()
              : "N/A"}
            ? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CrmList;

