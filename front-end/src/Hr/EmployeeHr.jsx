import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import {
  People,
  Add,
  Edit,
  Delete,
  Refresh,
  Person,
  Email,
  LocationOn,
  AttachMoney,
} from "@mui/icons-material";
import commonData from "../../common.json"

function EmployeeHr() {
  const [data, setData] = useState([])

  useEffect(()=> {
    getEmployees();
  }, [])

  const getEmployees = () => {
    axios.get(`${commonData?.APIKEY}/getEmployee`)
    .then(res => {
      if(res.data.Status === "Success") {
        setData(res.data.Result);
      } else {
        alert("Error")
      }
    })
    .catch(err => console.log(err));
  }

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      axios.delete(`${commonData?.APIKEY}/delete/`+id)
      .then(res => {
        if(res.data.Status === "Success") {
          alert("Employee deleted successfully");
          getEmployees();
        } else {
          alert("Error deleting employee")
        }
      })
      .catch(err => console.log(err));
    }
  }

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
              Employee List
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage employee information and details
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={getEmployees}
            >
              Refresh
            </Button>
            <Button
              component={Link}
              to="/Hr/create"
              variant="contained"
              startIcon={<Add />}
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
      </Box>

      {/* Table Card */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <People color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Employees
            </Typography>
          </Box>
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "primary.main" }}>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Name</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Image</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Email</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Address</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Salary</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length > 0 ? (
                  data.map((employee, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Person sx={{ fontSize: 16, color: "text.secondary" }} />
                          <Typography fontWeight="medium">{employee.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Avatar
                          src={employee.image ? `${commonData?.APIKEY}/images/${employee.image}` : undefined}
                          sx={{ width: 40, height: 40 }}
                        >
                          {!employee.image && <Person />}
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Email sx={{ fontSize: 14, color: "text.secondary" }} />
                          {employee.email}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <LocationOn sx={{ fontSize: 14, color: "text.secondary" }} />
                          {employee.address}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <AttachMoney sx={{ fontSize: 14, color: "text.secondary" }} />
                          <Typography fontWeight="bold" color="success.main">
                            {employee.salary}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit">
                            <IconButton
                              component={Link}
                              to={`/hr/employeeEdit/${employee.id}`}
                              size="small"
                              color="primary"
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
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(employee.id)}
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
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No employees found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  )
}

export default EmployeeHr