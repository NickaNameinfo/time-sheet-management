import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  TextField,
  InputAdornment,
  Stack,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Delete,
  Search,
  Refresh,
  Close,
  Work,
  Business,
  FilterList,
  Edit,
} from "@mui/icons-material";
import axios from "axios";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import commonData from "../../common.json";

export const Areaofwork = () => {
  const [rowData, setRowData] = useState([]);
  const [allRowData, setAllRowData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [areaofworkToDelete, setAreaofworkToDelete] = useState(null);
  const [areaofworkToEdit, setAreaofworkToEdit] = useState(null);
  const [modalValue, setModalValue] = useState({ areaofwork: "", projectIds: [] });
  const [searchText, setSearchText] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [projects, setProjects] = useState([]);
  const [workDetails, setWorkDetails] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const columnDefs = useMemo(
    () => [
      {
        field: "areaofwork",
        headerName: "Area of Work",
        minWidth: 200,
        checkboxSelection: true,
        cellRenderer: (params) => {
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
              <Work color="primary" sx={{ fontSize: 20 }} />
              <Typography variant="body2" fontWeight="medium">
                {params.value || "N/A"}
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "projectUsage",
        headerName: "Associated Projects",
        minWidth: 250,
        cellRenderer: (params) => {
          const areaOfWork = params.data?.areaofwork;
          const associatedProjects = params.data?.projects || [];
          
          // First, show associated projects from backend (if available)
          if (associatedProjects && associatedProjects.length > 0) {
            const displayProjects = associatedProjects.slice(0, 3);
            return (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
                {displayProjects.map((project, idx) => (
                  <Chip
                    key={project.id || idx}
                    label={`${project.projectName} (${project.projectNo})`}
                    size="small"
                    icon={<Business sx={{ fontSize: 14 }} />}
                    color="primary"
                    sx={{ fontSize: "0.7rem" }}
                  />
                ))}
                {associatedProjects.length > 3 && (
                  <Tooltip title={`${associatedProjects.length} associated projects`}>
                    <Chip
                      label={`+${associatedProjects.length - 3} more`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.7rem" }}
                    />
                  </Tooltip>
                )}
              </Box>
            );
          }
          
          // Fallback: Find unique projects using this area of work from work details
          if (!areaOfWork) return "N/A";
          
          const projectsUsingThis = workDetails
            .filter((wd) => wd.areaofWork === areaOfWork && wd.projectName)
            .map((wd) => wd.projectName)
            .filter((name, index, self) => self.indexOf(name) === index)
            .slice(0, 3); // Show max 3 projects
          
          if (projectsUsingThis.length === 0) {
            return (
              <Typography variant="body2" color="text.secondary">
                Not used
              </Typography>
            );
          }
          
          const totalCount = workDetails.filter(
            (wd) => wd.areaofWork === areaOfWork && wd.projectName
          ).length;
          const uniqueCount = new Set(
            workDetails
              .filter((wd) => wd.areaofWork === areaOfWork && wd.projectName)
              .map((wd) => wd.projectName)
          ).size;
          
          return (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
              {projectsUsingThis.map((projectName, idx) => (
                <Chip
                  key={idx}
                  label={projectName}
                  size="small"
                  icon={<Business sx={{ fontSize: 14 }} />}
                  sx={{ fontSize: "0.7rem" }}
                />
              ))}
              {uniqueCount > 3 && (
                <Tooltip title={`Used in ${uniqueCount} projects (${totalCount} work entries)`}>
                  <Chip
                    label={`+${uniqueCount - 3} more`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem" }}
                  />
                </Tooltip>
              )}
              {uniqueCount <= 3 && totalCount > uniqueCount && (
                <Tooltip title={`${totalCount} total work entries`}>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                    ({totalCount})
                  </Typography>
                </Tooltip>
              )}
            </Box>
          );
        },
      },
      {
        field: "usageCount",
        headerName: "Usage Count",
        minWidth: 120,
        cellRenderer: (params) => {
          const areaOfWork = params.data?.areaofwork;
          if (!areaOfWork) return "0";
          
          const count = workDetails.filter(
            (wd) => wd.areaofWork === areaOfWork
          ).length;
          
          return (
            <Chip
              label={count}
              size="small"
              color={count > 0 ? "primary" : "default"}
              variant={count > 0 ? "filled" : "outlined"}
            />
          );
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        minWidth: 120,
        filter: false,
        sortable: false,
        cellRenderer: (params) => {
          return (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Edit Area of Work">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => {
                    const areaOfWork = params.data;
                    setAreaofworkToEdit(areaOfWork);
                    setModalValue({
                      areaofwork: areaOfWork.areaofwork || "",
                      projectIds: (areaOfWork.projects || []).map(p => p.id.toString())
                    });
                    setEditDialogOpen(true);
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Area of Work">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteClick(params.data)}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [workDetails]
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
    fetchAreaofworkData();
  }, []);

  const fetchAreaofworkData = useCallback(() => {
    setLoading(true);
    axios
      .get(`${commonData?.APIKEY}/areaofwork`)
      .then((res) => {
        if (res.data.Status === "Success") {
          const data = res.data.Result || [];
          setAllRowData(data);
          applyFilters(data);
        } else {
          alert("Error loading area of work data");
        }
      })
      .catch((err) => {
        console.log(err);
        alert("Error loading area of work data");
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchProjects = useCallback(() => {
    setProjectsLoading(true);
    axios
      .get(`${commonData?.APIKEY}/getProject`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setProjects(res.data.Result || []);
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => setProjectsLoading(false));
  }, []);

  const fetchWorkDetails = useCallback(() => {
    axios
      .get(`${commonData?.APIKEY}/getWorkDetails`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setWorkDetails(res.data.Result || []);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const applyFilters = useCallback((data) => {
    let filtered = [...(data || allRowData)];
    
    // Filter by project
    if (selectedProject) {
      const project = projects.find((p) => p.id === parseInt(selectedProject));
      if (project) {
        const projectAreas = workDetails
          .filter((wd) => wd.projectName === project.projectName && wd.areaofWork)
          .map((wd) => wd.areaofWork)
          .filter((name, index, self) => self.indexOf(name) === index);
        
        filtered = filtered.filter((area) =>
          projectAreas.includes(area.areaofwork)
        );
      }
    }
    
    setRowData(filtered);
  }, [selectedProject, projects, workDetails, allRowData]);

  useEffect(() => {
    if (allRowData.length > 0) {
      applyFilters();
    }
  }, [selectedProject, projects, workDetails, allRowData, applyFilters]);

  useEffect(() => {
    fetchProjects();
    fetchWorkDetails();
  }, [fetchProjects, fetchWorkDetails]);

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

  const handleDeleteClick = (areaofwork) => {
    setAreaofworkToDelete(areaofwork);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (areaofworkToDelete) {
      axios
        .delete(`${commonData?.APIKEY}/areaofwork/delete/` + areaofworkToDelete.id)
        .then((res) => {
          if (res.data.Status === "Success") {
            setDeleteDialogOpen(false);
            setAreaofworkToDelete(null);
            setSelectedRows([]);
            fetchAreaofworkData();
            fetchWorkDetails(); // Refresh work details to update usage stats
          } else {
            alert("Error deleting area of work");
          }
        })
        .catch((err) => {
          console.log(err);
          alert("Error deleting area of work");
        });
    }
  };

  const onSelectionChanged = useCallback((event) => {
    const selectedItems = event.api.getSelectedRows();
    setSelectedRows(selectedItems);
  }, []);

  const handleBulkDelete = () => {
    if (selectedRows.length > 0) {
      setAreaofworkToDelete(selectedRows[0]);
      setDeleteDialogOpen(true);
    }
  };

  const handleAddAreaofwork = () => {
    if (!modalValue.areaofwork || !modalValue.areaofwork.trim()) {
      alert("Please enter an area of work");
      return;
    }

    // Send areaofwork and projectIds to backend
    const payload = {
      areaofwork: modalValue.areaofwork.trim(),
      projectIds: Array.isArray(modalValue.projectIds) 
        ? modalValue.projectIds.map(id => parseInt(id)).filter(id => !isNaN(id))
        : []
    };
    
    axios
      .post(`${commonData?.APIKEY}/create/areaofwork`, payload)
      .then((res) => {
        if (res.data.Status === "Success") {
          setAddDialogOpen(false);
          setModalValue({ areaofwork: "", projectIds: [] });
          fetchAreaofworkData();
          fetchWorkDetails(); // Refresh work details to update usage stats
        } else {
          alert("Error creating area of work");
        }
      })
      .catch((err) => {
        console.log(err);
        alert("Error creating area of work");
      });
  };

  const handleUpdateAreaofwork = () => {
    if (!modalValue.areaofwork || !modalValue.areaofwork.trim()) {
      alert("Please enter an area of work");
      return;
    }

    if (!areaofworkToEdit?.id) {
      alert("Invalid area of work to update");
      return;
    }

    // Send areaofwork and projectIds to backend
    const payload = {
      areaofwork: modalValue.areaofwork.trim(),
      projectIds: Array.isArray(modalValue.projectIds) 
        ? modalValue.projectIds.map(id => parseInt(id)).filter(id => !isNaN(id))
        : []
    };
    
    axios
      .put(`${commonData?.APIKEY}/areaofwork/update/${areaofworkToEdit.id}`, payload)
      .then((res) => {
        if (res.data.Status === "Success") {
          setEditDialogOpen(false);
          setAreaofworkToEdit(null);
          setModalValue({ areaofwork: "", projectIds: [] });
          fetchAreaofworkData();
          fetchWorkDetails(); // Refresh work details to update usage stats
        } else {
          alert("Error updating area of work");
        }
      })
      .catch((err) => {
        console.log(err);
        alert("Error updating area of work");
      });
  };

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
              Area of Work Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and view all areas of work in your organization
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                fetchAreaofworkData();
                fetchWorkDetails();
                fetchProjects();
              }}
              disabled={loading || projectsLoading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddDialogOpen(true)}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                },
              }}
            >
              Add Area of Work
            </Button>
          </Stack>
        </Box>

        {/* Search and Actions Bar */}
        <Paper
          elevation={1}
          sx={{
            p: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <TextField
            placeholder="Search areas of work..."
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
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <FilterList sx={{ fontSize: 16 }} />
                Filter by Project
              </Box>
            </InputLabel>
            <Select
              value={selectedProject}
              label="Filter by Project"
              onChange={(e) => setSelectedProject(e.target.value)}
              disabled={projectsLoading}
            >
              <MenuItem value="">
                <em>All Projects</em>
              </MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.projectName} ({project.projectNo})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedProject && (
            <Button
              size="small"
              onClick={() => setSelectedProject("")}
              startIcon={<Close />}
            >
              Clear Filter
            </Button>
          )}
          {selectedRows.length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={`${selectedRows.length} selected`}
                color="primary"
                size="small"
              />
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={handleBulkDelete}
                size="small"
              >
                Delete Selected
              </Button>
            </Box>
          )}
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
              rowSelection="multiple"
              pagination={true}
              paginationPageSize={20}
              onGridReady={onGridReady}
              onSelectionChanged={onSelectionChanged}
              animateRows={true}
              rowHeight={60}
              headerHeight={50}
              enableRangeSelection={true}
              suppressCellFocus={true}
              loading={loading}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Add Area of Work Dialog */}
      <Dialog
        fullWidth
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setModalValue({ areaofwork: "", projectIds: [] });
        }}
        maxWidth="sm"
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Add Area of Work</Typography>
            <IconButton
              onClick={() => {
                setAddDialogOpen(false);
                setModalValue({ areaofwork: "", projectIds: [] });
              }}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Area of Work"
              variant="outlined"
              value={modalValue.areaofwork}
              onChange={(e) => {
                setModalValue({ ...modalValue, areaofwork: e.target.value });
              }}
              placeholder="Enter area of work description"
              required
            />
            <FormControl fullWidth>
              <InputLabel>Associated Projects (Optional - for reference only)</InputLabel>
              <Select
                multiple
                value={modalValue.projectIds}
                label="Associated Projects (Optional - for reference only)"
                onChange={(e) => {
                  setModalValue({ ...modalValue, projectIds: e.target.value });
                }}
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return <em>None selected</em>;
                  }
                  return (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((projectId) => {
                        const project = projects.find((p) => p.id === parseInt(projectId));
                        return project ? (
                          <Chip
                            key={projectId}
                            label={`${project.projectName} (${project.projectNo})`}
                            size="small"
                            icon={<Business sx={{ fontSize: 14 }} />}
                          />
                        ) : null;
                      })}
                    </Box>
                  );
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id.toString()}>
                    {project.projectName} ({project.projectNo})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              Note: Areas of work can be used across multiple projects. Selecting a project here is for reference only.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setAddDialogOpen(false);
              setModalValue({ areaofwork: "", projectIds: [] });
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddAreaofwork}
            variant="contained"
            startIcon={<Add />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Area of Work Dialog */}
      <Dialog
        fullWidth
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setAreaofworkToEdit(null);
          setModalValue({ areaofwork: "", projectIds: [] });
        }}
        maxWidth="sm"
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Edit Area of Work</Typography>
            <IconButton
              onClick={() => {
                setEditDialogOpen(false);
                setAreaofworkToEdit(null);
                setModalValue({ areaofwork: "", projectIds: [] });
              }}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Area of Work"
              variant="outlined"
              value={modalValue.areaofwork}
              onChange={(e) => {
                setModalValue({ ...modalValue, areaofwork: e.target.value });
              }}
              placeholder="Enter area of work description"
              required
            />
            <FormControl fullWidth>
              <InputLabel>Associated Projects (Optional - for reference only)</InputLabel>
              <Select
                multiple
                value={modalValue.projectIds}
                label="Associated Projects (Optional - for reference only)"
                onChange={(e) => {
                  setModalValue({ ...modalValue, projectIds: e.target.value });
                }}
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return <em>None selected</em>;
                  }
                  return (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((projectId) => {
                        const project = projects.find((p) => p.id === parseInt(projectId));
                        return project ? (
                          <Chip
                            key={projectId}
                            label={`${project.projectName} (${project.projectNo})`}
                            size="small"
                            icon={<Business sx={{ fontSize: 14 }} />}
                          />
                        ) : null;
                      })}
                    </Box>
                  );
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id.toString()}>
                    {project.projectName} ({project.projectNo})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              Note: Areas of work can be used across multiple projects. Selecting projects here is for reference only.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setAreaofworkToEdit(null);
              setModalValue({ areaofwork: "", projectIds: [] });
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateAreaofwork}
            variant="contained"
            startIcon={<Edit />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
              },
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Delete color="error" />
            <Typography variant="h6">Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete area of work{" "}
            <strong>{areaofworkToDelete?.areaofwork}</strong>?
            <br />
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            startIcon={<Delete />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
