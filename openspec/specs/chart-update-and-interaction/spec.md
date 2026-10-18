# chart-update-and-interaction Specification

## Purpose
统一图表的数据配置更新与交互通知，使程序调用、鼠标和键盘获得一致的选择行为，并为宿主提供可取消的事件订阅与一次性提交数据配置的能力，避免观察到不完整的中间状态。

## Requirements

### Requirement: 原子更新与尺寸刷新

组件 SHALL 提供 update({ data?, options? })，联合提交只执行一次业务更新且使用双方最新值；未提供字段 SHALL 保持当前值，空提交或字段均为 undefined 的提交 SHALL 不触发更新；data: [] SHALL 清空数据。原子更新仅保证成功提交没有中间数据/配置组合，不要求运行时绘制错误的完整事务回滚。resize SHALL 同步使用最新容器尺寸。

#### Scenario: 同时提交数据和配置
- **WHEN** 一次调用提交新数据与轴配置
- **THEN** 只执行一次业务提交；关闭动画时同步呈现目标，开启动画时允许后续表现帧，导出的 SVG 始终使用新数据与新配置，通知不包含中间业务组合

#### Scenario: 容器尺寸变化
- **WHEN** 调用方改变容器尺寸后调用 resize
- **THEN** 图表按现有固定尺寸与响应式规则重新测量和布局

### Requirement: 可取消的类型化事件

组件 SHALL 支持 layoutChange 和 seriesVisibilityChange 的多个订阅者，on SHALL 返回取消订阅函数；既有 onLayoutChange SHALL 保持兼容。布局通知 SHALL 保留微任务合并与相同自然留白不重复通知的语义，更换既有 onLayoutChange 回调时 SHALL 保留强制通知例外。seriesVisibilityChange SHALL 在目标状态和首帧成功绘制后同步通知，不等待动画完成并包含 seriesKey、可选 seriesId、当前规范化序列索引 seriesIndex 和 visible。订阅 SHALL 不补发历史事件，取消函数 SHALL 幂等。

#### Scenario: 单个订阅者取消
- **WHEN** 两个订阅者监听事件，其中一个取消订阅后发生相关变化
- **THEN** 只有仍有效的订阅者收到通知

#### Scenario: 通知前销毁
- **WHEN** 布局通知已排队但实例在微任务执行前销毁
- **THEN** 不再向订阅者或旧回调发送布局通知

#### Scenario: 相同画面更换布局回调
- **WHEN** 数据和布局相同但 updateOptions 提交一个新的 onLayoutChange 函数
- **THEN** 按既有强制通知规则调用新回调，不因动画目标相同而跳过

### Requirement: 一致的序列交互

组件 SHALL 支持 dispatchAction 的 toggleSeries 动作；程序、鼠标和键盘切换同一序列 SHALL 产生相同的可见状态、范围计算及可见性通知。程序动作的 seriesId SHALL 唯一标识目标；无效动作、不存在或不唯一的 ID SHALL 抛错且不修改状态。

#### Scenario: 程序切换与点击一致
- **WHEN** 调用方通过程序切换具有唯一 ID 的序列
- **THEN** 图表、图例及可见性事件与点击该图例的结果一致

#### Scenario: 无效目标
- **WHEN** 程序动作指定不存在或重复的序列 ID
- **THEN** 调用抛出明确错误，现有图表和选择状态不变

### Requirement: 事件异常与重入边界

组件 SHALL 在监听器异常时继续通知其他有效订阅者并异步报告异常，不回滚已提交状态；监听器销毁实例后 SHALL 停止剩余派发。同步可见性监听器中再次派发动作 SHALL 明确拒绝重入。

#### Scenario: 缺少 ID 的序列切换
- **WHEN** 用户点击没有 ID 的有效序列图例
- **THEN** 事件包含该实例内的 seriesKey、当前 seriesIndex 和最终 visible，seriesId 可省略

#### Scenario: 监听器异常
- **WHEN** 一个监听器抛出异常且实例仍存活
- **THEN** 后续有效监听器仍收到事件，图表保持已提交状态并异步报告异常

#### Scenario: 监听器销毁实例
- **WHEN** 事件处理器销毁实例
- **THEN** 本轮剩余监听器和后续排队通知不再执行

#### Scenario: 同步动作重入
- **WHEN** 可见性事件处理器直接再次 dispatchAction
- **THEN** 重入调用抛出明确错误，不递归切换序列

### Requirement: 明确尺寸解析与显示宽度

组件 SHALL 接受有限正数、正数字符串、正px长度和(0,100]%百分比作为width/height；空字符串、0、负数、非有限数、超过100%的百分比及其他单位 SHALL 被拒绝，且拒绝发生在提交配置或联合数据之前。省略或以undefined清除尺寸覆盖 SHALL 恢复默认值。百分比 SHALL 分别基于宿主容器clientWidth/clientHeight；尚不可测量的零尺寸容器分别使用800/320作为测量回退。SVG viewBox SHALL 使用解析后的坐标尺寸，固定宽度 SHALL 同时设置SVG显示宽度；默认100%仍随容器显示，宿主CSS可等比缩小以适配空间。

responsive.enabled为true且width为百分比时，组件 SHALL 使用width/aspectRatio并按现有高度上下限策略计算高度，优先于height；固定数字或px宽度 SHALL 使用解析后的height。百分比尺寸 SHALL 在容器变化时重新测量，即使宽高比响应式关闭也保持有效；销毁或改为不依赖容器的固定尺寸时 SHALL 释放不再需要的观察器。

#### Scenario: 百分比宽高的独立参照
- **WHEN** 800×600宿主配置width=50%、height=25%，且宽高比响应式关闭
- **THEN** viewBox为0 0 400 150，显示宽度为宿主的50%，容器变化后更新两个方向

#### Scenario: 固定px尺寸与响应式优先级
- **WHEN** 宿主空间足够且配置width=640px、height=240px
- **THEN** viewBox为0 0 640 240，SVG显示尺寸为640×240，不被Demo CSS强制拉满；打开宽高比响应式仍保留固定尺寸

#### Scenario: 非法尺寸原子拒绝
- **WHEN** 联合更新包含新数据以及width=0、height=-1、超过100%的百分比或不支持的尺寸字符串
- **THEN** 调用抛错，原配置、数据和SVG均不变，Demo编辑草稿显示错误且能在有效输入后恢复
