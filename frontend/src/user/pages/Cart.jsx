"use client"

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom"
import { useUser } from "../../context/UserContext"
import { ShoppingBag, Trash2, Plus, Minus, RotateCw } from "lucide-react"
import toast from 'react-hot-toast'

export default function Cart() {
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const { cart, updateCartItemQuantity, removeFromCart, clearCart, isAuthenticated, fetchCart } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const navigate = useNavigate()

  const fetchCartData = async (isRetry = false) => {
    try {
      if (!isRetry) {
        setIsLoading(true)
      }
      setError(null)
      await fetchCart()
    } catch (error) {
      console.error("Error fetching cart:", error)
      
      // Only set error if we're not going to retry
      if (retryCount >= 2) {
        setError("Failed to fetch cart items")
        toast.error("Failed to load your cart")
      } else {
        // Increment retry count and try again after a delay
        setRetryCount(prevCount => prevCount + 1)
        setTimeout(() => {
          fetchCartData(true)
        }, 1000)
      }
    } finally {
      if (!isRetry || retryCount >= 2) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    // Give the server a small delay on initial load
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        fetchCartData()
      } else {
        setIsLoading(false)
      }
    }, 300) // Short delay for server readiness
    
    return () => clearTimeout(timer)
  }, [isAuthenticated])

  // Reset retry count when component unmounts
  useEffect(() => {
    return () => setRetryCount(0)
  }, [])

  const handleRefresh = () => {
    setRetryCount(0) // Reset retry count on manual refresh
    fetchCartData()
  }

  // Get cart items, handling both API response structure and local storage structure
  const getCartItems = () => {
    return cart?.items || []
  }

  const cartItems = getCartItems()

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    try {
      setUpdatingItemId(cartItemId);
      const itemId = typeof cartItemId === 'object' ? cartItemId.id : cartItemId;
      await updateCartItemQuantity(itemId, newQuantity);
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity")
    } finally {
      setUpdatingItemId(null);
    }
  }

  const handleRemoveItem = async (cartItemId) => {
    try {
      // Make sure we're passing the actual ID string
      const itemId = typeof cartItemId === 'object' ? cartItemId.id : cartItemId;
      await removeFromCart(itemId);
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item from cart");
    }
  }

  const calculateSubtotal = () => {
    if (cart?.total) {
      return cart.total;
    }
    
    return cartItems.reduce((total, item) => {
      const price = Number(item.product?.price || item.price || 0);
      const quantity = Number(item.quantity || 0);
      return total + (price * quantity);
    }, 0);
  }

  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    // Free shipping over ₹500, otherwise ₹50
    return subtotal > 500 ? 0 : 50;
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping();
  }

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate("/login?redirect=checkout")
    } else {
      navigate("/checkout")
    }
  }

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      clearCart()
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600 text-center">Loading your cart...</p>
          {retryCount > 0 && (
            <p className="text-gray-500 text-sm mt-2">
              Connecting to server {retryCount > 1 ? `(Attempt ${retryCount})` : ''}...
            </p>
          )}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-medium mb-6">Shopping Cart</h1>
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="flex justify-center mb-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">{error}</h2>
          <p className="text-gray-500 mb-6">We couldn't load your cart. Please try again.</p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={handleRefresh}
              className="px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 flex items-center"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
            <Link
              to="/products"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Handle empty cart state
  if (!cartItems.length) {
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Shopping Cart</h1>
        <button 
          onClick={handleRefresh}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Refresh cart"
        >
          <RotateCw className="w-5 h-5" />
        </button>
      </div>

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

            {cartItems.map((item) => {
              // Handle both API response structure and local storage structure
              const productPrice = Number(item.product?.price || item.price || 0);
              const productName = item.product?.name || item.name;
              const productDescription = item.product?.description || item.description;
              const productImage = item.product?.image || item.image;
              const stock = item.product?.stock || item.stock || 10;
              const quantity = Number(item.quantity || 0);

              // Get first image from array or use placeholder
              let imageUrl = '/placeholder.svg?height=64&width=64';
              if (productImage) {
                if (Array.isArray(productImage) && productImage.length > 0) {
                  imageUrl = `${import.meta.env.VITE_API_URL}/uploads/${productImage[0]}`;
                } else if (typeof productImage === 'string') {
                  try {
                    if (productImage.startsWith('[')) {
                      const parsedImages = JSON.parse(productImage);
                      if (parsedImages.length > 0) {
                        imageUrl = `${import.meta.env.VITE_API_URL}/uploads/${parsedImages[0]}`;
                      }
                    } else {
                      imageUrl = `${import.meta.env.VITE_API_URL}/uploads/${productImage}`;
                    }
                  } catch {
                    imageUrl = `${import.meta.env.VITE_API_URL}/uploads/${productImage}`;
                  }
                }
              }

              return (
                <div key={item.id} className="p-4 border-b border-gray-100 last:border-b-0">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 flex items-center">
                      <div className="w-16 h-16 flex-shrink-0 rounded-md border border-gray-200 overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={productName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/placeholder.svg?height=64&width=64";
                          }}
                        />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">{productName}</h3>
                        <p className="mt-1 text-xs text-gray-500 line-clamp-1">{productDescription}</p>
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
                      <span className="text-sm font-medium text-gray-900">₹{productPrice.toFixed(2)}</span>
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleQuantityChange(item.id, Math.max(1, item.quantity - 1))}
                          className="p-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={updatingItemId === item.id}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>

                        <div className="relative mx-2 w-8 text-center">
                          {updatingItemId === item.id ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="animate-spin h-4 w-4 border-2 border-gray-900 rounded-full border-t-transparent"></div>
                            </div>
                          ) : (
                            <span className="text-sm">{item.quantity}</span>
                          )}
                        </div>

                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="p-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={updatingItemId === item.id || item.quantity >= (item.product?.stock || stock)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="col-span-2 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        ₹{(productPrice * quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
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

            <button onClick={handleClearCart} className="flex items-center text-sm text-red-600 hover:text-red-500">
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
    </div>
  )
}

