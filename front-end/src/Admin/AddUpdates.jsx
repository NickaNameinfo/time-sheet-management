import React from "react";
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
  Stack,
  FormControlLabel,
  Checkbox,
  FormGroup,
} from "@mui/material";
import {
  Article,
  Announcement,
  Description,
  PhotoLibrary,
  TableChart,
  Save,
} from "@mui/icons-material";
import PageHeaderBreadcrumbs from "../components/PageHeaderBreadcrumbs";
function AddUpdates() {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      Announcements: false,
      Circular: false,
      Gallery: false,
      ViewExcel: false,
    },
  });
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const res = await api.post("/create/updates", data);
      if (res.data.Error) {
        alert(res.data.Error);
      } else {
        navigate("/Dashboard/Settings");
      }
    } catch (err) {
      console.log(err);
      alert("Error creating update");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeaderBreadcrumbs
        items={[
          { label: "Dashboard", to: "/Dashboard" },
          { label: "Settings", to: "/Dashboard/Settings" },
        ]}
        title="Add Company Update"
        subtitle="Create a new company update or announcement"
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                  Update Information
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="updateTitle"
                      control={control}
                      rules={{ required: "Title is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Update Title"
                          placeholder="Enter update title"
                          error={Boolean(errors.updateTitle)}
                          helperText={errors.updateTitle?.message}
                          InputProps={{
                            startAdornment: (
                              <Article sx={{ mr: 1, color: "text.secondary" }} />
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="UpdateDisc"
                      control={control}
                      rules={{ required: "Description is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          multiline
                          rows={4}
                          label="Update Description"
                          placeholder="Enter update description"
                          error={Boolean(errors.UpdateDisc)}
                          helperText={errors.UpdateDisc?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Update Options
                    </Typography>
                    <FormGroup>
                      <Controller
                        name="Announcements"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                {...field}
                                checked={field.value || false}
                                icon={<Announcement />}
                                checkedIcon={<Announcement color="info" />}
                              />
                            }
                            label="Announcements"
                          />
                        )}
                      />
                      <Controller
                        name="Circular"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                {...field}
                                checked={field.value || false}
                                icon={<Description />}
                                checkedIcon={<Description color="warning" />}
                              />
                            }
                            label="Circular"
                          />
                        )}
                      />
                      <Controller
                        name="Gallery"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                {...field}
                                checked={field.value || false}
                                icon={<PhotoLibrary />}
                                checkedIcon={<PhotoLibrary color="success" />}
                              />
                            }
                            label="Gallery"
                          />
                        )}
                      />
                      <Controller
                        name="ViewExcel"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                {...field}
                                checked={field.value || false}
                                icon={<TableChart />}
                                checkedIcon={<TableChart color="secondary" />}
                              />
                            }
                            label="View Excel"
                          />
                        )}
                      />
                    </FormGroup>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate("/Dashboard/Settings")}
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
            Create Update
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

export default AddUpdates;
