"use client"

import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { useUser } from "../../context/UserContext"
import orderService from "../services/orderService"
import { Package, Truck, CheckCircle, Clock, AlertCircle, ArrowLeft } from "lucide-react"

export default function OrderDetail() {
  const { id } = useParams()
  const { isAuthenticated } = useUser()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [imageErrors, setImageErrors] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?redirect=orders")
      return
    }

    const fetchOrderDetails = async () => {
      try {
        setIsLoading(true)
        const orderData = await orderService.getOrderById(id)
        setOrder(orderData)
      } catch (err) {
        console.error("Error fetching order details:", err)
        setError("Failed to load order details. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderDetails()
  }, [id, isAuthenticated, navigate])

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-indigo-100 text-indigo-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProductImage = (item, index) => {
    if (imageErrors[index]) {
      return "/placeholder.svg?text=product+" + (index + 1)
    }

    // Parse product image to get filename
    let imageFilename = null
    
    if (item.product?.image) {
      if (typeof item.product.image === "string") {
        // Check if it starts with '[' indicating a JSON array
        if (item.product.image.trim().startsWith("[")) {
          try {
            const imageArray = JSON.parse(item.product.image)
            imageFilename = imageArray[0] // Get first image
          } catch {
            imageFilename = null
          }
        } else {
          // Single image filename
          imageFilename = item.product.image
        }
      } else if (Array.isArray(item.product.image) && item.product.image.length > 0) {
        // Already an array
        imageFilename = item.product.image[0]
      }
    } else if (item.image) {
      imageFilename = item.image
    }

    if (!imageFilename) {
      return "/placeholder.svg?text=product+" + (index + 1)
    }

    return `${import.meta.env.VITE_API_URL || 'http://192.168.147.217:5000'}/uploads/${imageFilename}`
  }

  const handleImageError = (index) => {
    setImageErrors(prev => ({
      ...prev,
      [index]: true
    }))
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>
        <div className="mt-4">
          <Link to="/orders" className="text-gray-900 hover:text-gray-700 font-medium flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          Order not found.
        </div>
        <div className="mt-4">
          <Link to="/orders" className="text-gray-900 hover:text-gray-700 font-medium flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  // Calculate timeline status based on order status
  const getTimelineStatus = (orderStatus, status) => {
    const statusOrder = {
      "PENDING": 0,
      "PROCESSING": 1,
      "SHIPPED": 2,
      "DELIVERED": 3,
      "CANCELLED": -1
    }

    const orderStatusValue = statusOrder[orderStatus.toUpperCase()]
    const currentStatusValue = statusOrder[status.toUpperCase()]

    if (orderStatusValue === -1) return "cancelled" // Special case for cancelled orders
    if (currentStatusValue < orderStatusValue) return "completed"
    if (currentStatusValue === orderStatusValue) return "current"
    return "upcoming"
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/orders" className="text-gray-900 hover:text-gray-700 font-medium flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-medium">Order Details</h1>
        <div className="mt-2 md:mt-0 flex items-center">
          <span
            className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(
              order.status,
            )}`}
          >
            {order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Order Date</h2>
          </div>
          <p className="text-gray-700">{formatDate(order.createdAt)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <Package className="h-5 w-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Total Amount</h2>
          </div>
          <p className="text-gray-700">₹{Number(order.total).toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <Truck className="h-5 w-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Payment Method</h2>
          </div>
          <p className="text-gray-700">
            {order.paymentMethod === "COD"
              ? "Cash on Delivery"
              : "Online Payment"}
          </p>
        </div>
      </div>

      {/* Order Tracking Timeline */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Order Status</h2>

        <div className="relative">
          <div className="absolute left-8 top-0 h-full w-0.5 bg-gray-200"></div>

          <div className="space-y-8">
            {/* Pending Status */}
            <div className="relative flex items-start">
              <div
                className={`absolute left-0 rounded-full h-16 w-16 flex items-center justify-center 
                ${
                  order.status.toLowerCase() === "cancelled"
                    ? "bg-red-100"
                    : getTimelineStatus(order.status, "pending") === "completed"
                      ? "bg-green-100" 
                      : getTimelineStatus(order.status, "pending") === "current"
                        ? "bg-yellow-100" 
                        : "bg-gray-100"
                }`}
              >
                <Clock
                  className={`h-8 w-8 
                  ${
                    order.status.toLowerCase() === "cancelled"
                      ? "text-red-500"
                      : getTimelineStatus(order.status, "pending") === "completed"
                        ? "text-green-500" 
                        : getTimelineStatus(order.status, "pending") === "current"
                          ? "text-yellow-500" 
                          : "text-gray-400"
                  }`}
                />
              </div>
              <div className="ml-24">
                <h3 className="text-base font-medium text-gray-900">Order Placed</h3>
                <p className="mt-1 text-sm text-gray-500">Your order has been received and is pending confirmation.</p>
                <p className="mt-1 text-xs text-gray-400">{formatDate(order.createdAt)}</p>
              </div>
            </div>

            {/* Processing Status */}
            <div className="relative flex items-start">
              <div
                className={`absolute left-0 rounded-full h-16 w-16 flex items-center justify-center transition-all duration-300
                ${
                  order.status.toUpperCase() === "CANCELLED"
                    ? "bg-gray-100"
                    : getTimelineStatus(order.status, "PROCESSING") === "completed"
                      ? "bg-green-100 shadow-lg shadow-green-100/50" 
                      : getTimelineStatus(order.status, "PROCESSING") === "current"
                        ? "bg-blue-100 shadow-lg shadow-blue-100/50 animate-pulse" 
                        : "bg-gray-100"
                }`}
              >
                <Package
                  className={`h-8 w-8 transition-colors
                  ${
                    order.status.toUpperCase() === "CANCELLED"
                      ? "text-gray-400"
                    : getTimelineStatus(order.status, "PROCESSING") === "completed"
                      ? "text-green-500" 
                    : getTimelineStatus(order.status, "PROCESSING") === "current"
                      ? "text-blue-500" 
                    : "text-gray-400"
                  }`}
                />
              </div>
              <div className="ml-24">
                <h3 className="text-base font-medium text-gray-900">Processing</h3>
                <p className="mt-1 text-sm text-gray-500">Your order is being prepared for shipping.</p>
                {(["PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status.toUpperCase())) && (
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(order.updatedAt)}
                  </p>
                )}
              </div>
            </div>

            {/* Shipped Status */}
            <div className="relative flex items-start">
              <div
                className={`absolute left-0 rounded-full h-16 w-16 flex items-center justify-center transition-all duration-300
                ${
                  order.status.toUpperCase() === "CANCELLED"
                    ? "bg-gray-100"
                    : getTimelineStatus(order.status, "SHIPPED") === "completed"
                      ? "bg-green-100 shadow-lg shadow-green-100/50" 
                      : getTimelineStatus(order.status, "SHIPPED") === "current"
                        ? "bg-indigo-100 shadow-lg shadow-indigo-100/50 animate-pulse" 
                        : "bg-gray-100"
                }`}
              >
                <Truck
                  className={`h-8 w-8 transition-colors
                  ${
                    order.status.toUpperCase() === "CANCELLED"
                      ? "text-gray-400"
                    : getTimelineStatus(order.status, "SHIPPED") === "completed"
                      ? "text-green-500" 
                    : getTimelineStatus(order.status, "SHIPPED") === "current"
                      ? "text-indigo-500" 
                    : "text-gray-400"
                  }`}
                />
              </div>
              <div className="ml-24">
                <h3 className="text-base font-medium text-gray-900">Shipped</h3>
                <p className="mt-1 text-sm text-gray-500">Your order has been shipped and is on its way to you.</p>
                {(["SHIPPED", "DELIVERED"].includes(order.status.toUpperCase())) && (
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(order.updatedAt)}
                  </p>
                )}
              </div>
            </div>

            {/* Delivered Status */}
            <div className="relative flex items-start">
              <div
                className={`absolute left-0 rounded-full h-16 w-16 flex items-center justify-center 
                ${
                  order.status.toLowerCase() === "cancelled"
                    ? "bg-gray-100"
                    : getTimelineStatus(order.status, "delivered") === "completed"
                      ? "bg-green-100" 
                      : getTimelineStatus(order.status, "delivered") === "current"
                        ? "bg-green-100" 
                        : "bg-gray-100"
                }`}
              >
                <CheckCircle
                  className={`h-8 w-8 
                  ${
                    order.status.toLowerCase() === "cancelled"
                      ? "text-gray-400"
                      : getTimelineStatus(order.status, "delivered") === "completed"
                        ? "text-green-500" 
                        : getTimelineStatus(order.status, "delivered") === "current"
                          ? "text-green-500" 
                          : "text-gray-400"
                  }`}
                />
              </div>
              <div className="ml-24">
                <h3 className="text-base font-medium text-gray-900">Delivered</h3>
                <p className="mt-1 text-sm text-gray-500">Your order has been delivered successfully.</p>
                {order.status.toLowerCase() === "delivered" && (
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(new Date(new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000))}
                  </p>
                )}
              </div>
            </div>

            {/* Cancelled Status - Only shown if order is cancelled */}
            {order.status.toLowerCase() === "cancelled" && (
              <div className="relative flex items-start">
                <div className="absolute left-0 rounded-full h-16 w-16 flex items-center justify-center bg-red-100">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <div className="ml-24">
                  <h3 className="text-base font-medium text-gray-900">Cancelled</h3>
                  <p className="mt-1 text-sm text-gray-500">This order has been cancelled.</p>
                  <p className="mt-1 text-xs text-gray-400">{formatDate(order.updatedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ordered Products */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Ordered Products</h2>
        
        {order.items && order.items.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {order.items.map((item, index) => (
              <li key={item.id || index} className="py-4 flex items-center">
                <div className="flex-shrink-0 h-16 w-16 border border-gray-200 rounded-md overflow-hidden mr-4">
                  <img 
                    src={getProductImage(item, index)}
                    alt={item.product?.name || `Product ${index + 1}`}
                    className="h-full w-full object-cover"
                    onError={() => handleImageError(index)}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.product?.name || `Product ${index + 1}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-4">No items found in this order</p>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Subtotal</span>
            <span className="font-medium">₹{(order.total - (order.shippingCost || 0)).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="font-medium text-gray-700">Shipping</span>
            <span className="font-medium">₹{(order.shippingCost || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
            <span className="text-lg font-medium text-gray-900">Total</span>
            <span className="text-lg font-medium text-gray-900">₹{order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="space-x-4 flex justify-center">
        <Link
          to="/orders"
          className="px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800"
          aria-label="View all orders"
          tabIndex="0"
        >
          Back to Orders
        </Link>
        <Link
          to="/products"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          aria-label="Continue shopping"
          tabIndex="0"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  )
} 