/**
 * Authentication Controller
 * 
 * Environment Variables Required:
 * - JWT_SECRET: Secret key for JWT token signing
 * - GOOGLE_CLIENT_ID: Google OAuth client ID
 * - GOOGLE_CLIENT_SECRET: Google OAuth client secret
 * - GOOGLE_REDIRECT_URI: Google OAuth redirect URI (e.g., http://localhost:5000/api/auth/google/callback)
 */

import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { storage } from "../storage";
import { registerSchema, loginSchema, type RegisterData, type LoginData } from "@shared/schema";
import { randomBytes } from "crypto";

// Initialize Google OAuth client
const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/auth/google/callback"
) : null;

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

// Generate access key
function generateAccessKey(): string {
  return randomBytes(16).toString('hex');
}

// Generate JWT token
function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Register with email/password
export async function register(req: Request, res: Response) {
  try {
    const validatedData = registerSchema.parse(req.body) as RegisterData;
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: "Email já está em uso" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    
    // Generate access key
    const accessKey = generateAccessKey();

    // Create user
    const user = await storage.createUser({
      email: validatedData.email,
      password: hashedPassword,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      companyName: validatedData.companyName,
      accessKey,
      // Set trial period (7 days)
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.status(201).json({
      message: "Usuário criado com sucesso",
      user: userWithoutPassword,
      token,
      accessKey: user.accessKey,
    });

  } catch (error: any) {
    console.error("Register error:", error);
    
    if (error.issues) {
      return res.status(400).json({ 
        message: "Dados inválidos", 
        errors: error.issues.map((issue: any) => issue.message) 
      });
    }
    
    res.status(500).json({ message: "Erro interno do servidor" });
  }
}

// Login with email/password
export async function login(req: Request, res: Response) {
  try {
    const validatedData = loginSchema.parse(req.body) as LoginData;
    
    // Find user by email
    const user = await storage.getUserByEmail(validatedData.email);
    if (!user || !user.password) {
      return res.status(401).json({ message: "Email ou senha inválidos" });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Email ou senha inválidos" });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({
      message: "Login realizado com sucesso",
      user: userWithoutPassword,
      token,
    });

  } catch (error: any) {
    console.error("Login error:", error);
    
    if (error.issues) {
      return res.status(400).json({ 
        message: "Dados inválidos", 
        errors: error.issues.map((issue: any) => issue.message) 
      });
    }
    
    res.status(500).json({ message: "Erro interno do servidor" });
  }
}

// Google OAuth - Get auth URL
export async function googleAuth(req: Request, res: Response) {
  try {
    if (!googleClient) {
      return res.status(503).json({ 
        message: "Google OAuth não configurado. Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET" 
      });
    }

    const authUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['email', 'profile'],
      prompt: 'consent',
    });

    res.json({ authUrl });

  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ message: "Erro ao iniciar autenticação Google" });
  }
}

// Google OAuth - Handle callback
export async function googleCallback(req: Request, res: Response) {
  try {
    if (!googleClient) {
      return res.status(503).json({ 
        message: "Google OAuth não configurado" 
      });
    }

    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ message: "Código de autorização não fornecido" });
    }

    // Exchange code for tokens
    const { tokens } = await googleClient.getTokens(code as string);
    googleClient.setCredentials(tokens);

    // Get user info from Google
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Não foi possível obter informações do Google" });
    }

    // Check if user exists
    let user = await storage.getUserByEmail(payload.email);
    
    if (!user) {
      // Create new user
      const accessKey = generateAccessKey();
      
      user = await storage.createUser({
        email: payload.email,
        googleId: payload.sub,
        firstName: payload.given_name || "Usuário",
        lastName: payload.family_name || "Google",
        profileImageUrl: payload.picture,
        accessKey,
        // Set trial period (7 days)
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    } else if (!user.googleId) {
      // Link existing account with Google
      user = await storage.updateUser(user.id, {
        googleId: payload.sub,
        profileImageUrl: payload.picture,
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    // Redirect to frontend with token
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? `${req.protocol}://${req.get('host')}` 
      : 'http://localhost:5000';
    
    res.redirect(`${frontendUrl}?token=${token}&user=${encodeURIComponent(JSON.stringify(userWithoutPassword))}`);

  } catch (error) {
    console.error("Google callback error:", error);
    res.status(500).json({ message: "Erro na autenticação Google" });
  }
}

// Get current user (protected route)
export async function getCurrentUser(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.json({ user: userWithoutPassword });

  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Erro ao buscar usuário" });
  }
}

// Logout (client-side token removal, no server action needed)
export async function logout(req: Request, res: Response) {
  res.json({ message: "Logout realizado com sucesso" });
}