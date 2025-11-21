import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import {
  Folder,
  Person,
  Assignment,
  Work,
  AccessTime,
  Save,
} from "@mui/icons-material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import commonData from "../../common.json"
function AddProjectDetails(props) {
  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm();
  const navigate = useNavigate();
  const [projectList, setProjectList] = useState(null);
  const [projectNameList, setProjectNameList] = useState(null);
  const token = localStorage.getItem("token");
  const formDatas = watch();
  console.log(projectList, "projectList", formDatas);

  useEffect(() => {
    axios.post(`${commonData?.APIKEY}/dashboard`, { tokensss: token }).then((res) => {
      setValue("employeeName", res?.data?.employeeName);
    });
    getProjectList();
  }, []);

  useEffect(() => {
    if (projectList?.length > 0) {
      console.log(projectList, "98098");
      setProjectNameList(projectList?.map((employee) => employee.projectName));
    }
  }, [projectList]);

  useEffect(() => {
    if (formDatas.projectName !== "") {
      let tlName = projectList?.filter(
        (items) => items.projectName === formDatas?.projectName
      );
      setValue("tlName", tlName?.[0]?.tlName);
      setValue("sentDate", new Date())
    }
  }, [formDatas.projectName]);

  const getProjectList = () => {
    axios
      .get(`${commonData?.APIKEY}/getProject`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setProjectList(res.data.Result);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const onSubmit = (data) => {
    console.log(data, "tests213");
    // Perform any other actions you want with the form data
    axios
      .post(`${commonData?.APIKEY}/project/addWorkDetails`, data)
      .then((res) => {
        if (res.data.Error) {
          alert(res.data.Error);
        } else {
          navigate("/Employee");
          props.onSubmitValue(true);
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", maxWidth: 1200, mx: "auto" }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 4 }}>
            <Folder color="primary" />
            <Typography variant="h5" fontWeight="bold">
              Add Project Details
            </Typography>
          </Box>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="project-name-label">Project Name</InputLabel>
                  <Controller
                    name="projectName"
                    control={control}
                    rules={{ required: "project Name " }}
                    defaultValue=""
                    render={({ field }) => (
                      <Select
                        labelId="project-name-label"
                        id="project-name"
                        label="Project Name"
                        {...field}
                        error={Boolean(errors.projectName)}
                        startAdornment={<Folder sx={{ mr: 1, color: "text.secondary" }} />}
                      >
                        {projectNameList?.map((res) => (
                          <MenuItem key={res} value={res}>{res}</MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <FormHelperText>
                    {errors.projectName && errors.projectName.message}
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  control={control}
                  name="tlName"
                  defaultValue=""
                  rules={{ required: "TL Name is required." }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      disabled={true}
                      label="TL Name"
                      variant="outlined"
                      type="text"
                      {...field}
                      error={Boolean(errors.tlName)}
                      helperText={errors.tlName && errors.tlName.message}
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: "text.secondary" }} />,
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  control={control}
                  name="taskNo"
                  defaultValue=""
                  rules={{ required: "Task Number required." }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Task Number"
                      variant="outlined"
                      type="number"
                      {...field}
                      error={Boolean(errors.taskNo)}
                      helperText={errors.taskNo && errors.taskNo.message}
                      InputProps={{
                        startAdornment: <Assignment sx={{ mr: 1, color: "text.secondary" }} />,
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  control={control}
                  name="areaofWork"
                  defaultValue=""
                  rules={{ required: "Area Of Work  is required." }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Area Of Work"
                      variant="outlined"
                      type="text"
                      {...field}
                      error={Boolean(errors.areaofWork)}
                      helperText={errors.areaofWork && errors.areaofWork.message}
                      InputProps={{
                        startAdornment: <Work sx={{ mr: 1, color: "text.secondary" }} />,
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                  Weekly Hours
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Controller
                  control={control}
                  name="monday"
                  defaultValue=""
                  rules={{ required: "Work Hour required." }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Monday"
                      variant="outlined"
                      type="number"
                      {...field}
                      error={Boolean(errors.monday)}
                      helperText={errors.monday && errors.monday.message}
                      InputProps={{
                        startAdornment: <AccessTime sx={{ mr: 1, color: "text.secondary", fontSize: 16 }} />,
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Controller
                  control={control}
                  name="tuesday"
                  defaultValue=""
                  rules={{ required: "Work Hour required." }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Tuesday"
                      variant="outlined"
                      type="number"
                      {...field}
                      error={Boolean(errors.tuesday)}
                      helperText={errors.tuesday && errors.tuesday.message}
                      InputProps={{
                        startAdornment: <AccessTime sx={{ mr: 1, color: "text.secondary", fontSize: 16 }} />,
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Controller
                  control={control}
                  name="wednesday"
                  defaultValue=""
                  rules={{ required: "Work Hour required." }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Wednesday"
                      variant="outlined"
                      type="number"
                      {...field}
                      error={Boolean(errors.wednesday)}
                      helperText={errors.wednesday && errors.wednesday.message}
                      InputProps={{
                        startAdornment: <AccessTime sx={{ mr: 1, color: "text.secondary", fontSize: 16 }} />,
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Controller
                  control={control}
                  name="thursday"
                  defaultValue=""
                  rules={{ required: "Work Hour required." }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Thursday"
                      variant="outlined"
                      type="number"
                      {...field}
                      error={Boolean(errors.thursday)}
                      helperText={errors.thursday && errors.thursday.message}
                      InputProps={{
                        startAdornment: <AccessTime sx={{ mr: 1, color: "text.secondary", fontSize: 16 }} />,
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Controller
                  control={control}
                  name="friday"
                  defaultValue=""
                  rules={{ required: "Work Hour required." }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Friday"
                      variant="outlined"
                      type="number"
                      {...field}
                      error={Boolean(errors.friday)}
                      helperText={errors.friday && errors.friday.message}
                      InputProps={{
                        startAdornment: <AccessTime sx={{ mr: 1, color: "text.secondary", fontSize: 16 }} />,
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Controller
                  control={control}
                  name="saturday"
                  defaultValue=""
                  rules={{ required: "Work Hour required." }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Saturday"
                      variant="outlined"
                      type="number"
                      {...field}
                      error={Boolean(errors.saturday)}
                      helperText={errors.saturday && errors.saturday.message}
                      InputProps={{
                        startAdornment: <AccessTime sx={{ mr: 1, color: "text.secondary", fontSize: 16 }} />,
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Controller
                  control={control}
                  name="sunday"
                  defaultValue=""
                  rules={{ required: "Work Hour required." }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Sunday"
                      variant="outlined"
                      type="number"
                      {...field}
                      error={Boolean(errors.sunday)}
                      helperText={errors.sunday && errors.sunday.message}
                      InputProps={{
                        startAdornment: <AccessTime sx={{ mr: 1, color: "text.secondary", fontSize: 16 }} />,
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  control={control}
                  name="totalHours"
                  defaultValue=""
                  rules={{ required: "Total Hours required." }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      label="Total Hours"
                      variant="outlined"
                      type="number"
                      {...field}
                      error={Boolean(errors.totalHours)}
                      helperText={errors.totalHours && errors.totalHours.message}
                      InputProps={{
                        startAdornment: <AccessTime sx={{ mr: 1, color: "text.secondary" }} />,
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
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
                  Submit
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default AddProjectDetails;
