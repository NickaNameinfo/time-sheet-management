import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import commonData from "../../common.json";
import { TextareaAutosize } from "@mui/material";
function AddUpdates() {
  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm();
  const navigate = useNavigate();

  const onSubmit = (data) => {
    // const formdata = new FormData();
    // // Append all fields except for the file input
    // Object.keys(data).forEach((key) => {
    //   const value = data[key];
    //   formdata.append(key, value);
    // });

    console.log(data, "data121212");
    // Append the file input separately
    // formdata.append("Announcements", data.Announcements);
    axios
      .post(`${commonData?.APIKEY}/create/updates`, data)
      .then((res) => {
        if (res.data.Error) {
          alert(res.data.Error);
        } else {
          navigate("/Dashboard/Settings");
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <div className="mainBody">
      <div className="mt-4">
        <h2 className="heading">Company updates</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="gy-3 row">
            <div className="col-sm-12">
              <Controller
                control={control}
                name="updateTitle"
                rules={{ required: "updateTitle is required." }}
                render={({ field }) => (
                  <Box>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Enter Title "
                      variant="outlined"
                      type="text"
                      {...field}
                      error={Boolean(errors.updateTitle)}
                      helperText={
                        errors.updateTitle && errors.updateTitle.message
                      }
                    />
                  </Box>
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="UpdateDisc"
                rules={{ required: "UpdateDisc is Reqiured." }}
                render={({ field }) => (
                  <Box sx={{}}>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Enter Discription "
                      variant="outlined"
                      // type="password"
                      {...field}
                      error={Boolean(errors.UpdateDisc)}
                      helperText={
                        errors.UpdateDisc && errors.UpdateDisc.message
                      }
                    />
                  </Box>
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="Announcements"
                rules={{ required: "Announcements is Reqiured." }}
                render={({ field }) => (
                  <Box sx={{}}>
                    <TextareaAutosize
                      fullWidth
                      minRows={3}
                      id="outlined-basic fullWidth"
                      placeholder="Announcements"
                      variant="outlined"
                      // type="password"
                      {...field}
                      error={Boolean(errors.Announcements)}
                      helperText={
                        errors.Announcements && errors.Announcements.message
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                      }}
                    />
                  </Box>
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="Circular"
                rules={{ required: "Circular is Reqiured." }}
                render={({ field }) => (
                  <Box sx={{}}>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Enter Circular URL"
                      variant="outlined"
                      // type="password"
                      {...field}
                      error={Boolean(errors.Circular)}
                      helperText={errors.Circular && errors.Circular.message}
                    />
                  </Box>
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="Gallery"
                rules={{ required: "Gallery is Reqiured." }}
                render={({ field }) => (
                  <Box sx={{}}>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Enter Gallery URL"
                      variant="outlined"
                      // type="password"
                      {...field}
                      error={Boolean(errors.Gallery)}
                      helperText={errors.Gallery && errors.Gallery.message}
                    />
                  </Box>
                )}
              />
            </div>
            <div className="col-sm-12">
              <Controller
                control={control}
                name="ViewExcel"
                rules={{ required: "ViewExcel is Reqiured." }}
                render={({ field }) => (
                  <Box sx={{}}>
                    <TextField
                      fullWidth
                      id="outlined-basic fullWidth"
                      label="Enter ViewExcel URL"
                      variant="outlined"
                      // type="password"
                      {...field}
                      error={Boolean(errors.ViewExcel)}
                      helperText={errors.ViewExcel && errors.ViewExcel.message}
                    />
                  </Box>
                )}
              />
            </div>
            {/* <div className="col-sm-12">
              <label className="my-3">Announcements Image</label>
              <Controller
                control={control}
                name="Announcements"
                render={({ field }) => (
                  <Box>
                    <input
                      label="Announcements Image"
                      variant="outlined"
                      accept=".jpg, .png, .jpeg"
                      onChange={(e) =>
                        setValue("Announcements", e.target.files[0])
                      }
                      type="file"
                    />
                  </Box>
                )}
              />
            </div> */}
          </div>
          <button type="submit" className="btn btn-primary button">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddUpdates;
