import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Grid,
  Divider,
  Stack,
  Paper,
} from "@mui/material";
import {
  Person,
  Email,
  AttachMoney,
  Edit,
  Logout,
  AccountCircle,
} from "@mui/icons-material";
import commonData from "../../common.json"

function HrDetail() {
    const {id} = useParams();
    const navigate = useNavigate()
    const [employee, setEmployee] = useState([])

    useEffect(()=> {
        axios.get(`${commonData?.APIKEY}/get/`+id)
        .then(res => setEmployee(res.data.Result[0]))
        .catch(err => console.log(err));
    }, [id])

    const handleLogout = () => {
		axios.get(`${commonData?.APIKEY}/logout`)
		.then(res => {
			navigate('/start')
		}).catch(err => console.log(err));
	}
    
  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", maxWidth: 800, mx: "auto" }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
            <Avatar
              src={employee.image ? `${commonData?.APIKEY}/images/${employee.image}` : undefined}
              sx={{
                width: 150,
                height: 150,
                mb: 3,
                bgcolor: "primary.main",
                fontSize: "4rem",
              }}
            >
              {!employee.image && <AccountCircle sx={{ fontSize: 150 }} />}
            </Avatar>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {employee.name || "HR Name"}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              HR ID: {id}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Person color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Name
                    </Typography>
                    <Typography variant="h6" fontWeight="medium">
                      {employee.name || "N/A"}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Email color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="h6" fontWeight="medium">
                      {employee.email || "N/A"}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <AttachMoney color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Salary
                    </Typography>
                    <Typography variant="h6" fontWeight="medium" color="success.main">
                      {employee.salary ? `AED ${employee.salary}` : "N/A"}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<Edit />}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                },
              }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Logout />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

export default HrDetail