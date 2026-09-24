# 大屏波形组件（waveform-display）

一个基于 TypeScript、D3 和 SVG 构建的配置驱动型波形展示组件，使用 Vite 进行开发和构建。

[在线演示](https://lqycustomsite.online/waveform-display/) · [源码仓库](https://github.com/liqiyuan-152/waveform-display)

## 功能特性

- 无额外交互框架依赖，专注于波形展示
- 支持单条或多条波形序列
- 基于 `ResizeObserver` 的响应式 SVG 渲染
- 自动为坐标轴、标题和图例计算留白
- 可统一配置绘图区边框的颜色、宽度、样式、圆角和背景色
- 可选的居中帧号水印，并支持自定义字体样式
- 可配置波形颜色、宽度、线型、虚线样式和透明度
- 支持全局及单序列数据点样式：圆形、方形、三角形和菱形
- 可配置 X/Y 轴范围、刻度数量、刻度长度、间距和 D3 数字格式
- 可选的易读 X 轴范围自动扩展
- 极大或极小 Y 轴数值共用科学计数法指数
- 支持任意命名、独立缩放的多条 Y 值轴
- 支持坐标轴标题和单位
- 支持水平或垂直图例，并预览对应线型
- 可配置 X/Y 网格样式
- 支持零值参考线
- 可配置无数据状态
- 提供 SVG 字符串和文件导出 API
- 支持图表标题
- 支持单序列样式覆盖
- 支持运行时调用 `updateData()`、`updateOptions()` 和 `destroy()`

## 安装

```bash
npm install waveform-display
```

## 示例项目

- 在线地址：[https://lqycustomsite.online/waveform-display/](https://lqycustomsite.online/waveform-display/)
- 示例源码：[`src/demo/`](./src/demo/)

克隆仓库并安装依赖后，可运行 `pnpm dev` 在本地启动示例项目。

## 本地开发

本项目的 CI 使用 Node.js 20 和 pnpm 9。建议本地使用相同版本。

```bash
pnpm install
pnpm dev
```

## 演示中的值轴模式

演示页面默认使用多值轴模式，左侧和右侧各显示一条固定坐标轴。打开 **坐标轴 → 值轴**，通过 **单值轴 / 多值轴** 控件切换模式：

- **单值轴**：所有序列、Y 轴网格和零线都绑定到左轴。
- **多值轴**：恢复此前保存的左右轴配置、各序列绑定关系以及网格和零线的参考轴。

单值轴模式下，由于只有左轴可用，所有参考轴选择控件都会隐藏。演示页面提供固定的左右轴操作流程；组件 API 保持不变，仍可通过 `yAxes` 和各序列的 `yAxis` 配置绑定关系。

## 构建与检查

所有测试统一存放在根目录 `tests/` 下，并按照 `core`、`renderer` 和 `demo` 模块分类。可以运行全部测试，也可以按路径执行单个测试文件：

```bash
pnpm test
pnpm test -- tests/core/Waveform.axes.test.ts
pnpm check
pnpm build
```

## 基本用法

```ts
import { Waveform } from 'waveform-display'

const chart = new Waveform('#chart', [
  { x: 0, y: 0.2 },
  { x: 1, y: 0.8 },
  { x: 2, y: -0.4 },
], {
  width: '100%',
  responsive: { enabled: true, aspectRatio: 2.5 },
  layout: { autoPadding: true },
  frame: {
    borderColor: '#334155',
    borderWidth: 2,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
  },
  line: { color: '#2563eb', width: 2 },
  frameNumber: 12,
  frameNumberStyle: { color: '#1677ff', opacity: 0.1 },
  shot: { visible: true, text: '10001', fontSize: 11 },
  title: { visible: true, text: '波形图', fontSize: 16 },
  legend: { fontSize: 12 },
  xDomainStrategy: { type: 'nice', bounds: 'both', tickCount: 10 },
  xAxis: {
    fontSize: 11,
    showEndValues: true,
    tickStep: 0.5,
    tickFormat: '.1f',
    title: { visible: true, text: '时间', unit: 's', fontSize: 12 },
  },
  yAxis: {
    fontSize: 11,
    tickFormat: '.2f',
    title: { visible: true, text: '振幅', unit: 'V', fontSize: 12 },
  },
  grid: { style: 'dashed', color: '#e2e8f0', width: 1 },
})
```

构造函数签名为 `new Waveform(target, data, options?)`。`target` 可以是 CSS 选择器或 `HTMLElement`；如果找不到对应容器，构造函数会抛出 `Waveform container not found`。

`grid.style` 可设为 `solid` 或 `dashed`；`grid.color` 和 `grid.width` 同时作用于 X、Y 方向的网格线。原有的 `grid.x.color`、`grid.x.width`、`grid.x.dash`、`grid.y.color`、`grid.y.width` 和 `grid.y.dash` 配置仍然有效，并会覆盖对应方向的共用配置。

## 数据格式

组件接受点数组或序列数组。点数组会作为单条序列处理：

```ts
type WaveformPoint = {
  x: number
  y: number
}

type WaveformSeries = {
  id?: string
  name?: string
  shot?: string | number
  unit?: string
  order?: number
  yAxis?: string
  data: WaveformPoint[]
  style?: {
    color?: string
    lineWidth?: number
    lineType?: 'linear' | 'step-start' | 'step-middle' | 'step-end'
    lineStyle?: 'solid' | 'dashed' | 'dash-dot'
    opacity?: number
    point?: {
      visible?: boolean
      type?: 'circle' | 'square' | 'triangle' | 'diamond'
      size?: number
      color?: string
      borderColor?: string
      borderWidth?: number
    }
  }
}

type WaveformData = WaveformPoint[] | WaveformSeries[]
```

多序列场景建议为每条序列提供稳定且唯一的 `id`，这样通过图例隐藏的状态可以在数据更新和排序变化后保持一致。

## 实例 API

| 方法 | 说明 |
| --- | --- |
| `updateData(data)` | 替换当前数据并立即重新渲染。 |
| `updateOptions(options)` | 合并配置并立即重新渲染；`yAxes` 数组整体替换，其余嵌套配置按对象合并。 |
| `render()` | 使用当前数据和配置重新渲染。通常无需手动调用。 |
| `toSVGString()` | 返回当前 SVG 字符串；没有 SVG 时返回空字符串。 |
| `downloadSVG(filename?)` | 下载当前 SVG，默认文件名为 `waveform.svg`。 |
| `destroy()` | 断开 `ResizeObserver`、清空容器并释放实例渲染状态。 |

## 主要配置

完整类型由包入口导出，可直接使用 `WaveformOptions`、`WaveformSeries` 和 `WaveformData`。以下是常用配置分组：

| 配置 | 用途 | 关键默认值 |
| --- | --- | --- |
| `width`、`height` | SVG 逻辑尺寸。 | `'100%'`、`320` |
| `responsive` | 响应式高度、宽高比及高度限制。 | 启用，宽高比 `2.5`，高度 `220` 至 `600` |
| `layout`、`padding` | 自动留白、水平对齐下限和手动留白。 | 自动留白启用 |
| `frame`、`frameNumberStyle` | 绘图区边框、背景和帧号水印。 | 黑色 `2px` 实线边框 |
| `line`、`point` | 全局曲线和数据点样式。 | 蓝色 `1.5px` 实线，数据点隐藏 |
| `xDomainStrategy` | 使用数据原始范围或扩展到易读边界。 | `{ type: 'data' }` |
| `xAxis`、`yAxis`、`secondaryYAxis`、`yAxes` | 坐标轴范围、刻度、标题和多值轴。 | 左侧主 Y 轴可见，右侧兼容轴隐藏 |
| `grid`、`zeroLine` | X/Y 网格和零值参考线。 | 虚线网格；红色半透明零线 |
| `title`、`shot`、`legend` | 标题、右侧炮号元数据和图例。 | 标题和炮号隐藏，图例启用 |
| `emptyState` | 无有效数据时的提示。 | `No waveform data` |
| `onLayoutChange` | 获取自动测量得到的自然水平留白。 | 未设置 |

所有配置字段均为可选项，默认值也可以从包入口导出的 `defaultOptions` 查看。

## 帧号水印

将 `frameNumber` 设置为字符串或数字，即可在绘图区中央显示水印。数值 `0` 是有效帧号；不传该配置或将其设为 `undefined` 可隐藏水印。

```ts
const chart = new Waveform('#chart', data, {
  frameNumber: 'FRAME-12',
  frameNumberStyle: {
    color: '#1677ff',
    opacity: 0.1,
    fontSize: 72,
    fontFamily: "Consolas, Monaco, 'Courier New', monospace",
    fontWeight: 400,
  },
})
```

未配置 `fontSize` 时，水印字号为 `min(120, 绘图区高度的 65%)`。当内容过长或绘图区较窄时，字号会继续缩小，确保文字不会超出绘图区。显式配置的字号同样被视为最大值，因此响应式布局下文字也不会溢出。水印仅用于装饰，不可选中，不占用额外留白，也不会拦截指针事件。

`frameNumber` 与 `shot` 相互独立：帧号是位于绘图区中央的大号水印，而 `shot` 用于在边框右侧显示紧凑的竖排元数据。

## 多序列与多值轴

```ts
new Waveform('#chart', [
  {
    name: '电压',
    unit: 'V',
    yAxis: 'voltage',
    data: voltageData,
    style: {
      color: '#2563eb',
      lineWidth: 2,
    },
  },
  {
    name: '电流', unit: 'mA', yAxis: 'current', data: currentData,
    style: {
      color: '#dc2626',
      lineStyle: 'dashed',
      point: { visible: true, type: 'diamond', size: 3 },
    },
  },
  {
    name: '温度', unit: 'C', yAxis: 'temperature', data: temperatureData,
    style: { color: '#16a34a' },
  },
], {
  legend: {
    visible: true,
    position: 'top-left',
    orientation: 'horizontal',
    maxItemWidth: 200,
  },
  yAxes: [
    { id: 'voltage', position: 'left', title: { visible: true, text: '电压', unit: 'V' } },
    { id: 'temperature', position: 'left', title: { visible: true, text: '温度', unit: 'C' } },
    { id: 'current', position: 'right', tickFormat: '.0f', title: { visible: true, text: '电流', unit: 'mA' } },
  ],
  grid: { y: { axisId: 'voltage' } },
  zeroLine: { axisId: 'voltage' },
})
```

当图表实际包含多条序列时，单击图例项，或聚焦后按 Enter/Space，可隐藏或恢复对应序列。X、Y 轴的自动范围会根据当前可见序列重新计算。只要仍能匹配到原序列，图例的选择状态就会在重绘和调用 `updateData()` 后保留；如果序列可能重新排序，请为每条序列提供唯一的 `id`，以保持选择状态稳定。

通道标签会根据实际序列数量自动变化。只有一条有效序列时，不显示图例项和 Y 轴标题，而是在绘图区上方水平居中显示该序列的 `name`，这一行为不受 `legend.visible` 影响。存在多条有效序列时，不显示居中的名称，而是使用图例和 Y 轴标题。显式配置的坐标轴 `title.text` 优先级最高；否则，当前显示的坐标轴会使用第一条可见序列的名称。自动推导的坐标轴标题默认可见，而显式设置的 `title.visible: false` 始终生效。空序列不影响模式判断，通过图例隐藏序列也不会让多序列图表切换成单序列模式。

### 图例项宽度

`legend.maxItemWidth` 用于限制每个图例项的布局宽度，单位为像素。该宽度包含线条预览、预览与文本之间的间距以及标签文本，默认值为 `200`。

```ts
const chart = new Waveform('#chart', series, {
  legend: {
    visible: true,
    position: 'top-left',
    orientation: 'horizontal',
    maxItemWidth: 160,
  },
})
```

超过设定宽度的标签会以省略号显示。完整文本仍可通过 SVG `<title>` 元素和图例项的 `aria-label` 获取。水平图例在判断何处换行时，也会使用限制后的图例项宽度。

初始化后也可以修改该值：

```ts
chart.updateOptions({
  legend: { maxItemWidth: 240 },
})
```

需要完整显示标签时可增大该值；在紧凑或狭窄布局中可减小该值。由于线条预览也计入宽度限制，在 `maxItemWidth` 不变时，增大 `legend.lineLength` 会减少标签文本的可用空间。

当同一图表可能包含不同炮号的数据时，可为每条序列设置 `shot`。如果所有有效序列的炮号相同，图例标签保持不变。当存在两个或更多不同炮号时，各序列的炮号会追加到图例标签，例如 `电压 (10001)`；未设置炮号的序列仍显示原标签。

每一侧最多显示一条值轴。当可见序列绑定到同一侧的多条已配置坐标轴时，将显示第一条有效坐标轴，这些序列共同使用该轴合并后的自动范围和比例尺。网格和零线若引用了同侧的其他坐标轴 ID，会自动解析为当前显示的坐标轴；`layout.autoPadding` 也会为当前显示的标签和标题预留空间。

原有的 `yAxis`、`secondaryYAxis` 以及序列对 `left` 或 `right` 的绑定方式仍然受支持。当提供 `yAxes` 时，以 `yAxes` 为准，旧配置会被忽略。通过 `updateOptions()` 传入 `yAxes` 会替换整个数组。空 ID 会被忽略；重复 ID 只保留第一次出现的配置；未知的序列轴或参考轴 ID 会回退到第一条有效坐标轴。

### 协调水平留白

垂直方向仍使用原有默认留白（上方 `42`、下方 `58`），并且可以分别覆盖。启用自动留白时，下方最小值为 `30px`：小于 30 的配置会提高到 30，更大的显式配置则会保留。标题、单通道名称和顶部图例不再强制要求固定的 42px/64px 顶部最小值；它们继续使用原有绘制位置，因此使用较小顶部留白时，调用方需要自行避免内容重叠。可见的 Y 轴页眉仍会预留其测量高度及原有的 8px 间距。设置 `layout.autoPadding: false` 后，垂直留白完全由调用方控制。可见的左轴内容会预留 5px 外侧间距，而不是 2px；右侧计算和水平方向协调逻辑保持不变。

每个波形实例都会独立测量自身的坐标轴、轴标题、图例和右侧元数据。可以通过 `layout.horizontalPadding` 为自动测量后的左侧和/或右侧留白设置最小值，从而在不关闭自动留白的情况下对齐多个相邻图表的绘图区边框。无效值会被忽略；移除或减小最小值后，边框会立即恢复为更小的自然留白。

```ts
const chart = new Waveform('#chart', data, {
  layout: { autoPadding: true },
  onLayoutChange: ({ naturalPadding }) => {
    // 将该值共享给相邻图表，再为它们设置统一的留白下限。
    chart.updateOptions({
      layout: { horizontalPadding: naturalPadding },
    })
  },
})
```

`onLayoutChange` 会在渲染后执行，包括首次渲染以及自然水平留白发生变化时。回调接收应用 `horizontalPadding` 前的留白值，数据变为空时也会触发。通过 `updateOptions()` 替换回调时，新回调还会收到当前的自然留白值。

## 导出 SVG

```ts
const svgSource = chart.toSVGString()
chart.downloadSVG('waveform.svg')
```

## 无数据状态

```ts
new Waveform('#chart', [], {
  emptyState: {
    visible: true,
    text: '暂无数据',
  },
})
```

`tickFormat` 既可以是 D3 数字格式字符串（如 `.2f`），也可以是自定义格式化函数 `(value: number) => string`。

所有字号均为以像素为单位的数值。坐标轴刻度标签分别使用 `xAxis.fontSize` 和各值轴的 `fontSize`；坐标轴标题保留各自独立的 `title.fontSize` 配置。图表标题、图例和炮号分别使用 `title.fontSize`、`legend.fontSize` 和 `shot.fontSize`。

## 坐标轴范围与数字格式

X 轴范围默认使用数据的精确范围。将 `xDomainStrategy.type` 设为 `nice`，可将范围扩展到稳定、易读的边界。`bounds: 'end'` 会保留数据最小值，只扩展最大值。显式配置的 `xAxis.min`/`max` 会被保留，除非启用 `includeExplicit`。

默认情况下，最终 X 轴范围的起止值固定显示在边框的左右两端，并与其他 X 轴标签使用相同的 `tickFormat` 和 `unit`。将 `xAxis.showEndValues` 设为 `false` 后，只显示常规刻度。

将 `xAxis.tickStep` 设为有限的正数，可以按指定间隔生成与零点对齐的常规刻度。有效的步长配置优先于 `xAxis.tickCount`；不传该配置、使用 `undefined` 清除，或传入无效值后，将重新使用 `tickCount`。当指定步长导致刻度过于密集时，组件会根据绘图区宽度和格式化后的标签宽度，自动将步长增大为易读的 `1/2/5/10 × 10ⁿ` 倍数，常规刻度最多为 100 个。如果步长大于最终 X 轴范围的跨度，则不显示常规刻度，但仍可通过 `showEndValues` 显示端点值。

```ts
chart.updateOptions({ xAxis: { tickStep: 5 } })
chart.updateOptions({ xAxis: { tickStep: undefined } }) // 恢复 tickCount 模式。
```

每条 Y 值轴都使用分配给它的有效数据点的精确最小值和最大值，不会将范围扩展到取整后的边界。每条轴的 `min` 和 `max` 可以分别覆盖对应边界。没有分配序列的坐标轴使用 `[0, 1]`；如果只显式配置一个边界，另一边界相差一个单位。当所有已分配的 Y 值都相等时，范围会向两侧各扩展一个单位，确保比例尺可用。

Y 轴刻度包含范围的两个精确端点。当范围内最大绝对值大于 `0` 且小于 `0.01`，或大于等于 `1000` 时，所有标签会共用一个科学计数法指数。单位和指数显示在对应 Y 轴上方，距离绘图区 8px，并与最外侧刻度标签边缘对齐：左轴左对齐，右轴右对齐。例如左轴显示 `V E+03`；普通数值范围只显示单位，如 `V`。所有刻度标签只显示数值。自定义 `tickFormat` 的优先级最高，并会禁用自动页眉。

自动布局会测量页眉和刻度，将默认坐标轴标题放在刻度标签外侧 12px 处，同时将左轴标题向右移动 10px，并只预留让页眉保持在 SVG 内所需的顶部空间；页眉不会在图例下方额外占据一行。显式的标题偏移和留白配置仍然有效；左右默认留白均为 0px。自动布局只为可见内容及坐标轴外侧间距预留空间，左侧为 5px、右侧为 2px。隐藏 Y 轴标题会立即释放其占用空间，而刻度、单位、图例和 X 轴元数据仍会保留所需空间。显式 `padding` 和 `layout.horizontalPadding` 始终作为最小值；设置 `layout.autoPadding: false` 后，所有留白都由调用方控制。左轴页眉在绘图区上方向右延伸，不会增加左侧留白；顶部水平图例会为其让出空间。右轴页眉向左延伸到绘图区上方，顶部水平图例会避开左右页眉。自动右侧留白最多可回收 10px，实际回收量受可见外部内容和显式留白最小值限制。演示页面没有水平预览内边距，因此隐藏标题后，刻度标签会贴近容器边缘。

零线默认使用红色（`#ff0000`），并设置 `zeroLine.opacity: 0.5`。透明度可设为 `0`（完全透明）到 `1`（完全不透明）；颜色、宽度、虚线、可见性和参考轴均可配置。当零线距离参考 Y 轴的任一边界小于一个刻度间距的 2% 时，默认不绘制零线。可通过 `zeroLine.boundaryThreshold` 修改比例，例如 `0.05` 表示 5%，`0` 表示仅在零线恰好位于边界时隐藏。该设置也可通过 `chart.updateOptions({ zeroLine: { boundaryThreshold: 0.05 } })` 动态修改；它不会改变数据范围或刻度标签。

`zeroLine.color` 支持 CSS 颜色，包括 `rgba()` 和八位十六进制颜色（`#RRGGBBAA`）。颜色自身的 Alpha 通道会与 `zeroLine.opacity` 相乘，因此如果颜色已经包含透明度，请将 `opacity` 设为 `1`：

```ts
chart.updateOptions({ zeroLine: { visible: true, color: '#ff0000', opacity: 0.5 } })
chart.updateOptions({ zeroLine: { color: 'rgba(255, 0, 0, 0.5)', opacity: 1 } })
chart.updateOptions({ zeroLine: { color: '#ff000080', opacity: 1 } })
```

在演示页面中，打开 **网格 → 零线**，可以编辑 **零线颜色** 和 **零线透明度**。颜色选择器用于选择不透明 RGB 颜色；旁边的文本输入框可输入带 Alpha 通道的 CSS 颜色。独立的透明度字段会作用于以上两种输入方式。

普通值和应用共享指数后的缩放值都会通过 `Intl.NumberFormat('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })` 格式化，并将负零规范为 `0`。例如，`3.00` 会显示为 `3`，`12.34567` 会显示为 `12.35`，而 `[0, 9999]` 范围中的 `1234.56` 会结合 `E+03` 页眉显示为 `1.23`。格式化不会修改源数据或坐标轴范围。

显式配置的 `tickFormat` 始终优先，并接收未经转换的刻度值；如需保留固定两位小数，可使用 `.2f`。

## 发布与部署

当前生产环境使用 `main` 分支持续部署；仓库中还保留了一套尚未接入生产环境的稳定 Release 镜像流程：

- **当前生产部署**：推送到 `main` 后，`deploy.yml` 使用 Node.js 22 完成类型检查、测试和构建，再通过 `DOKPLOY_DEPLOY_URL` 通知 Dokploy。Dokploy 使用 `docker-compose.dokploy.yml` 和 `Dockerfile.dokploy` 构建部署镜像；工作流最后读取 `/waveform-display/version.txt`，确认线上提交与本次构建一致。
- **可选稳定 Release 镜像流程**：`showcase-release.yml` 用于将稳定的 `vX.Y.Z` Release 构建为按摘要锁定的 GHCR 镜像，再通过受限 SSH 入口部署。该流程目前尚未配置 `production` 环境所需的 GHCR 和 SSH Secret，也没有接入服务器受限部署入口，因此不属于当前可用的生产部署链路。
- **npm 发布**：发布 GitHub Release 会触发 `publish.yml`。只有 Release 标签与 `package.json` 版本一致并且 `pnpm check` 通过时，包才会发布到 npm；该流程本身不负责判断 Release 是否为预发布版本。
- **回滚**：当前生产环境通过还原 `main` 中的对应提交触发重新部署；没有自动回滚。只有在稳定 Release 镜像流程完成服务器接入后，才能使用其中按部署请求 ID 恢复不可变镜像的功能。

当前生产部署的运行阶段依赖服务器已有的 `local/sub2api-cpa-converter:1bd8fb805d5d` 镜像，构建阶段使用 Node.js 22；请确保服务器保留该运行时镜像。可选的稳定 Release 镜像构建和 npm 发布不依赖这个 Dokploy 运行时镜像。
