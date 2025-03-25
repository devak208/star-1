// src/config/authjsConfig.ts
import * as  auth  from "@auth/express";
import CredentialsProvider from "@auth/core/providers/credentials";
import { prisma } from "./db";
import * as bcrypt from "bcryptjs";

// We also import our token generator for consistency
import { generateTokens } from "../controllers/AuthControllers/authController";

const options = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Use the same logic as your signInUser
        if (!credentials?.email || !credentials.password) {
          throw new Error("Email and password are required");
        }
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) throw new Error("User not found! Please register.");
        if (user.provider !== "credentials") throw new Error("Please sign in with Google!");
        const isMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isMatch) throw new Error("Incorrect password!");
        // Remove password before returning the user
        const { password, ...safeUser } = user;
        return safeUser;
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      // When authorize returns a user, attach the user id to the token.
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Attach the user id from the token into the session
      session.user = { id: token.userId };
      return session;
    }
  },
  secret: process.env.JWT_SECRET || "secret"
};

export const authHandler = auth(options); // This middleware sets up the Auth.js endpoints

export default authHandler;
