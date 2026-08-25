import { Waveform, type WaveformSeries } from '../index'

const series: WaveformSeries[] = [
  {
    name: 'Voltage',
    unit: 'V',
    order: 1,
    yAxis: 'left',
    data: Array.from({ length: 240 }, (_, i) => ({ x: i / 20, y: Math.sin(i / 10) * 0.8 + Math.sin(i / 3) * 0.08 })),
    style: { color: '#2563eb', lineWidth: 2 },
  },
  {
    name: 'Current',
    unit: 'mA',
    order: 2,
    yAxis: 'right',
    data: Array.from({ length: 240 }, (_, i) => ({ x: i / 20, y: 40 + Math.cos(i / 14) * 16 })),
    style: { color: '#dc2626', lineWidth: 1.5, lineStyle: 'dashed', point: { visible: true, type: 'diamond', size: 2.5, color: '#dc2626' } },
  },
]

document.body.style.margin = '0'
document.body.style.padding = '32px'
document.body.style.background = '#f8fafc'
document.body.style.fontFamily = 'Inter, system-ui, sans-serif'
document.querySelector<HTMLDivElement>('#app')!.innerHTML = '<div style="max-width:1200px;margin:auto"><div id="waveform" style="width:100%"></div></div>'

const chart = new Waveform('#waveform', series, {
  width: '100%',
  responsive: { enabled: true, aspectRatio: 2.6 },
  title: { visible: true, text: 'Configurable Waveform Display' },
  legend: { visible: true, position: 'top-left', orientation: 'horizontal' },
  frame: {
    visible: true,
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 1.3,
  },
  xAxis: { tickFormat: '.1f', title: { visible: true, text: 'Time', unit: 's' } },
  yAxis: { position: 'left', tickFormat: '.2f', title: { visible: true, text: 'Voltage', unit: 'V' } },
  secondaryYAxis: { visible: true, position: 'right', tickFormat: '.0f', title: { visible: true, text: 'Current', unit: 'mA' } },
  grid: { x: { dash: '2 4' }, y: { dash: '2 4' } },
})

console.info('SVG export available via chart.toSVGString() or chart.downloadSVG()')
void chart
