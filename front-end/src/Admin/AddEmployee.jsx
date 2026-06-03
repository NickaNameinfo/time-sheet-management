import React, { useState, useEffect, useRef, useMemo } from "react";
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
  InputAdornment,
  Autocomplete,
} from "@mui/material";
import {
  Person,
  Email,
  Badge,
  Work,
  CalendarToday,
  CloudUpload,
  Save,
  AttachMoney,
  Description,
  LockReset,
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
import PageHeaderBreadcrumbs from "../components/PageHeaderBreadcrumbs";
import { getImageUrl } from "../utils/helpers";
import { getDisplayEmployeeId } from "../utils/employeeId";
import { useTranslation } from "react-i18next";

function AddEmployee({ from }) {
  const { t } = useTranslation();
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
      designation: "",
      tempRole: "Employee",
      salary: "",
      father_name: "",
      mother_name: "",
      parent_contact: "",
      parent_address: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const navigate = useNavigate();
  const { id } = useParams();
  const [tempRole, setTempRole] = useState("Employee");
  const [employeeImage, setEmployeeImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [idProofFile, setIdProofFile] = useState(null);
  const [idProofPreview, setIdProofPreview] = useState(null);
  const [error, setError] = useState("");

  const { data: designations, loading: designationsLoading } = useApi(
    () => apiService.getDesignations(),
    [],
    true
  );
  
  const { data: roles, loading: rolesLoading } = useApi(
    () => apiService.getRoles(),
    [],
    true
  );

  // Company login emails (company_admin/company_user) to reuse for employee creation
  // If API is not accessible, suggestions will be empty and user can type manually.
  const {
    data: companyLoginUsers,
    loading: companyLoginUsersLoading,
  } = useApi(() => apiService.getMyCompanyLoginEmails(), [], true);

  const companyLoginEmails = useMemo(() => {
    if (!Array.isArray(companyLoginUsers)) return [];
    return (companyLoginUsers || [])
      .map((u) => u?.email)
      .filter((e) => typeof e === "string" && e.trim() !== "");
  }, [companyLoginUsers]);
  
  // Set default role from settings when roles are loaded
  useEffect(() => {
    if (roles && !id) {
      let rolesList = [];
      if (Array.isArray(roles)) {
        rolesList = roles;
      } else if (roles.Result && Array.isArray(roles.Result)) {
        rolesList = roles.Result;
      }
      
      if (rolesList.length > 0) {
        // Set to first role by display_order or first in list
        const sortedRoles = [...rolesList].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        setTempRole(sortedRoles[0].role_name);
        setValue("tempRole", sortedRoles[0].role_name);
      }
    }
  }, [roles, id, setValue]);
  
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
        setValue("EMPID", getDisplayEmployeeId(emp));
        setValue("employeeEmail", emp.employeeEmail || "");
        setValue("userName", emp.userName || "");
        setValue("designation", emp.designation || "");
        setValue("employeeStatus", emp.employeeStatus || "");
        setValue("date", emp.date ? dayjs(emp.date) : null);
        setValue("relievingDate", emp.relievingDate ? dayjs(emp.relievingDate) : null);
        setValue("permanentDate", emp.permanentDate ? dayjs(emp.permanentDate) : null);
        setValue("salary", emp.salary || "");
        setValue("father_name", emp.father_name || "");
        setValue("mother_name", emp.mother_name || "");
        setValue("parent_contact", emp.parent_contact || "");
        setValue("parent_address", emp.parent_address || "");
        setTempRole(emp.role || "Employee");
        if (emp.employeeImage) {
          // Convert image filename to full URL
          const imageUrl = getImageUrl(emp.employeeImage);
          setImagePreview(imageUrl);
        }
        if (emp.id_proof) {
          // Convert ID proof filename to full URL
          const idProofUrl = getImageUrl(emp.id_proof);
          setIdProofPreview(idProofUrl);
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

  const handleIdProofChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIdProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setError("");
    const formData = new FormData();

    // Append all form fields (exclude password-update-only and image keys)
    const skipKeys = ["employeeImage", "newPassword", "confirmPassword"];
    Object.keys(data).forEach((key) => {
      if (skipKeys.includes(key) || data[key] === null || data[key] === undefined) return;
      if (key === "password" && id) return; // Edit mode: use newPassword below if provided
      if (dayjs.isDayjs(data[key])) {
        formData.append(key, data[key].format("YYYY-MM-DD"));
      } else {
        formData.append(key, data[key]);
      }
    });
    // When editing, append new password only if user filled the update-password fields
    if (id && data.newPassword?.trim()) {
      formData.append("password", data.newPassword.trim());
    }

    // Append image if selected
    if (employeeImage) {
      formData.append("employeeImage", employeeImage);
    }

    // Append ID proof if selected
    if (idProofFile) {
      formData.append("id_proof", idProofFile);
    }

    formData.append("role", tempRole);

    try {
      const result = id
        ? await updateEmployee(formData)
        : await createEmployee(formData);

      if (result.success) {
        if (from === "hr") {
          navigate("/Hr/employee");
        } else {
          navigate("/Dashboard/employee");
        }
      } else {
        setError(
          result.error ||
            t("employeeForm.failedToSaveEmployee", { defaultValue: "Failed to save employee" })
        );
      }
    } catch (err) {
      setError(err.message || t("common.anErrorOccurred", { defaultValue: "An error occurred" }));
    }
  };

  const handleRoleChange = (role) => {
    setTempRole(role);
  };

  if (employeeLoading) {
    return (
      <Loading
        message={t("employeeForm.loadingEmployeeData", { defaultValue: "Loading employee data..." })}
      />
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <PageHeaderBreadcrumbs
        items={
          from === "hr"
            ? [
                { label: t("breadcrumbs.hr", { defaultValue: "HR" }), to: "/Hr" },
                { label: t("breadcrumbs.employees", { defaultValue: "Employees" }), to: "/Hr/employee" },
              ]
            : [
                { label: t("breadcrumbs.dashboard", { defaultValue: "Dashboard" }), to: "/Dashboard" },
                { label: t("breadcrumbs.employees", { defaultValue: "Employees" }), to: "/Dashboard/employee" },
              ]
        }
        title={
          id
            ? t("employeeForm.editTitle", { defaultValue: "Edit Employee" })
            : t("employeeForm.addTitle", { defaultValue: "Add New Employee" })
        }
        subtitle={
          id
            ? t("employeeForm.editSubtitle", { defaultValue: "Update employee information" })
            : t("employeeForm.addSubtitle", { defaultValue: "Create a new employee profile" })
        }
      />

      <ErrorMessage error={error} onClose={() => setError("")} />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Basic Information Card */}
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                  {t("employeeForm.basicInformation", { defaultValue: "Basic Information" })}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="employeeName"
                      control={control}
                      rules={{
                        required: t("employeeForm.employeeNameRequired", {
                          defaultValue: "Employee name is required",
                        }),
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label={t("employeeForm.employeeName", { defaultValue: "Employee Name" })}
                          placeholder={t("employeeForm.enterFullName", { defaultValue: "Enter full name" })}
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
                      rules={{
                        required: t("employeeForm.employeeIdRequired", {
                          defaultValue: "Employee ID is required",
                        }),
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label={t("employeeForm.employeeId", { defaultValue: "Employee ID" })}
                          placeholder={t("employeeForm.enterEmployeeId", { defaultValue: "Enter employee ID" })}
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
                        required: t("employeeForm.emailRequired", { defaultValue: "Email is required" }),
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: t("employeeForm.invalidEmail", { defaultValue: "Invalid email address" }),
                        },
                      }}
                      render={({ field }) => (
                        <Autocomplete
                          freeSolo
                          loading={companyLoginUsersLoading}
                          options={companyLoginEmails}
                          value={field.value || ""}
                          onInputChange={(_, v) => {
                            const email = (v || "").toString();
                            field.onChange(email);
                            // Keep username synced with selected/typed email
                            setValue("userName", email);
                          }}
                          onChange={(_, v) => {
                            const email = (v || "").toString();
                            field.onChange(email);
                            setValue("userName", email);
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              fullWidth
                              label={t("employeeForm.emailAddress", { defaultValue: "Email Address" })}
                              type="email"
                              placeholder={t("employeeForm.emailPlaceholder", { defaultValue: "employee@example.com" })}
                              error={Boolean(errors.employeeEmail)}
                              helperText={errors.employeeEmail?.message}
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: <Email sx={{ mr: 1, color: "text.secondary" }} />,
                              }}
                            />
                          )}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="userName"
                      control={control}
                      rules={{
                        required: t("employeeForm.usernameRequired", { defaultValue: "Username is required" }),
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label={t("employeeForm.username", { defaultValue: "Username" })}
                          placeholder={t("employeeForm.enterUsername", { defaultValue: "Enter username" })}
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
                          required: !id ? t("employeeForm.passwordRequired", { defaultValue: "Password is required" }) : false,
                          minLength: {
                            value: 6,
                            message: t("employeeForm.passwordMinLength", {
                              defaultValue: "Password must be at least 6 characters",
                            }),
                          },
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label={t("employeeForm.password", { defaultValue: "Password" })}
                            type="password"
                            placeholder={t("employeeForm.enterPassword", { defaultValue: "Enter password" })}
                            error={Boolean(errors.password)}
                            helperText={errors.password?.message}
                          />
                        )}
                      />
                    </Grid>
                  )}

                  {id && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 0.5 }}>
                          {t("employeeForm.updatePasswordOptional", {
                            defaultValue: "Update password (optional)",
                          })}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="newPassword"
                          control={control}
                          rules={{
                            minLength: {
                              value: 6,
                              message: t("employeeForm.passwordMinLength", {
                                defaultValue: "Password must be at least 6 characters",
                              }),
                            },
                            validate: (val) => {
                              const confirm = watch("confirmPassword");
                              if (confirm && !val)
                                return t("employeeForm.enterNewPassword", { defaultValue: "Enter new password" });
                              if (val && val.length < 6)
                                return t("employeeForm.passwordMinLength", {
                                  defaultValue: "Password must be at least 6 characters",
                                });
                              return true;
                            },
                          }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label={t("employeeForm.newPassword", { defaultValue: "New password" })}
                              type="password"
                              placeholder={t("employeeForm.leaveBlankToKeepCurrent", {
                                defaultValue: "Leave blank to keep current",
                              })}
                              error={Boolean(errors.newPassword)}
                              helperText={errors.newPassword?.message}
                              InputProps={{
                                startAdornment: <LockReset sx={{ mr: 1, color: "text.secondary" }} />,
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="confirmPassword"
                          control={control}
                          rules={{
                            validate: (val) => {
                              const newPwd = watch("newPassword");
                              if (newPwd && !val)
                                return t("employeeForm.confirmNewPassword", {
                                  defaultValue: "Confirm the new password",
                                });
                              if (newPwd && val !== newPwd)
                                return t("employeeForm.passwordsDoNotMatch", {
                                  defaultValue: "Passwords do not match",
                                });
                              return true;
                            },
                          }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label={t("employeeForm.confirmNewPasswordLabel", { defaultValue: "Confirm new password" })}
                              type="password"
                              placeholder={t("employeeForm.reenterNewPassword", { defaultValue: "Re-enter new password" })}
                              error={Boolean(errors.confirmPassword)}
                              helperText={errors.confirmPassword?.message}
                              InputProps={{
                                startAdornment: <LockReset sx={{ mr: 1, color: "text.secondary" }} />,
                              }}
                            />
                          )}
                        />
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={Boolean(errors.designation)}>
                      <InputLabel>{t("employeeForm.designation", { defaultValue: "Designation" })}</InputLabel>
                      <Controller
                        name="designation"
                        control={control}
                        rules={{
                          required: t("employeeForm.designationRequired", {
                            defaultValue: "Designation is required",
                          }),
                        }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            label={t("employeeForm.designation", { defaultValue: "Designation" })}
                            disabled={designationsLoading}
                          >
                            {designationsLoading ? (
                              <MenuItem>{t("common.loading", { defaultValue: "Loading..." })}</MenuItem>
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
                      <InputLabel>{t("employeeForm.employeeStatus", { defaultValue: "Employee Status" })}</InputLabel>
                      <Controller
                        name="employeeStatus"
                        control={control}
                        rules={{
                          required: t("employeeForm.statusRequired", { defaultValue: "Status is required" }),
                        }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            label={t("employeeForm.employeeStatus", { defaultValue: "Employee Status" })}
                          >
                            <MenuItem value="Probation">
                              {t("employeeForm.status.probation", { defaultValue: "Probation" })}
                            </MenuItem>
                            <MenuItem value="Contract">
                              {t("employeeForm.status.contract", { defaultValue: "Contract" })}
                            </MenuItem>
                            <MenuItem value="Training">
                              {t("employeeForm.status.training", { defaultValue: "Training" })}
                            </MenuItem>
                            <MenuItem value="Permanent">
                              {t("employeeForm.status.permanent", { defaultValue: "Permanent" })}
                            </MenuItem>
                            <MenuItem value="Ex-Employee">
                              {t("employeeForm.status.exEmployee", { defaultValue: "Ex-Employee" })}
                            </MenuItem>
                          </Select>
                        )}
                      />
                      <FormHelperText>{errors.employeeStatus?.message}</FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="salary"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label={t("employeeForm.salary", { defaultValue: "Salary" })}
                          type="number"
                          placeholder={t("employeeForm.enterSalaryAmount", { defaultValue: "Enter salary amount" })}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AttachMoney sx={{ color: "text.secondary" }} />
                              </InputAdornment>
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

          {/* Image Upload Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                  {t("employeeForm.employeePhoto", { defaultValue: "Employee Photo" })}
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
                      alt={t("employeeForm.employeePhotoAlt", { defaultValue: "Employee" })}
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
                    {t("employeeForm.uploadPhoto", { defaultValue: "Upload Photo" })}
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

          {/* ID Proof Upload Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                  {t("employeeForm.idProofDocument", { defaultValue: "ID Proof Document" })}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  {idProofPreview ? (
                    <Box
                      sx={{
                        width: "100%",
                        height: 200,
                        borderRadius: 2,
                        border: "2px solid",
                        borderColor: "primary.main",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {idProofPreview.endsWith('.pdf') || idProofFile?.type === 'application/pdf' ? (
                        <iframe
                          src={idProofPreview}
                          style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                          }}
                          title="ID Proof PDF"
                        />
                      ) : (
                        <Box
                          component="img"
                          src={idProofPreview}
                          alt={t("employeeForm.idProofAlt", { defaultValue: "ID Proof" })}
                          onError={(e) => {
                            console.error("ID Proof failed to load:", idProofPreview);
                            e.target.style.display = "none";
                            setIdProofPreview(null);
                          }}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      )}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        height: 200,
                        borderRadius: 2,
                        bgcolor: "grey.100",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px dashed",
                        borderColor: "grey.300",
                        gap: 1,
                      }}
                    >
                      <Description sx={{ fontSize: 60, color: "grey.400" }} />
                      <Typography variant="caption" color="text.secondary">
                        {t("employeeForm.uploadIdProofHint", { defaultValue: "Upload ID Proof (Image/PDF)" })}
                      </Typography>
                    </Box>
                  )}
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    fullWidth
                  >
                    {t("employeeForm.uploadIdProof", { defaultValue: "Upload ID Proof" })}
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf"
                      onChange={handleIdProofChange}
                    />
                  </Button>
                  {idProofFile && (
                    <Typography variant="caption" color="text.secondary">
                      {idProofFile.name}
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
                  {t("employeeForm.importantDates", { defaultValue: "Important Dates" })}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Controller
                        name="date"
                        control={control}
                        rules={{
                          required: t("employeeForm.joinDateRequired", { defaultValue: "Join date is required" }),
                        }}
                        render={({ field }) => (
                          <DatePicker
                            {...field}
                            label={t("employeeForm.joinDate", { defaultValue: "Join Date" })}
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
                            label={t("employeeForm.relievingDate", { defaultValue: "Relieving Date" })}
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
                            label={t("employeeForm.permanentDate", { defaultValue: "Permanent Date" })}
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

          {/* Parent Details Card */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                  {t("employeeForm.parentDetails", { defaultValue: "Parent Details" })}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="father_name"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label={t("employeeForm.fathersName", { defaultValue: "Father's Name" })}
                          placeholder={t("employeeForm.enterFathersName", { defaultValue: "Enter father's name" })}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="mother_name"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label={t("employeeForm.mothersName", { defaultValue: "Mother's Name" })}
                          placeholder={t("employeeForm.enterMothersName", { defaultValue: "Enter mother's name" })}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="parent_contact"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label={t("employeeForm.parentContactNumber", { defaultValue: "Parent Contact Number" })}
                          placeholder={t("employeeForm.enterContactNumber", { defaultValue: "Enter contact number" })}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="parent_address"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label={t("employeeForm.parentAddress", { defaultValue: "Parent Address" })}
                          placeholder={t("employeeForm.enterParentAddress", { defaultValue: "Enter parent's address" })}
                          multiline
                          rows={3}
                        />
                      )}
                    />
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
                  {t("employeeForm.employeeRole", { defaultValue: "Employee Role" })}
                </Typography>
                {rolesLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      row
                      value={tempRole}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      sx={{ flexWrap: "wrap", gap: 1 }}
                    >
                      {(() => {
                        // Handle different response structures
                        let rolesList = [];
                        if (roles) {
                          if (Array.isArray(roles)) {
                            rolesList = roles;
                          } else if (roles.Result && Array.isArray(roles.Result)) {
                            rolesList = roles.Result;
                          } else if (roles.Result && !Array.isArray(roles.Result)) {
                            rolesList = [roles.Result];
                          }
                        }
                        
                        if (rolesList.length > 0) {
                          return rolesList.map((r) => (
                            <FormControlLabel
                              key={r.id || r.role_name}
                              value={r.role_name}
                              control={<Radio />}
                              label={
                                <Chip 
                                  label={r.role_display_name || r.role_name} 
                                  color={r.role_color || "default"}
                                  sx={{ fontWeight: 600 }}
                                />
                              }
                            />
                          ));
                        } else {
                          // Fallback to default roles if API fails or returns empty
                          return (
                            <>
                              <FormControlLabel
                                value="Employee"
                                control={<Radio />}
                                label={
                                  <Chip
                                    label={t("role.employee", { defaultValue: "Employee" })}
                                    color="default"
                                    sx={{ fontWeight: 600 }}
                                  />
                                }
                              />
                              <FormControlLabel
                                value="TL"
                                control={<Radio />}
                                label={
                                  <Chip
                                    label={t("employeeForm.teamLead", { defaultValue: "Team Lead" })}
                                    color="info"
                                    sx={{ fontWeight: 600 }}
                                  />
                                }
                              />
                              <FormControlLabel
                                value="HR"
                                control={<Radio />}
                                label={
                                  <Chip
                                    label={t("role.hr", { defaultValue: "HR" })}
                                    color="warning"
                                    sx={{ fontWeight: 600 }}
                                  />
                                }
                              />
                              <FormControlLabel
                                value="Admin"
                                control={<Radio />}
                                label={
                                  <Chip
                                    label={t("role.admin", { defaultValue: "Admin" })}
                                    color="error"
                                    sx={{ fontWeight: 600 }}
                                  />
                                }
                              />
                            </>
                          );
                        }
                      })()}
                    </RadioGroup>
                  </FormControl>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                onClick={() => {
                  if (from === "hr") {
                    navigate("/Hr/employee");
                  } else {
                    navigate("/Dashboard/employee");
                  }
                }}
                disabled={creating || updating}
              >
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={creating || updating ? <CircularProgress size={20} /> : <Save />}
                disabled={creating || updating}
                sx={{
                  background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
                  },
                }}
              >
                {creating || updating
                  ? t("common.saving", { defaultValue: "Saving..." })
                  : id
                    ? t("employeeForm.updateEmployee", { defaultValue: "Update Employee" })
                    : t("employeeForm.createEmployee", { defaultValue: "Create Employee" })}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}

export default AddEmployee;
