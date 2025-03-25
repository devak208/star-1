import { Router } from "express"
import * as bannerController from "../controllers/bannerController"
import upload from "../middleware/upload"

const router = Router()

router.get("/", bannerController.getAllBanners)
router.post("/", upload.single("image"), bannerController.createBanner)
router.delete("/:id", bannerController.deleteBanner)
router.put("/:id", upload.single("image"), bannerController.updateBanner)

export default router

