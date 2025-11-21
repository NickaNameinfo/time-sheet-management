import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import {
  People,
  CheckCircle,
  Cancel,
  Refresh,
  Person,
} from "@mui/icons-material";
import commonData from "../../common.json"

function HrHome() {
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [employeeList, setEmployeeList] = useState([]);

  useEffect(() => {
    // Fetch employee data
    axios.get(`${commonData?.APIKEY}/getEmployee`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setTotalEmployees(res.data.Result.length);
          // You can set employeeList here if needed
        }
      })
      .catch((err) => console.log(err));
  }, []);

  // Sample data - replace with actual API call
  const sampleData = [
    {
      name: "Arun",
      email: "Arun@gmail.com",
      address: "t nager",
      requestedDate: "10/11/23",
      approvedDate: "2/12/23",
      totalHours: 80,
      remainingHours: 40,
      status: "Approved",
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          HR Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage employees and track their work details
        </Typography>
      </Box>

      {/* Stats Card */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <People sx={{ fontSize: 48 }} />
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Employees
                  </Typography>
                  <Typography variant="h3" fontWeight="bold">
                    {totalEmployees || 50}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Employee List Table */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <People color="primary" />
              <Typography variant="h6" fontWeight="bold">
                List of Employees
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </Box>
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "primary.main" }}>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Name</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Image</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Email</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Address</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Requested Date</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Approved Date</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Total Hours</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Remaining Hours</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sampleData.length > 0 ? (
                  sampleData.map((employee, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Person sx={{ fontSize: 16, color: "text.secondary" }} />
                          {employee.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Avatar sx={{ width: 40, height: 40 }} />
                      </TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.address}</TableCell>
                      <TableCell>{employee.requestedDate}</TableCell>
                      <TableCell>{employee.approvedDate}</TableCell>
                      <TableCell>
                        <Typography fontWeight="bold">{employee.totalHours}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography color="warning.main" fontWeight="bold">
                          {employee.remainingHours}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={employee.status}
                          color={employee.status === "Approved" ? "success" : "warning"}
                          size="small"
                          variant={employee.status === "Approved" ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              sx={{
                                "&:hover": {
                                  bgcolor: "success.light",
                                  color: "white",
                                },
                              }}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              sx={{
                                "&:hover": {
                                  bgcolor: "error.light",
                                  color: "white",
                                },
                              }}
                            >
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No employee data available</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

export default HrHome;
