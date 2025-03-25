import { Router } from 'express';
import { authenticateUser } from '../../middleware/AuthMiddleware/authMiddleware';
import { getAllUsers, getUserDetails } from '../../controllers/AdminControllers/adminUserController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Get all users
router.get('/users', getAllUsers);

// Get specific user details
router.get('/users/:id', getUserDetails);

export default router; 