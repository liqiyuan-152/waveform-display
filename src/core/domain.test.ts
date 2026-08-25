import { describe, expect, it } from 'vitest'
import { applyXDomainStrategy } from './domain'

describe('X-domain strategy', () => {
  it('preserves the exact data domain by default', () => {
    expect(applyXDomainStrategy([0, 4.999999], { type: 'data' })).toEqual([0, 4.999999])
  })

  it('expands both bounds or only the end to readable values', () => {
    expect(applyXDomainStrategy([0.123, 4.999999], { type: 'nice', tickCount: 10 })).toEqual([0, 5])
    expect(applyXDomainStrategy([0.123, 4.999999], { type: 'nice', bounds: 'end', tickCount: 10 })).toEqual([0.123, 5])
  })

  it('preserves explicit domains unless includeExplicit is enabled', () => {
    const domain: [number, number] = [0.123, 4.999999]
    expect(applyXDomainStrategy(domain, { type: 'nice' }, true)).toEqual(domain)
    expect(applyXDomainStrategy(domain, { type: 'nice', includeExplicit: true }, true)).toEqual([0, 5])
  })

  it('falls back to a stable tick count for invalid values', () => {
    expect(applyXDomainStrategy([0.123, 4.999999], { type: 'nice', tickCount: 0 })).toEqual([0, 5])
  })
})
