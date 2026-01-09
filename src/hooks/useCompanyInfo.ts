// FILE: src/hooks/useCompanyInfo.ts
/// ANCHOR: useCompanyInfo
import { useState, useEffect, useCallback } from 'react';
import type { CompanyInfoDTO } from '@shared/ipc';
import { invoke } from '../api/ipcClient';

// Cache for company info
let cachedCompanyInfo: CompanyInfoDTO | null = null;
let cacheListeners: Array<() => void> = [];

const notifyCacheListeners = () => {
  cacheListeners.forEach(listener => listener());
};

export const useCompanyInfo = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfoDTO | null>(cachedCompanyInfo);
  const [loading, setLoading] = useState(!cachedCompanyInfo);
  const [error, setError] = useState<string | null>(null);

  const loadCompanyInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoke('ipc.companyInfo.get', undefined);
      cachedCompanyInfo = data;
      setCompanyInfo(data);
      notifyCacheListeners();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load company info';
      setError(errorMessage);
      console.error('Error loading company info:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveCompanyInfo = useCallback(async (data: Parameters<typeof invoke<'ipc.companyInfo.save'>>[1]) => {
    try {
      setError(null);
      const saved = await invoke('ipc.companyInfo.save', data);
      cachedCompanyInfo = saved;
      setCompanyInfo(saved);
      notifyCacheListeners();
      return saved;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save company info';
      setError(errorMessage);
      console.error('Error saving company info:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    // If cache exists, use it immediately
    if (cachedCompanyInfo) {
      setCompanyInfo(cachedCompanyInfo);
      setLoading(false);
    } else {
      loadCompanyInfo();
    }

    // Subscribe to cache updates
    const listener = () => {
      setCompanyInfo(cachedCompanyInfo);
    };
    cacheListeners.push(listener);

    return () => {
      cacheListeners = cacheListeners.filter(l => l !== listener);
    };
  }, [loadCompanyInfo]);

  return {
    companyInfo,
    loading,
    error,
    reload: loadCompanyInfo,
    save: saveCompanyInfo
  };
};

