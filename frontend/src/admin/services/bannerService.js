import axios from './axios';

const bannerService = {
  // Get all banners
  getAllBanners: async () => {
    const response = await axios.get('/admin/banners');
    return response.data;
  },

  // Get banner by ID
  getBannerById: async (bannerId) => {
    const response = await axios.get(`/admin/banners/${bannerId}`);
    return response.data;
  },

  // Create new banner
  createBanner: async (bannerData) => {
    const response = await axios.post('/admin/banners', bannerData);
    return response.data;
  },

  // Update banner
  updateBanner: async (bannerId, bannerData) => {
    const response = await axios.put(`/admin/banners/${bannerId}`, bannerData);
    return response.data;
  },

  // Delete banner
  deleteBanner: async (bannerId) => {
    const response = await axios.delete(`/admin/banners/${bannerId}`);
    return response.data;
  },

  // Upload banner image
  uploadBannerImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await axios.post('/admin/banners/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update banner status (active/inactive)
  updateBannerStatus: async (bannerId, isActive) => {
    const response = await axios.patch(`/admin/banners/${bannerId}/status`, { isActive });
    return response.data;
  },

  // Get active banners
  getActiveBanners: async () => {
    const response = await axios.get('/admin/banners/active');
    return response.data;
  }
};

export default bannerService; 