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
import { useAuth } from "../../context/AuthContext";

/** Same order/labels as Add CRM Date status dropdown */
const CRM_STATUS_ORDER = [
  "New",
  "Attended",
  "Follow Up",
  "Not Attended",
  "Details Pending",
  "Rescheduled",
  "Message Send",
  "Product Provided",
  "Not Interest",
  "Registered Pending",
  "Pending Product Update",
  "Online Order Enable Pending",
  "Need Other Service",
  "Service Provider",
];

const CRM_STATUS_COLORS = {
  New: "#2196F3",
  Attended: "#4CAF50",
  "Follow Up": "#00897B",
  "Not Attended": "#78909C",
  "Details Pending": "#FB8C00",
  Rescheduled: "#FF9800",
  "Message Send": "#9C27B0",
  "Product Provided": "#00ACC1",
  "Not Interest": "#F44336",
  "Registered Pending": "#7E57C2",
  "Pending Product Update": "#5C6BC0",
  "Online Order Enable Pending": "#26A69A",
  "Need Other Service": "#FF5722",
  "Service Provider": "#6D4C41",
};

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
  // For company portal, JWT role is always "admin" — don't treat company users as Admin/TL here.
  const canFilterByEmployee =
    !user?.isCompanyUser &&
    (user?.role?.toLowerCase() === "admin" ||
      user?.role?.toLowerCase() === "tl" ||
      user?.role?.toLowerCase() === "teamlead");

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
        field: "lead_from",
        headerName: "From",
        minWidth: 140,
        valueFormatter: (p) => p.value || "-",
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: 150,
        cellRenderer: (params) => {
          if (!params.value) return "-";
          const key = CRM_STATUS_ORDER.find(
            (s) => s.toLowerCase() === String(params.value).trim().toLowerCase()
          );
          const color = (key && CRM_STATUS_COLORS[key]) || "#757575";
          const label = key || params.value;
          return (
            <Chip
              label={label}
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

  const statusSummary = useMemo(() => {
    const counts = Object.fromEntries(CRM_STATUS_ORDER.map((s) => [s, 0]));
    let blank = 0;
    let other = 0;
    for (const row of rowData) {
      const raw = row?.status;
      if (raw == null || String(raw).trim() === "") {
        blank += 1;
        continue;
      }
      const key = CRM_STATUS_ORDER.find(
        (s) => s.toLowerCase() === String(raw).trim().toLowerCase()
      );
      if (key) counts[key] += 1;
      else other += 1;
    }
    return { counts, blank, other, total: rowData.length };
  }, [rowData]);

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
              background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
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

      {/* Status summary (counts match CRM form dropdown) */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Status summary
          </Typography>
          <Chip
            size="small"
            label={`Total records: ${statusSummary.total}`}
            color="primary"
            variant="outlined"
          />
        </Stack>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            alignItems: "stretch",
          }}
        >
          {CRM_STATUS_ORDER.map((status) => {
            const n = statusSummary.counts[status] ?? 0;
            const color = CRM_STATUS_COLORS[status] || "#757575";
            return (
              <Paper
                key={status}
                variant="outlined"
                sx={{
                  px: 1.5,
                  py: 1,
                  minWidth: { xs: "calc(50% - 8px)", sm: 140 },
                  flex: { xs: "1 1 calc(50% - 8px)", md: "0 1 auto" },
                  borderLeft: 3,
                  borderColor: color,
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block" noWrap title={status}>
                  {status}
                </Typography>
                <Typography variant="h6" fontWeight={800}>
                  {n}
                </Typography>
              </Paper>
            );
          })}
          {statusSummary.blank > 0 ? (
            <Paper
              variant="outlined"
              sx={{
                px: 1.5,
                py: 1,
                minWidth: { xs: "calc(50% - 8px)", sm: 140 },
                flex: { xs: "1 1 calc(50% - 8px)", md: "0 1 auto" },
                borderLeft: 3,
                borderColor: "#9E9E9E",
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block" noWrap>
                No status
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {statusSummary.blank}
              </Typography>
            </Paper>
          ) : null}
          {statusSummary.other > 0 ? (
            <Paper
              variant="outlined"
              sx={{
                px: 1.5,
                py: 1,
                minWidth: { xs: "calc(50% - 8px)", sm: 140 },
                flex: { xs: "1 1 calc(50% - 8px)", md: "0 1 auto" },
                borderLeft: 3,
                borderColor: "#607D8B",
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block" noWrap>
                Other
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {statusSummary.other}
              </Typography>
            </Paper>
          ) : null}
        </Box>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={canFilterByEmployee ? 8 : 12}>
            <TextField
              fullWidth
              placeholder="Search by client name, contact person, email, location, or from..."
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
              pagination={true}
              paginationPageSize={25}
              paginationPageSizeSelector={[10, 25, 50, 100]}
              suppressPaginationPanel={false}
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

