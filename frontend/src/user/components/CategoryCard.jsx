"use client"

import { useState } from "react"
import { Link } from "react-router-dom"

export default function CategoryCard({ category }) {
  // Local state to detect a load error for the background image
  const [imageError, setImageError] = useState(false)

  // Determine the image URL or a placeholder if there's an error/no image
  const getImageSrc = () => {
    if (imageError || !category.image) {
      return "/placeholder.svg?height=200&width=200"
    }
    if (category.image.startsWith("http")) {
      return category.image
    } else {
      return `${import.meta.env.VITE_API_URL}/uploads/${category.image}`
    }
  }

  // We'll use a hidden <img> to detect load errors on background images
  const handleImgError = () => {
    setImageError(true)
  }

  // Compute the final background image URL
  const backgroundImage = getImageSrc()

  return (
    <Link to={`/products?category=${category.id}`} className="block group">
      {/* Hidden <img> to detect errors (background images don’t have onError) */}
      <img
        src={backgroundImage}
        alt=""
        className="hidden"
        onError={handleImgError}
      />

      <div
        className="relative h-48 w-full rounded-md overflow-hidden border border-gray-100 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      >
        {/* Dark overlay + category name */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <h3 className="text-xl font-semibold text-white group-hover:text-gray-200">
            {category.name}
          </h3>
        </div>
      </div>
    </Link>
  )
}
