import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import dayjs from 'dayjs';

function AddEmployee() {
  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue
  } = useForm();
  const navigate = useNavigate();
  const onSubmit = (data) => {
    console.log(data, "tests213");
    // Perform any other actions you want with the form data
    // axios
    //   .post("http://localhost:8081/create", data)
    //   .then((res) => {
    //     navigate("/Dashboard/employee");
    //   })
    //   .catch((err) => console.log(err));
  };

  return (
    <div className="mainBody">
      <div className="mt-4">
        <h2 className="heading">Add Employee</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="gy-3 row">
           
          <div className="col-sm-12">
              <Controller
                control={control}
                name="EnterName"
                rules={{ required: "Name is required." }}
                render={({ field }) => (
                  <Box>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Enter Name"
                      variant="outlined"
                      type="text"
                      {...field}
                      error={Boolean(errors.EnterName)}
                      helperText={errors.EnterName && errors.EnterName.message}
                    />
                  </Box>
                )}
              />
            </div>
          <div className="col-sm-12">
              <Controller
                control={control}
                name="EnterEMPID"
                rules={{ required: "Name is required." }}
                render={({ field }) => (
                  <Box>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Employee ID"
                      variant="outlined"
                      type="number"
                      {...field}
                      error={Boolean(errors.EnterEMPID)}
                      helperText={errors.EnterEMPID && errors.EnterEMPID.message}
                    />
                  </Box>
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="email"
                rules={{ required: "Email is required." }}
                render={({ field }) => (
                  <Box sx={{}}>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Enter Email "
                      type="email"
                      variant="outlined"
                      {...field}
                      error={Boolean(errors.email)}
                      helperText={errors.email && errors.email.message}
                    />
                  </Box>
                )}
              />
            </div>

            <div className="col-sm-12">
              <Controller
                control={control}
                name="Username"
                rules={{ required: "Username is required." }}
                render={({ field }) => (
                  <Box>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Enter Username "
                      variant="outlined"
                      type="text"
                      {...field}
                      error={Boolean(errors.Username)}
                      helperText={errors.Username && errors.Username.message}
                    />
                  </Box>
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="password"
                rules={{ required: "password is Reqiured." }}
                render={({ field }) => (
                  <Box sx={{}}>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Enter password "
                      variant="outlined"
                      // type="password"
                      {...field}
                      error={Boolean(errors.password)}
                      helperText={errors.password && errors.password.message}
                    />
                  </Box>
                )}
              />
            </div>

            <div className="col-sm-12">
              <Box sx={{}}>
                <FormControl fullWidth>
                  <InputLabel id="demo-simple-select-label">Select Designation</InputLabel>
                  <Controller 
                    name="Discipline" // Make sure the name matches the field name in your form
                    control={control}
                    rules={{ required: "Date is Required." }}
                    defaultValue="" // Set the default value here if needed
                    render={({ field }) => (
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        label="Select Designation"
                        {...field}
                        error={Boolean(errors.Discipline)}
                      >
                        <MenuItem value={10}>Ten</MenuItem>
                        <MenuItem value={20}>Twenty</MenuItem>
                        <MenuItem value={30}>Thirty</MenuItem>
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    {errors.Discipline && errors.Discipline.message}
                  </FormHelperText>
                </FormControl>
              </Box>
            </div>
            <div className="col-sm-12">
              <Box sx={{}}>
                <FormControl fullWidth>
                  <InputLabel id="demo-simple-select-label">Select Designation</InputLabel>
                  <Controller 
                    name="Designation" // Make sure the name matches the field name in your form
                    control={control}
                    rules={{ required: "Date is Required." }}
                    defaultValue="" // Set the default value here if needed
                    render={({ field }) => (
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        label="Select Designation"
                        {...field}
                        error={Boolean(errors.Designation)}
                      >
                        <MenuItem value={10}>Ten</MenuItem>
                        <MenuItem value={20}>Twenty</MenuItem>
                        <MenuItem value={30}>Thirty</MenuItem>
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    {errors.Designation && errors.Designation.message}
                  </FormHelperText>
                </FormControl>
              </Box>
            </div>
            {/* <div className="col-sm-12">
              <Controller
                control={control}
                name="date"
                rules={{ required: "Date is Required." }}
                render={({ field }) => (
                  <Box sx={{}}>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Enter date "
                      variant="outlined"
                      // type="password"
                      {...field}
                      error={Boolean(errors.date)}
                      helperText={errors.date && errors.date.message}
                    />
                  </Box>
                )}
              />
            </div> */}
            <div className="col-sm-12">
              <Box sx={{}}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name="Date" // Make sure the name matches the field name in your form
                    control={control}
                    defaultValue="" // Set the default value here if needed
                    rules={{ required: "File is Required." }}
                    render={({ field }) => (
                      <DatePicker
                        label="Date Of Jion"
                        {...field}
                        error={Boolean(errors.Date)}
                        helperText={errors.Date && errors.Date.message}
                        renderInput={(props) => (
                          <TextField {...props} fullWidth />
                        )}
                        onChange={(newValue) =>setValue("Date", dayjs(newValue).format('YYYY-MM-DD')) }
                        format="YYYY-MM-DD"
                      />
                    )}
                  />
                </LocalizationProvider>
                <FormHelperText> 
                  {errors.Date && errors.Date.message}
                </FormHelperText>
              </Box>
            </div>

            <div className="col-sm-12">
              <Controller
                control={control}
                name="name"
                rules={{ required: "File is required." }}
                render={({ field }) => (
                  <Box>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      // label="Choose File "s
                      variant="outlined"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      {...field}
                      error={Boolean(errors.name)}
                      helperText={errors.name && errors.name.message}
                      type="file"
                    />
                  </Box>
                )}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary button">
            Submit
          </button>
        </form>
      </div>
    </div> 
  );
}

export default AddEmployee;
