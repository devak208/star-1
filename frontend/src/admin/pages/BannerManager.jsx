"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import AdminLayout from "../components/AdminLayout"
import PageHeader from "../components/PageHeader"
import EmptyState from "../components/EmptyState"
import DeleteConfirmationModal from "../components/DeleteConfirmationModal"

export default function BannerManager() {
  const [banners, setBanners] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [originalImage, setOriginalImage] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [bannerToEdit, setBannerToEdit] = useState(null)
  const [bannerToDelete, setBannerToDelete] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    link: "",
    image: null,
    imagePreview: null,
  })

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/banners`)
      setBanners(response.data || [])
    } catch (error) {
      console.error("Error fetching banners:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file),
      })
    }
  }

  const handleAddClick = () => {
    setFormData({
      title: "",
      link: "",
      image: null,
      imagePreview: null,
    })
    setIsAddModalOpen(true)
  }

  const handleEditClick = (banner) => {
    setBannerToEdit(banner);
    setOriginalImage(banner.image); // Store the original image URL or filename
    setFormData({
      title: banner.title || "",
      link: banner.link || "",
      image: null, // no new image selected yet
      imagePreview: banner.image || null,
    });
    setIsEditModalOpen(true);
  };
  

  const handleDeleteClick = (banner) => {
    setBannerToDelete(banner)
    setDeleteModalOpen(true)
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("title", formData.title)
      formDataToSend.append("link", formData.link)
      if (formData.image) {
        formDataToSend.append("image", formData.image)
      }

      await axios.post(`${import.meta.env.VITE_API_URL}/api/banners`, formDataToSend)
      setIsAddModalOpen(false)
      fetchBanners()
    } catch (error) {
      console.error("Error adding banner:", error)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("link", formData.link);
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      } else if (originalImage) {
        formDataToSend.append("image", originalImage);
      }
  
      await axios.put(`${import.meta.env.VITE_API_URL}/api/banners/${bannerToEdit.id}`, formDataToSend);
      setIsEditModalOpen(false);
      fetchBanners();
    } catch (error) {
      console.error("Error updating banner:", error);
    }
  };
  
  

  const handleDeleteConfirm = async () => {
    if (!bannerToDelete) return

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/banners/${bannerToDelete.id}`)
      setBanners(banners.filter((b) => b.id !== bannerToDelete.id))
      setDeleteModalOpen(false)
      setBannerToDelete(null)
    } catch (error) {
      console.error("Error deleting banner:", error)
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Banners"
        actions={
          <button
            onClick={handleAddClick}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="-ml-1 mr-2 h-5 w-5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Banner
          </button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
              <div className="h-64 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : banners.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {banners.map((banner) => (
            <div key={banner.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="relative">
                <img
                  src={banner.image || "/placeholder.svg?height=400&width=1200"}
                  alt={banner.title}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg?height=400&width=1200"
                  }}
                />
              </div>
              <div className="p-4 flex justify-end space-x-2">
                <button onClick={() => handleEditClick(banner)} className="text-gray-600 hover:text-gray-900">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </button>
                <button onClick={() => handleDeleteClick(banner)} className="text-red-600 hover:text-red-900">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No banners found"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          }
          action={
            <button
              onClick={handleAddClick}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="-ml-1 mr-2 h-5 w-5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Banner
            </button>
          }
        />
      )}

      {/* Add Banner Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAddSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Add Banner</h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Banner Title
                          </label>
                          <input
                            type="text"
                            name="title"
                            id="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="link" className="block text-sm font-medium text-gray-700">
                            Link URL
                          </label>
                          <input
                            type="url"
                            name="link"
                            id="link"
                            value={formData.link}
                            onChange={handleInputChange}
                            placeholder="https://example.com/page"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                            Banner Image
                          </label>
                          <div className="mt-1 flex items-center">
                            <input
                              type="file"
                              name="image"
                              id="image"
                              accept="image/*"
                              onChange={handleImageChange}
                              required
                              className="sr-only"
                            />
                            <label
                              htmlFor="image"
                              className="relative cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                              <span>Upload a file</span>
                            </label>
                            <span className="ml-2 text-sm text-gray-500">
                              {formData.image ? formData.image.name : "No file chosen"}
                            </span>
                          </div>
                        </div>
                        {formData.imagePreview && (
                          <div className="mt-2">
                            <img
                              src={formData.imagePreview || "/placeholder.svg"}
                              alt="Preview"
                              className="h-40 w-full object-cover rounded-md"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-900 text-base font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Banner Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleEditSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Banner</h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">
                            Banner Title
                          </label>
                          <input
                            type="text"
                            name="title"
                            id="edit-title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="edit-link" className="block text-sm font-medium text-gray-700">
                            Link URL
                          </label>
                          <input
                            type="url"
                            name="link"
                            id="edit-link"
                            value={formData.link}
                            onChange={handleInputChange}
                            placeholder="https://example.com/page"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="edit-image" className="block text-sm font-medium text-gray-700">
                            Banner Image
                          </label>
                          <div className="mt-1 flex items-center">
                            <input
                              type="file"
                              name="image"
                              id="edit-image"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="sr-only"
                            />
                            <label
                              htmlFor="edit-image"
                              className="relative cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                              <span>Change image</span>
                            </label>
                            <span className="ml-2 text-sm text-gray-500">
                              {formData.image ? formData.image.name : "Keep current image"}
                            </span>
                          </div>
                        </div>
                        {formData.imagePreview && (
                          <div className="mt-2">
                            <img
                              src={formData.imagePreview || "/placeholder.svg"}
                              alt="Preview"
                              className="h-40 w-full object-cover rounded-md"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-900 text-base font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Banner"
        message={`Are you sure you want to delete "${bannerToDelete?.title}"? This action cannot be undone.`}
      />
    </AdminLayout>
  )
}
