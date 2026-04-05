import React, { useState, useMemo } from "react";
import { apiService } from "../services/api";
import { useApi } from "../hooks/useApi";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Stack,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  FileDownload,
  Description,
  GetApp,
  CalendarToday,
  Person,
  Refresh,
} from "@mui/icons-material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import ErrorMessage from "./ErrorMessage";

const PayrollExport = () => {
  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));
  const [employeeId, setEmployeeId] = useState("");
  const [format, setFormat] = useState("excel");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [payrollData, setPayrollData] = useState(null);

  // Fetch employees list
  const { data: employeesData, loading: employeesLoading } = useApi(apiService.getEmployees);

  // Process employees data
  const employees = useMemo(() => {
    if (!employeesData) return [];
    if (Array.isArray(employeesData)) return employeesData;
    return employeesData?.Result || employeesData?.data || [];
  }, [employeesData]);

  // Get selected employee name for filename
  const selectedEmployee = useMemo(() => {
    if (!employeeId) return null;
    return employees.find(emp => emp.id === parseInt(employeeId) || emp.EMPID === employeeId);
  }, [employeeId, employees]);

  const handleExport = async (exportType) => {
    setLoading(true);
    setError(null);
    setPayrollData(null);

    try {
      const params = {
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
      };

      if (employeeId) {
        params.employeeId = employeeId;
      }

      // Generate filename with employee name if selected
      const employeeName = selectedEmployee 
        ? `_${(selectedEmployee.employeeName || selectedEmployee.userName || "").replace(/[^a-zA-Z0-9]/g, "_")}`
        : "";
      const baseFilename = `payroll_${exportType || format}_${startDate.format("YYYY-MM-DD")}_${endDate.format("YYYY-MM-DD")}${employeeName}`;

      let response;
      if (exportType === "tally") {
        response = await apiService.exportToTally(params);
        // Tally export is always a blob (CSV)
        const blob = new Blob([response.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${baseFilename}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert("Tally export completed successfully!");
        setLoading(false);
        return;
      } else if (exportType === "quickbooks") {
        response = await apiService.exportToQuickBooks(params);
        // QuickBooks export is always a blob (IIF)
        const blob = new Blob([response.data], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${baseFilename}.iif`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert("QuickBooks export completed successfully!");
        setLoading(false);
        return;
      } else {
        // Generate Payroll Summary
        params.format = format;
        response = await apiService.generatePayrollSummary(params);
      }

      // Handle response based on format
      if (format === "json") {
        // Display JSON data in a table
        let data = null;
        if (response.data?.Status === "Success" && response.data.Result) {
          data = response.data.Result;
        } else if (response.data?.Result) {
          data = response.data.Result;
        } else if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data) {
          data = response.data;
        }
        
        if (data && Array.isArray(data) && data.length > 0) {
          setPayrollData(data);
        } else {
          setError("No payroll data found for the selected period");
        }
      } else if (format === "excel" || format === "pdf") {
        // Handle file download for Excel/PDF
        const blob = new Blob([response.data], { 
          type: format === "excel" 
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/pdf"
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${baseFilename}.${format === "excel" ? "xlsx" : "pdf"}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert("Export completed successfully!");
      }
    } catch (err) {
      console.error("Export error:", err);
      setError(err.response?.data?.Error || err.response?.data?.error || err.message || "Export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Payroll Export
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Generate and export payroll summaries in various formats
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <FileDownload color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Export Options
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      InputProps: {
                        startAdornment: <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />,
                      },
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      InputProps: {
                        startAdornment: <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />,
                      },
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Employee (Optional)</InputLabel>
                <Select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  label="Employee (Optional)"
                  disabled={employeesLoading}
                >
                  <MenuItem value="">
                    <em>All Employees</em>
                  </MenuItem>
                  {employees.map((employee) => (
                    <MenuItem key={employee.id || employee.EMPID} value={employee.id || employee.EMPID}>
                      {employee.employeeName || employee.userName} ({employee.EMPID || employee.id || "N/A"})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Format</InputLabel>
                <Select value={format} onChange={(e) => setFormat(e.target.value)} label="Format">
                  <MenuItem value="json">JSON</MenuItem>
                  <MenuItem value="excel">Excel</MenuItem>
                  <MenuItem value="pdf">PDF</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <ErrorMessage error={error} onClose={() => setError(null)} />

          <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
            <Button
              variant="contained"
              onClick={() => handleExport("summary")}
              disabled={loading}
              startIcon={<Description />}
              sx={{
                background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
                },
              }}
            >
              {loading ? "Generating..." : "Generate Payroll Summary"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleExport("tally")}
              disabled={loading}
              startIcon={<GetApp />}
            >
              Export to Tally
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleExport("quickbooks")}
              disabled={loading}
              startIcon={<GetApp />}
            >
              Export to QuickBooks
            </Button>
          </Stack>

          {selectedEmployee && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Selected Employee:</strong> {selectedEmployee.employeeName || selectedEmployee.userName} 
                ({selectedEmployee.EMPID || selectedEmployee.id})
              </Typography>
            </Alert>
          )}
          <Alert severity="info" icon={<Refresh />}>
            Payroll summary includes regular hours, OT hours, and calculated amounts based on
            billing rates. {selectedEmployee ? "Export will be filtered for the selected employee." : "Leave employee unselected to export all employees."}
          </Alert>
        </CardContent>
      </Card>

      {/* Display Payroll Data Table for JSON format */}
      {payrollData && payrollData.length > 0 && (
        <Card sx={{ mt: 3, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Payroll Summary Data
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setPayrollData(null)}
              >
                Close
              </Button>
            </Box>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Employee ID</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Employee Name</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Designation</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }} align="right">Regular Hours</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }} align="right">OT Hours</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }} align="right">Total Hours</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }} align="right">Hourly Rate</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }} align="right">Regular Pay</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }} align="right">OT Pay</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }} align="right">Total Pay</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payrollData.map((row, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{row.employeeId || "N/A"}</TableCell>
                      <TableCell>{row.employeeName || "N/A"}</TableCell>
                      <TableCell>{row.designation || "N/A"}</TableCell>
                      <TableCell align="right">{parseFloat(row.regularHours || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">{parseFloat(row.otHours || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">{parseFloat(row.totalHours || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">{parseFloat(row.hourlyRate || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">{parseFloat(row.regularPay || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">{parseFloat(row.otPay || 0).toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        {parseFloat(row.totalPay || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: "grey.100" }}>
                    <TableCell colSpan={3} sx={{ fontWeight: "bold" }}>TOTAL</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      {payrollData.reduce((sum, r) => sum + parseFloat(r.regularHours || 0), 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      {payrollData.reduce((sum, r) => sum + parseFloat(r.otHours || 0), 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      {payrollData.reduce((sum, r) => sum + parseFloat(r.totalHours || 0), 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="right"></TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      {payrollData.reduce((sum, r) => sum + parseFloat(r.regularPay || 0), 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      {payrollData.reduce((sum, r) => sum + parseFloat(r.otPay || 0), 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", color: "success.main" }}>
                      {payrollData.reduce((sum, r) => sum + parseFloat(r.totalPay || 0), 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PayrollExport;

