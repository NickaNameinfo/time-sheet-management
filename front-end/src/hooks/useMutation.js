import { useState } from "react";
import { apiService } from "../services/api";

/**
 * Custom hook for handling API mutations (POST, PUT, DELETE)
 * @param {Function} mutationFn - The API function to call
 * @returns {Object} - { mutate, loading, error }
 */
export const useMutation = (mutationFn) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (data) => {
    setLoading(true);
    setError(null);

    try {
      const response = await mutationFn(data);
      return {
        success: true,
        data: response.data?.Result || response.data,
        message: response.data?.Message || "Operation successful",
      };
    } catch (err) {
      const errorMessage = err.response?.data?.Error || err.message || "An error occurred";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
};

export default useMutation;

