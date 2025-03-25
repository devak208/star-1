import { Router } from 'express';
import addressController from '../controllers/addressController';
import { authenticateUser } from '../middleware/AuthMiddleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { createAddressSchema, updateAddressSchema } from '../validators/addressValidator';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateUser);

// Create a new address
router.post(
  '/',
  validateRequest(createAddressSchema),
  addressController.createAddress
);

// Get all addresses for the current user
router.get('/', addressController.getUserAddresses);

// Update an address
router.put(
  '/:id',
  validateRequest(updateAddressSchema),
  addressController.updateAddress
);

// Delete an address
router.delete('/:id', addressController.deleteAddress);

// Set an address as default
router.patch('/:id/default', addressController.setDefaultAddress);

export default router; 