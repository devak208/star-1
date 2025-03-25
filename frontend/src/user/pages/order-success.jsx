"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { CheckCircle } from "lucide-react"

export default function OrderSuccess() {
  const location = useLocation()
  const navigate = useNavigate()
  const orderData = location.state?.orderData
  const [imageErrors, setImageErrors] = useState({})

  useEffect(() => {
    if (!orderData) {
      navigate("/")
    }
  }, [orderData, navigate])

  if (!orderData) {
    return null
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
          Order Placed Successfully!
        </h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Details</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-medium text-gray-900">₹{orderData.total.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium text-gray-900">
                {orderData.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Shipping Address</span>
              <span className="font-medium text-gray-900">
                {orderData.shippingAddress?.fullName || ""}
                {orderData.shippingAddress?.address && <br />}
                {orderData.shippingAddress?.address || ""}
                {(orderData.shippingAddress?.city || orderData.shippingAddress?.state || orderData.shippingAddress?.zipCode) && <br />}
                {orderData.shippingAddress?.city && orderData.shippingAddress.city}
                {orderData.shippingAddress?.city && orderData.shippingAddress?.state && ", "}
                {orderData.shippingAddress?.state && orderData.shippingAddress.state} 
                {orderData.shippingAddress?.zipCode && orderData.shippingAddress.zipCode}
                {orderData.shippingAddress?.country && <br />}
                {orderData.shippingAddress?.country || ""}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Order Status</span>
              <span className="font-medium text-gray-900 uppercase">
                {orderData.status || "PENDING"}
              </span>
            </div>
          </div>
        </div>

        {/* Ordered Products */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Ordered Products</h2>
          
          {orderData.items && orderData.items.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {orderData.items.map((item, index) => (
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
                      {item.product?.name || item.name || `Product ${index + 1}`}
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
              <span className="font-medium">₹{(orderData.total - (orderData.shippingCost || 0)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="font-medium text-gray-700">Shipping</span>
              <span className="font-medium">₹{(orderData.shippingCost || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
              <span className="text-lg font-medium text-gray-900">Total</span>
              <span className="text-lg font-medium text-gray-900">₹{orderData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="space-x-4 flex justify-center">
          <button
            onClick={() => navigate("/orders")}
            className="px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800"
          >
            View Orders
          </button>
          <button
            onClick={() => navigate("/products")}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  )
}

