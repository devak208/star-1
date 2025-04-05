import { Router } from 'express';
import { authenticateUser } from '../../middleware/AuthMiddleware/authMiddleware';
import { changePassword, updateAddress, updateUserProfile } from '../../controllers/AuthControllers/authController';
import { getUserProfile } from '../../controllers/AuthControllers/userController';

const router = Router();

// Get user profile
router.get('/profile', authenticateUser, getUserProfile);

router.put("/profile", authenticateUser, updateUserProfile);
router.put("/change-password", authenticateUser, changePassword);
router.put("/address", authenticateUser, updateAddress);

export default router;
