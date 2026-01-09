// FILE: electron/preload.ts
/// ANCHOR: ElectronPreload
import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronBridge, IpcChannel } from '../shared/ipc';

const ipcAPI: ElectronBridge = {
  invoke(channel, payload) {
    return ipcRenderer.invoke(channel, payload);
  }
};

contextBridge.exposeInMainWorld('electronAPI', ipcAPI);

declare global {
  interface Window {
    electronAPI: ElectronBridge;
  }
}

