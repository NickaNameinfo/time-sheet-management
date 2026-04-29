import React, { useEffect, useState } from "react";
import api from "../services/api";
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
  Stack,
  Chip,
  OutlinedInput,
  Autocomplete,
  Paper,
} from "@mui/material";
import {
  Person,
  Business,
  Save,
  CalendarToday,
  AccessTime,
  People,
  CheckCircle,
  PauseCircle,
  Cancel,
  PlayArrow,
} from "@mui/icons-material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import PageHeaderBreadcrumbs from "../components/PageHeaderBreadcrumbs";

function AddProject() {
  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm();
  const [empList, setEmpList] = useState(null); // For Team Lead selection
  const [allEmployees, setAllEmployees] = useState([]); // For employee assignment
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [existingProjects, setExistingProjects] = useState([]);
  const [existingProjectNos, setExistingProjectNos] = useState([]);
  const [existingDisciplineCodes, setExistingDisciplineCodes] = useState([]);
  const [disciplineRules, setDisciplineRules] = useState([]); // From Settings > Discipline Rules (name + code)
  const [planHoursSummary, setPlanHoursSummary] = useState({
    loading: false,
    totalPlanAllotted: 0,
    totalPlanUtilized: 0,
    progressPercent: 0,
  });

  let formDatas = watch();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    // Fetch team leads for TL selection
    api
      .get("/getEmployee")
      .then((res) => {
        if (res.data.Status === "Success") {
          let filterted = res?.data?.Result.filter(
            (item) => item.role === "TL" || item.role === "Admin"
          );
          setEmpList(filterted);
          
          // Store all employees for assignment
          setAllEmployees(res?.data?.Result || []);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));

    // Fetch existing projects to get project numbers and discipline codes
    api
      .get("/getProject")
      .then((res) => {
        if (res.data.Status === "Success") {
          const projects = res.data.Result || [];
          setExistingProjects(projects);
          const projectNos = [...new Set(projects.map((p) => p.projectNo).filter(Boolean))];
          setExistingProjectNos(projectNos.sort());
          const disciplineCodes = [...new Set(projects.map((p) => p.desciplineCode).filter(Boolean))];
          setExistingDisciplineCodes(disciplineCodes.sort());
        }
      })
      .catch((err) => console.log(err));

    // Fetch discipline rules (name + code) for project creation dropdown
    api
      .get("/discipline")
      .then((res) => {
        if (res.data.Status === "Success") {
          const list = (res.data.Result || []).filter((d) => d.discipline_code != null && d.discipline_code !== "");
          setDisciplineRules(list);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  React.useEffect(() => {
    if (id) {
      getEmployeeDetails(id);
    }
  }, [id]);

  const onSubmit = (data) => {
    let foundEmployee = empList?.find(
      (employee) => employee.id === data?.tlID
    );
    let tempData = {
      ...data,
      tlName: foundEmployee?.employeeName,
      employeeIds: selectedEmployees, // Include selected employee IDs
    };
    api
      .post("/project/create", tempData)
      .then((res) => {
        if (res.data.Error) {
          alert(res.data.Error);
        } else {
          navigate("/Dashboard/Projects");
        }
      })
      .catch((err) => console.log(err));
  };

  const getEmployeeDetails = async (id) => {
    await api.get(`/getProject/${id}`).then((res) => {
      let tempData = {
        tlID: res?.data?.Result?.tlID,
        projectNo: res?.data?.Result?.projectNo,
        desciplineCode: res?.data?.Result?.desciplineCode,
        projectName: res?.data?.Result?.projectName,
        subDivision: res?.data?.Result?.subDivision,
        startDate: res?.data?.Result?.startDate,
        targetDate: res?.data?.Result?.targetDate,
        allotatedHours: res?.data?.Result?.allotatedHours,
        status: res?.data?.Result?.status || 'active',
        description: res?.data?.Result?.description || '',
      };
      Object.keys(tempData).forEach((key) => {
        setValue(key, tempData[key]);
      });
      
      // Set selected employees if available
      if (res?.data?.Result?.assignedEmployees && Array.isArray(res?.data?.Result?.assignedEmployees)) {
        setSelectedEmployees(res.data.Result.assignedEmployees);
      }
    });

    // Fetch project plan totals (used hours) for this project
    try {
      setPlanHoursSummary((prev) => ({ ...prev, loading: true }));
      const plansRes = await api.get("/project-plan", { params: { project_id: id } });
      const plans = plansRes.data?.Result || plansRes.data?.data?.Result || plansRes.data?.data || [];
      const list = Array.isArray(plans) ? plans : [];
      const totalPlanAllotted = list.reduce((sum, p) => sum + (parseFloat(p.total_allotted_hours) || 0), 0);
      const totalPlanUtilized = list.reduce((sum, p) => sum + (parseFloat(p.utilized_hours) || 0), 0);
      const progressPercent =
        totalPlanAllotted > 0 ? Math.min(100, Math.round((totalPlanUtilized / totalPlanAllotted) * 100)) : 0;
      setPlanHoursSummary({
        loading: false,
        totalPlanAllotted: Math.round(totalPlanAllotted * 100) / 100,
        totalPlanUtilized: Math.round(totalPlanUtilized * 100) / 100,
        progressPercent,
      });
    } catch (e) {
      setPlanHoursSummary((prev) => ({ ...prev, loading: false }));
    }
  };

  const updateProject = (data) => {
    let foundEmployee = empList?.find(
      (employee) => employee.id === data?.tlID
    );
    let tempData = {
      ...data,
      tlName: foundEmployee?.employeeName,
      employeeIds: selectedEmployees, // Include selected employee IDs
    };
    api
      .put(`/project/update/${id}`, tempData)
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
    <Box sx={{ p: 3 }}>
      <PageHeaderBreadcrumbs
        items={[
          { label: "Dashboard", to: "/Dashboard" },
          { label: "Projects", to: "/Dashboard/projects" },
        ]}
        title={id ? "Edit Project" : "Add New Project"}
        subtitle={id ? "Update project information" : "Create a new project"}
      />

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
                              <MenuItem value={res?.id} key={res.id}>
                                {res?.employeeName} ({res?.id})
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

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="employees-select-label">Assign Employees</InputLabel>
                      <Select
                        labelId="employees-select-label"
                        id="employees-select"
                        multiple
                        value={selectedEmployees}
                        onChange={(e) => setSelectedEmployees(e.target.value)}
                        input={<OutlinedInput label="Assign Employees" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {selected.map((value) => {
                              const employee = allEmployees.find((emp) => emp.id === value || emp.id === value);
                              return (
                                <Chip
                                  key={value}
                                  label={employee ? `${employee.employeeName} (${employee.id})` : value}
                                  size="small"
                                />
                              );
                            })}
                          </Box>
                        )}
                        startAdornment={<People sx={{ mr: 1, color: "text.secondary" }} />}
                      >
                        {allEmployees
                          ?.filter((emp) => emp.role !== "Admin") // Exclude admins from assignment
                          .map((employee) => {
                            const employeeId = employee.id;
                            return (
                              <MenuItem key={employee.id} value={employeeId}>
                                {employee.employeeName} ({employee.id}) - {employee.designation || employee.role}
                              </MenuItem>
                            );
                          })}
                      </Select>
                      <FormHelperText>
                        Select employees to assign to this project
                      </FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="projectNo"
                      control={control}
                      defaultValue=""
                      rules={{ required: "Project No is required" }}
                      render={({ field: { onChange, value, ...field } }) => (
                        <Autocomplete
                          {...field}
                          freeSolo
                          options={existingProjectNos}
                          value={value || ""}
                          onChange={(event, newValue) => {
                            onChange(newValue || "");
                          }}
                          onInputChange={(event, newInputValue) => {
                            onChange(newInputValue || "");
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              fullWidth
                              label="Project No"
                              error={Boolean(errors.projectNo)}
                              helperText={errors.projectNo?.message || `Existing: ${existingProjectNos.length} project numbers`}
                            />
                          )}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="desciplineCode"
                      control={control}
                      defaultValue=""
                      rules={{ required: "Discipline is required" }}
                      render={({ field }) => (
                        <FormControl fullWidth error={Boolean(errors.desciplineCode)}>
                          <InputLabel>Discipline</InputLabel>
                          <Select
                            {...field}
                            label="Discipline"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            {disciplineRules.map((d) => (
                              <MenuItem key={d.id} value={d.discipline_code}>
                                {d.discipline} – {d.discipline_code}
                              </MenuItem>
                            ))}
                            {field.value && !disciplineRules.some((d) => d.discipline_code === field.value) && (
                              <MenuItem value={field.value}>({field.value})</MenuItem>
                            )}
                            {disciplineRules.length === 0 && !field.value && (
                              <MenuItem value="" disabled>Add discipline rules in Settings → Discipline Rules</MenuItem>
                            )}
                          </Select>
                          <FormHelperText>
                            {errors.desciplineCode?.message || "From Settings → Discipline Rules"}
                          </FormHelperText>
                        </FormControl>
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

                  <Grid item xs={12}>
                    <Paper
                      variant="outlined"
                      sx={{ p: 2, borderRadius: 2, bgcolor: "background.paper" }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Chip
                          label={`Plan allotted: ${Number(planHoursSummary.totalPlanAllotted || 0).toFixed(2)} hrs`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                        <Chip
                          label={`Plan utilized: ${Number(planHoursSummary.totalPlanUtilized || 0).toFixed(2)} hrs`}
                          size="small"
                          variant="outlined"
                          color="info"
                        />
                        <Chip
                          label={`Plan progress: ${Number(planHoursSummary.progressPercent || 0)}%`}
                          size="small"
                          variant="outlined"
                          color={planHoursSummary.progressPercent >= 100 ? "success" : "default"}
                        />
                        <Chip
                          label={`Project remaining: ${Math.max(
                            0,
                            (parseFloat(formDatas?.allotatedHours) || 0) -
                              (parseFloat(planHoursSummary.totalPlanAllotted) || 0)
                          ).toFixed(2)} hrs`}
                          size="small"
                          variant="outlined"
                          color="warning"
                        />
                        {planHoursSummary.loading && (
                          <Typography variant="caption" color="text.secondary">
                            Calculating…
                          </Typography>
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                        Totals are calculated from Project Planning (sum of plans for this project).
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Project Status</InputLabel>
                      <Controller
                        name="status"
                        control={control}
                        defaultValue="active"
                        render={({ field }) => (
                          <Select
                            {...field}
                            label="Project Status"
                            renderValue={(value) => {
                              const statusConfig = {
                                active: { label: "Active", icon: <PlayArrow />, color: "success" },
                                on_hold: { label: "On Hold", icon: <PauseCircle />, color: "warning" },
                                completed: { label: "Completed", icon: <CheckCircle />, color: "info" },
                                cancelled: { label: "Cancelled", icon: <Cancel />, color: "error" },
                              };
                              const config = statusConfig[value] || statusConfig.active;
                              return (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  {config.icon}
                                  <Typography>{config.label}</Typography>
                                </Box>
                              );
                            }}
                          >
                            <MenuItem value="active">
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <PlayArrow sx={{ color: "success.main" }} />
                                <Typography>Active</Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="on_hold">
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <PauseCircle sx={{ color: "warning.main" }} />
                                <Typography>On Hold</Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="completed">
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <CheckCircle sx={{ color: "info.main" }} />
                                <Typography>Completed</Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="cancelled">
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Cancel sx={{ color: "error.main" }} />
                                <Typography>Cancelled</Typography>
                              </Box>
                            </MenuItem>
                          </Select>
                        )}
                      />
                      <FormHelperText>
                        Current status of the project
                      </FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="description"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Project Description"
                          multiline
                          rows={4}
                          placeholder="Enter a detailed description about this project..."
                          error={Boolean(errors.description)}
                          helperText={errors.description?.message || "Provide details about the project scope, objectives, and requirements"}
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
              background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
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
