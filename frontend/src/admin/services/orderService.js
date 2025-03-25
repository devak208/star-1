import axios from './axios';

const orderService = {
  // Get all orders
  getAllOrders: async () => {
    const response = await axios.get('/admin/orders');
    return response.data;
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    const response = await axios.get(`/admin/orders/${orderId}`);
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    const response = await axios.patch(`/admin/orders/${orderId}/status`, { status });
    return response.data;
  },

  // Get order statistics
  getOrderStats: async () => {
    const response = await axios.get('/admin/orders/stats');
    return response.data;
  },

  // Get recent orders
  getRecentOrders: async (limit = 5) => {
    const response = await axios.get(`/admin/orders/recent?limit=${limit}`);
    return response.data;
  }
};

export default orderService; 