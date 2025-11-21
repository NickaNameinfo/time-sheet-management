import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Grid,
  Divider,
  Button,
  TextField,
  Paper,
} from "@mui/material";
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Edit,
  Save,
  AccountCircle,
} from "@mui/icons-material";
import commonData from "../../common.json";

function HrProfile() {
  const [employee, setEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .post(`${commonData?.APIKEY}/dashboard`, { tokensss: token })
      .then((res) => {
        if (res.data?.employeeId) {
          axios
            .get(`${commonData?.APIKEY}/get/${res.data.employeeId}`)
            .then((result) => {
              setEmployee(result.data.Result[0]);
            })
            .catch((err) => console.log(err));
        }
      })
      .catch((err) => console.log(err));
  }, [token]);

  const handleSave = () => {
    // Implement save functionality
    setIsEditing(false);
    alert("Profile updated successfully");
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", maxWidth: 900, mx: "auto" }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
            <Typography variant="h4" fontWeight="bold">
              HR Profile
            </Typography>
            {!isEditing ? (
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => setIsEditing(true)}
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                  },
                }}
              >
                Edit Profile
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                color="success"
              >
                Save Changes
              </Button>
            )}
          </Box>

          {/* Profile Picture */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
            <Avatar
              src={employee?.image ? `${commonData?.APIKEY}/images/${employee.image}` : undefined}
              sx={{
                width: 150,
                height: 150,
                mb: 2,
                bgcolor: "primary.main",
                fontSize: "4rem",
              }}
            >
              {!employee?.image && <AccountCircle sx={{ fontSize: 150 }} />}
            </Avatar>
            <Typography variant="h5" fontWeight="bold">
              {employee?.employeeName || employee?.name || "HR Name"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {employee?.EMPID || employee?.employeeId || "HR ID"}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Profile Details */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                  <Person color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Full Name
                  </Typography>
                </Box>
                {isEditing ? (
                  <TextField
                    fullWidth
                    variant="outlined"
                    defaultValue={employee?.employeeName || employee?.name}
                    size="small"
                  />
                ) : (
                  <Typography variant="h6" fontWeight="medium">
                    {employee?.employeeName || employee?.name || "N/A"}
                  </Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                  <Email color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                </Box>
                {isEditing ? (
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="email"
                    defaultValue={employee?.email}
                    size="small"
                  />
                ) : (
                  <Typography variant="h6" fontWeight="medium">
                    {employee?.email || "N/A"}
                  </Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                  <Phone color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Phone
                  </Typography>
                </Box>
                {isEditing ? (
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="tel"
                    defaultValue={employee?.phone}
                    size="small"
                  />
                ) : (
                  <Typography variant="h6" fontWeight="medium">
                    {employee?.phone || "N/A"}
                  </Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                  <LocationOn color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Designation
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight="medium">
                  {employee?.designation || "HR Manager"}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default HrProfile;