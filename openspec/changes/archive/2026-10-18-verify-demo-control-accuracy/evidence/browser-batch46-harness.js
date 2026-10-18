() => {
  let component = document.querySelector('.waveform-preview').__vueParentComponent
  while (component.type.__name !== 'App') component = component.parent
  const app = component.setupState
  const original = JSON.parse(JSON.stringify(app.series))
  app.edit('animationEnabled', false)
  const custom = { color: '#123456', lineWidth: 3, lineType: 'linear', lineStyle: 'solid', opacity: 0.8,
    point: { visible: true, type: 'square', size: 3, color: '#234567', borderColor: '#345678', borderWidth: 2 } }
  const definitions = [
    ['颜色', 'style.color', 'line.color', '#abcdef', '#aabbcc', 'input'],
    ['线宽', 'style.lineWidth', 'line.width', 7, 5, 'input'],
    ['连线类型', 'style.lineType', 'line.type', 'step-end', 'step-start', 'select'],
    ['线条样式', 'style.lineStyle', 'line.style', 'dashed', 'dash-dot', 'select'],
    ['透明度', 'style.opacity', 'line.opacity', 0.4, 0.6, 'input'],
    ['显示数据点', 'style.point.visible', 'point.visible', false, true, 'boolean'],
    ['数据点形状', 'style.point.type', 'point.type', 'triangle', 'diamond', 'select'],
    ['数据点大小', 'style.point.size', 'point.size', 6, 4, 'input'],
    ['数据点颜色', 'style.point.color', 'point.color', '#fedcba', '#112233', 'input'],
    ['点边框颜色', 'style.point.borderColor', 'point.borderColor', '#654321', '#445566', 'input'],
    ['点边框宽度', 'style.point.borderWidth', 'point.borderWidth', 4, 1, 'input'],
  ]
  const rows = []
  const wait = () => new Promise(resolve => requestAnimationFrame(resolve))
  const at = (value, path) => path.split('.').reduce((node, key) => node?.[key], value)
  const host = document.querySelector('.waveform-preview')
  const lines = () => [...host.querySelectorAll('g[clip-path] path[fill="none"]')]
  const points = i => { const next = lines()[i].nextElementSibling; return next?.tagName.toLowerCase() === 'g' ? next : null }
  const peers = index => JSON.stringify(lines().map((line, i) => i === index ? null : [line.outerHTML, points(i)?.outerHTML]))
  const field = label => [...document.querySelectorAll('.config-field')].find(el => el.querySelector('.config-field__label').textContent === label)
  async function run(index) {
    for (const [, path, inherited] of definitions) app.edit(inherited, at({ style: custom }, path))
    app.updateSeries(original.map(series => ({ ...series, style: structuredClone(custom), data: [{ id: 'a', x: 0, y: -1 }, { id: 'b', x: 1, y: 1 }, { id: 'c', x: 2, y: 0 }] })))
    await wait()
    const baseline = peers(index)
    const selectedLabel = document.querySelector('.series-selector .ant-select-selection-item').textContent
    rows.push({ index, case: 'selected identity', selectedLabel, expected: original[index].name, pass: selectedLabel === original[index].name })
    for (const [n, [label, path, inherited, value, later, kind]] of definitions.entries()) {
      const category = n < 5 ? '线条' : '数据点'
      const item = [...document.querySelectorAll('.ant-segmented-item')].find(el => el.textContent === category)
      item.click()
      await wait()
      const f = field(label)
      if (kind === 'select') {
        let owner = f.__vueParentComponent
        while (owner.type.__name !== 'ConfigField') owner = owner.parent
        owner.emit('change', value)
      } else if (kind === 'boolean') f.querySelector('[role=switch]').click()
      else {
        const input = f.querySelector('input:not([type=color])')
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, String(value))
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
      await wait()
      const customPass = at(app.series[index], path) === value && peers(index) === baseline
      const toggle = document.querySelector(`input[aria-label="${label}跟随全局"]`)
      toggle.click()
      await wait()
      const inheritPass = at(app.series[index], path) === undefined && toggle.checked
      app.edit(inherited, later)
      await wait()
      const line = lines()[index], point = points(index)?.querySelector('path')
      let renderedPass = true
      if (path === 'style.color') renderedPass = line.getAttribute('stroke') === later
      if (path === 'style.lineWidth') renderedPass = line.getAttribute('stroke-width') === String(later)
      if (path === 'style.lineStyle') renderedPass = line.getAttribute('stroke-dasharray') === '8 4 2 4'
      if (path === 'style.opacity') renderedPass = line.getAttribute('stroke-opacity') === String(later)
      if (path === 'style.point.visible') renderedPass = !!point
      if (path === 'style.point.color') renderedPass = point.getAttribute('fill') === later
      if (path === 'style.point.borderColor') renderedPass = point.getAttribute('stroke') === later
      if (path === 'style.point.borderWidth') renderedPass = point.getAttribute('stroke-width') === String(later)
      if (path === 'style.lineType') {
        const frame = host.querySelector('.waveform-frame-border')
        const w = Number(frame.getAttribute('width')), h = Number(frame.getAttribute('height'))
        const expected = [0, h, 0, 0, w / 2, 0, w / 2, h / 2, w, h / 2]
        const actual = line.getAttribute('d').match(/-?[\d.]+/g).map(Number)
        renderedPass = actual.length === expected.length && actual.every((v, i) => Math.abs(v - expected[i]) <= 0.00051)
      }
      if (path === 'style.point.type' || path === 'style.point.size') {
        const coords = point.getAttribute('d').match(/-?[\d.]+/g).map(Number)
        const vertices = Array.from({ length: coords.length / 2 }, (_, i) => [coords[i * 2], coords[i * 2 + 1]])
        const area = Math.abs(vertices.reduce((sum, v, i) => { const next = vertices[(i + 1) % vertices.length]; return sum + v[0] * next[1] - v[1] * next[0] }, 0)) / 2
        renderedPass = vertices.length === 4 && Math.abs(area - 4 * (n === 7 ? 4 : 3) ** 2) <= 0.05
      }
      rows.push({ index, label, customPass, inheritPass, renderedPass, peersPreserved: peers(index) === baseline,
        pass: customPass && inheritPass && renderedPass && peers(index) === baseline })
    }
    return { index, count: rows.filter(row => row.index === index).length, failed: rows.filter(row => row.index === index && !row.pass) }
  }
  window.__b46 = { run, rows }
  return { ready: true, names: original.map(series => series.name) }
}
