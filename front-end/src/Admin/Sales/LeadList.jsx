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
  Paper,
  TextField,
  InputAdornment,
  Stack,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Add, Delete, Search, Refresh, Edit } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { apiService } from "../../services/api.js";

const COMPANY_SIZE_OPTIONS = ["1–50", "51–200", "201–500", "501–1000", "1000+"];

function LeadList() {
  const navigate = useNavigate();
  const [rowData, setRowData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [gridApi, setGridApi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [companySizeOptions, setCompanySizeOptions] = useState(COMPANY_SIZE_OPTIONS);
  const [form, setForm] = useState({
    fullName: "",
    workEmail: "",
    companyName: "",
    companySize: "",
    phoneNumber: "",
  });
  const [formError, setFormError] = useState("");

  const columnDefs = useMemo(
    () => [
      {
        field: "full_name",
        headerName: "Full Name",
        minWidth: 160,
        flex: 1,
        checkboxSelection: true,
        headerCheckboxSelection: true,
      },
      {
        field: "work_email",
        headerName: "Work Email",
        minWidth: 200,
      },
      {
        field: "company_name",
        headerName: "Company Name",
        minWidth: 180,
      },
      {
        field: "company_size",
        headerName: "Company Size",
        minWidth: 120,
      },
      {
        field: "phone_number",
        headerName: "Phone Number",
        minWidth: 140,
      },
      {
        field: "createdAt",
        headerName: "Created",
        minWidth: 150,
        cellRenderer: (params) => {
          if (!params.value) return "-";
          return new Date(params.value).toLocaleString();
        },
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

  const fetchLeadList = async () => {
    setLoading(true);
    try {
      const response = await apiService.getLeadList({});
      if (response.data.Status === "Success") {
        setRowData(response.data.Result || []);
      } else {
        alert(response.data.Error || "Error loading lead list");
      }
    } catch (error) {
      console.error("Error fetching lead list:", error);
      alert(error.response?.data?.Error || "Error loading lead list");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanySizeOptions = async () => {
    try {
      const res = await apiService.getCompanySizeOptions();
      if (res.data.Status === "Success" && res.data.Result?.length) {
        setCompanySizeOptions(res.data.Result);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchLeadList();
    fetchCompanySizeOptions();
  }, []);

  const resetForm = () => {
    setForm({
      fullName: "",
      workEmail: "",
      companyName: "",
      companySize: "",
      phoneNumber: "",
    });
    setFormError("");
    setEditingLead(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  const handleOpenEdit = (lead) => {
    setEditingLead(lead);
    setForm({
      fullName: lead.full_name || "",
      workEmail: lead.work_email || "",
      companyName: lead.company_name || "",
      companySize: lead.company_size || "",
      phoneNumber: lead.phone_number || "",
    });
    setFormError("");
    setEditDialogOpen(true);
  };

  const validateForm = () => {
    if (!form.fullName?.trim()) {
      setFormError("Full Name is required");
      return false;
    }
    if (!form.workEmail?.trim()) {
      setFormError("Work Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.workEmail.trim())) {
      setFormError("Please enter a valid work email");
      return false;
    }
    if (!form.companyName?.trim()) {
      setFormError("Company Name is required");
      return false;
    }
    setFormError("");
    return true;
  };

  const handleSubmitAdd = async () => {
    if (!validateForm()) return;
    try {
      const response = await apiService.createLead({
        fullName: form.fullName.trim(),
        workEmail: form.workEmail.trim(),
        companyName: form.companyName.trim(),
        companySize: form.companySize || undefined,
        phoneNumber: form.phoneNumber?.trim() || undefined,
      });
      if (response.data.Status === "Success") {
        setAddDialogOpen(false);
        resetForm();
        fetchLeadList();
      } else {
        setFormError(response.data.Error || "Failed to add lead");
      }
    } catch (error) {
      setFormError(error.response?.data?.Error || "Failed to add lead");
    }
  };

  const handleSubmitEdit = async () => {
    if (!validateForm() || !editingLead?.id) return;
    try {
      const response = await apiService.updateLead(editingLead.id, {
        fullName: form.fullName.trim(),
        workEmail: form.workEmail.trim(),
        companyName: form.companyName.trim(),
        companySize: form.companySize || undefined,
        phoneNumber: form.phoneNumber?.trim() || undefined,
      });
      if (response.data.Status === "Success") {
        setEditDialogOpen(false);
        resetForm();
        fetchLeadList();
      } else {
        setFormError(response.data.Error || "Failed to update lead");
      }
    } catch (error) {
      setFormError(error.response?.data?.Error || "Failed to update lead");
    }
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  };

  const onSelectionChanged = (event) => {
    setSelectedRows(event.api.getSelectedRows());
  };

  const handleDeleteClick = (lead) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;
    try {
      const response = await apiService.deleteLead(leadToDelete.id);
      if (response.data.Status === "Success") {
        fetchLeadList();
      } else {
        alert(response.data.Error || "Failed to delete lead");
      }
    } catch (error) {
      alert(error.response?.data?.Error || "Failed to delete lead");
    } finally {
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
    }
  };

  useEffect(() => {
    if (gridApi) {
      const t = setTimeout(() => {
        gridApi.setQuickFilter(searchText || "");
      }, 300);
      return () => clearTimeout(t);
    }
  }, [searchText, gridApi]);

  const renderFormFields = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Full Name"
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          required
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Work Email"
          type="email"
          placeholder="e.g. name@company.ae"
          value={form.workEmail}
          onChange={(e) => setForm((f) => ({ ...f, workEmail: e.target.value }))}
          required
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Company Name"
          value={form.companyName}
          onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
          required
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Company Size</InputLabel>
          <Select
            value={form.companySize}
            label="Company Size"
            onChange={(e) => setForm((f) => ({ ...f, companySize: e.target.value }))}
          >
            <MenuItem value="">Select</MenuItem>
            {companySizeOptions.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Phone Number"
          value={form.phoneNumber}
          onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
        />
      </Grid>
      {formError && (
        <Grid item xs={12}>
          <Typography color="error" variant="body2">
            {formError}
          </Typography>
        </Grid>
      )}
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Lead List
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Demo requests and leads (Full Name, Work Email, Company, Size, Phone)
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenAdd}
            sx={{
              background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
              "&:hover": { background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)" },
            }}
          >
            Add Lead
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchLeadList}>
            Refresh
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by name, email, company..."
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
      </Paper>

      {selectedRows.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: "primary.light", color: "white" }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography>{selectedRows.length} selected</Typography>
            <Button
              variant="contained"
              color="error"
              startIcon={<Delete />}
              onClick={() => selectedRows.length === 1 && handleDeleteClick(selectedRows[0])}
            >
              Delete Selected
            </Button>
          </Stack>
        </Paper>
      )}

      <Card>
        <CardContent>
          <div className="ag-theme-alpine" style={{ height: "600px", width: "100%" }}>
            <AgGridReact
              columnDefs={columnDefs}
              rowData={rowData}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              onSelectionChanged={onSelectionChanged}
              rowSelection="multiple"
              animateRows
              loading={loading}
              pagination
              paginationPageSize={25}
              paginationPageSizeSelector={[10, 25, 50, 100]}
              onCellClicked={(e) => {
                if (e.colDef?.field && e.event?.detail === 2) handleOpenEdit(e.data);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Lead (Book a Demo)</DialogTitle>
        <DialogContent>
          {renderFormFields()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitAdd} color="primary">
            Add Lead
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Lead</DialogTitle>
        <DialogContent>
          {renderFormFields()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitEdit} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Lead</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete lead for <strong>{leadToDelete?.full_name}</strong> ({leadToDelete?.work_email})? This cannot be undone.
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

export default LeadList;
