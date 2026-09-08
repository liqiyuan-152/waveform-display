import { describe, expect, it } from 'vitest'
import { formatScientificAxisTick, resolveScientificExponent } from './formatters'

describe('Y-axis scientific formatting', () => {
  it('rounds to five significant digits before limiting decimals to four', () => {
    expect(formatScientificAxisTick(1234.56, [0, 9999], 9999)).toBe('1.2346')
    expect(formatScientificAxisTick(12.34567, [0, 999], 999)).toBe('12.346')
    expect(formatScientificAxisTick(0.123456, [0, 1], 1)).toBe('0.1235')
    expect(formatScientificAxisTick(3.1, [0, 5], 5)).toBe('3.1')
    expect(formatScientificAxisTick(-0.00001, [-1, 1], 1)).toBe('0')
  })

  it('shows trimmed units only on the top tick in either notation', () => {
    expect(formatScientificAxisTick(3, [0, 3], 3, ' V ')).toBe('(V) 3')
    expect(formatScientificAxisTick(2, [0, 3], 3, 'V')).toBe('2')
    expect(formatScientificAxisTick(3, [0, 3], 3, '  ')).toBe('3')
    expect(formatScientificAxisTick(3000, [0, 3000], 3000, ' V ')).toBe('E+03 (V) 3')
    expect(formatScientificAxisTick(3000, [0, 3000], 3000, '  ')).toBe('E+03 3')
  })

  it('handles negative and crossing-zero domains with one shared exponent', () => {
    expect(formatScientificAxisTick(-3000, [-100000, -3000], -3000)).toBe('E+05 -0.03')
    expect(formatScientificAxisTick(3000, [-10000, 3000], 3000)).toBe('E+04 0.3')
    expect(formatScientificAxisTick(0, [-1000, 0], 0)).toBe('E+03 0')
    expect(formatScientificAxisTick(1e120, [0, 1e120], 1e120)).toBe('E+120 1')
  })

  it('preserves non-finite values and rejects non-finite domain magnitudes', () => {
    for (const value of [NaN, Infinity, -Infinity]) {
      expect(formatScientificAxisTick(value, [0, 1], value, 'V')).toBe(String(value))
      expect(resolveScientificExponent(0, value)).toBeNull()
    }
  })

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
    expect(formatScientificAxisTick(1000, domain, 3000)).toBe('1')
    expect(formatScientificAxisTick(2000, domain, 3000)).toBe('2')
    expect(formatScientificAxisTick(3000, domain, 3000, 'V')).toBe('E+03 (V) 3')
  })

  it('places the parenthesized unit immediately after the shared exponent', () => {
    const domain: [number, number] = [0.0001, 0.0003]
    expect(formatScientificAxisTick(0.0001, domain, 0.0003, 'V')).toBe('1')
    expect(formatScientificAxisTick(0.0003, domain, 0.0003, 'V')).toBe('E-04 (V) 3')
  })

  it('removes trailing zeroes and normalizes negative zero', () => {
    expect(formatScientificAxisTick(123.456, [0, 999], 999, 'V')).toBe('123.46')
    expect(formatScientificAxisTick(1, [0, 2], 2)).toBe('1')
    expect(formatScientificAxisTick(-0, [-1, 1], 1)).toBe('0')
  })
})
