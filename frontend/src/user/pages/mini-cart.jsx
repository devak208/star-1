"use client"

import { useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import { useUser } from "../context/UserContext"
import { ShoppingBag, X } from "lucide-react"

export default function MiniCart({ isOpen, onClose }) {
  const { cart, removeFromCart } = useUser()
  const cartRef = useRef(null)

  // Close cart when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  // Calculate cart totals
  const calculateSubtotal = () => {
    if (!cart || !cart.items || !cart.items.length) return 0
    
    return cart.items.reduce((total, item) => {
      const price = item.product?.price || 0
      const quantity = item.quantity || 0
      return total + (Number(price) * quantity)
    }, 0)
  }
  
  // Get cart items count
  const cartItemsCount = cart?.items?.length || 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
      <div ref={cartRef} className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-medium">Your Cart ({cartItemsCount})</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100" aria-label="Close cart">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!cartItemsCount ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <ShoppingBag className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <Link
              to="/products"
              onClick={onClose}
              className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
            >
              Shop Now
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {cart.items.map((item) => {
                // Always get product from the item.product object
                const product = item.product || {}
                const productId = product.id || item.productId
                const productName = product.name || 'Product'
                const productPrice = product.price || 0
                const productImage = product.image || []
                const quantity = item.quantity || 0
                
                // Get first image from array or use placeholder
                let imageUrl = '/placeholder.svg?height=64&width=64'
                if (productImage) {
                  if (Array.isArray(productImage) && productImage.length > 0) {
                    imageUrl = `${import.meta.env.VITE_API_URL}/uploads/${productImage[0]}`
                  } else if (typeof productImage === 'string') {
                    // Try to parse if it's a JSON string
                    try {
                      if (productImage.startsWith('[')) {
                        const parsedImages = JSON.parse(productImage)
                        if (parsedImages.length > 0) {
                          imageUrl = `${import.meta.env.VITE_API_URL}/uploads/${parsedImages[0]}`
                        }
                      } else {
                        imageUrl = `${import.meta.env.VITE_API_URL}/uploads/${productImage}`
                      }
                    } catch {
                      imageUrl = `${import.meta.env.VITE_API_URL}/uploads/${productImage}`
                    }
                  }
                }

                return (
                  <div key={item.id} className="flex py-4 border-b border-gray-100 last:border-b-0">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={imageUrl}
                        alt={productName}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = "/placeholder.svg?height=64&width=64"
                        }}
                      />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col">
                      <div className="flex justify-between text-sm font-medium text-gray-900">
                        <h3>
                          <Link to={`/product/${productId}`} onClick={onClose}>
                            {productName}
                          </Link>
                        </h3>
                        <p className="ml-4">₹{Number(productPrice).toFixed(2)}</p>
                      </div>
                      <div className="flex flex-1 items-end justify-between text-sm">
                        <p className="text-gray-500">Qty {quantity}</p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="font-medium text-red-600 hover:text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-gray-200 p-4 space-y-4">
              <div className="flex justify-between text-base font-medium text-gray-900">
                <p>Subtotal</p>
                <p>₹{calculateSubtotal().toFixed(2)}</p>
              </div>
              <p className="text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/cart"
                  onClick={onClose}
                  className="flex items-center justify-center rounded-md border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  View Cart
                </Link>
                <Link
                  to="/checkout"
                  onClick={onClose}
                  className="flex items-center justify-center rounded-md border border-transparent bg-gray-900 px-6 py-3 text-base font-medium text-white hover:bg-gray-800"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

