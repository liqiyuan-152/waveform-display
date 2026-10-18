async () => {
  let component = document.querySelector('.waveform-preview').__vueParentComponent
  while (component.type.__name !== 'App') component = component.parent
  const app = component.setupState
  const chart = app.chart
  chart.animation.finish()
  app.edit('animationEnabled', false)
  for (const [path, value] of [
    ['width', 800], ['height', 400], ['layout.autoPadding', false],
    ['padding.left', 90], ['padding.right', 90], ['padding.top', 32], ['padding.bottom', 62],
    ['layout.horizontalPadding', { left: 90, right: 90 }],
    ['xDomainStrategy.type', 'data'], ['xAxis.tickStrategy', 'legacy'],
    ['yAxes', [{ id: 'left', position: 'left', tickStrategy: 'legacy', tickCount: 6, title: { visible: false } }]],
    ['point.visible', true], ['line.type', 'linear'],
    ['zeroLine.visible', true], ['zeroLine.boundaryThreshold', 0],
    ['animation.enabled', false], ['animationUpdate.duration', 400], ['animationUpdate.easing', 'linear'],
    ['animationThreshold', 10000],
  ]) app.edit(path, value)
  const base = ['signal', 'reference'].map((id, index) => ({
    id, name: index ? '参考通道' : '信号通道',
    data: Array.from({ length: 14 }, (_, x) => ({ id: `point-${x}`, x, y: Math.sin(x / 3 + index) })),
  }))
  app.updateSeries(base)
  await new Promise(resolve => setTimeout(resolve, 0))
  chart.animation.finish()
  app.edit('animationEnabled', true)
  let time = 0, sequence = 0
  const pending = new Map()
  Object.defineProperty(performance, 'now', { configurable: true, value: () => time })
  window.requestAnimationFrame = callback => { pending.set(++sequence, callback); return sequence }
  window.cancelAnimationFrame = handle => pending.delete(handle)
  const clone = value => JSON.parse(JSON.stringify(value))
  const host = document.querySelector('.waveform-preview')
  const near = (a, b, tolerance = 1e-8) => Math.abs(a - b) <= tolerance
  const checks = []
  let before, target, currentCase
  const domain = ctx => ({ x: [...ctx.xDomain], y: [...ctx.primaryYAxis.domain] })
  function capture() {
    const ctx = chart.animationController.current
    before = { domains: domain(ctx), series: clone(app.series), width: ctx.innerWidth, height: ctx.innerHeight }
    return before
  }
  function begin(name, version) {
    target = chart.animationController.target
    const data = clone(app.series)
    const points = data.flatMap(series => series.data)
    const expectedX = [Math.min(...points.map(p => p.x)), Math.max(...points.map(p => p.x))]
    const expectedY = name === 'extreme' ? [-4, 4] : [Math.min(...points.map(p => p.y)), Math.max(...points.map(p => p.y))]
    const actual = domain(target)
    const dataPass = data.every((series, index) => {
      if (name === 'append') return series.data.length === before.series[index].data.length + 1
        && JSON.stringify(series.data.slice(0, -1)) === JSON.stringify(before.series[index].data)
        && JSON.stringify({ ...series, data: [] }) === JSON.stringify({ ...before.series[index], data: [] })
      const start = name === 'window' ? version : 0
      const amplitude = name === 'extreme' ? 1e8 : name === 'auto-padding' ? 10 ** (version % 5) : 1 + version % 4
      return series.data.length === 14 && series.data.every((point, offset) => point.id === `point-${start + offset}`
        && point.x === start + offset && near(point.y, Math.sin(point.x / 3 + version / 4 + index) * amplitude))
    })
    currentCase = { name, version, before: clone(before), targetDomains: actual, expectedX, expectedY,
      dataPass, domainPass: actual.x.every((n, i) => near(n, expectedX[i])) && actual.y.every((n, i) => near(n, expectedY[i])),
      running: chart.animation.isRunning(), frames: [] }
    checks.push(currentCase)
    return { name, running: currentCase.running, dataPass, domainPass: currentCase.domainPass }
  }
  function sample(progress) {
    const ctx = chart.animationController.current
    const end = domain(target), old = before.domains
    const xd = old.x.map((n, i) => n * (1 - progress) + end.x[i] * progress)
    const yd = old.y.map((n, i) => n * (1 - progress) + end.y[i] * progress)
    const x = value => (value - xd[0]) / (xd[1] - xd[0]) * ctx.innerWidth
    const y = value => ctx.innerHeight - (value - yd[0]) / (yd[1] - yd[0]) * ctx.innerHeight
    const expected = app.series.map(series => ({ ...series, data: series.data.map(point => {
      const oldSeries = before.series.find(item => item.id === series.id)
      const oldPoint = oldSeries?.data.find(item => item.id === point.id) ?? point
      return { ...point, x: oldPoint.x * (1 - progress) + point.x * progress, y: oldPoint.y * (1 - progress) + point.y * progress }
    }) }))
    const paths = [...host.querySelectorAll('g[clip-path] path[fill="none"]')]
    const symbols = [...host.querySelectorAll('g[clip-path] path[transform]')]
    const expectedPoints = expected.flatMap(series => series.data)
    let pathPass = paths.length === expected.length
    paths.forEach((path, index) => {
      const numbers = path.getAttribute('d').match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number)
      const expectedNumbers = expected[index].data.flatMap(point => [x(point.x), y(point.y)])
      pathPass &&= numbers.length === expectedNumbers.length && numbers.every((n, i) => near(n, expectedNumbers[i], 0.00051))
    })
    const symbolPass = symbols.length === expectedPoints.length && symbols.every((node, i) => {
      const coordinates = node.getAttribute('transform').match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number)
      return near(coordinates[0], x(expectedPoints[i].x)) && near(coordinates[1], y(expectedPoints[i].y))
    })
    const tickRows = []
    for (const selector of ['.waveform-axis-x .tick', '.waveform-grid-x .tick', '.waveform-axis-y--left .tick', '.waveform-grid-y .tick']) {
      const nodes = [...host.querySelectorAll(selector)]
      const horizontal = selector.includes('-x')
      tickRows.push({ selector, count: nodes.length, pass: nodes.length > 0 && nodes.every(node => {
        const coords = node.getAttribute('transform').match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number)
        return near(coords[horizontal ? 0 : 1], (horizontal ? x(node.__data__) : y(node.__data__)) + 0.5)
      }) })
    }
    const zero = host.querySelector('.waveform-zero-line')
    const zeroPass = yd[0] < 0 && yd[1] > 0 ? !!zero && near(Number(zero.getAttribute('y1')), y(0)) : !zero
    const actualDomains = domain(ctx)
    const domainPass = actualDomains.x.every((n, i) => near(n, xd[i])) && actualDomains.y.every((n, i) => near(n, yd[i]))
    const frame = { progress, time, domains: actualDomains, expectedDomains: { x: xd, y: yd }, pathPass, symbolPass,
      paths: paths.length, points: symbols.length, tickRows, zeroPass, domainPass, running: chart.animation.isRunning() }
    frame.pass = pathPass && symbolPass && domainPass && zeroPass && tickRows.every(row => row.pass)
    currentCase.frames.push(frame)
    return frame
  }
  function step(delta) {
    time += delta
    const callbacks = [...pending.values()]
    pending.clear()
    callbacks.forEach(callback => callback(time))
  }
  window.__b45 = { app, chart, checks, capture, begin, sample, step, pending }
  return { ready: true, initial: capture(), reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    hidden: document.hidden, viewport: { width: innerWidth, height: innerHeight } }
}
