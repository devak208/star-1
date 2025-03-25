import axios from "axios";
import { getAccessToken, getRefreshToken, setAuthTokens, clearAuthData } from "./tokenService";

// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL;

console.log('API URL:', API_URL);

// Track ongoing token refresh
let isRefreshing = false;
let refreshSubscribers = [];

// List of protected routes that should trigger refresh attempts
const protectedRoutes = [
  "/api/orders",
  "/api/cart",
  "/user/profile",
  "/api/products",
  "/api/categories",
  "/api/auth/refresh",
];

// Keep track of in-flight requests to prevent duplicates
const pendingRequests = new Map();

// Create regular axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 300000, // Extend timeout to 5 minutes (300000ms)
  withCredentials: true, // Always include credentials
  headers: {
    'Content-Type': 'application/json',
  }
});

// Create dedicated instance for file uploads with extended timeout
export const uploadAxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 600000, // 10 minutes timeout for file uploads
  withCredentials: true,
  headers: {
    'Content-Type': 'multipart/form-data',
  }
});

// Function to subscribe to token refresh
const subscribeToTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Function to notify subscribers when token is refreshed
const onTokenRefreshed = (error, newToken) => {
  refreshSubscribers.forEach((callback) => callback(error, newToken));
  refreshSubscribers = [];
};

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    // Log outgoing requests
    console.log(
      `🚀 Request: ${config.method.toUpperCase()} ${config.url}`,
      config.data ? config.data : ""
    );

    // Skip deduplication for authentication endpoints and retried requests
    const shouldSkipDeduplication = 
      config.url.includes("/api/auth/") || 
      config.skipDuplicateCheck === true;

    // If not an auth endpoint, check for duplicate requests
    if (!shouldSkipDeduplication) {
      const requestId = `${config.method}:${config.url}:${JSON.stringify(config.data)}`;
      
      if (pendingRequests.has(requestId)) {
        const cancelSource = axios.CancelToken.source();
        config.cancelToken = cancelSource.token;
        
        console.log(`🔄 Cancelling duplicate request: ${requestId}`);
        cancelSource.cancel(`Duplicate request cancelled for ${requestId}`);
      } else {
        // Add request to pending requests
        const cancelSource = axios.CancelToken.source();
        config.cancelToken = cancelSource.token;
        pendingRequests.set(requestId, cancelSource);
        
        // Remove from pending requests when completed
        config.complete = () => pendingRequests.delete(requestId);
      }
    }

    // Add auth header if token exists
    const token = getAccessToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(
      `✅ Response: ${response.status} ${response.config.method.toUpperCase()} ${
        response.config.url
      }`
    );
    
    // Clean up pending request tracking
    if (response.config.complete) {
      response.config.complete();
    }

    return response;
  },
  async (error) => {
    // Get the original request config
    const originalRequest = error.config;
    
    // Clean up pending request tracking
    if (originalRequest && originalRequest.complete) {
      originalRequest.complete();
    }

    // Log error responses if we have them
    if (error.response) {
      console.log(
        `❌ Response Error: ${error.response.status} ${
          originalRequest?.method?.toUpperCase() || "UNKNOWN"
        } ${originalRequest?.url || "UNKNOWN"} - ${
          error.response.data?.message || error.message
        }`
      );
    } else if (error.request) {
      // The request was made but no response was received
      console.log("❌ No response received from server", error.request);
      return Promise.reject(new Error("No response received from the server. Please check your connection."));
    } else if (axios.isCancel(error)) {
      // Request was cancelled
      console.log("⏱️ Request cancelled:", error.message);
      return Promise.reject(error);
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      console.log("⏱️ Request timeout:", error.message);
      return Promise.reject(new Error("Request timeout. Please try again. If this is a file upload, try with a smaller file or better connection."));
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('❌ Request Error:', error.message);
    }

    // Check if the error is due to an expired access token
    const isUnauthorized = error.response?.status === 401;
    const isProtectedRoute = originalRequest && protectedRoutes.some(route => 
      originalRequest.url.includes(route)
    );

    // If unauthorized and this is a protected route - try to refresh the token
    if (isUnauthorized && isProtectedRoute && originalRequest && !originalRequest._retry) {
      // If we're already refreshing, wait for the refresh
      if (isRefreshing) {
        try {
          // Wait for the token refresh to complete
          console.log("🔄 Waiting for token refresh to complete...");
          return new Promise((resolve, reject) => {
            subscribeToTokenRefresh((err, token) => {
              if (err) {
                return reject(err);
              }

              console.log("🔑 Using new token for retry");
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
              originalRequest._retry = true;
              originalRequest.skipDuplicateCheck = true;
              resolve(axiosInstance(originalRequest));
            });
          });
        } catch (refreshError) {
          console.error("❌ Error while waiting for token refresh:", refreshError);
          return Promise.reject(refreshError);
        }
      }

      // If we're not refreshing yet, start the refresh
      try {
        console.log("🔄 Attempting to refresh token...");
        isRefreshing = true;
        originalRequest._retry = true;

        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(
          `${API_URL}/api/auth/refresh`,
          { refreshToken }
        );

        // If refresh successful, update tokens and retry original request
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        console.log("✅ Token refresh successful");
        
        // Save the new tokens
        setAuthTokens(accessToken, newRefreshToken);
        
        // Update auth header and retry
        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
        originalRequest.skipDuplicateCheck = true;
        
        // Notify all waiting requests that token is refreshed
        onTokenRefreshed(null, accessToken);
        
        // Return execution of the original request with new token
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError);
        
        // Notify waiting requests about the error
        onTokenRefreshed(refreshError, null);
        
        // Clear auth data and navigate to login
        console.log("Clearing auth data due to refresh failure");
        clearAuthData();
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For all other errors, just reject the promise
    return Promise.reject(error);
  }
);

// Apply the same interceptors to the upload instance
uploadAxiosInstance.interceptors.request.use(
  axiosInstance.interceptors.request.handlers[0].fulfilled,
  axiosInstance.interceptors.request.handlers[0].rejected
);

uploadAxiosInstance.interceptors.response.use(
  axiosInstance.interceptors.response.handlers[0].fulfilled,
  axiosInstance.interceptors.response.handlers[0].rejected
);

export default axiosInstance; 