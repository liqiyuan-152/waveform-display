import type { Domain } from '../domain/DomainStrategy.js'
import type { TickStrategy } from './TickStrategy.js'
import { fallback, generate, niceInterval } from './numeric.js'

export class NiceYTickStrategy implements TickStrategy {
  within(domain: Domain, tickCount = 6) {
    return generate(domain, niceInterval(domain, tickCount, 'y'))
  }

  target(domain: Domain, tickCount = 6, fixedStart = false, fixedEnd = false) {
    const step = niceInterval(domain, tickCount, 'y')
    if (!step) return fallback(domain)
    const reverse = domain[0] > domain[1]
    const low = Math.min(...domain)
    const high = Math.max(...domain)
    const fixedLow = reverse ? fixedEnd : fixedStart
    const fixedHigh = reverse ? fixedStart : fixedEnd
    const expandedLow = fixedLow ? low : Math.floor(low / step) * step
    const expandedHigh = fixedHigh ? high : Math.ceil(high / step) * step
    if (!Number.isFinite(expandedLow) || !Number.isFinite(expandedHigh)) return fallback(domain)
    const target: Domain = reverse ? [expandedHigh, expandedLow] : [expandedLow, expandedHigh]
    return generate(target, step)
  }
}
