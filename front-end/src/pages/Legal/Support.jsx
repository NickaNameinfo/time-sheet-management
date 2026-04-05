import React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Link as MuiLink,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Support as SupportIcon, Email, Phone, Link as LinkIcon } from "@mui/icons-material";
import { Link } from "react-router-dom";

export default function Support() {
  return (
    <Box sx={{ py: 4, minHeight: "100vh", bgcolor: "grey.50" }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <SupportIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" fontWeight="bold" color="primary">
              Support
            </Typography>
          </Box>
          <Typography variant="body1" paragraph>
            Need help with Time Sheet Management, the mobile app, or investments? Use the options below to get in touch.
          </Typography>

          <Typography variant="h6" fontWeight="600" sx={{ mt: 3, mb: 1 }}>
            Contact us
          </Typography>
          <List dense disablePadding>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Email color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Email"
                secondary={
                  <MuiLink href="mailto:support@nicknameinfo.com" target="_blank" rel="noopener">
                    support@nicknameinfo.com
                  </MuiLink>
                }
              />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Phone color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Phone"
                secondary="Contact your administrator or HR for workplace support."
              />
            </ListItem>
          </List>

          <Typography variant="h6" fontWeight="600" sx={{ mt: 3, mb: 1 }}>
            Getting help
          </Typography>
          <Typography variant="body1" paragraph>
            • For time sheet, attendance, and leave: contact your team lead or HR.
            <br />
            • For the mobile app: ensure you have the latest version and a stable internet connection.
            <br />
            • For challenges and investments (My Self): use the in-app support or the email above.
          </Typography>

          <Typography variant="h6" fontWeight="600" sx={{ mt: 3, mb: 1 }}>
            Useful links
          </Typography>
          <List dense disablePadding>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LinkIcon color="action" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <MuiLink component={Link} to="/privacy-policy" underline="hover">
                    Privacy Policy
                  </MuiLink>
                }
              />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LinkIcon color="action" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <MuiLink component={Link} to="/terms-and-conditions" underline="hover">
                    Terms and Conditions
                  </MuiLink>
                }
              />
            </ListItem>
          </List>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            We aim to respond to support requests as soon as possible. For urgent workplace issues, please contact your manager or HR directly.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
