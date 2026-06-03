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
  CheckCircle,
  Cancel,
  Business,
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
import { getDisplayEmployeeId } from "../utils/employeeId";
import { useTranslation } from "react-i18next";

function Employee({ from }) {
  const { t } = useTranslation();
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
    if (from === "hr") {
      navigate(`/Hr/create/${id}`);
    } else {
      navigate(`/Dashboard/create/${id}`);
    }
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
        headerName: t("employeeMgmt.employeeName", { defaultValue: "Employee Name" }),
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
        headerName: t("employeeMgmt.employeeId", { defaultValue: "Employee ID" }),
        minWidth: 120,
        valueGetter: (params) => getDisplayEmployeeId(params.data),
        cellRenderer: (params) => (
          <Chip label={params.value} size="small" color="primary" variant="outlined" />
        ),
      },
      {
        field: "employeeEmail",
        headerName: t("employeeMgmt.email", { defaultValue: "Email" }),
        minWidth: 200,
        cellRenderer: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Email sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="body2">{params.value}</Typography>
          </Box>
        ),
      },
      {
        field: "company_login_status",
        headerName: t("employeeMgmt.companyLogin", { defaultValue: "Company login" }),
        headerTooltip:
          t("employeeMgmt.companyLoginTooltip", {
            defaultValue:
              "Matches Super Admin → Company profile logins. Approved = email is on that list; Not registered = not on list.",
          }),
        minWidth: 210,
        cellRenderer: (params) => {
          const s = params.data?.company_login_status;
          if (s == null) {
            return (
              <Typography variant="body2" color="text.secondary">
                —
              </Typography>
            );
          }
          if (s === "approved_super_admin") {
            return (
              <Tooltip
                title={t("employeeMgmt.companyLoginApprovedSuperAdminTooltip", {
                  defaultValue: "On company login list (first account / Super Admin setup)",
                })}
              >
                <Chip
                  icon={<CheckCircle sx={{ fontSize: 16 }} />}
                  label={t("employeeMgmt.approved", { defaultValue: "Approved" })}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              </Tooltip>
            );
          }
          if (s === "approved_company") {
            return (
              <Tooltip
                title={t("employeeMgmt.companyLoginApprovedCompanyTooltip", {
                  defaultValue: "On company login list (added from company admin)",
                })}
              >
                <Chip
                  icon={<Business sx={{ fontSize: 16 }} />}
                  label={t("employeeMgmt.approved", { defaultValue: "Approved" })}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              </Tooltip>
            );
          }
          if (s === "inactive") {
            return (
              <Tooltip
                title={t("employeeMgmt.companyLoginInactiveTooltip", {
                  defaultValue: "Email is on the list but company login is disabled",
                })}
              >
                <Chip
                  icon={<Cancel sx={{ fontSize: 16 }} />}
                  label={t("employeeMgmt.loginDisabled", { defaultValue: "Login disabled" })}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              </Tooltip>
            );
          }
          return (
            <Tooltip
              title={t("employeeMgmt.companyLoginNotRegisteredTooltip", {
                defaultValue:
                  "Employee email is not in Super Admin company profile logins for this company",
              })}
            >
              <Chip label={t("employeeMgmt.notRegistered", { defaultValue: "Not registered" })} size="small" variant="outlined" />
            </Tooltip>
          );
        },
      },
      {
        field: "userName",
        headerName: t("employeeMgmt.username", { defaultValue: "Username" }),
        minWidth: 120,
      },
      {
        field: "role",
        headerName: t("employeeMgmt.role", { defaultValue: "Role" }),
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
        headerName: t("employeeMgmt.designation", { defaultValue: "Designation" }),
        minWidth: 150,
        cellRenderer: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Work sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="body2">{params.value || t("common.na", { defaultValue: "N/A" })}</Typography>
          </Box>
        ),
      },
      {
        field: "date",
        headerName: t("employeeMgmt.joinDate", { defaultValue: "Join Date" }),
        minWidth: 120,
        cellRenderer: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <CalendarToday sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="body2">
              {params.value ? new Date(params.value).toLocaleDateString() : t("common.na", { defaultValue: "N/A" })}
            </Typography>
          </Box>
        ),
      },
      {
        field: "relievingDate",
        headerName: t("employeeMgmt.relievingDate", { defaultValue: "Relieving Date" }),
        minWidth: 140,
        cellRenderer: (params) => (
          <Typography variant="body2">
            {params.value ? new Date(params.value).toLocaleDateString() : t("common.na", { defaultValue: "N/A" })}
          </Typography>
        ),
      },
      {
        field: "permanentDate",
        headerName: t("employeeMgmt.permanentDate", { defaultValue: "Permanent Date" }),
        minWidth: 140,
        cellRenderer: (params) => (
          <Typography variant="body2">
            {params.value ? new Date(params.value).toLocaleDateString() : t("common.na", { defaultValue: "N/A" })}
          </Typography>
        ),
      },
      {
        field: "actions",
        headerName: t("employeeMgmt.actions", { defaultValue: "Actions" }),
        minWidth: 120,
        filter: false,
        sortable: false,
        cellRenderer: (params) => {
          return (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title={t("employeeMgmt.editEmployee", { defaultValue: "Edit Employee" })}>
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
              <Tooltip title={t("employeeMgmt.deleteEmployee", { defaultValue: "Delete Employee" })}>
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
    [t]
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
    return <Loading message={t("employeeMgmt.loadingEmployees", { defaultValue: "Loading employees..." })} />;
  }

  return (
    <Box >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {t("employeeMgmt.title", { defaultValue: "Employee Management" })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("employeeMgmt.subtitle", { defaultValue: "Manage and view all employees in your organization" })}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refetch}
              disabled={loading}
            >
              {t("common.refresh", { defaultValue: "Refresh" })}
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                if (from === "hr") {
                  navigate("/Hr/create");
                } else {
                  navigate("/Dashboard/create");
                }
              }}
              sx={{
                background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
                },
              }}
            >
              {t("employeeMgmt.addEmployee", { defaultValue: "Add Employee" })}
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
            placeholder={t("employeeMgmt.searchPlaceholder", { defaultValue: "Search employees..." })}
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
                label={t("common.selectedCount", { defaultValue: "{{count}} selected", count: selectedRows.length })}
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
                {t("employeeMgmt.deleteSelected", { defaultValue: "Delete Selected" })}
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
            <Typography variant="h6">
              {t("employeeMgmt.confirmDelete", { defaultValue: "Confirm Delete" })}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("employeeMgmt.deleteConfirmText", {
              defaultValue:
                "Are you sure you want to delete employee {{name}} (ID: {{id}})? This action cannot be undone.",
              name: employeeToDelete?.employeeName || "",
              id: employeeToDelete ? getDisplayEmployeeId(employeeToDelete) : "",
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={<Delete />}
          >
            {deleting
              ? t("employeeMgmt.deleting", { defaultValue: "Deleting..." })
              : t("employeeMgmt.delete", { defaultValue: "Delete" })}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Employee;
