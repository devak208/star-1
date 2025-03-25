import axiosInstance from "./axios.js";

const cartService = {
  // Get cart
  getCart: async () => {
    try {
      const response = await axiosInstance.get("/api/cart");
      console.log("Cart data retrieved:", response.data);
      return response.data;
    } catch (error) {
      console.error('Get cart error:', error);
      // Format error with additional info to help with debugging
      const formattedError = {
        message: error.response?.data?.message || error.response?.data?.error || error.message || "Failed to get cart",
        status: error.response?.status,
        originalError: error
      };
      throw formattedError;
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
      console.log("Cart item updated:", response.data);
      return response.data;
    } catch (error) {
      console.error('Update cart item error:', error);
      // Format error with additional info to help with debugging
      const formattedError = {
        message: error.response?.data?.message || error.response?.data?.error || error.message || "Failed to update cart item",
        status: error.response?.status,
        originalError: error
      };
      throw formattedError;
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
      console.log("Item removed from cart:", response.data);
      return response.data;
    } catch (error) {
      console.error('Remove from cart error:', error);
      // Format error with additional info to help with debugging
      const formattedError = {
        message: error.response?.data?.message || error.response?.data?.error || error.message || "Failed to remove item from cart",
        status: error.response?.status,
        originalError: error
      };
      throw formattedError;
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
        quantity: quantity || 1
      });
      console.log("Item added to cart:", response.data);
      return response.data;
    } catch (error) {
      console.error('Add to cart error:', error);
      // Format error with additional info to help with debugging
      const formattedError = {
        message: error.response?.data?.message || error.response?.data?.error || error.message || "Failed to add item to cart",
        status: error.response?.status,
        originalError: error
      };
      throw formattedError;
    }
  },

  // Clear cart
  clearCart: async () => {
    try {
      const response = await axiosInstance.delete("/api/cart/clear");
      console.log("Cart cleared:", response.data);
      return response.data;
    } catch (error) {
      console.error('Clear cart error:', error);
      // Format error with additional info to help with debugging
      const formattedError = {
        message: error.response?.data?.message || error.response?.data?.error || error.message || "Failed to clear cart",
        status: error.response?.status,
        originalError: error
      };
      throw formattedError;
    }
  },
};

export default cartService; 