// FILE: electron/src/services/backgroundJobService.ts
/// ANCHOR: BackgroundJobService
import { getPrismaClient } from '../db/prismaClient';
import { notifyLowStock, notifyExpiry } from './notificationService';
import { createBackup } from './backupService';

export interface JobResult {
  success: boolean;
  message: string;
  itemsProcessed: number;
}

// Check for low stock products and create notifications
export const checkLowStock = async (): Promise<JobResult> => {
  const prisma = getPrismaClient();
  let itemsProcessed = 0;

  try {
    const products = await prisma.product.findMany({
      include: {
        batches: {
          where: { quantity: { gt: 0 } }
        }
      }
    });

    for (const product of products) {
      const totalQuantity = product.batches.reduce((sum, b) => sum + b.quantity, 0);
      
      if (totalQuantity < product.minStock) {
        // Create notification for all active users
        const activeUsers = await prisma.user.findMany({
          where: { isActive: true },
          select: { id: true }
        });

        for (const user of activeUsers) {
          await notifyLowStock(
            product.id,
            product.name,
            totalQuantity,
            product.minStock
          );
        }
        itemsProcessed++;
      }
    }

    return {
      success: true,
      message: `Checked ${products.length} products, found ${itemsProcessed} with low stock`,
      itemsProcessed
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error checking low stock',
      itemsProcessed
    };
  }
};

// Check for expiring batches and create notifications
export const checkExpiringBatches = async (daysAhead: number = 30): Promise<JobResult> => {
  const prisma = getPrismaClient();
  let itemsProcessed = 0;

  try {
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysAhead);

    const batches = await prisma.batch.findMany({
      where: {
        quantity: { gt: 0 },
        expiryDate: {
          gte: now,
          lte: targetDate
        }
      },
      include: {
        product: true
      }
    });

    const activeUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true }
    });

    for (const batch of batches) {
      const expiryDate = new Date(batch.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry >= 0 && daysUntilExpiry <= daysAhead) {
        for (const user of activeUsers) {
          await notifyExpiry(
            batch.id,
            batch.product.name,
            batch.batchNumber,
            daysUntilExpiry
          );
        }
        itemsProcessed++;
      }
    }

    return {
      success: true,
      message: `Checked batches, found ${itemsProcessed} expiring within ${daysAhead} days`,
      itemsProcessed
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error checking expiring batches',
      itemsProcessed
    };
  }
};

// Run all background checks
export const runAllChecks = async (): Promise<{
  lowStock: JobResult;
  expiringBatches: JobResult;
}> => {
  const [lowStock, expiringBatches] = await Promise.all([
    checkLowStock(),
    checkExpiringBatches(30)
  ]);

  return {
    lowStock,
    expiringBatches
  };
};

// Clean up old notifications (older than 30 days and read)
export const cleanupOldNotifications = async (): Promise<JobResult> => {
  const prisma = getPrismaClient();
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    return {
      success: true,
      message: `Cleaned up ${result.count} old notifications`,
      itemsProcessed: result.count
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error cleaning up notifications',
      itemsProcessed: 0
    };
  }
};

// Automatic daily backup
export const performDailyBackup = async (): Promise<JobResult> => {
  try {
    const result = await createBackup();
    if (result.success) {
      return {
        success: true,
        message: `Daily backup created successfully: ${result.filePath}`,
        itemsProcessed: 1
      };
    } else {
      return {
        success: false,
        message: `Backup failed: ${result.error}`,
        itemsProcessed: 0
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error performing daily backup',
      itemsProcessed: 0
    };
  }
};

// Clean up old draft bills (older than 7 days)
export const cleanupOldDrafts = async (): Promise<JobResult> => {
  const prisma = getPrismaClient();
  
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await prisma.bill.deleteMany({
      where: {
        status: 'DRAFT',
        updatedAt: {
          lt: sevenDaysAgo
        }
      }
    });

    return {
      success: true,
      message: `Cleaned up ${result.count} old draft bills`,
      itemsProcessed: result.count
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error cleaning up old drafts',
      itemsProcessed: 0
    };
  }
};

// Run data consistency scan
export const runConsistencyScan = async (): Promise<JobResult> => {
  try {
    const { runConsistencyScan } = await import('./consistencyScannerService');
    const result = await runConsistencyScan();
    
    return {
      success: true,
      message: `Consistency scan completed. Found ${result.totalIssues} issues (${result.criticalIssues} critical, ${result.fixableIssues} fixable)`,
      itemsProcessed: result.totalIssues
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error running consistency scan',
      itemsProcessed: 0
    };
  }
};

