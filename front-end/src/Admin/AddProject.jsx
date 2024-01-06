import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
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
    <div className="mainBody">
      <div className="mt-4">
        <h2 className="heading">Manage Project</h2>

        <form onSubmit={handleSubmit(id ? updateProject : onSubmit)}>
          <div className="gy-3 row">
            <div className="col-sm-12">
              <Box sx={{}}>
                <FormControl fullWidth>
                  <InputLabel id="demo-simple-select-label">
                    TL Name is Required
                  </InputLabel>
                  <Controller
                    name="tlID" // Make sure the name matches the field name in your form
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
                    {errors.tlID && errors.tlID.message}
                  </FormHelperText>
                </FormControl>
              </Box>
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="orderId"
                defaultValue=""
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
                    type="test"
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
                    label="Task / Job No"
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
                name="referenceNo"
                defaultValue=""
                rules={{ required: "Reference No is required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="Reference No"
                    variant="outlined"
                    type="number"
                    {...field}
                    error={Boolean(errors.referenceNo)}
                    helperText={
                      errors.referenceNo && errors.referenceNo.message
                    }
                  />
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="desciplineCode"
                defaultValue=""
                rules={{ required: "Reference No is required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="Descipline Code"
                    variant="outlined"
                    type="string"
                    {...field}
                    error={Boolean(errors.desciplineCode)}
                    helperText={
                      errors.desciplineCode && errors.desciplineCode.message
                    }
                  />
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="projectName"
                defaultValue=""
                rules={{ required: "ProjectName Name is required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="Enter Project Name"
                    variant="outlined"
                    type="text"
                    {...field}
                    error={Boolean(errors.projectName)}
                    helperText={
                      errors.projectName && errors.projectName.message
                    }
                  />
                )}
              />
            </div>

            <div className="col-sm-12">
              <Controller
                control={control}
                name="subDivision"
                defaultValue=""
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
            <div className="col-sm-4">
              <Box sx={{}}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name="startDate" // Make sure the name matches the field name in your form
                    control={control}
                    value={dayjs(formDatas?.startDate)}
                    defaultValue="" // Set the default value here if needed
                    rules={{ required: "Start Date is Required." }}
                    render={({ field }) => (
                      <DatePicker
                        label="Start Date"
                        // {...field}
                        value={dayjs(formDatas?.startDate)}
                        error={Boolean(errors.startDate)}
                        helperText={
                          errors.startDate && errors.startDate.message
                        }
                        renderInput={(props) => (
                          <TextField {...props} fullWidth />
                        )}
                        onChange={(newValue) =>
                          setValue(
                            "startDate",
                            dayjs(newValue).format("YYYY-MM-DD")
                          )
                        }
                        format="YYYY-MM-DD"
                      />
                    )}
                  />
                </LocalizationProvider>
                <FormHelperText>
                  {errors.startDate && errors.startDate.message}
                </FormHelperText>
              </Box>
            </div>

            <div className="col-sm-4">
              <Box sx={{}}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Controller
                    name="targetDate" // Make sure the name matches the field name in your form
                    control={control}
                    defaultValue="" // Set the default value here if needed
                    rules={{ required: "Target Date is Required." }}
                    render={({ field }) => (
                      <DatePicker
                        minDate={dayjs(formDatas?.startDate)}
                        label="Target Date"
                        value={dayjs(formDatas?.targetDate)}
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
            {/* <div className="col-sm-12">
              <Controller
                control={control}
                name="summary"
                defaultValue=""
                rules={{ required: "summary is required." }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="summary"
                    variant="outlined"
                    type="text"
                    {...field}
                    error={Boolean(errors.summary)}
                    helperText={errors.summary && errors.summary.message}
                  />
                )}
              />
            </div> */}
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
