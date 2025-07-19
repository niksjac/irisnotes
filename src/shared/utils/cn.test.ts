import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn utility function', () => {
  it('should concatenate string class names', () => {
    const result = cn('class1', 'class2', 'class3')
    expect(result).toBe('class1 class2 class3')
  })

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'conditional', false && 'not-included')
    expect(result).toBe('base conditional')
  })

  it('should handle undefined and null values', () => {
    const result = cn('base', undefined, null, 'valid')
    expect(result).toBe('base valid')
  })

  it('should handle arrays of classes', () => {
    const result = cn(['class1', 'class2'], 'class3')
    expect(result).toBe('class1 class2 class3')
  })

  it('should handle objects with boolean values', () => {
    const result = cn({
      'class1': true,
      'class2': false,
      'class3': true
    })
    expect(result).toBe('class1 class3')
  })

  it('should handle empty inputs', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle mixed input types', () => {
    const result = cn(
      'base',
      ['array1', 'array2'],
      { 'object1': true, 'object2': false },
      true && 'conditional'
    )
    expect(result).toBe('base array1 array2 object1 conditional')
  })

  it('should handle classes with whitespace', () => {
    const result = cn('  class1  ', '  class2  ')
    expect(result).toBe('  class1     class2  ')
  })
})