import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
  Group,
  Save,
} from "@mui/icons-material";
import commonData from "../../common.json";

function AddLead() {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  const [empList, setEmpList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios
      .get(`${commonData?.APIKEY}/getEmployee`)
      .then((res) => {
        if (res.data.Status === "Success") {
          const filtered = res?.data?.Result.filter(
            (item) => item.role === "TL" || item.role === "Admin"
          );
          setEmpList(filtered || []);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const foundEmployee = empList?.find(
        (employee) => employee.EMPID === data?.EMPID
      );
      const tempData = {
        ...data,
        leadName: foundEmployee?.employeeName,
      };

      const res = await axios.post(`${commonData?.APIKEY}/lead/create`, tempData);
      if (res.data.Error) {
        alert(res.data.Error);
      } else {
        navigate("/Dashboard/lead");
      }
    } catch (err) {
      console.log(err);
      alert("Error creating lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 2 }}>
        <IconButton onClick={() => navigate("/Dashboard/lead")} color="primary">
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Add Team Lead
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create a new team lead assignment
          </Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                  Team Lead Information
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth error={Boolean(errors.EMPID)}>
                      <InputLabel id="employee-select-label">Select Employee</InputLabel>
                      <Controller
                        name="EMPID"
                        control={control}
                        rules={{ required: "Employee selection is required" }}
                        defaultValue=""
                        render={({ field }) => (
                          <Select
                            labelId="employee-select-label"
                            label="Select Employee"
                            {...field}
                            startAdornment={<Person sx={{ mr: 1, color: "text.secondary" }} />}
                          >
                            {empList?.map((emp) => (
                              <MenuItem value={emp?.EMPID} key={emp.id}>
                                {emp?.employeeName} ({emp?.EMPID})
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                      <FormHelperText>
                        {errors.EMPID && errors.EMPID.message}
                      </FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="teamName"
                      control={control}
                      rules={{ required: "Team name is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Team Name"
                          placeholder="Enter team name"
                          error={Boolean(errors.teamName)}
                          helperText={errors.teamName?.message}
                          InputProps={{
                            startAdornment: (
                              <Group sx={{ mr: 1, color: "text.secondary" }} />
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
            onClick={() => navigate("/Dashboard/lead")}
            size="large"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<Save />}
            size="large"
            disabled={loading}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            {loading ? "Creating..." : "Create Team Lead"}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

export default AddLead;
