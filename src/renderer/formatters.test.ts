import { describe, expect, it } from 'vitest'
import { formatScientificAxisTick, resolveScientificExponent } from './formatters'

describe('Y-axis scientific formatting', () => {
  it('uses scientific notation at the supported magnitude boundaries', () => {
    expect(resolveScientificExponent(0, 0)).toBeNull()
    expect(resolveScientificExponent(0, 0.000999)).toBe(-4)
    expect(resolveScientificExponent(0, 0.001)).toBeNull()
    expect(resolveScientificExponent(0, 999.999)).toBeNull()
    expect(resolveScientificExponent(0, 1000)).toBe(3)
  })

  it('derives the exponent from the largest absolute endpoint', () => {
    expect(resolveScientificExponent(-100_000, -3000)).toBe(5)
    expect(resolveScientificExponent(-10_000, 3000)).toBe(4)
  })

  it('shows one shared exponent on the domain end tick and scales every tick', () => {
    const domain: [number, number] = [1000, 3000]
    expect(formatScientificAxisTick(1000, domain, 3000)).toBe('1.00')
    expect(formatScientificAxisTick(2000, domain, 3000)).toBe('2.00')
    expect(formatScientificAxisTick(3000, domain, 3000, 'V')).toBe('E+03 (V)\n3.00')
  })

  it('places the parenthesized unit immediately after the shared exponent', () => {
    const domain: [number, number] = [0.0001, 0.0003]
    expect(formatScientificAxisTick(0.0001, domain, 0.0003, 'V')).toBe('1.00')
    expect(formatScientificAxisTick(0.0003, domain, 0.0003, 'V')).toBe('E-04 (V)\n3.00')
  })

  it('keeps two decimal places for ordinary values and normalizes negative zero', () => {
    expect(formatScientificAxisTick(123.456, [0, 999], 999, 'V')).toBe('123.46')
    expect(formatScientificAxisTick(1, [0, 2], 2)).toBe('1.00')
    expect(formatScientificAxisTick(-0, [-1, 1], 1)).toBe('0.00')
  })
})
