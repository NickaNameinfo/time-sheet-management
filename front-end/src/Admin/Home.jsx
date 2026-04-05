import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  Fade,
  useTheme,
  alpha,
  Chip,
  Stack,
  Button,
} from "@mui/material";
import {
  People,
  Business,
  Assignment,
  ArrowForward,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { apiService } from "../services/api";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";
import ClockInOutCard from "../components/ClockInOutCard";
import EmployeeAssignedProjectPlansCard from "../components/EmployeeAssignedProjectPlansCard";
import { useEmployeePlanAssignments } from "../hooks/useEmployeePlanAssignments";

function projectProgressPercent(project) {
  const raw = project?.completion;
  if (raw === null || raw === undefined || raw === "") return 0;
  const n = Number(raw);
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

const StatCard = ({ title, value, icon, color, delay = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value !== null && value !== undefined) {
      const duration = 1000;
      const steps = 50;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [value]);

  return (
    <Fade in timeout={800} style={{ transitionDelay: `${delay}ms` }}>
      <Card
        sx={{
          height: "100%",
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          transition: "all 0.3s ease",
          background: "white",
          "&:hover": {
            transform: "translateY(-8px)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                background: `linear-gradient(135deg, ${color[0]} 0%, ${color[1]} 100%)`,
                boxShadow: `0 4px 15px ${color[0]}40`,
              }}
            >
              {icon}
            </Avatar>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="h3" fontWeight="bold" color="text.primary">
                {displayValue}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Total
              </Typography>
            </Box>
          </Box>
          <Typography variant="h6" fontWeight="600" color="text.primary" sx={{ mt: 2 }}>
            {title}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={100}
            sx={{
              mt: 2,
              height: 6,
              borderRadius: 3,
              background: "rgba(0,0,0,0.05)",
              "& .MuiLinearProgress-bar": {
                background: `linear-gradient(90deg, ${color[0]} 0%, ${color[1]} 100%)`,
                borderRadius: 3,
              },
            }}
          />
        </CardContent>
      </Card>
    </Fade>
  );
};

function Home() {
  const theme = useTheme();
  const { user, isAdmin, isHR, isCompanyAdmin, isTeamLead } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [project, setProject] = useState(null);

  const { data: employees, loading: employeesLoading } = useApi(apiService.getEmployees);
  const { data: projects, loading: projectsLoading } = useApi(apiService.getProjects);

  const projectList = Array.isArray(projects) ? projects : [];

  const visibleProjects = useMemo(() => {
    const uid = user?.employeeRecordId ?? user?.id;
    const seeAll = isAdmin() || isHR() || isCompanyAdmin();
    if (seeAll) return projectList;
    return projectList.filter((p) => {
      const assigned = Array.isArray(p.assignedEmployees) ? p.assignedEmployees : [];
      const onTeam = uid != null && assigned.some((eid) => String(eid) === String(uid));
      const isLead = uid != null && p.tlID != null && String(p.tlID) === String(uid);
      return onTeam || isLead;
    });
  }, [projectList, user, isAdmin, isHR, isCompanyAdmin]);

  useEffect(() => {
    if (employees) {
      setEmployee(employees.length);
    }
  }, [employees]);

  useEffect(() => {
    if (projects) {
      const len = Array.isArray(projects) ? projects.length : 0;
      setProject(len);
    }
  }, [projects]);

  const showAdminOverview = isAdmin();
  const dashboardEmployeePk = user?.employeeRecordId ?? user?.id;
  const planAssignments = useEmployeePlanAssignments(dashboardEmployeePk);

  if (projectsLoading || (showAdminOverview && employeesLoading)) {
    return <Loading message="Loading dashboard..." />;
  }

  const stats = [
    {
      title: "Employees",
      value: employee || 0,
      icon: <People sx={{ fontSize: 32 }} />,
      color: ["#f093fb", "#f5576c"],
    },
    {
      title: "Projects",
      value: project || 0,
      icon: <Business sx={{ fontSize: 32 }} />,
      color: ["#43e97b", "#38f9d7"],
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Clock In/Out Card */}
      <ClockInOutCard />

      <EmployeeAssignedProjectPlansCard
        assignedProjectsList={planAssignments.assignedProjectsList}
        assignedProjectsLoading={planAssignments.assignedProjectsLoading}
        planWorkDetailsLoading={planAssignments.planWorkDetailsLoading}
        assignedPlansWithProgress={planAssignments.assignedPlansWithProgress}
      />

      {/* Assigned / visible projects with completion progress */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Projects &amp; progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isAdmin() || isHR() || isCompanyAdmin()
                ? "All company projects and current completion."
                : "Projects you are assigned to or lead, with completion progress."}
            </Typography>
          </Box>
          <Button
            component={Link}
            to="/Dashboard/projects"
            size="small"
            endIcon={<ArrowForward />}
            variant="outlined"
          >
            View all
          </Button>
        </Box>
        {visibleProjects.length === 0 ? (
          <Card variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No projects to show yet. Assign team members on a project or open Projects to get started.
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {visibleProjects.map((p) => {
              const pct = projectProgressPercent(p);
              const status = (p.status || "active").toLowerCase();
              const canOpenEditor =
                isAdmin() || isHR() || isCompanyAdmin() || isTeamLead();
              const projectHref = canOpenEditor ? `/Dashboard/addProject/${p.id}` : "/Dashboard/projects";
              return (
                <Grid item xs={12} sm={6} lg={4} key={p.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      borderRadius: 2,
                      transition: "box-shadow 0.2s ease",
                      "&:hover": { boxShadow: "0 6px 20px rgba(0,0,0,0.08)" },
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1} sx={{ mb: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: alpha(theme.palette.primary.main, 0.12),
                              color: "primary.main",
                            }}
                          >
                            <Assignment fontSize="small" />
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle1" fontWeight={700} noWrap title={p.projectName}>
                              {p.projectName || "Untitled project"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {p.projectNo ? `#${p.projectNo}` : `ID ${p.id}`}
                              {p.subDivision ? ` · ${p.subDivision}` : ""}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip size="small" label={status} color={status === "active" ? "success" : "default"} variant="outlined" />
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                        Completion
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            flex: 1,
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 4,
                              background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
                            },
                          }}
                        />
                        <Typography variant="body2" fontWeight={700} sx={{ minWidth: 40, textAlign: "right" }}>
                          {Math.round(pct)}%
                        </Typography>
                      </Box>
                      <Button
                        component={Link}
                        to={projectHref}
                        size="small"
                        sx={{ mt: 2 }}
                        fullWidth
                        variant="text"
                      >
                        {canOpenEditor ? "Open project" : "View projects"}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* Dashboard Overview — Admin only, after Projects & progress */}
      {showAdminOverview && (
        <>
          <Box sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Dashboard Overview
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {"Welcome back! Here's what's happening with your organization today."}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={stat.title}>
                <StatCard
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.color}
                  delay={index * 100}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
}

export default Home;
