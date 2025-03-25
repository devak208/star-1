// src/routes/auth/authRoutes.ts
import { Router } from 'express';
import passport from '../../config/passport';
import { generateTokens, registerUser, signInUser } from '../../controllers/AuthControllers/authController';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';

const router = Router();
const prisma = new PrismaClient();

const API_URL = process.env.API_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

axios.defaults.withCredentials = true; // Ensure cookies are sent with requests

// Initialize OAuth2Client with credentials
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${API_URL}/auth/google/callback`
);

// Manual authentication routes
router.post("/register", registerUser);
router.post("/signin", signInUser);
router.post("/login", signInUser); // Alias for signin

// Google Auth Routes
router.get("/google", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email']
  });
  res.redirect(authUrl);
});

// Google callback route
router.get("/google/callback", async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    console.log("📩 Received Google callback with code:", code);

    if (!code) {
      console.error("❌ No code provided in Google callback");
      return res.redirect(`${FRONTEND_URL}/login?error=no_code`);
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    console.log("✅ Got tokens from Google");

    // Get user profile from Google
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      console.error("❌ No payload in Google token");
      return res.redirect(`${FRONTEND_URL}/login?error=invalid_token`);
    }

    console.log("👤 Google user profile:", {
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    });

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: payload.email }
    });

    if (!user) {
      console.log("👤 Creating new user from Google profile");
      // Create new user
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name || "",
          password: "", // No password for Google users
          provider: "google",
          role: "user",
          phone: "",
          address: {} 
        }
      });
      console.log("✅ Created new user:", user.id);
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user.id);

    // Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/",
      domain: process.env.NODE_ENV === "production" ? process.env.DOMAIN : undefined
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
      domain: process.env.NODE_ENV === "production" ? process.env.DOMAIN : undefined
    });

    console.log("✅ Set cookies for user:", user.id);

    // Redirect to frontend with user data
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const encodedUserData = encodeURIComponent(JSON.stringify(userData));
    res.redirect(`${FRONTEND_URL}/login?user=${encodedUserData}`);
  } catch (error) {
    console.error("❌ Google callback error:", error);
    res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
  }
});

// Refresh token route
router.post("/refresh-token", async (req: Request, res: Response) => {
  try {
    // Get refresh token from cookies
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      console.error("❌ No refresh token found in cookies");
      // Clear any existing cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.status(401).json({ error: "No refresh token provided" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) as any;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      console.error("❌ User not found for refresh token");
      // Clear any existing cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);

    // Clear existing cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    // Set new cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/",
      domain: process.env.NODE_ENV === "production" ? process.env.DOMAIN : undefined
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
      domain: process.env.NODE_ENV === "production" ? process.env.DOMAIN : undefined
    });

    console.log("✅ Tokens refreshed successfully for user:", user.id);
    return res.status(200).json({ message: "Tokens refreshed successfully" });
  } catch (error) {
    console.error("❌ Error refreshing token:", error);
    // Clear cookies on error
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});

// Logout routes
router.post("/logout", (req: Request, res: Response) => {
  // Clear all auth cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
});

// Alias for logout
router.post("/signout", (req: Request, res: Response) => {
  // Clear all auth cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
});

const getCurrentUser = async () => {
  try {
    const response = await axios.get(`${API_URL}/user/profile`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

export default router;
