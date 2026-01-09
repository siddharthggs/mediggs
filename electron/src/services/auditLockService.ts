// FILE: electron/src/services/auditLockService.ts
/// ANCHOR: AuditLockService
/**
 * Audit Locking Service
 * 
 * Enforces read-only finalized invoices with admin override:
 * - Read-only finalized bills
 * - Admin override with reason, user, timestamp
 * - Change diff history
 */

import { getPrismaClient } from '../db/prismaClient';
import { logAudit } from './auditService';

/**
 * Check if bill is locked (finalized)
 */
export function isBillLocked(status: string): boolean {
  return status === 'FINALIZED';
}

/**
 * Check if user can override lock (admin only)
 */
export async function canOverrideLock(userId: number | undefined): Promise<boolean> {
  if (!userId) {
    return false;
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true
    }
  });

  if (!user) {
    return false;
  }

  // Only admin role can override
  return user.role.name.toUpperCase() === 'ADMIN';
}

/**
 * Create audit version entry for bill change
 */
export async function createAuditVersion(
  billId: number,
  action: string,
  changesJson: string,
  performedBy: number | undefined,
  notes?: string
): Promise<void> {
  const prisma = getPrismaClient();

  // Get current max version for this bill
  const maxVersion = await prisma.billAuditVersion.findFirst({
    where: { billId },
    orderBy: { version: 'desc' },
    select: { version: true }
  });

  const nextVersion = (maxVersion?.version || 0) + 1;

  await prisma.billAuditVersion.create({
    data: {
      billId,
      version: nextVersion,
      action,
      changesJson,
      performedBy,
      notes
    }
  });
}

/**
 * Get change diff between two objects
 */
export function getChangeDiff(oldData: any, newData: any): Record<string, { old: any; new: any }> {
  const diff: Record<string, { old: any; new: any }> = {};
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    const oldValue = oldData[key];
    const newValue = newData[key];

    // Skip if values are equal (deep comparison for objects)
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      diff[key] = { old: oldValue, new: newValue };
    }
  }

  return diff;
}

/**
 * Validate if bill can be modified
 */
export async function validateBillModification(
  billId: number,
  userId: number | undefined,
  requireOverride: boolean = true
): Promise<{
  allowed: boolean;
  reason?: string;
  requiresOverride: boolean;
}> {
  const prisma = getPrismaClient();
  
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    select: { status: true }
  });

  if (!bill) {
    return {
      allowed: false,
      reason: 'Bill not found',
      requiresOverride: false
    };
  }

  if (!isBillLocked(bill.status)) {
    return {
      allowed: true,
      requiresOverride: false
    };
  }

  // Bill is locked - check if override is allowed
  if (requireOverride) {
    const canOverride = await canOverrideLock(userId);
    if (!canOverride) {
      return {
        allowed: false,
        reason: 'Bill is finalized and cannot be modified. Admin override required.',
        requiresOverride: true
      };
    }
  }

  return {
    allowed: true,
    requiresOverride: true
  };
}

/**
 * Override bill lock with admin permission and audit trail
 */
export async function overrideBillLock(
  billId: number,
  userId: number,
  reason: string,
  changes?: Record<string, any>
): Promise<void> {
  // Verify user can override
  const canOverride = await canOverrideLock(userId);
  if (!canOverride) {
    throw new Error('Only admin users can override finalized bills');
  }

  // Get current bill state
  const prisma = getPrismaClient();
  const bill = await prisma.bill.findUnique({
    where: { id: billId }
  });

  if (!bill) {
    throw new Error('Bill not found');
  }

  if (!isBillLocked(bill.status)) {
    throw new Error('Bill is not locked');
  }

  // Create audit version for override
  const changesJson = changes ? JSON.stringify(changes) : JSON.stringify({ override: true, reason });
  
  await createAuditVersion(
    billId,
    'ADMIN_OVERRIDE',
    changesJson,
    userId,
    `Admin override: ${reason}`
  );

  // Log audit
  await logAudit({
    entity: 'Bill',
    entityId: billId,
    action: 'ADMIN_OVERRIDE',
    userId,
    details: {
      billId,
      reason,
      changes,
      overrideTimestamp: new Date().toISOString()
    }
  });
}

/**
 * Get audit history for a bill
 */
export async function getBillAuditHistory(billId: number): Promise<Array<{
  version: number;
  action: string;
  performedBy: number | null;
  performedByUser: string | null;
  performedAt: Date;
  notes: string | null;
  changes: any;
}>> {
  const prisma = getPrismaClient();
  
  const versions = await prisma.billAuditVersion.findMany({
    where: { billId },
    include: {
      performedByUser: {
        select: {
          fullName: true
        }
      }
    },
    orderBy: { version: 'asc' }
  });

  return versions.map(v => ({
    version: v.version,
    action: v.action,
    performedBy: v.performedBy,
    performedByUser: v.performedByUser?.fullName || null,
    performedAt: v.performedAt,
    notes: v.notes,
    changes: v.changesJson ? JSON.parse(v.changesJson) : null
  }));
}

