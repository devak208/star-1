import axios from './axios';

const categoryService = {
  // Get all categories
  getAllCategories: async () => {
    const response = await axios.get('/admin/categories');
    return response.data;
  },

  // Get category by ID
  getCategoryById: async (categoryId) => {
    const response = await axios.get(`/admin/categories/${categoryId}`);
    return response.data;
  },

  // Create new category
  createCategory: async (categoryData) => {
    const response = await axios.post('/admin/categories', categoryData);
    return response.data;
  },

  // Update category
  updateCategory: async (categoryId, categoryData) => {
    const response = await axios.put(`/admin/categories/${categoryId}`, categoryData);
    return response.data;
  },

  // Delete category
  deleteCategory: async (categoryId) => {
    const response = await axios.delete(`/admin/categories/${categoryId}`);
    return response.data;
  },

  // Upload category image
  uploadCategoryImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await axios.post('/admin/categories/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get category statistics
  getCategoryStats: async () => {
    const response = await axios.get('/admin/categories/stats');
    return response.data;
  },

  // Get products by category
  getProductsByCategory: async (categoryId) => {
    const response = await axios.get(`/admin/categories/${categoryId}/products`);
    return response.data;
  }
};

export default categoryService; 