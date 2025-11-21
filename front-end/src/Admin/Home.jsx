import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import {
  People,
  Business,
  PersonAdd,
  Assessment,
  TrendingUp,
} from "@mui/icons-material";
import { apiService } from "../services/api";
import { useApi } from "../hooks/useApi";
import Loading from "../components/Loading";

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
  const [lead, setLead] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [hr, setHr] = useState(null);
  const [project, setProject] = useState(null);

  const { data: employees, loading: employeesLoading } = useApi(apiService.getEmployees);
  const { data: projects, loading: projectsLoading } = useApi(apiService.getProjects);

  useEffect(() => {
    if (employees) {
      setEmployee(employees.length);
      const hrCount = employees.filter((item) => item.role === "HR").length;
      const tlCount = employees.filter((item) => item.role === "TL").length;
      setHr(hrCount);
      setLead(tlCount);
    }
  }, [employees]);

  useEffect(() => {
    if (projects) {
      setProject(projects.length);
    }
  }, [projects]);

  if (employeesLoading || projectsLoading) {
    return <Loading message="Loading dashboard..." />;
  }

  const stats = [
    {
      title: "Team Leads",
      value: lead || 0,
      icon: <PersonAdd sx={{ fontSize: 32 }} />,
      color: ["#667eea", "#764ba2"],
    },
    {
      title: "Employees",
      value: employee || 0,
      icon: <People sx={{ fontSize: 32 }} />,
      color: ["#f093fb", "#f5576c"],
    },
    {
      title: "Human Resources",
      value: hr || 0,
      icon: <People sx={{ fontSize: 32 }} />,
      color: ["#4facfe", "#00f2fe"],
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Dashboard Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Here's what's happening with your organization today.
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

      {/* Quick Stats Section */}
      <Box sx={{ mt: 4 }}>
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <TrendingUp sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  System Statistics
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Real-time overview of your organization
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {stats.map((stat) => (
                <Grid item xs={6} md={3} key={stat.title}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4" fontWeight="bold">
                      {stat.value || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                      {stat.title}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default Home;
