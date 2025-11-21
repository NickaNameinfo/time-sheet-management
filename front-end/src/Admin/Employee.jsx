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
  Person,
  Email,
  Badge,
  Work,
  CalendarToday,
  Refresh,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { apiService } from "../services/api";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

function Employee() {
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [gridApi, setGridApi] = useState(null);

  const { data: employees, loading, error, refetch } = useApi(apiService.getEmployees);
  const { mutate: deleteEmployee, loading: deleting } = useMutation(apiService.deleteEmployee);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (gridApi) {
        if (searchText) {
          gridApi.setQuickFilter(searchText);
        } else {
          gridApi.setQuickFilter("");
        }
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchText, gridApi]);

  const onClickEdit = (id) => {
    navigate(`/Dashboard/create/${id}`);
  };

  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (employeeToDelete) {
      const result = await deleteEmployee(employeeToDelete.id);
      if (result.success) {
        setDeleteDialogOpen(false);
        setEmployeeToDelete(null);
        setSelectedRows([]);
        refetch();
      }
    }
  };

  const columnDefs = useMemo(
    () => [
      {
        field: "employeeName",
        headerName: "Employee Name",
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
        field: "EMPID",
        headerName: "Employee ID",
        minWidth: 120,
        cellRenderer: (params) => (
          <Chip label={params.value} size="small" color="primary" variant="outlined" />
        ),
      },
      {
        field: "employeeEmail",
        headerName: "Email",
        minWidth: 200,
        cellRenderer: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Email sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="body2">{params.value}</Typography>
          </Box>
        ),
      },
      {
        field: "userName",
        headerName: "Username",
        minWidth: 120,
      },
      {
        field: "role",
        headerName: "Role",
        minWidth: 120,
        cellRenderer: (params) => {
          const roleColors = {
            Admin: "error",
            HR: "warning",
            TL: "info",
            Employee: "success",
          };
          return (
            <Chip
              label={params.value}
              size="small"
              color={roleColors[params.value] || "default"}
              sx={{ fontWeight: 500 }}
            />
          );
        },
      },
      {
        field: "designation",
        headerName: "Designation",
        minWidth: 150,
        cellRenderer: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Work sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="body2">{params.value || "N/A"}</Typography>
          </Box>
        ),
      },
      {
        field: "discipline",
        headerName: "Discipline",
        minWidth: 120,
      },
      {
        field: "employeeStatus",
        headerName: "Status",
        minWidth: 120,
        cellRenderer: (params) => {
          const status = params.value?.toLowerCase();
          const isActive = status === "active" || status === "1";
          return (
            <Chip
              label={isActive ? "Active" : "Inactive"}
              size="small"
              color={isActive ? "success" : "default"}
              variant={isActive ? "filled" : "outlined"}
            />
          );
        },
      },
      {
        field: "date",
        headerName: "Join Date",
        minWidth: 120,
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
        field: "relievingDate",
        headerName: "Relieving Date",
        minWidth: 140,
        cellRenderer: (params) => (
          <Typography variant="body2">
            {params.value ? new Date(params.value).toLocaleDateString() : "N/A"}
          </Typography>
        ),
      },
      {
        field: "permanentDate",
        headerName: "Permanent Date",
        minWidth: 140,
        cellRenderer: (params) => (
          <Typography variant="body2">
            {params.value ? new Date(params.value).toLocaleDateString() : "N/A"}
          </Typography>
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
              <Tooltip title="Edit Employee">
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
              <Tooltip title="Delete Employee">
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
  }, []);

  const onSelectionChanged = useCallback((event) => {
    const selectedItems = event.api.getSelectedRows();
    setSelectedRows(selectedItems);
  }, []);

  const handleBulkDelete = () => {
    if (selectedRows.length > 0) {
      setEmployeeToDelete(selectedRows[0]);
      setDeleteDialogOpen(true);
    }
  };

  if (loading) {
    return <Loading message="Loading employees..." />;
  }

  return (
    <Box >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Employee Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and view all employees in your organization
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refetch}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate("/Dashboard/create")}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                },
              }}
            >
              Add Employee
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
            placeholder="Search employees..."
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

      {error && (
        <ErrorMessage 
          error={error} 
          onRetry={refetch}
        />
      )}

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
              rowData={employees || []}
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
            Are you sure you want to delete employee{" "}
            <strong>{employeeToDelete?.employeeName}</strong> (ID: {employeeToDelete?.EMPID})?
            <br />
            <br />
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={<Delete />}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Employee;
