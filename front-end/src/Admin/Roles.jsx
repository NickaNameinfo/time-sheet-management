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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
} from "@mui/material";
import {
  Add,
  Delete,
  Search,
  Refresh,
  Close,
  Badge,
  Edit,
} from "@mui/icons-material";
import { apiService } from "../services/api";
import { useApi, useMutation } from "../hooks/useApi";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const roleColors = [
  { value: "default", label: "Default" },
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "success", label: "Success" },
  { value: "error", label: "Error" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
];

export const Roles = () => {
  const [rowData, setRowData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [roleToEdit, setRoleToEdit] = useState(null);
  const [modalValue, setModalValue] = useState({
    role_name: "",
    role_display_name: "",
    role_color: "default",
    display_order: 0,
    is_active: true,
  });
  const [searchText, setSearchText] = useState("");
  const [gridApi, setGridApi] = useState(null);

  const { data: rolesData, loading, refetch } = useApi(
    () => apiService.getRoles(),
    []
  );

  const { mutate: createRole, loading: creating } = useMutation(apiService.createRole);
  const { mutate: updateRole, loading: updating } = useMutation((data) =>
    apiService.updateRole(roleToEdit?.id, data)
  );
  const { mutate: deleteRole, loading: deleting } = useMutation((id) =>
    apiService.deleteRole(id)
  );

  useEffect(() => {
    if (rolesData) {
      const data = Array.isArray(rolesData) ? rolesData : rolesData?.Result || [];
      setRowData(data);
    }
  }, [rolesData]);

  const columnDefs = useMemo(
    () => [
      {
        field: "role_name",
        headerName: "Role Name",
        minWidth: 150,
        checkboxSelection: true,
        cellRenderer: (params) => {
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
              <Badge color="primary" sx={{ fontSize: 20 }} />
              <Typography variant="body2" fontWeight="medium">
                {params.value || "N/A"}
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "role_display_name",
        headerName: "Display Name",
        minWidth: 180,
        cellRenderer: (params) => {
          return (
            <Typography variant="body2" fontWeight="medium">
              {params.value || params.data.role_name || "N/A"}
            </Typography>
          );
        },
      },
      {
        field: "role_color",
        headerName: "Color",
        minWidth: 120,
        cellRenderer: (params) => {
          const color = params.value || "default";
          return (
            <Chip
              label={color}
              color={color}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          );
        },
      },
      {
        field: "display_order",
        headerName: "Order",
        minWidth: 100,
        cellRenderer: (params) => {
          return (
            <Typography variant="body2" color="text.secondary">
              {params.value || 0}
            </Typography>
          );
        },
      },
      {
        field: "is_active",
        headerName: "Status",
        minWidth: 100,
        cellRenderer: (params) => {
          return (
            <Chip
              label={params.value ? "Active" : "Inactive"}
              color={params.value ? "success" : "default"}
              size="small"
            />
          );
        },
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
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleEditClick(params.data)}
                sx={{
                  "&:hover": {
                    bgcolor: "primary.light",
                    color: "white",
                  },
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
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

  const handleDeleteClick = (role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (roleToDelete) {
      try {
        const result = await deleteRole(roleToDelete.id);
        if (result.success) {
          setDeleteDialogOpen(false);
          setRoleToDelete(null);
          setSelectedRows([]);
          refetch();
        } else {
          alert(result.error || "Error deleting role");
        }
      } catch (error) {
        alert(error.message || "Error deleting role");
      }
    }
  };

  const handleEditClick = (role) => {
    setRoleToEdit(role);
    setModalValue({
      role_name: role.role_name || "",
      role_display_name: role.role_display_name || role.role_name || "",
      role_color: role.role_color || "default",
      display_order: role.display_order || 0,
      is_active: role.is_active !== undefined ? role.is_active : true,
    });
    setEditDialogOpen(true);
  };

  const handleAddClick = () => {
    setRoleToEdit(null);
    setModalValue({
      role_name: "",
      role_display_name: "",
      role_color: "default",
      display_order: 0,
      is_active: true,
    });
    setAddDialogOpen(true);
  };

  const handleSave = async () => {
    if (!modalValue.role_name || !modalValue.role_name.trim()) {
      alert("Please enter a role name");
      return;
    }
    if (!modalValue.role_display_name || !modalValue.role_display_name.trim()) {
      alert("Please enter a display name");
      return;
    }

    try {
      const result = roleToEdit
        ? await updateRole(modalValue)
        : await createRole(modalValue);

      if (result.success) {
        setAddDialogOpen(false);
        setEditDialogOpen(false);
        setModalValue({
          role_name: "",
          role_display_name: "",
          role_color: "default",
          display_order: 0,
          is_active: true,
        });
        setRoleToEdit(null);
        refetch();
      } else {
        alert(result.error || "Error saving role");
      }
    } catch (error) {
      alert(error.message || "Error saving role");
    }
  };

  const onSelectionChanged = useCallback((event) => {
    const selectedItems = event.api.getSelectedRows();
    setSelectedRows(selectedItems);
  }, []);

  const handleBulkDelete = () => {
    if (selectedRows.length > 0) {
      setRoleToDelete(selectedRows[0]);
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
              Role Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and configure employee roles in your organization
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
              onClick={handleAddClick}
              sx={{
                background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
                },
              }}
            >
              Add Role
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
            placeholder="Search roles..."
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

      {/* Add/Edit Role Dialog */}
      <Dialog
        fullWidth
        open={addDialogOpen || editDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setEditDialogOpen(false);
          setModalValue({
            role_name: "",
            role_display_name: "",
            role_color: "default",
            display_order: 0,
            is_active: true,
          });
          setRoleToEdit(null);
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
            <Typography variant="h6">
              {roleToEdit ? "Edit Role" : "Add Role"}
            </Typography>
            <IconButton
              onClick={() => {
                setAddDialogOpen(false);
                setEditDialogOpen(false);
                setModalValue({
                  role_name: "",
                  role_display_name: "",
                  role_color: "default",
                  display_order: 0,
                  is_active: true,
                });
                setRoleToEdit(null);
              }}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Role Name"
                  variant="outlined"
                  value={modalValue.role_name}
                  onChange={(e) => {
                    setModalValue({ ...modalValue, role_name: e.target.value });
                  }}
                  placeholder="e.g., Employee, TL, HR, Admin"
                  disabled={!!roleToEdit}
                  helperText={roleToEdit ? "Role name cannot be changed" : "Unique identifier for the role"}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Display Name"
                  variant="outlined"
                  value={modalValue.role_display_name}
                  onChange={(e) => {
                    setModalValue({ ...modalValue, role_display_name: e.target.value });
                  }}
                  placeholder="e.g., Team Lead, Human Resources"
                  helperText="Name shown to users"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Color</InputLabel>
                  <Select
                    value={modalValue.role_color}
                    label="Color"
                    onChange={(e) => {
                      setModalValue({ ...modalValue, role_color: e.target.value });
                    }}
                  >
                    {roleColors.map((color) => (
                      <MenuItem key={color.value} value={color.value}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Chip
                            label={color.label}
                            color={color.value}
                            size="small"
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Display Order"
                  type="number"
                  variant="outlined"
                  value={modalValue.display_order}
                  onChange={(e) => {
                    setModalValue({ ...modalValue, display_order: parseInt(e.target.value) || 0 });
                  }}
                  helperText="Lower numbers appear first"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={modalValue.is_active}
                      onChange={(e) => {
                        setModalValue({ ...modalValue, is_active: e.target.checked });
                      }}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setAddDialogOpen(false);
              setEditDialogOpen(false);
              setModalValue({
                role_name: "",
                role_display_name: "",
                role_color: "default",
                display_order: 0,
                is_active: true,
              });
              setRoleToEdit(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<Add />}
            disabled={creating || updating}
            sx={{
              background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
              },
            }}
          >
            {creating || updating ? "Saving..." : roleToEdit ? "Update" : "Add"}
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
            Are you sure you want to delete role{" "}
            <strong>{roleToDelete?.role_display_name || roleToDelete?.role_name}</strong>?
            <br />
            <br />
            This action cannot be undone. Employees with this role may need to be reassigned.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            startIcon={<Delete />}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
