import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook for API calls with loading and error states
 * @param {Function} apiCall - The API function to call
 * @param {Array} dependencies - Dependencies array for useEffect
 * @param {Boolean} immediate - Whether to call immediately on mount
 * @returns {Object} { data, loading, error, refetch }
 */
export const useApi = (apiCall, dependencies = [], immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isExecutingRef = useRef(false);
  const lastDepsRef = useRef(JSON.stringify(dependencies));
  
  // Store the latest apiCall in a ref to avoid recreating execute on every render
  const apiCallRef = useRef(apiCall);
  apiCallRef.current = apiCall; // Always keep it up to date

  // Only execute when dependencies actually change
  const shouldExecute = useRef(immediate);

  const execute = useCallback(async () => {
    // Prevent multiple simultaneous executions
    if (isExecutingRef.current) {
      return;
    }
    
    isExecutingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      // Use the ref to get the latest apiCall without including it in dependencies
      const response = await apiCallRef.current();
      if (response.data.Status === "Success") {
        setData(response.data.Result || response.data);
      } else {
        setError(response.data.Error || "An error occurred");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.Error ||
        err.response?.data?.error ||
        err.message ||
        "An error occurred";
      
      // Handle rate limiting - don't auto-retry to prevent loops
      if (err.response?.status === 429 || err.rateLimitError) {
        const retryAfter = err.retryAfter || 60;
        setError({
          message: errorMessage,
          isRateLimit: true,
          retryAfter,
        });
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      isExecutingRef.current = false;
    }
  }, []); // Empty deps - execute is stable, uses ref for latest apiCall

  useEffect(() => {
    // Check if dependencies have actually changed
    const currentDeps = JSON.stringify(dependencies);
    const depsChanged = lastDepsRef.current !== currentDeps;
    
    if (immediate && (shouldExecute.current || depsChanged)) {
      lastDepsRef.current = currentDeps;
      shouldExecute.current = false;
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...dependencies]); // Don't include execute to prevent loops

  const refetch = useCallback(() => {
    shouldExecute.current = true;
    execute();
  }, [execute]);

  return { data, loading, error, refetch };
};

/**
 * Custom hook for API mutations (POST, PUT, DELETE)
 * @param {Function} apiCall - The API function to call
 * @returns {Object} { mutate, loading, error, data }
 */
export const useMutation = (apiCall) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(
    async (payload) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiCall(payload);
        if (response.data.Status === "Success") {
          setData(response.data);
          return { success: true, data: response.data };
        } else {
          const errorMsg = response.data.Error || "Operation failed";
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (err) {
        const errorMessage =
          err.response?.data?.Error ||
          err.response?.data?.error ||
          err.message ||
          "An error occurred";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [apiCall]
  );

  return { mutate, loading, error, data };
};

