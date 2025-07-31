/**
 * Application Routes
 * 
 * Environment Variables Required:
 * - JWT_SECRET: Secret key for JWT token signing
 * - GOOGLE_CLIENT_ID: Google OAuth client ID
 * - GOOGLE_CLIENT_SECRET: Google OAuth client secret
 * - GOOGLE_REDIRECT_URI: Google OAuth redirect URI
 * - STRIPE_SECRET_KEY: Stripe secret key for payments
 * - STRIPE_WEBHOOK_SECRET: Stripe webhook secret for signature verification
 * - VITE_STRIPE_PUBLIC_KEY: Stripe publishable key (for frontend)
 */

import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";

// Controllers
import * as authController from "./controllers/authController";
import * as stripeController from "./controllers/stripeController";

// Middleware
import { authenticateToken, checkSubscription, optionalAuth } from "./middleware/auth";

// Storage and utilities
import { storage } from "./storage";
import { insertEmployeeSchema, insertTrainingSchema } from "@shared/schema";
import { setupCronJobs } from "./cronJobs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cookie parser for JWT tokens
  app.use(cookieParser());

  // Start cron jobs for email alerts
  setupCronJobs();

  // ===== AUTHENTICATION ROUTES =====
  
  // Traditional auth
  app.post('/api/auth/register', authController.register);
  app.post('/api/auth/login', authController.login);
  app.post('/api/auth/logout', authController.logout);
  
  // Google OAuth
  app.get('/api/auth/google', authController.googleAuth);
  app.get('/api/auth/google/callback', authController.googleCallback);
  
  // Protected auth routes
  app.get('/api/auth/user', authenticateToken, authController.getCurrentUser);

  // ===== STRIPE PAYMENT ROUTES =====
  
  // Subscription management
  app.post('/api/stripe/create-checkout-session', authenticateToken, stripeController.createCheckoutSession);
  app.post('/api/stripe/create-portal-session', authenticateToken, stripeController.createPortalSession);
  app.get('/api/stripe/subscription-status', authenticateToken, stripeController.getSubscriptionStatus);
  
  // Stripe webhooks (no auth required)
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeController.handleWebhook);

  // ===== PROTECTED APPLICATION ROUTES =====
  
  // Dashboard routes
  app.get('/api/dashboard/stats', authenticateToken, checkSubscription, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Employee routes
  app.get('/api/employees', authenticateToken, checkSubscription, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const employees = await storage.getEmployees(userId);
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get('/api/employees/:id', authenticateToken, checkSubscription, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const employee = await storage.getEmployee(req.params.id, userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post('/api/employees', authenticateToken, checkSubscription, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const validatedData = insertEmployeeSchema.parse(req.body);
      
      const employee = await storage.createEmployee({
        ...validatedData,
        userId,
      });
      
      res.status(201).json(employee);
    } catch (error: any) {
      console.error("Error creating employee:", error);
      
      if (error.issues) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.issues.map((issue: any) => issue.message) 
        });
      }
      
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put('/api/employees/:id', authenticateToken, checkSubscription, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const validatedData = insertEmployeeSchema.partial().parse(req.body);
      
      const employee = await storage.updateEmployee(req.params.id, userId, validatedData);
      res.json(employee);
    } catch (error: any) {
      console.error("Error updating employee:", error);
      
      if (error.issues) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.issues.map((issue: any) => issue.message) 
        });
      }
      
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete('/api/employees/:id', authenticateToken, checkSubscription, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      await storage.deleteEmployee(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Training routes
  app.get('/api/trainings', authenticateToken, checkSubscription, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const trainings = await storage.getTrainings(userId);
      res.json(trainings);
    } catch (error) {
      console.error("Error fetching trainings:", error);
      res.status(500).json({ message: "Failed to fetch trainings" });
    }
  });

  app.get('/api/trainings/employee/:employeeId', authenticateToken, checkSubscription, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const trainings = await storage.getTrainingsByEmployee(req.params.employeeId, userId);
      res.json(trainings);
    } catch (error) {
      console.error("Error fetching trainings:", error);
      res.status(500).json({ message: "Failed to fetch trainings" });
    }
  });

  app.get('/api/trainings/:id', authenticateToken, checkSubscription, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const training = await storage.getTraining(req.params.id, userId);
      if (!training) {
        return res.status(404).json({ message: "Training not found" });
      }
      res.json(training);
    } catch (error) {
      console.error("Error fetching training:", error);
      res.status(500).json({ message: "Failed to fetch training" });
    }
  });

  app.post('/api/trainings', authenticateToken, checkSubscription, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const validatedData = insertTrainingSchema.parse(req.body);
      
      const training = await storage.createTraining({
        ...validatedData,
        userId,
      });
      
      res.status(201).json(training);
    } catch (error: any) {
      console.error("Error creating training:", error);
      
      if (error.issues) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.issues.map((issue: any) => issue.message) 
        });
      }
      
      res.status(500).json({ message: "Failed to create training" });
    }
  });

  app.put('/api/trainings/:id', authenticateToken, checkSubscription, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const validatedData = insertTrainingSchema.partial().parse(req.body);
      
      const training = await storage.updateTraining(req.params.id, userId, validatedData);
      res.json(training);
    } catch (error: any) {
      console.error("Error updating training:", error);
      
      if (error.issues) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.issues.map((issue: any) => issue.message) 
        });
      }
      
      res.status(500).json({ message: "Failed to update training" });
    }
  });

  app.delete('/api/trainings/:id', authenticateToken, checkSubscription, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      await storage.deleteTraining(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting training:", error);
      res.status(500).json({ message: "Failed to delete training" });
    }
  });

  // ===== PUBLIC ROUTES (Optional Auth) =====
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}