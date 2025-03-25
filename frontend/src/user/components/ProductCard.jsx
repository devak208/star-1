"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { useUser } from "../../context/UserContext"

export default function ProductCard({ product }) {
  const [errorIndices, setErrorIndices] = useState({})
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { addToCart } = useUser()

  // Parse product.image to get an array of filenames
  let imageArray = []
  if (product && product.image) {
    if (typeof product.image === "string") {
      // Check if it starts with '[' indicating a JSON array
      if (product.image.trim().startsWith("[")) {
        try {
          imageArray = JSON.parse(product.image)
        } catch {
          imageArray = []
        }
      } else {
        // Assume it's a single filename; wrap it in an array
        imageArray = [product.image]
      }
    } else if (Array.isArray(product.image)) {
      imageArray = product.image
    }
  }

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isAddingToCart) return
    
    try {
      setIsAddingToCart(true)
      // Pass the entire product object to addToCart (the UserContext will extract the ID)
      await addToCart(product, 1)
      console.log("Product added to cart")
    } catch (error) {
      console.error("Error adding product to cart:", error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const renderImages = () => {
    if (!imageArray.length) {
      return (
        <img src="/placeholder.svg?height=300&width=300" alt={product.name} className="w-full h-full object-cover" />
      )
    }

    return imageArray.map((filename, idx) => {
      if (errorIndices[idx]) {
        return (
          <img
            key={idx}
            src="/placeholder.svg?height=300&width=300"
            alt={product.name}
            className="w-full h-full object-cover"
          />
        )
      }
      return (
        <img
          key={idx}
          src={`${import.meta.env.VITE_API_URL}/uploads/${filename}`}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={() => setErrorIndices((prev) => ({ ...prev, [idx]: true }))}
        />
      )
    })
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md transition transform hover:-translate-y-1 duration-300">
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden">
          <div className="w-full h-full flex flex-col">{renderImages()}</div>
        </div>
        <div className="p-4">
          <h3 className="font-medium text-lg text-gray-800 line-clamp-1">{product.name}</h3>
          <p className="text-gray-500 text-sm line-clamp-2 mt-1 mb-2">{product.description}</p>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">₹{Number.parseFloat(product.price).toFixed(2)}</span>
            {product.stock > 0 ? (
              <span className="text-xs text-green-600">In stock</span>
            ) : (
              <span className="text-xs text-red-500">Out of stock</span>
            )}
          </div>
        </div>
      </Link>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleAddToCart}
          disabled={product.stock <= 0 || isAddingToCart}
          className="w-full bg-gray-900 text-white py-2 rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isAddingToCart ? (
            <span className="flex items-center justify-center">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Adding...
            </span>
          ) : product.stock > 0 ? (
            "Add to Cart"
          ) : (
            "Out of Stock"
          )}
        </button>
      </div>
    </div>
  )
}

