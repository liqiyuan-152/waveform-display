import type { WaveformOptions } from '../types/options'

export const defaultOptions = {
  width: '100%',
  height: 320,
  responsive: { enabled: true, aspectRatio: 2.5, minHeight: 220, maxHeight: 600 },
  padding: { top: 42, right: 72, bottom: 58, left: 72 },
  frame: {
    visible: true,
    borderColor: '#94a3b8', borderWidth: 1, borderStyle: 'solid', backgroundColor: '#ffffff', radius: 0,
    top: { visible: true, color: '#94a3b8', width: 1, style: 'solid' },
    right: { visible: true, color: '#94a3b8', width: 1, style: 'solid' },
    bottom: { visible: true, color: '#94a3b8', width: 1, style: 'solid' },
    left: { visible: true, color: '#94a3b8', width: 1, style: 'solid' },
  },
  line: { visible: true, color: '#2563eb', width: 2, type: 'linear', style: 'solid', opacity: 1 },
  point: { visible: false, type: 'circle', size: 3, color: '#2563eb', borderColor: '#ffffff', borderWidth: 1 },
  area: { visible: false, color: '#2563eb', opacity: 0.12, baseline: 0 },
  xAxis: {
    visible: true, position: 'left', min: undefined, max: undefined, tickCount: 8, tickSize: 6, tickPadding: 6, tickFormat: '',
    color: '#64748b', width: 1, fontSize: 11, fontColor: '#475569', label: '', unit: '',
    title: { visible: false, text: '', unit: '', color: '#334155', fontSize: 12, fontWeight: 500, offset: 38 },
  },
  yAxis: {
    visible: true, position: 'left', min: undefined, max: undefined, tickCount: 6, tickSize: 6, tickPadding: 6, tickFormat: '',
    color: '#64748b', width: 1, fontSize: 11, fontColor: '#475569', label: '', unit: '',
    title: { visible: false, text: '', unit: '', color: '#334155', fontSize: 12, fontWeight: 500, offset: 52 },
  },
  grid: { visible: true, x: { visible: true, color: '#e2e8f0', width: 1, dash: '3 3' }, y: { visible: true, color: '#e2e8f0', width: 1, dash: '3 3' } },
  zeroLine: { visible: true, color: '#94a3b8', width: 1, dash: '4 4' },
  title: { visible: false, text: '', align: 'center', color: '#0f172a', fontSize: 16, fontWeight: 600 },
  legend: { visible: true, position: 'top-right', color: '#334155', fontSize: 12, itemGap: 4 },
} satisfies WaveformOptions
