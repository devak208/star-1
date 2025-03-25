import axios from "axios";
import { clearAuthData } from "./tokenService";

// API URL
const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

const authService = {
  // Login with email and password
  login: async (credentials) => {
    try {
      const loginData = credentials.user 
        ? { email: credentials.user.email, password: credentials.password || '' }
        : { email: credentials.email, password: credentials.password };
      
      console.log('Sending login data:', { ...loginData, password: '****' });
      
      const response = await instance.post('/auth/signin', loginData);
      
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      localStorage.removeItem('user');
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await instance.post('/auth/register', userData);
      
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Logout user
  logout: async () => {
    try {
      await instance.post('/auth/signout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('adminData');
    }
  },

  // Get current user profile
  getCurrentUser: async () => {
    try {
      const response = await instance.get('/user/profile');
      const user = response.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('adminData');
      }
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await instance.put('/user/profile', userData);
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await axios.put(`${API_URL}/user/change-password`, passwordData, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user') || '{}').accessToken || ''}`
        }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        clearAuthData();
      }
      throw error.response?.data || { message: 'Failed to change password' };
    }
  },

  // Address management
  addAddress: async (addressData) => {
    try {
      const response = await axios.post(`${API_URL}/user/addresses`, addressData, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user') || '{}').accessToken || ''}`
        }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        clearAuthData();
      }
      throw error.response?.data || { message: "Failed to add address" };
    }
  },

  updateAddress: async (addressId, addressData) => {
    try {
      const response = await axios.put(`${API_URL}/user/addresses/${addressId}`, addressData, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user') || '{}').accessToken || ''}`
        }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        clearAuthData();
      }
      throw error.response?.data || { message: "Failed to update address" };
    }
  },

  deleteAddress: async (addressId) => {
    try {
      const response = await axios.delete(`${API_URL}/user/addresses/${addressId}`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user') || '{}').accessToken || ''}`
        }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        clearAuthData();
      }
      throw error.response?.data || { message: "Failed to delete address" };
    }
  },

  setDefaultAddress: async (addressId) => {
    try {
      const response = await axios.patch(`${API_URL}/user/addresses/${addressId}/default`, {}, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user') || '{}').accessToken || ''}`
        }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        clearAuthData();
      }
      throw error.response?.data || { message: "Failed to set default address" };
    }
  },

  // Get orders
  getOrders: async () => {
    try {
      const response = await axios.get(`${API_URL}/user/orders`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user') || '{}').accessToken || ''}`
        }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        clearAuthData();
      }
      throw error.response?.data || { message: 'Failed to get orders' };
    }
  },
  
  // Explicitly refresh token
  refreshToken: async () => {
    try {
      const refreshToken = JSON.parse(localStorage.getItem('user') || '{}').refreshToken;
      const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken }, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      clearAuthData();
      throw error.response?.data || { message: 'Failed to refresh token' };
    }
  }
};

export default authService; 