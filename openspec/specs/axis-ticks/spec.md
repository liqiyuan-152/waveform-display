# axis-ticks Specification

## Purpose
为波形组件提供可选择的清晰刻度生成规则，参考波形分析项目的 X/Y 数值刻度算法，同时保留旧图表行为、固定范围和用户格式化配置，确保坐标轴、网格与动画过程使用一致且数值安全的刻度。

## Requirements

### Requirement: 可选策略与兼容优先级

坐标轴 SHALL 提供 tickStrategy 的 legacy/nice 选择，默认 legacy；现有 tickCount 默认及 tickFormat SHALL 保留。有效 X tickStep SHALL 优先于自动 nice 策略，xDomainStrategy SHALL 独立决定 X 范围。

#### Scenario: 未启用新策略
- **WHEN** 原有调用方不设置 tickStrategy
- **THEN** X/Y 刻度及显式 tickStep 的行为与原有兼容测试一致

### Requirement: X 轴 nice 刻度

nice X SHALL 使用 1/2/3/5/10 十次幂步长并遵守 minInterval，不因生成刻度扩大范围。端点标签 SHALL 独立于主刻度。

#### Scenario: 三倍步长
- **WHEN** X 域为 [0,14]，tickCount 为 5 且启用 nice，无显式 tickStep
- **THEN** 主刻度为 [0,3,6,9,12]，域保持 [0,14]

### Requirement: Y 轴 nice 与固定边界

nice Y SHALL 使用 1/2/5/10 十次幂步长，只向外扩张未固定边界；有限且不相等的显式 min/max SHALL 保留；相等端点作为退化域例外 SHALL 沿用现有 ±1 扩展。tickCount SHALL 作为期望密度，非固定结果数量。

#### Scenario: 自动域取整
- **WHEN** 自动数据域为 [1.3,8.7] 且 nice tickCount 为 5
- **THEN** 解析域为 [0,10]，主刻度为 [0,2,4,6,8,10]

#### Scenario: 固定边界
- **WHEN** 同样数据显式设置 min=1.3、max=8.7
- **THEN** 保留固定域，主刻度为 [2,4,6,8]，不将非对齐端点加入等间隔网格

### Requirement: 精度与数量安全

nice 主刻度 SHALL 为有限、去重、无负零且按域方向排列的值，最多 100 个。超限 SHALL 通过增大间隔重新生成，不截断一端；异常数量、浮点溢出或精度不足 SHALL 安全降级，不抛精度异常或产生无界分配。

#### Scenario: 极端输入
- **WHEN** 使用极小量级、大偏移小跨度或超大 tickCount
- **THEN** 生成有界且有效的主刻度，或主刻度为空并单独返回有限去重边界候选，不修改输入范围

### Requirement: 轴、网格、标签和动画一致

轴与网格 SHALL 共用主刻度值，规则间隔 SHALL 为正的距离值；nice 模式下反向域的零线 SHALL 按数值上下界判断跨零及边界距离。标签碰撞 SHALL 不改变网格数据。nice 标签 SHALL 优先保留可容纳的端点并避免重叠；X 文字不越出绘图区水平边界，Y 文字可占用左右留白但不得超出 SVG 视口。动画帧 SHALL 共享帧刻度结果，最终与静态目标一致。

#### Scenario: 窄容器
- **WHEN** nice 模式标签无法全部容纳
- **THEN** 隐藏冲突文字而非任意删除网格，增宽后重新计算标签可见性

#### Scenario: 动画中范围变化
- **WHEN** 数据更新引发轴范围及步长级别变化
- **THEN** 轴和网格共用每帧刻度，终态与关闭动画的同一目标配置一致

#### Scenario: nice 动画帧不再次扩域
- **WHEN** 两个业务 nice 域之间的动画到达中间帧
- **THEN** 只在插值域内生成刻度，不重新 nice 扩域，比例尺保持连续

#### Scenario: 相等固定端点
- **WHEN** min 与 max 均显式为 2
- **THEN** 沿用现有退化域处理得到 [1,3]，不因固定边界要求导致零跨度

#### Scenario: 终帧复用目标刻度
- **WHEN** nice 扩域后的范围再次求步长可能产生不同结果
- **THEN** 动画终帧直接使用提交时的目标刻度及间隔，与静态目标一致

#### Scenario: 不可表示的扩域结果
- **WHEN** nice 扩域产生非有限端点或无法生成有效间隔
- **THEN** 保留扩域前有限范围，主刻度为空，只提供有限去重边界候选，不生成异常网格

#### Scenario: 数值不同但标签相同
- **WHEN** nice 模式下自定义格式化使多个主刻度显示相同文字
- **THEN** 保留不同数值及其网格，仅按端点优先、屏幕顺序隐藏重复文字，不改写用户格式化输出
