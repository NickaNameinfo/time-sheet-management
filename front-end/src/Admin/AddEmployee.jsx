import React, { useState, useEffect, useRef } from "react";
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
  Select,
  MenuItem,
  FormHelperText,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";
import {
  Person,
  Email,
  Badge,
  Work,
  CalendarToday,
  CloudUpload,
  ArrowBack,
  Save,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { apiService } from "../services/api";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import { getImageUrl } from "../utils/helpers";

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
      date: null,
      employeeStatus: "",
      discipline: "",
      designation: "",
      tempRole: "Employee",
    },
  });

  const navigate = useNavigate();
  const { id } = useParams();
  const [tempRole, setTempRole] = useState("Employee");
  const [employeeImage, setEmployeeImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");

  const { data: disciplines, loading: disciplinesLoading } = useApi(
    () => apiService.getDisciplines(),
    [],
    true
  );
  const { data: designations, loading: designationsLoading } = useApi(
    () => apiService.getDesignations(),
    [],
    true
  );
  
  // Only fetch employee data if id exists
  const { data: employeeData, loading: employeeLoading } = useApi(
    () => apiService.getEmployee(id),
    [id],
    !!id
  );

  const { mutate: createEmployee, loading: creating } = useMutation(apiService.createEmployee);
  const { mutate: updateEmployee, loading: updating } = useMutation((data) =>
    apiService.updateEmployee(id, data)
  );

  // Track if form has been populated to prevent re-population
  const formPopulatedRef = useRef(false);
  
  useEffect(() => {
    if (employeeData && id && !formPopulatedRef.current) {
      // Check if employeeData is an array or object
      const emp = Array.isArray(employeeData) ? employeeData[0] : employeeData;
      if (emp && emp.id) {
        setValue("employeeName", emp.employeeName || "");
        setValue("EMPID", emp.EMPID || "");
        setValue("employeeEmail", emp.employeeEmail || "");
        setValue("userName", emp.userName || "");
        setValue("discipline", emp.discipline || "");
        setValue("designation", emp.designation || "");
        setValue("employeeStatus", emp.employeeStatus || "");
        setValue("date", emp.date ? dayjs(emp.date) : null);
        setValue("relievingDate", emp.relievingDate ? dayjs(emp.relievingDate) : null);
        setValue("permanentDate", emp.permanentDate ? dayjs(emp.permanentDate) : null);
        setTempRole(emp.role || "Employee");
        if (emp.employeeImage) {
          // Convert image filename to full URL
          const imageUrl = getImageUrl(emp.employeeImage);
          setImagePreview(imageUrl);
        }
        formPopulatedRef.current = true; // Mark as populated
      }
    }
    
    // Reset when id changes
    if (!id) {
      formPopulatedRef.current = false;
    }
  }, [employeeData, id, setValue]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEmployeeImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setError("");
    const formData = new FormData();

    // Append all form fields
    Object.keys(data).forEach((key) => {
      if (key !== "employeeImage" && data[key] !== null && data[key] !== undefined) {
        if (dayjs.isDayjs(data[key])) {
          formData.append(key, data[key].format("YYYY-MM-DD"));
        } else {
          formData.append(key, data[key]);
        }
      }
    });

    // Append image if selected
    if (employeeImage) {
      formData.append("employeeImage", employeeImage);
    }

    formData.append("role", tempRole);

    try {
      const result = id
        ? await updateEmployee(formData)
        : await createEmployee(formData);

      if (result.success) {
        navigate("/Dashboard/employee");
      } else {
        setError(result.error || "Failed to save employee");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    }
  };

  const handleRoleChange = (role) => {
    setTempRole(role);
  };

  if (employeeLoading) {
    return <Loading message="Loading employee data..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 2 }}>
        <IconButton onClick={() => navigate("/Dashboard/employee")} color="primary">
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {id ? "Edit Employee" : "Add New Employee"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {id ? "Update employee information" : "Create a new employee profile"}
          </Typography>
        </Box>
      </Box>

      <ErrorMessage error={error} onClose={() => setError("")} />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Basic Information Card */}
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                  Basic Information
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="employeeName"
                      control={control}
                      rules={{ required: "Employee name is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Employee Name"
                          placeholder="Enter full name"
                          error={Boolean(errors.employeeName)}
                          helperText={errors.employeeName?.message}
                          InputProps={{
                            startAdornment: <Person sx={{ mr: 1, color: "text.secondary" }} />,
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="EMPID"
                      control={control}
                      rules={{ required: "Employee ID is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Employee ID"
                          placeholder="Enter employee ID"
                          error={Boolean(errors.EMPID)}
                          helperText={errors.EMPID?.message}
                          InputProps={{
                            startAdornment: <Badge sx={{ mr: 1, color: "text.secondary" }} />,
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="employeeEmail"
                      control={control}
                      rules={{
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Email Address"
                          type="email"
                          placeholder="employee@example.com"
                          error={Boolean(errors.employeeEmail)}
                          helperText={errors.employeeEmail?.message}
                          InputProps={{
                            startAdornment: <Email sx={{ mr: 1, color: "text.secondary" }} />,
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="userName"
                      control={control}
                      rules={{ required: "Username is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Username"
                          placeholder="Enter username"
                          error={Boolean(errors.userName)}
                          helperText={errors.userName?.message}
                        />
                      )}
                    />
                  </Grid>

                  {!id && (
                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="password"
                        control={control}
                        rules={{
                          required: !id ? "Password is required" : false,
                          minLength: {
                            value: 6,
                            message: "Password must be at least 6 characters",
                          },
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Password"
                            type="password"
                            placeholder="Enter password"
                            error={Boolean(errors.password)}
                            helperText={errors.password?.message}
                          />
                        )}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={Boolean(errors.discipline)}>
                      <InputLabel>Discipline</InputLabel>
                      <Controller
                        name="discipline"
                        control={control}
                        rules={{ required: "Discipline is required" }}
                        render={({ field }) => (
                          <Select {...field} label="Discipline" disabled={disciplinesLoading}>
                            {disciplinesLoading ? (
                              <MenuItem>Loading...</MenuItem>
                            ) : (
                              disciplines?.map((item) => (
                                <MenuItem key={item.id} value={item.discipline}>
                                  {item.discipline}
                                </MenuItem>
                              ))
                            )}
                          </Select>
                        )}
                      />
                      <FormHelperText>{errors.discipline?.message}</FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={Boolean(errors.designation)}>
                      <InputLabel>Designation</InputLabel>
                      <Controller
                        name="designation"
                        control={control}
                        rules={{ required: "Designation is required" }}
                        render={({ field }) => (
                          <Select {...field} label="Designation" disabled={designationsLoading}>
                            {designationsLoading ? (
                              <MenuItem>Loading...</MenuItem>
                            ) : (
                              designations?.map((item) => (
                                <MenuItem key={item.id} value={item.designation}>
                                  {item.designation}
                                </MenuItem>
                              ))
                            )}
                          </Select>
                        )}
                      />
                      <FormHelperText>{errors.designation?.message}</FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={Boolean(errors.employeeStatus)}>
                      <InputLabel>Employee Status</InputLabel>
                      <Controller
                        name="employeeStatus"
                        control={control}
                        rules={{ required: "Status is required" }}
                        render={({ field }) => (
                          <Select {...field} label="Employee Status">
                            <MenuItem value="Probation">Probation</MenuItem>
                            <MenuItem value="Contract">Contract</MenuItem>
                            <MenuItem value="Training">Training</MenuItem>
                            <MenuItem value="Permanent">Permanent</MenuItem>
                            <MenuItem value="Ex-Employee">Ex-Employee</MenuItem>
                          </Select>
                        )}
                      />
                      <FormHelperText>{errors.employeeStatus?.message}</FormHelperText>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Image Upload Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                  Employee Photo
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  {imagePreview ? (
                    <Box
                      component="img"
                      src={imagePreview}
                      alt="Employee"
                      onError={(e) => {
                        console.error("Image failed to load:", imagePreview);
                        e.target.style.display = "none";
                        setImagePreview(null);
                      }}
                      sx={{
                        width: 200,
                        height: 200,
                        borderRadius: 2,
                        objectFit: "cover",
                        border: "2px solid",
                        borderColor: "primary.main",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 200,
                        height: 200,
                        borderRadius: 2,
                        bgcolor: "grey.100",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px dashed",
                        borderColor: "grey.300",
                      }}
                    >
                      <Person sx={{ fontSize: 80, color: "grey.400" }} />
                    </Box>
                  )}
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    fullWidth
                  >
                    Upload Photo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                  {employeeImage && (
                    <Typography variant="caption" color="text.secondary">
                      {employeeImage.name}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Dates Card */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                  Important Dates
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Controller
                        name="date"
                        control={control}
                        rules={{ required: "Join date is required" }}
                        render={({ field }) => (
                          <DatePicker
                            {...field}
                            label="Join Date"
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: Boolean(errors.date),
                                helperText: errors.date?.message,
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

                  <Grid item xs={12} sm={4}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Controller
                        name="relievingDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            {...field}
                            label="Relieving Date"
                            slotProps={{
                              textField: {
                                fullWidth: true,
                              },
                            }}
                          />
                        )}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Controller
                        name="permanentDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            {...field}
                            label="Permanent Date"
                            slotProps={{
                              textField: {
                                fullWidth: true,
                              },
                            }}
                          />
                        )}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Role Selection Card */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                  Employee Role
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={tempRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                  >
                    <FormControlLabel
                      value="Employee"
                      control={<Radio />}
                      label={<Chip label="Employee" color="default" />}
                    />
                    <FormControlLabel
                      value="TL"
                      control={<Radio />}
                      label={<Chip label="Team Lead" color="info" />}
                    />
                    <FormControlLabel
                      value="HR"
                      control={<Radio />}
                      label={<Chip label="HR" color="warning" />}
                    />
                    <FormControlLabel
                      value="Admin"
                      control={<Radio />}
                      label={<Chip label="Admin" color="error" />}
                    />
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                onClick={() => navigate("/Dashboard/employee")}
                disabled={creating || updating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={creating || updating ? <CircularProgress size={20} /> : <Save />}
                disabled={creating || updating}
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                  },
                }}
              >
                {creating || updating ? "Saving..." : id ? "Update Employee" : "Create Employee"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}

export default AddEmployee;
