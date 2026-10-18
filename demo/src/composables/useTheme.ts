import { computed, onScopeDispose, ref, watch } from 'vue'
import { theme } from 'ant-design-vue'

export type ThemePreference = 'system' | 'light' | 'dark'
export const themeStorageKey = 'waveform-demo-theme'
export function useTheme() {
  const preference = ref<ThemePreference>('system')
  try {
    const saved = localStorage.getItem(themeStorageKey)
    if (saved === 'light' || saved === 'dark') preference.value = saved
  } catch { /* Storage can be unavailable in embedded previews. */ }
  const media = window.matchMedia?.('(prefers-color-scheme: dark)')
  const systemDark = ref(media?.matches ?? false)
  const update = () => { systemDark.value = media?.matches ?? false }
  media?.addEventListener('change', update)
  onScopeDispose(() => media?.removeEventListener('change', update))
  const dark = computed(() => preference.value === 'dark' || preference.value === 'system' && systemDark.value)
  const config = computed(() => ({ algorithm: dark.value ? theme.darkAlgorithm : theme.defaultAlgorithm, token: { colorPrimary: dark.value ? '#2dd4bf' : '#087f6b', borderRadius: 5 } }))
  watch(preference, value => { try { localStorage.setItem(themeStorageKey, value) } catch { /* Keep the in-memory preference. */ } })
  return { preference, dark, config }
}
