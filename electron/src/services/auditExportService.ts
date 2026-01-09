// FILE: electron/src/services/auditExportService.ts
/// ANCHOR: AuditExportService
/**
 * Audit Export Service
 * 
 * Exports audit trail with filters for compliance and reporting
 */

import { getPrismaClient } from '../db/prismaClient';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { logger } from '../utils/logger';

export interface AuditExportFilters {
  fromDate?: string;
  toDate?: string;
  entity?: string;
  entityId?: number;
  userId?: number;
  action?: string;
}

export interface AuditExportEntry {
  id: number;
  timestamp: string;
  entity: string;
  entityId?: number;
  action: string;
  userId?: number;
  userName?: string;
  details?: Record<string, unknown>;
}

/**
 * Get audit log entries with filters
 */
export async function getAuditLogs(
  filters: AuditExportFilters
): Promise<AuditExportEntry[]> {
  const prisma = getPrismaClient();

  const where: Prisma.AuditLogWhereInput = {};

  if (filters.fromDate || filters.toDate) {
    where.createdAt = {};
    if (filters.fromDate) {
      where.createdAt.gte = new Date(filters.fromDate);
    }
    if (filters.toDate) {
      const toDate = new Date(filters.toDate);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }

  if (filters.entity) {
    where.entity = filters.entity;
  }

  if (filters.entityId) {
    where.entityId = filters.entityId;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          fullName: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10000 // Limit to prevent memory issues
  });

  return logs.map(log => ({
    id: log.id,
    timestamp: log.createdAt.toISOString(),
    entity: log.entity,
    entityId: log.entityId ?? undefined,
    action: log.action,
    userId: log.userId ?? undefined,
    userName: log.user?.fullName ?? undefined,
    details: log.details ? JSON.parse(log.details as string) : undefined
  }));
}

/**
 * Export audit log to CSV
 */
export async function exportAuditLogCSV(
  filters: AuditExportFilters,
  outputPath?: string
): Promise<string> {
  const entries = await getAuditLogs(filters);

  const headers = [
    'ID',
    'Timestamp',
    'Entity',
    'Entity ID',
    'Action',
    'User ID',
    'User Name',
    'Details'
  ];

  const rows = entries.map(entry => [
    entry.id.toString(),
    entry.timestamp,
    entry.entity,
    entry.entityId?.toString() || '',
    entry.action,
    entry.userId?.toString() || '',
    entry.userName || '',
    entry.details ? JSON.stringify(entry.details) : ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const finalPath = outputPath || path.join(
    app.getPath('documents'),
    `Audit_Log_${filters.fromDate || 'all'}_to_${filters.toDate || 'all'}.csv`
  );

  const dir = path.dirname(finalPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(finalPath, csvContent, 'utf-8');
  logger.info(`Audit log CSV exported to: ${finalPath}`);

  return finalPath;
}

/**
 * Export audit log to JSON
 */
export async function exportAuditLogJSON(
  filters: AuditExportFilters,
  outputPath?: string
): Promise<string> {
  const entries = await getAuditLogs(filters);

  const finalPath = outputPath || path.join(
    app.getPath('documents'),
    `Audit_Log_${filters.fromDate || 'all'}_to_${filters.toDate || 'all'}.json`
  );

  const dir = path.dirname(finalPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(finalPath, JSON.stringify(entries, null, 2), 'utf-8');
  logger.info(`Audit log JSON exported to: ${finalPath}`);

  return finalPath;
}

