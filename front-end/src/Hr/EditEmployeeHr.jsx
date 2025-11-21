import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Stack,
} from "@mui/material";
import {
  Edit,
  Person,
  Email,
  AttachMoney,
  LocationOn,
  Save,
} from "@mui/icons-material";
import commonData from "../../common.json"

function EditEmployeeHr() {
	const [data, setData] = useState({
		name: '',
		email: '',
		address: '',
		salary: '',
	})
	const navigate = useNavigate()
	
	const {id} = useParams();

	useEffect(()=> {
		axios.get(`${commonData?.APIKEY}/get/`+id)
		.then(res => {
			setData({
				name: res.data.Result[0].name,
				email: res.data.Result[0].email,
				address: res.data.Result[0].address,
				salary: res.data.Result[0].salary
			})
		})
		.catch(err =>console.log(err));
	}, [id])

	const handleSubmit = (event) => {
		event.preventDefault();
		axios.put(`${commonData?.APIKEY}/update/`+id, data)
		.then(res => {
			if(res.data.Status === "Success") {
				alert("Employee updated successfully");
				navigate('/employee')
			} else {
				alert("Error updating employee");
			}
		})
		.catch(err => {
			console.log(err);
			alert("Error updating employee");
		});
	}
  return (
    <Box sx={{ p: 3 }}>
			<Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", maxWidth: 900, mx: "auto" }}>
				<CardContent sx={{ p: 4 }}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 4 }}>
						<Edit color="primary" />
						<Typography variant="h5" fontWeight="bold">
							Update Employee
						</Typography>
					</Box>
					<form onSubmit={handleSubmit}>
						<Grid container spacing={3}>
							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									label="Name"
									placeholder="Enter Name"
									value={data.name}
									onChange={e => setData({...data, name: e.target.value})}
									required
									InputProps={{
										startAdornment: <Person sx={{ mr: 1, color: "text.secondary" }} />,
									}}
								/>
							</Grid>
							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									label="Email"
									type="email"
									placeholder="Enter Email"
									value={data.email}
									onChange={e => setData({...data, email: e.target.value})}
									required
									InputProps={{
										startAdornment: <Email sx={{ mr: 1, color: "text.secondary" }} />,
									}}
								/>
							</Grid>
							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									label="Salary"
									placeholder="Enter Salary"
									value={data.salary}
									onChange={e => setData({...data, salary: e.target.value})}
									required
									InputProps={{
										startAdornment: <AttachMoney sx={{ mr: 1, color: "text.secondary" }} />,
									}}
								/>
							</Grid>
							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									label="Address"
									placeholder="1234 Main St"
									value={data.address}
									onChange={e => setData({...data, address: e.target.value})}
									required
									InputProps={{
										startAdornment: <LocationOn sx={{ mr: 1, color: "text.secondary" }} />,
									}}
								/>
							</Grid>
							<Grid item xs={12}>
								<Stack direction="row" spacing={2}>
									<Button
										type="submit"
										variant="contained"
										startIcon={<Save />}
										sx={{
											background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
											"&:hover": {
												background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
											},
										}}
									>
										Update Employee
									</Button>
									<Button
										variant="outlined"
										onClick={() => navigate('/employee')}
									>
										Cancel
									</Button>
								</Stack>
							</Grid>
						</Grid>
					</form>
				</CardContent>
			</Card>
		</Box>
  )
}

export default EditEmployeeHr