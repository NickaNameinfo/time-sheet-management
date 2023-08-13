import React, { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import dayjs from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

function addLeaveDetails() {
  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm();
  const navigate = useNavigate();
  let formData = watch();

  console.log(formData, "formData");

  useEffect(() => {
    axios.get("http://localhost:8081/dashboard").then((res) => {
      setValue("employeeName", res?.data?.userName);
    });
  }, []);

  useEffect(() => {
    if (formData.leaveFrom !== "" && formData?.leaveTo !== "") {
      const timeDifference = Math.abs(
        new Date(formData.leaveTo) - new Date(formData.leaveFrom)
      );
      let Difference_In_Days = timeDifference / (1000 * 3600 * 24);
      setValue("leaveHours", Difference_In_Days);
    }
  }, [formData.leaveFrom, formData.leaveTo]);

  const onSubmit = (data) => {
    console.log(data, "tests213");
    // Perform any other actions you want with the form data
    axios
      .post("http://localhost:8081/applyLeave", data)
      .then((res) => {
        if (res.data.Error) {
          alert(res.data.Error);
        } else {
          navigate("/employee");
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
                    Leave Type is Required
                  </InputLabel>
                  <Controller
                    name="leaveType" // Make sure the name matches the field name in your form
                    control={control}
                    rules={{ required: "Leave Type is Required" }}
                    defaultValue="" // Set the default value here if needed
                    render={({ field }) => (
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        label="Leave Type is Required"
                        {...field}
                        error={Boolean(errors.leaveType)}
                      >
                        <MenuItem value={"Vecation"}>Vecation</MenuItem>
                        <MenuItem value={"Sick Leave"}>Sick Leave</MenuItem>
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    {errors.leaveType && errors.leaveType.message}
                  </FormHelperText>
                </FormControl>
              </Box>
            </div>
            <div className="col-sm-12 d-flex align-items-center">
              <div className="col-sm-4">
                <Box sx={{}}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Controller
                      fullWidth
                      name="leaveFrom" // Make sure the name matches the field name in your form
                      control={control}
                      defaultValue="" // Set the default value here if needed
                      rules={{ required: "Work Date From is Required." }}
                      render={({ field }) => (
                        <DatePicker
                          label="Work Date From"
                          {...field}
                          error={Boolean(errors.leaveFrom)}
                          helperText={
                            errors.leaveFrom && errors.leaveFrom.message
                          }
                          renderInput={(props) => (
                            <TextField {...props} fullWidth />
                          )}
                          onChange={(newValue) =>
                            setValue(
                              "leaveFrom",
                              dayjs(newValue).format("YYYY-MM-DD")
                            )
                          }
                          format="YYYY-MM-DD"
                        />
                      )}
                    />
                  </LocalizationProvider>
                  <FormHelperText>
                    {errors.leaveFrom && errors.leaveFrom.message}
                  </FormHelperText>
                </Box>
              </div>
              <div className="col-sm-4">
                <Box>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Controller
                      fullWidth:fullWidth
                      name="leaveTo" // Make sure the name matches the field name in your form
                      control={control}
                      defaultValue="" // Set the default value here if needed
                      rules={{ required: "Leave To is Required." }}
                      render={({ field }) => (
                        <DatePicker
                          label="Leave To"
                          {...field}
                          error={Boolean(errors.leaveTo)}
                          helperText={errors.leaveTo && errors.leaveTo.message}
                          renderInput={(props) => (
                            <TextField {...props} fullWidth />
                          )}
                          onChange={(newValue) =>
                            setValue(
                              "leaveTo",
                              dayjs(newValue).format("YYYY-MM-DD")
                            )
                          }
                          format="YYYY-MM-DD"
                        />
                      )}
                    />
                  </LocalizationProvider>
                  <FormHelperText>
                    {errors.leaveTo && errors.leaveTo.message}
                  </FormHelperText>
                </Box>{" "}
              </div>
            </div>

            <div className="col-sm-12">
              <Controller
                control={control}
                name="leaveHours"
                defaultValue=""
                rules={{ required: "Leave Hours required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="Leave Hours"
                    variant="outlined"
                    type="number"
                    {...field}
                    error={Boolean(errors.leaveHours)}
                    helperText={errors.leaveHours && errors.leaveHours.message}
                  />
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="reason"
                defaultValue=""
                rules={{ required: "Reason is required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="Reason"
                    variant="outlined"
                    type="text"
                    {...field}
                    error={Boolean(errors.reason)}
                    helperText={errors.reason && errors.reason.message}
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

export default addLeaveDetails;
