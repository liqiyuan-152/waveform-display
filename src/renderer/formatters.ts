const SCIENTIFIC_MIN_ABSOLUTE_VALUE = 0.01
const SCIENTIFIC_MAX_PLAIN_ABSOLUTE_VALUE = 1000
const Y_AXIS_NUMBER_FORMATTER = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function formatAxisNumber(value: number): string {
  const formatted = Y_AXIS_NUMBER_FORMATTER.format(value)
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

export function formatScientificAxisHeader(domain: [number, number], unit = '', unitFirst = true): string {
  const exponent = resolveScientificExponent(domain[0], domain[1])
  const trimmedUnit = unit.trim()
  const parts = [trimmedUnit, exponent === null ? '' : formatExponent(exponent)]
  return (unitFirst ? parts : parts.reverse()).filter(Boolean).join('\u00a0\u00a0')
}
