import { Waveform, type WaveformOptions, type WaveformSeries } from '../index'
import { resolveOptions } from '../config/resolve'
import { createConfigPanel } from './config-panel'
import waveformData from './waveform-data.json'
import './styles.css'

const colors = ['#2563eb', '#dc2626', '#16a34a', '#9333ea']
const valueAxisIds = ['signal-a', 'signal-b', 'signal-c']
const framePadding = { top: 32, right: 72, bottom: 62, left: 72 }
const shot = waveformData[0]?.shot

let series: WaveformSeries[] = waveformData.map((waveform, index) => ({
  id: String(waveform.chnl_id),
  name: waveform.chnl,
  unit: waveform.dat_unit,
  order: index + 1,
  yAxis: valueAxisIds[index % valueAxisIds.length],
  data: waveform.data.map((y, pointIndex) => ({ x: waveform.time[pointIndex], y })),
  style: { color: colors[index], lineWidth: 3 },
}))

const initialOptions: WaveformOptions = resolveOptions({
  width: '100%',
  responsive: { enabled: true, aspectRatio: 2.6 },
  layout: { autoPadding: true },
  padding: framePadding,
  shot: { visible: shot !== undefined && shot !== null, text: shot == null ? '' : String(shot), fontSize: 11 },
  legend: { visible: true, position: 'top-left', orientation: 'horizontal' },
  frame: {
    visible: true,
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 1.3,
  },
  point: { visible: false },
  xDomainStrategy: { type: 'nice', bounds: 'both', tickCount: 10 },
  xAxis: { showEndValues: true, tickFormat: '.0f', title: { visible: true, text: 'Time', unit: 'ms' } },
  yAxes: [
    { id: 'signal-a', position: 'left', title: { visible: true, text: 'Signal A', unit: 'ms' } },
    { id: 'signal-b', position: 'left', color: '#dc2626', fontColor: '#b42318', title: { visible: true, text: 'Signal B', unit: 'ms', color: '#b42318' } },
    { id: 'signal-c', position: 'right', color: '#16a34a', fontColor: '#15803d', title: { visible: true, text: 'Signal C', unit: 'ms', color: '#15803d' } },
  ],
  grid: { style: 'dashed', color: '#e2e8f0', y: { axisId: 'signal-a' } },
  zeroLine: { axisId: 'signal-a' },
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
