import axios from './axios';

const productService = {
  // Get all products
  getAllProducts: async () => {
    const response = await axios.get('/admin/products');
    return response.data;
  },

  // Get product by ID
  getProductById: async (productId) => {
    const response = await axios.get(`/admin/products/${productId}`);
    return response.data;
  },

  // Create new product
  createProduct: async (productData) => {
    const response = await axios.post('/admin/products', productData);
    return response.data;
  },

  // Update product
  updateProduct: async (productId, productData) => {
    const response = await axios.put(`/admin/products/${productId}`, productData);
    return response.data;
  },

  // Delete product
  deleteProduct: async (productId) => {
    const response = await axios.delete(`/admin/products/${productId}`);
    return response.data;
  },

  // Upload product image
  uploadProductImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await axios.post('/admin/products/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get product statistics
  getProductStats: async () => {
    const response = await axios.get('/admin/products/stats');
    return response.data;
  },

  // Get low stock products
  getLowStockProducts: async (threshold = 10) => {
    const response = await axios.get(`/admin/products/low-stock?threshold=${threshold}`);
    return response.data;
  }
};

export default productService; 