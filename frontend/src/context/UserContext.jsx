import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import authService from '../user/services/authService';
import cartService from '../user/services/cartService';
import { useAdmin } from './AdminContext';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { login: adminLogin } = useAdmin();

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Check authentication status
  const checkAuth = async () => {
    setLoading(true);
    try {
      // Check if we have user data in localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        // If user is admin, sync with admin context
        if (userData.role === "ADMIN") {
          adminLogin(userData);
        }
        // Fetch cart data if user is authenticated
        fetchCart();
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile from server
  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      console.log('Fetching user profile from server');
      const userData = await authService.getCurrentUser();
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
      }
      return userData;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // If token is invalid or expired, logout
      if (error.status === 401 || error.message?.includes('token')) {
        toast.error('Your session has expired. Please login again.');
        logout();
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fetch cart data
  const fetchCart = async () => {
    if (!isAuthenticated) return null;
    
    // Use a cached version first if available
    const cachedCart = localStorage.getItem('cachedCart');
    if (cachedCart) {
      try {
        const parsedCart = JSON.parse(cachedCart);
        // Set the cached data first for immediate UI update
        setCart({
          ...parsedCart,
          items: parsedCart.items || [],
          total: parsedCart.total || 0,
          isStale: true // Mark as stale to indicate it's from cache
        });
      } catch (error) {
        console.error('Error parsing cached cart:', error);
        // Invalid cache, will continue with network request
      }
    }
    
    try {
      console.log('Fetching fresh cart data');
      const response = await cartService.getCart();
      console.log('Cart data received:', response);
      
      // Handle both response formats: direct cart object or nested cart object
      const cartData = response.cart || response;
      const total = response.total || (cartData.total || 0);
      
      // Set fresh cart data
      const freshCart = {
        ...cartData,
        items: cartData.items || [],
        total: total,
        isStale: false // Mark as fresh data
      };
      
      setCart(freshCart);
      
      // Cache the cart data for potential offline/quick access
      localStorage.setItem('cachedCart', JSON.stringify(freshCart));
      
      return cartData;
    } catch (error) {
      console.error('Error fetching cart:', error);
      
      // Only clear cart data if we don't have cached data already displayed
      if (!cachedCart) {
        setCart({ items: [], total: 0 });
      } else {
        // Mark existing data as stale but keep it
        setCart(prevCart => ({
          ...prevCart,
          isStale: true
        }));
      }
      
      // If token is invalid or expired, logout
      if (error.status === 401 || 
          error.response?.status === 401 || 
          error.message?.includes('token') || 
          error.response?.data?.message?.includes('token')) {
        toast.error('Your session has expired. Please login again.');
        logout();
      }
      
      // Propagate the error so the component can handle it
      throw error;
    }
  };

  // Login
  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await authService.login(credentials);
      
      // Store user data
      const userData = response.user;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);

      // If user is admin, sync with admin context
      if (userData.role === "ADMIN") {
        adminLogin(userData);
        console.log('Admin authentication successful');
      }

      toast.success('Login successful!');
      // Fetch cart data after login
      await fetchCart();
      return response;
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register
  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await authService.register(userData);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      setIsAuthenticated(true);
      toast.success('Registration successful!');
      // Fetch cart data after registration
      await fetchCart();
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    // Clear all auth data
    localStorage.removeItem('user');
    localStorage.removeItem('cachedCart');
    localStorage.removeItem('adminData');
    setUser(null);
    setCart({ items: [], total: 0 });
    setIsAuthenticated(false);
    
    authService.logout();
    toast.success('You have been logged out.');
  };

  // Update cart item quantity
  const updateCartItemQuantity = async (cartItemId, quantity) => {
    try {
      const response = await cartService.updateCartItem(cartItemId, quantity);
      
      // Handle both response formats
      const cartData = response.cart || response;
      const total = response.total || (cartData.total || 0);
      
      setCart({
        ...cartData,
        items: cartData.items || [],
        total: total
      });
      
      toast.success('Cart updated successfully');
      return cartData;
    } catch (error) {
      console.error('Update cart error:', error);
      toast.error(error.message || 'Failed to update cart');
      throw error;
    }
  };

  // Remove from cart
  const removeFromCart = async (cartItemId) => {
    try {
      const response = await cartService.removeFromCart(cartItemId);
      
      // Handle both response formats
      const cartData = response.cart || response;
      const total = response.total || (cartData.total || 0);
      
      setCart({
        ...cartData,
        items: cartData.items || [],
        total: total
      });
      
      toast.success('Item removed from cart');
      return cartData;
    } catch (error) {
      console.error('Remove from cart error:', error);
      toast.error(error.message || 'Failed to remove item from cart');
      throw error;
    }
  };

  // Add to cart
  const addToCart = async (product, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    
    try {
      const productId = typeof product === 'object' ? product.id : product;
      const response = await cartService.addToCart(productId, quantity);
      
      // Handle both response formats
      const cartData = response.cart || response;
      const total = response.total || (cartData.total || 0);
      
      setCart({
        ...cartData,
        items: cartData.items || [],
        total: total
      });
      
      toast.success('Item added to cart');
      return cartData;
    } catch (error) {
      console.error('Add to cart error:', error);
      // If token is invalid or expired, logout
      if (error.status === 401 || error.message?.includes('token')) {
        toast.error('Your session has expired. Please login again.');
        logout();
        navigate('/login');
      } else {
        toast.error(error.message || 'Failed to add item to cart');
      }
      throw error;
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      const response = await cartService.clearCart();
      
      // Handle both response formats
      const cartData = response.cart || response;
      
      setCart({
        ...cartData,
        items: cartData.items || [],
        total: cartData.total || 0
      });
      
      toast.success('Cart cleared');
      return cartData;
    } catch (error) {
      console.error('Clear cart error:', error);
      toast.error(error.message || 'Failed to clear cart');
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      cart,
      loading,
      isAuthenticated,
      login,
      logout,
      register,
      fetchUserProfile,
      fetchCart,
      updateCartItemQuantity,
      removeFromCart,
      addToCart,
      clearCart
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;