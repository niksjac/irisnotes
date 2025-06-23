import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { AppConfig } from '../types';

const DEFAULT_CONFIG: AppConfig = {
  editor: {
    lineWrapping: false,
  },
};

export const useConfig = () => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  const loadConfig = useCallback(async () => {
    try {
      const configString = await invoke<string>('read_config', { filename: 'app-config.json' });
      const parsedConfig = JSON.parse(configString) as AppConfig;
      setConfig(parsedConfig);
    } catch (error) {
      console.log('Config file not found, using defaults');
      setConfig(DEFAULT_CONFIG);
      await saveConfig(DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveConfig = useCallback(async (newConfig: AppConfig) => {
    try {
      await invoke('write_config', {
        filename: 'app-config.json',
        content: JSON.stringify(newConfig, null, 2)
      });
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }, []);

  const updateConfig = useCallback(async (updates: Partial<AppConfig>) => {
    const newConfig = {
      ...config,
      ...updates,
      editor: { ...config.editor, ...updates.editor }
    };
    await saveConfig(newConfig);
  }, [config, saveConfig]);

    useEffect(() => {
    loadConfig();

    // Set up file watcher
    const setupWatcher = async () => {
      try {
        // Initialize the file watcher
        await invoke('setup_config_watcher');

        // Listen for config file changes
        const unlisten = await listen('config-file-changed', () => {
          console.log('Config file changed, reloading...');
          loadConfig();
        });

        return unlisten;
      } catch (error) {
        console.error('Failed to setup config file watcher:', error);
        return null;
      }
    };

    let unlisten: (() => void) | null = null;
    setupWatcher().then((unlistenFn) => {
      unlisten = unlistenFn;
    });

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [loadConfig]);

  return {
    config,
    loading,
    updateConfig,
    loadConfig,
  };
};