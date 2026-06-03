import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  IconButton,
  Chip,
  Link,
  Fade,
  Slide,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Notifications,
  Announcement,
  Description,
  PhotoLibrary,
  InsertDriveFile,
  TrendingUp,
  PhoneAndroid,
  GetApp,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import Login from "./Login";
import { apiService } from "./services/api";
import config from "./config/index.js";
import { useApi } from "./hooks/useApi";
import ErrorMessage from "./components/ErrorMessage";
import { useAppTheme } from "./context/AppThemeContext";
import defaultLogo from "./assets/logo.png";
import { useTranslation } from "react-i18next";

function Start() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { logoUrl } = useAppTheme();
  const logoSrc = logoUrl || defaultLogo;
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { data: settingsData, error } = useApi(apiService.getSettings);
  const [lastValue, setLastValue] = useState(null);
  const [currentUpdateIndex, setCurrentUpdateIndex] = useState(0);

  useEffect(() => {
    if (settingsData && Array.isArray(settingsData) && settingsData.length > 0) {
      const lastIndex = settingsData.length - 1;
      const lastItem = settingsData[lastIndex];
      setLastValue(lastItem);
    }
  }, [settingsData]);

  // Auto-scroll updates
  useEffect(() => {
    if (settingsData && settingsData.length > 1) {
      const interval = setInterval(() => {
        setCurrentUpdateIndex((prev) => (prev + 1) % settingsData.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [settingsData]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
        py: { xs: 2, md: 0 },
      }}
    >
      <Container maxWidth="xl" sx={{ height: "100vh", py: { xs: 2, md: 4 } }}>
        <Grid container spacing={3} sx={{ height: "100%" }}>
          {/* Left Column - Updates */}
          <Grid item xs={12} md={3}>
            <Fade in timeout={800}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 3,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                  background: "rgba(255,255,255,0.95)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Box
                  sx={{
                    background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
                    color: "white",
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Notifications sx={{ fontSize: 28 }} />
                  <Typography variant="h6" fontWeight="bold">
                    {t("start.updatesNews", { defaultValue: "Updates & News" })}
                  </Typography>
                </Box>
                <CardContent
                  sx={{
                    flex: 1,
                    overflow: "auto",
                    "&::-webkit-scrollbar": {
                      width: "8px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "#f1f1f1",
                      borderRadius: "10px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "#888",
                      borderRadius: "10px",
                      "&:hover": {
                        background: "#555",
                      },
                    },
                  }}
                >
                  {error && <ErrorMessage error={error} />}
                  {settingsData && settingsData.length > 0 ? (
                    <Box>
                      {settingsData.map((res, index) => (
                        <Slide
                          direction="up"
                          in={index === currentUpdateIndex}
                          timeout={500}
                          key={res.id}
                        >
                          <Paper
                            elevation={2}
                            sx={{
                              p: 2,
                              mb: 2,
                              borderRadius: 2,
                              borderLeft: "4px solid",
                              borderColor: "primary.main",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: "translateY(-4px)",
                                boxShadow: 4,
                              },
                            }}
                          >
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              color="primary"
                              gutterBottom
                            >
                              {res?.updateTitle}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {res?.UpdateDisc}
                            </Typography>
                            <Chip
                              label={t("start.updateNumber", { defaultValue: "Update {{num}}", num: index + 1 })}
                              size="small"
                              sx={{ mt: 1 }}
                              color="primary"
                              variant="outlined"
                            />
                          </Paper>
                        </Slide>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      {t("start.noUpdatesAvailable", { defaultValue: "No updates available" })}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Center Column - Banner & Announcement */}
          <Grid item xs={12} md={6}>
            <Fade in timeout={1000}>
              <Box sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Banner */}
                <Card
                  sx={{
                    flex: 1,
                    borderRadius: 3,
                    overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                    position: "relative",
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      minHeight: { xs: "200px", md: "400px" },
                      background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      component="img"
                      src={`${config.baseUrl}/src/assets/banner.jpg`}
                      alt="Banner"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 0.9,
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "linear-gradient(135deg, rgba(102,126,234,0.8) 0%, rgba(118,75,162,0.8) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="h3"
                        fontWeight="bold"
                        color="white"
                        textAlign="center"
                        sx={{ textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}
                      >
                        {t("start.welcome", { defaultValue: "Welcome to the Nickname Infotech" })}

                        {/* Login Section */}
                        <Card
                          sx={{
                            flex: 1,
                            marginTop: 2,
                            borderRadius: 3,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                            background: "rgba(255,255,255,0.95)",
                            backdropFilter: "blur(10px)",
                            display: "flex",
                            flexDirection: "column",
                            width: "50%",
                            margin: "20px auto 0 auto",
                          }}
                        >
                          <Box
                            sx={{
                              background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
                              color: "white",
                              p: 2,
                              textAlign: "center",
                            }}
                          >
                            <Typography variant="h6" fontWeight="bold">
                              {t("auth.login", { defaultValue: "Login" })}
                            </Typography>
                          </Box>
                          <CardContent sx={{ flex: 1, display: "flex", alignItems: "center" }}>
                            <Box sx={{ width: "100%" }}>
                              <Login />
                            </Box>
                          </CardContent>
                        </Card>
                      </Typography>

                    </Box>


                  </Box>

                </Card>

                {/* Flash Announcement */}
                {lastValue?.Announcements && (
                  <Slide direction="up" in timeout={1200}>
                    <Paper
                      elevation={3}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        background: "rgba(255,255,255,0.95)",
                        backdropFilter: "blur(10px)",
                        borderLeft: "4px solid",
                        borderColor: "warning.main",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Announcement color="warning" />
                        <Typography variant="subtitle2" fontWeight="bold" color="warning.main">
                          {t("start.importantAnnouncement", { defaultValue: "Important Announcement" })}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {lastValue.Announcements}
                      </Typography>
                    </Paper>
                  </Slide>
                )}
              </Box>
            </Fade>
          </Grid>

          {/* Right Column - Logo, Links & Login */}
          <Grid item xs={12} md={3}>
            <Fade in timeout={1400}>
              <Box sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Logo & Quick Links */}
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                    background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <CardContent>
                    <Box sx={{ textAlign: "center", mb: 3 }}>
                      <Box
                        component="img"
                        src={logoSrc}
                        alt={t("layout.logoAlt", { defaultValue: "Logo" })}
                        sx={{
                          maxWidth: "150px",
                          height: "auto",
                          mb: 2,
                          objectFit: "contain",
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = defaultLogo;
                        }}
                      />
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {t("start.quickLinks", { defaultValue: "Quick Links" })}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      {lastValue?.Circular && (
                        <Link
                          href={lastValue.Circular}
                          target="_blank"
                          underline="none"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: "primary.light",
                            color: "white",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              bgcolor: "primary.main",
                              transform: "translateX(5px)",
                            },
                          }}
                        >
                          <Description />
                          <Typography variant="body2" fontWeight="medium">
                            {t("start.circular", { defaultValue: "Circular" })}
                          </Typography>
                        </Link>
                      )}
                      {lastValue?.Gallery && (
                        <Link
                          href={lastValue.Gallery}
                          target="_blank"
                          underline="none"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: "secondary.light",
                            color: "white",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              bgcolor: "secondary.main",
                              transform: "translateX(5px)",
                            },
                          }}
                        >
                          <PhotoLibrary />
                          <Typography variant="body2" fontWeight="medium">
                            {t("start.photoGallery", { defaultValue: "Photo Gallery" })}
                          </Typography>
                        </Link>
                      )}
                      {lastValue?.ViewExcel && (
                        <Link
                          href={lastValue.ViewExcel}
                          target="_blank"
                          underline="none"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: "success.light",
                            color: "white",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              bgcolor: "success.main",
                              transform: "translateX(5px)",
                            },
                          }}
                        >
                          <InsertDriveFile />
                          <Typography variant="body2" fontWeight="medium">
                            {t("start.viewExcelWord", { defaultValue: "View Excel / Word" })}
                          </Typography>
                        </Link>
                      )}
                    </Box>
                  </CardContent>
                </Card>

                {/* Mobile App Download Section */}
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                    background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(10px)",
                    border: "2px solid",
                    borderColor: "primary.main",
                  }}
                >
                  <Box
                    sx={{
                      background: "linear-gradient(135deg, #4C86F9 0%, #49A84C 100%)",
                      color: "white",
                      p: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <PhoneAndroid sx={{ fontSize: 28 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {t("start.mobileApp", { defaultValue: "Mobile App" })}
                    </Typography>
                  </Box>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {t("start.mobileAppSubtitle", {
                        defaultValue:
                          "Download our mobile app for Android devices. Access your timesheet, leave requests, and more on the go!",
                      })}
                    </Typography>
                    <Box
                      component="a"
                      href={`/mobile-app/app-release.apk`}
                      download="timesheet-mobile-app.apk"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: "primary.main",
                        color: "white",
                        textDecoration: "none",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          bgcolor: "primary.dark",
                          transform: "translateY(-2px)",
                          boxShadow: 4,
                        },
                      }}
                    >
                      <GetApp />
                      <Typography variant="body1" fontWeight="bold">
                        {t("start.downloadApk", { defaultValue: "Download APK" })}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block", textAlign: "center" }}>
                      {t("start.apkMeta", { defaultValue: "Version 1.0.0 • Size: ~51 MB" })}
                    </Typography>
                  </CardContent>
                </Card>


              </Box>
            </Fade>
          </Grid>
        </Grid>

        {/* Footer - Privacy Policy & Terms and Conditions */}
        <Box
          component="footer"
          sx={{
            textAlign: "center",
            borderTop: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", mb: 1 }}>
            <Link
              component={RouterLink}
              to="/privacy-policy"
              sx={{
                color: "rgba(255,255,255,0.95)",
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
                mr: 2,
              }}
            >
              {t("legal.privacyPolicy", { defaultValue: "Privacy Policy" })}
            </Link>
            <Link
              component={RouterLink}
              to="/terms-and-conditions"
              sx={{
                color: "rgba(255,255,255,0.95)",
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
                mr: 2,
              }}
            >
              {t("legal.termsAndConditions", { defaultValue: "Terms and Conditions" })}
            </Link>
            <Link
              component={RouterLink}
              to="/support"
              sx={{
                color: "rgba(255,255,255,0.95)",
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {t("legal.support", { defaultValue: "Support" })}
            </Link>
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
            {t("start.footerCopyright", { defaultValue: "© Time Sheet Management" })}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Start;
