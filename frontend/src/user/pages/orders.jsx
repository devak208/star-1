"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useUser } from "../../context/UserContext"
import orderService from "../services/orderService"

export default function Orders() {
  const { isAuthenticated } = useUser()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [imageErrors, setImageErrors] = useState({})
  const [retryCount, setRetryCount] = useState(0)
  const [activeTab, setActiveTab] = useState("all")
  const navigate = useNavigate()

  // Load orders when component mounts
  useEffect(() => {
    let isMounted = true

    if (!isAuthenticated) {
      navigate("/login?redirect=orders")
      return
    }

    async function fetchOrders() {
      try {
        setIsLoading(true)
        const response = await orderService.getUserOrders()

        // Only update state if component is still mounted
        if (isMounted) {
          console.log("Orders response:", response)
          setOrders(response)
          setIsLoading(false)
        }
      } catch (err) {
        console.error("Error fetching orders:", err)
        if (isMounted) {
          setError(err.message || "Failed to load your orders. Please try again.")
          setIsLoading(false)
        }
      }
    }

    fetchOrders()

    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [isAuthenticated, navigate, retryCount])

  // Filter orders based on search query and active tab
  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      (order.status && order.status.toLowerCase().includes(searchLower)) ||
      (order.createdAt && new Date(order.createdAt).toLocaleDateString().includes(searchLower)) ||
      (order.items &&
        order.items.some(
          (item) => item.product && item.product.name && item.product.name.toLowerCase().includes(searchLower),
        ))

    if (activeTab === "all") return matchesSearch
    return matchesSearch && order.status && order.status.toLowerCase() === activeTab.toLowerCase()
  })

  // Helper functions
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "shipped":
        return "bg-indigo-100 text-indigo-800 border-indigo-200"
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getProductImage = (order, index) => {
    if (imageErrors[`${order.id}-${index}`]) {
      return "/placeholder.svg?text=product"
    }

    if (!order.items || order.items.length === 0 || !order.items[0].product) {
      return "/placeholder.svg?text=product"
    }

    const item = order.items[0]
    let imageFilename = null

    if (item.product?.image) {
      if (typeof item.product.image === "string") {
        if (item.product.image.trim().startsWith("[")) {
          try {
            const imageArray = JSON.parse(item.product.image)
            imageFilename = imageArray[0]
          } catch {
            imageFilename = null
          }
        } else {
          imageFilename = item.product.image
        }
      } else if (Array.isArray(item.product.image) && item.product.image.length > 0) {
        imageFilename = item.product.image[0]
      }
    }

    if (!imageFilename) {
      return "/placeholder.svg?text=product"
    }

    return `${import.meta.env.VITE_API_URL || "http://192.168.147.217:5000"}/uploads/${imageFilename}`
  }

  const handleImageError = (orderId, index) => {
    setImageErrors((prev) => ({
      ...prev,
      [`${orderId}-${index}`]: true,
    }))
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Invalid Date"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">My Orders</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-500">Loading your orders...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">My Orders</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <svg className="h-6 w-6 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
            <button
              onClick={() => setRetryCount((prev) => prev + 1)}
              className="px-5 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors shadow-sm w-full sm:w-auto"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">My Orders</h1>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="flex justify-center mb-4">
            <svg className="h-20 w-20 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">No orders found</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            You haven't placed any orders yet. Start shopping to see your orders here.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <Link
          to="/products"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white hover:bg-gray-50 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search input */}
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search orders by status, date, or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>

            {/* Filter tabs */}
            <div className="flex overflow-x-auto pb-1 sm:pb-0 gap-2 sm:justify-end">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  activeTab === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Orders
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  activeTab === "pending"
                    ? "bg-yellow-500 text-white"
                    : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setActiveTab("processing")}
                className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  activeTab === "processing" ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              >
                Processing
              </button>
              <button
                onClick={() => setActiveTab("shipped")}
                className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  activeTab === "shipped"
                    ? "bg-indigo-500 text-white"
                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                Shipped
              </button>
              <button
                onClick={() => setActiveTab("delivered")}
                className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  activeTab === "delivered"
                    ? "bg-green-500 text-white"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                Delivered
              </button>
            </div>
          </div>
        </div>

        {/* Order cards for mobile */}
        <div className="sm:hidden divide-y divide-gray-200">
          {filteredOrders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No orders match your search criteria</div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500">{formatDate(order.createdAt)}</span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                    <img
                      src={getProductImage(order, 0) || "/placeholder.svg"}
                      alt={order.items?.[0]?.product?.name || "Product"}
                      className="h-full w-full object-cover"
                      onError={() => handleImageError(order.id, 0)}
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {order.items?.[0]?.product?.name || "Product"}
                    </div>
                    {order.items && order.items.length > 1 && (
                      <div className="text-xs text-gray-500">+{order.items.length - 1} more items</div>
                    )}
                    <div className="text-sm font-medium text-gray-900 mt-1">₹{Number(order.total).toFixed(2)}</div>
                  </div>
                </div>

                <Link
                  to={`/orders/${order.id}`}
                  className="block w-full text-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  View Details
                </Link>
              </div>
            ))
          )}
        </div>

        {/* Order table for desktop */}
        <div className="hidden sm:block">
          {filteredOrders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No orders match your search criteria</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Product
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Total
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden bg-gray-100">
                          <img
                            src={getProductImage(order, 0) || "/placeholder.svg"}
                            alt={order.items?.[0]?.product?.name || "Product"}
                            className="h-full w-full object-cover"
                            onError={() => handleImageError(order.id, 0)}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {order.items?.[0]?.product?.name || "Product"}
                          </div>
                          {order.items && order.items.length > 1 && (
                            <div className="text-xs text-gray-500">+{order.items.length - 1} more items</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{Number(order.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          order.status,
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md font-medium inline-flex items-center transition-colors"
                        aria-label={`View details for order placed on ${formatDate(order.createdAt)}`}
                      >
                        View Details
                        <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Order summary */}
      <div className="bg-gray-50 rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Total Orders</div>
            <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter((order) => order.status?.toLowerCase() === "pending").length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Processing</div>
            <div className="text-2xl font-bold text-blue-600">
              {orders.filter((order) => order.status?.toLowerCase() === "processing").length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Delivered</div>
            <div className="text-2xl font-bold text-green-600">
              {orders.filter((order) => order.status?.toLowerCase() === "delivered").length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

