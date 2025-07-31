/**
 * Authentication Middleware
 * Protects routes that require user authentication
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "../storage";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    user: any;
  };
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header or cookie
    let token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      // Try to get from cookie if header doesn't exist
      token = req.cookies?.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Token de acesso requerido" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // Get fresh user data
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }

    // Add user info to request
    (req as any).user = {
      userId: user.id,
      user: user,
    };

    next();

  } catch (error: any) {
    console.error("Auth middleware error:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Token inválido" });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expirado" });
    }
    
    res.status(500).json({ message: "Erro de autenticação" });
  }
}

// Check subscription status
export async function checkSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user.user;
    
    // Check if trial has expired
    if (user.subscriptionStatus === 'trial' && user.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(user.trialEndsAt);
      
      if (now > trialEnd) {
        // Update status to expired
        await storage.updateSubscriptionStatus(user.id, 'expired');
        return res.status(402).json({ 
          message: "Período de teste expirou. Assine para continuar usando.",
          subscriptionRequired: true 
        });
      }
    }
    
    // Check if subscription is active
    if (user.subscriptionStatus === 'expired' || user.subscriptionStatus === 'canceled') {
      return res.status(402).json({ 
        message: "Assinatura necessária para acessar este recurso.",
        subscriptionRequired: true 
      });
    }
    
    next();

  } catch (error) {
    console.error("Subscription check error:", error);
    res.status(500).json({ message: "Erro ao verificar assinatura" });
  }
}

// Optional authentication (doesn't fail if no token)
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    let token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      token = req.cookies?.token;
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await storage.getUser(decoded.userId);
      
      if (user) {
        (req as any).user = {
          userId: user.id,
          user: user,
        };
      }
    }

    next();

  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
}