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
import commonData from "../../common.json";
function AddLead() {
  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm();
  const navigate = useNavigate();
  const [empList, setEmpList] = useState(null);
  useEffect(() => {
    axios
      .get(`${commonData?.APIKEY}/getEmployee`)
      .then((res) => {
        if (res.data.Status === "Success") {
          let filterted = res?.data?.Result.filter(
            (item) => item.role === "TL" || item.role === "Admin"
          );
          console.log(filterted, "filterted134");
          setEmpList(filterted);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  }, []);

  const onSubmit = (data) => {
    let foundEmployee = empList?.find((employee) => employee.EMPID === data?.EMPID);
    let tempData = {
      ...data,
      leadName: foundEmployee?.employeeName,
    };
    console.log(data, "tests213", tempData);

    axios
      .post(`${commonData?.APIKEY}/lead/create`, tempData)
      .then((res) => {
        console.log(res, "2342");
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
                    name="EMPID" // Make sure the name matches the field name in your form
                    control={control}
                    rules={{ required: "Name is Required." }}
                    defaultValue="" // Set the default value here if needed
                    render={({ field }) => (
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        label="Select Designation"
                        {...field}
                        error={Boolean(errors.EMPID)}
                      >
                        {empList?.map((res) => (
                          <MenuItem value={res?.EMPID} key={res.id}>
                            {res?.employeeName}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    {errors.EMPID && errors.EMPID.message}
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
