import React, { useState } from "react";
import { apiService } from "../services/api";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Stack,
  Grid,
  Divider,
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

  const handleExport = async (exportType) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
      };

      if (employeeId) {
        params.employeeId = employeeId;
      }

      let response;
      if (exportType === "tally") {
        response = await apiService.exportToTally(params);
      } else if (exportType === "quickbooks") {
        response = await apiService.exportToQuickBooks(params);
      } else {
        params.format = format;
        response = await apiService.generatePayrollSummary(params);
      }

      // Handle file download
      if (exportType === "tally" || exportType === "quickbooks" || format !== "json") {
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `payroll_${exportType || format}_${startDate.format("YYYY-MM-DD")}_${endDate.format("YYYY-MM-DD")}.${exportType === "tally" ? "csv" : exportType === "quickbooks" ? "iif" : format === "excel" ? "xlsx" : "pdf"}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      alert("Export completed successfully!");
    } catch (err) {
      setError(err.response?.data?.Error || err.message || "Export failed");
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
              <TextField
                label="Employee ID (optional)"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: "text.secondary" }} />,
                }}
              />
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
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
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

          <Alert severity="info" icon={<Refresh />}>
            Payroll summary includes regular hours, OT hours, and calculated amounts based on
            billing rates.
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PayrollExport;

