import * as d3 from 'd3'
import type { XDomainStrategy } from '../types/options'

const DEFAULT_NICE_TICK_COUNT = 10

function resolveTickCount(value: number | undefined): number {
  if (!Number.isFinite(value) || (value ?? 0) < 1) return DEFAULT_NICE_TICK_COUNT
  return Math.max(1, Math.trunc(value!))
}

/** Expands an X domain to readable boundaries without changing source coordinates. */
export function applyXDomainStrategy(
  domain: [number, number],
  strategy: XDomainStrategy,
  explicit = false,
): [number, number] {
  if (strategy.type !== 'nice' || (explicit && !strategy.includeExplicit)) return [...domain]

  const niceDomain = d3.scaleLinear()
    .domain(domain)
    .nice(resolveTickCount(strategy.tickCount))
    .domain() as [number, number]

  return strategy.bounds === 'end' ? [domain[0], niceDomain[1]] : niceDomain
}
