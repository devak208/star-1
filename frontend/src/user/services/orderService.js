import axiosInstance from './axios';

const orderService = {
  // Create a new order
  createOrder: async (orderData) => {
    try {
      // Ensure shippingCost is included in the request
      if (!orderData.shippingCost && orderData.shippingCost !== 0) {
        orderData.shippingCost = orderData.shippingTotal || 0;
      }
      
      const response = await axiosInstance.post('/api/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Create order error:', error);
      throw error.response?.data || { error: "Failed to create order" };
    }
  },

  // Get all orders for the current user
  getUserOrders: async () => {
    try {
      // Add skipDuplicateCheck to prevent the request from being canceled
      const response = await axiosInstance.get('/api/orders', {
        skipDuplicateCheck: true
      });
      console.log('Raw orders response:', response); // Debug log
      
      // Force response processing in a synchronous way
      const result = response?.data;
      
      if (Array.isArray(result)) {
        console.log('Returning orders array directly:', result.length);
        return result;
      } else if (result && Array.isArray(result.data)) {
        console.log('Returning nested data array:', result.data.length);
        return result.data;
      } else {
        console.error('Invalid orders response format:', result);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      // Handle axios cancel error gracefully
      if (error.name === 'CanceledError') {
        console.log('Request was canceled');
        throw new Error('The request was cancelled. Please try again.');
      }
      
      console.error('Get user orders error:', error);
      throw error.response?.data?.error || error.message || { error: "Failed to get user orders" };
    }
  },

  // Get single order by ID
  getOrderById: async (orderId) => {
    try {
      const response = await axiosInstance.get(`/api/orders/${orderId}`, {
        skipDuplicateCheck: true
      });
      return response.data;
    } catch (error) {
      console.error('Get order error:', error);
      throw error.response?.data || { error: "Failed to get order" };
    }
  },

  // Update order status (admin only)
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await axiosInstance.patch(`/api/orders/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Update order status error:', error);
      throw error.response?.data || { error: "Failed to update order status" };
    }
  },

  // Get all orders (admin only)
  getAllOrders: async () => {
    try {
      const response = await axiosInstance.get('/api/orders/admin/all', {
        skipDuplicateCheck: true
      });
      return response.data;
    } catch (error) {
      console.error('Get all orders error:', error);
      throw error.response?.data || { error: "Failed to get all orders" };
    }
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    try {
      const response = await axiosInstance.post(`/api/orders/${orderId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Cancel order error:', error);
      throw error.response?.data || { error: "Failed to cancel order" };
    }
  },

  // Get order status
  getOrderStatus: async (orderId) => {
    try {
      const response = await axiosInstance.get(`/api/orders/${orderId}/status`);
      return response.data;
    } catch (error) {
      console.error('Get order status error:', error);
      throw error.response?.data || { error: "Failed to get order status" };
    }
  }
};

export default orderService; 