import * as d3 from 'd3'
import type { WaveformLineStyle, WaveformLineType } from '../types/data'

export function curveFor(type: WaveformLineType) {
  switch (type) {
    case 'step-start': return d3.curveStepBefore
    case 'step-middle': return d3.curveStep
    case 'step-end': return d3.curveStepAfter
    default: return d3.curveLinear
  }
}

export function dashFor(style: WaveformLineStyle): string | null {
  if (style === 'dashed') return '8 5'
  if (style === 'dash-dot') return '8 4 2 4'
  return null
}

export function borderDash(style: 'solid' | 'dashed' | 'dotted'): string | null {
  if (style === 'dashed') return '6 4'
  if (style === 'dotted') return '1 3'
  return null
}
