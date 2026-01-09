// FILE: electron/src/db/prismaClient.ts
/// ANCHOR: PrismaClientFactory
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { paths } from '../constants';

let prisma: PrismaClient | null = null;

const ensureDatabase = () => {
  const databasePath = paths.database();
  const dataDir = path.dirname(databasePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!process.env.DATABASE_URL) {
    // Configure SQLite with increased timeout and WAL mode for better concurrency
    process.env.DATABASE_URL = `file:${databasePath}?timeout=30000&mode=rwc`;
  }
};

export const getPrismaClient = () => {
  if (!prisma) {
    ensureDatabase();
    prisma = new PrismaClient({
      // Increase the default connect timeout
      errorFormat: 'pretty',
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' }
      ]
    });

    // Log slow queries
    (prisma as any).$on('query', (e: any) => {
      if (e.duration > 1000) {
        console.warn(`Slow query detected (${e.duration}ms):`, e.query);
      }
    });

    // Log errors
    (prisma as any).$on('error', (e: any) => {
      console.error('Prisma error:', e.message);
    });
  }
  return prisma;
};

export const disconnectPrisma = async () => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
};

