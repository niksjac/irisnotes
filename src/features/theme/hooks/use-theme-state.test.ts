import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useThemeState } from './use-theme-state'

describe('useThemeState', () => {
  it('should initialize with darkMode set to false', () => {
    const { result } = renderHook(() => useThemeState())

    expect(result.current.darkMode).toBe(false)
    expect(typeof result.current.setDarkMode).toBe('function')
  })

  it('should update darkMode when setDarkMode is called', () => {
    const { result } = renderHook(() => useThemeState())

    act(() => {
      result.current.setDarkMode(true)
    })

    expect(result.current.darkMode).toBe(true)
  })

  it('should toggle darkMode correctly', () => {
    const { result } = renderHook(() => useThemeState())

    // Start with false
    expect(result.current.darkMode).toBe(false)

    // Toggle to true
    act(() => {
      result.current.setDarkMode(prev => !prev)
    })
    expect(result.current.darkMode).toBe(true)

    // Toggle back to false
    act(() => {
      result.current.setDarkMode(prev => !prev)
    })
    expect(result.current.darkMode).toBe(false)
  })

  it('should maintain state across multiple calls', () => {
    const { result } = renderHook(() => useThemeState())

    act(() => {
      result.current.setDarkMode(true)
    })
    expect(result.current.darkMode).toBe(true)

    act(() => {
      result.current.setDarkMode(true)
    })
    expect(result.current.darkMode).toBe(true)

    act(() => {
      result.current.setDarkMode(false)
    })
    expect(result.current.darkMode).toBe(false)
  })

  it('should return stable function reference for setDarkMode', () => {
    const { result, rerender } = renderHook(() => useThemeState())

    const firstSetDarkMode = result.current.setDarkMode

    rerender()

    const secondSetDarkMode = result.current.setDarkMode

    expect(firstSetDarkMode).toBe(secondSetDarkMode)
  })
})