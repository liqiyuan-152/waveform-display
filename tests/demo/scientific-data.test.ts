import { describe, expect, it } from 'vitest'
import { scientificSeries } from '../../src/demo/scientific-data'
import { formatScientificAxisHeader, formatScientificAxisTick } from '../../src/renderer/formatters'

describe('scientific demo data', () => {
  it('shows a shared E-03 exponent on its Y axis', () => {
    const values = scientificSeries[0].data.map(point => point.y)
    const domain: [number, number] = [Math.min(...values), Math.max(...values)]
    expect(domain).toEqual([0.002, 0.008])
    expect(formatScientificAxisHeader(domain, scientificSeries[0].unit)).toBe('ms\u00a0\u00a0E-03')
    expect(formatScientificAxisTick(domain[0], domain)).toBe('2')
    expect(formatScientificAxisTick(domain[1], domain)).toBe('8')
  })
})
