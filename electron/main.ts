// FILE: electron/main.ts
/// ANCHOR: ElectronMain
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import url from 'node:url';
import { registerIpcHandlers } from './src/ipcHandlers';
import { disconnectPrisma } from './src/db/prismaClient';
import { initializeErrorHandlers } from './src/utils/errorHandler';

const isDevelopment = process.env.NODE_ENV === 'development';

// Initialize comprehensive error handlers
initializeErrorHandlers();

// Enhanced memory monitoring to prevent freezing
let isHighMemory = false;
let consecutiveHighMemory = 0;
const checkMemoryUsage = () => {
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  
  if (heapUsedPercent > 85 || rssMB > 1500) {
    consecutiveHighMemory++;
    if (!isHighMemory || consecutiveHighMemory % 5 === 0) {
      isHighMemory = true;
      console.warn(`[Memory Warning] Heap: ${heapUsedMB}MB (${Math.round(heapUsedPercent)}%), RSS: ${rssMB}MB`);
      
      // Trigger garbage collection if available
      if (global.gc) {
        global.gc();
        console.log('Garbage collection triggered');
      }
      
      // If memory is critically high, warn user
      if (heapUsedPercent > 95 || rssMB > 2000) {
        console.error('[Critical Memory] Application may freeze. Consider restarting.');
      }
    }
  } else if (heapUsedPercent < 70 && rssMB < 1000) {
    if (isHighMemory) {
      console.log(`[Memory Normalized] Heap: ${heapUsedMB}MB, RSS: ${rssMB}MB`);
    }
    isHighMemory = false;
    consecutiveHighMemory = 0;
  }
};

// Check memory every 10 seconds
setInterval(checkMemoryUsage, 10000);

const getPreloadPath = () => {
  if (isDevelopment) {
    // In dev, preload is compiled to dist_electron by esbuild watch
    return path.join(__dirname, 'preload.js');
  }
  return path.join(__dirname, 'preload.js');
};

const getRendererEntry = () => {
  if (isDevelopment && process.env.VITE_DEV_SERVER_URL) {
    return process.env.VITE_DEV_SERVER_URL;
  }
  // In production, app.getAppPath() points to the app.asar or unpacked app directory
  const rendererPath = path.join(app.getAppPath(), 'dist_renderer', 'index.html');
  return url.pathToFileURL(rendererPath).toString();
};

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 720,
    show: false,
    webPreferences: {
      preload: getPreloadPath(),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDevelopment) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  const entry = getRendererEntry();
  await mainWindow.loadURL(entry);
}

function registerLifecycleHooks() {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch((error) => {
        console.error('Failed to recreate window', error);
      });
    }
  });
}

let disposeIpc: (() => void) | null = null;

async function initIpc() {
  try {
    ipcMain.handle('ping', () => 'pong');
    disposeIpc = await registerIpcHandlers();
    console.log('IPC handlers registered successfully');
  } catch (error) {
    console.error('Failed to register IPC handlers:', error);
    throw error;
  }
}

app
  .whenReady()
  .then(async () => {
    try {
      console.log('App ready, starting initialization...');
      registerLifecycleHooks();
      console.log('Lifecycle hooks registered');
      
      // Initialize IPC with timeout protection
      try {
        await Promise.race([
          initIpc(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('IPC initialization timeout')), 30000)
          )
        ]);
        console.log('IPC initialized, creating window...');
      } catch (ipcError) {
        console.error('IPC initialization failed:', ipcError);
        // Continue anyway - some handlers might still work
        console.warn('Continuing with partial IPC initialization...');
      }
      
      return createWindow();
    } catch (error) {
      console.error('Error during initialization:', error);
      // Don't quit immediately - try to show error window
      try {
        const errorWindow = new BrowserWindow({
          width: 600,
          height: 400,
          show: true,
          webPreferences: { nodeIntegration: false, contextIsolation: true }
        });
        errorWindow.loadURL(`data:text/html,<html><body><h1>Initialization Error</h1><p>${error instanceof Error ? error.message : String(error)}</p><p>Please check the console for details.</p></body></html>`);
      } catch {
        // If we can't even show error window, quit
        app.quit();
      }
    }
  })
  .catch((error) => {
    console.error('Failed to start application', error);
    // Give user a moment to see the error
    setTimeout(() => app.quit(), 5000);
  });

app.on('before-quit', async () => {
  disposeIpc?.();
  await disconnectPrisma();
});

