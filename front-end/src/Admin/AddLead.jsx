import React, { useEffect, useState } from "react";
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

function AddLead() {
  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm();
  const navigate = useNavigate();
  const [empList, setEmpList] = useState(null);
  
  useEffect((params) => {
    axios
      .get("http://localhost:8081/getEmployee")
      .then((res) => {
        if (res.data.Status === "Success") {
          console.log(res.data.Result, "setEmpListsetEmpList");
          setEmpList(res.data.Result.map((employee) => employee.employeeName));
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  }, []);

  const onSubmit = (data) => {
    console.log(data, "tests213");
    axios
      .post("http://localhost:8081/lead/create", data)
      .then((res) => {
        if (res.data.Error) {
          alert(res.data.Error);
        } else {
          navigate("/Dashboard/lead");
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <div className="mainBody">
      <div className="mt-4">
        <h2 className="heading">Manage Lead</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="gy-3 row">
            <div className="col-sm-12">
              <Box sx={{}}>
                <FormControl fullWidth>
                  <InputLabel id="demo-simple-select-label">
                    Select Name
                  </InputLabel>
                  <Controller
                    name="leadName" // Make sure the name matches the field name in your form
                    control={control}
                    rules={{ required: "Name is Required." }}
                    defaultValue="" // Set the default value here if needed
                    render={({ field }) => (
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        label="Select Designation"
                        {...field}
                        error={Boolean(errors.leadName)}
                      >
                        {empList?.map((res) => (
                          <MenuItem value={res}>{res}</MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    {errors.leadName && errors.leadName.message}
                  </FormHelperText>
                </FormControl>
              </Box>
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="teamName"
                rules={{ required: "Name is required." }}
                render={({ field }) => (
                  <Box>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Enter Team Name"
                      variant="outlined"
                      type="text"
                      {...field}
                      error={Boolean(errors.teamName)}
                      helperText={errors.teamName && errors.teamName.message}
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
          </div>
          <button type="submit" className="btn btn-primary button">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddLead;
