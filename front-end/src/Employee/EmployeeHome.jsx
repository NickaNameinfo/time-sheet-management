import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import {
  BsBadgeTmFill,
  BsBarChartLineFill,
  BsFillHCircleFill,
  BsFillPersonBadgeFill,
  BsPersonCircle,
} from "react-icons/bs";
import { MenuItem, Select } from "@mui/material";
import commonData from "../../common.json";
function EmployeeHome() {
  const [totalLeaves, setTotalLeaves] = React.useState(null);
  const [sickLeave, setSickLeave] = useState(null);
  const [vacationLeave, setVacationLeave] = useState(null);
  const [earned, setEarned] = useState(null);
  const [compOffLeave, setCompOffLeave] = useState(null);
  const containerStyle = { width: "100%", height: "500px" };
  const gridStyle = { height: "500px", width: "100%" };
  const [rowData, setRowData] = useState(null);
  const [weekData, setWeekDate] = React.useState(null);
  const [userDetails, setUserDetails] = React.useState(null);
  const [remainingLeave, setRemainingLeave] = React.useState(null);
  const [appliedCompLeave, setApplicedComp] = React.useState(null);
  const [selectedWeek, setSelectedWeek] = React.useState(null);
  const [weekNumberList, setWeekNumberList] = React.useState(null);

  const token = localStorage.getItem("token");

  React.useEffect(() => {
    if (userDetails) {
      getUserInfo();
    }
    getLeaves();
    let tempList = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
      40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52,
    ];
    setWeekNumberList(tempList);
  }, [userDetails, compOffLeave]);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    let datesss = getWeekDates(
      selectedWeek ? selectedWeek : getCurrentWeekNumber(),
      currentYear
    );
    setWeekDate(datesss);
  }, [selectedWeek]);

  React.useEffect(() => {
    let sum =
      (Number(vacationLeave) || 0) +
      (Number(sickLeave) || 0) +
      (Number(earned) || 0) +
      (Number(compOffLeave) || 0);
    setRemainingLeave(sum.toFixed(1));
    let leaveDetails = {
      vacationLeave: Number(vacationLeave),
      sickLeave: Number(sickLeave),
      earnedLeave: Number(earned),
      compOffLeave: Number(compOffLeave),
    };
    localStorage.setItem("leaveDetails", JSON.stringify(leaveDetails));
  }, [vacationLeave, sickLeave, earned, compOffLeave]);

  React,
    useEffect(() => {
      if (weekData) {
        getInOutTime(weekData);
      }
    }, [weekData]);

  const getWorkMonth = (startDateString, endDateString) => {
    const currentDate = new Date();
    let totalMonths = 0;
    let currentDateIterator = new Date(startDateString);
    while (currentDateIterator < currentDate) {
      if (currentDateIterator.getDate() === 1) {
        totalMonths++;
      }
      currentDateIterator.setMonth(currentDateIterator.getMonth() + 1);
      currentDateIterator.setDate(1); // Set to the first day of the next month
    }
    return totalMonths; // Moved the return statement outside of the while loop
  };

  const getCurrentDateInFormat = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Adding 1 because JavaScript months are zero-based
    const day = String(currentDate.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  };

  const calculateAvailableLeaves = (
    workingMonthsPerYear,
    annualLeaveAllocation,
    status
  ) => {
    let months = status === "Probation" ? 6 : 12;
    const leavesPerMonth = annualLeaveAllocation / months; // Divide by 12 months in a year
    const availableLeaves = Math.round(leavesPerMonth * workingMonthsPerYear);
    return availableLeaves;
  };

  const getUserInfo = async () => {
    let useResult = await axios.get(
      `${commonData?.APIKEY}/get/${userDetails?.id}`
    );
    let calculateDate =
      useResult?.data?.Result[0]?.employeeStatus === "Probation"
        ? useResult?.data?.Result[0]?.date
        : useResult?.data?.Result[0]?.permanentDate;

    let monthData = getWorkMonth(calculateDate, getCurrentDateInFormat());

    const annualLeaves =
      useResult?.data?.Result[0]?.employeeStatus === "Probation" ? 6 : 18; // Total annual leave allocation
    const availableLeaves = calculateAvailableLeaves(
      monthData,
      annualLeaves,
      useResult?.data?.Result[0]?.employeeStatus
    );

    axios
      .get(`${commonData?.APIKEY}/getcompOffDetails`)
      .then((res) => {
        if (res.data.Status === "Success") {
          axios
            .post(`${commonData?.APIKEY}/dashboard`, { tokensss: token })
            .then((result) => {
              const totalEligibility = res?.data?.Result?.reduce(
                (total, item) =>
                  item.leaveStatus === "approved" &&
                  item?.employeeId === res.data.employeeId
                    ? total + (parseInt(item.eligibility) || 0)
                    : total,
                0
              );
              let dataTemp = appliedCompLeave ? appliedCompLeave : 0;

              setCompOffLeave(Math.round(totalEligibility / 9) - dataTemp); // Corrected to Math.round
            });
        }
      })
      .catch((err) => console.log(err));
    setTotalLeaves(Number(availableLeaves));
  };

  const getLeaves = () => {
    axios
      .get(`${commonData?.APIKEY}/getLeaveDetails`)
      .then((res) => {
        if (res.data.Status === "Success") {
          axios
            .post(`${commonData?.APIKEY}/dashboard`, { tokensss: token })
            .then((result) => {
              let tempFinalResult = res?.data?.Result?.filter(
                (res) => res?.leaveStatus === "approved" && res.employeeId === result?.data?.employeeId
              );
              console.log(tempFinalResult, "tempFinalResult")
              const totalLeaveHoursByType = {};

              tempFinalResult?.forEach((leave) => {
                const leaveType = leave.leaveType;
                const leaveHours = parseFloat(leave.leaveHours) || 0;

                if (totalLeaveHoursByType[leaveType]) {
                  totalLeaveHoursByType[leaveType] += leaveHours;
                } else {
                  totalLeaveHoursByType[leaveType] = leaveHours;
                }
              });

              const vacationLeaveCount = totalLeaveHoursByType["Casual Leave"];
              const scikLeaveCount = totalLeaveHoursByType["Sick Leave"];
              const earnedLeaveCount = totalLeaveHoursByType["Earned Leave"];
              const compoffLeaveCount = totalLeaveHoursByType["Comp-off"];
              setApplicedComp(compoffLeaveCount);
              let dividedLeave = totalLeaves / 3;

              setEarned(
                earnedLeaveCount
                  ? String(Math.abs(earnedLeaveCount - dividedLeave)).split(
                      "."
                    )[0] +
                      (String(Math.abs(earnedLeaveCount - dividedLeave)).split(
                        "."
                      )[1]
                        ? `.${
                            String(
                              Math.abs(earnedLeaveCount - dividedLeave)
                            ).split(".")[1][0]
                          }`
                        : "")
                  : String(Math.abs(Math.abs(dividedLeave))).split(".")[1] !==
                    undefined
                  ? `${
                      String(Math.abs(Math.abs(dividedLeave))).split(".")[0]
                    }.${
                      String(Math.abs(Math.abs(dividedLeave))).split(".")[1][0]
                    }`
                  : `${String(Math.abs(Math.abs(dividedLeave))).split(".")[0]}`
              );
              setSickLeave(
                scikLeaveCount
                  ? String(
                      Math.abs(Math.abs(scikLeaveCount - dividedLeave))
                    ).split(".")[0] +
                      (String(
                        Math.abs(Math.abs(scikLeaveCount - dividedLeave))
                      ).split(".")[1]
                        ? `.${
                            String(
                              Math.abs(Math.abs(scikLeaveCount - dividedLeave))
                            ).split(".")[1][0]
                          }`
                        : "")
                  : String(Math.abs(Math.abs(dividedLeave))).split(".")[1] !==
                    undefined
                  ? `${
                      String(Math.abs(Math.abs(dividedLeave))).split(".")[0]
                    }.${
                      String(Math.abs(Math.abs(dividedLeave))).split(".")[1][0]
                    }`
                  : `${String(Math.abs(Math.abs(dividedLeave))).split(".")[0]}`
              );
              setVacationLeave(
                vacationLeaveCount
                  ? String(
                      Math.abs(Math.abs(vacationLeaveCount - dividedLeave))
                    ).split(".")[0] +
                      (String(
                        Math.abs(Math.abs(vacationLeaveCount - dividedLeave))
                      ).split(".")[1]
                        ? `.${
                            String(
                              Math.abs(
                                Math.abs(vacationLeaveCount - dividedLeave)
                              )
                            ).split(".")[1][0]
                          }`
                        : "")
                  : String(Math.abs(Math.abs(dividedLeave))).split(".")[1] !==
                    undefined
                  ? `${
                      String(Math.abs(Math.abs(dividedLeave))).split(".")[0]
                    }.${
                      String(Math.abs(Math.abs(dividedLeave))).split(".")[1][0]
                    }`
                  : `${String(Math.abs(Math.abs(dividedLeave))).split(".")[0]}`
              );
            });
        }
      })
      .catch((err) => console.log(err));
  };
  const formatDate = (inputDate) => {
    const date = new Date(inputDate);
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is zero-based, so add 1 and pad with leading zero if needed
    const day = String(date.getDate()).padStart(2, "0"); // Pad with leading zero if needed
    const year = date.getFullYear();

    return `${year}-${month}-${day}`;
  };

  const columnDefs = useMemo(
    () => [
      {
        field: "type",
      },
      {
        field: formatDate(weekData?.[0]),
        cellRenderer: (params) => (
          <p>
            {Object.keys(params.data?.item).includes(params.colDef.field)
              ? `${
                  params.data?.item[formatDate(weekData?.[0])]?.["IN"]?.[0]
                } / ${
                  params.data?.item[formatDate(weekData?.[0])]?.["OUT"]?.[0]
                    ? params.data?.item[formatDate(weekData?.[0])]?.["OUT"]?.[
                        params.data?.item[formatDate(weekData?.[0])]?.["OUT"]
                          ?.length - 1
                      ]
                    : "NP"
                }`
              : "NP"}
          </p>
        ),
      },
      {
        field: formatDate(weekData?.[1]),
        cellRenderer: (params) => (
          <p>
            {Object.keys(params.data?.item).includes(params.colDef.field)
              ? `${
                  params.data?.item[formatDate(weekData?.[1])]?.["IN"]?.[0]
                } / ${
                  params.data?.item[formatDate(weekData?.[1])]?.["OUT"]?.[0]
                    ? params.data?.item[formatDate(weekData?.[1])]?.["OUT"]?.[
                        params.data?.item[formatDate(weekData?.[1])]?.["OUT"]
                          ?.length - 1
                      ]
                    : "NP"
                }`
              : "NP"}
          </p>
        ),
      },
      {
        field: formatDate(weekData?.[2]),
        cellRenderer: (params) => (
          <p>
            {Object.keys(params.data?.item).includes(params.colDef.field)
              ? `${
                  params.data?.item[formatDate(weekData?.[2])]?.["IN"]?.[0]
                } / ${
                  params.data?.item[formatDate(weekData?.[2])]?.["OUT"]?.[0]
                    ? params.data?.item[formatDate(weekData?.[2])]?.["OUT"]?.[
                        params.data?.item[formatDate(weekData?.[2])]?.["OUT"]
                          ?.length - 1
                      ]
                    : "NP"
                }`
              : "NP"}
          </p>
        ),
      },
      {
        field: formatDate(weekData?.[3]),
        cellRenderer: (params) => (
          <p>
            {Object.keys(params.data?.item).includes(params.colDef.field)
              ? `${
                  params.data?.item[formatDate(weekData?.[3])]?.["IN"]?.[0]
                } / ${
                  params.data?.item[formatDate(weekData?.[3])]?.["OUT"]?.[0]
                    ? params.data?.item[formatDate(weekData?.[3])]?.["OUT"]?.[
                        params.data?.item[formatDate(weekData?.[3])]?.["OUT"]
                          ?.length - 1
                      ]
                    : "NP"
                }`
              : "NP"}
          </p>
        ),
      },
      {
        field: formatDate(weekData?.[4]),
        cellRenderer: (params) => (
          <p>
            {Object.keys(params.data?.item).includes(params.colDef.field)
              ? `${
                  params.data?.item[formatDate(weekData?.[4])]?.["IN"]?.[0]
                } / ${
                  params.data?.item[formatDate(weekData?.[4])]?.["OUT"]?.[0]
                    ? params.data?.item[formatDate(weekData?.[4])]?.["OUT"]?.[
                        params.data?.item[formatDate(weekData?.[4])]?.["OUT"]
                          ?.length - 1
                      ]
                    : "NP"
                }`
              : "NP"}
          </p>
        ),
      },
      {
        field: formatDate(weekData?.[5]),
        cellRenderer: (params) => (
          <p>
            {Object.keys(params.data?.item).includes(params.colDef.field)
              ? `${
                  params.data?.item[formatDate(weekData?.[5])]?.["IN"]?.[0]
                } / ${
                  params.data?.item[formatDate(weekData?.[5])]?.["OUT"]?.[0]
                    ? params.data?.item[formatDate(weekData?.[5])]?.["OUT"]?.[
                        params.data?.item[formatDate(weekData?.[5])]?.["OUT"]
                          ?.length - 1
                      ]
                    : "NP"
                }`
              : "NP"}
          </p>
        ),
      },
      {
        field: formatDate(weekData?.[6]),
        cellRenderer: (params) => (
          <p>
            {Object.keys(params.data?.item).includes(params.colDef.field)
              ? `${
                  params.data?.item[formatDate(weekData?.[6])]?.["IN"]?.[0]
                } / ${
                  params.data?.item[formatDate(weekData?.[6])]?.["OUT"]?.[0]
                    ? params.data?.item[formatDate(weekData?.[6])]?.["OUT"]?.[
                        params.data?.item[formatDate(weekData?.[6])]?.["OUT"]
                          ?.length - 1
                      ]
                    : "NP"
                }`
              : "NP"}
          </p>
        ),
      },
    ],
    [weekData, rowData]
  );

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

  const getInOutTime = async (dates) => {
    try {
      // Fetch user details
      const userDetailsResponse = await axios.post(
        `${commonData?.APIKEY}/dashboard`,
        { tokensss: token }
      );
      const userDetails = userDetailsResponse.data;

      // Convert dates to the "YYYY-MM-DD" format
      const convertedDates = dates?.map((date) => {
        const parts = date.split("/");
        // Ensure proper padding for month and day values
        return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(
          2,
          "0"
        )}`;
      });

      // Prepare data for filtering
      const data = {
        userId: Number(userDetails?.employeeId?.replace(/[A-Za-z]/g, "")),
        logDates: convertedDates,
      };

      // Fetch time sheet data
      const timeSheetResponse = await axios.post(
        `${commonData?.APIKEY}/filterTimeSheet`,
        data
      );
      const timeSheetData = timeSheetResponse.data;

      // Update state with user details and time sheet data
      setUserDetails(userDetails);

      // Group data by date
      const dateWiseData = {};

      timeSheetData.forEach((item) => {
        const formattedLogDate = item.FormattedLogDate.slice(0, 10); // Extract date portion only
        const time = item.FormattedLogDate.slice(11, 16); // Extract time portion only

        if (!dateWiseData[formattedLogDate]) {
          dateWiseData[formattedLogDate] = { IN: [], OUT: [] };
        }

        if (parseInt(time.split(":")[0]) < 12) {
          dateWiseData[formattedLogDate]["IN"].push(time);
        } else {
          dateWiseData[formattedLogDate]["OUT"].push(time);
        }
      });

      // Prepare rowData with "IN" and "OUT" items
      const rowData = [
        {
          type: "IN / OUT",
          item: dateWiseData,
        },
      ];

      setRowData(rowData);
    } catch (error) {
      console.error("Error in getInOutTime:", error);
      // Handle the error here, e.g., set an error state or display an error message.
    }
  };

  const defaultColDef = useMemo(
    () => ({
      editable: false,
      enableRowGroup: true,
      enablePivot: true,
      enableValue: true,
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter: true,
      flex: 1,
      minWidth: 100,
    }),
    []
  );

  return (
    <>
      {/* <div className="text-center pb-1 my-3 d-flex align-items-center justify-content-between px-3"> */}
      <div className="mainBody">
        <div className="mt-4">
          <div className="row">
            <div className="col">
              <div className="counterCard">
                <div className="counterCardmain">
                  <div className="smallboxTL">
                    <BsBadgeTmFill className="icon_admin" />
                  </div>
                  <div className="counts">
                    <p>Count</p>
                    <h3>{remainingLeave}</h3>
                  </div>
                </div>
                <div className="counterCardname">
                  <p className="counterCardTitle">Leave</p>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="counterCard">
                <div className="counterCardmain">
                  <div className="smallboxHR">
                    <BsFillHCircleFill className="icon_admin" />
                  </div>
                  <div className="counts">
                    <p>Count</p>
                    <h3>{vacationLeave} </h3>
                  </div>
                </div>
                <div className="counterCardname">
                  <p className="counterCardTitle">Casual Leave</p>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="counterCard">
                <div className="counterCardmain">
                  <div className="smallboxE">
                    <BsPersonCircle className="icon_admin" />
                  </div>
                  <div className="counts">
                    <p>Count</p>
                    <h3>{sickLeave} </h3>
                  </div>
                </div>
                <div className="counterCardname">
                  <p className="counterCardTitle">Sick Leave</p>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="counterCard">
                <div className="counterCardmain">
                  <div className="smallboxP">
                    <BsBarChartLineFill className="icon_admin" />
                  </div>
                  <div className="counts">
                    <p>Count</p>
                    <h3>{earned} </h3>
                  </div>
                </div>
                <div className="counterCardname">
                  <p className="counterCardTitle">Earned Leave</p>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="counterCard">
                <div className="counterCardmain">
                  <div className="smallboxP">
                    <BsBarChartLineFill className="icon_admin" />
                  </div>
                  <div className="counts">
                    <p>Count</p>
                    <h3>{compOffLeave} </h3>
                  </div>
                </div>
                <div className="counterCardname">
                  <p className="counterCardTitle">Comp-off Leave</p>
                </div>
              </div>
            </div>
            {/* <div className="col">
              <div className="counterCard">
                <div className="counterCardmain">
                  <div className="smallboxP">
                    <BsBarChartLineFill className="icon_admin" />
                  </div>
                  <div className="counts">
                    <p>Count</p>
                    <h3>{reamaining} </h3>
                  </div>
                </div>
                <div className="counterCardname">
                  <p className="counterCardTitle">Remaining Leave</p>
                </div>
              </div>
            </div> */}
          </div>
        </div>
        <div style={{ width: "100%", height: "500px", marginBottom: "10%" }}>
          <div className="text-center pb-1 my-3">
            <h4>Time Sheet</h4>
          </div>
          <deiv className="d-block mb-2 mx-3 text-end">
            <Select
              className="noPaddingInput"
              value={
                selectedWeek ? selectedWeek : String(getCurrentWeekNumber())
              }
              defaultValue={String(getCurrentWeekNumber())}
              onChange={(e, value) => setSelectedWeek(value.props.value)}
            >
              {weekNumberList?.map((res) => (
                <MenuItem value={res}>{res}</MenuItem>
              ))}
            </Select>
          </deiv>
          <div style={containerStyle}>
            <div style={gridStyle} className="ag-theme-alpine">
              <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                suppressRowClickSelection={true}
                groupSelectsChildren={true}
                rowSelection={"single"}
                rowGroupPanelShow={"always"}
                pivotPanelShow={"always"}
                pagination={true}
                onSelectionChanged={(event) => onSelectionChanged(event)}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default EmployeeHome;
