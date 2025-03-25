"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useUser } from "../context/UserContext"
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react"
import MiniCart from "./mini-cart"

export default function Cart() {
  const { cart, updateCartItemQuantity, removeFromCart, isAuthenticated } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Calculate total items in cart
  const itemCount = cart?.items?.reduce((count, item) => count + item.quantity, 0) || 0

  useEffect(() => {
    // Simulate loading cart data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const handleQuantityChange = (productId, newQuantity) => {
    updateCartItemQuantity(productId, newQuantity)
  }

  const handleRemoveItem = (productId) => {
    removeFromCart(productId)
  }

  const calculateSubtotal = () => {
    return cart?.items?.reduce((total, item) => total + Number(item.price) * item.quantity, 0) || 0
  }

  const calculateShipping = () => {
    const subtotal = calculateSubtotal()
    // Free shipping over ₹500, otherwise ₹50
    return subtotal > 500 ? 0 : 50
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping()
  }

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate("/login?redirect=checkout")
    } else {
      navigate("/checkout")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-medium mb-6">Shopping Cart</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (!cart?.items?.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-medium mb-6">Shopping Cart</h1>
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="flex justify-center mb-4">
            <ShoppingBag className="h-16 w-16 text-gray-300" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't added any products to your cart yet.</p>
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-medium mb-6">Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-center">Total</div>
            </div>

            {cart.items.map((item) => (
              <div key={item.id} className="p-4 border-b border-gray-100 last:border-b-0">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="col-span-6 flex items-center">
                    <div className="w-16 h-16 flex-shrink-0 rounded-md border border-gray-200 overflow-hidden">
                      {item.image && item.image.length > 0 ? (
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
                            e.target.src = "/placeholder.svg?height=64&width=64"
                          }}
                        />
                      ) : (
                        <img
                          src="/placeholder.svg?height=64&width=64"
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                      <p className="mt-1 text-xs text-gray-500 line-clamp-1">{item.description}</p>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="mt-1 flex items-center text-xs text-red-600 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2 text-center">
                    <span className="text-sm font-medium text-gray-900">₹{Number(item.price).toFixed(2)}</span>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => handleQuantityChange(item.id, Math.max(1, item.quantity - 1))}
                        className="p-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="mx-2 w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="p-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                        disabled={item.quantity >= (item.stock || 10)}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2 text-center">
                    <span className="text-sm font-medium text-gray-900">
                      ₹{(Number(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <Link to="/products" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 mr-2"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Continue Shopping
            </Link>

            <button
              onClick={() => {
                // Clear cart functionality would go here
                if (window.confirm("Are you sure you want to clear your cart?")) {
                  cart.items.forEach((item) => removeFromCart(item.id))
                }
              }}
              className="flex items-center text-sm text-red-600 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-sm font-medium text-gray-900">₹{calculateSubtotal().toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Shipping</span>
                <span className="text-sm font-medium text-gray-900">
                  {calculateShipping() === 0 ? "Free" : `₹${calculateShipping().toFixed(2)}`}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-between">
                <span className="text-base font-medium text-gray-900">Total</span>
                <span className="text-base font-medium text-gray-900">₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="mt-6 w-full bg-gray-900 text-white py-3 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Proceed to Checkout
            </button>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By proceeding to checkout, you agree to our{" "}
                <Link to="/terms" className="text-gray-900 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-gray-900 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
      <button
        className="relative p-2 text-gray-600 hover:text-gray-900"
        onClick={() => setIsCartOpen(true)}
        aria-label="Shopping cart"
      >
        <ShoppingBag className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>

      <MiniCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}

