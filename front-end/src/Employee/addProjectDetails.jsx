import React, { useEffect, useState } from "react";
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
    <form onSubmit={handleSubmit(onSubmit)} className="formDesign">
      <div className="gy-3 row">
        <div className="col-sm-6">
          <Box sx={{}}>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">
                Project Name
              </InputLabel>
              <Controller
                name="projectName" // Make sure the name matches the field name in your form
                control={control}
                rules={{ required: "project Name " }}
                defaultValue="" // Set the default value here if needed
                render={({ field }) => (
                  <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    label="Project Name is Required"
                    {...field}
                    error={Boolean(errors.projectName)}
                  >
                    {projectNameList?.map((res) => (
                      <MenuItem value={res}>{res}</MenuItem>
                    ))}
                  </Select>
                )}
              />
              <FormHelperText>
                {errors.projectName && errors.projectName.message}
              </FormHelperText>
            </FormControl>
          </Box>
        </div>
        <div className="col-sm-6">
          <Controller
            control={control}
            name="tlName"
            defaultValue=""
            rules={{ required: "TL Name is required." }}
            render={({ field }) => (
              <TextField
                fullWidth
                disabled={true}
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
        <div className="col-sm-6">
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
        <div className="col-sm-6">
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
        <div className="col">
          <Controller
            control={control}
            name="monday"
            defaultValue=""
            rules={{ required: "Work Hour required." }}
            render={({ field }) => (
              <TextField
                fullWidth
                id="outlined-basic fullWidth"
                label="Monday"
                variant="outlined"
                type="number"
                {...field}
                error={Boolean(errors.monday)}
                helperText={errors.monday && errors.monday.message}
              />
            )}
          />
        </div>
        <div className="col">
          <Controller
            control={control}
            name="tuesday"
            defaultValue=""
            rules={{ required: "Work Hour required." }}
            render={({ field }) => (
              <TextField
                fullWidth
                id="outlined-basic fullWidth"
                label="Tuesday"
                variant="outlined"
                type="number"
                {...field}
                error={Boolean(errors.tuesday)}
                helperText={errors.tuesday && errors.tuesday.message}
              />
            )}
          />
        </div>
        <div className="col">
          <Controller
            control={control}
            name="wednesday"
            defaultValue=""
            rules={{ required: "Work Hour required." }}
            render={({ field }) => (
              <TextField
                fullWidth
                id="outlined-basic fullWidth"
                label="Wednesday"
                variant="outlined"
                type="number"
                {...field}
                error={Boolean(errors.wednesday)}
                helperText={errors.wednesday && errors.wednesday.message}
              />
            )}
          />
        </div>
        <div className="col">
          <Controller
            control={control}
            name="thursday"
            defaultValue=""
            rules={{ required: "Work Hour required." }}
            render={({ field }) => (
              <TextField
                fullWidth
                id="outlined-basic fullWidth"
                label="Thursday"
                variant="outlined"
                type="number"
                {...field}
                error={Boolean(errors.thursday)}
                helperText={errors.thursday && errors.thursday.message}
              />
            )}
          />
        </div>
        <div className="col">
          <Controller
            control={control}
            name="friday"
            defaultValue=""
            rules={{ required: "Work Hour required." }}
            render={({ field }) => (
              <TextField
                fullWidth
                id="outlined-basic fullWidth"
                label="Friday"
                variant="outlined"
                type="number"
                {...field}
                error={Boolean(errors.friday)}
                helperText={errors.friday && errors.friday.message}
              />
            )}
          />
        </div>
        <div className="col">
          <Controller
            control={control}
            name="saturday"
            defaultValue=""
            rules={{ required: "Work Hour required." }}
            render={({ field }) => (
              <TextField
                fullWidth
                id="outlined-basic fullWidth"
                label="Saturday"
                variant="outlined"
                type="number"
                {...field}
                error={Boolean(errors.saturday)}
                helperText={errors.saturday && errors.saturday.message}
              />
            )}
          />
        </div>
        <div className="col">
          <Controller
            control={control}
            name="sunday"
            defaultValue=""
            rules={{ required: "Work Hour required." }}
            render={({ field }) => (
              <TextField
                fullWidth
                id="outlined-basic fullWidth"
                label="Sunday"
                variant="outlined"
                type="number"
                {...field}
                error={Boolean(errors.sunday)}
                helperText={errors.sunday && errors.sunday.message}
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
      </div>
      <button type="submit" className="btn btn-primary button">
        Submit
      </button>
    </form>
  );
}

export default AddProjectDetails;
