import type { Banner, Category, Product } from "@prisma/client"
import type { Request, Express } from "express"

// File upload request extension
export interface FileRequest extends Request {
  file?: Express.Multer.File
  files?: Express.Multer.File[]
}

// Banner types
export type BannerCreateInput = Pick<Banner, "title" | "link"> & {
  image?: string
}

export type BannerUpdateInput = Partial<BannerCreateInput>

// Category types
export type CategoryCreateInput = Pick<Category, "name"> & {
  image?: string
}

export type CategoryUpdateInput = Partial<CategoryCreateInput>

// Product types
export type ProductCreateInput = Omit<Product, "id" | "createdAt" | "updatedAt" | "image"> & {
  image?: string[]
}

export type ProductUpdateInput = Partial<Omit<ProductCreateInput, "categoryId">> & {
  categoryId?: number
  imagesToRemove?: string[]
}

