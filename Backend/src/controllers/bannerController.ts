import type { Request, Response } from "express"
import { promises as fs } from "fs"
import * as path from "path"
import prisma from "../lib/prisma"
import type { BannerCreateInput, BannerUpdateInput, FileRequest } from "../types/index"

// Get all banners
export const getAllBanners = async (req: Request, res: Response) => {
  try {
    const banners = await prisma.banner.findMany()

    // Append full image URL for response
    const bannersWithImageUrl = banners.map((banner) => ({
      ...banner,
      image: banner.image ? `${req.protocol}://${req.get("host")}/uploads/${banner.image}` : null,
    }))

    res.json(bannersWithImageUrl)
  } catch (error) {
    res.status(500).json({ message: (error as Error).message })
  }
}

// Create a new banner
export const createBanner = async (req: FileRequest, res: Response) => {
  console.log("Request body:", req.body)
  console.log("Uploaded file:", req.file)

  const { title, link } = req.body as BannerCreateInput
  let image: string | null = null

  // If a new file was uploaded, use its filename
  if (req.file) {
    image = req.file.filename
  }
  // Otherwise, if an image URL was sent in the body, extract the filename
  else if (req.body.image) {
    const parts = req.body.image.toString().split("/")
    image = parts[parts.length - 1]
  }

  try {
    const banner = await prisma.banner.create({
      data: {
        title: title as string,
        link: link || null,
        image,
      },
    })

    res.status(201).json({
      ...banner,
      image: image ? `${req.protocol}://${req.get("host")}/uploads/${image}` : null,
    })
  } catch (error) {
    console.error("Error in createBanner:", error)
    res.status(500).json({ message: (error as Error).message })
  }
}

// Delete a banner
export const deleteBanner = async (req: Request, res: Response) => {
  try {
    // Fetch the banner image filename before deleting
    const banner = await prisma.banner.findUnique({
      where: { id: Number.parseInt(req.params.id) },
    })

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" })
    }

    // Delete the image file from uploads
    if (banner.image) {
      const imagePath = path.join(__dirname, "../../uploads", banner.image)
      // Only delete if we're not keeping this image for another banner
      const keepImage = req.query.keepImage === "true"
      if (!keepImage) {
        try {
          await fs.access(imagePath)
          await fs.unlink(imagePath)
        } catch (err) {
          console.error("Failed to delete image:", err)
        }
      }
    }

    // Delete the banner record from the database
    await prisma.banner.delete({
      where: { id: Number.parseInt(req.params.id) },
    })

    res.json({ message: "Banner deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: (error as Error).message })
  }
}

// Update a banner
export const updateBanner = async (req: FileRequest, res: Response) => {
  console.log("Update request body:", req.body)
  console.log("Uploaded file:", req.file)

  const { title, link } = req.body as BannerUpdateInput
  let image: string | null = null

  // If a new file is uploaded, use its filename
  if (req.file) {
    image = req.file.filename

    // Optionally: Delete the old image file if it exists
    const oldBanner = await prisma.banner.findUnique({
      where: { id: Number.parseInt(req.params.id) },
    })

    if (oldBanner?.image) {
      const oldImagePath = path.join(__dirname, "../../uploads", oldBanner.image)
      try {
        await fs.access(oldImagePath)
        await fs.unlink(oldImagePath)
      } catch (err) {
        console.error("Failed to delete old image:", err)
      }
    }
  }
  // Otherwise, if no new file, extract the filename from the image URL sent in the body
  else if (req.body.image) {
    const parts = req.body.image.toString().split("/")
    image = parts[parts.length - 1]
  }

  try {
    const updatedBanner = await prisma.banner.update({
      where: { id: Number.parseInt(req.params.id) },
      data: {
        title: title as string,
        link: link || undefined,
        image: image || undefined,
      },
    })

    res.status(200).json({
      message: "Banner updated successfully",
      banner: {
        ...updatedBanner,
        image: updatedBanner.image ? `${req.protocol}://${req.get("host")}/uploads/${updatedBanner.image}` : null,
      },
    })
  } catch (error) {
    console.error("Error updating banner:", error)
    res.status(500).json({ message: (error as Error).message })
  }
}

