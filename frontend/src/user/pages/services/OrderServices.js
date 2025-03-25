import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const orderService = {
  // Create a new order
  createOrder: async (orderData) => {
    const response = await axios.post(`${API_URL}/api/orders`, orderData);
    return response.data;
  },

  // Get all orders for the current user
  getOrders: async () => {
    const response = await axios.get(`${API_URL}/api/orders`);
    return response.data;
  },

  // Get order details by ID
  getOrderById: async (orderId) => {
    const response = await axios.get(`${API_URL}/api/orders/${orderId}`);
    return response.data;
  },

  // Cancel an order
  cancelOrder: async (orderId) => {
    const response = await axios.put(`${API_URL}/api/orders/${orderId}/cancel`);
    return response.data;
  },

  // Track order status
  trackOrder: async (orderId) => {
    const response = await axios.get(`${API_URL}/api/orders/${orderId}/track`);
    return response.data;
  },
};

export default orderService;