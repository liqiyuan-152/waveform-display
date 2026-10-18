<script setup lang="ts">
import { computed, nextTick, reactive, ref, useId } from 'vue'
import { Button } from 'ant-design-vue'
import type { WaveformOptions, WaveformSeries } from '../../../../src/index'
import { tabs, axisFields, type FieldDefinition } from '../../config/fields'
import ConfigField from './ConfigField.vue'
import OptionsForm from './OptionsForm.vue'
import SeriesForm from './SeriesForm.vue'
const props = defineProps<{ options: WaveformOptions; series: WaveformSeries[]; empty?: boolean }>()
const emit = defineEmits<{ field: [path: string, value: unknown]; series: [series: WaveformSeries[]]; mode: [mode: 'single' | 'multiple']; empty: [value: boolean] }>()
const active = ref('layout'), selectedAxis = ref(0)
const subsections = reactive(Object.fromEntries(tabs.map(tab => [tab.id, tab.subsections?.[0]?.id])))
const id = useId()
const current = computed(() => tabs.find(tab => tab.id === active.value)!)
const section = computed(() => current.value.subsections?.find(section => section.id === subsections[active.value]))
const multiple = computed(() => (props.options.yAxes?.length ?? 0) > 1)
const fields = computed(() => {
  if (section.value?.id === 'value-y') return axisFields(`yAxes.${Math.min(selectedAxis.value, (props.options.yAxes?.length ?? 1) - 1)}`, false)
  return (section.value?.fields ?? []).filter(field => multiple.value || !['grid.y.axisId', 'zeroLine.axisId'].includes(field.path)).map(field =>
    ['grid.y.axisId', 'zeroLine.axisId'].includes(field.path) ? { ...field, options: props.options.yAxes?.map(axis => ({ label: axis.position === 'right' ? '右轴' : '左轴', value: axis.id })) } : field)
})
const emptyField: FieldDefinition = { kind: 'boolean', label: '预览空数据状态', path: 'empty' }
async function keydown(event: KeyboardEvent, index: number) {
  const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1
  if (next < 0) return
  event.preventDefault(); active.value = tabs[next].id
  await nextTick(); document.getElementById(`${id}-tab-${active.value}`)?.focus()
}
</script>
<template>
  <div class="config-panel">
    <div class="config-panel__heading"><h2>实时配置</h2></div>
    <div class="config-tabs" role="tablist" aria-label="配置分类"><button v-for="(tab, i) in tabs" :id="`${id}-tab-${tab.id}`" :key="tab.id" class="config-tab" role="tab" :aria-selected="active === tab.id" :aria-controls="`${id}-panel`" :tabindex="active === tab.id ? 0 : -1" @click="active = tab.id" @keydown="keydown($event, i)">{{ tab.label }}</button></div>
    <div :id="`${id}-panel`" class="config-tabpanel" role="tabpanel" :aria-labelledby="`${id}-tab-${active}`">
      <KeepAlive><SeriesForm v-if="current.series" :series="series" :options="options" @change="emit('series', $event)" /></KeepAlive>
      <template v-if="!current.series">
        <div class="segment-control"><Button v-for="entry in current.subsections" :key="entry.id" class="segment-button" :aria-pressed="section?.id === entry.id" @click="subsections[active] = entry.id">{{ entry.label }}</Button></div>
        <template v-if="section?.id === 'value-y'">
          <div class="segment-control" aria-label="值轴模式"><Button class="segment-button" :aria-pressed="!multiple" @click="selectedAxis = 0; emit('mode', 'single')">单值轴</Button><Button class="segment-button" :aria-pressed="multiple" @click="selectedAxis = 0; emit('mode', 'multiple')">多值轴</Button></div>
          <select v-if="multiple" v-model.number="selectedAxis" aria-label="选择值轴"><option v-for="(axis, i) in options.yAxes" :key="axis.id" :value="i">{{ axis.position === 'right' ? '右轴' : '左轴' }}</option></select>
        </template>
        <ConfigField v-if="section?.id === 'empty'" :field="emptyField" :value="empty" @change="emit('empty', Boolean($event))" />
        <OptionsForm :fields="fields" :options="options" @field="(path, value) => emit('field', path, value)" />
      </template>
    </div>
  </div>
</template>
<style scoped>
.config-tabpanel > select { width: 100%; margin: 0 0 12px; padding: 6px 8px; color: #e2e8f0; background: #0f172a; border: 1px solid #475569; border-radius: 4px; }
</style>
