"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import { uploadAxiosInstance } from "../../user/services/axios"
import AdminLayout from "../components/AdminLayout"
import PageHeader from "../components/PageHeader"
import { useToast } from "../components/ToastContext"

// Maximum file size in bytes (1MB)
const MAX_FILE_SIZE = 1 * 1024 * 1024;

export default function ProductFormPage() {
  const { search } = useLocation()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const queryParams = new URLSearchParams(search)
  const id = queryParams.get("id")

  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    stock: "",
    categoryId: "",
    weight: "",
    qty: "",
    images: [],
    imagePreview: [],
    existingImages: [],
    imagesToRemove: [],
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchCategories()
    if (id) {
      fetchProduct(id)
    }
  }, [id])

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories`)
      setCategories(response.data || [])

      // Set default category if adding a new product
      if (!id && response.data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          categoryId: response.data[0].id,
        }))
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      showToast("Failed to load categories", "error")
    }
  }

  const fetchProduct = async (productId) => {
    setIsLoading(true)
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/${productId}`)
      const product = response.data

      // Parse product images if needed
      let productImages = []
      if (product.image) {
        try {
          if (typeof product.image === "string" && product.image.startsWith("[")) {
            productImages = JSON.parse(product.image)
          } else if (typeof product.image === "string") {
            productImages = [product.image]
          } else if (Array.isArray(product.image)) {
            productImages = product.image
          }
        } catch (e) {
          console.error("Error parsing product image:", e)
        }
      }

      setFormData({
        name: product.name || "",
        price: product.price || "",
        description: product.description || "",
        stock: product.stock || "",
        categoryId: product.categoryId || "",
        weight: product.weight || "",
        qty: product.qty || "",
        images: [],
        imagePreview: productImages.map((img) => `${import.meta.env.VITE_API_URL}/uploads/${img}`),
        existingImages: productImages,
        imagesToRemove: [],
      })
    } catch (error) {
      console.error("Error fetching product:", error)
      showToast("Failed to load product details", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({...errors, [name]: null})
    }
  }

  // Function to compress image
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      // If file is already small enough, just return it
      if (file.size <= MAX_FILE_SIZE) {
        resolve(file);
        return;
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          // Calculate scaling factor to target ~800px for the largest dimension
          const maxDimension = 800;
          if (width > height && width > maxDimension) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with reduced quality
          canvas.toBlob(
            (blob) => {
              // Create a new file from the blob
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              
              console.log(`Compressed ${file.name} from ${file.size} to ${compressedFile.size} bytes`);
              resolve(compressedFile);
            }, 
            'image/jpeg', 
            0.7 // Quality parameter (0.7 = 70% quality)
          );
        };
      };
      
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Check if adding these files would exceed the limit
    if (formData.imagePreview.length + files.length > 4) {
      showToast("Maximum 4 images allowed", "error");
      return;
    }
    
    // Validate file sizes and types
    const validFiles = [];
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    for (const file of files) {
      if (!validImageTypes.includes(file.type)) {
        showToast(`${file.name} is not a valid image type`, "error");
        continue;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        showToast(`${file.name} is too large (max 5MB)`, "error");
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length === 0) return;
    
    // Show loading toast for compression
    if (validFiles.length > 0) {
      showToast("Optimizing images...", "info");
    }
    
    try {
      // Compress all images
      const compressedFiles = await Promise.all(
        validFiles.map(file => compressImage(file))
      );
      
      // Create previews
      const newImagePreviews = compressedFiles.map(file => URL.createObjectURL(file));
      
      setFormData({
        ...formData,
        images: [...formData.images, ...compressedFiles],
        imagePreview: [...formData.imagePreview, ...newImagePreviews],
      });
      
      showToast(`${compressedFiles.length} image(s) optimized and ready to upload`, "success");
    } catch (error) {
      console.error("Error processing images:", error);
      showToast("Error processing images", "error");
    }
  }

  const handleRemoveImage = (index) => {
    // If this is an existing image in edit mode
    if (id && index < (formData.existingImages?.length || 0)) {
      const imagesToRemove = [...(formData.imagesToRemove || [])]
      imagesToRemove.push(formData.existingImages[index])

      const newExistingImages = [...formData.existingImages]
      newExistingImages.splice(index, 1)

      const newImagePreview = [...formData.imagePreview]
      newImagePreview.splice(index, 1)

      setFormData({
        ...formData,
        existingImages: newExistingImages,
        imagePreview: newImagePreview,
        imagesToRemove,
      })
    } else {
      // This is a newly added image
      const newIndex = id ? index - (formData.existingImages?.length || 0) : index

      const newImages = [...formData.images]
      newImages.splice(newIndex, 1)

      const newImagePreview = [...formData.imagePreview]
      newImagePreview.splice(index, 1)

      setFormData({
        ...formData,
        images: newImages,
        imagePreview: newImagePreview,
      })
    }
  }

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = "Valid price is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.stock || parseInt(formData.stock) < 0) newErrors.stock = "Valid stock is required";
    if (!formData.categoryId) newErrors.categoryId = "Category is required";
    
    if (!id && formData.imagePreview.length === 0) {
      newErrors.images = "At least one image is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast("Please fix the form errors", "error");
      return;
    }
    
    setIsLoading(true);
    setUploadProgress(0);

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("stock", formData.stock);
    formDataToSend.append("categoryId", formData.categoryId);
    formDataToSend.append("weight", formData.weight || 0);
    formDataToSend.append("qty", formData.qty || 0);

    // Append each image file
    formData.images.forEach((image) => {
      formDataToSend.append("image", image);
    });

    // If editing, include the list of images to remove
    if (id && formData.imagesToRemove && formData.imagesToRemove.length > 0) {
      formDataToSend.append("imagesToRemove", JSON.stringify(formData.imagesToRemove));
    }

    try {
      if (id) {
        // Update existing product
        await uploadAxiosInstance.put(`/api/products/${id}`, formDataToSend, {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });
        showToast("Product updated successfully", "success");
      } else {
        // Create new product
        await uploadAxiosInstance.post("/api/products", formDataToSend, {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });
        showToast("Product created successfully", "success");
      }

      // Navigate back to products list
      navigate("/admin/products");
    } catch (error) {
      console.error("Error saving product:", error);
      showToast(error.response?.data?.message || "Failed to save product", "error");
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        title={id ? "Edit Product" : "Add Product"}
        description={id ? "Update product details" : "Create a new product"}
        actions={
          <button
            onClick={() => navigate("/admin/products")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="-ml-1 mr-2 h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Products
          </button>
        }
      />

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Product Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`mt-1 block w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                name="categoryId"
                id="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className={`mt-1 block w-full border ${errors.categoryId ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500`}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-sm text-red-500">{errors.categoryId}</p>}
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Price
              </label>
              <input
                type="number"
                name="price"
                id="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                className={`mt-1 block w-full border ${errors.price ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500`}
              />
              {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
            </div>

            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                Stock
              </label>
              <input
                type="number"
                name="stock"
                id="stock"
                min="0"
                value={formData.stock}
                onChange={handleInputChange}
                className={`mt-1 block w-full border ${errors.stock ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500`}
              />
              {errors.stock && <p className="mt-1 text-sm text-red-500">{errors.stock}</p>}
            </div>

            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                Weight (kg)
              </label>
              <input
                type="number"
                name="weight"
                id="weight"
                min="0"
                step="0.01"
                value={formData.weight}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
              />
            </div>

            <div>
              <label htmlFor="qty" className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <input
                type="number"
                name="qty"
                id="qty"
                min="0"
                value={formData.qty}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows="4"
              value={formData.description}
              onChange={handleInputChange}
              className={`mt-1 block w-full border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500`}
            ></textarea>
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
          </div>

          <div>
            <label htmlFor="images" className="block text-sm font-medium text-gray-700">
              Product Images (up to 4)
            </label>
            <div className="mt-1 flex items-center">
              <input
                type="file"
                name="images"
                id="images"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                onChange={handleImageChange}
                className="sr-only"
                disabled={formData.imagePreview.length >= 4}
              />
              <label
                htmlFor="images"
                className={`relative cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                  formData.imagePreview.length >= 4 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <span>{id ? "Change images" : "Upload images"}</span>
              </label>
              <span className="ml-2 text-sm text-gray-500">
                {formData.imagePreview.length >= 4
                  ? "Maximum 4 images allowed"
                  : formData.images.length > 0
                  ? `${formData.images.length} new image(s) selected`
                  : id
                  ? formData.imagePreview.length > 0
                    ? `${formData.imagePreview.length} existing image(s)`
                    : "No images"
                  : "No images selected"}
              </span>
            </div>
            {errors.images && <p className="mt-1 text-sm text-red-500">{errors.images}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Maximum file size: 5MB. Recommended size: 800x800px. Files will be automatically optimized.
            </p>
          </div>

          {formData.imagePreview.length > 0 && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Image Preview (click to remove)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.imagePreview.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview || "/placeholder.svg"}
                      alt={`Preview ${index + 1}`}
                      className="h-40 w-full object-cover rounded-md border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-gray-800 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <p className="text-sm text-gray-600 mt-1">Uploading: {uploadProgress}%</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center"
            >
              {isLoading && (
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {id ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
