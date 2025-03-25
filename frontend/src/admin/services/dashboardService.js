import axios from './axios';

const dashboardService = {
  // Get dashboard overview
  getOverview: async () => {
    const response = await axios.get('/admin/dashboard/overview');
    return response.data;
  },

  // Get sales statistics
  getSalesStats: async (period = 'month') => {
    const response = await axios.get(`/admin/dashboard/sales?period=${period}`);
    return response.data;
  },

  // Get top products
  getTopProducts: async (limit = 5) => {
    const response = await axios.get(`/admin/dashboard/top-products?limit=${limit}`);
    return response.data;
  },

  // Get recent orders
  getRecentOrders: async (limit = 5) => {
    const response = await axios.get(`/admin/dashboard/recent-orders?limit=${limit}`);
    return response.data;
  },

  // Get low stock alerts
  getLowStockAlerts: async (threshold = 10) => {
    const response = await axios.get(`/admin/dashboard/low-stock?threshold=${threshold}`);
    return response.data;
  },

  // Get user statistics
  getUserStats: async () => {
    const response = await axios.get('/admin/dashboard/user-stats');
    return response.data;
  },

  // Get category statistics
  getCategoryStats: async () => {
    const response = await axios.get('/admin/dashboard/category-stats');
    return response.data;
  },

  // Get revenue statistics
  getRevenueStats: async (period = 'month') => {
    const response = await axios.get(`/admin/dashboard/revenue?period=${period}`);
    return response.data;
  }
};

export default dashboardService; 