import axios from 'axios';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
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
  PersonAdd,
  Person,
  Email,
  Lock,
  AttachMoney,
  LocationOn,
  PhotoCamera,
  Save,
} from "@mui/icons-material";
import commonData from "../../common.json"

function AddEmployeeHr() {
	const [data, setData] = useState({
		name: '',
		email: '',
		password: '',
		address: '',
		salary: '',
		image: ''
	})
	const navigate = useNavigate()

	const handleSubmit = (event) => {
		event.preventDefault();
		const formdata = new FormData();
		formdata.append("name", data.name);
		formdata.append("email", data.email);
		formdata.append("password", data.password);
		formdata.append("address", data.address);
		formdata.append("salary", data.salary);
		formdata.append("image", data.image);
		
		axios.post(`${commonData?.APIKEY}/create`, formdata)
		.then(res => {
			alert("Employee created successfully");
			navigate('/Dashboard/employee')
		})
		.catch(err => {
			console.log(err);
			alert("Error creating employee");
		});
	}
	return (
		<Box sx={{ p: 3 }}>
			<Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", maxWidth: 900, mx: "auto" }}>
				<CardContent sx={{ p: 4 }}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 4 }}>
						<PersonAdd color="primary" />
						<Typography variant="h5" fontWeight="bold">
							Add Employee
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
									label="Password"
									type="password"
									placeholder="Enter Password"
									value={data.password}
									onChange={e => setData({...data, password: e.target.value})}
									required
									InputProps={{
										startAdornment: <Lock sx={{ mr: 1, color: "text.secondary" }} />,
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
							<Grid item xs={12}>
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
								<Button
									variant="outlined"
									component="label"
									fullWidth
									startIcon={<PhotoCamera />}
									sx={{ py: 1.5 }}
								>
									{data.image ? data.image.name : "Select Image"}
									<input
										type="file"
										hidden
										accept="image/*"
										onChange={e => setData({...data, image: e.target.files[0]})}
									/>
								</Button>
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
										Create Employee
									</Button>
									<Button
										variant="outlined"
										onClick={() => navigate('/Dashboard/employee')}
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

export default AddEmployeeHr