import {
  users,
  employees,
  trainings,
  alerts,
  type User,
  type UpsertUser,
  type Employee,
  type InsertEmployee,
  type Training,
  type InsertTraining,
  type Alert,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, lte, gte } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User>;
  updateSubscriptionStatus(userId: string, status: string, endsAt?: Date): Promise<User>;
  
  // Employee operations
  getEmployees(userId: string): Promise<Employee[]>;
  getEmployee(id: string, userId: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee & { userId: string }): Promise<Employee>;
  updateEmployee(id: string, userId: string, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: string, userId: string): Promise<void>;
  
  // Training operations
  getTrainings(userId: string): Promise<Training[]>;
  getTrainingsByEmployee(employeeId: string, userId: string): Promise<Training[]>;
  getTraining(id: string, userId: string): Promise<Training | undefined>;
  createTraining(training: InsertTraining & { userId: string }): Promise<Training>;
  updateTraining(id: string, userId: string, training: Partial<InsertTraining>): Promise<Training>;
  deleteTraining(id: string, userId: string): Promise<void>;
  getExpiringTrainings(daysAhead: number): Promise<Training[]>;
  
  // Alert operations
  createAlert(alert: { userId: string; trainingId: string; type: string }): Promise<Alert>;
  markAlertAsSent(alertId: string): Promise<void>;
  getUnsentAlerts(): Promise<Alert[]>;
  
  // Dashboard operations
  getDashboardStats(userId: string): Promise<{
    totalEmployees: number;
    totalTrainings: number;
    expiringSoon: number;
    completionRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateSubscriptionStatus(userId: string, status: string, endsAt?: Date): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionStatus: status,
        subscriptionEndsAt: endsAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Employee operations
  async getEmployees(userId: string): Promise<Employee[]> {
    return await db
      .select()
      .from(employees)
      .where(eq(employees.userId, userId))
      .orderBy(desc(employees.createdAt));
  }

  async getEmployee(id: string, userId: string): Promise<Employee | undefined> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(and(eq(employees.id, id), eq(employees.userId, userId)));
    return employee;
  }

  async createEmployee(employee: InsertEmployee & { userId: string }): Promise<Employee> {
    const [newEmployee] = await db
      .insert(employees)
      .values(employee)
      .returning();
    return newEmployee;
  }

  async updateEmployee(id: string, userId: string, employee: Partial<InsertEmployee>): Promise<Employee> {
    const [updatedEmployee] = await db
      .update(employees)
      .set({ ...employee, updatedAt: new Date() })
      .where(and(eq(employees.id, id), eq(employees.userId, userId)))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: string, userId: string): Promise<void> {
    await db
      .delete(employees)
      .where(and(eq(employees.id, id), eq(employees.userId, userId)));
  }

  // Training operations
  async getTrainings(userId: string): Promise<Training[]> {
    return await db
      .select()
      .from(trainings)
      .where(eq(trainings.userId, userId))
      .orderBy(desc(trainings.createdAt));
  }

  async getTrainingsByEmployee(employeeId: string, userId: string): Promise<Training[]> {
    return await db
      .select()
      .from(trainings)
      .where(and(eq(trainings.employeeId, employeeId), eq(trainings.userId, userId)))
      .orderBy(desc(trainings.createdAt));
  }

  async getTraining(id: string, userId: string): Promise<Training | undefined> {
    const [training] = await db
      .select()
      .from(trainings)
      .where(and(eq(trainings.id, id), eq(trainings.userId, userId)));
    return training;
  }

  async createTraining(training: InsertTraining & { userId: string }): Promise<Training> {
    // Calculate expiry date
    const completionDate = new Date(training.completionDate);
    const expiryDate = new Date(completionDate);
    expiryDate.setDate(expiryDate.getDate() + training.validityDays);

    const [newTraining] = await db
      .insert(trainings)
      .values({
        ...training,
        expiryDate: expiryDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      })
      .returning();
    return newTraining;
  }

  async updateTraining(id: string, userId: string, training: Partial<InsertTraining>): Promise<Training> {
    let updateData: any = { ...training, updatedAt: new Date() };

    // Recalculate expiry date if completion date or validity days changed
    if (training.completionDate || training.validityDays) {
      const existingTraining = await this.getTraining(id, userId);
      if (existingTraining) {
        const completionDate = new Date(training.completionDate || existingTraining.completionDate);
        const validityDays = training.validityDays || existingTraining.validityDays;
        const expiryDate = new Date(completionDate);
        expiryDate.setDate(expiryDate.getDate() + validityDays);
        updateData.expiryDate = expiryDate.toISOString().split('T')[0];
      }
    }

    const [updatedTraining] = await db
      .update(trainings)
      .set(updateData)
      .where(and(eq(trainings.id, id), eq(trainings.userId, userId)))
      .returning();
    return updatedTraining;
  }

  async deleteTraining(id: string, userId: string): Promise<void> {
    await db
      .delete(trainings)
      .where(and(eq(trainings.id, id), eq(trainings.userId, userId)));
  }

  async getExpiringTrainings(daysAhead: number): Promise<Training[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    return await db
      .select()
      .from(trainings)
      .where(
        and(
          eq(trainings.status, 'active'),
          eq(trainings.expiryDate, targetDateStr)
        )
      );
  }

  // Alert operations
  async createAlert(alert: { userId: string; trainingId: string; type: string }): Promise<Alert> {
    const [newAlert] = await db
      .insert(alerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async markAlertAsSent(alertId: string): Promise<void> {
    await db
      .update(alerts)
      .set({ sent: true, sentAt: new Date() })
      .where(eq(alerts.id, alertId));
  }

  async getUnsentAlerts(): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.sent, false));
  }

  // Dashboard operations
  async getDashboardStats(userId: string): Promise<{
    totalEmployees: number;
    totalTrainings: number;
    expiringSoon: number;
    completionRate: number;
  }> {
    const now = new Date();
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

    // Get total employees
    const [employeeCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.userId, userId));

    // Get total trainings
    const [trainingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trainings)
      .where(and(eq(trainings.userId, userId), eq(trainings.status, 'active')));

    // Get expiring soon (next 5 days)
    const [expiringSoonCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trainings)
      .where(
        and(
          eq(trainings.userId, userId),
          eq(trainings.status, 'active'),
          lte(trainings.expiryDate, fiveDaysFromNow.toISOString().split('T')[0]),
          gte(trainings.expiryDate, now.toISOString().split('T')[0])
        )
      );

    return {
      totalEmployees: employeeCount.count || 0,
      totalTrainings: trainingCount.count || 0,
      expiringSoon: expiringSoonCount.count || 0,
      completionRate: 94, // This would be calculated based on actual completion data
    };
  }
}

export const storage = new DatabaseStorage();
