import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { AuthRequest } from '../../middleware/AuthMiddleware/authMiddleware';
import { User, Address } from '@prisma/client';

// Define the type for the user data with addresses
type UserWithAddresses = User & {
  addresses: Address[];
  phoneNumber?: string;
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    
    if (!user || !user.id) {
      console.error("User not found in request:", user);
      return res.status(404).json({ error: "User not found!" });
    }
    
    console.log("Getting profile for user ID:", user.id);
    
    // Get user data with addresses
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        addresses: true
      }
    }) as UserWithAddresses | null;
    
    if (!userData) {
      return res.status(404).json({ error: "User not found in database!" });
    }
    
    // Return user data including addresses
    res.json({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      provider: userData.provider,
      phone: userData.phoneNumber,
      role: userData.role,
      addresses: userData.addresses
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Unable to fetch user details!" });
  }
};

