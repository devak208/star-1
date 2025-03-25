import axiosInstance from "../../../user/services/axios";

const cartService = {
  // Get cart
  getCart: async () => {
    try {
      const response = await axiosInstance.get("/api/cart");
      return response.data;
    } catch (error) {
      console.error('Get cart error:', error);
      throw error.response?.data || { error: "Failed to get cart" };
    }
  },

  // Update cart item
  updateCartItem: async (cartItemId, quantity) => {
    try {
      if (!cartItemId) {
        throw new Error('Cart item ID is required');
      }
      
      // Make sure cartItemId is a string or number, not an object
      if (typeof cartItemId === 'object') {
        console.error('Invalid cartItemId format:', cartItemId);
        if (cartItemId.id) {
          cartItemId = cartItemId.id;
        } else {
          throw new Error('Invalid cart item ID format');
        }
      }
      
      const response = await axiosInstance.put(`/api/cart/item/${cartItemId}`, {
        quantity
      });
      // Return the complete cart data
      return response.data;
    } catch (error) {
      console.error('Update cart item error:', error);
      throw error.response?.data || { error: "Failed to update cart item" };
    }
  },

  // Remove from cart
  removeFromCart: async (cartItemId) => {
    try {
      if (!cartItemId) {
        throw new Error('Cart item ID is required');
      }
      
      // Make sure cartItemId is a string or number, not an object
      if (typeof cartItemId === 'object') {
        console.error('Invalid cartItemId format:', cartItemId);
        if (cartItemId.id) {
          cartItemId = cartItemId.id;
        } else {
          throw new Error('Invalid cart item ID format');
        }
      }
      
      const response = await axiosInstance.delete(`/api/cart/item/${cartItemId}`);
      console.log("Remove from cart response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Remove from cart error:', error);
      throw error.response?.data || { error: "Failed to remove item from cart" };
    }
  },

  // Add to cart
  addToCart: async (productId, quantity) => {
    try {
      if (!productId) {
        throw new Error('Product ID is required');
      }
      
      const response = await axiosInstance.post("/api/cart/add", { 
        productId, 
        quantity 
      });
      return response.data;
    } catch (error) {
      console.error('Add to cart error:', error);
      throw error.response?.data || { error: "Failed to add item to cart" };
    }
  },

  // Clear cart
  clearCart: async () => {
    try {
      const response = await axiosInstance.delete("/api/cart/clear");
      return response.data;
    } catch (error) {
      console.error('Clear cart error:', error);
      throw error.response?.data || { error: "Failed to clear cart" };
    }
  },
};

export default cartService;