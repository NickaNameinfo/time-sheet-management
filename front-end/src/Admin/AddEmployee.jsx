import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

function AddEmployee() {
  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm();
  const navigate = useNavigate();
  const [tempRole, setTempRole] = useState(["Employee"]); // Initialize tempRole state

  const onSubmit = (data) => {
    const formdata = new FormData();
    // Append all fields except for the file input
    Object.keys(data).forEach((key) => {
      if (key !== "employeeImage") {
        const value = data[key];
        formdata.append(key, value);
      }
    });

    // Append the file input separately
    formdata.append("employeeImage", data.employeeImage);
    console.log(formdata, "formdataformdata")
    axios
      .post("http://localhost:8081/create", formdata)
      .then((res) => {
        if (res.data.Error) {
          alert(res.data.Error);
        } else {
          navigate("/Dashboard/employee");
        }
      })
      .catch((err) => console.log(err));
  };

  const handleOnChange = (name, value) => {
    console.log(name, value, "changesings");
    let updatedRoles = [...tempRole]; // Create a copy of the tempRole array

    if (value === true) {
      if (name === "Tl") {
        updatedRoles.push("Tl"); // Add "Tl" role
      }
      if (name === "Admin") {
        updatedRoles.push("Admin"); // Add "Admin" role
      }
    } else {
      const index = updatedRoles.indexOf(name);
      if (index !== -1) {
        updatedRoles.splice(index, 1); // Remove the role from the array
      }
    }
    setTempRole(updatedRoles); // Update the state with the new roles array
    setValue("role", updatedRoles);
    console.log(updatedRoles, "updatedRoles");
  };

  return (
    <div className="mainBody">
      <div className="mt-4">
        <h2 className="heading">Manage Employee</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="gy-3 row">
            <div className="col-sm-12">
              <Controller
                control={control}
                name="employeeName"
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
                      error={Boolean(errors.employeeName)}
                      helperText={
                        errors.employeeName && errors.employeeName.message
                      }
                    />
                  </Box>
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="EMPID"
                rules={{ required: "EMPID is required." }}
                render={({ field }) => (
                  <Box>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Employee ID"
                      variant="outlined"
                      type="number"
                      {...field}
                      error={Boolean(errors.EMPID)}
                      helperText={errors.EMPID && errors.EMPID.message}
                    />
                  </Box>
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="employeeEmail"
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
                      error={Boolean(errors.employeeEmail)}
                      helperText={
                        errors.employeeEmail && errors.employeeEmail.message
                      }
                    />
                  </Box>
                )}
              />
            </div>

            <div className="col-sm-12">
              <Controller
                control={control}
                name="userName"
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
                      error={Boolean(errors.userName)}
                      helperText={errors.userName && errors.userName.message}
                    />
                  </Box>
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="password"
                rules={{ required: "Password is Reqiured." }}
                render={({ field }) => (
                  <Box sx={{}}>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Enter password "
                      variant="outlined"
                      type="password"
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
                  <InputLabel id="demo-simple-select-label">
                    Select Discipline
                  </InputLabel>
                  <Controller
                    name="discipline" // Make sure the name matches the field name in your form
                    control={control}
                    rules={{ required: "Discipline is Required." }}
                    defaultValue="" // Set the default value here if needed
                    render={({ field }) => (
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        label="Select Designation"
                        {...field}
                        error={Boolean(errors.discipline)}
                      >
                        <MenuItem value={10}>Ten</MenuItem>
                        <MenuItem value={20}>Twenty</MenuItem>
                        <MenuItem value={30}>Thirty</MenuItem>
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    {errors.discipline && errors.discipline.message}
                  </FormHelperText>
                </FormControl>
              </Box>
            </div>
            <div className="col-sm-12">
              <Box sx={{}}>
                <FormControl fullWidth>
                  <InputLabel id="demo-simple-select-label">
                    Select Designation
                  </InputLabel>
                  <Controller
                    name="designation" // Make sure the name matches the field name in your form
                    control={control}
                    rules={{ required: "Designation is Required." }}
                    defaultValue="" // Set the default value here if needed
                    render={({ field }) => (
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        label="Select Designation"
                        {...field}
                        error={Boolean(errors.designation)}
                      >
                        <MenuItem value={10}>Ten</MenuItem>
                        <MenuItem value={20}>Twenty</MenuItem>
                        <MenuItem value={30}>Thirty</MenuItem>
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    {errors.designation && errors.designation.message}
                  </FormHelperText>
                </FormControl>
              </Box>
            </div>

            <div className="col-sm-3">
              <Box sx={{}}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name="date" // Make sure the name matches the field name in your form
                    control={control}
                    defaultValue="" // Set the default value here if needed
                    rules={{ required: "File is Required." }}
                    render={({ field }) => (
                      <DatePicker
                        label="Date Of Jion"
                        {...field}
                        error={Boolean(errors.date)}
                        helperText={errors.date && errors.date.message}
                        renderInput={(props) => (
                          <TextField {...props} fullWidth />
                        )}
                        onChange={(newValue) =>
                          setValue("date", dayjs(newValue).format("YYYY-MM-DD"))
                        }
                        format="YYYY-MM-DD"
                      />
                    )}
                  />
                </LocalizationProvider>
                <FormHelperText>
                  {errors.date && errors.date.message}
                </FormHelperText>
              </Box>
            </div>
            <div className="col-sm-4">
              <Box sx={{}}>
                <FormControl fullWidth>
                  <Controller
                    name="role" // Make sure the name matches the field name in your form
                    control={control}
                    rules={{ required: "role is Required." }}
                    defaultValue="" // Set the default value here if needed
                    render={({ field }) => (
                      <FormGroup
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              onChange={(e) =>
                                handleOnChange("Tl", e.target.checked)
                              }
                            />
                          }
                          label="Tl"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              Employee
                              onChange={(e) =>
                                handleOnChange("Admin", e.target.checked)
                              }
                            />
                          }
                          label="Admin"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              defaultChecked={true}
                              onChange={(e) =>
                                handleOnChange("Employee", e.target.checked)
                              }
                            />
                          }
                          label="Employee"
                        />
                      </FormGroup>
                    )}
                  />
                </FormControl>
              </Box>
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="employeeImage"
                rules={{ required: "File is required." }}
                render={({ field }) => (
                  <Box>
                    <input
                      label="Employee Image"
                      variant="outlined"
                      onChange={(e) =>
                        setValue("employeeImage", e.target.files[0])
                      }
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
