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

function AddProject() {
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
        <h2 className="heading">Manage Project</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="gy-3 row">
           
		  <div className="col-sm-12">
              <Box sx={{}}>
                <FormControl fullWidth>
                  <InputLabel id="demo-simple-select-label">TLName is Required</InputLabel>
                  <Controller 
                    name="TLName" // Make sure the name matches the field name in your form
                    control={control}
                    rules={{ required: "TLName is Required" }}
                    defaultValue="" // Set the default value here if needed
                    render={({ field }) => (
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        label="TLName is Required"
                        {...field}
                        error={Boolean(errors.TLName)}
                      >
                       <MenuItem value={10}>sam</MenuItem>
                        <MenuItem value={20}>Samz</MenuItem>
                        <MenuItem value={30}>Dark Rider</MenuItem>
                        <MenuItem value={30}>Dark Rider Samz</MenuItem>
                        <MenuItem value={30}>#Dark Rider Samz</MenuItem>
                        <MenuItem value={30}>@Dark Rider Samz</MenuItem>
                        <MenuItem value={30}>@Dark Rider Samz_YT</MenuItem>
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    {errors.TLName && errors.TLName.message}
                  </FormHelperText>
                </FormControl>
              </Box>
            </div>
			<div className="col-sm-12">
              <Controller
                control={control}
                name="Orderid"
                rules={{ required: "Name is required." }}
                render={({ field }) => (
                  <Box>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Order ID"
                      variant="outlined"
                      type="number"
                      {...field}
                      error={Boolean(errors.Orderid)}
                      helperText={errors.Orderid && errors.Orderid.message}
                    />
                  </Box>
                )}
              />
            </div>
			<div className="col-sm-12">
              <Controller
                control={control}
                name="PositionNumber"
                rules={{ required: "Position Number required." }}
                render={({ field }) => (
                  <Box>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Position Number"
                      variant="outlined"
                      type="number"
                      {...field}
                      error={Boolean(errors.PositionNumber)}
                      helperText={errors.PositionNumber && errors.PositionNumber.message}
                    />
                  </Box>
                )}
              />
            </div>
			<div className="col-sm-12">
              <Controller
                control={control}
                name="SubPositionNumber"
                rules={{ required: "SubPosition Number is required." }}
                render={({ field }) => (
                  <Box>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="SubPosition Number"
                      variant="outlined"
                      type="number"
                      {...field}
                      error={Boolean(errors.SubPositionNumber)}
                      helperText={errors.SubPositionNumber && errors.SubPositionNumber.message}
                    />
                  </Box>
                )}
              />
            </div>
			<div className="col-sm-12">
              <Controller
                control={control}
                name="ProjectNo"
                rules={{ required: "Project No is required." }}
                render={({ field }) => (
                  <Box>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Project No"
                      variant="outlined"
                      type="number"
                      {...field}
                      error={Boolean(errors.ProjectNo)}
                      helperText={errors.ProjectNo && errors.ProjectNo.message}
                    />
                  </Box>
                )}
              />
            </div>
			<div className="col-sm-12">
              <Controller
                control={control}
                name="TaskJobNo"
                rules={{ required: "Task/ Job No is required." }}
                render={({ field }) => (
                  <Box>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Task/ Job No"
                      variant="outlined"
                      type="number"
                      {...field}
                      error={Boolean(errors.TaskJobNo)}
                      helperText={errors.TaskJobNo && errors.TaskJobNo.message}
                    />
                  </Box>
                )}
              />
            </div>

          <div className="col-sm-12">
              <Controller
                control={control}
                name="PrjectName"
                rules={{ required: "Prject Name is required." }}
                render={({ field }) => (
                  <Box>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Enter Prject Name"
                      variant="outlined"
                      type="text"
                      {...field}
                      error={Boolean(errors.PrjectName)}
                      helperText={errors.PrjectName && errors.PrjectName.message}
                    />
                  </Box>
                )}
              />
            </div>
        
            <div className="col-sm-12">
              <Controller
                control={control}
                name="SubDivision,"
                rules={{ required: "Sub Division is required." }}
                render={({ field }) => (
                  <Box sx={{}}>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Sub Division"
                      type="text"
                      variant="outlined"
                      {...field}
                      error={Boolean(errors.SubDivision)}
                      helperText={errors.SubDivision && errors.SubDivision.message}
                    />
                  </Box>
                )}
              />
            </div>                     
            <div className="col-sm-12">
              <Box sx={{}}>
                <FormControl fullWidth>
                  <InputLabel id="demo-simple-select-label">Start Date/ Order released Daten</InputLabel>
                  <Controller 
                    name="StartDateOrderreleasedDate" // Make sure the name matches the field name in your form
                    control={control}
                    rules={{ required: "Start Date/ Order released Date is Required." }}
                    defaultValue="" // Set the default value here if needed
                    render={({ field }) => (
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        label="Start Date/ Order released Date" 
                        {...field}
                        error={Boolean(errors.StartDateOrderreleasedDate)}
                      >
                        <MenuItem value={10}>sam</MenuItem>
                        <MenuItem value={20}>Samz</MenuItem>
                        <MenuItem value={30}>Dark Rider</MenuItem>
                        <MenuItem value={30}>Dark Rider Samz</MenuItem>
                        <MenuItem value={30}>#Dark Rider Samz</MenuItem>
                        <MenuItem value={30}>@Dark Rider Samz</MenuItem>
                        <MenuItem value={30}>@Dark Rider Samz_YT</MenuItem>
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    {errors.StartDateOrderreleasedDate && errors.StartDateOrderreleasedDate.message}
                  </FormHelperText>
                </FormControl>
              </Box>
            </div>
           
            <div className="col-sm-12">
              <Box sx={{}}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name="TargetDate" // Make sure the name matches the field name in your form
                    control={control}
                    defaultValue="" // Set the default value here if needed
                    rules={{ required: "Target Date is Required." }}
                    render={({ field }) => (
                      <DatePicker
                        label="Target Date"
                        {...field}
                        error={Boolean(errors.TargetDate)}
                        helperText={errors.TargetDate && errors.TargetDate.message}
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
                  {errors.TargetDate && errors.TargetDate.message}
                </FormHelperText>
              </Box>
            </div>

            <div className="col-sm-12">
              <Controller
                control={control}
                name=" AllotatedHours"
                rules={{ required: " Allotated Hours is required." }}
                render={({ field }) => (
                  <Box>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label=" Allotated Hours"
                      variant="outlined"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      {...field}
                      error={Boolean(errors.AllotatedHours)}
                      helperText={errors.AllotatedHours && errors.AllotatedHours.message}
                      type="number"
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

export default AddProject;
