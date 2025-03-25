import type { Request, Response } from "express"
import prisma from "../lib/prisma"
import type { CategoryCreateInput, CategoryUpdateInput, FileRequest } from "../types/index"

// Get all categories
export const getAllCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany()
    res.json(categories)
  } catch (error) {
    res.status(500).json({ message: (error as Error).message })
  }
}

// Create a new category
export const createCategory = async (req: FileRequest, res: Response) => {
  const { name } = req.body as CategoryCreateInput
  // Use the uploaded file's filename, if available
  const image = req.file ? req.file.filename : null

  try {
    const category = await prisma.category.create({
      data: {
        name: name as string,
        image,
      },
    })

    res.status(201).json(category)
  } catch (error) {
    res.status(500).json({ message: (error as Error).message })
  }
}

// Update a category
export const updateCategory = async (req: FileRequest, res: Response) => {
  const { name } = req.body as CategoryUpdateInput
  const image = req.file ? req.file.filename : undefined

  try {
    const category = await prisma.category.update({
      where: { id: Number.parseInt(req.params.id) },
      data: {
        name: name as string,
        image: image,
      },
    })

    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    res.json({ message: "Category updated successfully", category })
  } catch (error) {
    res.status(500).json({ message: (error as Error).message })
  }
}

// Delete a category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.delete({
      where: { id: Number.parseInt(req.params.id) },
    })

    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    res.json({ message: "Category deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: (error as Error).message })
  }
}

