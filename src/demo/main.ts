import { Waveform, type WaveformOptions, type WaveformSeries } from '../index'
import { resolveOptions } from '../config/resolve'
import { createConfigPanel } from './config-panel'
import waveformData from './waveform-data.json'
import './styles.css'

const colors = ['#2563eb', '#dc2626', '#16a34a', '#9333ea']
const valueAxisIds = waveformData.map((_, index) => `signal-${index + 1}`)
const rightAxisStart = Math.ceil(waveformData.length / 2)
const framePadding = { top: 32, right: 72, bottom: 62, left: 72 }

let series: WaveformSeries[] = waveformData.map((waveform, index) => ({
  id: String(waveform.chnl_id),
  name: waveform.chnl,
  shot: waveform.shot,
  unit: waveform.dat_unit,
  order: index + 1,
  yAxis: valueAxisIds[index],
  data: waveform.data.map((y, pointIndex) => ({ x: waveform.time[pointIndex], y })),
  style: { color: colors[index % colors.length], lineWidth: 3 },
}))

const initialOptions: WaveformOptions = resolveOptions({
  width: '100%',
  responsive: { enabled: true, aspectRatio: 2.6 },
  layout: { autoPadding: true },
  padding: framePadding,
  shot: {
    visible: true,
    text: '#10001',
    color: '#78E8FF',
    fontSize: 14,
  },
  legend: {
    visible: true,
    position: 'top-left',
    orientation: 'horizontal',
    color: '#78E8FF',
    fontSize: 14,
  },
  frame: {
    visible: true,
    backgroundColor: '#000000',
    borderColor: '#78E8FF',
    borderWidth: 2,
  },
  point: { visible: false },
  xDomainStrategy: { type: 'nice', bounds: 'both', tickCount: 10 },
  xAxis: {
    color: '#e2e8f0',
    fontColor: '#78E8FF',
    fontSize: 14,
    showEndValues: true,
    tickFormat: '.0f',
    title: { visible: true, text: 'Time', unit: 'ms', color: '#78E8FF', fontSize: 14 },
  },
  yAxes: waveformData.map((waveform, index) => {
    const color = colors[index % colors.length]
    const isInnerAxis = index === 0 || index === rightAxisStart
    return {
      id: valueAxisIds[index],
      position: index < rightAxisStart ? 'left' : 'right',
      color,
      fontColor: color,
      fontSize: 14,
      tickSize: 3,
      tickPadding: isInnerAxis ? 5 : 2,
      unit: waveform.dat_unit,
      title: { visible: true, text: waveform.chnl, unit: waveform.dat_unit, color, fontSize: 14 },
    }
  }),
  grid: { style: 'dashed', color: '#475569', y: { axisId: valueAxisIds[0] } },
  zeroLine: { axisId: valueAxisIds[0], color: '#94a3b8' },
})

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <main class="workspace">
    <aside class="control-pane" aria-label="图表配置">
      <div id="config-panel"></div>
    </aside>
    <section class="preview-pane" aria-labelledby="page-title">
      <header class="preview-pane__header">
        <h1 id="page-title">波形图预览</h1>
      </header>
      <div class="preview-stage">
        <div id="waveform" class="waveform-preview"></div>
      </div>
    </section>
  </main>
`

const chart = new Waveform('#waveform', series, initialOptions)
let emptyPreview = false

createConfigPanel(document.querySelector<HTMLDivElement>('#config-panel')!, {
  options: initialOptions,
  series,
  onOptionsChange: options => chart.updateOptions(options),
  onSeriesChange: nextSeries => {
    series = nextSeries
    if (!emptyPreview) chart.updateData(series)
  },
  onEmptyPreviewChange: enabled => {
    emptyPreview = enabled
    chart.updateData(enabled ? [] : series)
  },
})

console.info('SVG export available via chart.toSVGString() or chart.downloadSVG()')
