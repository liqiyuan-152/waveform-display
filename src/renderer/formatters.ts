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

/** Formats numeric ticks using the shared exponent displayed in the axis header. */
export function formatScientificAxisTick(value: number, domain: [number, number]): string {
  if (!Number.isFinite(value)) return String(value)
  const exponent = resolveScientificExponent(domain[0], domain[1])
  return formatAxisNumber(exponent === null ? value : value / 10 ** exponent)
}

export function formatScientificAxisHeader(domain: [number, number], unit = ''): string {
  const exponent = resolveScientificExponent(domain[0], domain[1])
  const trimmedUnit = unit.trim()
  return [exponent === null ? '' : formatExponent(exponent), trimmedUnit ? `(${trimmedUnit})` : '']
    .filter(Boolean).join(' ')
}
