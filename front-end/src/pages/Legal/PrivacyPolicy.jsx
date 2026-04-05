import React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Link as MuiLink,
} from "@mui/material";
// import { PrivacyIcon } from "@mui/icons-material";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <Box sx={{ py: 4, minHeight: "100vh", bgcolor: "grey.50" }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            {/* <PrivacyIcon color="primary" sx={{ fontSize: 32 }} /> */}
            <Typography variant="h4" fontWeight="bold" color="primary">
              Privacy Policy
            </Typography>
          </Box>
          <Typography variant="body1" paragraph>
            This Privacy Policy applies to the mobile app <strong>My Self</strong> (also referred to as Time Sheet Management) and related web services, developed and operated by <strong>Nicknameinfo Infotech</strong> (the developer and legal entity).
          </Typography>
          <Typography variant="body1" paragraph>
            We respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and safeguard your information when you use our app (including the mobile app), web platform, and investment services.
          </Typography>

          <Typography variant="h6" fontWeight="600" sx={{ mt: 3, mb: 1 }}>
            1. Information we collect
          </Typography>
          <Typography variant="body1" component="div" paragraph>
            • Account and profile information (name, email, phone)
            <br />
            • KYC details (bank, Aadhaar, PAN) as required for investment
            <br />
            • Usage data and device information (e.g. for time sheet and challenges)
          </Typography>

          <Typography variant="h6" fontWeight="600" sx={{ mt: 2, mb: 1 }}>
            2. How we use your information
          </Typography>
          <Typography variant="body1" component="div" paragraph>
            • To provide and improve our services (time sheet, challenges, investments)
            <br />
            • To verify your identity and comply with regulations
            <br />
            • To communicate with you about your account and investments
          </Typography>

          <Typography variant="h6" fontWeight="600" sx={{ mt: 2, mb: 1 }}>
            3. Data security
          </Typography>
          <Typography variant="body1" paragraph>
            We use encryption and secure storage for sensitive data. Your KYC and financial details are handled in line with applicable laws.
          </Typography>

          <Typography variant="h6" fontWeight="600" sx={{ mt: 2, mb: 1 }}>
            4. Sharing of data
          </Typography>
          <Typography variant="body1" paragraph>
            We do not sell your personal data. We may share information only as required by law or with service providers who assist us under strict confidentiality.
          </Typography>

          <Typography variant="h6" fontWeight="600" sx={{ mt: 2, mb: 1 }}>
            5. Your rights
          </Typography>
          <Typography variant="body1" paragraph>
            You may request access, correction, or deletion of your personal data by contacting us.
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            Last updated: Please refer to the current version on our platform.
          </Typography>

          <Box sx={{ mt: 4, display: "flex", gap: 2, flexWrap: "wrap" }}>
            <MuiLink component={Link} to="/terms-and-conditions" underline="hover">
              View Terms and Conditions
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
