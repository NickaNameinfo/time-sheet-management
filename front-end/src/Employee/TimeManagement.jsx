import axios from "axios";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { startOfWeek, addDays } from "date-fns";
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

function TimeManagement() {
  const [projectList, setProjectList] = useState(null);
  const [projectWorkList, setProjectWorkList] = useState(null);
  const [formData, setFormData] = React.useState(null);
  const [referenceNoList, setReferenceNoList] = React.useState(null);
  const [getUserDetails, setUserDetails] = React.useState(null);
  const [weekData, setWeekDate] = React.useState(null);
  const [employeeName, setEmployeeName] = React.useState(null);
  const [userName, setUserName] = React.useState(null);
  const [isDisable, setIsDisable] = React.useState(null);
  const [errorMessage, setErrorMessage] = React.useState(null);
  const [currentIndex, setCurrentIndex] = React.useState(null);
  const [leaveList, setLeaveList] = React.useState(null);
  console.log("formStateformState", weekData);

  console.log(formData, "projectDetails", leaveList);

  useEffect(() => {
    initData();
    getCurrentWeekNumber();
    getProjectList();
    const currentYear = new Date().getFullYear();
    let datesss = getWeekDates(getCurrentWeekNumber(), currentYear);
    setWeekDate(datesss);
  }, []);

  useEffect(() => {
    if (projectList?.length > 0) {
      setReferenceNoList(projectList?.map((item) => item.referenceNo));
    }
  }, [projectList]);

  React.useEffect(() => {
    if (currentIndex && formData) {
      let tempFormData = [...formData];
      console.log(calculateTotalHours(tempFormData[currentIndex]), "98098");
      tempFormData[currentIndex] = {
        ...formData[currentIndex],
        totalHours: calculateTotalHours(tempFormData[currentIndex]),
      };
      setFormData(tempFormData);
    }
  }, [
    formData?.[currentIndex]?.monday,
    formData?.[currentIndex]?.tuesday,
    formData?.[currentIndex]?.wednesday,
    formData?.[currentIndex]?.thursday,
    formData?.[currentIndex]?.friday,
    formData?.[currentIndex]?.saturday,
    formData?.[currentIndex]?.sunday,
    currentIndex,
  ]);

  React.useEffect(() => {
    if (projectWorkList) {
      let tempObj = [];
      projectWorkList?.map((result, index) => {
        console.log(result, "resultresult");
        tempObj.push({
          employeeName: result?.employeeName,
          referenceNo: result?.referenceNo,
          projectName: result?.projectName,
          tlName: result?.tlName,
          taskNo: result?.taskNo,
          subDivisionList: result?.subDivisionList,
          areaofWork: result?.areaofWork,
          variation: result?.variation,
          subDivision: result?.subDivision,
          monday: result?.monday,
          tuesday: result?.tuesday,
          wednesday: result?.wednesday,
          thursday: result?.thursday,
          friday: result?.friday,
          saturday: result?.saturday,
          sunday: result?.sunday,
          totalHours: result?.totalHours,
          sentDate: result?.sentDate,
          approvedDate: result?.approvedDate,
          id: result?.id,
          status: result?.status,
        });
        console.log(tempObj, "tempObjtempObj");
        setFormData(tempObj);
      });
    }
  }, [projectWorkList]);

  const getCurrentWeekNumber = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now - startOfYear;
    const oneWeekInMilliseconds = 7 * 24 * 60 * 60 * 1000;
    const weekNumber = Math.floor(diff / oneWeekInMilliseconds);

    return weekNumber;
  };

  const getWeekDates = (weekNumber, year) => {
    const startDate = startOfWeek(new Date(year, 0, 1)); // January 1st of the year
    const daysToAdd = (weekNumber - 1) * 7; // Adjust for the selected week number
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const dateWithoutTime = addDays(startDate, daysToAdd + i);
      dates.push(dateWithoutTime.toLocaleDateString());
    }
    console.log(dates, "datesdates123234123");
    return dates;
  };

  const columns = useMemo(
    () => ({
      referenceNo: "",
      projectName: "",
      tlName: "",
      taskNo: "",
      areaofWork: "",
      variation: "",
      subDivision: "",
      monday: null,
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null,
      totalHours: 0,
      status: "",
      sentDate: "",
      approvedDate: "",
    }),
    []
  );

  const initData = () => {
    axios
      .get("http://localhost:8081/getWrokDetails")
      .then(async (res) => {
        let userDetails = await axios.get("http://localhost:8081/dashboard");
        axios.get("http://localhost:8081/getLeaveDetails").then((leaveRes) => {
          console.log(leaveRes, "resres324234");
          if (leaveRes.data.Status === "Success") {
            let tempLeaveResult = leaveRes?.data?.Result?.filter(
              (item) => item.employeeName === userDetails?.data?.userName
            );
            setLeaveList(tempLeaveResult);
            console.log(tempLeaveResult, "tempFinalResult");
          }
        });
        let employeeDetails = await axios.get(
          "http://localhost:8081/getEmployee"
        );
        if (res.data.Status === "Success") {
          let filterProjectData = res.data.Result.filter(
            (items) => items.userName === userDetails.data.userName && getDateYear(items.sentDate) === getDateYear(new Date())
          );
          let filterUserData = employeeDetails.data?.Result?.filter(
            (items) => items.userName === userDetails.data.userName
          );
          setEmployeeName(filterUserData?.[0]?.employeeName);
          setUserName(filterUserData?.[0]?.userName);
          setProjectWorkList(filterProjectData);
          setUserDetails(filterUserData);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const onSubmit = (data, index) => {
    let errorMessages = {};
    if (formData[index]?.areaofWork === "") {
      errorMessages["areaofWork"] = "This fiedl is required";
    }
    if (formData[index]?.subDivision === "") {
      errorMessages["subDivision"] = "This fiedl is required";
    }
    if (formData[index]?.monday === "") {
      errorMessages["monday"] = "This fiedl is required";
    }
    if (formData[index]?.referenceNo === "") {
      errorMessages["referenceNo"] = "This fiedl is required";
    }
    console.log(errorMessages, "errorMessageerrorMessage", errorMessage, index);
    setErrorMessage(() => ({
      [index]: errorMessages,
    }));

    if (Object.keys(errorMessages).length === 0) {
      setErrorMessage([]);
      let tempObjec = {
        employeeName: employeeName,
        userName: userName,
        sentDate: new Date(),
        weekNumber: getCurrentWeekNumber(),
      };
      let submitData = { ...data, ...tempObjec };
      delete submitData.id;
      axios
        .post("http://localhost:8081/project/addWorkDetails", submitData)
        .then((res) => {
          if (res.data.Error) {
            alert(res.data.Error);
          } else {
            setIsDisable((prev) => ({
              ...prev,
              [index]: {
                disable: true,
              },
            }));
            location.reload();
          }
        })
        .catch((err) => console.log(err));
    } else {
      alert("Plese fill all required fields");
    }
  };

  const updateProjectDetails = (params, id) => {
    axios
      .put(`http://localhost:8081/project/updateWorkDetails/` + id, params)
      .then(async (res) => {
        location.reload();
        alert("Update Successfully");
      });
  };

  const handleClickOpen = () => {
    setFormData((prev) => [...prev, columns]);
  };

  const getProjectList = () => {
    axios
      .get("http://localhost:8081/getProject")
      .then((res) => {
        if (res.data.Status === "Success") {
          setProjectList(res.data.Result);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  function calculateTotalHours(formData) {
    console.log(formData.monday, "sdfsdf");
    return (
      (Number(formData.monday) || 0) +
      (Number(formData.tuesday) || 0) +
      (Number(formData.wednesday) || 0) +
      (Number(formData.thursday) || 0) +
      (Number(formData.friday) || 0) +
      (Number(formData.saturday) || 0) +
      (Number(formData.sunday) || 0)
    );
  }

  const handleOnChange = (name, value, index) => {
    console.log(value, name, "tesfadhandle");
    setCurrentIndex(index);
    if (name === "referenceNo") {
      let tempProject = projectList?.filter(
        (item) => item?.referenceNo === value
      );
      let tempFormData = [...formData];
      tempFormData[index] = {
        ...formData[index],
        referenceNo: value,
        projectName: tempProject?.[0]?.projectName,
        tlName: tempProject?.[0]?.tlName,
        taskNo: tempProject?.[0]?.taskJobNo,
        subDivisionList: tempProject?.[0]?.subDivision,
      };
      setFormData(tempFormData);
    } else {
      let tempFormData = [...formData];
      tempFormData[index] = {
        ...formData[index],
        [name]: value,
      };
      setFormData(tempFormData);
    }
  };

  const getDateYear = (value) => {
    const dateObject = new Date(value);
    const year = dateObject.getFullYear();
    const month = dateObject.getMonth() + 1; // Months are 0-indexed, so adding 1
    const day = dateObject.getDate();
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  };

  const onDeleteIndex = (index) => {
    const newData = formData.filter((item, i) => i !== index);
    setFormData(newData);
  };

  const isDateInclude = (date) => {
    let isDateIncluded = leaveList.some((item) => {
      let leaveFrom = item.leaveFrom;
      return leaveFrom === date;
    });
    console.log(date, "adfasdfdate", isDateIncluded);
    return isDateIncluded;
  };

  return (
    <>
      {/* <div className="text-center pb-1 my-3 d-flex align-items-center justify-content-between px-3"> */}
      <div className=" pb-1 my-3 d-flex align-items-center  px-3">
        <div className="container">
          <div className="row p-0">
            <div className="col-4">
              <p>
                NAME : <b>{getUserDetails?.[0]?.employeeName}</b>
              </p>{" "}
              <p></p>
            </div>
            <div className="col-4">
              <p>
                EMPLOYEE ID : <b>{getUserDetails?.[0]?.EMPID}</b>
              </p>
            </div>
            <div className="col-4">
              <p>
                MONTH & YEAR : <b>{getUserDetails?.[0]?.date}</b>
              </p>
            </div>
          </div>
          <div className="row p-0">
            <div className="col">
              <p>
                DESIGNATION : <b>{getUserDetails?.[0]?.designation}</b>
              </p>
            </div>
            <div className="col">
              <p>
                DESCIPLINE : <b>{getUserDetails?.[0]?.discipline}</b>
              </p>
            </div>
            <div className="col">
              <p>
                CALENDAR WEEK : <b>{getCurrentWeekNumber()}</b>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className=" px-3">
        <div>
          <form className="tableSection">
            <table className="table-responsive tablesss table align-middle">
              <thead>
                <tr>
                  <th scope="col" className="text-center">
                    S. No
                  </th>
                  <th scope="col" className="tableHead">
                    referenceNo
                  </th>
                  <th scope="col">projectName</th>
                  <th scope="col">tlName</th>
                  <th scope="col">taskNo</th>
                  <th scope="col">areaofWork</th>
                  <th scope="col">subDivision</th>
                  <th scope="col">
                    {weekData?.[0]} <br />
                    <hr />
                    monday
                  </th>
                  <th scope="col">
                    {" "}
                    {weekData?.[1]} <br />
                    <hr />
                    tuesday
                  </th>
                  <th scope="col">
                    {" "}
                    {weekData?.[2]} <br />
                    <hr />
                    wednesday
                  </th>
                  <th scope="col">
                    {" "}
                    {weekData?.[3]} <br />
                    <hr />
                    thursday
                  </th>
                  <th scope="col">
                    {" "}
                    {weekData?.[4]} <br />
                    <hr />
                    friday
                  </th>
                  <th scope="col">
                    {" "}
                    {weekData?.[5]} <br />
                    <hr />
                    saturday
                  </th>
                  <th scope="col">
                    {" "}
                    {weekData?.[6]} <br />
                    <hr />
                    sunday
                  </th>
                  <th scope="col">totalHours</th>
                  <th scope="col">status</th>
                  <th scope="col">sentDate</th>
                  <th scope="col">approvedDate</th>
                  <th className="fixedColumn">Action</th>
                </tr>
              </thead>

              <tbody>
                {formData &&
                  formData.map((res, index) => (
                    <tr>
                      <td>
                        {index !== formData.length - 1 && index}
                        {index === formData.length - 1 && (
                          <div className="actions addIcon">
                            <i
                              class="fa-solid fa-plus"
                              onClick={() => handleClickOpen()}
                            ></i>
                          </div>
                        )}
                      </td>
                      <td>
                        <FormControl fullWidth>
                          <Select
                            value={formData?.[index]?.referenceNo}
                            defaultValue={formData?.[index]?.referenceNo}
                            error={errorMessage?.[index]?.referenceNo}
                            disabled={
                              isDisable?.[index]?.disable === false
                                ? false
                                : !formData[index]?.id
                                ? false
                                : true
                            }
                            onChange={(e, value) =>
                              handleOnChange(
                                "referenceNo",
                                value.props?.value,
                                index
                              )
                            }
                          >
                            {referenceNoList?.map((res) => (
                              <MenuItem value={res}>{res}</MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>
                            {errorMessage?.[index]?.referenceNo}
                          </FormHelperText>
                        </FormControl>
                      </td>
                      <td>
                        <FormControl fullWidth>
                          <TextField
                            fullWidth
                            variant="outlined"
                            disabled={true}
                            value={formData?.[index]?.projectName}
                          />
                        </FormControl>
                      </td>
                      <td>
                        <TextField
                          fullWidth
                          variant="outlined"
                          disabled={true}
                          value={formData?.[index]?.tlName}
                        />
                      </td>
                      <td>
                        <TextField
                          fullWidth
                          variant="outlined"
                          disabled={true}
                          value={formData?.[index]?.taskNo}
                        />
                      </td>
                      <td>
                        <FormControl fullWidth>
                          <Select
                            value={formData?.[index]?.areaofWork}
                            defaultValue={formData?.[index]?.areaofWork}
                            error={errorMessage?.[index]?.areaofWork}
                            disabled={
                              isDisable?.[index]?.disable === false
                                ? false
                                : !formData[index]?.id
                                ? false
                                : true
                            }
                            onChange={(e, value) =>
                              handleOnChange(
                                "areaofWork",
                                value.props?.value,
                                index
                              )
                            }
                          >
                            <MenuItem value={"Ui"}>UI</MenuItem>
                          </Select>
                          <FormHelperText>
                            {errorMessage?.[index]?.areaofWork}
                          </FormHelperText>
                        </FormControl>
                      </td>
                      <td>
                        <FormControl fullWidth>
                          <Select
                            value={formData?.[index]?.variation}
                            defaultValue={formData?.[index]?.variation}
                            error={errorMessage?.[index]?.variation}
                            disabled={
                              isDisable?.[index]?.disable === false
                                ? false
                                : !formData[index]?.id
                                ? false
                                : true
                            }
                            onChange={(e, value) =>
                              handleOnChange(
                                "variation",
                                value.props?.value,
                                index
                              )
                            }
                          >
                            <MenuItem value={"Ui"}>UI</MenuItem>
                          </Select>
                          <FormHelperText>
                            {errorMessage?.[index]?.variation}
                          </FormHelperText>
                        </FormControl>
                      </td>
                      <td>
                        <FormControl fullWidth>
                          <Select
                            value={formData?.[index]?.subDivision}
                            defaultValue={formData?.[index]?.subDivision}
                            helperText={errorMessage?.[index]?.subDivision}
                            error={errorMessage?.[index]?.subDivision}
                            disabled={
                              isDisable?.[index]?.disable === false
                                ? false
                                : !formData[index]?.id
                                ? false
                                : true
                            }
                            onChange={(e, value) =>
                              handleOnChange(
                                "subDivision",
                                value.props?.value,
                                index
                              )
                            }
                          >
                            {formData?.[index]?.subDivisionList
                              ?.split(",")
                              ?.map((res) => (
                                <MenuItem value={res}>{res}</MenuItem>
                              ))}
                          </Select>
                          <FormHelperText>
                            {errorMessage?.[index]?.subDivision}
                          </FormHelperText>
                        </FormControl>
                      </td>
                      <td>
                        <TextField
                          fullWidth
                          variant="outlined"
                          value={formData?.[index]?.monday}
                          helperText={errorMessage?.[index]?.monday}
                          error={errorMessage?.[index]?.monday}
                          type="number"
                          onChange={(e) =>
                            handleOnChange("monday", e.target.value, index)
                          }
                          disabled={
                            isDisable?.[index]?.disable === false
                              ? false
                              : formData[index]?.id
                              ? true
                              : isDateInclude(weekData?.[0])
                              ? true
                              : false
                          }
                        />
                      </td>
                      <td>
                        <TextField
                          fullWidth
                          variant="outlined"
                          value={formData?.[index]?.tuesday}
                          type="number"
                          onChange={(e, value) =>
                            handleOnChange("tuesday", e.target.value, index)
                          }
                          disabled={
                            isDisable?.[index]?.disable === false
                              ? false
                              : formData[index]?.id
                              ? true
                              : isDateInclude(weekData?.[1])
                              ? true
                              : false
                          }
                        />
                      </td>
                      <td>
                        <TextField
                          fullWidth
                          variant="outlined"
                          value={formData?.[index]?.wednesday}
                          type="number"
                          onChange={(e, value) =>
                            handleOnChange("wednesday", e.target.value, index)
                          }
                          disabled={
                            isDisable?.[index]?.disable === false
                              ? false
                              : formData[index]?.id
                              ? true
                              : isDateInclude(weekData?.[2])
                              ? true
                              : false
                          }
                        />
                      </td>
                      <td>
                        <TextField
                          fullWidth
                          variant="outlined"
                          value={formData?.[index]?.thursday}
                          type="number"
                          onChange={(e, value) =>
                            handleOnChange("thursday", e.target.value, index)
                          }
                          disabled={
                            isDisable?.[index]?.disable === false
                              ? false
                              : formData[index]?.id
                              ? true
                              : isDateInclude(weekData?.[3])
                              ? true
                              : false
                          }
                        />
                      </td>
                      <td>
                        <TextField
                          fullWidth
                          variant="outlined"
                          value={formData?.[index]?.friday}
                          type="number"
                          onChange={(e, value) =>
                            handleOnChange("friday", e.target.value, index)
                          }
                          disabled={
                            isDisable?.[index]?.disable === false
                              ? false
                              : formData[index]?.id
                              ? true
                              : isDateInclude(weekData?.[4])
                              ? true
                              : false
                          }
                        />
                      </td>
                      <td>
                        <TextField
                          fullWidth
                          variant="outlined"
                          value={formData?.[index]?.saturday}
                          type="number"
                          onChange={(e, value) =>
                            handleOnChange("saturday", e.target.value, index)
                          }
                          disabled={
                            isDisable?.[index]?.disable === false
                              ? false
                              : formData[index]?.id
                              ? true
                              : isDateInclude(weekData?.[5])
                              ? true
                              : false
                          }
                        />
                      </td>
                      <td>
                        <TextField
                          fullWidth
                          variant="outlined"
                          value={formData?.[index]?.sunday}
                          type="number"
                          onChange={(e, value) =>
                            handleOnChange("sunday", e.target.value, index)
                          }
                          disabled={
                            isDisable?.[index]?.disable === false
                              ? false
                              : formData[index]?.id
                              ? true
                              : isDateInclude(weekData?.[6])
                              ? true
                              : false
                          }
                        />
                      </td>
                      <td>
                        <TextField
                          fullWidth
                          variant="outlined"
                          value={formData?.[index]?.totalHours}
                          type="number"
                          onChange={(e, value) =>
                            handleOnChange("totalHours", e.target.value, index)
                          }
                          disabled={true}
                        />
                      </td>
                      <td>
                        <div className="d-flex justify-content-center align-items-center h-100">
                          {formData?.[index]?.status?.toLowerCase() ===
                          "approved" ? (
                            <i
                              class="fa-regular fa-circle-check"
                              style={{ fontSize: "20px", color: "green" }}
                            ></i>
                          ) : formData?.[index]?.status?.toLowerCase() ===
                            "rejected" ? (
                            <i
                              class="fa-regular fa-circle-xmark"
                              style={{ fontSize: "20px", color: "red" }}
                            ></i>
                          ) : (
                            <i
                              class="fa-solid fa-circle"
                              style={{ fontSize: "20px", color: "orange" }}
                            ></i>
                          )}
                        </div>
                      </td>
                      <td>
                        {formData?.[index]?.sentDate
                          ? getDateYear(formData?.[index]?.sentDate)
                          : null}
                      </td>
                      <td>
                        {formData?.[index]?.approvedDate
                          ? getDateYear(formData?.[index]?.approvedDate)
                          : null}
                      </td>
                      <td
                        className="fixedColumn actions"
                        style={{ height: "70px" }}
                      >
                        {!formData[index]?.id ? (
                          <>
                            <i
                              style={{
                                color: "color",
                                backgroundColor: "green",
                              }}
                              class="fa-solid fa-share"
                              onClick={() => onSubmit(formData[index], index)}
                            ></i>
                            <i
                              class="fa-solid fa-trash"
                              onClick={() => onDeleteIndex(index)}
                            ></i>
                          </>
                        ) : formData?.[index]?.status?.toLowerCase() ===
                          "approved" ? null : (
                          <>
                            <i
                              class="fa-solid fa-pen-to-square"
                              onClick={() => {
                                setIsDisable((prev) => ({
                                  ...prev,
                                  [index]: {
                                    disable: false,
                                  },
                                }));
                              }}
                            ></i>
                            <i
                              style={{
                                color: "color",
                                backgroundColor: "green",
                              }}
                              class="fa-regular fa-floppy-disk"
                              onClick={() =>
                                updateProjectDetails(
                                  formData[index],
                                  formData[index]?.id
                                )
                              }
                            ></i>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </form>
        </div>
      </div>

      {/* 
      <Dialog
        fullWidth
        open={open}
        maxWidth="md"
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle
          id="alert-dialog-title"
          className="d-flex align-items-center justify-content-between"
        >
          <h2>{"Add Work Details"}</h2>
          <i class="fa-solid fa-xmark cursor-pointer" onClick={() => setOpen(false)} style={{cursor: "pointer"}}></i>
        </DialogTitle>
        <AddProjectDetails onSubmitValue={(value) => setOpen(false)} />
      </Dialog> */}
    </>
  );
}

export default TimeManagement;
