// FILE: src/api/ipcClient.ts
/// ANCHOR: RendererIpcClient
import type { IpcChannel, IpcChannelMap } from '@shared/ipc';
import { useAuthStore } from '../stores/authStore';

export const invoke = async <T extends IpcChannel>(
  channel: T,
  payload: IpcChannelMap[T]['request']
) => {
  if (!window.electronAPI) {
    throw new Error('Electron bridge not ready');
  }
  
  // Get current user token
  const { user } = useAuthStore.getState();
  const enhancedPayload = user?.token 
    ? { ...payload, token: user.token }
    : payload;
    
  return window.electronAPI.invoke(channel, enhancedPayload);
};

