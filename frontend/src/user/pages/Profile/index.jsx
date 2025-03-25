"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import authService from "../../services/authService"
import { User, Phone, MapPin, Lock, ShoppingBag, Edit, X, LogOut, RefreshCw } from "lucide-react"
import { useUser } from "../../../context/UserContext"
import { toast } from "react-hot-toast"

export default function Profile() {
  const { user, loading: userLoading, fetchUserProfile, fetchCart, logout } = useUser()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("personal-info")
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    }
  })

  // Load profile data only when component mounts
  useEffect(() => {
    const loadProfile = async () => {
      // Skip if already loading
      if (loading || userLoading) {
        return;
      }
      
      try {
        setLoading(true)
        console.log("Profile page visited - requesting user profile from server...")
        
        await fetchUserProfile()
        console.log("Profile loaded successfully")
      } catch (error) {
        console.error('Error loading profile:', error)
        if (error?.error?.includes('Invalid or expired refresh token') || 
            error?.message?.includes('Session expired')) {
          toast.error('Session expired. Please log in again.')
          localStorage.removeItem('user')
          setTimeout(() => {
            navigate("/login")
          }, 1000)
        } else {
          toast.error('Failed to load profile data')
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
    
    // Optional: Load cart data separately if needed
    const loadCart = async () => {
      if (user) {
        try {
          await fetchCart()
        } catch (error) {
          console.error('Error loading cart:', error)
        }
      }
    }
    
    loadCart()
  }, []) // Only run on mount

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          state: user.address?.state || "",
          zipCode: user.address?.zipCode || "",
          country: user.address?.country || ""
        }
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const refreshProfile = async () => {
    try {
      setLoading(true)
      await fetchUserProfile()
      toast.success("Profile refreshed successfully")
    } catch (error) {
      console.error("Profile refresh error:", error)
      toast.error("Failed to refresh profile")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data) => {
    setLoading(true)
    try {
      const result = await authService.updateProfile(data)
      await fetchUserProfile() // Refresh user data after update
      setIsEditing(false)
      toast.success("Profile updated successfully")
      return result
    } catch (error) {
      console.error("Profile update error:", error)
      if (error?.error?.includes('Invalid or expired refresh token')) {
        toast.error('Session expired. Please log in again.')
        localStorage.removeItem('user')
        setTimeout(() => {
          navigate("/login")
        }, 1000)
      } else {
        toast.error(error.message || "Failed to update profile")
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleUserLogout = async () => {
    setLoading(true)
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.log("Logout failed, redirecting anyway:", error)
      navigate("/login")
    } finally {
      setLoading(false)
    }
  }

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-semibold mb-4">Please login to view your profile</h2>
        <button
          onClick={() => navigate("/login")}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Go to Login
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 py-8 min-h-[80vh]">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-semibold text-gray-700">
                {user.profileImage ? (
                  <img
                    src={user.profileImage || "/placeholder.svg"}
                    alt={user.name || "User"}
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  user.name ? user.name.charAt(0).toUpperCase() : "?"
                )}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{user.name || "User"}</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshProfile}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              {activeTab === "personal-info" && (
                <div>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Profile
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={handleUserLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <nav className="flex flex-col">
                <button
                  onClick={() => setActiveTab("personal-info")}
                  className={`px-4 py-3 text-left text-sm font-medium flex items-center ${
                    activeTab === "personal-info"
                      ? "bg-gray-50 text-gray-900 border-l-4 border-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <User className="h-4 w-4 mr-2" />
                  Personal Information
                </button>
                <button
                  onClick={() => setActiveTab("change-password")}
                  className={`px-4 py-3 text-left text-sm font-medium flex items-center ${
                    activeTab === "change-password"
                      ? "bg-gray-50 text-gray-900 border-l-4 border-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </button>
              </nav>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {activeTab === "personal-info" && (
                <PersonalInfoForm
                  user={user}
                  isEditing={isEditing}
                  onUpdate={handleSubmit}
                  onCancel={() => setIsEditing(false)}
                  formData={formData}
                  onChange={handleChange}
                  loading={loading}
                />
              )}
              {activeTab === "change-password" && <ChangePasswordForm />}
              {activeTab === "orders" && <OrderHistory />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PersonalInfoForm({ user, isEditing, onUpdate, onCancel, formData, onChange, loading }) {
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressFormData, setAddressFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: ""
  })

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const success = await onUpdate({
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      })
      if (success) {
        setSuccess("Profile updated successfully!")
      } else {
        setError("Failed to update profile. Please try again.")
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("Failed to update profile. Please try again.")
    }
  }

  const handleAddressSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const success = await onUpdate({
        ...formData,
        addresses: [...(user.addresses || []), addressFormData]
      })
      if (success) {
        setSuccess("Address added successfully!")
        setShowAddressForm(false)
        setAddressFormData({
          fullName: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          country: ""
        })
      } else {
        setError("Failed to add address. Please try again.")
      }
    } catch (err) {
      console.error("Error adding address:", err)
      setError("Failed to add address. Please try again.")
    }
  }

  const handleAddressChange = (e) => {
    const { name, value } = e.target
    setAddressFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddNewAddress = () => {
    setShowAddressForm(true)
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
        <User className="h-5 w-5 mr-2" />
        Personal Information
      </h2>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">{success}</div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleProfileSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={onChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                required
              />
            ) : (
              <div className="mt-1 text-sm text-gray-900 py-2">{user.name}</div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={onChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                required
              />
            ) : (
              <div className="mt-1 text-sm text-gray-900 py-2">{user.email}</div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <Phone className="h-4 w-4 mr-1" />
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={onChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
              />
            ) : (
              <div className="mt-1 text-sm text-gray-900 py-2">{user.phone || "Not provided"}</div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Profile Changes"}
            </button>
          </div>
        )}
      </form>

      {/* Saved Addresses Section */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
          <MapPin className="h-4 w-4 mr-1" />
          Saved Addresses
        </h3>

        {user.addresses && user.addresses.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {user.addresses.map((address) => (
              <div key={address.id} className="border border-gray-200 rounded-lg p-4 relative">
                {address.isDefault && (
                  <span className="absolute top-2 right-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Default
                  </span>
                )}
                <div className="font-medium">{address.fullName}</div>
                <div className="text-sm text-gray-600 mt-1">{address.phone}</div>
                <div className="text-sm text-gray-600 mt-1">{address.address}</div>
                <div className="text-sm text-gray-600">
                  {address.city}, {address.state} {address.zipCode}
                </div>
                <div className="text-sm text-gray-600">{address.country}</div>
                
                <div className="mt-3 flex space-x-2">
                  <button 
                    type="button"
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </button>
                  <span className="text-gray-300">|</span>
                  <button 
                    type="button"
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    Set as Default
                  </button>
                  <span className="text-gray-300">|</span>
                  <button 
                    type="button"
                    className="text-xs text-gray-600 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            
            {!showAddressForm && (
              <button
                type="button"
                onClick={handleAddNewAddress}
                className="border border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-400 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-600">Add New Address</span>
                </div>
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">You don't have any saved addresses yet.</p>
            <button
              type="button"
              onClick={handleAddNewAddress}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Add New Address
            </button>
          </div>
        )}
      </div>

      {/* New Address Form */}
      {(showAddressForm || (!user.addresses || user.addresses.length === 0)) && (
        <form onSubmit={handleAddressSubmit} className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium text-gray-900 flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {user.addresses && user.addresses.length > 0 ? 'Add New Address' : 'Address Information'}
            </h3>
            {user.addresses && user.addresses.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAddressForm(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={addressFormData.fullName}
                onChange={handleAddressChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={addressFormData.phone}
                onChange={handleAddressChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Street Address</label>
              <input
                type="text"
                name="address"
                value={addressFormData.address}
                onChange={handleAddressChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                name="city"
                value={addressFormData.city}
                onChange={handleAddressChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">State / Province</label>
              <input
                type="text"
                name="state"
                value={addressFormData.state}
                onChange={handleAddressChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">ZIP / Postal Code</label>
              <input
                type="text"
                name="zipCode"
                value={addressFormData.zipCode}
                onChange={handleAddressChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                name="country"
                value={addressFormData.country}
                onChange={handleAddressChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Address"}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function ChangePasswordForm() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      await authService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      })

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      setSuccess("Password updated successfully!")
    } catch (err) {
      console.error("Error updating password:", err)
      setError(err.response?.data?.message || "Failed to update password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
        <Lock className="h-5 w-5 mr-2" />
        Change Password
      </h2>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
            Current Password
          </label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
            required
            minLength={8}
          />
          <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters long</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
            required
            minLength={8}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  )
}

function OrderHistory() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        const ordersData = await authService.getOrders()
        setOrders(ordersData)
        setError("")
      } catch (err) {
        console.error("Error fetching orders:", err)
        setError("Failed to load order history. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-center">
          <ShoppingBag className="h-5 w-5 mr-2" />
          Order History
        </h2>
        <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
        <Link
          to="/products"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800"
        >
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
        <ShoppingBag className="h-5 w-5 mr-2" />
        Order History
      </h2>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Order #{order.id}</h3>
                <p className="text-xs text-gray-500">
                  Placed on {new Date(order.date || order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="mt-2 sm:mt-0 flex items-center">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    order.status === "Delivered"
                      ? "bg-green-100 text-green-800"
                      : order.status === "Processing"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {order.status}
                </span>
                <Link to={`/orders/${order.id}`} className="ml-4 text-sm font-medium text-gray-900 hover:text-gray-700">
                  View Details
                </Link>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="flow-root">
                <ul className="divide-y divide-gray-200">
                  {order.items &&
                    order.items.map((item) => (
                      <li key={item.id} className="py-3 flex">
                        <div className="flex-shrink-0 w-16 h-16 border border-gray-200 rounded-md overflow-hidden">
                          <img
                            src={item.image || `/placeholder.svg?height=64&width=64&text=${item.name}`}
                            alt={item.name}
                            className="w-full h-full object-center object-cover"
                          />
                        </div>
                        <div className="ml-4 flex-1 flex flex-col">
                          <div>
                            <div className="flex justify-between text-sm font-medium text-gray-900">
                              <h4>{item.name}</h4>
                              <p className="ml-4">${Number.parseFloat(item.price).toFixed(2)}</p>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">Qty {item.quantity}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between">
              <span className="text-sm font-medium text-gray-900">Total</span>
              <span className="text-sm font-medium text-gray-900">${Number.parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

