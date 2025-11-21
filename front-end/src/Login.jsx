import React, { useState, useEffect } from "react";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { useAuth } from "./context/AuthContext";
import ErrorMessage from "./components/ErrorMessage";

function Login() {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  const { login, isAuthenticated, roles } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const Submit = async (data) => {
    setError("");
    setLoading(true);
    const result = await login(data, "employee");
    setLoading(false);

    console.log(result);

    if (!result.success) {
      setError(result.error || "Login failed. Please try again.");
    }
  };

  useEffect(() => {
    if (isAuthenticated && roles) {
      // All roles navigate to the same dashboard initially
      navigate("/Dashboard/EmployeeHome");
    }
  }, [isAuthenticated, roles, navigate]);

  return (
    <Box sx={{ width: "100%" }}>
      <form onSubmit={handleSubmit(Submit)}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Controller
            control={control}
            name="userName"
            rules={{ required: "User Name is required" }}
            render={({ field }) => (
              <TextField
                fullWidth
                label="User Name"
                placeholder="Enter your user name"
                variant="outlined"
                type="text"
                {...field}
                error={Boolean(errors.userName)}
                helperText={errors.userName && errors.userName.message}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                }}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{ required: "Password is required" }}
            render={({ field }) => (
              <TextField
                fullWidth
                label="Password"
                placeholder="Enter your password"
                variant="outlined"
                type="password"
                {...field}
                error={Boolean(errors.password)}
                helperText={errors.password && errors.password.message}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                }}
              />
            )}
          />

          <ErrorMessage error={error} onClose={() => setError("")} />

          <Button
            variant="contained"
            type="submit"
            fullWidth
            size="large"
            disabled={loading}
            sx={{
              mt: 1,
              py: 1.5,
              borderRadius: 2,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              fontWeight: "bold",
              textTransform: "none",
              fontSize: "1rem",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                transform: "translateY(-2px)",
                boxShadow: 4,
              },
              transition: "all 0.3s ease",
            }}
          >
            {loading ? "Logging in..." : "Sign In"}
          </Button>
        </Box>
      </form>
    </Box>
  );
}

export default Login;
