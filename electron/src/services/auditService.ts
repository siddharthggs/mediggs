// FILE: electron/src/services/auditService.ts
/// ANCHOR: AuditService
import { getPrismaClient } from '../db/prismaClient';

interface AuditPayload {
  entity: string;
  entityId?: number;
  action: string;
  userId?: number;
  details?: Record<string, unknown>;
}

export const logAudit = async ({
  entity,
  entityId,
  action,
  userId,
  details
}: AuditPayload) => {
  const prisma = getPrismaClient();
  try {
    await prisma.auditLog.create({
      data: {
        entity,
        entityId,
        action,
        userId,
        details: details ? JSON.stringify(details) : undefined
      }
    });
  } catch (error) {
    // Log audit errors but don't throw - they shouldn't block main operations
    console.error('Failed to log audit entry:', error);
  }
};

// Non-blocking audit log - fire and forget
export const logAuditAsync = ({
  entity,
  entityId,
  action,
  userId,
  details
}: AuditPayload) => {
  // Fire and forget
  logAudit({ entity, entityId, action, userId, details }).catch(() => {
    // Silently ignore errors in async logging
  });
};

