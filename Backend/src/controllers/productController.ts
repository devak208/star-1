import type { Request, Response } from "express"
import * as fs from "fs"
import * as path from "path"
import { PrismaClient } from "@prisma/client"
import type { FileRequest, ProductCreateInput, ProductUpdateInput } from "../types/index.js"

// Get all products
// Redis caching removed

const prisma = new PrismaClient()

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    console.time('products-fetch'); // Add timing
    
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        image: true,
        stock: true,
        weight: true,
        qty: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 20, // Limit initial load
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.timeEnd('products-fetch'); // Log timing
    return res.json(products);
    
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
}


// Get products by category
export const getProductsByCategory = async (req: Request, res: Response) => {
  const categoryId = req.params.categoryId;
  try {
  // Caching removed

    const products = await prisma.product.findMany({
      where: { categoryId: Number.parseInt(categoryId) },
    });

  // Caching removed

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching products by category",
      error: (error as Error).message,
    });
  }
};


// Get product by ID
export const getProductById = async (req: Request, res: Response) => {
  const productId = req.params.id;
  try {
  // Always get fresh data
    const product = await prisma.product.findUnique({
      where: { id: Number.parseInt(productId) },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

  // Caching removed

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching product details",
      error: (error as Error).message,
    });
  }
};


// Create product
export const createProduct = async (req: FileRequest, res: Response) => {
  console.log("🛠️ Raw Body:", req.body)
  console.log("🖼️ Uploaded Files:", req.files)

  // Extract data from form fields
  let { name, price, description, stock, categoryId, weight, qty } = req.body as unknown as ProductCreateInput
  // Cache invalidation removed

  // Clean up string values if needed
  if (name && typeof name === "string") name = name.replace(/^"|"$/g, "")
  if (description && typeof description === "string") description = description.replace(/^"|"$/g, "")

  // Gather file names from req.files array (if any)
  const images = req.files ? req.files.map((file) => file.filename) : []

  // Validate required fields
  if (!name || !price || !description || !stock || !categoryId) {
    return res.status(400).json({
      message: "All fields are required",
      received: { name, price, description, stock, categoryId, weight, qty },
    })
  }

  try {
    const product = await prisma.product.create({
      data: {
        name: name as string,
        price: Number(price),
        description: description as string,
        stock: Number(stock),
        categoryId: Number(categoryId),
        weight: Number(weight) || 0,
        qty: Number(qty) || 0,
        image: images,
      },
    })

    res.status(201).json({
      ...product,
      imageUrl: images.length ? images.map((img) => `/uploads/${img}`) : null,
    })
  } catch (error) {
    res.status(500).json({
      message: "Error creating product",
      error: (error as Error).message,
    })
  }
}

// Update product
export const updateProduct = async (req: FileRequest, res: Response) => {
  console.log("🛠️ Update Raw Body:", req.body)

  let { name, price, description, stock, categoryId, weight, qty, imagesToRemove } =
    req.body as unknown as ProductUpdateInput
  // Cache invalidation removed


  // Clean up string values if needed
  if (name && typeof name === "string") name = name.replace(/^"|"$/g, "")
  if (description && typeof description === "string") description = description.replace(/^"|"$/g, "")

  // Parse imagesToRemove if it's a string
  if (typeof imagesToRemove === "string") {
    try {
      imagesToRemove = JSON.parse(imagesToRemove)
    } catch (e) {
      console.error("Error parsing imagesToRemove:", e)
      imagesToRemove = []
    }
  }

  // Gather new images if any
  const newImages = req.files ? req.files.map((file) => file.filename) : []

  // Validate required fields
  if (!name || !price || !description || !stock || !categoryId) {
    return res.status(400).json({
      message: "All fields are required",
      received: { name, price, description, stock, categoryId, weight, qty },
    })
  }

  try {
    // First, get the current product to access its images
    const currentProduct = await prisma.product.findUnique({
      where: { id: Number.parseInt(req.params.id) },
    })

    if (!currentProduct) {
      return res.status(404).json({ message: "Product not found" })
    }

    let currentImages = currentProduct.image || []

    // Remove images that should be deleted
    if (imagesToRemove && imagesToRemove.length > 0) {
      // Filter out images that should be removed
      currentImages = currentImages.filter((img) => !imagesToRemove.includes(img))

      // Delete the actual image files
      imagesToRemove.forEach((filename: string) => {
        const filePath = path.join(__dirname, "../../uploads", filename)
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
            console.log(`Deleted image: ${filename}`)
          }
        } catch (err) {
          console.error(`Error deleting image ${filename}:`, err)
        }
      })
    }

    // Combine existing images with new ones
    const updatedImages = [...currentImages, ...newImages]

    // Limit to 4 images if there are more
    const finalImages = updatedImages.slice(0, 4)

    // Update the product in the database
    const product = await prisma.product.update({
      where: { id: Number.parseInt(req.params.id) },
      data: {
        name: name as string,
        price: Number(price),
        description: description as string,
        stock: Number(stock),
        categoryId: Number(categoryId),
        weight: Number(weight) || 0,
        qty: Number(qty) || 0,
        image: finalImages,
      },
    })

    res.json({
      message: "Product updated successfully",
      product: {
        ...product,
        imageUrl: finalImages.length ? finalImages.map((img) => `/uploads/${img}`) : undefined,
      },
    })
  } catch (error) {
    res.status(500).json({
      message: "Error updating product",
      error: (error as Error).message,
    })
  }
}

// Delete product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    // First, get the product to access its images
    
    const product = await prisma.product.findUnique({
      where: { id: Number.parseInt(req.params.id) },
    })
  // Cache invalidation removed


    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Delete the product from the database
    await prisma.product.delete({
      where: { id: Number.parseInt(req.params.id) },
    })

    // Delete associated image files
    const images = product.image || []

    // Delete each image file
    images.forEach((filename) => {
      const filePath = path.join(__dirname, "../../uploads", filename)
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
          console.log(`Deleted image: ${filename}`)
        }
      } catch (err) {
        console.error(`Error deleting image ${filename}:`, err)
      }
    })

    res.json({ message: "Product deleted successfully" })
  } catch (error) {
    res.status(500).json({
      message: "Error deleting product",
      error: (error as Error).message,
    })
  }
}

