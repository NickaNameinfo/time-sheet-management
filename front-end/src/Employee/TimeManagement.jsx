import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  Autocomplete,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  IconButton,
  Chip,
  Stack,
  Snackbar,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Add,
  Delete,
  Send,
  Edit,
  Save,
  CheckCircle,
  Cancel,
  Schedule,
} from "@mui/icons-material";
import { apiService } from "../services/api";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import { useAuth } from "../context/AuthContext";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";

const TimeManagement = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [weekData, setWeekData] = useState(null);
  const [isDisable, setIsDisable] = useState({});
  const [errorMessage, setErrorMessage] = useState({});
  const [currentIndex, setCurrentIndex] = useState(null);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Generate week numbers (1-52)
  const weekNumberList = useMemo(() => Array.from({ length: 52 }, (_, i) => i + 1), []);

  // Get current week number
  const getCurrentWeekNumber = useCallback(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const diff = now - startOfYear;
    const oneWeekInMilliseconds = 7 * 24 * 60 * 60 * 1000;
    return Math.floor(diff / oneWeekInMilliseconds) + 1;
  }, []);

  // Calculate week dates
  const getWeekDates = useCallback((weekNumber, year) => {
    const startDate = new Date(year, 0, 1);
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? 1 : 1);
    const weekStart = new Date(startDate.setDate(diff));
    const daysToAdd = (weekNumber - 1) * 7;
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + daysToAdd + i);
      dates.push(date.toLocaleDateString());
    }
    return dates;
  }, []);

  // Fetch data using hooks
  const { data: projects, loading: projectsLoading, refetch: refetchProjects } = useApi(
    apiService.getProjects,
    []
  );

  const { data: workDetails, loading: workDetailsLoading, refetch: refetchWorkDetails } = useApi(
    () => apiService.getWorkDetails({ employeeId: user?.id }),
    [user?.id],
    !!user?.id
  );

  // Auto-refresh work details when clock-in/clock-out happens
  useEffect(() => {
    if (!user?.id) return;
    
    const handleWorkDetailsUpdate = () => {
      refetchWorkDetails();
    };

    // Listen for custom event from EmployeeHome when clock-out happens
    window.addEventListener('workDetailsUpdated', handleWorkDetailsUpdate);
    
    // Also auto-refresh every 30 seconds to catch any updates
    // const interval = setInterval(() => {
    //   refetchWorkDetails();
    // }, 30000);

    return () => {
      window.removeEventListener('workDetailsUpdated', handleWorkDetailsUpdate);
      clearInterval(interval);
    };
  }, [user?.id, refetchWorkDetails]);

  const { data: leaveDetails, loading: leaveLoading } = useApi(
    () => apiService.getLeaveDetails({ employeeId: user?.id }),
    [user?.id],
    !!user?.id
  );

  const { data: areaOfWork, loading: areaLoading } = useApi(
    apiService.getAreaOfWork,
    []
  );

  const { data: variations, loading: variationsLoading } = useApi(
    apiService.getVariations,
    []
  );

  const { mutate: addWorkDetails, loading: addingWork } = useMutation(apiService.addWorkDetails);
  const { mutate: updateWorkDetails, loading: updatingWork } = useMutation(
    (params) => apiService.updateWorkDetails(params.id, params.data)
  );

  // Get reference numbers from projects
  const referenceNoList = useMemo(
    () => (projects || []).map((item) => item.referenceNo),
    [projects]
  );

  // Use leave list directly (already filtered by backend)
  const leaveList = useMemo(() => {
    if (!leaveDetails) return [];
    // Handle both array and object with Result property
    return Array.isArray(leaveDetails) 
      ? leaveDetails 
      : leaveDetails?.Result || leaveDetails?.data?.Result || [];
  }, [leaveDetails]);

  // Initialize week data
  useEffect(() => {
    const currentWeek = selectedWeek || getCurrentWeekNumber();
    const currentYear = new Date().getFullYear();
    const dates = getWeekDates(currentWeek, currentYear);
    setWeekData(dates);
  }, [selectedWeek, getCurrentWeekNumber, getWeekDates]);

  // Load work details for selected week
  // Note: Backend already filters by employeeId, so we only need to filter by week and year
  useEffect(() => {
    if (!workDetails || !user?.id) return;

    const currentWeek = selectedWeek || getCurrentWeekNumber();
    const currentYear = new Date().getFullYear();

    const filteredData = workDetails.filter(
      (item) =>
        Number(item.weekNumber) === Number(currentWeek) &&
        new Date(item.sentDate).getFullYear() === currentYear
    );

    if (filteredData.length > 0) {
      const formattedData = filteredData.map((result) => ({
        employeeName: result?.employeeName,
        referenceNo: result?.referenceNo,
        projectName: result?.projectName,
        projectNo: result?.projectNo,
        tlName: result?.tlName,
        taskNo: result?.taskNo,
        subDivisionList: result?.subDivisionList,
        areaofWork: result?.areaofWork,
        variation: result?.variation,
        subDivision: result?.subDivision,
        monday: result?.monday || "",
        tuesday: result?.tuesday || "",
        wednesday: result?.wednesday || "",
        thursday: result?.thursday || "",
        friday: result?.friday || "",
        saturday: result?.saturday || "",
        sunday: result?.sunday || "",
        totalHours: result?.totalHours || "0.0",
        sentDate: result?.sentDate,
        approvedDate: result?.approvedDate,
        id: result?.id,
        status: result?.status,
      }));
      setFormData(formattedData);
    } else {
      setFormData([]);
    }
  }, [workDetails, user?.id, selectedWeek, getCurrentWeekNumber]);

  // Calculate total hours when day values change
  useEffect(() => {
    if (formData.length === 0 || currentIndex === null) return;

    const currentRow = formData[currentIndex];
    if (!currentRow) return;

    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const calculatedHours = calculateTotalHours(currentRow);

    const updatedData = [...formData];
    updatedData[currentIndex] = {
      ...currentRow,
      totalHours: `${calculatedHours + hours}.${remainingMinutes}`,
    };
    setFormData(updatedData);
  }, [
    formData[currentIndex]?.monday,
    formData[currentIndex]?.tuesday,
    formData[currentIndex]?.wednesday,
    formData[currentIndex]?.thursday,
    formData[currentIndex]?.friday,
    formData[currentIndex]?.saturday,
    formData[currentIndex]?.sunday,
    currentIndex,
    totalMinutes,
  ]);

  // Calculate total hours from form data
  const calculateTotalHours = useCallback((rowData) => {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    
    let totalMinutes = 0;
    let totalHours = 0;

    days.forEach((day) => {
      const value = rowData?.[day];
      if (!value || value === "") return;
      
      // Parse the value - handle both formats:
      // 1. Decimal hours format: "8.5" = 8.5 hours = 8 hours 30 minutes (from clock-out)
      // 2. Hours.minutes format: "8.30" = 8 hours 30 minutes (manual entry)
      if (value.includes(".")) {
        const numValue = Number(value);
        
        // Check if it's likely decimal hours (e.g., 8.5, 8.25) vs hours.minutes (e.g., 8.30, 8.45)
        // If the decimal part when converted to minutes is > 59, it's likely hours.minutes format
        const decimalPart = value.split(".")[1] || "";
        const decimalAsNumber = Number("0." + decimalPart);
        const minutesFromDecimal = Math.round(decimalAsNumber * 60);
        
        if (decimalPart.length === 2 && Number(decimalPart) <= 59 && minutesFromDecimal !== Number(decimalPart)) {
          // Likely hours.minutes format (e.g., "8.30" = 8 hours 30 minutes)
          const wholeHours = Number(value.split(".")[0] || 0);
          const minutes = Number(decimalPart);
          totalHours += wholeHours;
          totalMinutes += minutes;
        } else {
          // Decimal hours format (e.g., "8.5" = 8.5 hours = 8 hours 30 minutes)
          const wholeHours = Math.floor(numValue);
          const decimalHours = numValue - wholeHours;
          const minutes = Math.round(decimalHours * 60);
          totalHours += wholeHours;
          totalMinutes += minutes;
        }
      } else {
        // Whole number of hours only
        totalHours += Number(value || 0);
      }
    });
    
    // Convert accumulated minutes to hours and remaining minutes
    const additionalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    
    setTotalMinutes(remainingMinutes);
    
    return totalHours + additionalHours;
  }, []);

  // Check if date is in leave list
  const isDateInLeave = useCallback(
    (date) => {
      if (!leaveList || leaveList.length === 0) return false;
      const dateStr = new Date(date).toLocaleDateString();
      return leaveList.some((item) => {
        const leaveDate = new Date(item.leaveFrom).toLocaleDateString();
        return leaveDate === dateStr;
      });
    },
    [leaveList]
  );

  // Format date for display
  const formatDate = useCallback((date) => {
    if (!date) return null;
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    return `${year}-${month}-${day}`;
  }, []);

  // Handle form field changes
  const handleOnChange = useCallback(
    (name, value, index) => {
      setCurrentIndex(index);
      const updatedData = [...formData];

      if (name === "referenceNo") {
        const project = projects?.find((item) => item.referenceNo === value);
        if (project) {
          updatedData[index] = {
            ...formData[index],
            referenceNo: value,
            projectName: project.projectName,
            tlName: project.tlID,
            userName: user?.id,
            taskNo: project.taskJobNo,
            subDivisionList: project.subDivision,
            allotatedHours: project.allotatedHours,
            desciplineCode: project.desciplineCode,
            projectNo: project.projectNo,
          };
        }
      } else {
        updatedData[index] = {
          ...formData[index],
          [name]: value,
        };
      }

      setFormData(updatedData);
    },
    [formData, projects]
  );

  // Add new row
  const handleAddRow = useCallback(() => {
    const newRow = {
      referenceNo: "",
      projectName: "",
      projectNo: "",
      taskNo: "",
      areaofWork: "",
      variation: "",
      subDivision: "",
      monday: "",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
      saturday: "",
      sunday: "",
      totalHours: "0.0",
      status: "",
      sentDate: "",
      approvedDate: "",
    };
    setFormData([...formData, newRow]);
  }, [formData]);

  // Delete row
  const handleDeleteRow = useCallback(
    (index) => {
      const newData = formData.filter((_, i) => i !== index);
      setFormData(newData);
    },
    [formData]
  );

  // Validate form
  const validateForm = useCallback(
    (index) => {
      const errors = {};
      const row = formData[index];

      if (!row.areaofWork) {
        errors.areaofWork = "This field is required";
      }
      if (!row.referenceNo) {
        errors.referenceNo = "This field is required";
      }
      if (!row.totalHours || row.totalHours === "0.0") {
        errors.totalHours = "Total work hours should not be 0";
      }

      return errors;
    },
    [formData]
  );

  // Submit work details
  const handleSubmit = useCallback(
    async (index) => {
      const errors = validateForm(index);
      if (Object.keys(errors).length > 0) {
        setErrorMessage({ [index]: errors });
        setSnackbar({
          open: true,
          message: "Please fill all required fields",
          severity: "error",
        });
        return;
      }

      setErrorMessage({});
      const row = formData[index];
      const currentWeek = selectedWeek || getCurrentWeekNumber();

      const submitData = {
        ...row,
        employeeName: user?.employeeName || user?.name,
        employeeNo: user?.id,
        employeeId: user?.id,
        userName: user?.userName,
        sentDate: new Date(),
        weekNumber: String(currentWeek),
        discipline: user?.discipline,
        designation: user?.designation,
        approverId: row.approverId || null, // Optional: can be set during submission or approval
      };

      delete submitData.id;

      const result = await addWorkDetails(submitData);
      if (result.success) {
        setIsDisable((prev) => ({ ...prev, [index]: { disable: true } }));
        setSnackbar({
          open: true,
          message: "Work details submitted successfully",
          severity: "success",
        });
        refetchWorkDetails();
      } else {
        setSnackbar({
          open: true,
          message: result.error || "Failed to submit work details",
          severity: "error",
        });
      }
    },
    [formData, selectedWeek, getCurrentWeekNumber, user, addWorkDetails, validateForm, refetchWorkDetails]
  );

  // Update work details
  const handleUpdate = useCallback(
    async (index) => {
      const row = formData[index];
      if (!row.id) return;

      const currentWeek = selectedWeek || getCurrentWeekNumber();
      const updateData = {
        ...row,
        employeeName: user?.employeeName || user?.name,
        employeeNo: user?.id,
        userName: user?.userName,
        sentDate: new Date(),
        weekNumber: String(currentWeek),
        discipline: user?.discipline,
        designation: user?.designation,
      };

      const result = await updateWorkDetails({ id: row.id, data: updateData });
      if (result.success) {
        setSnackbar({
          open: true,
          message: "Work details updated successfully",
          severity: "success",
        });
        refetchWorkDetails();
      } else {
        setSnackbar({
          open: true,
          message: result.error || "Failed to update work details",
          severity: "error",
        });
      }
    },
    [formData, selectedWeek, getCurrentWeekNumber, user, updateWorkDetails, refetchWorkDetails]
  );

  // Enable edit mode
  const handleEdit = useCallback(
    (index) => {
      setIsDisable((prev) => ({
        ...prev,
        [index]: { disable: false },
      }));
    },
    []
  );

  // Get status chip
  const getStatusChip = useCallback((status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "approved") {
      return (
        <Chip
          icon={<CheckCircle />}
          label="Approved"
          color="success"
          size="small"
        />
      );
    } else if (statusLower === "rejected") {
      return (
        <Chip
          icon={<Cancel />}
          label="Rejected"
          color="error"
          size="small"
        />
      );
    }
    return <Chip label="Pending" color="warning" size="small" />;
  }, []);

  // Check if field is disabled
  const isFieldDisabled = useCallback(
    (index, hasId) => {
      if (isDisable?.[index]?.disable === false) return false;
      return hasId ? true : false;
    },
    [isDisable]
  );

  // Check if specific day is disabled
  const isDayDisabled = useCallback(
    (dayIndex, index, hasId) => {
      if (isDateInLeave(weekData?.[dayIndex])) return true;
      return isFieldDisabled(index, hasId);
    },
    [isDateInLeave, weekData, isFieldDisabled]
  );

  const loading = projectsLoading || workDetailsLoading || leaveLoading || areaLoading || variationsLoading;

  if (loading && !formData.length) {
    return <Loading message="Loading time management data..." />;
  }

  return (
    <Box sx={{ p: 3, bgcolor: "grey.50", minHeight: "100vh" }}>
      {/* Header Card */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <Schedule color="primary" />
            <Typography variant="h5" fontWeight="bold">
              Time Management
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Name
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {user?.employeeName || user?.name || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Employee ID
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {user?.id || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Designation
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {user?.designation || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Discipline
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {user?.discipline || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Calendar Week
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={selectedWeek || String(getCurrentWeekNumber())}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                >
                  {weekNumberList.map((week) => (
                    <MenuItem key={week} value={week}>
                      Week {week}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Box sx={{ overflowX: "auto" }}>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table sx={{ minWidth: 1400 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}>
                      S. No
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Reference No</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Project Name</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Task No</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Area of Work</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Variation</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Sub Division</TableCell>
                    {weekData?.map((date, idx) => {
                      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                      return (
                        <TableCell key={idx} sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}>
                          {date}
                          <br />
                          <hr />
                          {days[idx]}
                        </TableCell>
                      );
                    })}
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Total Hours</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Sent Date</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Approved Date</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={20} align="center" sx={{ py: 4 }}>
                        <IconButton
                          onClick={handleAddRow}
                          sx={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "white",
                            "&:hover": {
                              background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                            },
                          }}
                        >
                          <Add />
                        </IconButton>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Click to add work details
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {formData.map((row, index) => (
                    <TableRow key={index} hover>
                      <TableCell align="center">
                        {index !== formData.length - 1 ? (
                          <Typography variant="body2" fontWeight="bold">
                            {index + 1}
                          </Typography>
                        ) : (
                          <IconButton
                            onClick={handleAddRow}
                            size="small"
                            sx={{
                              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              color: "white",
                              "&:hover": {
                                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                              },
                            }}
                          >
                            <Add />
                          </IconButton>
                        )}
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Autocomplete
                            options={referenceNoList || []}
                            value={row.referenceNo || null}
                            disabled={isFieldDisabled(index, !!row.id)}
                            onChange={(e, value) => handleOnChange("referenceNo", value, index)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                error={!!errorMessage?.[index]?.referenceNo}
                                size="small"
                              />
                            )}
                          />
                          {errorMessage?.[index]?.referenceNo && (
                            <FormHelperText error>{errorMessage[index].referenceNo}</FormHelperText>
                          )}
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          variant="outlined"
                          disabled
                          value={row.projectName || ""}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          variant="outlined"
                          disabled
                          value={row.taskNo || ""}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={row.areaofWork || ""}
                            error={!!errorMessage?.[index]?.areaofWork}
                            disabled={isFieldDisabled(index, !!row.id)}
                            onChange={(e) => handleOnChange("areaofWork", e.target.value, index)}
                          >
                            {(areaOfWork || []).map((item) => (
                              <MenuItem key={item.areaofwork} value={item.areaofwork}>
                                {item.areaofwork}
                              </MenuItem>
                            ))}
                          </Select>
                          {errorMessage?.[index]?.areaofWork && (
                            <FormHelperText error>{errorMessage[index].areaofWork}</FormHelperText>
                          )}
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={row.variation || ""}
                            disabled={isFieldDisabled(index, !!row.id)}
                            onChange={(e) => handleOnChange("variation", e.target.value, index)}
                          >
                            {(variations || []).map((item) => (
                              <MenuItem key={item.variation} value={item.variation}>
                                {item.variation}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={row.subDivision || ""}
                            disabled={isFieldDisabled(index, !!row.id)}
                            onChange={(e) => handleOnChange("subDivision", e.target.value, index)}
                          >
                            {(row.subDivisionList?.split(",") || []).map((item, idx) => (
                              <MenuItem key={`${item}-${idx}`} value={item.trim()}>
                                {item.trim()}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(
                        (day, dayIdx) => (
                          <TableCell key={day}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              value={row[day] || ""}
                              disabled={isDayDisabled(dayIdx, index, !!row.id)}
                              onChange={(e) => handleOnChange(day, e.target.value, index)}
                            />
                          </TableCell>
                        )
                      )}
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          variant="outlined"
                          value={row.totalHours || "0.0"}
                          disabled
                        />
                        {errorMessage?.[index]?.totalHours && (
                          <FormHelperText error>{errorMessage[index].totalHours}</FormHelperText>
                        )}
                      </TableCell>
                      <TableCell align="center">{getStatusChip(row.status)}</TableCell>
                      <TableCell>{formatDate(row.sentDate)}</TableCell>
                      <TableCell>{formatDate(row.approvedDate)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} justifyContent="center">
                          {!row.id ? (
                            <>
                              <IconButton
                                onClick={() => handleSubmit(index)}
                                size="small"
                                disabled={addingWork}
                                sx={{
                                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                  color: "white",
                                  "&:hover": {
                                    background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                                  },
                                }}
                              >
                                {addingWork ? <CircularProgress size={16} /> : <Send fontSize="small" />}
                              </IconButton>
                              <IconButton onClick={() => handleDeleteRow(index)} size="small" color="error">
                                <Delete fontSize="small" />
                              </IconButton>
                            </>
                          ) : <p style={{ color: "green" }}>Work Details sent your team lead for approval</p>
                          // row.status?.toLowerCase() === "approved" ? null : (
                          //   <>
                          //     <IconButton onClick={() => handleEdit(index)} size="small" color="primary">
                          //       <Edit fontSize="small" />
                          //     </IconButton>
                          //     <IconButton
                          //       onClick={() => handleUpdate(index)}
                          //       size="small"
                          //       disabled={updatingWork}
                          //       sx={{
                          //         background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          //         color: "white",
                          //         "&:hover": {
                          //           background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                          //         },
                          //       }}
                          //     >
                          //       {updatingWork ? <CircularProgress size={16} /> : <Save fontSize="small" />}
                          //     </IconButton>
                          //   </>
                          // )
                          }
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TimeManagement;
