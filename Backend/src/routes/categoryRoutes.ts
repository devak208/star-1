import { Router } from "express"
import * as categoryController from "../controllers/categoryController"
import upload from "../middleware/upload"

const router = Router()

router.get("/", categoryController.getAllCategories)
router.post("/", upload.single("image"), categoryController.createCategory)
router.put("/:id", upload.single("image"), categoryController.updateCategory)
router.delete("/:id", categoryController.deleteCategory)

export default router

