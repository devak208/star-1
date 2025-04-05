import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../../config/db';
import { AuthRequest } from '../../middleware/AuthMiddleware/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'star_ecommerce_jwt_secret_key_2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'star_ecommerce_jwt_refresh_secret_key_2024';

export const generateTokens = (user: string | { id: string }) => {
  // Handle both string userId and user object
  const userId = typeof user === 'string' ? user : user.id;
  
  console.log(`Generating tokens for user ID: ${userId}`);
  
  if (!userId) {
    throw new Error('User ID is required to generate tokens');
  }
  
  if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    console.error('JWT secrets not properly set up');
    throw new Error('Server configuration error: JWT secrets not set');
  }
  
  const accessToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
  
  return { accessToken, refreshToken };
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, provider = "CREDENTIALS", role } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Properly handle role assignment
    let assignedRole;
    try {
      assignedRole = role === "ADMIN" ? "ADMIN" : "USER";
      console.log('Role from request:', role);
      console.log('Assigned role:', assignedRole);
    } catch (error) {
      console.error('Error assigning role:', error);
      assignedRole = "USER";
    }

    const newUser = await prisma.user.create({
      data: { 
        name, 
        email, 
        password: hashedPassword, 
        provider, 
        role: assignedRole 
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        provider: true,
        addresses: true,
        cart: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    const { accessToken, refreshToken } = generateTokens(newUser.id);

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "lax",
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: "/"
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/"
      })
      .json({ 
        message: "Registration successful!", 
        user: newUser 
      });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Something went wrong during registration!" });
  }
};

export const signInUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required!" });
    }

    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        provider: true,
        addresses: true,
        cart: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials!" });
    }

    if (user.provider !== "CREDENTIALS") {
      return res.status(400).json({ error: "Please sign in with Google!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials!" });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    
    const { password: _, ...safeUser } = user;

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "lax",
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: "/"
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/"
      })
      .json({ 
        message: "Signed in successfully!", 
        user: safeUser 
      });
  } catch (error) {
    console.error("Sign-in Error:", error);
    res.status(500).json({ error: "Something went wrong during sign-in!" });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: "No refresh token provided." });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string };
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.id);

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        provider: true,
        addresses: true,
        cart: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "lax",
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: "/"
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/"
      })
      .json({ user });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(403).json({ error: "Invalid or expired refresh token!" });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        provider: true,
        addresses: true,
        cart: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({ error: "Failed to get user data" });
  }
};

// Update user profile
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, email, phone } = req.body;
    
    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findUnique({ 
        where: { email, NOT: { id: userId } } 
      });
      
      if (existingUser) {
        return res.status(400).json({ error: "Email is already in use" });
      }
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        phoneNumber: phone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        provider: true,
        addresses: true,
        cart: true,
        role: true,
      },
    });
    
    // Transform the response to match the expected format
    const response = {
      ...updatedUser,
      phone: updatedUser.phoneNumber
    };
    delete response.phoneNumber;
    
    res.json(response);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await prisma.user.findUnique({ 
      where: { id: userId } 
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};

// Update address
export const updateAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const addressData = req.body;
    
    // Check if the user has an existing default address
    if (addressData.isDefault) {
      // If this address is being set as default, update existing default addresses to non-default
      await prisma.address.updateMany({
        where: {
          userId: userId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }
    
    // Create a new address for the user
    const newAddress = await prisma.address.create({
      data: {
        fullName: addressData.fullName,
        phone: addressData.phone,
        address: addressData.address,
        city: addressData.city,
        state: addressData.state,
        zipCode: addressData.zipCode,
        country: addressData.country,
        isDefault: addressData.isDefault || false,
        user: {
          connect: { id: userId }
        }
      }
    });
    
    // Get updated user with addresses
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        addresses: true,
        phoneNumber: true,
        provider: true,
        cart: true,
        role: true,
      },
    });
    
    // Transform the response to match the expected format
    const response = {
      ...updatedUser,
      phone: updatedUser?.phoneNumber
    };
    
    // Remove phoneNumber from response if we added phone
    if (response.phoneNumber) {
      delete response.phoneNumber;
    }
    
    res.json(response);
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ error: "Failed to update address" });
  }
};

// Logout user
export const logoutUser = async (req: Request, res: Response) => {
  try {
    // Clear authentication cookies
    res.clearCookie("accessToken", {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
      path: "/"
    });
    
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
      path: "/"
    });
    
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ error: "Something went wrong during logout" });
  }
};