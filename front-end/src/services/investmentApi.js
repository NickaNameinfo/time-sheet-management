import axios from "axios";
import config from "../config/index.js";

const INVESTMENT_TOKEN_KEY = "challenge_auth_token";

const investmentApi = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

investmentApi.interceptors.request.use(
  (cfg) => {
    const token = localStorage.getItem(INVESTMENT_TOKEN_KEY);
    if (token) {
      cfg.headers.Authorization = `Bearer ${token}`;
    }
    return cfg;
  },
  (e) => Promise.reject(e)
);

export const getInvestmentToken = () => localStorage.getItem(INVESTMENT_TOKEN_KEY);
export const setInvestmentToken = (token) => {
  if (token) localStorage.setItem(INVESTMENT_TOKEN_KEY, token);
  else localStorage.removeItem(INVESTMENT_TOKEN_KEY);
};

export const investmentApiService = {
  // Challenge auth (My Self / Investment)
  challengeLogin: (email, password) =>
    axios.post(`${config.apiBaseUrl}/challenge-auth/login`, { email, password }),
  accessWithEmployee: (employeeToken) =>
    axios.post(`${config.apiBaseUrl}/challenge-auth/access-with-employee`, {}, {
      headers: { Authorization: `Bearer ${employeeToken}` },
    }),

  getKycStatus: () => investmentApi.get("/investment/kyc/status"),
  submitKyc: (data) => investmentApi.post("/investment/kyc/submit", data),
  getDashboard: () => investmentApi.get("/investment/dashboard"),
  getPlans: () => investmentApi.get("/investment/plans"),
  // My Self (challenge) reports
  getChallengeReports: (params) => investmentApi.get("/challenge/reports", { params: params || {} }),
  // Investment reports (list + by id)
  getInvestmentReports: (params) => investmentApi.get("/investment/reports", { params: params || {} }),
  getInvestmentReportById: (id) => investmentApi.get(`/investment/reports/${id}`),
};

export default investmentApiService;
