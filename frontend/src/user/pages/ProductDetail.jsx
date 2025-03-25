"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useUser } from "../../context/UserContext"
import ProductCard from "../components/ProductCard"

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const { addToCart } = useUser()

  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      setIsLoading(true)
      try {
        // Fetch product
        const productRes = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`)
        const productData = await productRes.json()
        setProduct(productData)

        // Fetch related products from same category
        if (productData.categoryId) {
          const relatedRes = await fetch(`${import.meta.env.VITE_API_URL}/api/products/category/${productData.categoryId}`)
          const relatedData = await relatedRes.json()
          // Filter out current product and limit to 4
          setRelatedProducts(relatedData.filter((p) => p.id !== productData.id).slice(0, 5))
        }
      } catch (error) {
        console.error("Error fetching product details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProductDetails()
  }, [id])

  const handleQuantityChange = (e) => {
    const value = Number.parseInt(e.target.value)
    setQuantity(value)
  }

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity)
    }
  }

  // Generate product images using the "image" field from the product
  let productImages = []
  if (product && product.image) {
    try {
      let imagesArr = [];
  
      if (typeof product.image === "string") {
        // If it's a JSON array string, parse it
        if (product.image.trim().startsWith("[")) {
          imagesArr = JSON.parse(product.image);
        } else if (product.image.includes(",")) {
          // If it's a CSV string, split it
          imagesArr = product.image.split(",").map(img => img.trim());
        } else {
          imagesArr = [product.image.trim()];
        }
      } else if (Array.isArray(product.image)) {
        // If it's already an array, use it directly
        imagesArr = product.image;
      } else {
        // If it's an unexpected type, fallback to placeholder
        imagesArr = ["/placeholder.svg?height=300&width=300"];
      }
  
      // Remove quotes and format URLs correctly
      productImages = imagesArr.map(filename => {
        if (typeof filename === "string") {
          const cleanFilename = filename.replace(/['"]/g, "").trim();
          return `${import.meta.env.VITE_API_URL}/uploads/${cleanFilename}`;
        }
        return "/placeholder.svg?height=300&width=300";
      });
    } catch (error) {
      console.error("Error parsing images:", error);
      productImages = [`${import.meta.env.VITE_API_URL}/uploads/${String(product.image).trim()}`];
    }
  } else {
    productImages = ["/placeholder.svg?height=300&width=300"];
  }
  
  
  

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2">
            <div className="aspect-square bg-gray-100 rounded-md animate-pulse"></div>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-sm animate-pulse"></div>
              ))}
            </div>
          </div>
          <div className="md:w-1/2 space-y-4">
            <div className="h-8 bg-gray-100 rounded-sm w-3/4 animate-pulse"></div>
            <div className="h-6 bg-gray-100 rounded-sm w-1/4 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded-sm w-full animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded-sm w-full animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded-sm w-3/4 animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded-sm w-1/3 animate-pulse"></div>
            <div className="h-12 bg-gray-100 rounded-sm w-full animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-xl font-medium mb-4">Product Not Found</h1>
        <p className="mb-6 text-gray-600">The product you're looking for doesn't exist or has been removed.</p>
        <Link
          to="/products"
          className="bg-gray-900 text-white px-6 py-2 rounded-sm hover:bg-gray-800 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex mb-6 text-sm">
        <Link to="/" className="text-gray-500 hover:text-gray-900">
          Home
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <Link to="/products" className="text-gray-500 hover:text-gray-900">
          Products
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Product Images */}
        <div className="lg:w-2/5">
          <div className="mb-4 border border-gray-100 rounded-md overflow-hidden">
            <img
              src={productImages[activeImage] || "/placeholder.svg"}
              alt={product.name}
              className="w-full aspect-square object-contain p-4"
            />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {productImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setActiveImage(index)}
                className={`aspect-square rounded-sm overflow-hidden border ${
                  activeImage === index ? "border-gray-900" : "border-gray-200"
                }`}
              >
                <img
                  src={image || "/placeholder.svg"}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  className="w-full h-full object-contain p-1"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="lg:w-3/5">
          <h1 className="text-2xl font-medium mb-2">{product.name}</h1>

          <div className="flex items-center mb-4">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={i < 4 ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <span className="text-gray-500 ml-2 text-sm">4.0 (24 reviews)</span>
          </div>

          <div className="text-xl font-medium mb-4 flex items-center">
            <span className="text-sm mr-0.5">₹</span>
            {Number.parseFloat(product.price).toFixed(2)}
            {product.originalPrice && (
              <span className="ml-2 text-sm text-gray-500 line-through flex items-center">
                <span className="text-xs">₹</span>
                {Number.parseFloat(product.originalPrice).toFixed(2)}
              </span>
            )}
          </div>

          <div className="mb-6">
            <h2 className="font-medium mb-2">Description</h2>
            <p className="text-gray-600">{product.description}</p>
          </div>
          <div className="mb-6 flex gap-2">
            <h2 className="font-medium mb-2">weight :</h2>
            <p className="text-gray-600">{product.weight} <span className="font-bold">kg</span></p>
            <h2 className="font-medium mb-2">Quantity :</h2>
            <p className="text-gray-600">{product.qty}</p>
          </div>

          <div className="mb-6">
            <h2 className="font-medium mb-2">Availability</h2>
            {product.stock > 0 ? (
              <p className="text-green-600">In Stock ({product.stock} available)</p>
            ) : (
              <p className="text-red-600">Out of Stock</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="w-full sm:w-1/3">
              <label htmlFor="quantity" className="block text-sm font-medium mb-1">
                Quantity
              </label>
              <select
                id="quantity"
                value={quantity}
                onChange={handleQuantityChange}
                disabled={product.stock <= 0}
                className="w-full px-4 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
              >
                {[...Array(Math.min(10, product.stock || 0))].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-2/3 flex flex-col justify-end">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="bg-gray-900 text-white hover:bg-gray-800 py-2 w-full rounded-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <button className="flex items-center text-gray-600 hover:text-gray-900 text-sm">
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
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              Add to Wishlist
            </button>
            <button className="flex items-center text-gray-600 hover:text-gray-900 text-sm">
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
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Quick View
            </button>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-gray-900 mr-2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="text-sm text-gray-600">Secure Payment</span>
              </div>
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-gray-900 mr-2"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="M7 15h0M2 9.5h20" />
                </svg>
                <span className="text-sm text-gray-600">Free Shipping</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
  <div className="mt-12">
    <h2 className="text-xl font-medium mb-6">Related Products</h2>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {relatedProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  </div>
)}
    </div>
  )
}

