const SCIENTIFIC_MIN_ABSOLUTE_VALUE = 0.001
const SCIENTIFIC_MAX_PLAIN_ABSOLUTE_VALUE = 1000
const Y_AXIS_NUMBER_FORMATTER = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 4,
})

function formatAxisNumber(value: number): string {
  if (Object.is(value, -0)) return '0'
  const roundedValue = value === 0 ? 0 : Number(value.toPrecision(5))
  const formatted = Y_AXIS_NUMBER_FORMATTER.format(roundedValue)
  return formatted === '-0' ? '0' : formatted
}

export function resolveScientificExponent(axisMin: number, axisMax: number): number | null {
  const maxAbsoluteValue = Math.max(Math.abs(axisMin), Math.abs(axisMax))
  if (!Number.isFinite(maxAbsoluteValue) || maxAbsoluteValue === 0) return null
  if (maxAbsoluteValue < SCIENTIFIC_MIN_ABSOLUTE_VALUE || maxAbsoluteValue >= SCIENTIFIC_MAX_PLAIN_ABSOLUTE_VALUE) {
    return Math.floor(Math.log10(maxAbsoluteValue))
  }
  return null
}

function formatExponent(exponent: number): string {
  const sign = exponent >= 0 ? '+' : '-'
  return `E${sign}${Math.abs(exponent).toString().padStart(2, '0')}`
}

/** Formats ticks with one shared exponent, shown only on the Y-domain end tick. */
export function formatScientificAxisTick(
  value: number,
  domain: [number, number],
  topTickValue: number,
  unit = '',
): string {
  if (!Number.isFinite(value)) return String(value)

  const exponent = resolveScientificExponent(domain[0], domain[1])
  const scaledValue = exponent === null ? value : value / 10 ** exponent
  const valueLabel = formatAxisNumber(scaledValue)
  if (value !== topTickValue) return valueLabel
  const trimmedUnit = unit.trim()
  const unitLabel = trimmedUnit ? `(${trimmedUnit}) ` : ''
  const exponentLabel = exponent === null ? '' : `${formatExponent(exponent)} `
  return `${exponentLabel}${unitLabel}${valueLabel}`
}
