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
  Group,
  Save,
} from "@mui/icons-material";
import PageHeaderBreadcrumbs from "../components/PageHeaderBreadcrumbs";
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
    api
      .get("/getEmployee")
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

      const res = await api.post("/lead/create", tempData);
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
      <PageHeaderBreadcrumbs
        items={[
          { label: "Dashboard", to: "/Dashboard" },
          { label: "Leads", to: "/Dashboard/lead" },
        ]}
        title="Add Team Lead"
        subtitle="Create a new team lead assignment"
      />

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
              background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #3d6dd1 0%, #3d8b40 100%)",
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
