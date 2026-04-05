import React, { useState, useEffect } from "react";
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
  Save,
  CalendarToday,
  Person,
  Business,
  Phone,
  Email,
  LocationOn,
  Assignment,
} from "@mui/icons-material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { apiService } from "../../services/api.js";
import { useParams } from "react-router-dom";
import PageHeaderBreadcrumbs from "../../components/PageHeaderBreadcrumbs";

function AddCrmDate() {
  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm();
  
  const navigate = useNavigate();
  const { id } = useParams();
  const formData = watch();

  useEffect(() => {
    if (id) {
      // Load existing CRM entry for editing
      apiService.getCrm(id)
        .then((response) => {
          if (response.data.Status === "Success") {
            const crmData = response.data.Result;
            setValue("crmDate", crmData.crmDate);
            setValue("clientName", crmData.clientName);
            setValue("contactPerson", crmData.contactPerson || "");
            setValue("phone", crmData.phone || "");
            setValue("email", crmData.email || "");
            setValue("location", crmData.location || "");
            setValue("notes", crmData.notes || "");
            setValue("status", crmData.status || "New");
            setValue("scheduleDate", crmData.scheduleDate || "");
            setValue("from", crmData.lead_from || crmData.from || "");
          }
        })
        .catch((error) => {
          console.error("Error loading CRM:", error);
          alert("Error loading CRM entry");
        });
    }
  }, [id, setValue]);

  const onSubmit = async (data) => {
    try {
      let response;
      if (id) {
        // Update existing entry
        response = await apiService.updateCrm(id, data);
      } else {
        // Create new entry
        response = await apiService.createCrm(data);
      }
      
      if (response.data.Status === "Success") {
        alert(id ? "CRM entry updated successfully!" : "CRM Date added successfully!");
        navigate("/Dashboard/Sales/CrmList");
      } else {
        alert(response.data.Error || `Failed to ${id ? "update" : "add"} CRM date`);
      }
    } catch (error) {
      console.error(`Error ${id ? "updating" : "adding"} CRM date:`, error);
      alert(error.response?.data?.Error || `Error ${id ? "updating" : "adding"} CRM date. Please try again.`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeaderBreadcrumbs
        items={[
          { label: "Dashboard", to: "/Dashboard" },
          { label: "Sales", to: "/Dashboard/Sales" },
          { label: "CRM list", to: "/Dashboard/Sales/CrmList" },
        ]}
        title={id ? "Edit CRM Date" : "Add CRM Date"}
        subtitle={id ? "Update CRM entry details" : "Add a new CRM entry with date and details"}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                  CRM Information
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Controller
                        name="crmDate"
                        control={control}
                        rules={{ required: "CRM Date is required" }}
                        render={({ field }) => (
                          <DatePicker
                            label="CRM Date"
                            value={formData?.crmDate ? dayjs(formData.crmDate) : null}
                            onChange={(newValue) =>
                              setValue(
                                "crmDate",
                                newValue ? dayjs(newValue).format("YYYY-MM-DD") : ""
                              )
                            }
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: Boolean(errors.crmDate),
                                helperText: errors.crmDate?.message,
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
                      name="clientName"
                      control={control}
                      rules={{ required: "Client Name is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Client Name"
                          error={Boolean(errors.clientName)}
                          helperText={errors.clientName?.message}
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
                      name="contactPerson"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Contact Person"
                          error={Boolean(errors.contactPerson)}
                          helperText={errors.contactPerson?.message}
                          InputProps={{
                            startAdornment: (
                              <Person sx={{ mr: 1, color: "text.secondary" }} />
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Phone Number"
                          type="tel"
                          error={Boolean(errors.phone)}
                          helperText={errors.phone?.message}
                          InputProps={{
                            startAdornment: (
                              <Phone sx={{ mr: 1, color: "text.secondary" }} />
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Email"
                          type="email"
                          error={Boolean(errors.email)}
                          helperText={errors.email?.message}
                          InputProps={{
                            startAdornment: (
                              <Email sx={{ mr: 1, color: "text.secondary" }} />
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="location"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Location"
                          error={Boolean(errors.location)}
                          helperText={errors.location?.message}
                          InputProps={{
                            startAdornment: (
                              <LocationOn sx={{ mr: 1, color: "text.secondary" }} />
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="from"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="From (Lead source)"
                          placeholder='e.g. Website / Facebook / Referral'
                          error={Boolean(errors.from)}
                          helperText={errors.from?.message}
                          InputProps={{
                            startAdornment: (
                              <Assignment sx={{ mr: 1, color: "text.secondary" }} />
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="status"
                      control={control}
                      rules={{ required: "Status is required" }}
                      defaultValue="New"
                      render={({ field }) => (
                        <FormControl fullWidth error={Boolean(errors.status)}>
                          <InputLabel>Status</InputLabel>
                          <Select
                            {...field}
                            label="Status"
                          >
                            <MenuItem value="New">New</MenuItem>
                            <MenuItem value="Attended">Attended</MenuItem>
                            <MenuItem value="Follow Up">Follow Up</MenuItem>
                            <MenuItem value="Not Attended">Not Attended</MenuItem>
                            <MenuItem value="Details Pending">Details Pending</MenuItem>
                            <MenuItem value="Rescheduled">Rescheduled</MenuItem>
                            <MenuItem value="Message Send">Message Send</MenuItem>
                            <MenuItem value="Product Provided">Product Provided</MenuItem>
                            <MenuItem value="Not Interest">Not Interest</MenuItem>
                            <MenuItem value="Registered Pending">Registered Pending</MenuItem>
                            <MenuItem value="Pending Product Update">Pending Product Update</MenuItem>
                            <MenuItem value="Online Order Enable Pending">Online Order Enable Pending</MenuItem>
                            <MenuItem value="Need Other Service">Need Other Service</MenuItem>
                            <MenuItem value="Service Provider">Service Provider</MenuItem>
                          </Select>
                          {errors.status && (
                            <FormHelperText>{errors.status.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>

                  {formData?.status === "Rescheduled" && (
                    <Grid item xs={12} sm={6}>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Controller
                          name="scheduleDate"
                          control={control}
                          rules={{
                            required: formData?.status === "Rescheduled" ? "Schedule Date is required when status is Rescheduled" : false
                          }}
                          render={({ field }) => (
                            <DatePicker
                              label="Schedule Date"
                              value={formData?.scheduleDate ? dayjs(formData.scheduleDate) : null}
                              onChange={(newValue) =>
                                setValue(
                                  "scheduleDate",
                                  newValue ? dayjs(newValue).format("YYYY-MM-DD") : ""
                                )
                              }
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  error: Boolean(errors.scheduleDate),
                                  helperText: errors.scheduleDate?.message,
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
                  )}

                  <Grid item xs={12}>
                    <Controller
                      name="notes"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Notes"
                          multiline
                          rows={4}
                          placeholder="Enter any additional notes or comments..."
                          error={Boolean(errors.notes)}
                          helperText={errors.notes?.message}
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
            onClick={() => navigate("/Dashboard/Sales/CrmList")}
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
            {id ? "Update CRM Date" : "Add CRM Date"}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

export default AddCrmDate;

