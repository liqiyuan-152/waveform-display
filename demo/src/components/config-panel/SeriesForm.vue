<script setup lang="ts">
import { computed, ref } from 'vue'
import type { WaveformOptions, WaveformSeries } from '../../../../src/index'
import { getAtPath, setAtPath } from '../../config/fields'
import { seriesFields } from '../../config/seriesFields'
import ConfigField from './ConfigField.vue'
const props = defineProps<{ series: WaveformSeries[]; options: WaveformOptions }>()
const emit = defineEmits<{ change: [series: WaveformSeries[]] }>()
const selected = ref(0), category = ref<'line' | 'point'>('line')
const index = computed(() => Math.min(selected.value, props.series.length - 1))
const item = computed(() => props.series[index.value])
function update(path: string, value: unknown) {
  emit('change', props.series.map((series, i) => i === index.value ? setAtPath(series, path, value) : series))
}
</script>
<template>
  <p v-if="!item" class="config-empty">暂无曲线</p>
  <template v-else>
    <div class="series-toolbar">
      <label>当前曲线<select v-model.number="selected" aria-label="选择曲线"><option v-for="(series, i) in series" :key="i" :value="i">{{ series.name || series.id || `曲线 ${i + 1}` }}</option></select></label>
      <label v-if="(options.yAxes?.length ?? 0) > 1" class="series-axis">坐标轴<select :value="item.yAxis ?? options.yAxes?.[0].id" aria-label="坐标轴" @change="update('yAxis', ($event.target as HTMLSelectElement).value)"><option v-for="axis in options.yAxes" :key="axis.id" :value="axis.id">{{ axis.position === 'right' ? '右轴' : '左轴' }}</option></select></label>
    </div>
    <div class="segment-control series-segment-control" aria-label="曲线样式类型"><button v-for="entry in [{ id: 'line' as const, label: '线条' }, { id: 'point' as const, label: '数据点' }]" :key="entry.id" class="segment-button" :aria-pressed="category === entry.id" @click="category = entry.id">{{ entry.label }}</button></div>
    <div class="series-overrides"><div v-for="field in seriesFields.filter(field => field.category === category)" :key="field.path" class="series-override">
      <div class="series-override__heading"><span>{{ field.label }}</span><label class="inherit-toggle"><input type="checkbox" :checked="getAtPath(item, field.path) === undefined" :aria-label="`${field.label}跟随全局`" @change="update(field.path, ($event.target as HTMLInputElement).checked ? undefined : getAtPath(options, field.inherited))"><span>跟随全局</span></label></div>
      <ConfigField :field="field" :value="getAtPath(item, field.path) ?? getAtPath(options, field.inherited)" :disabled="getAtPath(item, field.path) === undefined" @change="update(field.path, $event)" />
    </div></div>
  </template>
</template>
