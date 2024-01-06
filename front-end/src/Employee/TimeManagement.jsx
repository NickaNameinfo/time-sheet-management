import axios from "axios";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  Autocomplete,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import commonData from "../../common.json";

const TimeManagement = () => {
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
  const [selectedWeek, setSelectedWeek] = React.useState(null);
  const [weekNumberList, setWeekNumberList] = React.useState(null);
  const [refresh, setRefresh] = React.useState(false);
  const [areaofWork, setAreaofWork] = React.useState(null);
  const [variation, setVariation] = React.useState(null);
  const [totalMinit, setTotalMinit] = React.useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    initData(selectedWeek ? selectedWeek : getCurrentWeekNumber());
    getCurrentWeekNumber();
    getProjectList();
    const currentYear = new Date().getFullYear();
    let datesss = getWeekDates(
      selectedWeek ? selectedWeek : getCurrentWeekNumber(),
      currentYear
    );
    setWeekDate(datesss);
    let tempList = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
      40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52,
    ];
    setWeekNumberList(tempList);
    getAreaofWorkDeails();
    getVariation();
  }, [selectedWeek, refresh]);

  useEffect(() => {
    if (projectList?.length > 0) {
      setReferenceNoList(projectList?.map((item) => item.referenceNo));
    }
  }, [projectList]);

  React.useEffect(() => {
    if (formData) {
      let hours = Math.floor(totalMinit / 60);
      let remainingMinutes = totalMinit % 60;
      let tempFormData = [...formData];
      tempFormData[currentIndex] = {
        ...formData[currentIndex],
        totalHours: `${
          calculateTotalHours(tempFormData[currentIndex]) + hours
        }.${remainingMinutes}`,
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
    totalMinit,
  ]);

  React.useEffect(() => {
    if (projectWorkList?.length > 0) {
      let tempObj = [];
      projectWorkList?.map((result, index) => {
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
    } else {
      setFormData(null);
    }
  }, [projectWorkList]);

  const getCurrentWeekNumber = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1); // Changed day from 0 to 1
    const diff = now - startOfYear;
    const oneWeekInMilliseconds = 7 * 24 * 60 * 60 * 1000;
    const weekNumber = Math.floor(diff / oneWeekInMilliseconds) + 1; // Added 1 to account for week 0
    return weekNumber;
  };

  const startOfWeek = (date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? 1 : 1); // Adjust for Sunday as start of week
    return new Date(date.setDate(diff));
  };

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const getWeekDates = (weekNumber, year) => {
    const startDate = startOfWeek(new Date(year, 0, 1)); // January 1st of the year
    const daysToAdd = (weekNumber - 1) * 7; // Adjust for the selected week number
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(startDate, daysToAdd + i);
      dates.push(date.toLocaleDateString());
    }
    return dates;
  };

  const columns = useMemo(
    () => ({
      referenceNo: "",
      projectName: "",
      // tlName: "",
      taskNo: "",
      areaofWork: "",
      variation: "",
      subDivision: "",
      monday: "",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
      saturday: "",
      sunday: "",
      totalHours: "",
      status: "",
      sentDate: "",
      approvedDate: "",
    }),
    []
  );

  const initData = (weekNumber) => {
    axios
      .get(`${commonData?.APIKEY}/getWrokDetails`)
      .then(async (res) => {
        let userDetails = await axios.post(`${commonData?.APIKEY}/dashboard`, {
          tokensss: token,
        });
        axios.get(`${commonData?.APIKEY}/getLeaveDetails`).then((leaveRes) => {
          if (leaveRes.data.Status === "Success") {
            let tempLeaveResult = leaveRes?.data?.Result?.filter(
              (item) => item.employeeId === userDetails?.data?.employeeId
            );
            setLeaveList(tempLeaveResult);
          }
        });
        let employeeDetails = await axios.get(
          `${commonData?.APIKEY}/getEmployee`
        );
        if (res.data.Status === "Success") {
          let filterProjectData = res.data.Result.filter(
            (items) =>
              items.employeeNo === userDetails.data.employeeId &&
              items.weekNumber === String(weekNumber) &&
              new Date(items.sentDate).getFullYear() ===
                new Date().getFullYear()
          );
          let filterUserData = employeeDetails.data?.Result?.filter(
            (items) => items.EMPID === userDetails.data.employeeId
          );
          setEmployeeName(filterUserData?.[0]?.employeeName);
          setUserName(userDetails.data.employeeId);
          setProjectWorkList(filterProjectData);
          setUserDetails(filterUserData);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const getAreaofWorkDeails = () => {
    axios.get(`${commonData?.APIKEY}/areaofwork`).then((res) => {
      setAreaofWork(res.data.Result);
    });
  };
  const getVariation = () => {
    axios.get(`${commonData?.APIKEY}/variation`).then((res) => {
      setVariation(res.data.Result);
    });
  };

  const onSubmit = (data, index) => {
    let errorMessages = {};
    if (formData[index]?.areaofWork === "") {
      errorMessages["areaofWork"] = "This fiedl is required";
    }
    // if (formData[index]?.subDivision === "") {
    //   errorMessages["subDivision"] = "This fiedl is required";
    // }
    // if (formData[index]?.monday === "") {
    //   errorMessages["monday"] = "This fiedl is required";
    // }
    if (formData[index]?.referenceNo === "") {
      errorMessages["referenceNo"] = "This fiedl is required";
    }
    if (!formData?.[index]?.totalHours || formData?.[index]?.totalHours === '0.0') {
      errorMessages["TotalWrok"] = "This fiedl is required";
      alert("Total work hours should not 0");
    }
    console.log(
      errorMessages,
      "errorMessageerrorMessage",
      errorMessage,
      formData?.[index]?.totalHours
    );
    setErrorMessage(() => ({
      [index]: errorMessages,
    }));
    console.log(getUserDetails, "getUserDetails2453", data);
    if (Object.keys(errorMessages).length === 0) {
      setErrorMessage([]);
      let tempObjec = {
        employeeName: employeeName,
        employeeNo: userName,
        sentDate: new Date(),
        weekNumber: selectedWeek
          ? selectedWeek
          : String(getCurrentWeekNumber()),
        discipline: getUserDetails?.[0]?.discipline,
        designation: getUserDetails?.[0]?.designation,
      };
      let submitData = { ...data, ...tempObjec };
      delete submitData.id;
      axios
        .post(`${commonData?.APIKEY}/project/addWorkDetails`, submitData)
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
            setRefresh(true);
          }
        })
        .catch((err) => console.log(err));
    } else {
      alert("Plese fill all required fields");
    }
  };

  const updateProjectDetails = (params, id) => {
    let tempObjec = {
      employeeName: employeeName,
      employeeNo: userName,
      sentDate: new Date(),
      weekNumber: selectedWeek ? selectedWeek : String(getCurrentWeekNumber()),
      discipline: getUserDetails?.[0]?.discipline,
      designation: getUserDetails?.[0]?.designation,
    };
    let submitData = { ...params, ...tempObjec };
    axios
      .put(`${commonData?.APIKEY}/project/updateWorkDetails/` + id, submitData)
      .then(async (res) => {
        location.reload();
        alert("Update Successfully");
      });
  };

  const handleClickOpen = () => {
    if (!formData) {
      setFormData((prev) => [columns]);
    } else {
      setFormData((prev) => [...prev, columns]);
    }
  };

  const getProjectList = () => {
    axios
      .get(`${commonData?.APIKEY}/getProject`)
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
    const minit = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ].reduce((sum, day) => {
      return formData?.[day]?.includes(".")
        ? sum + Number(formData?.[day]?.split(".")[1] || 0)
        : sum;
    }, 0);
    setTotalMinit(minit);
    let tempWorkHours = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ].reduce(
      (sum, day) =>
        formData?.[day]?.includes(".")
          ? sum + Number(formData?.[day]?.split(".")[0] || 0)
          : !formData?.[day]?.includes(".")
          ? sum + Number(formData?.[day]?.split(".")[0] || 0)
          : sum,
      0
    );
    return tempWorkHours;
  }

  const handleOnChange = (name, value, index) => {
    if (value?.match(/[^0-9.]/) && !isNaN(value)) {
      preventDefault();
    }
    setCurrentIndex(index);
    if (name === "referenceNo") {
      let tempProject = projectList?.filter(
        (item) => item?.referenceNo === value
      );
      console.log(tempProject, "tempProject123")
      let tempFormData = [...formData];
      tempFormData[index] = {
        ...formData[index],
        referenceNo: value,
        projectName: tempProject?.[0]?.projectName,
        tlName: tempProject?.[0]?.tlName,
        userName: tempProject?.[0]?.tlID,
        taskNo: tempProject?.[0]?.taskJobNo,
        subDivisionList: tempProject?.[0]?.subDivision,
        allotatedHours: tempProject?.[0]?.allotatedHours,
        desciplineCode: tempProject?.[0]?.desciplineCode,
        projectNo: tempProject?.[0]?.projectNo,
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
    let isDateIncluded = leaveList?.some((item) => {
      return getDateYear(item.leaveFrom) === getDateYear(date);
    });
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
                CALENDAR WEEK :{" "}
                <b>
                  {
                    <Select
                      className="noPaddingInput"
                      value={
                        selectedWeek
                          ? selectedWeek
                          : String(getCurrentWeekNumber())
                      }
                      defaultValue={String(getCurrentWeekNumber())}
                      onChange={(e, value) =>
                        setSelectedWeek(value.props.value)
                      }
                    >
                      {weekNumberList?.map((res) => (
                        <MenuItem value={res}>{res}</MenuItem>
                      ))}
                    </Select>
                  }
                </b>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className=" px-3">
        <div>
          <div className="tableSection">
            <table className="table-responsive tablesss table align-middle">
              <thead>
                <tr>
                  <th scope="col" className="text-center">
                    S. No
                  </th>
                  <th scope="col" className="tableHead">
                    Reference No
                  </th>
                  <th scope="col" className="tableHead">
                    Project Name
                  </th>
                  {/* <th scope="col" className="tableHead">Tl Name</th> */}
                  <th scope="col" className="tableHead">
                    Task No
                  </th>
                  <th scope="col" className="tableHead">
                    Area of Work
                  </th>
                  <th scope="col" className="tableHead">
                    Variation
                  </th>
                  <th scope="col" className="tableHead">
                    Sub Division
                  </th>
                  <th scope="col" className="days">
                    {weekData?.[0]} <br />
                    <hr />
                    Monday
                  </th>
                  <th scope="col" className="days">
                    {" "}
                    {weekData?.[1]} <br />
                    <hr />
                    Tuesday
                  </th>
                  <th scope="col" className="days">
                    {" "}
                    {weekData?.[2]} <br />
                    <hr />
                    Wednesday
                  </th>
                  <th scope="col" className="days">
                    {" "}
                    {weekData?.[3]} <br />
                    <hr />
                    Thursday
                  </th>
                  <th scope="col" className="days">
                    {" "}
                    {weekData?.[4]} <br />
                    <hr />
                    Friday
                  </th>
                  <th scope="col" className="days">
                    {" "}
                    {weekData?.[5]} <br />
                    <hr />
                    Saturday
                  </th>
                  <th scope="col" className="days">
                    {" "}
                    {weekData?.[6]} <br />
                    <hr />
                    Sunday
                  </th>
                  <th scope="col" className="days">
                    Total Hours
                  </th>
                  <th scope="col" className="days">
                    Status
                  </th>
                  <th scope="col" className="tableHead">
                    Sent Date
                  </th>
                  <th scope="col" className="tableHead">
                    Approved Date
                  </th>
                  <th className="fixedColumn">Action</th>
                </tr>
              </thead>

              <tbody>
                {formData === null && (
                  <tr>
                    <td>
                      <div className="actions addIcon">
                        <i
                          class="fa-solid fa-plus"
                          onClick={() => handleClickOpen()}
                        ></i>
                      </div>
                    </td>
                  </tr>
                )}
                {console.log(formData, "formDataformData")}
                {formData?.map((res, index) => (
                  <tr>
                    <td>
                      {index !== formData.length - 1 && index + 1}
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
                        <Autocomplete
                          id="combo-box-demo"
                          options={referenceNoList}
                          sx={{ width: 200 }}
                          className={"inputTextStyle"}
                          // value={formData?.[index]?.referenceNo}
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
                            handleOnChange("referenceNo", value, index)
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              error={errorMessage?.[index]?.referenceNo}
                            />
                          )}
                        />
                        {/* <Select
                          className={"inputTextStyle"}
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
                        </Select> */}
                        <FormHelperText>
                          {errorMessage?.[index]?.referenceNo}
                        </FormHelperText>
                      </FormControl>
                    </td>
                    <td>
                      <FormControl fullWidth>
                        <TextField
                          className={"inputTextStyle"}
                          fullWidth
                          variant="outlined"
                          disabled={true}
                          value={formData?.[index]?.projectName}
                        />
                      </FormControl>
                    </td>
                    {/* <td>
                      <TextField
                        fullWidth
                        variant="outlined"
                        disabled={true}
                        value={formData?.[index]?.tlName}
                      />
                    </td> */}
                    <td>
                      <TextField
                        className={"inputTextStyle"}
                        fullWidth
                        variant="outlined"
                        disabled={true}
                        value={formData?.[index]?.taskNo}
                      />
                    </td>
                    <td>
                      <FormControl fullWidth>
                        <Select
                          className={"inputTextStyle"}
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
                          {areaofWork?.map((res) => {
                            return (
                              <MenuItem value={res?.areaofwork}>
                                {res?.areaofwork}
                              </MenuItem>
                            );
                          })}
                        </Select>
                        <FormHelperText>
                          {errorMessage?.[index]?.areaofWork}
                        </FormHelperText>
                      </FormControl>
                    </td>
                    <td>
                      <FormControl fullWidth>
                        <Select
                          className={"inputTextStyle"}
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
                          {variation?.map((res) => {
                            return (
                              <MenuItem value={res?.variation}>
                                {res?.variation}
                              </MenuItem>
                            );
                          })}
                        </Select>
                        <FormHelperText>
                          {errorMessage?.[index]?.variation}
                        </FormHelperText>
                      </FormControl>
                    </td>
                    <td>
                      <FormControl fullWidth>
                        <Select
                          className={"inputTextStyle"}
                          value={formData?.[index]?.subDivision}
                          defaultValue={formData?.[index]?.subDivision}
                          // helperText={errorMessage?.[index]?.subDivision}
                          // error={errorMessage?.[index]?.subDivision}
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
                        {/* <FormHelperText>
                          {errorMessage?.[index]?.subDivision}
                        </FormHelperText> */}
                      </FormControl>
                    </td>
                    <td>
                      {console.log(isDateInclude(weekData?.[0]), "dateone")}
                      <TextField
                        className={"inputTextStyle"}
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
                          isDateInclude(weekData?.[0])
                            ? true
                            : isDisable?.[index]?.disable === false
                            ? false
                            : formData[index]?.id
                            ? true
                            : false
                        }
                      />
                    </td>
                    <td>
                      <TextField
                        className={"inputTextStyle"}
                        fullWidth
                        variant="outlined"
                        value={formData?.[index]?.tuesday}
                        type="number"
                        onChange={(e, value) =>
                          handleOnChange("tuesday", e.target.value, index)
                        }
                        disabled={
                          isDateInclude(weekData?.[1])
                            ? true
                            : isDisable?.[index]?.disable === false
                            ? false
                            : formData[index]?.id
                            ? true
                            : false
                        }
                      />
                    </td>
                    <td>
                      <TextField
                        className={"inputTextStyle"}
                        fullWidth
                        variant="outlined"
                        value={formData?.[index]?.wednesday}
                        type="number"
                        onChange={(e, value) =>
                          handleOnChange("wednesday", e.target.value, index)
                        }
                        disabled={
                          isDateInclude(weekData?.[2])
                            ? true
                            : isDisable?.[index]?.disable === false
                            ? false
                            : formData[index]?.id
                            ? true
                            : false
                        }
                      />
                    </td>
                    <td>
                      <TextField
                        className={"inputTextStyle"}
                        fullWidth
                        variant="outlined"
                        value={formData?.[index]?.thursday}
                        type="number"
                        onChange={(e, value) =>
                          handleOnChange("thursday", e.target.value, index)
                        }
                        disabled={
                          isDateInclude(weekData?.[3])
                            ? true
                            : isDisable?.[index]?.disable === false
                            ? false
                            : formData[index]?.id
                            ? true
                            : false
                        }
                      />
                    </td>
                    <td>
                      <TextField
                        className={"inputTextStyle"}
                        fullWidth
                        variant="outlined"
                        value={formData?.[index]?.friday}
                        type="number"
                        onChange={(e, value) =>
                          handleOnChange("friday", e.target.value, index)
                        }
                        disabled={
                          isDateInclude(weekData?.[4])
                            ? true
                            : isDisable?.[index]?.disable === false
                            ? false
                            : formData[index]?.id
                            ? true
                            : false
                        }
                      />
                    </td>
                    <td>
                      <TextField
                        className={"inputTextStyle"}
                        fullWidth
                        variant="outlined"
                        value={formData?.[index]?.saturday}
                        type="number"
                        onChange={(e, value) =>
                          handleOnChange("saturday", e.target.value, index)
                        }
                        disabled={
                          isDateInclude(weekData?.[5])
                            ? true
                            : isDisable?.[index]?.disable === false
                            ? false
                            : formData[index]?.id
                            ? true
                            : false
                        }
                      />
                    </td>
                    <td>
                      {console.log(
                        isDateInclude(weekData?.[6]),
                        "dateonesunday"
                      )}
                      <TextField
                        className={"inputTextStyle"}
                        fullWidth
                        variant="outlined"
                        value={formData?.[index]?.sunday}
                        type="number"
                        onChange={(e, value) =>
                          handleOnChange("sunday", e.target.value, index)
                        }
                        disabled={
                          isDateInclude(weekData?.[6])
                            ? true
                            : isDisable?.[index]?.disable === false
                            ? false
                            : formData[index]?.id
                            ? true
                            : false
                        }
                      />
                    </td>
                    <td>
                      <TextField
                        className={"inputTextStyle"}
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
                            class="fa-solid fa-share-alt"
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
          </div>
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
};

export default TimeManagement;
