/**
 * Format date to display format
 */
export const formatDate = (date, format = "YYYY-MM-DD") => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString();
};

/**
 * Format date and time
 */
export const formatDateTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleString();
};

/**
 * Get error message from API response
 */
export const getErrorMessage = (error) => {
  if (typeof error === "string") return error;
  if (error?.response?.data?.Error) return error.response.data.Error;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.message) return error.message;
  return "An error occurred";
};

/**
 * Check if user has required role
 */
export const hasRole = (userRoles, requiredRole) => {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return userRoles.includes(requiredRole);
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};

/**
 * Validate email
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Get image URL
 * Constructs the full URL for an image stored in the backend
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  // If already a full URL, return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  // If it's a data URL (base64), return as is
  if (imagePath.startsWith("data:")) {
    return imagePath;
  }
  // Get API base URL from environment or use default
  // Use the same default as frontend config (8000) but user should set VITE_API_BASE_URL
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  // Remove any leading slashes from imagePath to avoid double slashes
  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  // Construct full URL: http://localhost:8081/images/employeeImage_xxx.jpg
  return `${apiBaseUrl}/images/${cleanPath}`;
};

