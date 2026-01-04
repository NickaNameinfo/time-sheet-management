import React, { useState, useEffect } from "react";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import { apiService } from "../services/api";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  Chip,
  Grid,
  Stack,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Refresh,
  Close,
  Business,
  AttachMoney,
  Receipt,
  Person,
  Email,
  Phone,
  CheckCircle,
  LocationOn,
  Public,
  Badge,
  Edit,
  Delete,
} from "@mui/icons-material";
import ErrorMessage from "./ErrorMessage";
import Loading from "./Loading";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const BillingManagement = () => {
  const [tabValue, setTabValue] = useState(0);
  const [clientDialog, setClientDialog] = useState(false);
  const [rateDialog, setRateDialog] = useState(false);
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [viewInvoiceDialog, setViewInvoiceDialog] = useState(false);
  const [editInvoiceDialog, setEditInvoiceDialog] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editingRate, setEditingRate] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rateToDelete, setRateToDelete] = useState(null);
  const [clientData, setClientData] = useState({
    clientName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    paymentTerms: "net_30",
    currency: "",
    taxId: "",
  });
  const [rateData, setRateData] = useState({
    employeeId: "",
    hourlyRate: 0,
    effectiveDate: dayjs().format("YYYY-MM-DD"),
    currency: "",
  });
  const [invoiceData, setInvoiceData] = useState({
    clientId: "",
    projectId: "",
    startDate: dayjs().startOf("month"),
    endDate: dayjs().endOf("month"),
    taxRate: 5,
    currency: "",
  });

  const { data: clients, loading: clientsLoading, refetch: refetchClients } = useApi(
    apiService.getClients
  );
  const { data: billingRates, loading: ratesLoading, refetch: refetchRates } = useApi(
    apiService.getBillingRates
  );
  const { data: invoices, loading: invoicesLoading, refetch: refetchInvoices } = useApi(
    apiService.getInvoices
  );
  const { data: employees } = useApi(apiService.getEmployees);
  const { data: projects } = useApi(apiService.getProjects);
  
  // Fetch app settings for default country and currency
  const { data: appSettings } = useApi(apiService.getAppSettings);

  const { mutate: createClient, loading: creatingClient } = useMutation(apiService.createClient);
  const { mutate: updateClient, loading: updatingClient } = useMutation(
    (params) => apiService.updateClient(params.id, params.data)
  );
  const { mutate: createRate, loading: creatingRate } = useMutation(apiService.createBillingRate);
  const { mutate: updateRate, loading: updatingRate } = useMutation(
    (params) => apiService.updateBillingRate(params.id, params.data)
  );
  const { mutate: deleteRate, loading: deletingRate } = useMutation(
    (id) => apiService.deleteBillingRate(id)
  );
  const { mutate: generateInvoice, loading: generatingInvoice } = useMutation(
    apiService.generateInvoice
  );
  const { mutate: updateInvoice, loading: updatingInvoice } = useMutation(
    (params) => apiService.updateInvoice(params.id, params.data)
  );
  const [loadingInvoiceDetails, setLoadingInvoiceDetails] = useState(false);

  // Auto-update invoice currency when client is selected
  useEffect(() => {
    if (invoiceData.clientId && clients) {
      const selectedClient = clients.find(c => c.id === parseInt(invoiceData.clientId));
      if (selectedClient?.currency) {
        setInvoiceData(prev => ({
          ...prev,
          currency: selectedClient.currency,
        }));
      }
    }
  }, [invoiceData.clientId, clients]);

  // Handle edit client
  const handleEditClient = (client) => {
    setEditingClient(client);
    setClientData({
      clientName: client.client_name || "",
      contactPerson: client.contact_person || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      city: client.city || "",
      country: client.country || appSettings?.country || "UAE",
      paymentTerms: client.payment_terms || "net_30",
      currency: client.currency || appSettings?.currency || "AED",
      taxId: client.tax_id || "",
    });
    setClientDialog(true);
  };

  // Handle edit rate
  const handleEditRate = (rate) => {
    setEditingRate(rate);
    setRateData({
      employeeId: rate.employee_id || "",
      hourlyRate: parseFloat(rate.hourly_rate) || 0,
      effectiveDate: rate.effective_date || dayjs().format("YYYY-MM-DD"),
      currency: rate.currency || appSettings?.currency || "AED",
    });
    setRateDialog(true);
  };

  // Handle delete rate
  const handleDeleteRate = (rate) => {
    setRateToDelete(rate);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (rateToDelete) {
      const result = await deleteRate(rateToDelete.id);
      if (result.success) {
        setDeleteDialogOpen(false);
        setRateToDelete(null);
        refetchRates();
        alert("Billing rate deleted successfully");
      }
    }
  };

  const handleCreateClient = async () => {
    // Use app settings defaults if not provided
    const clientDataToSubmit = {
      ...clientData,
      country: clientData.country || appSettings?.country || "UAE",
      currency: clientData.currency || appSettings?.currency || "AED",
    };
    
    let result;
    if (editingClient) {
      // Update existing client - backend expects camelCase field names
      result = await updateClient({ id: editingClient.id, data: clientDataToSubmit });
    } else {
      // Create new client
      result = await createClient(clientDataToSubmit);
    }
    
    if (result.success) {
      setClientDialog(false);
      setEditingClient(null);
      setClientData({
        clientName: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "",
        paymentTerms: "net_30",
        currency: "",
        taxId: "",
      });
      refetchClients();
      alert(editingClient ? "Client updated successfully" : "Client created successfully");
    }
  };

  const handleCreateRate = async () => {
    // Use app settings currency if not provided
    const rateDataToSubmit = {
      ...rateData,
      currency: rateData.currency || appSettings?.currency || "AED",
    };
    
    let result;
    if (editingRate) {
      // Update existing billing rate
      result = await updateRate({ id: editingRate.id, data: rateDataToSubmit });
    } else {
      // Create new billing rate
      result = await createRate(rateDataToSubmit);
    }
    
    if (result.success) {
      setRateDialog(false);
      setEditingRate(null);
      setRateData({
        employeeId: "",
        hourlyRate: 0,
        effectiveDate: dayjs().format("YYYY-MM-DD"),
        currency: "",
      });
      refetchRates();
      alert(editingRate ? "Billing rate updated successfully" : "Billing rate created successfully");
    }
  };

  const handleGenerateInvoice = async () => {
    // Get client currency if client is selected, otherwise use app settings
    const selectedClient = clients?.find(c => c.id === parseInt(invoiceData.clientId));
    const invoiceCurrency = selectedClient?.currency || invoiceData.currency || appSettings?.currency || "AED";
    
    const result = await generateInvoice({
      clientId: invoiceData.clientId,
      projectId: invoiceData.projectId || null,
      startDate: invoiceData.startDate.format("YYYY-MM-DD"),
      endDate: invoiceData.endDate.format("YYYY-MM-DD"),
      taxRate: invoiceData.taxRate,
      currency: invoiceCurrency,
    });

    if (result.success) {
      setInvoiceDialog(false);
      setInvoiceData({
        clientId: "",
        projectId: "",
        startDate: dayjs().startOf("month"),
        endDate: dayjs().endOf("month"),
        taxRate: 5,
        currency: "",
      });
      refetchInvoices();
      alert("Invoice generated successfully!");
    }
  };

  const handleViewInvoice = async (invoice) => {
    setLoadingInvoiceDetails(true);
    try {
      const response = await apiService.getInvoiceDetails(invoice.id);
      console.log("View invoice response:", response);
      
      // Handle API response structure: { Status: "Success", Result: { ... } }
      let invoiceData = null;
      if (response.data?.Status === "Success" && response.data.Result) {
        invoiceData = response.data.Result;
      } else if (response.data?.Result) {
        invoiceData = response.data.Result;
      } else if (response.data?.data) {
        invoiceData = response.data.data;
      } else if (response.data) {
        invoiceData = response.data;
      }
      
      if (invoiceData) {
        setViewingInvoice(invoiceData);
        setViewInvoiceDialog(true);
      } else {
        alert("Failed to load invoice details: No data received");
      }
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      alert("Failed to load invoice details: " + (error.message || "Unknown error"));
    } finally {
      setLoadingInvoiceDetails(false);
    }
  };

  const handleEditInvoice = async (invoice) => {
    setLoadingInvoiceDetails(true);
    try {
      const response = await apiService.getInvoiceDetails(invoice.id);
      console.log("Invoice details response:", response);
      
      // Handle API response structure: { Status: "Success", Result: { ... } }
      let invoiceData = null;
      if (response.data?.Status === "Success" && response.data.Result) {
        invoiceData = response.data.Result;
      } else if (response.data?.Result) {
        invoiceData = response.data.Result;
      } else if (response.data?.data) {
        invoiceData = response.data.data;
      } else if (response.data) {
        invoiceData = response.data;
      }
      
      if (!invoiceData) {
        console.error("No invoice data found in response:", response);
        alert("Failed to load invoice details: No data received");
        setLoadingInvoiceDetails(false);
        return;
      }
      
      // Format dates for input fields (YYYY-MM-DD)
      if (invoiceData.invoice_date) {
        invoiceData.invoice_date = String(invoiceData.invoice_date).split('T')[0];
      }
      if (invoiceData.due_date) {
        invoiceData.due_date = String(invoiceData.due_date).split('T')[0];
      }
      
      // Ensure all required fields have defaults
      invoiceData = {
        ...invoiceData,
        subtotal: invoiceData.subtotal || 0,
        tax_rate: invoiceData.tax_rate || 0,
        tax_amount: invoiceData.tax_amount || 0,
        total_amount: invoiceData.total_amount || 0,
        currency: invoiceData.currency || "AED",
        status: invoiceData.status || "draft",
        notes: invoiceData.notes || "",
      };
      
      console.log("Setting editing invoice:", invoiceData);
      setEditingInvoice(invoiceData);
      setEditInvoiceDialog(true);
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      const errorMessage = error.response?.data?.Error || error.message || "Unknown error";
      alert("Failed to load invoice details: " + errorMessage);
    } finally {
      setLoadingInvoiceDetails(false);
    }
  };

  const handleUpdateInvoice = async () => {
    if (!editingInvoice) {
      console.error("No invoice data to update");
      return;
    }

    console.log("Updating invoice:", editingInvoice);

    const updateData = {
      clientId: editingInvoice.client_id,
      projectId: editingInvoice.project_id || null,
      invoiceDate: editingInvoice.invoice_date,
      dueDate: editingInvoice.due_date,
      subtotal: parseFloat(editingInvoice.subtotal || 0),
      taxRate: parseFloat(editingInvoice.tax_rate || 0),
      taxAmount: parseFloat(editingInvoice.tax_amount || 0),
      totalAmount: parseFloat(editingInvoice.total_amount || 0),
      currency: editingInvoice.currency || "AED",
      status: editingInvoice.status || "draft",
      notes: editingInvoice.notes || "",
    };

    console.log("Update data:", updateData);

    try {
      const result = await updateInvoice({
        id: editingInvoice.id,
        data: updateData,
      });

      console.log("Update result:", result);

      if (result.success) {
        setEditInvoiceDialog(false);
        setEditingInvoice(null);
        refetchInvoices();
        alert("Invoice updated successfully!");
      } else {
        alert("Failed to update invoice: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error updating invoice:", error);
      alert("Failed to update invoice: " + (error.message || "Unknown error"));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
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
              Billing & Invoicing
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage clients, billing rates, and generate invoices
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              refetchClients();
              refetchRates();
              refetchInvoices();
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Tabs
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        sx={{
          mb: 3,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
          },
        }}
      >
        <Tab icon={<Business />} iconPosition="start" label="Clients" />
        <Tab icon={<AttachMoney />} iconPosition="start" label="Billing Rates" />
        <Tab icon={<Receipt />} iconPosition="start" label="Invoices" />
      </Tabs>

      {/* Clients Tab */}
      {tabValue === 0 && (
        <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Clients
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setEditingClient(null);
                  setClientData({
                    clientName: "",
                    contactPerson: "",
                    email: "",
                    phone: "",
                    address: "",
                    city: "",
                    country: "",
                    paymentTerms: "net_30",
                    currency: "",
                    taxId: "",
                  });
                  setClientDialog(true);
                }}
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                  },
                }}
              >
                Add Client
              </Button>
            </Box>
            {clientsLoading ? (
              <Loading />
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "primary.main" }}>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Client Name</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Contact Person</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Email</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Phone</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Payment Terms</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clients?.length > 0 ? (
                      clients.map((client) => (
                        <TableRow key={client.id} hover>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Business sx={{ fontSize: 16, color: "text.secondary" }} />
                              <Typography fontWeight="medium">{client.client_name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <Person sx={{ fontSize: 14, color: "text.secondary" }} />
                              {client.contact_person}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <Email sx={{ fontSize: 14, color: "text.secondary" }} />
                              {client.email}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <Phone sx={{ fontSize: 14, color: "text.secondary" }} />
                              {client.phone}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={client.payment_terms} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={client.is_active ? "Active" : "Inactive"}
                              color={client.is_active ? "success" : "default"}
                              size="small"
                              variant={client.is_active ? "filled" : "outlined"}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              <Tooltip title="Edit Client">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleEditClient(client)}
                                  sx={{ "&:hover": { bgcolor: "primary.light", color: "white" } }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">No clients found</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Billing Rates Tab */}
      {tabValue === 1 && (
        <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Billing Rates
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setRateDialog(true)}
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                  },
                }}
              >
                Add Billing Rate
              </Button>
            </Box>
            {ratesLoading ? (
              <Loading />
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "primary.main" }}>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Employee</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Designation</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Hourly Rate</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Effective Date</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {billingRates?.length > 0 ? (
                      billingRates.map((rate) => (
                        <TableRow key={rate.id} hover>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Person sx={{ fontSize: 16, color: "text.secondary" }} />
                              {rate.employeeName || "N/A"}
                            </Box>
                          </TableCell>
                          <TableCell>{rate.designation || "N/A"}</TableCell>
                          <TableCell>
                            <Typography fontWeight="bold" color="success.main">
                              {rate.hourly_rate} {rate.currency || appSettings?.currency || "AED"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {rate.effective_date 
                              ? dayjs(rate.effective_date).format("DD/MM/YYYY")
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={rate.is_active ? "Active" : "Inactive"}
                              color={rate.is_active ? "success" : "default"}
                              size="small"
                              variant={rate.is_active ? "filled" : "outlined"}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              <Tooltip title="Edit Billing Rate">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleEditRate(rate)}
                                  sx={{ "&:hover": { bgcolor: "primary.light", color: "white" } }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Billing Rate">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteRate(rate)}
                                  sx={{ "&:hover": { bgcolor: "error.light", color: "white" } }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">No billing rates found</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invoices Tab */}
      {tabValue === 2 && (
        <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Invoices
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setInvoiceDialog(true)}
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                  },
                }}
              >
                Generate Invoice
              </Button>
            </Box>
            {invoicesLoading ? (
              <Loading />
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "primary.main" }}>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Invoice #</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Client</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Project</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Date</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Amount</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices?.length > 0 ? (
                      invoices.map((invoice) => (
                        <TableRow key={invoice.id} hover>
                          <TableCell>
                            <Typography fontWeight="medium">{invoice.invoice_number}</Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Business sx={{ fontSize: 16, color: "text.secondary" }} />
                              {invoice.client_name}
                            </Box>
                          </TableCell>
                          <TableCell>{invoice.projectName || "N/A"}</TableCell>
                          <TableCell>{invoice.invoice_date}</TableCell>
                          <TableCell>
                            <Typography fontWeight="bold" color="success.main">
                              {invoice.total_amount} {invoice.currency || appSettings?.currency || "AED"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={invoice.status}
                              color={
                                invoice.status === "paid"
                                  ? "success"
                                  : invoice.status === "overdue"
                                  ? "error"
                                  : "warning"
                              }
                              size="small"
                              variant={invoice.status === "paid" ? "filled" : "outlined"}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              <Tooltip title="View Invoice">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleViewInvoice(invoice)}
                                  sx={{ "&:hover": { bgcolor: "primary.light", color: "white" } }}
                                >
                                  <Receipt fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Invoice">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleEditInvoice(invoice)}
                                  sx={{ "&:hover": { bgcolor: "primary.light", color: "white" } }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">No invoices found</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Client Dialog */}
      <Dialog
        open={clientDialog}
        onClose={() => {
          setClientDialog(false);
          setEditingClient(null);
          setClientData({
            clientName: "",
            contactPerson: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            country: "",
            paymentTerms: "net_30",
            currency: "",
            taxId: "",
          });
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              {editingClient ? "Edit Client" : "Create New Client"}
            </Typography>
            <IconButton onClick={() => {
              setClientDialog(false);
              setEditingClient(null);
              setClientData({
                clientName: "",
                contactPerson: "",
                email: "",
                phone: "",
                address: "",
                city: "",
                country: "",
                paymentTerms: "net_30",
                currency: "",
                taxId: "",
              });
            }} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Client Name"
              value={clientData.clientName}
              onChange={(e) => setClientData({ ...clientData, clientName: e.target.value })}
              fullWidth
              required
              InputProps={{
                startAdornment: <Business sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
            <TextField
              label="Contact Person"
              value={clientData.contactPerson}
              onChange={(e) => setClientData({ ...clientData, contactPerson: e.target.value })}
              fullWidth
              InputProps={{
                startAdornment: <Person sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
            <TextField
              label="Email"
              type="email"
              value={clientData.email}
              onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
              fullWidth
              InputProps={{
                startAdornment: <Email sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
            <TextField
              label="Phone"
              value={clientData.phone}
              onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
              fullWidth
              InputProps={{
                startAdornment: <Phone sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
            <TextField
              label="Address"
              value={clientData.address}
              onChange={(e) => setClientData({ ...clientData, address: e.target.value })}
              fullWidth
              multiline
              rows={2}
              InputProps={{
                startAdornment: <LocationOn sx={{ mr: 1, color: "text.secondary", alignSelf: "flex-start", mt: 1 }} />,
              }}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="City"
                  value={clientData.city}
                  onChange={(e) => setClientData({ ...clientData, city: e.target.value })}
                  fullWidth
                  InputProps={{
                    startAdornment: <LocationOn sx={{ mr: 1, color: "text.secondary" }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Country</InputLabel>
                  <Select
                    value={clientData.country || appSettings?.country || "UAE"}
                    label="Country"
                    onChange={(e) => setClientData({ ...clientData, country: e.target.value })}
                  >
                    <MenuItem value="UAE">UAE</MenuItem>
                    <MenuItem value="India">India</MenuItem>
                    <MenuItem value="USA">USA</MenuItem>
                    <MenuItem value="UK">UK</MenuItem>
                    <MenuItem value="Saudi">Saudi</MenuItem>
                    <MenuItem value="Qatar">Qatar</MenuItem>
                    <MenuItem value="Kuwait">Kuwait</MenuItem>
                    <MenuItem value="Bahrain">Bahrain</MenuItem>
                    <MenuItem value="Oman">Oman</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={clientData.currency || appSettings?.currency || "AED"}
                    label="Currency"
                    onChange={(e) => setClientData({ ...clientData, currency: e.target.value })}
                  >
                    <MenuItem value="AED">AED - UAE Dirham</MenuItem>
                    <MenuItem value="INR">INR - Indian Rupee</MenuItem>
                    <MenuItem value="USD">USD - US Dollar</MenuItem>
                    <MenuItem value="GBP">GBP - British Pound</MenuItem>
                    <MenuItem value="SAR">SAR - Saudi Riyal</MenuItem>
                    <MenuItem value="QAR">QAR - Qatari Riyal</MenuItem>
                    <MenuItem value="KWD">KWD - Kuwaiti Dinar</MenuItem>
                    <MenuItem value="BHD">BHD - Bahraini Dinar</MenuItem>
                    <MenuItem value="OMR">OMR - Omani Rial</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Payment Terms"
                  value={clientData.paymentTerms}
                  onChange={(e) => setClientData({ ...clientData, paymentTerms: e.target.value })}
                  fullWidth
                  SelectProps={{ native: true }}
                >
                  <option value="net_15">Net 15</option>
                  <option value="net_30">Net 30</option>
                  <option value="net_45">Net 45</option>
                  <option value="due_on_receipt">Due on Receipt</option>
                </TextField>
              </Grid>
            </Grid>
            <TextField
              label="Tax ID / VAT Number"
              value={clientData.taxId}
              onChange={(e) => setClientData({ ...clientData, taxId: e.target.value })}
              fullWidth
              InputProps={{
                startAdornment: <Badge sx={{ mr: 1, color: "text.secondary" }} />,
              }}
              helperText="Enter tax identification number or VAT number"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setClientDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateClient}
            variant="contained"
            disabled={creatingClient || updatingClient}
            startIcon={<CheckCircle />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            {creatingClient || updatingClient ? (editingClient ? "Updating..." : "Creating...") : (editingClient ? "Update" : "Create")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Rate Dialog */}
      <Dialog
        open={rateDialog}
        onClose={() => {
          setRateDialog(false);
          setRateData({
            employeeId: "",
            hourlyRate: 0,
            effectiveDate: dayjs().format("YYYY-MM-DD"),
            currency: "",
          });
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              {editingRate ? "Edit Billing Rate" : "Create Billing Rate"}
            </Typography>
            <IconButton onClick={() => {
              setRateDialog(false);
              setEditingRate(null);
              setRateData({
                employeeId: "",
                hourlyRate: 0,
                effectiveDate: dayjs().format("YYYY-MM-DD"),
                currency: "",
              });
            }} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              select
              label="Employee"
              value={rateData.employeeId}
              onChange={(e) => setRateData({ ...rateData, employeeId: e.target.value })}
              SelectProps={{ native: true }}
              fullWidth
              InputProps={{
                startAdornment: <Person sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            >
              <option value="">Select Employee</option>
              {employees?.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeName} ({emp.EMPID})
                </option>
              ))}
            </TextField>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Hourly Rate"
                  type="number"
                  value={rateData.hourlyRate}
                  onChange={(e) => setRateData({ ...rateData, hourlyRate: parseFloat(e.target.value) })}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: <AttachMoney sx={{ mr: 1, color: "text.secondary" }} />,
                    inputProps: { min: 0, step: 0.01 },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={rateData.currency || appSettings?.currency || "AED"}
                    label="Currency"
                    onChange={(e) => setRateData({ ...rateData, currency: e.target.value })}
                  >
                    <MenuItem value="AED">AED - UAE Dirham</MenuItem>
                    <MenuItem value="INR">INR - Indian Rupee</MenuItem>
                    <MenuItem value="USD">USD - US Dollar</MenuItem>
                    <MenuItem value="GBP">GBP - British Pound</MenuItem>
                    <MenuItem value="SAR">SAR - Saudi Riyal</MenuItem>
                    <MenuItem value="QAR">QAR - Qatari Riyal</MenuItem>
                    <MenuItem value="KWD">KWD - Kuwaiti Dinar</MenuItem>
                    <MenuItem value="BHD">BHD - Bahraini Dinar</MenuItem>
                    <MenuItem value="OMR">OMR - Omani Rial</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField
              label="Effective Date"
              type="date"
              value={rateData.effectiveDate}
              onChange={(e) => setRateData({ ...rateData, effectiveDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateRate}
            variant="contained"
            disabled={creatingRate || updatingRate}
            startIcon={<CheckCircle />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            {creatingRate || updatingRate ? (editingRate ? "Updating..." : "Creating...") : (editingRate ? "Update" : "Create")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Invoice Dialog */}
      <Dialog
        open={invoiceDialog}
        onClose={() => {
          setInvoiceDialog(false);
          setInvoiceData({
            clientId: "",
            projectId: "",
            startDate: dayjs().startOf("month"),
            endDate: dayjs().endOf("month"),
            taxRate: 5,
            currency: "",
          });
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              Generate Invoice
            </Typography>
            <IconButton onClick={() => setInvoiceDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              select
              label="Client"
              value={invoiceData.clientId}
              onChange={(e) => setInvoiceData({ ...invoiceData, clientId: e.target.value })}
              SelectProps={{ native: true }}
              fullWidth
              required
              InputProps={{
                startAdornment: <Business sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            >
              <option value="">Select Client</option>
              {clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.client_name}
                </option>
              ))}
            </TextField>
            <TextField
              select
              label="Project (Optional)"
              value={invoiceData.projectId}
              onChange={(e) => setInvoiceData({ ...invoiceData, projectId: e.target.value })}
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="">All Projects</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.projectName}
                </option>
              ))}
            </TextField>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Start Date"
                value={invoiceData.startDate}
                onChange={(newValue) => setInvoiceData({ ...invoiceData, startDate: newValue })}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="End Date"
                value={invoiceData.endDate}
                onChange={(newValue) => setInvoiceData({ ...invoiceData, endDate: newValue })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tax Rate (%)"
                  type="number"
                  value={invoiceData.taxRate}
                  onChange={(e) => setInvoiceData({ ...invoiceData, taxRate: parseFloat(e.target.value) })}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 0, max: 100, step: 0.01 },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={
                      invoiceData.currency || 
                      (clients?.find(c => c.id === parseInt(invoiceData.clientId))?.currency) ||
                      appSettings?.currency || 
                      "AED"
                    }
                    label="Currency"
                    onChange={(e) => setInvoiceData({ ...invoiceData, currency: e.target.value })}
                  >
                    <MenuItem value="AED">AED - UAE Dirham</MenuItem>
                    <MenuItem value="INR">INR - Indian Rupee</MenuItem>
                    <MenuItem value="USD">USD - US Dollar</MenuItem>
                    <MenuItem value="GBP">GBP - British Pound</MenuItem>
                    <MenuItem value="SAR">SAR - Saudi Riyal</MenuItem>
                    <MenuItem value="QAR">QAR - Qatari Riyal</MenuItem>
                    <MenuItem value="KWD">KWD - Kuwaiti Dinar</MenuItem>
                    <MenuItem value="BHD">BHD - Bahraini Dinar</MenuItem>
                    <MenuItem value="OMR">OMR - Omani Rial</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            {invoiceData.clientId && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Currency will default to selected client's currency if available
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setInvoiceDialog(false)}>Cancel</Button>
          <Button
            onClick={handleGenerateInvoice}
            variant="contained"
            disabled={generatingInvoice}
            startIcon={<Receipt />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            {generatingInvoice ? "Generating..." : "Generate Invoice"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog
        open={viewInvoiceDialog}
        onClose={() => {
          setViewInvoiceDialog(false);
          setViewingInvoice(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              Invoice Details - {viewingInvoice?.invoice_number}
            </Typography>
            <IconButton onClick={() => {
              setViewInvoiceDialog(false);
              setViewingInvoice(null);
            }} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingInvoiceDetails ? (
            <Loading />
          ) : viewingInvoice ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
              {/* Client Info */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Client Information
                </Typography>
                <Typography variant="body1" fontWeight="bold">{viewingInvoice.client_name}</Typography>
                {viewingInvoice.contact_person && (
                  <Typography variant="body2" color="text.secondary">
                    Contact: {viewingInvoice.contact_person}
                  </Typography>
                )}
                {viewingInvoice.email && (
                  <Typography variant="body2" color="text.secondary">
                    Email: {viewingInvoice.email}
                  </Typography>
                )}
              </Box>

              {/* Invoice Info */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Invoice Date</Typography>
                  <Typography variant="body1">{dayjs(viewingInvoice.invoice_date).format("DD/MM/YYYY")}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Due Date</Typography>
                  <Typography variant="body1">{dayjs(viewingInvoice.due_date).format("DD/MM/YYYY")}</Typography>
                </Grid>
                {viewingInvoice.projectName && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Project</Typography>
                    <Typography variant="body1">{viewingInvoice.projectName}</Typography>
                  </Grid>
                )}
              </Grid>

              {/* Invoice Items */}
              {viewingInvoice.items && viewingInvoice.items.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Invoice Items
                  </Typography>
                  <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "grey.100" }}>
                          <TableCell fontWeight="bold">Description</TableCell>
                          <TableCell align="right" fontWeight="bold">Hours</TableCell>
                          <TableCell align="right" fontWeight="bold">Rate</TableCell>
                          <TableCell align="right" fontWeight="bold">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {viewingInvoice.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell align="right">{parseFloat(item.hours).toFixed(2)}</TableCell>
                            <TableCell align="right">
                              {parseFloat(item.rate).toFixed(2)} {viewingInvoice.currency || "AED"}
                            </TableCell>
                            <TableCell align="right" fontWeight="bold">
                              {parseFloat(item.amount).toFixed(2)} {viewingInvoice.currency || "AED"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Summary */}
              <Box sx={{ borderTop: 2, borderColor: "divider", pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: "right" }}>
                    <Typography variant="body1" fontWeight="bold">
                      {parseFloat(viewingInvoice.subtotal || 0).toFixed(2)} {viewingInvoice.currency || "AED"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tax ({viewingInvoice.tax_rate || 0}%):
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: "right" }}>
                    <Typography variant="body1" fontWeight="bold">
                      {parseFloat(viewingInvoice.tax_amount || 0).toFixed(2)} {viewingInvoice.currency || "AED"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h6" fontWeight="bold">Total:</Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: "right" }}>
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                      {parseFloat(viewingInvoice.total_amount || 0).toFixed(2)} {viewingInvoice.currency || "AED"}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {viewingInvoice.notes && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body2">{viewingInvoice.notes}</Typography>
                </Box>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => {
            setViewInvoiceDialog(false);
            setViewingInvoice(null);
          }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog
        open={editInvoiceDialog}
        onClose={() => {
          setEditInvoiceDialog(false);
          setEditingInvoice(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              Edit Invoice - {editingInvoice?.invoice_number}
            </Typography>
            <IconButton onClick={() => {
              setEditInvoiceDialog(false);
              setEditingInvoice(null);
            }} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingInvoiceDetails ? (
            <Loading />
          ) : !editingInvoice ? (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography color="error">Failed to load invoice data. Please try again.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Invoice Date"
                    type="date"
                    value={editingInvoice?.invoice_date ? (String(editingInvoice.invoice_date).includes('T') ? String(editingInvoice.invoice_date).split('T')[0] : String(editingInvoice.invoice_date)) : ""}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, invoice_date: e.target.value })}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Due Date"
                    type="date"
                    value={editingInvoice?.due_date ? (String(editingInvoice.due_date).includes('T') ? String(editingInvoice.due_date).split('T')[0] : String(editingInvoice.due_date)) : ""}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, due_date: e.target.value })}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Subtotal"
                    type="number"
                    value={editingInvoice.subtotal || 0}
                    onChange={(e) => {
                      const subtotal = parseFloat(e.target.value) || 0;
                      const taxRate = parseFloat(editingInvoice.tax_rate || 0);
                      const taxAmount = subtotal * (taxRate / 100);
                      const totalAmount = subtotal + taxAmount;
                      setEditingInvoice({
                        ...editingInvoice,
                        subtotal,
                        tax_amount: taxAmount,
                        total_amount: totalAmount,
                      });
                    }}
                    fullWidth
                    InputProps={{
                      startAdornment: <AttachMoney sx={{ mr: 1, color: "text.secondary" }} />,
                      inputProps: { min: 0, step: 0.01 },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Tax Rate (%)"
                    type="number"
                    value={editingInvoice.tax_rate || 0}
                    onChange={(e) => {
                      const taxRate = parseFloat(e.target.value) || 0;
                      const subtotal = parseFloat(editingInvoice.subtotal || 0);
                      const taxAmount = subtotal * (taxRate / 100);
                      const totalAmount = subtotal + taxAmount;
                      setEditingInvoice({
                        ...editingInvoice,
                        tax_rate: taxRate,
                        tax_amount: taxAmount,
                        total_amount: totalAmount,
                      });
                    }}
                    fullWidth
                    InputProps={{
                      inputProps: { min: 0, max: 100, step: 0.01 },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Tax Amount"
                    type="number"
                    value={editingInvoice.tax_amount || 0}
                    disabled
                    fullWidth
                    InputProps={{
                      startAdornment: <AttachMoney sx={{ mr: 1, color: "text.secondary" }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Total Amount"
                    type="number"
                    value={editingInvoice.total_amount || 0}
                    disabled
                    fullWidth
                    InputProps={{
                      startAdornment: <AttachMoney sx={{ mr: 1, color: "text.secondary" }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={editingInvoice.currency || appSettings?.currency || "AED"}
                      label="Currency"
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, currency: e.target.value })}
                    >
                      <MenuItem value="AED">AED - UAE Dirham</MenuItem>
                      <MenuItem value="INR">INR - Indian Rupee</MenuItem>
                      <MenuItem value="USD">USD - US Dollar</MenuItem>
                      <MenuItem value="GBP">GBP - British Pound</MenuItem>
                      <MenuItem value="SAR">SAR - Saudi Riyal</MenuItem>
                      <MenuItem value="QAR">QAR - Qatari Riyal</MenuItem>
                      <MenuItem value="KWD">KWD - Kuwaiti Dinar</MenuItem>
                      <MenuItem value="BHD">BHD - Bahraini Dinar</MenuItem>
                      <MenuItem value="OMR">OMR - Omani Rial</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={editingInvoice.status || "draft"}
                      label="Status"
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, status: e.target.value })}
                    >
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="sent">Sent</MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="partial">Partial</MenuItem>
                      <MenuItem value="overdue">Overdue</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Notes"
                    value={editingInvoice.notes || ""}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, notes: e.target.value })}
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => {
            setEditInvoiceDialog(false);
            setEditingInvoice(null);
          }}>Cancel</Button>
          <Button
            onClick={handleUpdateInvoice}
            variant="contained"
            disabled={updatingInvoice}
            startIcon={<CheckCircle />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            {updatingInvoice ? "Updating..." : "Update Invoice"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setRateToDelete(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Delete color="error" />
            <Typography variant="h6">Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the billing rate for{" "}
            <strong>{rateToDelete?.employeeName || "this employee"}</strong>?
            <br />
            <br />
            Hourly Rate: <strong>{rateToDelete?.hourly_rate} {rateToDelete?.currency || appSettings?.currency || "AED"}</strong>
            <br />
            Effective Date: <strong>
              {rateToDelete?.effective_date 
                ? dayjs(rateToDelete.effective_date).format("DD/MM/YYYY")
                : "N/A"}
            </strong>
            <br />
            <br />
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setRateToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            startIcon={<Delete />}
            disabled={deletingRate}
          >
            {deletingRate ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillingManagement;

