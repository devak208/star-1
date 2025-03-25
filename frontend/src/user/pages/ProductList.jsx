"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import ProductCard from "../components/ProductCard"

export default function ProductList() {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    search: searchParams.get("search") || "",
    minPrice: "0",
    maxPrice: "",
    sort: "newest",
  })

  // Get category and search from URL params
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: searchParams.get("category") || "",
      search: searchParams.get("search") || "",
    }))
  }, [searchParams])

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch all products
        let url = `${import.meta.env.VITE_API_URL}/api/products`
        if (filters.category) {
          url = `${import.meta.env.VITE_API_URL}/api/products/category/${filters.category}`
        }

        const productsRes = await fetch(url)
        const productsData = await productsRes.json()

        // Fetch categories
        const categoriesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`)
        const categoriesData = await categoriesRes.json()

        setCategories(categoriesData)
        setProducts(productsData)
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [filters.category])

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      // Search filter
      if (
        filters.search &&
        !product.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !product.description.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false
      }

      // Price filter
      if (filters.minPrice && Number.parseFloat(product.price) < Number.parseFloat(filters.minPrice)) {
        return false
      }
      if (filters.maxPrice && Number.parseFloat(product.price) > Number.parseFloat(filters.maxPrice)) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      // Sort products
      switch (filters.sort) {
        case "price-low":
          return Number.parseFloat(a.price) - Number.parseFloat(b.price)
        case "price-high":
          return Number.parseFloat(b.price) - Number.parseFloat(a.price)
        case "name-asc":
          return a.name.localeCompare(b.name)
        case "name-desc":
          return b.name.localeCompare(a.name)
        case "newest":
        default:
          return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      }
    })

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const clearFilters = () => {
    setFilters({
      category: "",
      search: "",
      minPrice: "0",
      maxPrice: "",
      sort: "newest",
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-medium mb-6">
        {filters.category
          ? `${categories.find((c) => c.id.toString() === filters.category)?.name || "Category"} Products`
          : filters.search
            ? `Search Results for "${filters.search}"`
            : "All Products"}
      </h1>

      {/* Mobile filter toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between bg-white border border-gray-200 p-3 rounded-md"
        >
          <span className="font-medium">Filters</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 transition-transform ${showFilters ? "transform rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className={`lg:w-1/4 ${showFilters ? "block" : "hidden lg:block"}`}>
          <div className="bg-white p-4 border border-gray-100 rounded-md sticky top-20">
            <h2 className="text-lg font-medium mb-4">Filters</h2>

            {/* Categories Dropdown */}
            <div className="mb-6">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer mb-2">
                  <h3 className="font-medium">Categories</h3>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 transition-transform group-open:rotate-180"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </summary>
                <div className="pl-2 space-y-2 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value=""
                      checked={filters.category === ""}
                      onChange={handleFilterChange}
                      className="mr-2"
                    />
                    All Categories
                  </label>
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value={category.id}
                        checked={filters.category === category.id.toString()}
                        onChange={handleFilterChange}
                        className="mr-2"
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              </details>
            </div>

            {/* Price Range Dropdown */}
            <div className="mb-6">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer mb-2">
                  <h3 className="font-medium">Price Range</h3>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 transition-transform group-open:rotate-180"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </summary>
                <div className="pl-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <span className="text-sm mr-1">₹</span>
                      <input
                        type="number"
                        name="minPrice"
                        placeholder="Min"
                        min="0"
                        value={filters.minPrice}
                        onChange={handleFilterChange}
                        className="w-full px-3 py-1 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
                      />
                    </div>
                    <span>to</span>
                    <div className="flex items-center">
                      <span className="text-sm mr-1">₹</span>
                      <input
                        type="number"
                        name="maxPrice"
                        placeholder="Max"
                        min="0"
                        value={filters.maxPrice}
                        onChange={handleFilterChange}
                        className="w-full px-3 py-1 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              </details>
            </div>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="w-full py-2 border border-gray-900 text-gray-900 rounded-sm hover:bg-gray-900 hover:text-white transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="lg:w-3/4">
          {/* Sort Controls */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-500 text-sm">
              Showing {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
            </p>
            <div className="flex items-center">
              <label className="mr-2 text-sm">Sort by:</label>
              <select
                name="sort"
                value={filters.sort}
                onChange={handleFilterChange}
                className="px-3 py-1 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-md animate-pulse">
                  <div className="aspect-square bg-gray-100"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-100 rounded-sm w-3/4"></div>
                    <div className="h-3 bg-gray-100 rounded-sm w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white border border-gray-100 rounded-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-12 w-12 mx-auto text-gray-400 mb-4"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <h2 className="text-lg font-medium mb-2">No products found</h2>
              <p className="text-gray-500 mb-4">Try adjusting your filters or search criteria</p>
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-gray-900 text-white rounded-sm hover:bg-gray-800 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

