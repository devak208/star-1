import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://192.168.147.81:5000"

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh for auth endpoints and if request is already retried
    if (originalRequest.url.includes('/auth/') || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Only attempt token refresh for protected routes
    const protectedRoutes = ['/user/profile', '/cart', '/orders'];
    const isProtectedRoute = protectedRoutes.some(route => originalRequest.url.includes(route));

    // If error is 401 and we haven't tried to refresh token yet and it's a protected route
    if (error.response?.status === 401 && !originalRequest._retry && isProtectedRoute) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        await axiosInstance.post('/auth/refresh-token');
        
        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Clear user data but don't redirect
        localStorage.removeItem('user');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth service methods
const authService = {
  // Login with email and password
  login: async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/signin', { email, password });
      const user = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await axiosInstance.post('/auth/register', userData);
      const user = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout');
      localStorage.removeItem('user');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Get current user profile
  getCurrentUser: async () => {
    try {
      // Always fetch fresh user data from server
      const response = await axiosInstance.get('/user/profile');
      const user = response.data;
      
      // Store the complete user data in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      // Clear stored user if server request fails
      localStorage.removeItem('user');
      throw error;
    }
  },
  
  // Refresh the access token
  refreshToken: async () => {
    const response = await axiosInstance.post("/auth/refresh-token", {});
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await axiosInstance.put("/user/profile", userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to update profile" };
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await axiosInstance.put("/user/change-password", passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to change password" };
    }
  },

  // Update address
  updateAddress: async (addressData) => {
    try {
      const response = await axiosInstance.put("/user/address", addressData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to update address" };
    }
  },

  // Get order history
  getOrders: async () => {
    try {
      const response = await axiosInstance.get("/api/orders");
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to get orders" };
    }
  }
}

export default authService;
export { axiosInstance };


  
  
