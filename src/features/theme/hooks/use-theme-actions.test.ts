import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useThemeActions } from './use-theme-actions'

// Mock Tauri APIs
vi.mock('@tauri-apps/api/path', () => ({
  appConfigDir: vi.fn()
}))

vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn(),
  exists: vi.fn()
}))

// Mock the theme state hook
vi.mock('./use-theme-state', () => ({
  useThemeState: vi.fn()
}))

import { appConfigDir } from '@tauri-apps/api/path'
import { readTextFile, exists } from '@tauri-apps/plugin-fs'
import { useThemeState } from './use-theme-state'

describe('useThemeActions', () => {
  const mockSetDarkMode = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock useThemeState to return our mock function
    ;(useThemeState as any).mockReturnValue({
      setDarkMode: mockSetDarkMode
    })

    // Reset document.documentElement
    document.documentElement.removeAttribute('data-theme')

    // Clear any existing theme styles
    const existingStyle = document.getElementById('user-theme-styles')
    if (existingStyle) {
      existingStyle.remove()
    }
  })

  afterEach(() => {
    // Clean up any styles added during tests
    const existingStyle = document.getElementById('user-theme-styles')
    if (existingStyle) {
      existingStyle.remove()
    }
  })

  describe('toggleDarkMode', () => {
    it('should toggle dark mode and update document attribute', () => {
      const { result } = renderHook(() => useThemeActions())

      act(() => {
        result.current.toggleDarkMode()
      })

      expect(mockSetDarkMode).toHaveBeenCalledWith(expect.any(Function))

      // Test the function passed to setDarkMode
      const setDarkModeCallback = mockSetDarkMode.mock.calls[0]?.[0]
      expect(setDarkModeCallback).toBeDefined()
      const newMode = setDarkModeCallback(false) // simulate current mode is false

      expect(newMode).toBe(true)
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('should set light mode when toggling from dark', () => {
      const { result } = renderHook(() => useThemeActions())

      act(() => {
        result.current.toggleDarkMode()
      })

      // Test toggling from dark (true) to light (false)
      const setDarkModeCallback = mockSetDarkMode.mock.calls[0]?.[0]
      expect(setDarkModeCallback).toBeDefined()
      const newMode = setDarkModeCallback(true) // simulate current mode is true

      expect(newMode).toBe(false)
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })

    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useThemeActions())

      const firstToggleDarkMode = result.current.toggleDarkMode

      rerender()

      const secondToggleDarkMode = result.current.toggleDarkMode

      expect(firstToggleDarkMode).toBe(secondToggleDarkMode)
    })
  })

  describe('loadUserTheme', () => {
    it('should load and inject theme CSS when theme file exists', async () => {
      const mockConfigDir = '/mock/config/dir'
      const mockThemeCSS = 'body { background: red; }'

      ;(appConfigDir as any).mockResolvedValue(mockConfigDir)
      ;(exists as any).mockResolvedValue(true)
      ;(readTextFile as any).mockResolvedValue(mockThemeCSS)

      const { result } = renderHook(() => useThemeActions())

      await act(async () => {
        await result.current.loadUserTheme()
      })

      expect(appConfigDir).toHaveBeenCalled()
      expect(exists).toHaveBeenCalledWith(`${mockConfigDir}/theme.css`)
      expect(readTextFile).toHaveBeenCalledWith(`${mockConfigDir}/theme.css`)

      // Check that style element was added to document
      const styleElement = document.getElementById('user-theme-styles')
      expect(styleElement).toBeTruthy()
      expect(styleElement?.textContent).toBe(mockThemeCSS)
      expect(styleElement?.tagName).toBe('STYLE')
    })

    it('should replace existing theme styles when loading new theme', async () => {
      const mockConfigDir = '/mock/config/dir'
      const originalCSS = 'body { background: blue; }'
      const newCSS = 'body { background: green; }'

      // Add existing style element
      const existingStyle = document.createElement('style')
      existingStyle.id = 'user-theme-styles'
      existingStyle.textContent = originalCSS
      document.head.appendChild(existingStyle)

      ;(appConfigDir as any).mockResolvedValue(mockConfigDir)
      ;(exists as any).mockResolvedValue(true)
      ;(readTextFile as any).mockResolvedValue(newCSS)

      const { result } = renderHook(() => useThemeActions())

      await act(async () => {
        await result.current.loadUserTheme()
      })

      // Check that old style was removed and new style was added
      const styleElement = document.getElementById('user-theme-styles')
      expect(styleElement).toBeTruthy()
      expect(styleElement?.textContent).toBe(newCSS)

      // Should only be one style element with this ID
      const allThemeStyles = document.querySelectorAll('#user-theme-styles')
      expect(allThemeStyles).toHaveLength(1)
    })

    it('should not inject styles when theme file does not exist', async () => {
      const mockConfigDir = '/mock/config/dir'

      ;(appConfigDir as any).mockResolvedValue(mockConfigDir)
      ;(exists as any).mockResolvedValue(false)

      const { result } = renderHook(() => useThemeActions())

      await act(async () => {
        await result.current.loadUserTheme()
      })

      expect(appConfigDir).toHaveBeenCalled()
      expect(exists).toHaveBeenCalledWith(`${mockConfigDir}/theme.css`)
      expect(readTextFile).not.toHaveBeenCalled()

      // Check that no style element was added
      const styleElement = document.getElementById('user-theme-styles')
      expect(styleElement).toBeFalsy()
    })

    it('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockError = new Error('Failed to read config')

      ;(appConfigDir as any).mockRejectedValue(mockError)

      const { result } = renderHook(() => useThemeActions())

      await act(async () => {
        await result.current.loadUserTheme()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load user theme:', mockError)

      consoleSpy.mockRestore()
    })

    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useThemeActions())

      const firstLoadUserTheme = result.current.loadUserTheme

      rerender()

      const secondLoadUserTheme = result.current.loadUserTheme

      expect(firstLoadUserTheme).toBe(secondLoadUserTheme)
    })
  })
})