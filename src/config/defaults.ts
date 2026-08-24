import type { WaveformOptions } from '../types/options'

export const defaultOptions: Required<WaveformOptions> = {
  width: 800,
  height: 320,
  padding: { top: 36, right: 24, bottom: 44, left: 56 },
  frame: { visible: true, borderColor: '#94a3b8', borderWidth: 1, borderStyle: 'solid', backgroundColor: '#ffffff' },
  line: { visible: true, color: '#2563eb', width: 2, type: 'linear', style: 'solid', opacity: 1 },
  point: { visible: false, type: 'circle', size: 3, color: '#2563eb', borderColor: '#ffffff', borderWidth: 1 },
  xAxis: { visible: true, min: undefined as unknown as number, max: undefined as unknown as number, tickCount: 8, color: '#64748b', width: 1, fontSize: 11, fontColor: '#475569', label: '' },
  yAxis: { visible: true, min: undefined as unknown as number, max: undefined as unknown as number, tickCount: 6, color: '#64748b', width: 1, fontSize: 11, fontColor: '#475569', label: '' },
  grid: { visible: true, x: { visible: true, color: '#e2e8f0', width: 1, dash: '3 3' }, y: { visible: true, color: '#e2e8f0', width: 1, dash: '3 3' } },
  zeroLine: { visible: true, color: '#94a3b8', width: 1, dash: '4 4' },
  title: { visible: false, text: '', align: 'center', color: '#0f172a', fontSize: 16, fontWeight: 600 },
}
