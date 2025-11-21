import React from "react";
import { Alert, AlertTitle, Box, Button, Typography } from "@mui/material";
import { Refresh } from "@mui/icons-material";

const ErrorMessage = ({ error, title = "Error", severity = "error", onClose, onRetry }) => {
  if (!error) return null;

  const errorMessage =
    typeof error === "string" ? error : error.message || "An error occurred";
  
  const isRateLimit = errorMessage?.toLowerCase().includes("too many requests") || 
                      errorMessage?.toLowerCase().includes("rate limit");

  return (
    <Alert 
      severity={severity} 
      onClose={onClose} 
      sx={{ 
        mb: 2,
        "& .MuiAlert-message": {
          width: "100%",
        },
      }}
      action={
        isRateLimit && onRetry ? (
          <Button
            color="inherit"
            size="small"
            onClick={onRetry}
            startIcon={<Refresh />}
            sx={{ mt: 0.5 }}
          >
            Retry
          </Button>
        ) : null
      }
    >
      {title && <AlertTitle>{title}</AlertTitle>}
      <Box>
        <Typography variant="body2">{errorMessage}</Typography>
        {isRateLimit && (
          <Typography variant="caption" sx={{ mt: 1, display: "block", opacity: 0.8 }}>
            Please wait a moment before trying again. If the issue persists, try refreshing the page.
          </Typography>
        )}
      </Box>
    </Alert>
  );
};

export default ErrorMessage;

