import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import dayjs from "dayjs";
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
  Radio,
  RadioGroup,
  Select,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";

import commonData from "../../common.json";

function AddEmployee() {
  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      relievingDate: null,
      permanentDate: null,
      date: null
    }
  });
  let formDatas = watch();
  const navigate = useNavigate();
  const { id } = useParams();
  const [tempRole, setTempRole] = useState("Employee"); // Initialize tempRole state
  const [discipline, setDiscipline] = React.useState(null);
  const [designation, setdesignation] = React.useState(null);

  console.log(formDatas, "formDatasformDatas1212", discipline, designation);
  React.useEffect(() => {
    if (id) {
      getEmployeeDetails(id);
    }
  }, [id]);

  React.useEffect(() => {
    getDiscipline();
    getdesignation();
  }, []);

  const getDiscipline = () => {
    axios.get(`${commonData?.APIKEY}/discipline`).then((res) => {
      setDiscipline(res.data.Result);
    });
  };

  const getdesignation = () => {
    axios.get(`${commonData?.APIKEY}/designation`).then((res) => {
      setdesignation(res.data.Result);
    });
  };

  const getEmployeeDetails = async (id) => {
    await axios.get(`${commonData?.APIKEY}/get/${id}`).then((res) => {
      let tempData = {
        employeeName: res?.data?.Result[0]?.employeeName,
        EMPID: res?.data?.Result[0]?.EMPID,
        employeeEmail: res?.data?.Result[0]?.employeeEmail,
        userName: res?.data?.Result[0]?.userName,
        // password: res?.data?.Result[0]?.password,
        discipline: res?.data?.Result[0]?.discipline,
        designation: res?.data?.Result[0]?.designation,
        employeeStatus: res?.data?.Result[0]?.employeeStatus,
        date: res?.data?.Result[0]?.date,
        tempRole: res?.data?.Result[0]?.role,
        relievingDate: res?.data?.Result[0]?.relievingDate,
        permanentDate: res?.data?.Result[0]?.permanentDate,
      };
      setTempRole(res?.data?.Result[0]?.role);
      Object.keys(tempData).forEach((key) => {
        setValue(key, tempData[key]);
      });
    });
  };

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
    formdata.append("role", tempRole);
    axios
      .post(`${commonData?.APIKEY}/create`, formdata)
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
    let updatedRoles; // Create a copy of the tempRole array
    if (name === "TL") {
      updatedRoles = "TL"; // Add "Tl" role
    }
    if (name === "Admin") {
      updatedRoles = "Admin"; // Add "Admin" role
    }
    if (name === "Employee") {
      updatedRoles = "Employee";
    }
    if (name === "HR") {
      updatedRoles = "HR";
    }
    setTempRole(updatedRoles); // Update the state with the new roles array
    console.log(updatedRoles, "updatedRoles");
  };

  const updateUser = (data) => {
    const formdata = new FormData();
    // Append all fields except for the file input
    Object.keys(data).forEach((key) => {
      if (key !== "employeeImage") {
        const value = data[key];
        formdata.append(key, value);
      }
    });
    if (data.employeeImage) {
      console.log(data.employeeImage, "data.employeeImage");
      // Append the file input separately
      formdata.append("employeeImage", data.employeeImage);
    }

    formdata.append("role", tempRole);
    console.log(formdata, "formdataformdata");
    axios
      .put(`${commonData?.APIKEY}/update/${id}`, formdata)
      .then((res) => {
        if (res.data.Error) {
          alert(res.data.Error);
        } else {
          navigate("/Dashboard/employee");
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <div className="mainBody">
      <div className="mt-4">
        <h2 className="heading">Manage Employee</h2>

        <form onSubmit={handleSubmit(id ? updateUser : onSubmit)}>
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
                      placeholder="Enter Name"
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
                      placeholder="Employee ID"
                      variant="outlined"
                      type="text"
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
                render={({ field }) => (
                  <Box sx={{}}>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      placeholder="Enter Email"
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
                      placeholder="Enter Username"
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
                rules={{ required: "Password is required." }}
                render={({ field }) => (
                  <Box sx={{}}>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      placeholder="Enter password "
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
                        placeholder="Select Designation"
                        {...field}
                        error={Boolean(errors.discipline)}
                      >
                        {discipline?.map((res) => {
                          return (
                            <MenuItem value={res?.discipline}>
                              {res?.discipline}
                            </MenuItem>
                          );
                        })}
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
                        placeholder="Select Designation"
                        {...field}
                        error={Boolean(errors.designation)}
                      >
                        {designation?.map((res) => {
                          return (
                            <MenuItem value={res?.designation}>
                              {res?.designation}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    {errors.designation && errors.designation.message}
                  </FormHelperText>
                </FormControl>
              </Box>
            </div>
            <div className="col-sm-12">
              <Box sx={{}}>
                <FormControl fullWidth>
                  <InputLabel id="demo-simple-select-label">
                    Select Status
                  </InputLabel>
                  <Controller
                    name="employeeStatus" // Make sure the name matches the field name in your form
                    control={control}
                    rules={{ required: "Employee Status is Required." }}
                    defaultValue="" // Set the default value here if needed
                    render={({ field }) => (
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        placeholder="Select Status"
                        {...field}
                        error={Boolean(errors.designation)}
                      >
                        <MenuItem value={"Probation"}>Probation</MenuItem>
                        <MenuItem value={"Contract"}>Contract</MenuItem>
                        <MenuItem value={"Traning"}>Traning</MenuItem>
                        <MenuItem value={"Permanent"}>Permanent</MenuItem>
                        <MenuItem value={"Ex-Employee"}>Ex-Employee</MenuItem>
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    {errors.employeeStatus && errors.employeeStatus.message}
                  </FormHelperText>
                </FormControl>
              </Box>
            </div>

            <div className="col-sm-3">
              <label>Join Date</label>
              <Box sx={{}}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name="date"
                    control={control}
                    rules={{ required: "Join date Status is Required." }}
                    render={({ field }) => (
                      <DatePicker
                        placeholder="Date Of Join"
                        value={dayjs(formDatas?.date)}
                        renderInput={(props) => (
                          <TextField {...props} fullWidth />
                        )}
                        onChange={(newValue) => {
                          // Convert the selected date to the desired format (YYYY-MM-DD) and update the state using setValue
                          const formattedDate =
                            dayjs(newValue).format("YYYY-MM-DD");
                          setValue("date", formattedDate);
                        }}
                        format="YYYY-MM-DD"
                      />
                    )}
                  />
                </LocalizationProvider>
                <p style={{color: "red"}}>{errors.date && "Join date required"}</p>
              </Box>
            </div>
            <div className="col-sm-3">
              <label>Relieving date</label>
              <Box sx={{}}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name="relievingDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        placeholder="Reliving date"
                        value={dayjs(formDatas?.relievingDate)}
                        renderInput={(props) => (
                          <TextField {...props} fullWidth />
                        )}
                        defaultValue={null}
                        onChange={(newValue) => {
                          // Convert the selected date to the desired format (YYYY-MM-DD) and update the state using setValue
                          const formattedDate =
                            dayjs(newValue).format("YYYY-MM-DD");
                          setValue("relievingDate", formattedDate);
                        }}
                        format="YYYY-MM-DD"
                      />
                    )}
                  />
                </LocalizationProvider>
              </Box>
            </div>
            <div className="col-sm-3">
              <label>Permanent date</label>
              <Box sx={{}}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name="permanentDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        placeholder="Date Of Permanent"
                        value={dayjs(formDatas?.permanentDate)}
                        renderInput={(props) => (
                          <TextField {...props} fullWidth />
                        )}
                        defaultValue={null}
                        onChange={(newValue) => {
                          // Convert the selected date to the desired format (YYYY-MM-DD) and update the state using setValue
                          const formattedDate =
                            dayjs(newValue).format("YYYY-MM-DD");
                          setValue("permanentDate", formattedDate);
                        }}
                        format="YYYY-MM-DD"
                      />
                    )}
                  />
                </LocalizationProvider>
              </Box>
            </div>
            <div className="col-sm-3 d-flex align-items-center">
              <Box sx={{}}>
                <FormControl fullWidth>
                  <RadioGroup
                    row
                    value={tempRole}
                    aria-labelledby="demo-row-radio-buttons-group-label"
                    name="row-radio-buttons-group"
                    onChange={(e) =>
                      handleOnChange(e.target.value, e.target.checked)
                    }
                  >
                    <FormControlLabel
                      value="TL"
                      control={<Radio />}
                      label="TL"
                    />
                    <FormControlLabel
                      value="Admin"
                      control={<Radio />}
                      label="Admin"
                    />
                    <FormControlLabel
                      value="HR"
                      control={<Radio />}
                      label="HR"
                    />
                    <FormControlLabel
                      value="Employee"
                      control={<Radio />}
                      label="Employee"
                    />
                  </RadioGroup>
                  <FormGroup
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  ></FormGroup>
                </FormControl>
              </Box>
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="employeeImage"
                render={({ field }) => (
                  <Box>
                    <input
                      label="Employee Image"
                      variant="outlined"
                      accept=".jpg, .png, .jpeg"
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
