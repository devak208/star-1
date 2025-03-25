"use client"

import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { useUser } from "../context/UserContext"
import authService from "../services/authService"
import { Package, Truck, CheckCircle, Clock, AlertCircle } from "lucide-react"

export default function OrderDetail() {
  const { id } = useParams()
  const { isAuthenticated } = useUser()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?redirect=orders")
      return
    }

    const fetchOrderDetails = async () => {
      try {
        setIsLoading(true)
        const orderData = await authService.getOrderDetails(id)
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

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-6 w-6 text-yellow-500" />
      case "processing":
        return <Package className="h-6 w-6 text-blue-500" />
      case "shipped":
        return <Truck className="h-6 w-6 text-indigo-500" />
      case "delivered":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "cancelled":
        return <AlertCircle className="h-6 w-6 text-red-500" />
      default:
        return <Clock className="h-6 w-6 text-gray-500" />
    }
  }

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
            ← Back to Orders
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
            ← Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/orders" className="text-gray-900 hover:text-gray-700 font-medium flex items-center">
          ← Back to Orders
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-medium">Order #{order.id}</h1>
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
          <p className="text-gray-700">{new Date(order.date).toLocaleDateString()}</p>
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
            {order.paymentMethod === "cod"
              ? "Cash on Delivery"
              : order.paymentMethod === "card"
                ? "Credit/Debit Card"
                : "UPI"}
          </p>
        </div>
      </div>

      {/* Order Tracking */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Order Status</h2>

        <div className="relative">
          <div className="absolute left-8 top-0 h-full w-0.5 bg-gray-200"></div>

          <div className="space-y-8">
            <div className="relative flex items-start">
              <div
                className={`absolute left-0 rounded-full h-16 w-16 flex items-center justify-center ${
                  order.status === "Pending" ||
                  order.status === "Processing" ||
                  order.status === "Shipped" ||
                  order.status === "Delivered"
                    ? "bg-green-100"
                    : "bg-gray-100"
                }`}
              >
                <Clock
                  className={`h-8 w-8 ${
                    order.status === "Pending" ||
                    order.status === "Processing" ||
                    order.status === "Shipped" ||
                    order.status === "Delivered"
                      ? "text-green-500"
                      : "text-gray-400"
                  }`}
                />
              </div>
              <div className="ml-24">
                <h3 className="text-base font-medium text-gray-900">Order Placed</h3>
                <p className="mt-1 text-sm text-gray-500">Your order has been received and is being processed.</p>
                <p className="mt-1 text-xs text-gray-400">{new Date(order.date).toLocaleString()}</p>
              </div>
            </div>

            <div className="relative flex items-start">
              <div
                className={`absolute left-0 rounded-full h-16 w-16 flex items-center justify-center ${
                  order.status === "Processing" || order.status === "Shipped" || order.status === "Delivered"
                    ? "bg-green-100"
                    : "bg-gray-100"
                }`}
              >
                <Package
                  className={`h-8 w-8 ${
                    order.status === "Processing" || order.status === "Shipped" || order.status === "Delivered"
                      ? "text-green-500"
                      : "text-gray-400"
                  }`}
                />
              </div>
              <div className="ml-24">
                <h3 className="text-base font-medium text-gray-900">Processing</h3>
                <p className="mt-1 text-sm text-gray-500">Your order is being prepared for shipping.</p>
                {order.status === "Processing" || order.status === "Shipped" || order.status === "Delivered" ? (
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(new Date(order.date).getTime() + 1 * 24 * 60 * 60 * 1000).toLocaleString()}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="relative flex items-start">
              <div
                className={`absolute left-0 rounded-full h-16 w-16 flex items-center justify-center ${
                  order.status === "Shipped" || order.status === "Delivered" ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                <Truck
                  className={`h-8 w-8 ${
                    order.status === "Shipped" || order.status === "Delivered" ? "text-green-500" : "text-gray-400"
                  }`}
                />
              </div>
              <div className="ml-24">
                <h3 className="text-base font-medium text-gray-900">Shipped</h3>
                <p className="mt-1 text-sm text-gray-500">Your order has been shipped and is on its way to you.</p>
                {order.status === "Shipped" || order.status === "Delivered" ? (
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(new Date(order.date).getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleString()}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="relative flex items-start">
              <div
                className={`absolute left-0 rounded-full h-16 w-16 flex items-center justify-center ${
                  order.status === "Delivered" ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                <CheckCircle
                  className={`h-8 w-8 ${order.status === "Delivered" ? "text-green-500" : "text-gray-400"}`}
                />
              </div>
              <div className="ml-24">
                <h3 className="text-base font-medium text-gray-900">Delivered</h3>
                <p className="mt-1 text-sm text-gray-500">Your order has been delivered successfully.</p>
                {order.status === "Delivered" ? (
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(new Date(order.date).getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleString()}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Order Items</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {order.items.map((item) => (
            <div key={item.id} className="p-6 flex flex-col sm:flex-row">
              <div className="sm:w-20 sm:h-20 w-full h-32 flex-shrink-0 rounded-md border border-gray-200 overflow-hidden mb-4 sm:mb-0">
                {item.image ? (
                  <img
                    src={
                      typeof item.image === "string" && item.image.startsWith("[")
                        ? `${import.meta.env.VITE_API_URL}/uploads/${JSON.parse(item.image)[0]}`
                        : Array.isArray(item.image)
                          ? `${import.meta.env.VITE_API_URL}/uploads/${item.image[0]}`
                          : `${import.meta.env.VITE_API_URL}/uploads/${item.image}`
                    }
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "/placeholder.svg?height=80&width=80"
                    }}
                  />
                ) : (
                  <img
                    src="/placeholder.svg?height=80&width=80"
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 sm:ml-6">
                <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.description}</p>
                <div className="mt-2 flex justify-between">
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  <p className="text-sm font-medium text-gray-900">₹{Number(item.price).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between text-base font-medium text-gray-900">
            <p>Total</p>
            <p>₹{Number(order.total).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Shipping Information */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Shipping Address</h3>
            <p className="text-sm text-gray-900">
              {order.shippingAddress?.fullName || "Customer Name"}
              <br />
              {order.shippingAddress?.address || "123 Main St"}
              <br />
              {order.shippingAddress?.city || "City"}, {order.shippingAddress?.state || "State"}{" "}
              {order.shippingAddress?.zipCode || "12345"}
              <br />
              {order.shippingAddress?.country || "Country"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Contact Information</h3>
            <p className="text-sm text-gray-900">
              Email: {order.email || "customer@example.com"}
              <br />
              Phone: {order.shippingAddress?.phone || "+1 (555) 123-4567"}
            </p>
          </div>
        </div>
      </div>

      {/* Need Help Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h2>
        <p className="text-sm text-gray-500 mb-4">
          If you have any questions or concerns about your order, please contact our customer support.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="mailto:support@example.com"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Email Support
          </a>
          <a
            href="tel:+1234567890"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Call Support
          </a>
        </div>
      </div>
    </div>
  )
}

