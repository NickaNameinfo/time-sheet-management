import React, { useState } from "react";
import "./style.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import commonData from "../common.json";
function Login() {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  axios.defaults.withCredentials = true;
  const [error, setError] = useState("");
  const [roles, setRoles] = React.useState(null);

  console.log(commonData, "data1223423");
  const Submit = (data) => {
    console.log(commonData, "data1223423");

    axios
      .post(`${commonData?.APIKEY}/employeelogin`, data, {
        withCredentials: true,
      })
      .then((res) => {
        localStorage.setItem("token", res?.data.tokensss);
        if (res.status === 200) {
          axios
            .post(`${commonData?.APIKEY}/dashboard`, res?.data)
            .then((ress) => {
              console.log(ress, "ressressress");
              setRoles(ress.data.role?.split(","));
            });
        } else {
          setError(res.data.Error);
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setError("User Name or Password is incorrect.");
        }
      });
  };

  React.useEffect(() => {
    if (roles?.includes("Admin")) {
      console.log(roles, "rolesrolesroles");
      navigate("/Dashboard");
    } else if (roles?.includes("TL")) {
      navigate("/Dashboard/TeamLeadHome");
    } else if (roles?.includes("Employee")) {
      navigate("/Dashboard/EmployeeHome");
    } else if (roles?.includes("HR")) {
      navigate("/Dashboard/hr");
    }
  }, [roles]);

  return (
    <div className="d-flex justify-content-center align-items-center loginPage">
      <div>
        <h2 className="d-flex justify-content-center align-items-center my-3 text-white">
          Login
        </h2>
        <form onSubmit={handleSubmit(Submit)} className="loginform">
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
                    placeholder="User Name"
                    variant="outlined"
                    className="form-control rounded-1"
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
                    placeholder="Enter password "
                    variant="outlined"
                    className="form-control rounded-1"
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
            className="btn btn-success w-100 rounded-1"
          >
            Log in
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Login;
