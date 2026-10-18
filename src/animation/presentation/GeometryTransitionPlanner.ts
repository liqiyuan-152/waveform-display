import type { WaveformPoint } from '../../types/data.js'
import { diffPoints } from './PointDiff.js'

export interface GeometryTransition {
  from: WaveformPoint[]
  to: WaveformPoint[]
}

/** New points start at their own value in the previous shared coordinate system. */
export function planGeometry(previous: readonly WaveformPoint[], target: readonly WaveformPoint[]): GeometryTransition | undefined {
  const matches = diffPoints(previous, target)
  if (!matches) return undefined
  return {
    from: matches.map(match => ({ ...(match.previous ?? match.target) })),
    to: matches.map(match => ({ ...match.target })),
  }
}

export function interpolateGeometry(plan: GeometryTransition, progress: number): WaveformPoint[] {
  const points = plan.to.map((point, index) => ({
    ...point,
    x: plan.from[index].x * (1 - progress) + point.x * progress,
    y: plan.from[index].y * (1 - progress) + point.y * progress,
  }))
  if (points.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) throw new Error('Non-finite animation geometry')
  return points
}
