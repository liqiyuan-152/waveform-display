const SCIENTIFIC_MIN_ABSOLUTE_VALUE = 0.001
const SCIENTIFIC_MAX_PLAIN_ABSOLUTE_VALUE = 1000

function formatAxisNumber(value: number): string {
  const normalized = Object.is(value, -0) ? 0 : value
  return normalized.toFixed(2)
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
  const exponent = resolveScientificExponent(domain[0], domain[1])
  const scaledValue = exponent === null ? value : value / 10 ** exponent
  const valueLabel = formatAxisNumber(scaledValue)
  const exponentLabel = exponent !== null && value === topTickValue ? formatExponent(exponent) : ''
  if (!exponentLabel) return valueLabel
  const scientificUnitLabel = unit ? ` (${unit})` : ''
  const scientificLabel = `${exponentLabel}${scientificUnitLabel}`
  return `${scientificLabel}\n${valueLabel}`
}
