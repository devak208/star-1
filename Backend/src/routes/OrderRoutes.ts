import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { authenticateUser, AuthRequest } from '../middleware/AuthMiddleware/authMiddleware';
import { 
  getAllOrders, 
  getAdminOrderById, 
  updateOrderStatus, 
  createOrder, 
  getUserOrders, 
  getOrderById,
  cancelOrder,
  trackOrder
} from '../controllers/OrderControllers';

const router = Router();

// Helper to convert controller functions to express middleware
const wrapController = (controller: (req: AuthRequest, res: Response) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return controller(req as AuthRequest, res).catch(next);
  };
};

// Admin Routes - Place these first to avoid conflicts with other routes
// Get all orders (admin only)
router.get('/admin/all', authenticateUser, wrapController(getAllOrders));

// Get single order by ID (admin only)
router.get('/admin/:id', authenticateUser, wrapController(getAdminOrderById));

// Update order status (admin only)
router.patch('/admin/:id/status', authenticateUser, wrapController(updateOrderStatus));

// Regular user routes
// Create new order
router.post('/', authenticateUser, wrapController(createOrder));

// Get all orders for the current user
router.get('/', authenticateUser, wrapController(getUserOrders));

// Get single order by ID
router.get('/:id', authenticateUser, wrapController(getOrderById));

// Cancel an order
router.patch('/:id/cancel', authenticateUser, wrapController(cancelOrder));

// Track order status
router.get('/:id/track', authenticateUser, wrapController(trackOrder));

export default router;