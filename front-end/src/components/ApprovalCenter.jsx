import React, { useState } from "react";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import { apiService } from "../services/api";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Checkbox,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  Refresh,
  Close,
  Assignment,
  AccessTime,
  Description,
  History,
  Person,
} from "@mui/icons-material";
import ErrorMessage from "./ErrorMessage";
import Loading from "./Loading";
import { useAuth } from "../context/AuthContext";

const ApprovalCenter = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [comments, setComments] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  const { data: pendingApprovals, loading: pendingLoading, refetch: refetchPending } = useApi(
    () => apiService.getPendingApprovals({ approverId: user?.id }),
    [user?.id]
  );

  const { data: approvalHistory, loading: historyLoading } = useApi(
    () => apiService.getApprovalHistory({}),
    []
  );

  const { mutate: approveEntity, loading: approving } = useMutation((data) =>
    apiService.approveEntity(data.entityType, data.entityId, {
      approverId: user?.id || 1,
      status: data.status,
      comments: data.comments,
    })
  );

  const { mutate: bulkApprove, loading: bulkApproving } = useMutation(apiService.bulkApprove);

  const handleApprove = (item, status) => {
    setSelectedItem({ ...item, status });
    setApprovalDialog(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedItem) return;

    const result = await approveEntity({
      entityType: selectedItem.entityType,
      entityId: selectedItem.entityId,
      status: selectedItem.status,
      comments,
    });

    if (result.success) {
      setApprovalDialog(false);
      setSelectedItem(null);
      setComments("");
      refetchPending();
      alert(`Item ${selectedItem.status} successfully`);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedItems.length === 0) {
      alert("Please select items to approve");
      return;
    }

    // Group by entity type
    const grouped = selectedItems.reduce((acc, item) => {
      if (!acc[item.entityType]) {
        acc[item.entityType] = [];
      }
      acc[item.entityType].push(item.entityId);
      return acc;
    }, {});

    // Approve each group
    for (const [entityType, entityIds] of Object.entries(grouped)) {
      await bulkApprove({
        entityType,
        entityIds,
        approverId: user?.id || 1,
        comments: "Bulk approved",
      });
    }

    setSelectedItems([]);
    refetchPending();
    alert("Bulk approval completed");
  };

  const toggleSelectItem = (item) => {
    const exists = selectedItems.find(
      (i) => i.entityType === item.entityType && i.entityId === item.entityId
    );
    if (exists) {
      setSelectedItems(selectedItems.filter((i) => i !== exists));
    } else {
      setSelectedItems([...selectedItems, { entityType: item.entityType, entityId: item.entityId }]);
    }
  };

  if (pendingLoading || historyLoading) {
    return <Loading message="Loading approvals..." />;
  }

  const leaves = pendingApprovals?.filter((a) => a.entityType === "leave") || [];
  const overtime = pendingApprovals?.filter((a) => a.entityType === "overtime") || [];
  const timesheets = pendingApprovals?.filter((a) => a.entityType === "timesheet") || [];

  return (
    <Box sx={{ p: 3 }}>
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
              Approval Center
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and approve pending requests
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refetchPending}
            >
              Refresh
            </Button>
            {selectedItems.length > 0 && (
              <Button
                variant="contained"
                onClick={handleBulkApprove}
                disabled={bulkApproving}
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                  },
                }}
              >
                Bulk Approve ({selectedItems.length})
              </Button>
            )}
          </Stack>
        </Box>
      </Box>

      <Tabs
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        sx={{
          mb: 3,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
          },
        }}
      >
        <Tab
          icon={<Description />}
          iconPosition="start"
          label={`Leaves (${leaves.length})`}
        />
        <Tab
          icon={<AccessTime />}
          iconPosition="start"
          label={`Overtime (${overtime.length})`}
        />
        <Tab
          icon={<Assignment />}
          iconPosition="start"
          label={`Timesheets (${timesheets.length})`}
        />
        <Tab
          icon={<History />}
          iconPosition="start"
          label="History"
        />
      </Tabs>

      {/* Leaves Tab */}
      {tabValue === 0 && (
        <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <CardContent>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell padding="checkbox" sx={{ color: "white" }}>Select</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Employee</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Leave Type</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>From</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>To</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Hours</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Reason</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaves.length > 0 ? (
                    leaves.map((item) => (
                      <TableRow key={item.entityId} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedItems.some(
                              (i) => i.entityType === item.entityType && i.entityId === item.entityId
                            )}
                            onChange={() => toggleSelectItem(item)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Person sx={{ fontSize: 16, color: "text.secondary" }} />
                            {item.requestedBy}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={item.entity.leaveType} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{item.entity.leaveFrom}</TableCell>
                        <TableCell>{item.entity.leaveTo}</TableCell>
                        <TableCell>{item.entity.leaveHours}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 200,
                            }}
                          >
                            {item.entity.reason}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleApprove(item, "approved")}
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
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleApprove(item, "rejected")}
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
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No pending leave requests</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Overtime Tab */}
      {tabValue === 1 && (
        <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <CardContent>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell padding="checkbox" sx={{ color: "white" }}>Select</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Employee</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>OT Hours</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>OT Amount</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overtime.length > 0 ? (
                    overtime.map((item) => (
                      <TableRow key={item.entityId} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedItems.some(
                              (i) => i.entityType === item.entityType && i.entityId === item.entityId
                            )}
                            onChange={() => toggleSelectItem(item)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Person sx={{ fontSize: 16, color: "text.secondary" }} />
                            {item.requestedBy}
                          </Box>
                        </TableCell>
                        <TableCell>{item.entity.attendance_date}</TableCell>
                        <TableCell>
                          <Chip label={item.entity.ot_hours} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight="bold" color="success.main">
                            AED {parseFloat(item.entity.ot_amount || 0).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleApprove(item, "approved")}
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
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleApprove(item, "rejected")}
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
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No pending overtime requests</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Timesheets Tab */}
      {tabValue === 2 && (
        <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <CardContent>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell padding="checkbox" sx={{ color: "white" }}>Select</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Employee</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Project</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Hours</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timesheets.length > 0 ? (
                    timesheets.map((item) => (
                      <TableRow key={item.entityId} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedItems.some(
                              (i) => i.entityType === item.entityType && i.entityId === item.entityId
                            )}
                            onChange={() => toggleSelectItem(item)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Person sx={{ fontSize: 16, color: "text.secondary" }} />
                            {item.requestedBy}
                          </Box>
                        </TableCell>
                        <TableCell>{item.entity.projectName}</TableCell>
                        <TableCell>{item.entity.sentDate}</TableCell>
                        <TableCell>
                          <Chip label={item.entity.totalHours} size="small" color="info" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleApprove(item, "approved")}
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
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleApprove(item, "rejected")}
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
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No pending timesheet requests</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* History Tab */}
      {tabValue === 3 && (
        <Card sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <CardContent>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Type</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Entity ID</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Approver</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Level</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Comments</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {approvalHistory?.length > 0 ? (
                    approvalHistory.map((history) => (
                      <TableRow key={history.id} hover>
                        <TableCell>
                          <Chip label={history.entity_type} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{history.entity_id}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Person sx={{ fontSize: 16, color: "text.secondary" }} />
                            {history.employeeName}
                          </Box>
                        </TableCell>
                        <TableCell>{history.approval_level}</TableCell>
                        <TableCell>
                          <Chip
                            label={history.status}
                            color={
                              history.status === "approved"
                                ? "success"
                                : history.status === "rejected"
                                ? "error"
                                : "warning"
                            }
                            size="small"
                            variant={history.status === "approved" ? "filled" : "outlined"}
                          />
                        </TableCell>
                        <TableCell>{new Date(history.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 200,
                            }}
                          >
                            {history.comments || "N/A"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No approval history found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Approval Dialog */}
      <Dialog
        open={approvalDialog}
        onClose={() => {
          setApprovalDialog(false);
          setComments("");
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              {selectedItem?.status === "approved" ? "Approve" : "Reject"} {selectedItem?.entityType}
            </Typography>
            <IconButton
              onClick={() => {
                setApprovalDialog(false);
                setComments("");
              }}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Comments"
            multiline
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            placeholder="Enter approval comments (optional)"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setApprovalDialog(false);
              setComments("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmApprove}
            variant="contained"
            disabled={approving}
            startIcon={selectedItem?.status === "approved" ? <CheckCircle /> : <Cancel />}
            color={selectedItem?.status === "approved" ? "success" : "error"}
            sx={{
              background:
                selectedItem?.status === "approved"
                  ? "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)"
                  : "linear-gradient(135deg, #f44336 0%, #c62828 100%)",
              "&:hover": {
                background:
                  selectedItem?.status === "approved"
                    ? "linear-gradient(135deg, #43a047 0%, #1b5e20 100%)"
                    : "linear-gradient(135deg, #e53935 0%, #b71c1c 100%)",
              },
            }}
          >
            {approving ? "Processing..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApprovalCenter;

