import { useState, useEffect, useCallback } from 'react';
import { useConfig } from '../../../hooks/use-config';
import { createSingleStorageManager } from '../storage';
import type { SingleStorageManager } from '../storage/types';

export const useNotesStorage = () => {
  const { config, loading: configLoading } = useConfig();
  const [storageManager] = useState<SingleStorageManager>(() => createSingleStorageManager());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize storage when config loads or changes
  useEffect(() => {
    const initializeStorage = async () => {
      console.log('🚀 useNotesStorage: Starting initialization...');
      console.log('🔧 Config loading:', configLoading);
      console.log('🔧 Current config:', config);

      if (configLoading) {
        console.log('⏳ Config still loading, skipping initialization');
        return;
      }

      try {
        // Configure storage based on config
        const storageConfig = config.storage;
        console.log('🔧 Setting active storage with config:', storageConfig);
        const result = await storageManager.setActiveStorage(storageConfig);
        console.log('🔧 setActiveStorage result:', result);

        if (!result.success) {
          console.error('❌ Failed to set active storage:', result.error);
          throw new Error(result.error);
        }

        console.log('✅ Active storage set successfully');
        setIsInitialized(true);
      } catch (err) {
        console.error('❌ Failed to initialize storage:', err);
        throw err;
      }
    };

    initializeStorage();
  }, [configLoading, config.storage, storageManager]);

  const syncStorage = useCallback(async () => {
    try {
      const result = await storageManager.sync();
      if (result.success) {
        return { success: true };
      } else {
        return result;
      }
    } catch (err) {
      const errorMsg = `Failed to sync storage: ${err}`;
      return { success: false, error: errorMsg };
    }
  }, [storageManager]);

  const getStorageInfo = useCallback(async () => {
    try {
      return await storageManager.getStorageInfo();
    } catch (err) {
      return { success: false, error: `Failed to get storage info: ${err}` };
    }
  }, [storageManager]);

  const getActiveStorageConfig = useCallback(() => {
    return storageManager.getActiveStorageConfig();
  }, [storageManager]);

  return {
    storageManager,
    isInitialized,
    syncStorage,
    getStorageInfo,
    getActiveStorageConfig,
  };
};