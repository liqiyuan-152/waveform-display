import type { WaveformData, WaveformPoint, WaveformSeries } from '../types/data'

function isPoint(value: WaveformPoint | WaveformSeries): value is WaveformPoint {
  return 'x' in value && 'y' in value
}

export function normalizeData(data: WaveformData): WaveformSeries[] {
  if (!data.length) return []
  if (isPoint(data[0] as WaveformPoint | WaveformSeries)) {
    return [{ id: 'series-0', data: data as WaveformPoint[] }]
  }
  return data as WaveformSeries[]
}
