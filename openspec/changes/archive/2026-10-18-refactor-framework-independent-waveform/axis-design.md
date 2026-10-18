# 坐标轴刻度设计

参考 waveform-analysis 同一固定版本的 src/components/core/xAxisTicks.ts、yAxisTicks.ts、niceScale.ts、yAxisPadding.ts，以及 tests/components/core/xAxisTicks.test.ts。X 算法使用 1/2/3/5/10，Y 使用 1/2/5/10，不能因注释统称 nice 就误合并成同一个规则。该项目的时间单位、振幅限制、多轨道与缩放交互不整体迁入；本库 X 数值仍使用调用方单位。

## 配置与优先级

AxisOptions 新增 tickStrategy: 'legacy' | 'nice'，默认 legacy。XAxisOptions 保留 tickStep，新增 minInterval?: number（默认 0，只约束 nice 自动步长）；现有 tickCount 默认 X=8、Y=6 保持不变，不迁入来源默认 5。nice 中 tickCount 是目标密度而非精确结果数，legacy Y 仍是含端点的精确数量。minInterval 的非有限或负值回退 0，非法策略回退 legacy，非法 tickCount 使用对应轴默认；有效范围在生成前限幅以避免巨大分配。

X 优先级：现有 xDomainStrategy 决定最终域 → 显式有效 tickStep 沿用原有对齐/宽度疏化算法 → 未设 tickStep 且 nice 时执行 nice X → 否则 legacy。nice 刻度本身不调用 niceDomain、不改变域。minInterval 是最小步长，不承诺所有步长都为它的整数倍；显式 tickStep 优先时忽略 minInterval。

Y 优先级：按当前可见序列及轴绑定求数据域 → 处理显式 min/max → 选择刻度策略。nice 仅可向外扩张未固定的边界；有限且不相等的显式单侧或双侧边界不被 nice 改写；相等 min/max 作为退化域例外，继续使用现有 ±1 扩展，因此不得宣称所有显式边界绝对不变。单侧固定边界需按它对应的端点保留，反向域计算后映射回原方向。固定边界不在主刻度网格上时不强塞进规则刻度列表，以免制造不等间隔网格；legacy 仍保留两个端点刻度。反向域保留方向，计算时使用升序范围再恢复输出方向。相同端点沿用现有组件域扩展规则，不照搬来源非零常量 ±20% 的规则。

## 数值规则

- X：rough=(max-min)/round(tickCount)，count 至少 1；fraction 相对十次幂的阈值为 <1.5→1、<2.5→2、<4→3、<7→5、否则 10。step=max(niceStep,minInterval)。使用整数索引 ceil(min/step)…floor(max/step)，包含边界上恰好对齐的刻度。
- Y：rough=(max-min)/(floor(tickCount)-1)，count 至少 2；fraction 阈值为 <1.5→1、<3→2、<7→5、否则 10。非固定域向外对齐到步长倍数，然后按边界裁剪刻度。
- 示例：nice X 域 [0,14]、tickCount=5 → [0,3,6,9,12]，域仍为 [0,14]。nice Y 自动域 [1.3,8.7]、tickCount=5 → 域 [0,10]、刻度 [0,2,4,6,8,10]；若 min/max 固定，域仍为 [1.3,8.7]、刻度 [2,4,6,8]。
- nice X/Y 候选刻度统一至多 100 个，沿用本项目紧凑图表需求，不照搬来源 X 的 3000 上限。超限时扩大间隔重新生成覆盖全域的刻度，不能截取前 100 个。若浮点跨度溢出或无法形成可区分刻度，主刻度返回空列表，边界候选只保留有限去重端点，不执行无界循环；边界候选不是等间隔主刻度，不用于间距推断。
- 精度修正基于步长量级与安全整数索引；限制 toFixed 参数范围，处理 -0、重复刻度、极小量级和大偏移小跨度。返回 TickLayout 的 domain、majorValues、interval、boundaryValues，interval 始终是有限正数，表示相邻规则刻度距离的绝对值，不随域方向变负；无可靠规则间隔时为空。

## 标签、网格和零线

范围、刻度值、格式化、标签可见性分开处理。保留 tickFormat 字符串/函数优先、showEndValues/hideEndTicks 和现有科学计数页眉约定；不直接迁入来源的时间单位换算、顶端单位布局或五位有效数字，以避免无关格式变化。端点标签独立于主刻度，可去重但不参与网格生成。

AxisView/GridView 共用 TickLayout.majorValues，不各自重新算刻度。nice 模式零线用排序后的域上下界判断是否跨零，并用 TickLayout.interval 的正值计算到两侧边界的距离；反向比例尺只影响位置，不改变跨零判定。legacy 保留原有零线行为。零线边界抑制使用 TickLayout.interval；无有效间隔时不做基于间隔的抑制。标签碰撞只隐藏文字，不改变网格数值：端点优先、普通标签按屏幕顺序保留，X 按标签横向包围盒保留最小 4px 间隔，Y 按纵向包围盒保留最小 4px 间隔；Y 标签可位于绘图区左右的预留区域，但不可超出 SVG 视口；最终可见 X 文字不越出绘图区，极窄时允许隐藏无法容纳的端点。只在 nice 策略启用该新布局规则，legacy 保持现有行为。

## 动画协同

每次业务更新先计算目标 TickLayout。表现帧从当前帧域得到同一份帧 TickLayout：只生成域内刻度，不再次执行 nice 扩域（即使 Y 启用 nice），目标业务域只在提交时求解一次。轴、网格、零线共享；标签按目标布局预算绘制，避免每帧 DOM 测量；目标留白容纳不下中间标签时隐藏该标签，不更改本帧域或放大容器。纯文本格式化/估宽允许逐帧计算，用户 formatter 应为无副作用函数。科学计数指数使用目标域以避免跨阈值闪烁。步长级别变化时允许刻度集合离散切换，不给刻度列表做按索引对应的数值插值；终帧直接使用业务提交时保存的目标 TickLayout（包含原始求步长依据），不得再用扩张后的目标域重新求 nice 步长；最终必须与关闭动画的目标刻度完全一致。动画帧不发新的业务 layoutChange。

## 数值内核的接口边界

TickStrategy 分为目标域解析和给定域内刻度两项职责。内部 TickLayout 保存生成 majorValues 的 interval 以及目标域，避免渲染器重复推导。nice 目标阶段允许 Y 自动扩域，帧阶段禁止扩域；两者不能复用一个带隐式扩域副作用的方法。精度异常时 majorValues 返回空数组、interval 为 undefined，boundaryValues 仅包含可表示且有限去重的端点；不将这些边界伪装成规则刻度。nice 自动范围若扩张会产生非有限端点，则保留扩张前有限域并使用上述降级。

目标域和帧域接口都不得修改传入数组。空态、单点域扩展在模型/域解析层完成，刻度模块不自行重复扩展。格式化相同的文字不代表数值相同，不能以标签字符串去重刻度。nice 模式下若多个候选标签格式化后完全相同，在不删除刻度及网格的前提下只保留一个文字：端点优先，其余按屏幕顺序取第一个。保留现有 formatter 契约，不擅自增加精度或改写自定义输出；legacy 仍保持现状。
