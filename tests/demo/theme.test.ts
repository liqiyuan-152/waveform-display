// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import App from '../../demo/src/App.vue'
import { themeStorageKey, useTheme } from '../../demo/src/composables/useTheme'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); document.body.replaceChildren() })

describe('demo theme', () => {
  it('follows system changes only in automatic mode, persists choice and cleans up', async () => {
    let listener: (() => void) | undefined
    const media = { matches: false, addEventListener: vi.fn((_event, callback) => { listener = callback }), removeEventListener: vi.fn() }
    vi.stubGlobal('matchMedia', () => media)
    const scope = effectScope()
    const state = scope.run(useTheme)!
    expect(state.preference.value).toBe('system')
    expect(state.dark.value).toBe(false)
    media.matches = true; listener!()
    expect(state.dark.value).toBe(true)
    state.preference.value = 'light'
    await nextTick()
    expect(localStorage.getItem(themeStorageKey)).toBe('light')
    listener!()
    expect(state.dark.value).toBe(false)
    scope.stop()
    expect(media.removeEventListener).toHaveBeenCalledWith('change', listener)
    const restored = effectScope()
    expect(restored.run(useTheme)!.preference.value).toBe('light')
    restored.stop()
  })

  it('falls back to system when stored preference is invalid or storage is unavailable', () => {
    localStorage.setItem(themeStorageKey, 'invalid')
    const scope = effectScope()
    expect(scope.run(useTheme)!.preference.value).toBe('system')
    scope.stop()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('unavailable') })
    const blocked = effectScope()
    expect(blocked.run(useTheme)!.preference.value).toBe('system')
    blocked.stop()
  })

  it('syncs the SVG background with the theme while preserving other SVG content', async () => {
    const wrapper = mount(App, { attachTo: document.body })
    await nextTick(); await nextTick()
    // Finish entrance animation before comparing presentation geometry.
    await wrapper.findAll('button').find(button => button.text() === '结束动画')!.trigger('click')
    const svg = wrapper.find('svg.waveform-svg').exists() ? wrapper.find('svg.waveform-svg') : wrapper.find('.waveform-preview svg')
    const element = svg.element
    expect(element.querySelector('.waveform-frame-background')?.getAttribute('fill')).toBe('#ffffff')
    const withoutBackgroundColor = () => {
      const copy = element.cloneNode(true) as Element
      copy.querySelector('.waveform-frame-background')?.removeAttribute('fill')
      return copy.outerHTML
    }
    const before = withoutBackgroundColor()
    for (const label of ['深色', '浅色', '跟随系统']) {
      await wrapper.findAll('.ant-segmented-item').find(item => item.text() === label)!.trigger('click')
      await nextTick()
      expect(wrapper.find('.waveform-preview svg').element).toBe(element)
      expect(element.querySelector('.waveform-frame-background')?.getAttribute('fill')).toBe(label === '深色' ? '#000000' : '#ffffff')
      expect(withoutBackgroundColor()).toBe(before)
      if (label !== '跟随系统') expect(wrapper.find('main').attributes('data-theme')).toBe(label === '深色' ? 'dark' : 'light')
    }
    wrapper.unmount()
  })
})
