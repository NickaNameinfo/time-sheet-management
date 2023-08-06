import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

function AddProjectDetails() {
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
        <h2 className="heading">Add Project Work Details </h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="gy-3 row">
            <div className="col-sm-12">
              <Box sx={{}}>
                <FormControl fullWidth>
                  <InputLabel id="demo-simple-select-label">
                    Project Name is Required
                  </InputLabel>
                  <Controller
                    name="projectName" // Make sure the name matches the field name in your form
                    control={control}
                    rules={{ required: "project Name is Required" }}
                    defaultValue="" // Set the default value here if needed
                    render={({ field }) => (
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        label="Project Name is Required"
                        {...field}
                        error={Boolean(errors.projectName)}
                      >
                        <MenuItem value={10}>sam</MenuItem>
                        <MenuItem value={20}>Samz</MenuItem>
                        <MenuItem value={30}>Dark Rider</MenuItem>
                        <MenuItem value={40}>Dark Rider Samz</MenuItem>
                        <MenuItem value={50}>#Dark Rider Samz</MenuItem>
                        <MenuItem value={60}>@Dark Rider Samz</MenuItem>
                        <MenuItem value={70}>@Dark Rider Samz_YT</MenuItem>
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    {errors.projectName && errors.projectName.message}
                  </FormHelperText>
                </FormControl>
              </Box>
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="tlName"
                defaultValue=""
                rules={{ required: "TL Name is required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="TL Name"
                    variant="outlined"
                    type="text"
                    {...field}
                    error={Boolean(errors.tlName)}
                    helperText={errors.tlName && errors.tlName.message}
                  />
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="taskNo"
                defaultValue=""
                rules={{ required: "Task Number required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="Task Number"
                    variant="outlined"
                    type="number"
                    {...field}
                    error={Boolean(errors.taskNo)}
                    helperText={errors.taskNo && errors.taskNo.message}
                  />
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="areaofWork"
                defaultValue=""
                rules={{ required: "Area Of Work  is required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="Area Of Work"
                    variant="outlined"
                    type="text"
                    {...field}
                    error={Boolean(errors.areaofWork)}
                    helperText={errors.areaofWork && errors.areaofWork.message}
                  />
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="workHour	"
                defaultValue=""
                rules={{ required: "Work Hour required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="Work Hour"
                    variant="outlined"
                    type="number"
                    {...field}
                    error={Boolean(errors.workHour	)}
                    helperText={errors.workHour	 && errors.workHour	.message}
                  />
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="totalHours"
                defaultValue=""
                rules={{ required: "Total Hours required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="Total Hours"
                    variant="outlined"
                    type="number"
                    {...field}
                    error={Boolean(errors.totalHours)}
                    helperText={errors.totalHours && errors.totalHours.message}
                  />
                )}
              />
            </div>

            <div className="col-sm-12">
              <Box sx={{}}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name="workDate" // Make sure the name matches the field name in your form
                    control={control}
                    defaultValue="" // Set the default value here if needed
                    rules={{ required: "Work Date is Required." }}
                    render={({ field }) => (
                      <DatePicker
                        label="Work Date"
                        {...field}
                        error={Boolean(errors.workDate)}
                        helperText={errors.workDate && errors.workDate.message}
                        renderInput={(props) => (
                          <TextField {...props} fullWidth />
                        )}
                        onChange={(newValue) =>
                          setValue(
                            "workDate",
                            dayjs(newValue).format("YYYY-MM-DD")
                          )
                        }
                        format="YYYY-MM-DD"
                      />
                    )}
                  />
                </LocalizationProvider>
                <FormHelperText>
                  {errors.workDate && errors.workDate.message}
                </FormHelperText>
              </Box>
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

{/* 
  //================================= Time Picker==================
<div className="col-sm-12">
<Box sx={{}}>
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <Controller
      name="totalHours" // Make sure the name matches the field name in your form
      control={control}
      defaultValue="" // Set the default value here if needed
      rules={{ required: "Total Hours is Required." }}
      render={({ field }) => (
        <TimePicker
          label="Total Hours"
          {...field}
          error={Boolean(errors.totalHours)}
          helperText={
            errors.totalHours && errors.totalHours.message
          }
          renderInput={(props) => (
            <TextField {...props} fullWidth />
          )}
          onChange={(newValue) =>
            setValue(
              "totalHours",
              dayjs(newValue).format("HH:mm:ss")
            )
          }
          format="HH:mm:ss"
        />
      )}
    />
  </LocalizationProvider>
  <FormHelperText>
    {errors.totalHours && errors.totalHours.message}
  </FormHelperText>
</Box>
</div> */}
export default AddProjectDetails;
