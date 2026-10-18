<script setup lang="ts">
import { Button } from 'ant-design-vue'
import type { WaveformOptions } from '../../../src/index'
defineProps<{ options: WaveformOptions }>()
const emit = defineEmits<{
  field: [path: string, value: unknown]
  control: [action: 'pause' | 'resume' | 'finish']
  scenario: [name: 'append' | 'window' | 'domain' | 'extreme' | 'auto-padding']
}>()
function number(event: Event) { return Number((event.target as HTMLInputElement).value) }
</script>
<template>
  <details class="animation-panel">
    <summary>动画与数据更新</summary>
    <div class="animation-panel__fields">
      <label><input type="checkbox" :checked="options.animationEnabled" @change="emit('field', 'animationEnabled', ($event.target as HTMLInputElement).checked)">启用动画（影响后续数据更新）</label>
      <label><input type="checkbox" :checked="options.animation?.enabled" @change="emit('field', 'animation.enabled', ($event.target as HTMLInputElement).checked)">入场动画</label>
      <label><input type="checkbox" :checked="options.animationUpdate?.enabled" @change="emit('field', 'animationUpdate.enabled', ($event.target as HTMLInputElement).checked)">更新动画</label>
      <label>入场方向<select :value="options.animation?.direction" @change="emit('field', 'animation.direction', ($event.target as HTMLSelectElement).value)"><option value="left-to-right">从左到右</option><option value="right-to-left">从右到左</option><option value="center-out">从中心展开</option></select></label>
      <label>入场时长（ms）<input type="number" min="0" :value="options.animation?.duration" @change="emit('field', 'animation.duration', number($event))"></label>
      <label>入场延迟（ms）<input type="number" min="0" :value="options.animation?.delay" @change="emit('field', 'animation.delay', number($event))"></label>
      <label>错峰间隔（ms）<input type="number" min="0" :value="options.animation?.staggerDelay" @change="emit('field', 'animation.staggerDelay', number($event))"></label>
      <label>更新时长（ms）<input type="number" min="0" :value="options.animationUpdate?.duration" @change="emit('field', 'animationUpdate.duration', number($event))"></label>
      <label>更新缓动<select :value="options.animationUpdate?.easing" @change="emit('field', 'animationUpdate.easing', ($event.target as HTMLSelectElement).value)"><option value="cubicInOut">平滑加减速</option><option value="linear">匀速</option></select></label>
    </div>
    <div class="preview-datasets" role="group" aria-label="动画控制"><Button @click="emit('control', 'pause')">暂停</Button><Button @click="emit('control', 'resume')">恢复</Button><Button @click="emit('control', 'finish')">结束动画</Button></div>
    <p>前四种场景固定左右留白。自动留白场景在标签变宽、绘图区改变时直接显示终态。</p>
    <div class="preview-datasets" role="group" aria-label="数据更新场景"><Button @click="emit('scenario', 'append')">追加点</Button><Button @click="emit('scenario', 'window')">滑动窗口</Button><Button @click="emit('scenario', 'domain')">坐标域变化</Button><Button @click="emit('scenario', 'extreme')">极端位移</Button><Button @click="emit('scenario', 'auto-padding')">自动留白变化</Button></div>
  </details>
</template>
<style scoped>
.animation-panel { padding: 12px 16px; border: 1px solid #334155; border-radius: 8px; background: #111827; color: #e2e8f0; }
.animation-panel summary { cursor: pointer; font-weight: 600; }
.animation-panel__fields { display: flex; flex-wrap: wrap; gap: 12px; margin: 12px 0; }
.animation-panel__fields label { display: flex; gap: 6px; align-items: center; }
.animation-panel__fields input[type=number] { width: 90px; }
.animation-panel__fields input[type=number], .animation-panel__fields select { background: #0f172a; color: #e2e8f0; border: 1px solid #475569; border-radius: 4px; padding: 4px; }
.animation-panel p { margin: 10px 0; color: #94a3b8; }
</style>
