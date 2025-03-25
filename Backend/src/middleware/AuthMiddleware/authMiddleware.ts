import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../../config/db';
import { generateTokens } from '../../controllers/AuthControllers/authController';

// Get secrets from environment variables or use defaults as fallback
const JWT_SECRET = process.env.JWT_SECRET || 'star_ecommerce_jwt_secret_key_2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'star_ecommerce_jwt_refresh_secret_key_2024';

console.log('JWT_SECRET available:', !!JWT_SECRET);
console.log('JWT_REFRESH_SECRET available:', !!JWT_REFRESH_SECRET);

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    provider: string;
  };
}

export const authenticateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    console.log('Incoming cookies:', req.cookies);

    if (!accessToken && !refreshToken) {
      return res.status(401).json({ error: "Unauthorized! No token provided." });
    }

    if (accessToken) {
      try {
        if (!JWT_SECRET) {
          console.error('JWT_SECRET is not defined');
          return res.status(500).json({ error: "Server configuration error" });
        }

        const decoded = jwt.verify(accessToken, JWT_SECRET) as { id: string };
        
        console.log('Access token verified successfully for user:', decoded.id);
        
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
          console.log('User not found with id:', decoded.id);
          return res.status(401).json({ error: "User not found" });
        }

        req.user = user;
        return next();
      } catch (error) {
        console.log("Access Token Error:", error);
        // Continue to refresh token logic if access token is invalid
      }
    }

    if (refreshToken) {
      try {
        if (!JWT_REFRESH_SECRET) {
          console.error('JWT_REFRESH_SECRET is not defined');
          return res.status(500).json({ error: "Server configuration error" });
        }

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string };
        console.log('Refresh token verified successfully for user:', decoded.id);
        
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(decoded.id);
        
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
          console.log('User not found with id:', decoded.id);
          return res.status(401).json({ error: "User not found" });
        }
        
        // Set new cookies
        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: "lax",
          maxAge: 15 * 60 * 1000, // 15 minutes
          path: "/"
        });
        
        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: "/"
        });
        
        req.user = user;
        return next();
      } catch (error) {
        console.log("Refresh token expired or invalid:", error);
        // Clear cookies on failed refresh
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.status(403).json({ error: "Invalid or expired refresh token!" });
      }
    }

    return res.status(401).json({ error: "Unauthorized! No valid token provided." });
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Internal server error during authentication" });
  }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied, admin privileges required' });
  }
}; 