// Application configuration
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  baseUrl: import.meta.env.VITE_BASE_URL || "http://localhost:5173",
  nodeEnv: import.meta.env.VITE_NODE_ENV || import.meta.env.MODE || "development",
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Legacy support - for backward compatibility
export const commonData = {
  APIKEY: config.apiBaseUrl,
  BASEURL: config.baseUrl,
};

export default config;

