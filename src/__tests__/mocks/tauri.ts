// Common Tauri API mocks for testing
import { vi } from 'vitest'

// File system mock factory
export const createFileSystemMock = (customMocks: Partial<any> = {}) => ({
  exists: vi.fn().mockResolvedValue(true),
  readTextFile: vi.fn().mockResolvedValue(''),
  writeTextFile: vi.fn().mockResolvedValue(undefined),
  readDir: vi.fn().mockResolvedValue([]),
  createDir: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
  metadata: vi.fn().mockResolvedValue({ size: 0, isFile: true, isDir: false }),
  copy: vi.fn().mockResolvedValue(undefined),
  rename: vi.fn().mockResolvedValue(undefined),
  ...customMocks,
})

// Path operations mock factory
export const createPathMock = (customMocks: Partial<any> = {}) => ({
  appDataDir: vi.fn().mockResolvedValue('/mock/app/data'),
  appConfigDir: vi.fn().mockResolvedValue('/mock/app/config'),
  homeDir: vi.fn().mockResolvedValue('/mock/home'),
  documentDir: vi.fn().mockResolvedValue('/mock/documents'),
  join: vi.fn().mockImplementation((...parts) => parts.join('/')),
  dirname: vi.fn().mockImplementation((path) => path.split('/').slice(0, -1).join('/')),
  basename: vi.fn().mockImplementation((path) => path.split('/').pop()),
  extname: vi.fn().mockImplementation((path) => {
    const parts = path.split('.')
    return parts.length > 1 ? `.${parts.pop()}` : ''
  }),
  resolve: vi.fn().mockImplementation((...parts) => '/' + parts.join('/').replace(/\/+/g, '/')),
  ...customMocks,
})

// Core invoke mock factory
export const createCoreMock = (customMocks: Partial<any> = {}) => ({
  invoke: vi.fn().mockResolvedValue({}),
  ...customMocks,
})

// Event system mock factory
export const createEventMock = (customMocks: Partial<any> = {}) => ({
  listen: vi.fn().mockResolvedValue(() => {}),
  emit: vi.fn().mockResolvedValue(undefined),
  once: vi.fn().mockResolvedValue(() => {}),
  ...customMocks,
})

// Window operations mock factory
export const createWindowMock = (customMocks: Partial<any> = {}) => ({
  getCurrent: vi.fn().mockReturnValue({
    setTitle: vi.fn().mockResolvedValue(undefined),
    minimize: vi.fn().mockResolvedValue(undefined),
    maximize: vi.fn().mockResolvedValue(undefined),
    hide: vi.fn().mockResolvedValue(undefined),
    show: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    isMaximized: vi.fn().mockResolvedValue(false),
    isMinimized: vi.fn().mockResolvedValue(false),
    isVisible: vi.fn().mockResolvedValue(true),
  }),
  ...customMocks,
})

// SQL plugin mock factory
export const createSQLMock = (customMocks: Partial<any> = {}) => ({
  Database: {
    load: vi.fn().mockResolvedValue({
      execute: vi.fn().mockResolvedValue({ rowsAffected: 1 }),
      select: vi.fn().mockResolvedValue([]),
      close: vi.fn().mockResolvedValue(undefined),
    }),
  },
  ...customMocks,
})

// All-in-one mock setup function
export const setupTauriMocks = (overrides: {
  fs?: Partial<any>
  path?: Partial<any>
  core?: Partial<any>
  event?: Partial<any>
  window?: Partial<any>
  sql?: Partial<any>
} = {}) => {
  vi.mock('@tauri-apps/plugin-fs', () => createFileSystemMock(overrides.fs))
  vi.mock('@tauri-apps/api/path', () => createPathMock(overrides.path))
  vi.mock('@tauri-apps/api/core', () => createCoreMock(overrides.core))
  vi.mock('@tauri-apps/api/event', () => createEventMock(overrides.event))
  vi.mock('@tauri-apps/api/window', () => createWindowMock(overrides.window))
  vi.mock('@tauri-apps/plugin-sql', () => createSQLMock(overrides.sql))
}

// Reset all mocks
export const resetTauriMocks = () => {
  vi.clearAllMocks()
}