import React, { useEffect, useState } from "react";
import api from "../services/api";
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
  Stack,
} from "@mui/material";
import {
  Person,
  AccountCircle,
  Lock,
  Save,
} from "@mui/icons-material";
import PageHeaderBreadcrumbs from "../components/PageHeaderBreadcrumbs";
function AddHr() {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/getEmployee")
      .then((res) => {
        if (res.data.Status === "Success") {
          setEmployees(res.data.Result || []);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post("/hr/create", data);
      if (res.data.Error) {
        alert(res.data.Error);
      } else {
        navigate("/Dashboard/hr");
      }
    } catch (err) {
      console.log(err);
      alert("Error creating HR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeaderBreadcrumbs
        items={[
          { label: "Dashboard", to: "/Dashboard" },
          { label: "HR", to: "/Dashboard/hr" },
        ]}
        title="Add HR Manager"
        subtitle="Create a new HR manager account"
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                  HR Information
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth error={Boolean(errors.hrName)}>
                      <InputLabel id="hr-name-label">Select Employee</InputLabel>
                      <Controller
                        name="hrName"
                        control={control}
                        rules={{ required: "Employee selection is required" }}
                        defaultValue=""
                        render={({ field }) => (
                          <Select
                            labelId="hr-name-label"
                            label="Select Employee"
                            {...field}
                            startAdornment={<Person sx={{ mr: 1, color: "text.secondary" }} />}
                          >
                            {employees.map((emp) => (
                              <MenuItem key={emp.id} value={emp.employeeName}>
                                {emp.employeeName} ({emp.EMPID})
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                      <FormHelperText>
                        {errors.hrName && errors.hrName.message}
                      </FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
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
                          InputProps={{
                            startAdornment: (
                              <AccountCircle sx={{ mr: 1, color: "text.secondary" }} />
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="password"
                      control={control}
                      rules={{ required: "Password is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Password"
                          type="password"
                          placeholder="Enter password"
                          error={Boolean(errors.password)}
                          helperText={errors.password?.message}
                          InputProps={{
                            startAdornment: (
                              <Lock sx={{ mr: 1, color: "text.secondary" }} />
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
            onClick={() => navigate("/Dashboard/hr")}
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
              background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
              },
            }}
          >
            {loading ? "Creating..." : "Create HR Manager"}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

export default AddHr;
