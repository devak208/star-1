"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import axios from "axios"

export default function Banner() {
  const [banners, setBanners] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    // Fetch banners from API
    const fetchBanners = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/banners`)

        // Check if we got valid data
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setBanners(response.data)
        } else {
          // Use fallback banners if API returns empty array
          console.log("No banners found from API")
          setError("No banners available")
        }
      } catch (err) {
        console.error("Error fetching banners:", err)
        setError("Failed to load banners")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBanners()
  }, [])

  useEffect(() => {
    // Auto-rotate banners
    if (banners.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length)
      }, 5000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [banners.length])

  const goToSlide = (index) => {
    setCurrentIndex(index)
    // Reset timer when manually changing slides
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length)
    }, 5000)
  }

  if (isLoading) {
    return <div className="relative overflow-hidden rounded-lg bg-gray-100 h-[350px]"></div>
  }

  if (error && banners.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center h-[350px]">
        <p className="text-gray-400">No banners available</p>
      </div>
    )
  }

  if (banners.length === 0) {
    return null
  }

  return (
    <div className="relative overflow-hidden rounded-lg shadow-sm">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner) => (
          <div key={banner.id} className="min-w-full">
            <Link to={banner.link || "#"} className="block relative">
              <img
                src={banner.image || "/placeholder.svg"}
                alt={banner.title}
                className="w-full h-[350px] object-cover"
                onError={(e) => {
                  e.target.src = "/placeholder.svg?height=350&width=1200"
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent flex flex-col justify-end p-8 text-white">
                <h2 className="text-3xl font-light mb-2">{banner.title}</h2>
                
                <span className="inline-flex items-center w-[150px] bg-white text-gray-900 px-6 py-2 rounded-sm font-medium transition-all hover:bg-gray-100">
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
                </span>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Navigation dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? "bg-white w-4" : "bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Arrow navigation */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => goToSlide((currentIndex - 1 + banners.length) % banners.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            aria-label="Previous slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => goToSlide((currentIndex + 1) % banners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            aria-label="Next slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}

