import React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Link as MuiLink,
} from "@mui/material";
import { Description as DescriptionIcon } from "@mui/icons-material";
import { Link } from "react-router-dom";

export default function TermsAndConditions() {
  return (
    <Box sx={{ py: 4, minHeight: "100vh", bgcolor: "grey.50" }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <DescriptionIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" fontWeight="bold" color="primary">
              Terms and Conditions
            </Typography>
          </Box>
          <Typography variant="body1" paragraph>
            By using this app (including the mobile app), web platform, and our investment services, you agree to the following terms and conditions.
          </Typography>

          <Typography variant="h6" fontWeight="600" sx={{ mt: 3, mb: 1 }}>
            1. Eligibility
          </Typography>
          <Typography variant="body1" paragraph>
            You must be eligible to invest as per applicable laws. You represent that all information provided by you is true and complete.
          </Typography>

          <Typography variant="h6" fontWeight="600" sx={{ mt: 2, mb: 1 }}>
            2. Use of services
          </Typography>
          <Typography variant="body1" component="div" paragraph>
            • You will use the app and investment features only for lawful purposes.
            <br />
            • You are responsible for keeping your login credentials secure.
            <br />
            • You must complete KYC as required before investing.
          </Typography>

          <Typography variant="h6" fontWeight="600" sx={{ mt: 2, mb: 1 }}>
            3. Investments
          </Typography>
          <Typography variant="body1" component="div" paragraph>
            • Investment plans, returns, and lock-in terms are as described at the time of investment.
            <br />
            • We do not guarantee returns; past performance is not indicative of future results.
            <br />
            • Withdrawal is subject to the holding period and policy stated in the app.
          </Typography>

          <Typography variant="h6" fontWeight="600" sx={{ mt: 2, mb: 1 }}>
            4. Prohibited conduct
          </Typography>
          <Typography variant="body1" paragraph>
            You may not misuse the app, attempt unauthorised access, or violate any applicable law.
          </Typography>

          <Typography variant="h6" fontWeight="600" sx={{ mt: 2, mb: 1 }}>
            5. Changes
          </Typography>
          <Typography variant="body1" paragraph>
            We may update these terms. Continued use after changes constitutes acceptance.
          </Typography>

          <Typography variant="h6" fontWeight="600" sx={{ mt: 2, mb: 1 }}>
            6. Governing law
          </Typography>
          <Typography variant="body1" paragraph>
            These terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of the courts as per applicable law.
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            Last updated: Please refer to the current version on our platform.
          </Typography>

          <Box sx={{ mt: 4, display: "flex", gap: 2, flexWrap: "wrap" }}>
            <MuiLink component={Link} to="/privacy-policy" underline="hover">
              View Privacy Policy
            </MuiLink>
            <MuiLink component={Link} to="/support" underline="hover">
              Support
            </MuiLink>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
