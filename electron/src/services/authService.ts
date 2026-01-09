// FILE: electron/src/services/authService.ts
/// ANCHOR: AuthService
import bcrypt from 'bcryptjs';
import { getPrismaClient } from '../db/prismaClient';
import type { LoginRequest, LoginResponse } from '../../../shared/ipc';
import {
  recordLoginAttempt,
  isAccountLocked,
  getRemainingLockTime,
  trackSessionActivity
} from './securityService';

const DEFAULT_ADMIN = {
    role: {
      name: 'ADMIN',
      description: 'System administrator'
    },
  user: {
    fullName: 'Local Administrator',
    email: 'admin@local',
    password: 'Admin@123'
  }
};

const bootstrapRoles = async () => {
  const prisma = getPrismaClient();
  const requiredRoles = [
    { name: 'ADMIN', description: 'Full system access' },
    { name: 'MANAGER', description: 'Operations manager with full CRUD access' },
    { name: 'ACCOUNTANT', description: 'Financial operations and reporting' },
    { name: 'SALES', description: 'Sales operations and customer management' }
  ];

  await Promise.all(
    requiredRoles.map((role) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role
      })
    )
  );
};

export const ensureDefaultAdmin = async () => {
  const prisma = getPrismaClient();
  await bootstrapRoles();
  
  const adminRole = await prisma.role.findUnique({
    where: { name: DEFAULT_ADMIN.role.name }
  });
  if (!adminRole) {
    throw new Error('Admin role missing during bootstrap');
  }

  // Find existing admin user
  const existingAdmin = await prisma.user.findUnique({
    where: { email: DEFAULT_ADMIN.user.email }
  });

  // Get all users with admin role
  const allAdminUsers = await prisma.user.findMany({
    where: { roleId: adminRole.id }
  });

  if (!existingAdmin) {
    // Create default admin if it doesn't exist
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.user.password, 10);
    await prisma.user.create({
      data: {
        fullName: DEFAULT_ADMIN.user.fullName,
        email: DEFAULT_ADMIN.user.email,
        hashedPassword,
        roleId: adminRole.id
      }
    });
  } else {
    // Ensure default admin is active and has correct role
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        isActive: true,
        roleId: adminRole.id
      }
    });
  }

  // Delete any other admin users (keep only one admin)
  if (allAdminUsers.length > 1) {
    const adminUserIds = allAdminUsers
      .filter(u => u.email !== DEFAULT_ADMIN.user.email)
      .map(u => u.id);
    
    if (adminUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: {
          id: { in: adminUserIds }
        }
      });
      console.log(`Removed ${adminUserIds.length} duplicate admin user(s). Only one admin user is allowed.`);
    }
  }
};

export const authenticateUser = async ({
  username,
  password
}: LoginRequest): Promise<LoginResponse> => {
  // Check if account is locked
  if (isAccountLocked(username)) {
    const remainingSeconds = getRemainingLockTime(username);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    throw new Error(
      `Account locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`
    );
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { email: username },
    include: { role: true }
  });

  if (!user) {
    recordLoginAttempt(username, false);
    throw new Error('Invalid credentials');
  }

  if (!user.isActive) {
    recordLoginAttempt(username, false);
    throw new Error('User account is inactive');
  }

  const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
  if (!passwordMatch) {
    recordLoginAttempt(username, false);
    throw new Error('Invalid credentials');
  }

  // Successful login
  recordLoginAttempt(username, true);
  trackSessionActivity(user.id);

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  return {
    token: Buffer.from(`${user.id}:${Date.now()}`).toString('base64'),
    displayName: user.fullName,
    role: user.role.name
  };
};

export const getUserIdFromToken = (token: string): number | null => {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId] = decoded.split(':');
    return userId ? parseInt(userId, 10) : null;
  } catch {
    return null;
  }
};


