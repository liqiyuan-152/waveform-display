// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { Select } from 'ant-design-vue'
import { tabs as legacyTabs, parseNumberInput as oldNumber, parseDimension as oldDimension } from '../fixtures/legacyConfigPanel'
import { tabs, axisFields, parseNumberInput, parseDimension, type FieldDefinition } from '../../demo/src/config/fields'
import ConfigField from '../../demo/src/components/config-panel/ConfigField.vue'

const fields = tabs.flatMap(tab => tab.subsections?.flatMap(section => section.fields) ?? [])
describe('configuration field migration', () => {
  it('retains every legacy field and validation boundary', () => {
    const previous = legacyTabs.flatMap(tab => tab.subsections?.flatMap(section => section.fields) ?? [])
    const current = [...fields, ...axisFields('yAxis', false), ...axisFields('secondaryYAxis', false)]
    for (const field of previous) {
      const migrated = current.find(candidate => candidate.path === field.path)
      expect(migrated, field.path).toBeDefined()
      expect(migrated?.kind, field.path).toBe(field.kind)
      expect(migrated?.min, field.path).toBe(field.min)
      expect(migrated?.max, field.path).toBe(field.max)
    }
    for (const raw of ['', '0', '-1', '1.23456789', '1e-8', '1e', '12px', '100%']) {
      expect(parseNumberInput(raw, true)).toEqual(oldNumber(raw, true))
      expect(parseDimension(raw)).toEqual(oldDimension(raw))
    }
  })

  it.each(fields.map(field => [field.path, field] as const))('renders and submits %s through the Vue control', async (_path, field: FieldDefinition) => {
    if (field.kind === 'select' && !field.options?.length) field = { ...field, options: [{ label: 'Left', value: 'left' }] }
    const wrapper = mount(ConfigField, { props: { field, value: undefined } })
    const value = field.kind === 'boolean' ? true : field.kind === 'select' ? field.options![0].value
      : field.kind === 'color' ? '#123456' : field.kind === 'number' || field.kind === 'range' ? String(field.min ?? 1)
        : field.path.includes('tickFormat') ? '.2f' : field.path === 'width' || field.path === 'height' ? '800' : 'Example'
    if (field.kind === 'select') wrapper.findComponent(Select).vm.$emit('update:value', value)
    else if (field.kind === 'boolean') await wrapper.find('[role="switch"]').trigger('click')
    else await wrapper.find('input').setValue(value)
    expect(wrapper.emitted('change')?.length, field.path).toBeGreaterThan(0)
    expect(wrapper.find('[role=alert]').exists()).toBe(false)
    wrapper.unmount()
  })
})
