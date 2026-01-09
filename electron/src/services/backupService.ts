// FILE: electron/src/services/backupService.ts
/// ANCHOR: BackupService
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { paths } from '../constants';

const getDatabasePath = () => paths.database();

const getBackupDir = () => {
  const backupDir = paths.backups();
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
};

const BACKUP_RETENTION_DAYS = 30;
const BACKUP_PREFIX = 'backup-';
const BACKUP_EXT = '.db';
const METADATA_EXT = '.json';

interface BackupMetadata {
  timestamp: string;
  fileSize: number;
  checksum: string;
  version: string;
  createdAt: string;
}

/**
 * Calculate SHA-256 checksum of a file
 */
async function calculateChecksum(filePath: string): Promise<string> {
  const fileBuffer = await fs.promises.readFile(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

/**
 * Verify backup file integrity
 */
export async function verifyBackupIntegrity(backupFile: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // Check file exists
    if (!fs.existsSync(backupFile)) {
      return { valid: false, error: 'Backup file does not exist' };
    }

    // Check file size (SQLite files should be at least a few KB)
    const stats = await fs.promises.stat(backupFile);
    if (stats.size < 1024) {
      return { valid: false, error: 'Backup file is too small to be valid' };
    }

    // Check SQLite header (first 16 bytes should be "SQLite format 3\000")
    const fileHandle = await fs.promises.open(backupFile, 'r');
    const buffer = Buffer.alloc(16);
    await fileHandle.read(buffer, 0, 16, 0);
    await fileHandle.close();

    const sqliteHeader = 'SQLite format 3\x00';
    if (buffer.toString('utf8', 0, 16) !== sqliteHeader) {
      return { valid: false, error: 'Invalid SQLite file format' };
    }

    // Verify checksum if metadata exists
    const metadataFile = backupFile.replace(BACKUP_EXT, METADATA_EXT);
    if (fs.existsSync(metadataFile)) {
      const metadata: BackupMetadata = JSON.parse(
        await fs.promises.readFile(metadataFile, 'utf-8')
      );
      const actualChecksum = await calculateChecksum(backupFile);
      if (actualChecksum !== metadata.checksum) {
        return { valid: false, error: 'Checksum mismatch - file may be corrupted' };
      }
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error during verification'
    };
  }
}

/**
 * Create backup with metadata and integrity checks
 */
export async function createBackup(): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const databasePath = getDatabasePath();
    
    // Check source database exists
    if (!fs.existsSync(databasePath)) {
      return { success: false, error: 'Database file does not exist' };
    }

    // Verify source database integrity
    const sourceCheck = await verifyBackupIntegrity(databasePath);
    if (!sourceCheck.valid) {
      return { success: false, error: `Source database invalid: ${sourceCheck.error}` };
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = getBackupDir();
    const backupFile = path.join(backupDir, `${BACKUP_PREFIX}${timestamp}${BACKUP_EXT}`);
    const metadataFile = path.join(backupDir, `${BACKUP_PREFIX}${timestamp}${METADATA_EXT}`);

    // Copy database file
    await fs.promises.copyFile(databasePath, backupFile);

    // Calculate checksum
    const checksum = await calculateChecksum(backupFile);
    const stats = await fs.promises.stat(backupFile);

    // Create metadata
    const metadata: BackupMetadata = {
      timestamp,
      fileSize: stats.size,
      checksum,
      version: '1.0', // Can be enhanced to track app version
      createdAt: new Date().toISOString()
    };

    await fs.promises.writeFile(metadataFile, JSON.stringify(metadata, null, 2));

    // Verify backup integrity
    const verifyResult = await verifyBackupIntegrity(backupFile);
    if (!verifyResult.valid) {
      // Clean up invalid backup
      await fs.promises.unlink(backupFile).catch(() => {});
      await fs.promises.unlink(metadataFile).catch(() => {});
      return { success: false, error: `Backup verification failed: ${verifyResult.error}` };
    }

    // Clean up old backups (keep last 30 days)
    await cleanupOldBackups();

    return { success: true, filePath: backupFile };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during backup'
    };
  }
}

/**
 * Clean up backups older than retention period
 */
async function cleanupOldBackups(): Promise<void> {
  try {
    const backupDir = getBackupDir();
    const files = await fs.promises.readdir(backupDir);
    const now = Date.now();
    const retentionMs = BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (file.startsWith(BACKUP_PREFIX) && file.endsWith(BACKUP_EXT)) {
        const filePath = path.join(backupDir, file);
        try {
          const stats = await fs.promises.stat(filePath);
          const age = now - stats.mtimeMs;

          if (age > retentionMs) {
            // Delete backup file and metadata
            await fs.promises.unlink(filePath).catch(() => {});
            const metadataFile = filePath.replace(BACKUP_EXT, METADATA_EXT);
            await fs.promises.unlink(metadataFile).catch(() => {});
          }
        } catch (err) {
          // Ignore errors during cleanup
          console.warn(`Failed to process backup file ${file}:`, err);
        }
      }
    }
  } catch (error) {
    console.warn('Error during backup cleanup:', error);
  }
}

/**
 * List all available backups with metadata
 */
export async function listBackups(): Promise<Array<{
  filePath: string;
  timestamp: string;
  fileSize: number;
  createdAt: string;
  isValid: boolean;
}>> {
  try {
    const backupDir = getBackupDir();
    const files = await fs.promises.readdir(backupDir);
    const backups: Array<{
      filePath: string;
      timestamp: string;
      fileSize: number;
      createdAt: string;
      isValid: boolean;
    }> = [];

    for (const file of files) {
      if (file.startsWith(BACKUP_PREFIX) && file.endsWith(BACKUP_EXT)) {
        const filePath = path.join(backupDir, file);
        try {
          const stats = await fs.promises.stat(filePath);
          const metadataFile = filePath.replace(BACKUP_EXT, METADATA_EXT);
          
          let metadata: BackupMetadata | null = null;
          if (fs.existsSync(metadataFile)) {
            metadata = JSON.parse(await fs.promises.readFile(metadataFile, 'utf-8'));
          }

          const verifyResult = await verifyBackupIntegrity(filePath);

          backups.push({
            filePath,
            timestamp: metadata?.timestamp || path.basename(file, BACKUP_EXT),
            fileSize: stats.size,
            createdAt: metadata?.createdAt || stats.mtime.toISOString(),
            isValid: verifyResult.valid
          });
        } catch (err) {
          console.warn(`Failed to process backup ${file}:`, err);
        }
      }
    }

    // Sort by creation date (newest first)
    return backups.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error listing backups:', error);
    return [];
  }
}

/**
 * Restore backup with validation
 */
export async function restoreBackup(
  backupFile: string,
  options: { validateBeforeRestore?: boolean } = {}
): Promise<{ success: boolean; error?: string }> {
  const { validateBeforeRestore = true } = options;

  try {
    // Verify backup integrity
    if (validateBeforeRestore) {
      const verifyResult = await verifyBackupIntegrity(backupFile);
      if (!verifyResult.valid) {
        return { success: false, error: `Backup validation failed: ${verifyResult.error}` };
      }
    }

    const databasePath = getDatabasePath();
    
    // Create safety backup before restore
    const safetyBackup = await createBackup();
    if (!safetyBackup.success) {
      return { success: false, error: `Failed to create safety backup: ${safetyBackup.error}` };
    }

    // Copy backup to database location
    await fs.promises.copyFile(backupFile, databasePath);

    // Verify restored database
    const restoreVerify = await verifyBackupIntegrity(databasePath);
    if (!restoreVerify.valid) {
      // Restore safety backup if restore failed
      if (safetyBackup.filePath) {
        await fs.promises.copyFile(safetyBackup.filePath, databasePath).catch(() => {});
      }
      return { success: false, error: `Restored database validation failed: ${restoreVerify.error}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during restore'
    };
  }
}

/**
 * Legacy export function (maintained for backward compatibility)
 */
export const exportBackup = createBackup;

/**
 * Legacy import function (maintained for backward compatibility)
 */
export const importBackup = async (sourceFile: string) => {
  const result = await restoreBackup(sourceFile);
  if (!result.success) {
    throw new Error(result.error || 'Restore failed');
  }
};

