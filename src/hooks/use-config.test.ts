import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConfig } from './use-config';
import type { AppConfig } from '../types';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

const DEFAULT_CONFIG: AppConfig = {
  editor: {
    lineWrapping: false,
    toolbarVisible: true,
  },
  debug: {
    enableExampleNote: false,
  },
  storage: {
    backend: 'sqlite',
    sqlite: {
      database_path: 'notes.db',
    },
  },
  development: {
    useLocalConfig: false,
    configPath: './dev/config/',
  },
  production: {},
};

describe('useConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock import.meta.env
    Object.defineProperty(import.meta, 'env', {
      value: { DEV: false },
      writable: true,
    });
  });

  describe('initialization', () => {
    it('should initialize with default config and loading state', async () => {
      // Mock the async operations to prevent state updates
      (invoke as any)
        .mockRejectedValueOnce(new Error('Config not found')) // loadConfig fails
        .mockResolvedValueOnce(undefined) // saveConfig succeeds
        .mockResolvedValueOnce(undefined); // setup_config_watcher
      (listen as any).mockResolvedValue(() => {}); // Mock unlisten function

      const { result } = renderHook(() => useConfig());

      // Check initial state immediately
      expect(result.current.config).toEqual(DEFAULT_CONFIG);
      expect(result.current.loading).toBe(true);

      // Wait for async operations to complete to prevent act() warnings
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should load config from system on mount', async () => {
      const mockConfig = {
        ...DEFAULT_CONFIG,
        editor: { lineWrapping: true, toolbarVisible: false },
      };

      (invoke as any)
        .mockResolvedValueOnce(JSON.stringify(mockConfig)) // config load
        .mockResolvedValueOnce(undefined); // setup_config_watcher
      (listen as any).mockResolvedValue(() => {}); // Mock unlisten function

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(invoke).toHaveBeenCalledWith('read_config', {
        filename: './dev/config/app-config.json',
      });
      expect(result.current.config.editor).toEqual({
        lineWrapping: true,
        toolbarVisible: false,
      });
    });

    it('should use development config in dev mode', async () => {
      // Set development mode
      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true },
        writable: true,
      });

      const devConfig = {
        ...DEFAULT_CONFIG,
        development: { useLocalConfig: true, configPath: './dev/config/' },
      };

      (invoke as any).mockResolvedValueOnce(JSON.stringify(devConfig));
      (listen as any).mockResolvedValue(() => {});

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(invoke).toHaveBeenCalledWith('read_config', {
        filename: './dev/config/app-config.json',
      });
    });

    it('should handle config loading errors gracefully', async () => {
      const mockError = new Error('Failed to read config');
      (invoke as any)
        .mockRejectedValueOnce(mockError) // config load fails
        .mockResolvedValueOnce(undefined) // saveConfig succeeds
        .mockResolvedValueOnce(undefined); // setup_config_watcher
      (listen as any).mockResolvedValue(() => {});

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should fall back to development default config in test environment
      const expectedConfig = {
        ...DEFAULT_CONFIG,
        development: {
          useLocalConfig: true,
          configPath: './dev/config/',
        },
      };
      expect(result.current.config).toEqual(expectedConfig);
    });
  });

  describe('updateConfig', () => {
    it('should update config and call save', async () => {
      (invoke as any)
        .mockResolvedValueOnce(JSON.stringify(DEFAULT_CONFIG)) // Initial load
        .mockResolvedValueOnce(undefined); // Save call
      (listen as any).mockResolvedValue(() => {});

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updates = {
        editor: { lineWrapping: true, toolbarVisible: false },
      };

      await act(async () => {
        await result.current.updateConfig(updates);
      });

      expect(invoke).toHaveBeenCalledWith('write_config', {
        filename: 'app-config.json',
        content: JSON.stringify(
          {
            ...DEFAULT_CONFIG,
            editor: { lineWrapping: true, toolbarVisible: false },
          },
          null,
          2
        ),
      });

      expect(result.current.config.editor).toEqual(updates.editor);
    });

    it('should merge nested config properties correctly', async () => {
      (invoke as any).mockResolvedValueOnce(JSON.stringify(DEFAULT_CONFIG)).mockResolvedValueOnce(undefined);
      (listen as any).mockResolvedValue(() => {});

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updates = {
        editor: { lineWrapping: true, toolbarVisible: true }, // Include required property
        storage: { backend: 'file-system' as const },
      };

      await act(async () => {
        await result.current.updateConfig(updates);
      });

      expect(result.current.config.editor).toEqual({
        lineWrapping: true,
        toolbarVisible: true, // Should preserve existing value
      });
      expect(result.current.config.storage.backend).toBe('file-system');
    });

    it('should handle save errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (invoke as any)
        .mockResolvedValueOnce(JSON.stringify(DEFAULT_CONFIG)) // initial load
        .mockResolvedValueOnce(undefined) // setup_config_watcher
        .mockRejectedValueOnce(new Error('Save failed')); // save error
      (listen as any).mockResolvedValue(() => {});

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateConfig({
          editor: { lineWrapping: true, toolbarVisible: true },
        });
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to save config:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('loadConfig', () => {
    it('should reload config when called manually', async () => {
      const initialConfig = DEFAULT_CONFIG;
      const updatedConfig = {
        ...DEFAULT_CONFIG,
        editor: { lineWrapping: true, toolbarVisible: false },
      };

      (invoke as any)
        .mockResolvedValueOnce(JSON.stringify(initialConfig)) // initial load
        .mockResolvedValueOnce(undefined) // setup_config_watcher
        .mockResolvedValueOnce(JSON.stringify(updatedConfig)); // manual reload
      (listen as any).mockResolvedValue(() => {});

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Config should have development flag set in test environment
      expect(result.current.config.development.useLocalConfig).toBe(false);

      await act(async () => {
        await result.current.loadConfig();
      });

      expect(result.current.config.editor).toEqual({
        lineWrapping: true,
        toolbarVisible: false,
      });
    });
  });

  describe('file watching', () => {
    it('should set up config file watcher on mount', async () => {
      const mockUnlisten = vi.fn();
      (invoke as any).mockResolvedValueOnce(JSON.stringify(DEFAULT_CONFIG)).mockResolvedValueOnce(undefined); // setup_config_watcher
      (listen as any).mockResolvedValue(mockUnlisten);

      const { unmount } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('setup_config_watcher');
      });

      expect(listen).toHaveBeenCalledWith('config-file-changed', expect.any(Function));

      // Test cleanup
      unmount();
      expect(mockUnlisten).toHaveBeenCalled();
    });

    it('should handle file watcher setup errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (invoke as any)
        .mockResolvedValueOnce(JSON.stringify(DEFAULT_CONFIG)) // initial load
        .mockRejectedValueOnce(new Error('Watcher setup failed')); // setup_config_watcher fails
      (listen as any).mockResolvedValue(() => {});

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Wait a bit more for the async file watcher setup to complete
      await waitFor(
        () => {
          expect(consoleSpy).toHaveBeenCalledWith('Failed to setup config file watcher:', expect.any(Error));
        },
        { timeout: 2000 }
      );

      consoleSpy.mockRestore();
    });
  });

  describe('config merging', () => {
    it('should merge partial configs with defaults', async () => {
      const partialConfig = {
        editor: { lineWrapping: true },
        // Missing other required fields
      };

      (invoke as any).mockResolvedValueOnce(JSON.stringify(partialConfig));
      (listen as any).mockResolvedValue(() => {});

      const { result } = renderHook(() => useConfig());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have merged with defaults
      expect(result.current.config).toEqual({
        ...DEFAULT_CONFIG,
        editor: {
          lineWrapping: true,
          toolbarVisible: true, // From defaults
        },
      });
    });
  });
});
