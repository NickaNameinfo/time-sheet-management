import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import commonData from "../../common.json";
function TeamLeadHome() {
  const containerStyle = { width: "100%", height: "100%" };
  const gridStyle = { height: "100%", width: "100%" };
  const [rowData, setRowData] = useState([]);
  const [projectWorkHours, setProjectWorkHours] = React.useState(null);
  const [workDetails, setWorkDetails] = useState([]);
  const token = localStorage.getItem("token");

  console.log(rowData, "rowDatarowData", workDetails);
  axios.defaults.withCredentials = true;

  const calculateProjectValues = (params, projectWorkHours) => {
    const project = projectWorkHours?.find(
      (items) => items.projectName === params.data.projectName
    );

    console.log(project, "project1231");
    if (project) {
      const completionPercentage =
        (project.totalHours / params.data.allotatedHours) * 100;
      const remainingPercentage = 100 - completionPercentage;

      return {
        completionPercentage: completionPercentage.toFixed(2) + "%",
        utilizationPercentage: remainingPercentage.toFixed(2) + "%",
        consumedHours: project.totalHours,
      };
    }

    return {
      completionPercentage: "0%",
      utilizationPercentage: "0%",
      consumedHours: 0,
    };
  };

  React.useEffect(() => {
    onGetWorkDetails();
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

  const columnDefs = useMemo(
    () => [
      {
        field: "projectName",
        minWidth: 170,
      },
      {
        field: "completion",
        minWidth: 170,
        editable: true,
      },
      {
        field: "Consumed Hours",
        minWidth: 170,
        valueGetter: (params) =>
          calculateProjectValues(params, projectWorkHours).consumedHours,
      },
      { field: "allotatedHours", headerName: "Allotted Hours", minWidth: 170 },
      { field: "referenceNo", minWidth: 170 },
      { field: "orderId", minWidth: 170 },
      { field: "positionNumber", minWidth: 170 },
      { field: "projectNo", minWidth: 170 },
      { field: "startDate", minWidth: 170 },
      { field: "subDivision", minWidth: 170 },
      { field: "subPositionNumber", minWidth: 170 },
      { field: "targetDate", minWidth: 170 },
      { field: "taskJobNo", minWidth: 170 },
      {
        headerName: "Action",
        pinned: "right",
        minWidth: 100,
        width: 100,
        field: "id",
        filter: false,
        editable: false,
        cellRenderer: (params, index) => (
          <div className="actions">
            <>
              <i
                style={{ color: "color", backgroundColor: "green" }}
                class="fa-solid fa-check"
                onClick={() => updateProjectDetails(params)}
              ></i>
            </>
          </div>
        ),
      },
    ],
    []
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
      enableRowGroup: false,
      enablePivot: false,
      enableValue: false,
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter: true,
      flex: 1,
      minWidth: 100,
    }),
    []
  );

  const onGridReady = useCallback((params) => {
    axios
      .get(`${commonData?.APIKEY}/getProject`)
      .then(async (res) => {
        let userDetails = await axios.post(`${commonData?.APIKEY}/dashboard`, {
          tokensss: token,
        });
        console.log(res, "resres324", userDetails);
        if (res.data.Status === "Success") {
          let filterData = res.data.Result.filter(
            (items) => items.tlName === userDetails.data.employeeName
          );
          setRowData(filterData);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  }, []);

  const onGetWorkDetails = (params) => {
    axios
      .get(`${commonData?.APIKEY}/getWrokDetails`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setWorkDetails(res.data.Result);
        } else {
          alert("Error");
        }
      })
      .catch((err) => console.log(err));
  };

  const updateProjectDetails = (params) => {
    let apiTemp = { ...params.data, approvedDate: new Date() };
    console.log(apiTemp, "apiTempapiTempapiTemp", params.data);
    axios
      .put(
        `${commonData?.APIKEY}/project/update/completion/` + params.data.id,
        apiTemp
      )
      .then(async (res) => {
        alert("Update Successfully");
        location.reload();
      });
    console.log(params.data, "datadatadatadata");
  };

  return (
    <>
      <div className="text-center pb-1 my-3">
        <h4>Allotted Project Details</h4>
      </div>
      <div style={containerStyle}>
        <div style={gridStyle} className="ag-theme-alpine">
          <AgGridReact
            rowData={rowData}
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
}

export default TeamLeadHome;
