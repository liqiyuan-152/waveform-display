import { onBeforeUnmount, onMounted, shallowRef, type Ref } from 'vue'
import { Waveform, type WaveformData, type WaveformOptions } from '../../../src/index'

/** The adapter owns only the instance it successfully creates. */
export function useWaveform(container: Ref<HTMLElement | null>, initial: () => { data: WaveformData; options: WaveformOptions }, report: (error: Error) => void) {
  const chart = shallowRef<Waveform | null>(null)
  let resizeObserver: ResizeObserver | undefined
  onMounted(() => {
    try {
      const target = container.value
      if (!target) throw new Error('预览容器尚未挂载')
      if (Waveform.getInstanceByDom(target)) throw new Error('预览容器已被其他图表占用')
      const value = initial()
      chart.value = new Waveform(target, value.data, value.options)
      const Observer = target.ownerDocument.defaultView?.ResizeObserver
      if (Observer) {
        resizeObserver = new Observer(() => {
          if (chart.value && !chart.value.getOptions().responsive?.enabled) chart.value.resize()
        })
        resizeObserver.observe(target)
      }
    } catch (error) { report(error instanceof Error ? error : new Error(String(error))) }
  })
  onBeforeUnmount(() => { resizeObserver?.disconnect(); chart.value?.destroy(); chart.value = null })
  return chart
}
