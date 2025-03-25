import { Router } from "express"
import * as productController from "../controllers/productController"
import upload from "../middleware/upload"

const router = Router()

router.get("/", productController.getAllProducts)
router.get("/category/:categoryId", productController.getProductsByCategory)
router.get("/:id", productController.getProductById)
router.post("/", upload.array("image", 4), productController.createProduct)
router.put("/:id", upload.array("image", 4), productController.updateProduct)
router.delete("/:id", productController.deleteProduct)

export default router

