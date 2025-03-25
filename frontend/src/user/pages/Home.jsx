"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import Banner from "../components/Banner"
import ProductCard from "../components/ProductCard"
import CategoryCard from "../components/CategoryCard"

// First, add axios default config at the top
axios.defaults.withCredentials = true;

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Make addToCart function available globally for ProductCard component
    if (window.addToCart) {
      window.addToCart = window.addToCart
    }

    // Fetch data for homepage
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Add timeout to the requests
        const timeout = 10000; // 10 seconds
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const [productsResponse, categoriesResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/products`, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            withCredentials: true,
            signal: controller.signal,
            timeout: timeout
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/categories`, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            withCredentials: true,
            signal: controller.signal,
            timeout: timeout
          })
        ]).finally(() => clearTimeout(timeoutId));

        // Add error checking for the responses
        if (!productsResponse.data) {
          console.error("No product data received");
          throw new Error("Failed to fetch products");
        }

        const products = Array.isArray(productsResponse.data) 
          ? productsResponse.data 
          : productsResponse.data.products || [];

        const categoriesData = Array.isArray(categoriesResponse.data) 
          ? categoriesResponse.data 
          : categoriesResponse.data.categories || [];

        // Sort products by date to get new arrivals (with fallback for missing date fields)
        const sortedByDate = [...products].sort((a, b) => {
          const dateA = a.created_at || a.updatedAt || 0
          const dateB = b.created_at || b.updatedAt || 0
          return new Date(dateB) - new Date(dateA)
        })

        // Get featured products (in a real app, you might have a featured flag)
        const featured = products.filter((_, index) => index % 3 === 0).slice(0, 8)

        setFeaturedProducts(featured)
        setNewArrivals(sortedByDate.slice(0, 4))
        setCategories(categoriesData)
      } catch (err) {
        console.error("Error fetching homepage data:", err)
        setError(err.name === "AbortError" 
          ? "Request timed out. Please try again." 
          : "Failed to load products. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="container mx-auto px-4 pt-6 pb-12">
        <Banner />
      </section>

      {/* Error message if data fetching failed */}
      {error && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      )}

      {/* Categories Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-gray-900">Shop by Category</h2>
          <Link to="/products" className="text-gray-600 hover:text-gray-900 flex items-center text-sm">
            View All
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-1 h-4 w-4"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-32 h-32 rounded-lg bg-gray-100 animate-pulse"></div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="relative">
            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="flex-shrink-0 w-32 group"
                >
                  <div className="relative h-32 rounded-lg overflow-hidden">
                    <img
                      src={category.image ? `${import.meta.env.VITE_API_URL}/uploads/${category.image}` : "/placeholder.svg"}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                      <div className="p-3 w-full">
                        <h3 className="text-sm font-medium text-white truncate">
                          {category.name}
                        </h3>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {/* Scroll indicators */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No categories found. Check back soon!</p>
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-gray-900">Featured Products</h2>
            <Link to="/products" className="text-gray-600 hover:text-gray-900 flex items-center text-sm">
              View All
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1 h-4 w-4"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-md overflow-hidden shadow-sm animate-pulse">
                  <div className="aspect-square bg-gray-100"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {featuredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No featured products found. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-gray-900">New Arrivals</h2>
          <Link to="/products" className="text-gray-600 hover:text-gray-900 flex items-center text-sm">
            View All
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-1 h-4 w-4"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-md overflow-hidden shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-100"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : newArrivals.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {newArrivals.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No new arrivals found. Check back soon!</p>
          </div>
        )}
      </section>

      {/* Promotional Banner */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-gray-50 rounded-md overflow-hidden shadow-sm">
          <div className="flex flex-col md:flex-row items-center">
            <div className="p-8 md:p-12 md:w-1/2">
              <h2 className="text-2xl font-medium text-gray-900 mb-4">Special Offer</h2>
              <p className="mb-6 text-gray-600">
                Get 20% off on your first purchase. Use code{" "}
                <span className="font-medium bg-gray-100 px-2 py-1 rounded-sm">WELCOME20</span> at checkout.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center bg-gray-900 text-white hover:bg-gray-800 px-6 py-3 rounded-sm font-medium transition-all"
              >
                Shop Now
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-2 h-4 w-4"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="md:w-1/2">
              <img
                src="/image.png"
                alt="Special offer"
                className="w-full h-64 md:h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-md shadow-sm">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-gray-900"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-base font-medium mb-2 text-gray-900">Fast Shipping</h3>
              <p className="text-gray-600 text-sm">
                Free shipping on all orders over ₹500. Same-day dispatch for orders placed before 2 PM.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white rounded-md shadow-sm">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-gray-900"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                </svg>
              </div>
              <h3 className="text-base font-medium mb-2 text-gray-900">Secure Payments</h3>
              <p className="text-gray-600 text-sm">
                All transactions are secure and encrypted. We accept all major credit cards and UPI.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white rounded-md shadow-sm">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-gray-900"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-medium mb-2 text-gray-900">24/7 Support</h3>
              <p className="text-gray-600 text-sm">
                Our customer service team is available 24/7 to help you with any questions or concerns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-white border border-gray-100 rounded-md shadow-sm p-6 md:p-8 text-center max-w-3xl mx-auto">
          <h2 className="text-xl font-medium mb-4 text-gray-900">Subscribe to Our Newsletter</h2>
          <p className="text-gray-600 mb-6">Stay updated with our latest products and exclusive offers.</p>
          <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
              required
            />
            <button
              type="submit"
              className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-4 py-2 rounded-sm transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

