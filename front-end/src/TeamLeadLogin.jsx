import React, { useState } from "react";
import "./style.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import commonData from"../common.json"

function TeamLeadLogin() {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();

  axios.defaults.withCredentials = true;
  const navigate = useNavigate();
  axios.defaults.withCredentials = true;
  const [error, setError] = useState("");

  const Submit = (data) => {
    // event.preventDefault();
    axios
      .post(`${commonData?.APIKEY}/teamLeadlogin`, data)
      .then((res) => {
        if (res.data.Status === "Success") {
          const id = res.data.id;
          navigate("/TeamLead");
        } else {
          setError(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 loginPage">
      <div className="p-3 rounded w-25 border loginForm">
        <h2 className="d-flex justify-content-center align-items-center">Login</h2>
        <form onSubmit={handleSubmit(Submit)}>
          <div className="mb-3">
          <Controller
              control={control}
              name="userName"
              rules={{ required: "UserName is required." }}
              render={({ field }) => (
                <Box>
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="User Name"
                    variant="outlined"
                    className="form-control rounded-0"
                    type="text"
                    {...field}
                    error={Boolean(errors.userName)}
                    helperText={errors.userName && errors.userName.message}
                  />
                </Box>
              )}
            />
          </div>
          <div className="mb-3">
          <Controller
              control={control}
              name="password"
              rules={{ required: "password is Reqiured." }}
              render={({ field }) => (
                <Box sx={{}}>
                  <TextField
                    fullWidth
                    id="outlined-basic fullWidth"
                    label="Enter password "
                    variant="outlined"
                    className="form-control rounded-0"
                    type="password"
                    {...field}
                    error={Boolean(errors.password)}
                    helperText={errors.password && errors.password.message}
                  />
                </Box>
              )}
            />
          </div>
          <small className="text-danger mb-2 d-flex justify-content-center align-items-center">
            {error && error}
          </small>

          <Button
            variant="contained"
            type="submit"
            className="btn btn-success w-100 rounded-0"
          >
            Log in
          </Button>
        </form>
      </div>
    </div>
  );
}

export default TeamLeadLogin;
