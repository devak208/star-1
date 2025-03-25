import { Router } from "express"
import * as cartController from "../controllers/CartControllers"
import { authenticateUser } from '../middleware/AuthMiddleware/authMiddleware';

const router = Router()

// Apply authentication middleware to all cart routes
router.use(authenticateUser)

// Cart routes
router.get("/", cartController.getCart)
router.post("/add", cartController.addToCart)
router.put("/item/:cartItemId", cartController.updateCartItem)
router.delete("/item/:cartItemId", cartController.removeFromCart)
router.delete("/clear", cartController.clearCart)

export default router

