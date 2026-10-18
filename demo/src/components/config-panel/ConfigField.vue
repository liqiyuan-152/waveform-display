<script setup lang="ts">
import { ref, watch } from 'vue'
import { colorPickerValue, isCssColor, parseNumberInput, type FieldDefinition } from '../../config/fields'
const props = defineProps<{ field: FieldDefinition; value: unknown; disabled?: boolean }>()
const emit = defineEmits<{ change: [value: unknown] }>()
const raw = ref('')
const invalid = ref(false)
watch(() => props.value, value => { raw.value = value == null ? '' : String(value); invalid.value = false }, { immediate: true })
function input(event: Event) {
  const target = event.target as HTMLInputElement
  raw.value = target.value
  const field = props.field
  const parsed = field.parse ? field.parse(raw.value)
    : field.kind === 'number' || field.kind === 'range' ? parseNumberInput(raw.value, field.optional)
      : { valid: field.kind === 'color' ? isCssColor(raw.value) : field.validate?.(raw.value) ?? true, value: raw.value }
  invalid.value = !parsed.valid || typeof parsed.value === 'number' && ((field.min !== undefined && parsed.value < field.min) || (field.max !== undefined && parsed.value > field.max))
  target.setAttribute('aria-invalid', String(invalid.value))
  if (!invalid.value) emit('change', parsed.value)
}
</script>
<template>
  <label class="config-field" :class="{ 'is-disabled': disabled, 'config-field--switch': field.kind === 'boolean' }">
    <span class="config-field__label">{{ field.label }}</span>
    <span class="config-field__control" :class="{ 'color-control': field.kind === 'color', 'range-control': field.kind === 'range' }">
      <template v-if="field.kind === 'boolean'">
        <input class="switch-input" type="checkbox" :checked="Boolean(value)" :disabled="disabled" :aria-label="field.label" @change="emit('change', ($event.target as HTMLInputElement).checked)">
        <span class="switch-visual" aria-hidden="true" />
      </template>
      <select v-else-if="field.kind === 'select'" :value="String(value ?? '')" :disabled="disabled" :aria-label="field.label" @change="emit('change', ($event.target as HTMLSelectElement).value)">
        <option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
      <template v-else>
        <input v-if="field.kind === 'color'" type="color" class="color-picker" :value="colorPickerValue(value)" :disabled="disabled" :aria-label="`${field.label}色板`" @input="input">
        <input v-if="field.kind === 'range'" type="range" :value="raw" :min="field.min" :max="field.max" :step="field.step" :disabled="disabled" :aria-label="`${field.label}滑块`" @input="input">
        <input :type="field.kind === 'number' || field.kind === 'range' ? 'number' : 'text'" :value="raw" :min="field.min" :max="field.max" :step="field.step" :disabled="disabled" :aria-label="field.label" :aria-invalid="invalid" @input="input">
      </template>
    </span>
    <small v-if="invalid" class="field-error" role="alert">请输入有效的{{ field.label }}</small>
  </label>
</template>
