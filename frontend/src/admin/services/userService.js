import axios from './axios';

const userService = {
  // Get all users
  getAllUsers: async () => {
    const response = await axios.get('/admin/users');
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await axios.get(`/admin/users/${userId}`);
    return response.data;
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    const response = await axios.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  // Get user statistics
  getUserStats: async () => {
    const response = await axios.get('/admin/users/stats');
    return response.data;
  },

  // Get recent users
  getRecentUsers: async (limit = 5) => {
    const response = await axios.get(`/admin/users/recent?limit=${limit}`);
    return response.data;
  },

  // Search users
  searchUsers: async (query) => {
    const response = await axios.get(`/admin/users/search?q=${query}`);
    return response.data;
  },

  // Filter users by role
  filterUsersByRole: async (role) => {
    const response = await axios.get(`/admin/users/filter?role=${role}`);
    return response.data;
  }
};

export default userService; 