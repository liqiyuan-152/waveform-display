import { Waveform, type WaveformSeries } from '../index'

const series: WaveformSeries[] = [
  {
    name: 'CH1',
    unit: 'V',
    order: 2,
    data: Array.from({ length: 240 }, (_, i) => ({ x: i / 20, y: Math.sin(i / 10) * 0.8 + Math.sin(i / 3) * 0.08 })),
    style: { color: '#2563eb', lineWidth: 2, area: { visible: true, opacity: 0.08 } },
  },
  {
    name: 'CH2',
    unit: 'V',
    order: 1,
    data: Array.from({ length: 240 }, (_, i) => ({ x: i / 20, y: Math.cos(i / 14) * 0.45 })),
    style: { color: '#dc2626', lineWidth: 1.5, lineStyle: 'dashed', point: { visible: true, type: 'diamond', size: 2.5, color: '#dc2626' } },
  },
]

document.body.style.margin = '0'
document.body.style.padding = '32px'
document.body.style.background = '#f8fafc'
document.body.style.fontFamily = 'Inter, system-ui, sans-serif'
document.querySelector<HTMLDivElement>('#app')!.innerHTML = '<div style="max-width:1200px;margin:auto"><div id="waveform" style="width:100%"></div></div>'

new Waveform('#waveform', series, {
  width: '100%',
  responsive: { enabled: true, aspectRatio: 2.6 },
  title: { visible: true, text: 'Configurable Waveform Display' },
  legend: { visible: true, position: 'top-right' },
  frame: {
    backgroundColor: '#ffffff',
    top: { color: '#475569', width: 2 },
    right: { color: '#94a3b8', width: 1 },
    bottom: { color: '#475569', width: 2 },
    left: { color: '#475569', width: 2 },
  },
  xAxis: { tickFormat: '.1f', title: { visible: true, text: 'Time', unit: 's' } },
  yAxis: { position: 'right', tickFormat: '.2f', title: { visible: true, text: 'Amplitude', unit: 'V' } },
  grid: { x: { dash: '2 4' }, y: { dash: '2 4' } },
})
