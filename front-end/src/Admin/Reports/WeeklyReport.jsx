import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";

const WeeklyReport = () => {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [projectDetails, setProjectDetails] = useState([]);
  const [workDetails, setWorkDetails] = useState([]);
  const [projectWorkHours, setProjectWorkHours] = React.useState(null);
  console.log(workDetails, "workDetailsworkDetails");
  React.useEffect(() => {
    onGetWorkDetails();
    onGridReady();
  }, []);

  React.useEffect(() => {
    const projectData = workDetails.reduce((acc, entry) => {
      const projectName = entry.projectName;
      if (!acc[projectName]) {
        acc[projectName] = [];
      }
      acc[projectName].push(entry.totalHours);
      return acc;
    }, {});

    const projectTotalHours = Object.keys(projectData).map((projectName) => {
      const totalHours = projectData[projectName].reduce(
        (sum, hours) => sum + hours,
        0
      );
      return { projectName, totalHours };
    });
    setProjectWorkHours(projectTotalHours);
    console.log(projectTotalHours, "projectTotalHours");
  }, [workDetails]);

  const onGridReady = (params) => {
    axios
      .get("http://localhost:8081/getProject")
      .then((res) => {
        if (res.data.Status === "Success") {
          setProjectDetails(res.data.Result);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const onGetWorkDetails = (params) => {
    axios
      .get("http://localhost:8081/getWrokDetails")
      .then((res) => {
        if (res.data.Status === "Success") {
          setWorkDetails(res.data.Result);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const getTotalHoursForWeek = (data) => {
    const totalHours = data.reduce((acc, item) => acc + item.totalHours, 0);
    return totalHours;
  };

  const columnDefs = useMemo(
    () => [
      {
        field: "referenceNo",
        minWidth: 170,
      },
      // { field: "discipline" },
      { field: "projectName", minWidth: 170 },
      {
        field: "1",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "2",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "3",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "4",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "5",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "6",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "7",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "8",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "9",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "10",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "11",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "12",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "13",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "14",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "15",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "16",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "17",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "18",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "19",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "20",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "21",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "22",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "23",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "24",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "25",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "26",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "27",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "28",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "29",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "30",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "31",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "32",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "33",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "34",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "35",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "36",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "37",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "38",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "39",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "40",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "41",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "42",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "43",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "44",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "45",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "46",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "47",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "48",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "49",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "50",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "51",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
      {
        field: "52",
        filter: false,
        minWidth: 60,
        cellRenderer: (params, index) => {
          const filteredData = workDetails.filter(
            (item) => item.weekNumber === String(params.colDef.field)
          );
          console.log(
            getTotalHoursForWeek(filteredData),
            "filteredDatafilteredDatafilteredData",
            filteredData
          );
          return <>{getTotalHoursForWeek(filteredData)}</>;
        },
      },
    ],
    [projectWorkHours]
  );

  const autoGroupColumnDef = useMemo(
    () => ({
      headerName: "Group",
      minWidth: 170,
      field: "athlete",
      valueGetter: (params) => {
        if (params.node.group) {
          return params.node.key;
        } else {
          return params.data[params.colDef.field];
        }
      },
      headerCheckboxSelection: false,
      cellRenderer: "agGroupCellRenderer",
      cellRendererParams: {
        checkbox: false,
      },
    }),
    []
  );

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
      <div className="text-center pb-1 my-3">
        <h4>Project Weekly Report</h4>
      </div>
      <div style={containerStyle}>
        <div style={gridStyle} className="ag-theme-alpine leavetable">
          <AgGridReact
            rowData={projectDetails}
            columnDefs={columnDefs}
            autoGroupColumnDef={autoGroupColumnDef}
            defaultColDef={defaultColDef}
            suppressRowClickSelection={true}
            groupSelectsChildren={true}
            rowSelection={"single"}
            rowGroupPanelShow={"always"}
            pivotPanelShow={"always"}
            pagination={true}
            onGridReady={onGridReady}
            onSelectionChanged={(event) => onSelectionChanged(event)}
          />
        </div>
      </div>
    </>
  );
};

export default WeeklyReport;
