import { Waveform, type WaveformOptions, type WaveformSeries } from '../index'
import { resolveOptions } from '../config/resolve'
import { createConfigPanel } from './config-panel'
import { scientificSeries } from './scientific-data'
import waveformData from './waveform-data.json'
import './styles.css'

const colors = ['#2563eb', '#dc2626', '#16a34a', '#9333ea']
const rightAxisStart = Math.ceil(waveformData.length / 2)
const framePadding = { top: 32, right: 0, bottom: 62, left: 0 }

const originalSeries: WaveformSeries[] = waveformData.map((waveform, index) => ({
  id: String(waveform.chnl_id),
  name: waveform.chnl,
  shot: waveform.shot,
  unit: waveform.dat_unit,
  order: index + 1,
  yAxis: index < rightAxisStart ? 'left' : 'right',
  data: waveform.data.map((y, pointIndex) => ({ x: waveform.time[pointIndex], y })),
  style: { color: colors[index % colors.length], lineWidth: 3 },
}))
const datasets = { original: originalSeries, scientific: scientificSeries }
type DatasetKey = keyof typeof datasets
let activeDataset: DatasetKey = 'original'
let series = datasets[activeDataset]

const initialOptions: WaveformOptions = resolveOptions({
  width: '100%',
  responsive: { enabled: true, aspectRatio: 2.6 },
  layout: { autoPadding: true },
  padding: framePadding,
  frameNumber: 1,
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
  yAxes: [
    {
      id: 'left', position: 'left', color: colors[0], fontColor: colors[0], fontSize: 14,
      tickSize: 3, tickPadding: 5, unit: waveformData[0].dat_unit,
      title: { visible: true, text: waveformData[0].chnl, unit: waveformData[0].dat_unit, color: colors[0], fontSize: 14 },
    },
    {
      id: 'right', position: 'right', color: colors[rightAxisStart], fontColor: colors[rightAxisStart], fontSize: 14,
      tickSize: 3, tickPadding: 5, unit: waveformData[rightAxisStart].dat_unit,
      title: {
        visible: true, text: waveformData[rightAxisStart].chnl, unit: waveformData[rightAxisStart].dat_unit,
        color: colors[rightAxisStart], fontSize: 14,
      },
    },
  ],
  grid: { style: 'dashed', color: '#475569', y: { axisId: 'left' } },
  zeroLine: { axisId: 'left' },
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
        <div class="preview-datasets" role="group" aria-label="测试数据">
          <button type="button" data-dataset="original" aria-pressed="true">原始数据</button>
          <button type="button" data-dataset="scientific" aria-pressed="false">小数值测试</button>
        </div>
      </header>
      <div class="preview-stage">
        <div id="waveform" class="waveform-preview"></div>
      </div>
    </section>
  </main>
`

const chart = new Waveform('#waveform', series, initialOptions)
let emptyPreview = false
let currentOptions = initialOptions

function renderConfigPanel() {
  createConfigPanel(document.querySelector<HTMLDivElement>('#config-panel')!, {
    options: currentOptions,
    series,
    onOptionsChange: options => {
      currentOptions = options
      chart.updateOptions(options)
    },
    onSeriesChange: nextSeries => {
      series = nextSeries
      datasets[activeDataset] = nextSeries
      if (!emptyPreview) chart.updateData(series)
    },
    onEmptyPreviewChange: enabled => {
      emptyPreview = enabled
      chart.updateData(enabled ? [] : series)
    },
  })
}

renderConfigPanel()
app.querySelectorAll<HTMLButtonElement>('[data-dataset]').forEach(button => {
  button.addEventListener('click', () => {
    const nextDataset = button.dataset.dataset as DatasetKey
    if (nextDataset === activeDataset) return
    activeDataset = nextDataset
    series = datasets[activeDataset]
    emptyPreview = false
    app.querySelectorAll<HTMLButtonElement>('[data-dataset]').forEach(option => {
      option.setAttribute('aria-pressed', String(option.dataset.dataset === activeDataset))
    })
    chart.updateData(series)
    renderConfigPanel()
  })
})

console.info('SVG export available via chart.toSVGString() or chart.downloadSVG()')
