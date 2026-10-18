<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { Alert, Button } from 'ant-design-vue'
import type { Waveform, WaveformOptions, WaveformSeries } from '../../src/index'
import WaveformPreview from './components/WaveformPreview.vue'
import ConfigPanel from './components/config-panel/ConfigPanel.vue'
import AnimationPanel from './components/AnimationPanel.vue'
import { animationScenario } from './animation-scenarios'
import { OptionsDraft } from './config/OptionsDraft'
import { initialOptions, originalSeries } from './config/initial'
import { scientificSeries } from './scientific-data'
const datasets = { original: originalSeries, scientific: scientificSeries }
const active = ref<'original' | 'scientific'>('original')
const series = shallowRef<WaveformSeries[]>(datasets.original)
const chart = shallowRef<Waveform | null>(null)
const options = shallowRef<WaveformOptions>({})
const empty = ref(false), error = ref('')
const draft = new OptionsDraft(initialOptions)
let scenarioVersion = 0
let extremeAxes: WaveformOptions['yAxes']
const previewData = computed(() => empty.value ? [] : series.value)
function ready(value: Waveform) { chart.value = value; options.value = value.getOptions() }
function edit(path: string, value: unknown) {
  try { chart.value?.updateOptions(draft.set(path, value)); options.value = chart.value!.getOptions(); error.value = '' }
  catch (failure) { error.value = String(failure) }
}
function updateSeries(data: WaveformSeries[]) { series.value = data; datasets[active.value] = data }
function mode(value: 'single' | 'multiple') {
  if ((options.value.yAxes?.length === 1) === (value === 'single')) return
  const change = draft.switchAxes(value, series.value)
  chart.value?.update({ data: empty.value ? [] : change.data, options: change.options })
  updateSeries(change.data)
  options.value = chart.value!.getOptions()
}
function switchDataset(key: 'original' | 'scientific') {
  active.value = key; series.value = datasets[key]; empty.value = false
}
function scenario(name: string) {
  const data = animationScenario(name, ++scenarioVersion)
  const patch = draft.set('layout.horizontalPadding', name === 'auto-padding' ? undefined : { left: 90, right: 90 })
  if (extremeAxes) {
    Object.assign(patch, draft.set('yAxes', extremeAxes))
    extremeAxes = undefined
  }
  if (name === 'extreme') {
    extremeAxes = draft.options.yAxes ?? [{ id: 'left' }]
    Object.assign(patch, draft.set('yAxes', extremeAxes.map(axis => ({ ...axis, min: -4, max: 4 }))))
  }
  chart.value?.update({ data, options: patch })
  series.value = data
  empty.value = false
  options.value = chart.value!.getOptions()
}
</script>
<template>
  <main class="workspace">
    <aside class="control-pane" aria-label="图表配置"><ConfigPanel v-if="chart" :options="options" :series="series" :empty="empty" @field="edit" @series="updateSeries" @mode="mode" @empty="empty = $event" /></aside>
    <section class="preview-pane" aria-labelledby="page-title">
      <header class="preview-pane__header"><h1 id="page-title">波形图预览</h1><div class="preview-datasets" role="group" aria-label="测试数据"><Button v-for="entry in [{ id: 'original' as const, label: '原始数据' }, { id: 'scientific' as const, label: '小数值测试' }]" :key="entry.id" :data-dataset="entry.id" :aria-pressed="active === entry.id" @click="switchDataset(entry.id)">{{ entry.label }}</Button></div></header>
      <Alert v-if="error" :message="error" type="error" role="alert" />
      <AnimationPanel v-if="chart" :options="options" @field="edit" @control="chart?.animation[$event]()" @scenario="scenario" />
      <div class="preview-stage"><WaveformPreview :data="previewData" :options="initialOptions" @ready="ready" @error="error = $event.message" /></div>
    </section>
  </main>
</template>
