import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Paper,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  Refresh,
  Search,
  Person,
  CalendarToday,
  AccessTime,
  Edit,
} from "@mui/icons-material";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import commonData from "../../common.json";

function CompOffLIst() {
  const [rowData, setRowData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [gridApi, setGridApi] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateCompOffDetails = async (status, params) => {
    if (!params.data.eligibility || params.data.eligibility === "") {
      alert("Please enter eligibility hours");
      return;
    }

    const apiTemp = {
      ...params.data,
      approvedDate: new Date(),
      leaveStatus: status,
      eligibility: params.data.eligibility,
    };

    try {
      const res = await axios.put(
        `${commonData?.APIKEY}/updateCompOff/` + params.data.id,
        apiTemp
      );
      if (res.data.Status === "Success") {
        alert("Update Successfully");
        fetchCompOffData();
      } else {
        alert("Error updating comp-off");
      }
    } catch (err) {
      console.log(err);
      alert("Error updating comp-off");
    }
  };

  const fetchCompOffData = useCallback(() => {
    setLoading(true);
    axios
      .get(`${commonData?.APIKEY}/getcompOffDetails`)
      .then((res) => {
        if (res.data.Status === "Success") {
          const filterDat = res.data.Result?.filter(
            (item) => item?.leaveStatus !== "approved"
          );
          setRowData(filterDat || []);
        } else {
          alert("Error loading comp-off data");
        }
      })
      .catch((err) => {
        console.log(err);
        alert("Error loading comp-off data");
      })
      .finally(() => setLoading(false));
  }, []);

  const columnDefs = useMemo(
    () => [
      {
        field: "employeeName",
        headerName: "Employee Name",
        minWidth: 180,
        cellRenderer: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
            <Person color="primary" sx={{ fontSize: 20 }} />
            <Typography variant="body2" fontWeight="medium">
              {params.value || "N/A"}
            </Typography>
          </Box>
        ),
      },
      {
        field: "employeeId",
        headerName: "Employee ID",
        minWidth: 120,
        cellRenderer: (params) => (
          <Chip label={params.value || "N/A"} size="small" variant="outlined" />
        ),
      },
      {
        field: "workHours",
        headerName: "Work Hours",
        minWidth: 120,
        cellRenderer: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <AccessTime sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="body2">{params.value || "N/A"}</Typography>
          </Box>
        ),
      },
      {
        field: "eligibility",
        headerName: "Eligibility Hours",
        minWidth: 150,
        editable: true,
        cellRenderer: (params) => (
          <Typography variant="body2">{params.value || "0"}</Typography>
        ),
        cellEditor: "agTextCellEditor",
        cellEditorParams: {
          useFormatter: false,
        },
      },
      {
        field: "leaveFrom",
        headerName: "Worked On",
        minWidth: 130,
        cellRenderer: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <CalendarToday sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="body2">
              {params.value ? new Date(params.value).toLocaleDateString() : "N/A"}
            </Typography>
          </Box>
        ),
      },
      {
        field: "leaveStatus",
        headerName: "Approval Status",
        minWidth: 150,
        cellRenderer: (params) => {
          const status = params.value?.toLowerCase();
          const statusColors = {
            approved: "success",
            rejected: "error",
            pending: "warning",
          };
          return (
            <Chip
              label={params.value || "Pending"}
              size="small"
              color={statusColors[status] || "default"}
              variant={status === "approved" ? "filled" : "outlined"}
            />
          );
        },
      },
      {
        headerName: "Actions",
        pinned: "right",
        minWidth: 150,
        filter: false,
        sortable: false,
        cellRenderer: (params) => {
          return (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Approve Comp-Off">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => {
                    updateCompOffDetails("approved", params);
                  }}
                  sx={{
                    "&:hover": {
                      bgcolor: "success.light",
                      color: "white",
                    },
                  }}
                >
                  <CheckCircle fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject Comp-Off">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    updateCompOffDetails("rejected", params);
                  }}
                  sx={{
                    "&:hover": {
                      bgcolor: "error.light",
                      color: "white",
                    },
                  }}
                >
                  <Cancel fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      editable: false,
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
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
    fetchCompOffData();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (gridApi) {
        if (searchText) {
          gridApi.setQuickFilter(searchText);
        } else {
          gridApi.setQuickFilter("");
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText, gridApi]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Comp-Off Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and manage pending comp-off requests
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchCompOffData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* Search Bar */}
        <Paper elevation={1} sx={{ p: 1 }}>
          <TextField
            placeholder="Search comp-off requests..."
            variant="outlined"
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 250 }}
            fullWidth
          />
        </Paper>
      </Box>

      {/* AG Grid */}
      <Card
        sx={{
          height: "calc(100vh - 300px)",
          minHeight: 500,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 0, height: "100%" }}>
          <Box sx={{ height: "100%", width: "100%" }} className="ag-theme-alpine">
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              suppressRowClickSelection={true}
              pagination={true}
              paginationPageSize={20}
              onGridReady={onGridReady}
              animateRows={true}
              rowHeight={60}
              headerHeight={50}
              enableRangeSelection={true}
              suppressCellFocus={true}
              loading={loading}
              stopEditingWhenCellsLoseFocus={true}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default CompOffLIst;
