# 验收映射

下表记录最终实际证据。测试路径省略前缀时，Waveform.* 位于 tests/integration/，Vue/草稿测试位于 tests/demo/。证据文件位于 docs/evidence/refactor-framework-independent-waveform/。后附分阶段记录是历史快照，其中“待完成”已由最终映射替代。

## axis-ticks

规范：[spec.md](specs/axis-ticks/spec.md)。计划验证：tests/layout/ 数值断言及渲染/动画集成；碰撞场景用浏览器验证。关联任务：3.6—3.9、4.7、7.11、7.21。

| Requirement | Scenario | 状态／实际证据 |
| --- | --- | --- |
| 可选策略与兼容优先级 | 未启用新策略 | 通过：Waveform.ticks.test.ts；final-charts.png 与 baseline-charts.png SHA256 相同 |
| X 轴 nice 刻度 | 三倍步长 | 通过：tests/layout/ticks.test.ts: nice X；Waveform.ticks.test.ts |
| Y 轴 nice 与固定边界 | 自动域取整 | 通过：tests/layout/ticks.test.ts: nice Y |
| Y 轴 nice 与固定边界 | 固定边界 | 通过：tests/layout/ticks.test.ts；Waveform.ticks.test.ts；demo-scenarios.json |
| 精度与数量安全 | 极端输入 | 通过：tests/layout/ticks.test.ts 数量、极小量级、大偏移、溢出 |
| 轴、网格、标签和动画一致 | 窄容器 | 通过：Waveform.ticks.test.ts；static-browser-y.json；历史 X 浏览器包围盒记录 |
| 轴、网格、标签和动画一致 | 动画中范围变化 | 通过：Waveform.animation.test.ts: one numerical domain；animation-browser.json |
| 轴、网格、标签和动画一致 | nice 动画帧不再次扩域 | 通过：Waveform.animation.test.ts: without re-expanding nice frames |
| 轴、网格、标签和动画一致 | 相等固定端点 | 通过：tests/layout/domain.test.ts；Waveform.ticks.test.ts |
| 轴、网格、标签和动画一致 | 终帧复用目标刻度 | 通过：Waveform.animation.test.ts: exact target tick layout / one numerical domain |
| 轴、网格、标签和动画一致 | 不可表示的扩域结果 | 通过：tests/layout/ticks.test.ts: overflow safety |
| 轴、网格、标签和动画一致 | 数值不同但标签相同 | 通过：Waveform.ticks.test.ts；static-browser-y.json |

## chart-animation

规范：[spec.md](specs/chart-animation/spec.md)。计划验证：tests/animation/ 确定性时钟及集成帧断言；视觉场景另加浏览器截图。关联任务：7.2—7.21。

| Requirement | Scenario | 状态／实际证据 |
| --- | --- | --- |
| 可选动画与入场 | 默认关闭 | 通过：tests/animation/config.test.ts；全部旧静态集成测试；final-charts.png |
| 可选动画与入场 | 错峰入场 | 通过：Waveform.animation.test.ts: staggered entries；Animation.test.ts；animation-middle.png |
| 可选动画与入场 | 零时长 | 通过：Animation.test.ts: ignores delay；Waveform.animation.test.ts: skips zero duration |
| 更新过渡与连续接管 | 新数据到来 | 通过：Waveform.animation.test.ts: lets an abort callback / crossfades ambiguous points；diff.test.ts |
| 更新过渡与连续接管 | 坐标轴一致 | 通过：Waveform.animation.test.ts: uses one numerical domain；animation-browser.json |
| 控制与回调 | 手动暂停与恢复 | 通过：Animator.test.ts；Waveform.animation.test.ts: honors manual and hidden；vue-browser.json |
| 控制与回调 | 回调中销毁 | 通过：Waveform.animation.test.ts: drops the second completion；destroy callbacks |
| 降级与资源隔离 | 动画中关闭或降级 | 通过：Waveform.animation.test.ts: finishes categories independently / reduced-motion；animation-environment.json |
| 降级与资源隔离 | 实例销毁 | 通过：Waveform.animation.test.ts: foreign-window RAF / destroy callbacks；animation-resources.json |
| 同步最终态导出 | 动画期间导出 | 通过：Waveform.animation.test.ts: exports the target / initiates downloads；animation-browser.json |
| 数据项差异匹配 | 增删与滑动窗口 | 通过：tests/animation/diff.test.ts: sliding windows；Waveform.animation.test.ts: changed point counts |
| 数据项差异匹配 | 点 ID 对应 X 变化 | 通过：tests/animation/diff.test.ts: preserves point IDs / crossing matches |
| 数据项差异匹配 | 匹配歧义 | 通过：tests/animation/diff.test.ts；Waveform.animation.test.ts: crossfades ambiguous points |
| 序列增删与不变更新 | 重排并新增序列 | 通过：tests/animation/diff.test.ts: series reordering；normalize.test.ts: sorts series；Waveform.animation.test.ts: staggered entries |
| 序列增删与不变更新 | 删除期间恢复 | 通过：Waveform.animation.test.ts: restores a leaving series |
| 序列增删与不变更新 | 重复相同目标 | 通过：Waveform.animation.test.ts: does not restart identical values / skips identical options |
| 数据与坐标域同步变化 | 自动轴范围变化 | 通过：Waveform.animation.test.ts: shared moving domains / one numerical domain；animation-middle.png |
| 更新快照与清空优先级 | 外部数据修改 | 通过：Waveform.animation.test.ts: snapshots caller points；WaveformModel.test.ts |
| 更新快照与清空优先级 | 清空全部数据 | 通过：Waveform.animation.test.ts: clears empty data immediately |
| 更新快照与清空优先级 | 动画配置更新 | 通过：Waveform.animation.test.ts: preserves active timing；tests/animation/config.test.ts |
| 过渡的安全终态 | 反向域更新 | 通过：Waveform.animation.test.ts: reversed domains；tests/layout/ticks.test.ts |
| 过渡的安全终态 | 大旧数据到小新数据 | 通过：Waveform.animation.test.ts: retained buffer budget |
| 共享坐标域与局部效果协调 | 新序列与域变化同时发生 | 通过：Waveform.animation.test.ts: staggered entries / finishes categories independently |
| 共享坐标域与局部效果协调 | 标签导致绘图区改变 | 通过：Waveform.animation.test.ts: skips layout changes；demo-scenarios.json；visual-and-performance.txt |
| 共享坐标域与局部效果协调 | 更新类别关闭而入场开启 | 通过：Waveform.animation.test.ts: can enter new series with updates disabled |
| 终止通知的版本归属 | 中断回调再次更新 | 通过：Waveform.animation.test.ts: third target / newer target |
| 终止通知的版本归属 | 导出后销毁 | 通过：Waveform.animation.test.ts: suppresses deferred export callbacks |
| 配置更新与数据更新优先级 | 新数据同时关闭动画 | 通过：Waveform.animation.test.ts: aborts replaced data even when disabled |
| 配置更新与数据更新优先级 | 动画中切换刻度策略 | 通过：Waveform.animation.test.ts: finishes styles and tick changes |
| 配置更新与数据更新优先级 | 部分序列身份不可靠 | 通过：Waveform.animation.test.ts: ambiguous series identities；tests/animation/diff.test.ts |
| 配置更新与数据更新优先级 | 局部修改动画配置 | 通过：tests/animation/config.test.ts: merges fields and clears；Waveform.animation.test.ts: active timing |
| 动画计算异常恢复 | 自定义缓动失败 | 通过：Animator.test.ts: releases frames；Waveform.animation.test.ts: recovers from easing failure |

## chart-update-and-interaction

规范：[spec.md](specs/chart-update-and-interaction/spec.md)。计划验证：tests/core/、tests/interaction/ 与 tests/integration/。关联任务：5.1—5.6。

| Requirement | Scenario | 状态／实际证据 |
| --- | --- | --- |
| 原子更新与尺寸刷新 | 同时提交数据和配置 | 通过：tests/integration/Waveform.events.test.ts、Waveform.update.test.ts；final-check.log |
| 原子更新与尺寸刷新 | 容器尺寸变化 | 通过：tests/integration/Waveform.events.test.ts、Waveform.update.test.ts；final-check.log |
| 可取消的类型化事件 | 单个订阅者取消 | 通过：tests/integration/Waveform.events.test.ts、Waveform.update.test.ts；final-check.log |
| 可取消的类型化事件 | 通知前销毁 | 通过：tests/integration/Waveform.events.test.ts、Waveform.update.test.ts；final-check.log |
| 可取消的类型化事件 | 相同画面更换布局回调 | 通过：tests/integration/Waveform.events.test.ts、Waveform.update.test.ts；final-check.log |
| 一致的序列交互 | 程序切换与点击一致 | 通过：tests/integration/Waveform.events.test.ts、Waveform.update.test.ts；final-check.log |
| 一致的序列交互 | 无效目标 | 通过：tests/integration/Waveform.events.test.ts、Waveform.update.test.ts；final-check.log |
| 事件异常与重入边界 | 缺少 ID 的序列切换 | 通过：tests/integration/Waveform.events.test.ts、Waveform.update.test.ts；final-check.log |
| 事件异常与重入边界 | 监听器异常 | 通过：tests/integration/Waveform.events.test.ts、Waveform.update.test.ts；final-check.log |
| 事件异常与重入边界 | 监听器销毁实例 | 通过：tests/integration/Waveform.events.test.ts、Waveform.update.test.ts；final-check.log |
| 事件异常与重入边界 | 同步动作重入 | 通过：tests/integration/Waveform.events.test.ts、Waveform.update.test.ts；final-check.log |

## demo-configuration

规范：[spec.md](specs/demo-configuration/spec.md)。计划验证：tests/demo/ 与真实浏览器操作。关联任务：6.2—6.5、7.14—7.16。

| Requirement | Scenario | 状态／实际证据 |
| --- | --- | --- |
| 配置能力保持 | 值轴模式往返 | 通过：VueConfigPanel.test.ts；OptionsDraft.test.ts；vue-browser.json |
| 配置能力保持 | 无效输入 | 通过：VueConfigPanel.test.ts: invalid CSS colors / zero tick steps；fields.test.ts（全部旧字段与 Vue 输入） |
| 宿主生命周期与独立构建 | 卸载后重新挂载 | 通过：useWaveform.test.ts；双预览隔离与重新挂载 |
| 宿主生命周期与独立构建 | 子路径部署 | 通过：final-demo-root.log、final-demo-subpath.log；deployment-browser.json |
| 动画配置与演示 | 动画交互演示 | 通过：vue-browser.json；demo-scenarios.json；final-demo.png |
| 原始配置与实例所有权 | 编辑轴颜色不改变自动标题 | 通过：VueConfigPanel.test.ts: raw axis defaults；OptionsDraft.test.ts |
| 原始配置与实例所有权 | 挂载到被占用容器 | 通过：useWaveform.test.ts: rejects an occupied element |

## framework-independent-component

规范：[spec.md](specs/framework-independent-component/spec.md)。计划验证：tests/integration/ 与打包消费者。关联任务：3.5、4.1—4.6、8.1。

| Requirement | Scenario | 状态／实际证据 |
| --- | --- | --- |
| 独立使用与发布边界 | 干净消费者使用组件 | 通过：pack.log；package-scan.json；consumer-validation.txt；deployment-browser.json |
| 现有公共行为兼容 | 更新后立即导出 | 通过：Waveform.compatibility.test.ts；Waveform.update.test.ts；Waveform.animation.test.ts |
| 现有公共行为兼容 | 图例和坐标轴兼容 | 通过：全部 Waveform.axes/legend/header/ticks 测试；final-charts.png |
| 实例与资源隔离 | 销毁其中一个实例 | 通过：Waveform.lifecycle.test.ts；useWaveform.test.ts；animation-resources.json |
| 实例与资源隔离 | 销毁后调用 | 通过：Waveform.lifecycle.test.ts；Waveform.animation.test.ts |
| 实例与资源隔离 | 宿主节点保留 | 通过：Waveform.lifecycle.test.ts；consumer-validation.txt |
| 实例与资源隔离 | 宿主原有 SVG | 通过：Waveform.lifecycle.test.ts |
| 根据目标元素创建和查找图表 | 类名创建 | 通过：Waveform.lifecycle.test.ts |
| 根据目标元素创建和查找图表 | 模板 ref 创建 | 通过：useWaveform.test.ts |
| 根据目标元素创建和查找图表 | 目标无效 | 通过：Waveform.lifecycle.test.ts |
| 元素与实例映射 | 重复初始化 | 通过：Waveform.lifecycle.test.ts |
| 元素与实例映射 | 查找并操作 | 通过：Waveform.lifecycle.test.ts；vue-browser.json |
| 元素与实例映射 | 销毁并重新创建 | 通过：Waveform.lifecycle.test.ts；useWaveform.test.ts |
| 读取生效配置 | Demo 读取配置 | 通过：Waveform.options.test.ts；VueConfigPanel.test.ts |
| 读取生效配置 | 快照隔离 | 通过：Waveform.options.test.ts；WaveformModel.test.ts |
| 读取生效配置 | 读取快照不固化默认配置 | 通过：Waveform.options.test.ts；OptionsDraft.test.ts；VueConfigPanel.test.ts |

## 已执行基线

- Node v20.20.2、pnpm 9.15.0：pnpm check 通过，17 文件 / 193 测试；pnpm build:demo 通过。原始输出：baseline-check.log、baseline-demo.log。
- 新增 tests/integration/Waveform.compatibility.test.ts：1 测试通过，验证合并、轴数组替换、留白清除、图例状态和同步导出。现有布局与图例测试提供进一步基线。
- tests/fixtures/browser/baseline.html 在 Chrome 155、1440×1000、DPR 1 下绘制五类图表，截图 baseline-charts.png；原 Demo 截图 baseline-demo.png。这些仅证明重构前行为，不证明新增功能。

## 目录迁移验证

- pnpm check：Node 20.20.2，18 文件 / 194 测试，库构建通过，见 directory-check.log。
- DEMO_BASE_PATH=/ pnpm build:demo 与 DEMO_BASE_PATH=/waveform-display/ pnpm build:demo 均通过；日志 directory-demo-root.log、directory-demo-subpath.log，生成入口副本 demo-root.html、demo-subpath.html 证明资源前缀。
- Dockerfile 均 COPY 整个上下文并调用保留命令，输出目录仍是 dist-demo，无硬编码 src/demo 路径；CI 增加独立 Demo 构建并锁定安装。镜像实建待完成。

- Docker 29.9.0 / Colima 专用 waveform-validation 实例：docker build --build-arg DEMO_BASE_PATH=/ -t waveform-display-demo:validation . 成功（88c8ae4aca58），见 directory-docker.log。未推送镜像。
- Chrome 子路径加载：1 个图表、21 个当前可见表单控件；directory-demo.png 与 baseline-demo.png SHA-256 相同（c09fbdca92af46cd56f3878745ee36fac1b4827b15eaf0777b544611f2125ca7）。

## 模型、布局与刻度实施证据

- 3.1：config/merge、OptionManager 已接入。options-check.log：19 文件 / 196 测试及类型、库构建通过。
- 3.2：WaveformModel、SeriesModel 持有独立数据快照和稳定选择键；model-check.log：20 文件 / 199 测试及类型、库构建通过。测试覆盖 ID 重排、重复/缺失 ID、删除选择与同引用重新提交。
- 3.3：data/nice 范围策略迁移；domain-check.log：20 文件 / 200 测试及类型、库构建通过；tests/layout/domain.test.ts 覆盖显式、空域、退化、反向范围。
- 3.4：LayoutEngine、AxisLayout、注入测量接口；layout-check.log 完整 200 测试通过；新增 LayoutEngine.test.ts 两项通过（无 DOM 运算、标题推导）。layout-demo.png 与 baseline-demo.png SHA-256 完全相同。
- 3.5 部分：公共 getOptions 已实现并通过 Waveform.options.test.ts；Demo 草稿与 patch 迁移仍待完成，因此不勾选整项。
- 3.6—3.8：Legacy/NiceX/NiceY 策略、TickLayout 已接入统一布局和渲染；ticks-check.log：23 文件 / 210 测试及类型、库构建通过。随后 Waveform.ticks.test.ts 四项通过，验证共享刻度、显式 tickStep 优先、固定/退化/反向域与非法配置回退。
- 3.9 部分：ticks.test.ts 七项含超大 count、极小量级、大偏移、负零、跨度溢出断言；还需加强扩域溢出、不可区分刻度和分布边界测试后勾选。
- 4.7 部分：轴/网格/零线共用 TickLayout；nice 标签碰撞与重复文字处理尚未实现。

以上新增单测通过不替代尚未执行的动画、生命周期、打包消费者和浏览器组合验收。

## 持久视图、生命周期和更新事件

- 最新 static-check.log：27 文件、231 测试，Node20 下 pnpm check（双侧 TS、完整测试、库构建）通过；static-demo.log 为 Demo 构建通过。
- Waveform.lifecycle.test.ts 六项覆盖目标解析、首个匹配、同源 iframe、失败 observe 清理、宿主 SVG 保留、重复 init/new、销毁解绑及销毁后调用。Waveform.events.test.ts 六项覆盖订阅顺序/取消/异常/销毁、强制布局通知、API/鼠标/键盘一致与同步动作重入。
- Waveform.update.test.ts 三项覆盖联合提交一次绘制、空更新、即时导出、重复变化后的根/plot/axis/path 节点复用和节点计数、尺寸优先级与零尺寸回退。
- static-demo.png、static-charts.png 分别与 baseline-demo.png、baseline-charts.png SHA-256 相同；图表原层级及绘制顺序保留。
- ticks.test.ts 增加扩域溢出与不可区分索引降级；Waveform.ticks.test.ts 增加重复标签隐藏、窄→宽恢复及网格数量不变。nice 浏览器实际文字包围盒检查：宽度180时7个可见X标签、800时15个，最终无4px间隙冲突，网格15个。4.7仍需更完整边界与Y标签浏览器验收后勾选。
- 运行时绘制失败将清理本实例视图，可在下次有效更新重建；不会清除宿主节点。
- 性能诊断发现通用节点协调增加更新开销（初测20次更新约35—64ms，对比基线20—34ms）。已按规范加入相同规范化目标跳过无效绘制的优化；最终还需相同目标/不同目标双方复测，不把当前结果声明为无回退。

## Vue 基础与 nice 浏览器补验

- vue-foundation-check.log：29文件 / 237测试、tsc + vue-tsc、库构建通过。Vue3.5.44、ant-design-vue4.2.6、plugin-vue5.2.4、vue-tsc3.3.13 仅devDependencies。
- OptionsDraft.test.ts 两项验证原始轴草稿、单字段patch、不固化默认标题、多轴模式往返与单轴编辑保留。
- useWaveform.test.ts 三项验证挂载后创建、卸载/重挂、占用容器拒绝接管、空ref保护。WaveformPreview.vue已通过SFC类型检查；App和Vue表单尚未迁移，所以6.2、3.5仍未完成。
- static-browser-y.json 为实际Chrome包围盒检查：固定nice Y边界文字包含1.3/8.7，全部位于SVG视口内，无4px冲突；formatter相同仅显示一个文字，反向域零线存在。结合X浏览器检查及集成窄→宽恢复，4.7完成。
- 同源多实例销毁补测通过，互不影响；生命周期回归现为7项。

## 最终验收

- Node20.20.2 / pnpm9.15.0：final-check.log 为最终完整门禁（400 测试、36 文件，TypeScript/SFC、库声明及 ES/UMD、Demo 构建）。
- Vue 表单保留全部旧字段；fields.test.ts 102 项覆盖字段清单、边界、解析兼容与每种字段实际 Vue 提交。旧原生面板仅留作 tests/fixtures 的行为基线，不进入 Demo 或包。
- 动画实现完全独立；reference-audit.txt 固定来源版本与授权边界。无分页/标注代码、API 或配置。
- animation-browser.json、animation-environment.json、animation-resources.json、demo-scenarios.json 记录确定性中间帧、终态、reduced-motion、iframe、实例 RAF 数量、节点恢复、固定留白过渡与自动留白/极端位移降级。
- final-charts.png 与 baseline-charts.png 逐字节相同；visual-and-performance.txt 记录截图哈希与不同目标更新负载，优化后中位15.6ms，对照19.4ms，节点数相同。
- pack.log、package-scan.json、consumer-validation.txt 为实际 tarball 的 ESM、UMD、CommonJS（Node20.20.2）、严格 NodeNext/Bundler 声明闭包与依赖扫描。
- final-docker.log 为最终静态镜像实建；deployment-browser.json 记录根路径、子路径及 UMD 实际浏览器加载。
- 文档：docs/architecture.md、directory-structure.md、refactor-plan.md、migration.md；README 与 AGENTS 目录/命令已更新。版本保持0.1.17，未发布，发布前按项目策略选择版本。
