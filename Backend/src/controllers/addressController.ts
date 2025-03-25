import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ICreateAddressDto, IUpdateAddressDto } from '../interfaces/address.interface';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

class AddressController {
  // Create a new address
  public async createAddress(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const userId = req.user.id;
      const addressData: ICreateAddressDto = req.body;
      
      // Remove id field if it exists in the input data to let Prisma auto-generate it
      if ('id' in addressData) {
        delete addressData.id;
      }

      // If this is the first address or isDefault is true, set it as default
      const existingAddresses = await prisma.address.findMany({ where: { userId } });
      if (existingAddresses.length === 0 || addressData.isDefault) {
        // Set all other addresses to non-default
        if (existingAddresses.length > 0) {
          await prisma.address.updateMany({
            where: { userId },
            data: { isDefault: false }
          });
        }
        addressData.isDefault = true;
      }

      const address = await prisma.address.create({
        data: {
          ...addressData,
          userId
        }
      });

      res.status(201).json(address);
    } catch (error) {
      console.error('Create address error:', error);
      res.status(500).json({ error: 'Failed to create address' });
    }
  }

  // Get all addresses for a user
  public async getUserAddresses(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const userId = req.user.id;
      const addresses = await prisma.address.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      res.json(addresses);
    } catch (error) {
      console.error('Get addresses error:', error);
      res.status(500).json({ error: 'Failed to get addresses' });
    }
  }

  // Update an address
  public async updateAddress(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const userId = req.user.id;
      const addressData: IUpdateAddressDto = req.body;

      // Check if address exists and belongs to user
      const existingAddress = await prisma.address.findFirst({
        where: { id, userId }
      });

      if (!existingAddress) {
        res.status(404).json({ error: 'Address not found' });
        return;
      }

      // If setting as default, update other addresses
      if (addressData.isDefault) {
        await prisma.address.updateMany({
          where: { userId },
          data: { isDefault: false }
        });
      }

      const address = await prisma.address.update({
        where: { id },
        data: addressData
      });

      res.json(address);
    } catch (error) {
      console.error('Update address error:', error);
      res.status(500).json({ error: 'Failed to update address' });
    }
  }

  // Delete an address
  public async deleteAddress(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const userId = req.user.id;

      // Check if address exists and belongs to user
      const existingAddress = await prisma.address.findFirst({
        where: { id, userId }
      });

      if (!existingAddress) {
        res.status(404).json({ error: 'Address not found' });
        return;
      }

      await prisma.address.delete({
        where: { id }
      });

      // If deleted address was default and other addresses exist, set another as default
      if (existingAddress.isDefault) {
        const otherAddress = await prisma.address.findFirst({
          where: { userId }
        });

        if (otherAddress) {
          await prisma.address.update({
            where: { id: otherAddress.id },
            data: { isDefault: true }
          });
        }
      }

      res.json({ message: 'Address deleted successfully' });
    } catch (error) {
      console.error('Delete address error:', error);
      res.status(500).json({ error: 'Failed to delete address' });
    }
  }

  // Set an address as default
  public async setDefaultAddress(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const userId = req.user.id;

      // Check if address exists and belongs to user
      const existingAddress = await prisma.address.findFirst({
        where: { id, userId }
      });

      if (!existingAddress) {
        res.status(404).json({ error: 'Address not found' });
        return;
      }

      // Set all addresses to non-default
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      });

      // Set the selected address as default
      const address = await prisma.address.update({
        where: { id },
        data: { isDefault: true }
      });

      res.json(address);
    } catch (error) {
      console.error('Set default address error:', error);
      res.status(500).json({ error: 'Failed to set default address' });
    }
  }
}

export default new AddressController(); 