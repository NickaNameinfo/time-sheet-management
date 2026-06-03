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
import { useTranslation } from "react-i18next";

function projectProgressPercent(project) {
  const raw = project?.completion;
  if (raw === null || raw === undefined || raw === "") return 0;
  const n = Number(raw);
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

const StatCard = ({ title, value, icon, color, delay = 0 }) => {
  const { t } = useTranslation();
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
                {t("dashboard.total")}
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
  const { t } = useTranslation();
  const { user, isAdmin, isHR, isCompanyAdmin, isTeamLead } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [project, setProject] = useState(null);

  const { data: employees, loading: employeesLoading } = useApi(apiService.getEmployees);
  const { data: projects, loading: projectsLoading } = useApi(apiService.getProjects);
  const { data: projectPlans, loading: plansLoading } = useApi(apiService.getProjectPlans);

  const projectList = Array.isArray(projects) ? projects : [];

  const visibleProjects = useMemo(() => {
    const candidateIds = [
      user?.employeeRecordId,
      user?.id,
      user?.employeeId, // EMPID for many tables
    ]
      .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
      .map((v) => String(v));
    const seeAll = isAdmin() || isHR() || isCompanyAdmin();
    if (seeAll) return projectList;
    return projectList.filter((p) => {
      const assigned = Array.isArray(p.assignedEmployees) ? p.assignedEmployees : [];
      const onTeam =
        candidateIds.length > 0 &&
        assigned.some((eid) => candidateIds.includes(String(eid)));
      const isLead =
        candidateIds.length > 0 &&
        p.tlID != null &&
        candidateIds.includes(String(p.tlID));
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

  const planTotalsByProjectKey = useMemo(() => {
    const map = new Map();
    const rows = Array.isArray(projectPlans)
      ? projectPlans
      : projectPlans?.Result || projectPlans?.data?.Result || [];
    for (const p of rows) {
      const key = String(p.projectName || p.project_name || "").trim().toLowerCase();
      if (!key) continue;
      const utilized = Number(p.utilized_hours ?? p.utilizedHours ?? 0) || 0;
      const allotted = Number(p.total_allotted_hours ?? p.totalAllottedHours ?? p.total_allotted ?? 0) || 0;
      const pctRaw = p.progress_percent ?? p.progressPercent ?? null;
      const pct =
        pctRaw != null && pctRaw !== ""
          ? Math.min(100, Math.max(0, Number(pctRaw) || 0))
          : allotted > 0
          ? Math.min(100, Math.max(0, (utilized / allotted) * 100))
          : 0;

      const prev = map.get(key);
      if (!prev || pct > prev.pct) {
        map.set(key, { pct, utilized, allotted });
      }
    }
    return map;
  }, [projectPlans]);

  const planProgressByProjectKey = useMemo(() => {
    const map = new Map();
    const rows = Array.isArray(planAssignments.assignedPlansWithProgress)
      ? planAssignments.assignedPlansWithProgress
      : [];
    for (const a of rows) {
      const key = String(a.projectName || "").trim().toLowerCase();
      if (!key) continue;
      const pct = Number(a.progressPercent ?? 0) || 0;
      const prev = map.get(key);
      if (prev == null || pct > prev) map.set(key, pct);
    }
    return map;
  }, [planAssignments.assignedPlansWithProgress]);

  const planUsedHoursByProjectKey = useMemo(() => {
    const map = new Map();
    const rows = Array.isArray(planAssignments.assignedPlansWithProgress)
      ? planAssignments.assignedPlansWithProgress
      : [];
    for (const a of rows) {
      const key = String(a.projectName || "").trim().toLowerCase();
      if (!key) continue;
      const used = Number(a.usedHours ?? 0) || 0;
      const prev = map.get(key);
      if (prev == null || used > prev) map.set(key, used);
    }
    return map;
  }, [planAssignments.assignedPlansWithProgress]);

  const planCapHoursByProjectKey = useMemo(() => {
    const map = new Map();
    const rows = Array.isArray(planAssignments.assignedPlansWithProgress)
      ? planAssignments.assignedPlansWithProgress
      : [];
    for (const a of rows) {
      const key = String(a.projectName || "").trim().toLowerCase();
      if (!key) continue;
      const cap = Number(a.progressCap ?? 0) || 0;
      const prev = map.get(key);
      if (prev == null || cap > prev) map.set(key, cap);
    }
    return map;
  }, [planAssignments.assignedPlansWithProgress]);

  if (projectsLoading || plansLoading || (showAdminOverview && employeesLoading)) {
    return <Loading message={t("dashboard.loading", { defaultValue: "Loading dashboard..." })} />;
  }

  const stats = [
    {
      title: t("dashboard.employees", { defaultValue: "Employees" }),
      value: employee || 0,
      icon: <People sx={{ fontSize: 32 }} />,
      color: ["#f093fb", "#f5576c"],
    },
    {
      title: t("dashboard.projects", { defaultValue: "Projects" }),
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
              {t("dashboard.projectsAndProgress")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isAdmin() || isHR() || isCompanyAdmin()
                ? t("dashboard.allCompanyProjects")
                : t("dashboard.assignedProjects")}
            </Typography>
          </Box>
          <Button
            component={Link}
            to="/Dashboard/projects"
            size="small"
            endIcon={<ArrowForward />}
            variant="outlined"
          >
            {t("dashboard.viewAll")}
          </Button>
        </Box>
        {visibleProjects.length === 0 ? (
          <Card variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t("dashboard.noProjects")}
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {visibleProjects.map((p) => {
              const seeAll = isAdmin() || isHR() || isCompanyAdmin();
              const projectKey = String(p.projectName || "").trim().toLowerCase();
              const totals = projectKey ? planTotalsByProjectKey.get(projectKey) : null;
              const planPctAll = totals?.pct ?? null;
              const planPct = projectKey ? planProgressByProjectKey.get(projectKey) : null;
              const projectAllotted = Number(p.allotatedHours ?? p.allottedHours ?? 0) || 0;
              const utilizedHours = Number(totals?.utilized ?? 0) || 0;
              const pctByProjectAllotted =
                projectAllotted > 0
                  ? Math.min(100, Math.max(0, (utilizedHours / projectAllotted) * 100))
                  : null;
              const pct = pctByProjectAllotted ?? planPctAll ?? planPct ?? projectProgressPercent(p);
              const status = (p.status || "active").toLowerCase();
              const canOpenEditor =
                isAdmin() || isHR() || isCompanyAdmin() || isTeamLead();
              const projectHref = canOpenEditor ? `/Dashboard/addProject/${p.id}` : "/Dashboard/projects";
              const used = projectKey ? planUsedHoursByProjectKey.get(projectKey) : null;
              const cap = projectKey ? planCapHoursByProjectKey.get(projectKey) : null;
              const plannedAllotted = Number(totals?.allotted ?? 0) || 0;
              const plannedRemaining = Math.max(0, projectAllotted - plannedAllotted);
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
                              {p.projectName || t("dashboard.untitledProject")}
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
                        {t("dashboard.completion")}
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
                      <Stack
                        direction="row"
                        flexWrap="wrap"
                        sx={{
                          mt: 1,
                          columnGap: 1,
                          rowGap: 1,
                          "& .MuiChip-root": { height: 28, fontWeight: 600 },
                        }}
                      >
                        <Chip
                          size="small"
                          variant="outlined"
                          color="info"
                          label={`${t("dashboard.utilized")}: ${utilizedHours.toFixed(2)} hrs`}
                        />
                        <Chip
                          size="small"
                          variant="outlined"
                          color="primary"
                          label={`${t("dashboard.allotted")}: ${projectAllotted.toFixed(2)} hrs`}
                        />
                        <Chip
                          size="small"
                          variant="outlined"
                          color={plannedRemaining <= 0 ? "success" : "warning"}
                          label={`${t("dashboard.remaining")}: ${plannedRemaining.toFixed(2)} hrs`}
                        />
                      </Stack>
                      {!seeAll && used != null && cap != null && cap > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                          {used.toFixed(2)} / {cap.toFixed(2)} {t("common.hrs", { defaultValue: "hrs" })}
                        </Typography>
                      )}
                      <Button
                        component={Link}
                        to={projectHref}
                        size="small"
                        sx={{ mt: 2 }}
                        fullWidth
                        variant="text"
                      >
                        {canOpenEditor ? t("dashboard.openProject") : t("dashboard.viewProjects")}
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
              {t("dashboard.dashboardOverview")}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t("dashboard.welcomeBack")}
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
