import React, { useState } from "react";
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
  DialogActions,
  Tabs,
  Tab,
  Chip,
  Grid,
  Stack,
  IconButton,
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
  const [clientData, setClientData] = useState({
    clientName: "",
    contactPerson: "",
    email: "",
    phone: "",
    paymentTerms: "net_30",
  });
  const [rateData, setRateData] = useState({
    employeeId: "",
    hourlyRate: 0,
    effectiveDate: dayjs().format("YYYY-MM-DD"),
  });
  const [invoiceData, setInvoiceData] = useState({
    clientId: "",
    projectId: "",
    startDate: dayjs().startOf("month"),
    endDate: dayjs().endOf("month"),
    taxRate: 5,
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

  const { mutate: createClient, loading: creatingClient } = useMutation(apiService.createClient);
  const { mutate: createRate, loading: creatingRate } = useMutation(apiService.createBillingRate);
  const { mutate: generateInvoice, loading: generatingInvoice } = useMutation(
    apiService.generateInvoice
  );

  const handleCreateClient = async () => {
    const result = await createClient(clientData);
    if (result.success) {
      setClientDialog(false);
      refetchClients();
      alert("Client created successfully");
    }
  };

  const handleCreateRate = async () => {
    const result = await createRate(rateData);
    if (result.success) {
      setRateDialog(false);
      refetchRates();
      alert("Billing rate created successfully");
    }
  };

  const handleGenerateInvoice = async () => {
    const result = await generateInvoice({
      clientId: invoiceData.clientId,
      projectId: invoiceData.projectId || null,
      startDate: invoiceData.startDate.format("YYYY-MM-DD"),
      endDate: invoiceData.endDate.format("YYYY-MM-DD"),
      taxRate: invoiceData.taxRate,
    });

    if (result.success) {
      setInvoiceDialog(false);
      refetchInvoices();
      alert("Invoice generated successfully!");
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
                onClick={() => setClientDialog(true)}
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
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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
                              {rate.hourly_rate} {rate.currency || "AED"}
                            </Typography>
                          </TableCell>
                          <TableCell>{rate.effective_date}</TableCell>
                          <TableCell>
                            <Chip
                              label={rate.is_active ? "Active" : "Inactive"}
                              color={rate.is_active ? "success" : "default"}
                              size="small"
                              variant={rate.is_active ? "filled" : "outlined"}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
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
                              {invoice.total_amount} {invoice.currency || "AED"}
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
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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
        onClose={() => setClientDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              Create New Client
            </Typography>
            <IconButton onClick={() => setClientDialog(false)} size="small">
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
              select
              label="Payment Terms"
              value={clientData.paymentTerms}
              onChange={(e) => setClientData({ ...clientData, paymentTerms: e.target.value })}
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="net_15">Net 15</option>
              <option value="net_30">Net 30</option>
              <option value="net_45">Net 45</option>
              <option value="due_on_receipt">Due on Receipt</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setClientDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateClient}
            variant="contained"
            disabled={creatingClient}
            startIcon={<CheckCircle />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            {creatingClient ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Rate Dialog */}
      <Dialog
        open={rateDialog}
        onClose={() => setRateDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              Create Billing Rate
            </Typography>
            <IconButton onClick={() => setRateDialog(false)} size="small">
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
            <TextField
              label="Hourly Rate"
              type="number"
              value={rateData.hourlyRate}
              onChange={(e) => setRateData({ ...rateData, hourlyRate: parseFloat(e.target.value) })}
              fullWidth
              required
              InputProps={{
                startAdornment: <AttachMoney sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
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
            disabled={creatingRate}
            startIcon={<CheckCircle />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            {creatingRate ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Invoice Dialog */}
      <Dialog
        open={invoiceDialog}
        onClose={() => setInvoiceDialog(false)}
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
            <TextField
              label="Tax Rate (%)"
              type="number"
              value={invoiceData.taxRate}
              onChange={(e) => setInvoiceData({ ...invoiceData, taxRate: parseFloat(e.target.value) })}
              fullWidth
            />
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
    </Box>
  );
};

export default BillingManagement;

