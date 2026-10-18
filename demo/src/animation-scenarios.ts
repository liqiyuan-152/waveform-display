import type { WaveformSeries } from '../../src/index'

export function animationScenario(name: string, version: number): WaveformSeries[] {
  const start = name === 'window' ? version : 0
  const count = name === 'append' ? 10 + version % 10 : 14
  const amplitude = name === 'extreme' ? 1e8 : name === 'auto-padding' ? 10 ** (version % 5) : 1 + version % 4
  return ['signal', 'reference'].map((id, index) => ({
    id, name: index ? '参考通道' : '信号通道',
    data: Array.from({ length: count }, (_, offset) => {
      const x = start + offset
      return { id: `point-${x}`, x, y: Math.sin(x / 3 + version / 4 + index) * amplitude }
    }),
  }))
}
