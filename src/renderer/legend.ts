import { dashFor } from './helpers'
import type { WaveformSeries } from '../types/data'
import type { RenderContext } from './context'

interface LegendSeries {
  key: string
  series: WaveformSeries
  visible: boolean
}

interface LegendLayoutItem {
  index: number
  width: number
}

interface LegendRow {
  items: LegendLayoutItem[]
  width: number
}

interface FittedLegendLabel {
  text: string
  width: number
  truncated: boolean
}

const TEXT_WIDTH_FACTOR = 0.6

function normalizeShot(shot: WaveformSeries['shot']): string | undefined {
  if (typeof shot === 'number') return Number.isFinite(shot) ? String(shot) : undefined
  const value = shot?.trim()
  return value || undefined
}

function wrapLegendItems(items: LegendLayoutItem[], availableWidth: number, itemGap: number): LegendRow[] {
  const rows: LegendRow[] = []

  items.forEach((item) => {
    const row = rows[rows.length - 1]
    const nextWidth = row ? row.width + itemGap + item.width : item.width
    if (row && nextWidth <= availableWidth) {
      row.items.push(item)
      row.width = nextWidth
      return
    }
    rows.push({ items: [item], width: item.width })
  })

  return rows
}

function estimateTextWidth(text: string, fontSize: number): number {
  return Array.from(text).length * fontSize * TEXT_WIDTH_FACTOR
}

function fitLegendLabel(label: string, fontSize: number, maxWidth: number): FittedLegendLabel {
  const fullWidth = estimateTextWidth(label, fontSize)
  if (fullWidth <= maxWidth) return { text: label, width: fullWidth, truncated: false }

  const ellipsis = '…'
  const ellipsisWidth = estimateTextWidth(ellipsis, fontSize)
  if (maxWidth <= ellipsisWidth) return { text: ellipsis, width: ellipsisWidth, truncated: true }

  const characters = Array.from(label)
  let low = 0
  let high = characters.length
  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (estimateTextWidth(characters.slice(0, middle).join(''), fontSize) + ellipsisWidth <= maxWidth) low = middle
    else high = middle - 1
  }

  const text = `${characters.slice(0, low).join('')}${ellipsis}`
  return { text, width: estimateTextWidth(text, fontSize), truncated: true }
}

export function renderLegend(ctx: RenderContext, legendSeries: LegendSeries[], onToggle: (key: string) => void) {
  const { svg, options, width, height } = ctx
  if (!options.legend.visible || !legendSeries.length) return

  const p = options.padding
  const lineLength = options.legend.lineLength
  const itemGap = options.legend.itemGap
  const rowHeight = options.legend.fontSize + 10
  const isRight = options.legend.position.includes('right')
  const isBottom = options.legend.position.includes('bottom')
  const horizontal = options.legend.orientation === 'horizontal'
  const group = svg.append('g').attr('class', 'waveform-legend')
  const shots = legendSeries.map(item => normalizeShot(item.series.shot))
  const multipleShots = new Set(shots.filter((shot): shot is string => shot !== undefined)).size > 1
  const labels = legendSeries.map((item, index) => {
    const name = item.series.name || `Series ${index + 1}`
    return multipleShots && shots[index] ? `${name} (${shots[index]})` : name
  })

  const decorationWidth = lineLength + 16
  const maxItemWidth = Math.max(decorationWidth, options.legend.maxItemWidth)
  const fittedLabels = labels.map(label => fitLegendLabel(
    label,
    options.legend.fontSize,
    Math.max(0, maxItemWidth - decorationWidth),
  ))
  const itemWidths = fittedLabels.map(label => Math.min(maxItemWidth, label.width + decorationWidth))
  const positions: Array<{ x: number; y: number }> = []

  if (horizontal) {
    const availableWidth = Math.max(0, width - p.left - p.right)
    const rows = wrapLegendItems(
      itemWidths.map((itemWidth, index) => ({ index, width: itemWidth })),
      availableWidth,
      itemGap,
    )
    const rowStep = rowHeight + itemGap
    const topY = options.title.visible && options.title.text ? 46 : 22
    const firstRowY = isBottom ? height - 18 - (rows.length - 1) * rowStep : topY

    rows.forEach((row, rowIndex) => {
      let cursorX = isRight ? width - p.right - row.width : p.left
      const cursorY = firstRowY + rowIndex * rowStep
      row.items.forEach((item) => {
        positions[item.index] = { x: cursorX, y: cursorY }
        cursorX += item.width + itemGap
      })
    })
  } else {
    const cursorX = isRight ? width - p.right : p.left
    let cursorY = isBottom ? height - 18 : 22
    itemWidths.forEach((_itemWidth, index) => {
      positions[index] = { x: cursorX, y: cursorY }
      cursorY += rowHeight + itemGap
    })
  }

  legendSeries.forEach(({ key, series: s, visible }, index) => {
    const color = s.style?.color || options.line.color
    const lineWidth = s.style?.lineWidth || options.line.width
    const lineStyle = s.style?.lineStyle || options.line.style
    const label = labels[index]
    const fittedLabel = fittedLabels[index]
    const estimatedWidth = itemWidths[index]
    const position = positions[index]
    const item = group.append('g')
      .attr('class', 'waveform-legend-item')
      .attr('data-series-key', key)
      .attr('transform', `translate(${position.x},${position.y})`)
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr('aria-label', label)
      .attr('aria-pressed', visible ? 'true' : 'false')
      .style('cursor', 'pointer')
      .style('outline', 'none')
      .on('click', () => onToggle(key))
      .on('keydown', (event: KeyboardEvent) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        onToggle(key)
      })

    item.append('rect')
      .attr('x', -4)
      .attr('y', -rowHeight + 4)
      .attr('width', estimatedWidth + 8)
      .attr('height', rowHeight)
      .attr('fill', 'transparent')

    if (fittedLabel.truncated) item.append('title').text(label)

    item.append('line')
      .attr('x1', 0).attr('x2', lineLength)
      .attr('y1', -4).attr('y2', -4)
      .attr('stroke', color)
      .attr('stroke-width', lineWidth)
      .attr('stroke-dasharray', dashFor(lineStyle))
      .attr('opacity', visible ? 1 : 0.35)

    item.append('text')
      .attr('x', lineLength + 8)
      .attr('fill', options.legend.color)
      .attr('font-size', options.legend.fontSize)
      .attr('opacity', visible ? 1 : 0.35)
      .text(fittedLabel.text)
  })
}
