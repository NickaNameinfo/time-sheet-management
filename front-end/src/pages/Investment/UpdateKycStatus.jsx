import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Collapse,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { apiService } from "../../services/api";
import InvestmentPageLayout, { sectionCardSx, cardWithAccentSx } from "./InvestmentPageLayout";

export default function UpdateKycStatus() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updating, setUpdating] = useState(null);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [rejectDialog, setRejectDialog] = useState({ open: false, row: null });
  const [rejectNote, setRejectNote] = useState("");
  const [docViewer, setDocViewer] = useState({ open: false, url: null, title: "", loading: false });

  const loadList = () => {
    setLoading(true);
    setError("");
    apiService
      .getInvestmentKycListAdmin()
      .then((res) => {
        const result = res?.data?.Result ?? res?.data;
        const data = result?.list ?? [];
        setList(data);
        setExpandedIds(new Set(data.map((r) => r.id)));
      })
      .catch((err) => setError(err?.response?.data?.Error || err?.message || "Failed to load KYC list"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
  }, []);

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(list.map((r) => r.id)));
  const collapseAll = () => setExpandedIds(new Set());
  const allExpanded = list.length > 0 && expandedIds.size === list.length;

  const handleUpdateStatus = (userId, status, adminNote = null, documentVerificationStatus = null) => {
    setUpdating(userId);
    setError("");
    setSuccess("");
    const payload = { user_id: userId };
    if (status != null) {
      payload.status = status;
      if (status === "REJECTED" && adminNote) payload.admin_note = adminNote;
    }
    if (documentVerificationStatus != null) payload.document_verification_status = documentVerificationStatus;
    apiService
      .updateInvestmentKycStatus(payload)
      .then(() => {
        setSuccess(documentVerificationStatus != null ? "Document verification status updated." : "KYC status updated.");
        setList((prev) =>
          prev.map((r) => {
            if (r.user_id !== userId) return r;
            const next = { ...r };
            if (status != null) {
              next.status = status;
              next.admin_note = status === "REJECTED" ? adminNote : null;
            }
            if (documentVerificationStatus != null) next.document_verification_status = documentVerificationStatus;
            return next;
          })
        );
        setRejectDialog({ open: false, row: null });
        setRejectNote("");
      })
      .catch((err) => setError(err?.response?.data?.Error || err?.message || "Update failed"))
      .finally(() => setUpdating(null));
  };

  const openRejectDialog = (row) => {
    setRejectNote(row.admin_note || "");
    setRejectDialog({ open: true, row });
  };

  const submitReject = () => {
    if (!rejectDialog.row) return;
    const note = rejectNote?.trim();
    if (!note) {
      setError("Please enter a note for cancellation/rejection.");
      return;
    }
    handleUpdateStatus(rejectDialog.row.user_id, "REJECTED", note);
  };

  const openDocument = (userId, type) => {
    setDocViewer({ open: true, url: null, title: type === "aadhaar" ? "Aadhaar document" : "PAN document", loading: true });
    apiService
      .getKycDocument(userId, type)
      .then((res) => {
        const blob = res?.data;
        if (!blob) throw new Error("No document");
        const url = URL.createObjectURL(blob);
        setDocViewer((prev) => ({ ...prev, url, loading: false }));
      })
      .catch(async (err) => {
        let msg = "Failed to load document";
        const data = err?.response?.data;
        if (data instanceof Blob) {
          try {
            const text = await data.text();
            const j = JSON.parse(text);
            msg = j.Error || j.message || msg;
          } catch (_) {}
        } else if (data?.Error) msg = data.Error;
        else if (err?.message) msg = err.message;
        setError(msg);
        setDocViewer((prev) => ({ ...prev, open: false, loading: false }));
      });
  };
  const closeDocViewer = () => {
    if (docViewer.url) URL.revokeObjectURL(docViewer.url);
    setDocViewer({ open: false, url: null, title: "", loading: false });
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleString() : "—");

  const getStatusColor = (status) => {
    if (status === "VERIFIED") return "success";
    if (status === "REJECTED") return "error";
    return "warning";
  };

  return (
    <InvestmentPageLayout
      title="Profile verification (KYC)"
      subtitle="View user KYC details and update verification status: Pending, Verified, or Rejected. Users see this status in the app."
      maxWidth={1200}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")} role="alert">
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")} role="status">
          {success}
        </Alert>
      )}

      {loading ? (
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
      ) : (
        <TableContainer sx={{ ...sectionCardSx, overflow: "auto", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
          {list.length > 0 && (
            <Box sx={{ px: 1, py: 1, display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button size="small" onClick={allExpanded ? collapseAll : expandAll} aria-label={allExpanded ? "Collapse all rows" : "Expand all rows"}>
                {allExpanded ? "Collapse all" : "Expand all"}
              </Button>
            </Box>
          )}
          <Table size="small" aria-label="KYC records">
            <TableHead>
              <TableRow>
                <TableCell width={48} />
                <TableCell>User</TableCell>
                <TableCell>Bank</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No KYC records
                  </TableCell>
                </TableRow>
              ) : (
                list.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableRow hover>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleExpanded(row.id)}
                          aria-label={expandedIds.has(row.id) ? "Collapse" : "Expand"}
                        >
                          {expandedIds.has(row.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="600">{row.user_name ?? "—"}</Typography>
                        <Typography variant="body2" color="text.secondary">{row.email ?? "—"}</Typography>
                        <Typography variant="caption">ID: {row.user_id}</Typography>
                      </TableCell>
                      <TableCell>
                        {row.bank_holder_name ?? "—"} / {row.bank_name ?? "—"}
                        <br />
                        <Typography variant="caption">IFSC: {row.ifsc_code ?? "—"} · {row.branch ?? "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={row.status} size="small" color={getStatusColor(row.status)} />
                        {(row.document_verification_status === "PENDING" || row.document_verification_status === "VERIFIED") && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            Docs: {row.document_verification_status}
                          </Typography>
                        )}
                        {row.admin_note && (
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                            Note: {row.admin_note}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(row.submitted_at)}
                        {row.verified_at && (
                          <>
                            <br />
                            <Typography variant="caption">Verified: {formatDate(row.verified_at)}</Typography>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            disabled={updating === row.user_id || row.status === "PENDING_VERIFICATION"}
                            onClick={() => handleUpdateStatus(row.user_id, "PENDING_VERIFICATION")}
                          >
                            Pending
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            disabled={updating === row.user_id || row.status === "VERIFIED"}
                            onClick={() => handleUpdateStatus(row.user_id, "VERIFIED")}
                          >
                            Verify
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            disabled={updating === row.user_id}
                            onClick={() => openRejectDialog(row)}
                          >
                            Cancelled with note
                          </Button>
                        </Box>
                        {updating === row.user_id && (
                          <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                            Updating...
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 0, borderBottom: expandedIds.has(row.id) ? 1 : 0 }}>
                        <Collapse in={expandedIds.has(row.id)} timeout="auto" unmountOnExit>
                          <Box sx={{ py: 2, px: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Full details
                            </Typography>
                            <Box
                              component="dl"
                              sx={{
                                display: "grid",
                                gridTemplateColumns: "auto 1fr",
                                gap: "4px 24px",
                                "& dt": { color: "text.secondary", fontWeight: 500 },
                                "& dd": { margin: 0 },
                              }}
                            >
                              <dt>Name</dt>
                              <dd>{row.user_name ?? "—"}</dd>
                              <dt>Email</dt>
                              <dd>{row.email ?? "—"}</dd>
                              <dt>Bank holder</dt>
                              <dd>{row.bank_holder_name ?? "—"}</dd>
                              <dt>Bank name</dt>
                              <dd>{row.bank_name ?? "—"}</dd>
                              <dt>IFSC</dt>
                              <dd>{row.ifsc_code ?? "—"}</dd>
                              <dt>Branch</dt>
                              <dd>{row.branch ?? "—"}</dd>
                              <dt>Address</dt>
                              <dd>{row.address ?? "—"}</dd>
                              <dt>Account</dt>
                              <dd>{row.account_number ?? "—"}</dd>
                              <dt>Aadhaar</dt>
                              <dd>{row.aadhaar_number ?? "—"}</dd>
                              <dt>PAN</dt>
                              <dd>{row.pan_number ?? "—"}</dd>
                              <dt>Status</dt>
                              <dd>
                                <Chip label={row.status} size="small" color={getStatusColor(row.status)} />
                              </dd>
                              <dt>Submitted</dt>
                              <dd>{formatDate(row.submitted_at)}</dd>
                              <dt>Verified at</dt>
                              <dd>{formatDate(row.verified_at)}</dd>
                              <dt>Documents</dt>
                              <dd>
                                {row.aadhaar_document_path ? (
                                  <Button size="small" variant="outlined" onClick={() => openDocument(row.user_id, "aadhaar")} sx={{ mr: 1 }}>
                                    View Aadhaar
                                  </Button>
                                ) : (
                                  "Aadhaar: —"
                                )}
                                {row.pan_document_path ? (
                                  <Button size="small" variant="outlined" onClick={() => openDocument(row.user_id, "pan")}>
                                    View PAN
                                  </Button>
                                ) : (
                                  " · PAN: —"
                                )}
                                {!row.aadhaar_document_path && !row.pan_document_path && "Aadhaar: — · PAN: —"}
                              </dd>
                              <dt>Document verification</dt>
                              <dd>
                                <Chip label={row.document_verification_status || "PENDING"} size="small" color={row.document_verification_status === "VERIFIED" ? "success" : "default"} sx={{ mr: 0.5 }} />
                                <Button size="small" variant="outlined" disabled={updating === row.user_id || row.document_verification_status === "PENDING"} onClick={() => handleUpdateStatus(row.user_id, null, null, "PENDING")}>Pending</Button>
                                <Button size="small" variant="outlined" color="success" disabled={updating === row.user_id || row.document_verification_status === "VERIFIED"} onClick={() => handleUpdateStatus(row.user_id, null, null, "VERIFIED")} sx={{ ml: 0.5 }}>Verify docs</Button>
                              </dd>
                              {row.admin_note && (
                                <>
                                  <dt>Admin note</dt>
                                  <dd>{row.admin_note}</dd>
                                </>
                              )}
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={docViewer.open} onClose={closeDocViewer} maxWidth="md" fullWidth aria-labelledby="doc-viewer-title">
        <DialogTitle id="doc-viewer-title">{docViewer.title}</DialogTitle>
        <DialogContent>
          {docViewer.loading && (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <Skeleton variant="rectangular" width="100%" height={300} />
            </Box>
          )}
          {docViewer.url && !docViewer.loading && (
            <iframe src={docViewer.url} title={docViewer.title} style={{ width: "100%", minHeight: 420, border: "none" }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDocViewer}>Close</Button>
          {docViewer.url && (
            <Button component="a" href={docViewer.url} target="_blank" rel="noopener noreferrer">
              Open in new tab
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, row: null })} maxWidth="sm" fullWidth aria-labelledby="reject-dialog-title">
        <DialogTitle id="reject-dialog-title">Cancelled with note</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            A note is required when marking KYC as cancelled/rejected. The user will be notified.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Note (reason for cancellation)"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="e.g. Document unclear, please resubmit with clear copy"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, row: null })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={submitReject} disabled={!rejectNote?.trim() || updating}>
            Submit & mark cancelled
          </Button>
        </DialogActions>
      </Dialog>
    </InvestmentPageLayout>
  );
}
