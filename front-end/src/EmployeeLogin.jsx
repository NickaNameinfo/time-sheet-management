import React, { useState, useEffect } from "react";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { useAuth } from "./context/AuthContext";
import ErrorMessage from "./components/ErrorMessage";

function EmployeeLogin() {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const Submit = async (data) => {
    setError("");
    setLoading(true);
    const result = await login(data, "employee");
    setLoading(false);

    if (result.success) {
      navigate("/Employee");
    } else {
      setError(result.error || "Invalid Username and password");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/Employee");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 loginPage">
      <div className="p-3 rounded w-25 border loginForm">
        <h2 className="d-flex justify-content-center align-items-center">
          Login
        </h2>
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
          <ErrorMessage error={error} onClose={() => setError("")} />

          <Button
            variant="contained"
            type="submit"
            className="btn btn-success w-100 rounded-0"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default EmployeeLogin;
