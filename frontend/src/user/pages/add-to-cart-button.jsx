"use client"

import { useState } from "react"
import { useUser } from "../context/UserContext"
import { ShoppingBag, Check } from "lucide-react"

export default function AddToCartButton({ product, quantity = 1, className = "" }) {
  const { addToCart } = useUser()
  const [isAdding, setIsAdding] = useState(false)
  const [isAdded, setIsAdded] = useState(false)

  const handleAddToCart = async () => {
    if (isAdding || product.stock <= 0) return
    
    setIsAdding(true)

    try {
      // Pass the entire product object to addToCart (the UserContext will extract the ID)
      await addToCart(product, quantity)
      
      // Show success state
      setIsAdded(true)
      
      // Reset button after 2 seconds
      setTimeout(() => {
        setIsAdded(false)
      }, 2000)
    } catch (error) {
      console.error("Error adding product to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const buttonClass = `flex items-center justify-center px-4 py-2 rounded-md ${className} ${
    isAdded ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-900 hover:bg-gray-800 text-white"
  } ${isAdding ? "opacity-75 cursor-wait" : ""} ${product.stock <= 0 ? "opacity-50 cursor-not-allowed" : ""}`

  return (
    <button 
      onClick={handleAddToCart} 
      disabled={isAdding || product.stock <= 0} 
      className={buttonClass}
      aria-label={product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
    >
      {isAdding ? (
        <span className="flex items-center">
          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          Adding...
        </span>
      ) : isAdded ? (
        <span className="flex items-center">
          <Check className="h-4 w-4 mr-2" />
          Added to Cart
        </span>
      ) : (
        <span className="flex items-center">
          <ShoppingBag className="h-4 w-4 mr-2" />
          {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
        </span>
      )}
    </button>
  )
}

