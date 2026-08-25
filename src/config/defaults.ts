import type { WaveformOptions } from '../types/options'

export const defaultOptions = {
  width: '100%',
  height: 320,
  responsive: { enabled: true, aspectRatio: 2.5, minHeight: 220, maxHeight: 600 },
  layout: { autoPadding: true },
  padding: { top: 42, right: 72, bottom: 58, left: 72 },
  frame: {
    visible: true,
    borderColor: '#000000', borderWidth: 1.3, borderStyle: 'solid', backgroundColor: 'transparent', radius: 0,
  },
  line: { visible: true, color: '#2563eb', width: 2, type: 'linear', style: 'solid', opacity: 1 },
  point: { visible: false, type: 'circle', size: 3, color: '#2563eb', borderColor: '#ffffff', borderWidth: 1 },
  xAxis: {
    visible: true, position: 'left', min: undefined, max: undefined, tickCount: 8, hideEndTicks: true, tickSize: 6, tickPadding: 6, tickFormat: '',
    color: '#000000', width: 1.3, fontSize: 11, fontColor: '#475569', label: '', unit: '',
    title: { visible: false, text: '', unit: '', color: '#334155', fontSize: 12, fontWeight: 500, offset: 38 },
  },
  yAxis: {
    visible: true, position: 'left', min: undefined, max: undefined, tickCount: 6, tickSize: 6, tickPadding: 6, tickFormat: '',
    color: '#000000', width: 1.3, fontSize: 11, fontColor: '#475569', label: '', unit: '',
    title: { visible: false, text: '', unit: '', color: '#334155', fontSize: 12, fontWeight: 500, offset: 52 },
  },
  secondaryYAxis: {
    visible: false, position: 'right', min: undefined, max: undefined, tickCount: 6, tickSize: 6, tickPadding: 6, tickFormat: '',
    color: '#000000', width: 1.3, fontSize: 11, fontColor: '#475569', label: '', unit: '',
    title: { visible: false, text: '', unit: '', color: '#334155', fontSize: 12, fontWeight: 500, offset: 52 },
  },
  grid: { visible: true, x: { visible: true, color: '#e2e8f0', width: 1, dash: '3 3' }, y: { visible: true, color: '#e2e8f0', width: 1, dash: '3 3' } },
  zeroLine: { visible: true, color: '#94a3b8', width: 1, dash: '4 4' },
  title: { visible: false, text: '', align: 'center', color: '#0f172a', fontSize: 16, fontWeight: 600 },
  legend: { visible: true, position: 'top-right', orientation: 'vertical', color: '#334155', fontSize: 12, itemGap: 8, lineLength: 24 },
  emptyState: { visible: true, text: 'No waveform data', color: '#94a3b8', fontSize: 13 },
} satisfies WaveformOptions
