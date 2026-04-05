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

investmentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // If My Self / Investment token is invalid or expired, clear it so InvestmentGate can re-authenticate.
    if (error?.response?.status === 401) {
      try {
        localStorage.removeItem(INVESTMENT_TOKEN_KEY);
      } catch (_) {
        // no-op
      }
    }
    return Promise.reject(error);
  }
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
  validateCheckout: (data) => investmentApi.post("/investment/checkout/validate", data),
  createRazorpayOrder: (data) => investmentApi.post("/investment/checkout/create-order", data),
  paymentSuccess: (data) => investmentApi.post("/investment/payment/success", data),
  listInvestments: () => investmentApi.get("/investment/list"),
  // My Self (challenge) reports
  getChallengeReports: (params) => investmentApi.get("/challenge/reports", { params: params || {} }),
  // Investment reports (list + by id)
  getInvestmentReports: (params) => investmentApi.get("/investment/reports", { params: params || {} }),
  getInvestmentReportById: (id) => investmentApi.get(`/investment/reports/${id}`),
  // Referral
  getReferralStats: () => investmentApi.get("/investment/referral/stats"),
  getReferralHistory: () => investmentApi.get("/investment/referral/history"),
  // Withdraw
  getWithdrawPreview: (investmentId) => investmentApi.get(`/investment/withdraw/preview/${investmentId}`),
  withdraw: (investmentId) => investmentApi.post("/investment/withdraw", { investment_id: investmentId }),
};

export default investmentApiService;
