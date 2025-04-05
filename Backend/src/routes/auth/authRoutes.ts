// src/routes/auth/authRoutes.ts
import { Router } from "express";

import {
  registerUser,
  signInUser,
  logoutUser
} from "../../controllers/AuthControllers/authController";



const router = Router();

// Manual authentication routes
router.post("/register", registerUser);
router.post("/login", signInUser); // Alias for signin
router.get("/logout", logoutUser);

export default router;
