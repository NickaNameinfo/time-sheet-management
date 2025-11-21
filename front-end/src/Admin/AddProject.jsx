import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  FormHelperText,
  IconButton,
  Stack,
} from "@mui/material";
import {
  ArrowBack,
  Person,
  Business,
  Save,
  CalendarToday,
  AccessTime,
} from "@mui/icons-material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import commonData from "../../common.json";
function AddProject() {
  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm();
  const [empList, setEmpList] = useState(null);
  const [rowData, setRowData] = useState([]);

  let formDatas = watch();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    axios
      .get(`${commonData?.APIKEY}/getEmployee`)
      .then((res) => {
        if (res.data.Status === "Success") {
          console.log(res.data.Result, "setEmpListsetEmpList");
          let filterted = res?.data?.Result.filter(
            (item) => item.role === "TL" || item.role === "Admin"
          );
          setEmpList(filterted);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
    getProjectDetails();
  }, []);

  React.useEffect(() => {
    if (id) {
      getEmployeeDetails(id);
    }
  }, [id]);

  const onSubmit = (data) => {
    const isNumberIncluded = rowData.some(
      (item) => Number(item.referenceNo) === Number(formDatas?.referenceNo)
    );
    // const isProjectNoIncluded = rowData.some(
    //   (item) => Number(item.projectNo) === Number(formDatas?.projectNo)
    // );
    // else if (isProjectNoIncluded) {
    //   alert(`${formDatas?.referenceNo} is already existing in Project No`);
    // }
    console.log(rowData, "rowData321423", isNumberIncluded);
    if (isNumberIncluded) {
      alert(`${formDatas?.referenceNo} is already existing in Reference No`);
    } else {
      let foundEmployee = empList?.find(
        (employee) => employee.EMPID === data?.tlID
      );
      let tempData = {
        ...data,
        tlName: foundEmployee?.employeeName,
      };
      console.log(tempData, "tempData123342")
      axios
        .post(`${commonData?.APIKEY}/project/create`, tempData)
        .then((res) => {
          if (res.data.Error) {
            alert(res.data.Error);
          } else {
            navigate("/Dashboard/Projects");
          }
        })
        .catch((err) => console.log(err));
    }
  };

  const getEmployeeDetails = async (id) => {
    await axios.get(`${commonData?.APIKEY}/getProject/${id}`).then((res) => {
      console.log(res, "res2342342");
      let tempData = {
        tlID: res?.data?.Result?.tlID,
        orderId: res?.data?.Result?.orderId,
        positionNumber: res?.data?.Result?.positionNumber,
        subPositionNumber: res?.data?.Result?.subPositionNumber,
        projectNo: res?.data?.Result?.projectNo,
        taskJobNo: res?.data?.Result?.taskJobNo,
        referenceNo: res?.data?.Result?.referenceNo,
        desciplineCode: res?.data?.Result?.desciplineCode,
        projectName: res?.data?.Result?.projectName,
        subDivision: res?.data?.Result?.subDivision,
        startDate: res?.data?.Result?.startDate,
        targetDate: res?.data?.Result?.targetDate,
        allotatedHours: res?.data?.Result?.allotatedHours,
      };
      Object.keys(tempData).forEach((key) => {
        setValue(key, tempData[key]);
      });
    });
  };

  const updateProject = (data) => {
    let foundEmployee = empList?.find(
      (employee) => employee.EMPID === data?.tlID
    );
    let tempData = {
      ...data,
      tlName: foundEmployee?.employeeName,
    };
    console.log(tempData, "tempData123")
    axios
      .put(`${commonData?.APIKEY}/project/update/${id}`, tempData)
      .then((res) => {
        if (res.data.Error) {
          alert(res.data.Error);
        } else {
          navigate("/Dashboard/Projects");
        }
      })
      .catch((err) => console.log(err));
  };

  const getProjectDetails = () => {
    axios
      .get(`${commonData?.APIKEY}/getProject`)
      .then((res) => {
        if (res.data.Status === "Success") {
          console.log(res.data.Result, "rowData321423");
          setRowData(res.data.Result);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 2 }}>
        <IconButton onClick={() => navigate("/Dashboard/Projects")} color="primary">
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {id ? "Edit Project" : "Add New Project"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {id ? "Update project information" : "Create a new project"}
          </Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit(id ? updateProject : onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                  Project Information
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth error={Boolean(errors.tlID)}>
                      <InputLabel id="tl-select-label">Team Lead</InputLabel>
                      <Controller
                        name="tlID"
                        control={control}
                        rules={{ required: "Team Lead is required" }}
                        defaultValue=""
                        render={({ field }) => (
                          <Select
                            labelId="tl-select-label"
                            label="Team Lead"
                            {...field}
                            startAdornment={<Person sx={{ mr: 1, color: "text.secondary" }} />}
                          >
                            {empList?.map((res) => (
                              <MenuItem value={res?.EMPID} key={res.id}>
                                {res?.employeeName} ({res?.EMPID})
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                      <FormHelperText>
                        {errors.tlID && errors.tlID.message}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="orderId"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Order ID"
                          type="number"
                          error={Boolean(errors.orderId)}
                          helperText={errors.orderId?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="positionNumber"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Position Number"
                          type="number"
                          error={Boolean(errors.positionNumber)}
                          helperText={errors.positionNumber?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="subPositionNumber"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Sub Position Number"
                          type="number"
                          error={Boolean(errors.subPositionNumber)}
                          helperText={errors.subPositionNumber?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="projectNo"
                      control={control}
                      defaultValue=""
                      rules={{ required: "Project No is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Project No"
                          error={Boolean(errors.projectNo)}
                          helperText={errors.projectNo?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="taskJobNo"
                      control={control}
                      defaultValue=""
                      rules={{ required: "Task/Job No is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Task / Job No"
                          type="number"
                          error={Boolean(errors.taskJobNo)}
                          helperText={errors.taskJobNo?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="referenceNo"
                      control={control}
                      defaultValue=""
                      rules={{ required: "Reference No is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Reference No"
                          type="number"
                          error={Boolean(errors.referenceNo)}
                          helperText={errors.referenceNo?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="desciplineCode"
                      control={control}
                      defaultValue=""
                      rules={{ required: "Discipline Code is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Discipline Code"
                          error={Boolean(errors.desciplineCode)}
                          helperText={errors.desciplineCode?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="projectName"
                      control={control}
                      defaultValue=""
                      rules={{ required: "Project Name is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Project Name"
                          error={Boolean(errors.projectName)}
                          helperText={errors.projectName?.message}
                          InputProps={{
                            startAdornment: (
                              <Business sx={{ mr: 1, color: "text.secondary" }} />
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="subDivision"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Sub Division"
                          error={Boolean(errors.subDivision)}
                          helperText={errors.subDivision?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Controller
                        name="startDate"
                        control={control}
                        rules={{ required: "Start Date is required" }}
                        render={({ field }) => (
                          <DatePicker
                            label="Start Date"
                            value={formDatas?.startDate ? dayjs(formDatas.startDate) : null}
                            onChange={(newValue) =>
                              setValue(
                                "startDate",
                                newValue ? dayjs(newValue).format("YYYY-MM-DD") : ""
                              )
                            }
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: Boolean(errors.startDate),
                                helperText: errors.startDate?.message,
                                InputProps: {
                                  startAdornment: (
                                    <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />
                                  ),
                                },
                              },
                            }}
                          />
                        )}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Controller
                        name="targetDate"
                        control={control}
                        rules={{ required: "Target Date is required" }}
                        render={({ field }) => (
                          <DatePicker
                            label="Target Date"
                            minDate={formDatas?.startDate ? dayjs(formDatas.startDate) : undefined}
                            value={formDatas?.targetDate ? dayjs(formDatas.targetDate) : null}
                            onChange={(newValue) =>
                              setValue(
                                "targetDate",
                                newValue ? dayjs(newValue).format("YYYY-MM-DD") : ""
                              )
                            }
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: Boolean(errors.targetDate),
                                helperText: errors.targetDate?.message,
                                InputProps: {
                                  startAdornment: (
                                    <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />
                                  ),
                                },
                              },
                            }}
                          />
                        )}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="allotatedHours"
                      control={control}
                      defaultValue=""
                      rules={{ required: "Allotted Hours is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Allotted Hours"
                          type="number"
                          error={Boolean(errors.allotatedHours)}
                          helperText={errors.allotatedHours?.message}
                          InputProps={{
                            startAdornment: (
                              <AccessTime sx={{ mr: 1, color: "text.secondary" }} />
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate("/Dashboard/Projects")}
            size="large"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<Save />}
            size="large"
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            {id ? "Update Project" : "Create Project"}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

export default AddProject;
