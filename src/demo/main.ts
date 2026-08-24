import { Waveform } from '../index'

const data = Array.from({ length: 240 }, (_, i) => ({
  x: i / 20,
  y: Math.sin(i / 10) * 0.8 + Math.sin(i / 3) * 0.08,
}))

document.body.style.margin = '0'
document.body.style.padding = '32px'
document.body.style.background = '#f8fafc'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = '<div id="waveform"></div>'

new Waveform('#waveform', data, {
  width: 1000,
  height: 420,
  title: { visible: true, text: 'Waveform Display' },
  frame: { borderColor: '#475569', borderWidth: 2, borderStyle: 'solid', backgroundColor: '#ffffff' },
  line: { color: '#2563eb', width: 2 },
  xAxis: { label: 'Time' },
  yAxis: { label: 'Amplitude' },
})
