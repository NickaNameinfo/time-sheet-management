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
import dayjs from "dayjs";

function AddProject() {
  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm();
  const navigate = useNavigate();
  const onSubmit = (data) => {
    console.log(data, "tests213");
    // Perform any other actions you want with the form data
    axios
      .post("http://localhost:8081/project/create", data)
      .then((res) => {
        if (res.data.Error) {
          alert(res.data.Error);
        } else {
          navigate("/Dashboard/Projects");
        }
      })
      .catch((err) => console.log(err));
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
                  <InputLabel id="demo-simple-select-label">
                    TL Name is Required
                  </InputLabel>
                  <Controller
                    name="tlName" // Make sure the name matches the field name in your form
                    control={control}
                    rules={{ required: "TLName is Required" }}
                    defaultValue="" // Set the default value here if needed
                    render={({ field }) => (
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        label="TLName is Required"
                        {...field}
                        error={Boolean(errors.tlName)}
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
                    {errors.tlName && errors.tlName.message}
                  </FormHelperText>
                </FormControl>
              </Box>
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="orderId"
                defaultValue=""
                rules={{ required: "Name is required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="Order ID"
                    variant="outlined"
                    type="number"
                    {...field}
                    error={Boolean(errors.orderId)}
                    helperText={errors.orderId && errors.orderId.message}
                  />
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="positionNumber"
                defaultValue=""
                rules={{ required: "Position Number required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="Position Number"
                    variant="outlined"
                    type="number"
                    {...field}
                    error={Boolean(errors.positionNumber)}
                    helperText={
                      errors.positionNumber && errors.positionNumber.message
                    }
                  />
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="subPositionNumber"
                defaultValue=""
                rules={{ required: "SubPosition Number is required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="SubPosition Number"
                    variant="outlined"
                    type="number"
                    {...field}
                    error={Boolean(errors.subPositionNumber)}
                    helperText={
                      errors.subPositionNumber &&
                      errors.subPositionNumber.message
                    }
                  />
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="projectNo"
                defaultValue=""
                rules={{ required: "Project No is required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="Project No"
                    variant="outlined"
                    type="number"
                    {...field}
                    error={Boolean(errors.projectNo)}
                    helperText={errors.projectNo && errors.projectNo.message}
                  />
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="taskJobNo"
                defaultValue=""
                rules={{ required: "Task/ Job No is required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="Task/ Job No"
                    variant="outlined"
                    type="number"
                    {...field}
                    error={Boolean(errors.taskJobNo)}
                    helperText={errors.taskJobNo && errors.taskJobNo.message}
                  />
                )}
              />
            </div>

            <div className="col-sm-12">
              <Controller
                control={control}
                name="prjectName"
                defaultValue=""
                rules={{ required: "Prject Name is required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="Enter Prject Name"
                    variant="outlined"
                    type="text"
                    {...field}
                    error={Boolean(errors.prjectName)}
                    helperText={errors.prjectName && errors.prjectName.message}
                  />
                )}
              />
            </div>

            <div className="col-sm-12">
              <Controller
                control={control}
                name="subDivision"
                defaultValue=""
                rules={{ required: "Sub Division is required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="Sub Division"
                    type="text"
                    variant="outlined"
                    {...field}
                    error={Boolean(errors.subDivision)}
                    helperText={
                      errors.subDivision && errors.subDivision.message
                    }
                  />
                )}
              />
            </div>
            <div className="col-sm-12">
              <Box sx={{}}>
                <FormControl fullWidth>
                  <InputLabel id="demo-simple-select-label">
                    Start Date/ Order released Daten
                  </InputLabel>
                  <Controller
                    name="startDateOrderreleasedDate" // Make sure the name matches the field name in your form
                    control={control}
                    rules={{
                      required: "Start Date/ Order released Date is Required.",
                    }}
                    defaultValue="" // Set the default value here if needed
                    render={({ field }) => (
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        label="Start Date/ Order released Date"
                        {...field}
                        error={Boolean(errors.startDateOrderreleasedDate)}
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
                    {errors.startDateOrderreleasedDate &&
                      errors.startDateOrderreleasedDate.message}
                  </FormHelperText>
                </FormControl>
              </Box>
            </div>

            <div className="col-sm-12">
              <Box sx={{}}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name="targetDate" // Make sure the name matches the field name in your form
                    control={control}
                    defaultValue="" // Set the default value here if needed
                    rules={{ required: "Target Date is Required." }}
                    render={({ field }) => (
                      <DatePicker
                        label="Target Date"
                        {...field}
                        error={Boolean(errors.targetDate)}
                        helperText={
                          errors.targetDate && errors.targetDate.message
                        }
                        renderInput={(props) => (
                          <TextField {...props} fullWidth />
                        )}
                        onChange={(newValue) =>
                          setValue(
                            "targetDate",
                            dayjs(newValue).format("YYYY-MM-DD")
                          )
                        }
                        format="YYYY-MM-DD"
                      />
                    )}
                  />
                </LocalizationProvider>
                <FormHelperText>
                  {errors.targetDate && errors.targetDate.message}
                </FormHelperText>
              </Box>
            </div>

            <div className="col-sm-12">
              <Controller
                control={control}
                name="allotatedHours"
                defaultValue=""
                rules={{ required: "Allotated Hours is required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="Allotated Hours"
                    variant="outlined"
                    {...field}
                    error={Boolean(errors.allotatedHours)}
                    helperText={
                      errors.allotatedHours && errors.allotatedHours.message
                    }
                    type="number"
                  />
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
