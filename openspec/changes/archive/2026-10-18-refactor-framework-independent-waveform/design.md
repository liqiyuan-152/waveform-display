## Context

动机见 proposal.md。当前库入口为 src/index.ts，运行时依赖仅 d3。Waveform.ts 约 478 行，config-panel.ts 约 886 行；每次渲染重建 SVG，Demo 在模块加载时直接挂载。

本次扫描基线：pnpm check、pnpm build:demo 通过，17 个测试文件、193 个测试通过。这是重构前结果，不代表后续实现已验证。

## Goals / Non-Goals

**Goals:** 类负责状态、生命周期和可替换行为；纯计算保留函数。组件与 Demo 单向依赖，内部类型就近存放，公共类型集中导出。先保持行为，再优化节点更新。

**Non-Goals:** 本项目不提供分页或标注功能；对应动画、预设、配置、对象类型与专用扩展槽均不实现，此项不是延期任务。 不移除 D3，不建立通用图表平台，不引入 Canvas、渐进任务图、撤销系统或全局依赖注入容器；暂不发布独立配置编辑器，不拆多包 monorepo。

## Decisions

### 1. 目录与依赖边界

采用单包、分目录构建，避免当前规模下多包版本管理成本。目标目录按实际迁移逐步建立，不预建空类。

```text
src/
  index.ts                     # 公共出口
  Waveform.ts                  # 外观与生命周期协调
  core/                        # RenderScheduler、EventEmitter、ActionDispatcher
  model/                       # WaveformModel、SeriesModel、OptionManager
  config/                      # defaults、resolve、merge 纯函数
  data/                        # normalize
  layout/                      # LayoutEngine、AxisLayout
    domain/                    # DomainStrategy、DataDomainStrategy、NiceDomainStrategy
    ticks/                     # TickStrategy、LegacyTickStrategy、NiceXTickStrategy、NiceYTickStrategy
  renderer/
    SvgRenderer.ts
    RenderContext.ts
    views/                     # BaseView、Axis/Series/Grid/Legend/Frame/MetadataView
    utils/                     # formatters、textMeasure、lineStyle
  animation/                   # core 数值引擎、presets、实例控制器、表现层适配
  interaction/actions/         # ToggleSeriesAction
  types/                       # 公共 data、options、events、actions
demo/
  index.html
  vite.config.ts
  src/
    main.ts
    App.vue
    components/
      WaveformPreview.vue
      config-panel/            # 配置面板和分类表单
    composables/useWaveform.ts
    config/                    # 字段定义、解析、校验
    data/
    styles/
tests/
  core/
  model/
  config/
  data/
  layout/
  renderer/
  interaction/
  animation/                   # 可注入时钟的引擎、预设及图表接入回归
  integration/                 # Waveform 公共 API 与 SVG 行为
  demo/
  fixtures/
docs/
  architecture.md
  directory-structure.md
  refactor-plan.md
```

src 不得引用 demo、Vue、ant-design-vue 或其样式。Demo 只消费 src/index.ts 的公共接口，不深导入 resolveOptions 等内部实现。示例 JSON 留在 demo，测试专用样本进入 fixtures。公共声明构建排除 demo；Vue SFC 使用 vue-tsc 单独检查，CI 的 check 聚合两侧检查。

### 2. 类职责与模式

| 模式 | 落点 | 职责 |
| --- | --- | --- |
| 外观 | Waveform | 组装协作对象，稳定公共 API |
| 模型/视图分离 | WaveformModel、SeriesModel 与各 View | 模型拥有数据和选择状态，视图拥有节点 |
| 策略 | DomainStrategy 的 data/nice 实现 | 封装范围算法，保留显式范围规则 |
| 观察者 | EventEmitter | 类型化订阅、取消订阅与布局通知 |
| 命令 | ActionDispatcher、ToggleSeriesAction | 鼠标、键盘、程序调用共享行为 |
| 模板方法 | BaseView | 统一挂载、更新和销毁，具体绘制由子类实现 |
| 工厂/注册表 | 渲染层内部 ViewRegistry | 创建和管理内置视图，不承诺公共插件 API |
| 适配器 | useWaveform | 连接 Vue 与组件生命周期 |

继承控制为 BaseView 到具体视图一层，其余优先组合。OptionManager 持有原始及解析后的配置，config 提供无状态规则；LayoutEngine 不操作 DOM，由渲染层提供文本测量接口。D3 类型保留在内部渲染边界，不暴露到公共模型契约。避免将每个格式化函数包装成类。

### 3. 更新与生命周期

流程为输入 → 配置/数据模型 → 布局 → 视图更新 → 通知。保留默认同步更新；新增 update({ data?, options? }) 一次提交后执行一次业务更新（显式启用动画时允许后续表现帧），两个字段均省略或值均为 undefined 时不更新；data: [] 表示清空数据。这里“原子”仅指一次成功调用合并数据与配置并在关闭动画时只绘制一次，不承诺 DOM、测量或用户回调抛错时的完整事务回滚。已知无效动作与目标须在状态修改前验证。调度器先支持数据、布局、视觉失效标记，不默认延迟到下一帧。

updateOptions 沿用已有深层配置合并、yAxes 数组替换、horizontalPadding 清除语义，先用测试固化；不改成通用 JSON 深合并。新增 animation/animationUpdate 使用字段级浅合并，省略字段保留原值；显式 undefined 的可选字段清除覆盖、恢复默认或移除回调，总开关和阈值的 undefined 恢复各自默认。新增字段的合并规则单独测试，不借此改变已有配置字段语义。render 显式刷新，resize 同步重新测量；固定 width 优先于容器宽度；保留现有 responsive.enabled 且 width 非数值时按宽高比重新计算 height 的行为（即使传入固定 height），不在重构中悄然改变尺寸优先级。保留当前零尺寸时的宽 800、高 320 回退及响应式宽高比规则；隐藏容器显示后通过 ResizeObserver 或显式 resize 刷新，不增加轮询。导出始终读取当前已提交目标状态；动画中导出先同步收敛到最新目标，具体规则见动画章节。

on 返回取消订阅函数；layoutChange 保留现有微任务合并语义，兼容 onLayoutChange 回调。seriesVisibilityChange 的载荷为 { seriesKey: string, seriesId?: string, seriesIndex: number, visible: boolean }；seriesKey 为实例内不透明标识，seriesId 是可选的规范化 ID，seriesIndex 对应当前规范化有效序列列表。无 ID 或重复 ID 的图例交互同样必须发出可识别事件；索引与键不保证跨数据重排稳定，稳定身份依赖唯一 ID。dispatchAction 支持 toggleSeries；无效动作或不存在/不唯一的显式 ID 抛出明确错误且不改变状态。已有无 ID、重复 ID 的内部图例点击继续使用实例内稳定键，不改变兼容行为。

destroy 幂等，释放 ResizeObserver、订阅和待执行任务，仅移除自身节点。SvgRenderer 保存根 SVG 引用，导出、更新及销毁都使用该引用，不使用 container.querySelector('svg') 定位，以免读到宿主原有 SVG；不依赖容器第一个子节点的位置。所有 DOM 创建、观察器与导出对象均从目标元素 ownerDocument/defaultView 获取。销毁后更新、render、resize、dispatchAction、on 抛出明确错误；toSVGString 返回空串，downloadSVG 不产生下载。构造失败时清理已创建资源。初始化期间完成/中断等用户回调延迟到初始化成功注册后的微任务，构造失败则丢弃；避免构造返回前重入导致未注册实例泄漏。销毁首先标记不可用、解除注册并停掉任务，再通知中断；销毁后的回调不得复活该实例。同一容器重复挂载活实例抛错，防止节点所有权冲突。

### 3.1. 配置读取与通知契约

增加 getOptions(): WaveformOptions，返回当前解析后的公共配置快照，包含生效默认值；不暴露内部布局、D3 类型或模型引用。数组和普通对象递归复制，函数值保留引用，不能使用 JSON 序列化复制。修改返回值不影响实例，修改传入配置也不会替代显式 updateOptions 调用。销毁后 getOptions 抛出明确错误。Demo 使用该快照展示表单，在提交后重新读取；只提交用户改动字段的 patch，禁止把完整解析快照作为更新参数回传，否则会将自动默认值、推导 yAxes 和标题可见性固化为显式配置。数组如 yAxes 仍按既有整体替换契约提交。Demo 必须另存自己提交过的原始选项草稿，编辑轴数组时从该草稿生成替换数组，只写入轴 ID、必要绑定和用户明确编辑的属性；不能从 getOptions().yAxes 拷贝全部默认值再回传。首次从旧 yAxis/secondaryYAxis 切换到 yAxes 时，只迁移原始草稿中明确设置的字段。草稿由 Demo 管理，不新增读取内部原始模型的公共接口。此接口不包含序列数据、隐藏选择状态、动态域或实际布局尺寸；配置生效值不是当前渲染状态的快照。

layoutChange 的载荷沿用 WaveformLayoutChange。seriesVisibilityChange 在目标状态及首帧绘制成功后同步发出（不等待动画完成），每次有效切换一次；程序更新数据本身不伪造切换事件。订阅不补发历史事件。微任务派发前新加入的布局订阅者可收到本轮通知。更换旧 onLayoutChange 回调仍按现有 forceLayoutChange 规则通知，即使自然留白未变。旧回调先于新事件订阅者执行；订阅按注册顺序、从派发开始时的快照遍历，派发中新增订阅不参与本轮，已取消订阅跳过。取消函数幂等，销毁后调用安全。

监听器调用更新须在本轮绘制结束后执行；调用 destroy 后停止本轮剩余监听器。监听器异常不回滚已提交图表、不阻止其他有效监听器，派发完成后通过宿主异步错误报告机制报告。同步可见性事件处理器中再次 dispatchAction 明确拒绝重入并抛错；用户需要连锁动作时自行调度到后续任务。以上需用事件顺序及回调异常测试固化。

### 3.2. 目标元素与实例入口

公共目标类型为 `string | HTMLElement`。字符串始终按 CSS 选择器解析：类名使用 `.waveform`，ID 使用 `#waveform`，不将裸字符串自动解释为类名。沿用现有 document.querySelector 的首个匹配语义；多匹配只创建一个图表，需要批量创建时由调用方遍历元素。Shadow DOM 或局部作用域建议直接传元素。

保留 `new Waveform(target, data, options)`，新增静态 `Waveform.init(target, data = [], options = {})` 和 `Waveform.getInstanceByDom(target)`。init 在目标没有实例时创建并返回实例；已有活实例时返回原实例，不应用新传入的数据或配置，修改使用 update。直接 new 在同一容器重复创建将抛错；这是新增防护，当前实现没有此检查。getInstanceByDom 返回实例或 undefined，字符串解析规则与创建一致。

内部使用以 HTMLElement 为键的 WeakMap 管理实例，初始化成功后注册，失败不留记录；destroy 解除注册，之后允许在相同元素重新创建。选择器解析仅在调用时进行，实例始终绑定原始元素，之后改变 class 或 ID 不会重新绑定。

创建时空字符串、非法选择器、未匹配、null/undefined 或非 HTMLElement 输入抛出明确错误且不修改页面。查询时合法选择器未匹配或目标无实例返回 undefined；非法选择器及无效类型抛错。运行时类型检查应兼容同源其他 window 的 HTMLElement，不仅依赖当前窗口的 instanceof。

Vue ref 不作为核心库输入类型，也不在核心中自动解包。Demo 在 onMounted 后传 `containerRef.value` 并检查非空；组件 ref 需要由宿主显式获取实际 HTMLElement，不能直接传 Vue 组件实例。

```ts
// 类名选择器：创建空图表后更新
const chart = Waveform.init('.waveform')
chart.update({ data, options })

// Vue Demo：在 onMounted 内传模板 ref 的 DOM 值
if (containerRef.value) {
  chartRef.value = Waveform.init(containerRef.value, data, options)
}

// 通过元素定位已有图表并操作
Waveform.getInstanceByDom('.waveform')?.resize()
```

这里借鉴 ECharts 的“元素对应实例”使用方式；CSS 选择器解析是本库明确提供的便利入口，不宣称 ECharts 原生接受 Vue ref 对象或 CSS 类名。

### 4. 渲染迁移

先由 View 类调用现有绘制逻辑，建立一致生命周期；之后再让视图保留节点并更新属性。保持零线覆盖曲线、图例选择、单通道标签、每侧最多显示一条值轴以及自然留白通知等已有行为。布局依赖数据和文字尺寸，无法证明安全的视觉变更先走完整布局，避免错误优化。

### 5. Vue Demo

Vue 3 + Ant Design Vue 仅用于 demo。表单拆为坐标轴、曲线、布局等分类组件，字段定义及校验使用纯 TypeScript。onMounted 创建 Waveform，shallowRef 保存实例，卸载及热更新时释放自己拥有的资源。Demo 的 WaveformPreview 使用自有空容器，创建前通过 getInstanceByDom 检查容器未被占用；占用时报告错误，不借用或销毁现有实例。通用宿主若主动复用 init 返回的已有实例，应由最初创建者负责 destroy；init 本身不是引用计数租约，卸载一个借用者不等于销毁共享实例。显式提交变更，避免对大数组深度监听；数据和配置联合变化使用 update。Demo 样式只在 Demo 入口加载。

### 6. 构建、验收及兼容性边界

保留现有 ESM/UMD 文件名、exports、声明入口与 UMD 全局名；D3 继续 external，浏览器 UMD 使用全局 d3。独立消费者验收必须安装实际 pnpm pack 产物，测试 ESM 和声明导入、浏览器 UMD 加载；对 CommonJS require 与 D3 ESM 的兼容性先记录现状，不将现有潜在限制误报为已验证能力。

tsconfig.build.json 的 include 必须覆盖新增目录，检查声明依赖闭包完整。根目录配置负责库，demo/vite.config.ts 明确 root、输出到根 dist-demo 和基础路径。维持 pnpm dev/build/build:demo/preview 的用途；typecheck 聚合 tsc 和 vue-tsc，test 覆盖核心及 Demo，check 聚合检查并构建库和 Demo。新增工具版本须兼容 Node 20/pnpm 9。当前基线尚未证明在 Node 20 上执行，阶段 1 必须重新验证并记录具体版本。

目录迁移阶段先沿用原生 Demo，Vue 工具链在阶段 6 引入；不要在阶段 2 提前要求 vue-tsc。最终发布包的 dependencies、peerDependencies、导出和类型不得要求 Vue/antd；只将它们排为 external 不足以证明无依赖。

视觉验收区分图表与页面：同数据、配置、字体、视口及 DPR 下图表保持视觉等价，动态 clip ID 等非视觉差异不比较；Vue/Ant Design Vue 的面板允许外观变化，以功能、可访问性和布局验收，保存前后截图。性能记录需固定数据规模和操作，报告多轮更新耗时及节点/资源计数；没有数据时不得勾选“无回退”。

### 7. ECharts 参考

已通过 gh api 阅读 apache/echarts 的固定提交 34f4d927eafe251f26f63afd3aeefa30f2feba30：

- [核心门面与动作](https://github.com/apache/echarts/blob/34f4d927eafe251f26f63afd3aeefa30f2feba30/src/core/echarts.ts)
- [模型](https://github.com/apache/echarts/blob/34f4d927eafe251f26f63afd3aeefa30f2feba30/src/model/Model.ts)
- [视图生命周期](https://github.com/apache/echarts/blob/34f4d927eafe251f26f63afd3aeefa30f2feba30/src/view/Chart.ts)
- [调度](https://github.com/apache/echarts/blob/34f4d927eafe251f26f63afd3aeefa30f2feba30/src/core/Scheduler.ts)
- [注册机制](https://github.com/apache/echarts/blob/34f4d927eafe251f26f63afd3aeefa30f2feba30/src/extension.ts)

参考职责划分，不复制完整调度系统，不引入 ECharts 依赖。

### 8. 专项设计与阅读顺序

本文件是总体设计入口，以下专项文档是本变更设计的组成部分，实施前必须一并阅读：

- [animation-design.md](animation-design.md)：动画配置、数据差异匹配、接管、资源所有权和导出。
- [axis-design.md](axis-design.md)：刻度策略、固定域、精度安全、标签布局和帧刻度。
- [acceptance-map.md](acceptance-map.md)：每个规范场景对应的计划验证与任务；实施后填入实际结果。
- specs/ 定义可观察行为；上述文档定义内部实现。修改行为时须同步 proposal、对应 spec 和 tasks，不能仅修改专项文档。

依赖顺序：模型与静态布局 → 持久视图和生命周期 → 事件与同步更新 → 点身份及差异规划 → 动画接管 → 帧刻度与导出 → Demo 和组合验收。RenderScheduler 是业务失效调度器，Animator 是表现帧调度器，两者不能互相递归触发完整更新。

## Risks / Trade-offs

- [目录移动掩盖行为变化] → 先独立完成路径迁移，再分阶段引入类。
- [配置合并、轴与图例行为回退] → 保留公共集成测试，新增边界案例。
- [同步事件递归] → 保留布局微任务合并，验证回调内更新与销毁。
- [Demo 依赖进入库] → 检查打包文件、声明引用和干净消费者安装运行。
- [视图增量更新改变绘制顺序或留下旧节点] → 浏览器视觉回归和多次更新测试。
- [过度抽象] → 类必须对应明确状态、资源或替换点，不建立空泛框架。

## Migration Plan

按 tasks.md 顺序推进，每阶段保持可构建、可测试。目录迁移、模型提取、视图迁移和 Vue Demo 分开提交，保留旧公共接口适配层直到兼容验证完成。出现回归时回退对应阶段提交，不覆盖用户工作区；完成全部验收后再发布和归档。本次不执行发布。
