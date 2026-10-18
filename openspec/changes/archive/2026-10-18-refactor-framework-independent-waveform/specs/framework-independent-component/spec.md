## Purpose

规定图表组件在独立宿主中的可用性、发布依赖边界和生命周期行为，使调用方无需安装 Demo 的界面框架即可使用图表，并在多实例和卸载场景下获得稳定且兼容的行为。

## ADDED Requirements

### Requirement: 独立使用与发布边界

组件 SHALL 在不安装 Vue、antd 或 ant-design-vue 的消费者项目中完成类型检查、绘制和 SVG 导出；发布入口及声明 SHALL 不引用 Demo 或其样式。

#### Scenario: 干净消费者使用组件
- **WHEN** 消费者只安装打包后的组件及其声明运行时依赖
- **THEN** 消费者能够导入公共 API、绘制图表和导出 SVG，无缺失 UI 框架模块错误

### Requirement: 现有公共行为兼容

组件 SHALL 保留现有构造方式、updateData、updateOptions、render、toSVGString、downloadSVG 和 destroy；配置合并、轴范围、图例选择及布局行为 SHALL 保持现有测试定义的语义。

#### Scenario: 更新后立即导出
- **WHEN** 调用方更新数据或配置并立即导出 SVG
- **THEN** 导出结果反映最新提交内容，无需等待下一动画帧

#### Scenario: 图例和坐标轴兼容
- **WHEN** 调用方隐藏序列并更新其余序列数据
- **THEN** 可匹配序列的选择状态保留，坐标轴范围按可见数据计算，每侧最多显示一条值轴

### Requirement: 实例与资源隔离

组件 SHALL 隔离不同实例的节点、图例状态和事件；重复销毁 SHALL 安全且释放所有资源。销毁后更新、render、resize、动作及新订阅 SHALL 抛出明确错误；SVG 字符串导出 SHALL 返回空串，下载 SHALL 不产生副作用。通过构造器在同一容器重复创建活实例 SHALL 抛出错误而不破坏原实例；init 的重复调用遵循下述实例复用要求。实例 SHALL 只管理自身节点，不移除宿主原有内容；SVG 导出 SHALL 只序列化实例拥有的根 SVG。

#### Scenario: 销毁其中一个实例
- **WHEN** 两个不同容器中的实例共存且其中一个被连续销毁两次
- **THEN** 另一个实例仍正常工作，被销毁实例不再接收观察器回调或发出待处理事件；销毁过程仅允许通知已冻结动画批次的 onAbort，不能复活实例

#### Scenario: 销毁后调用
- **WHEN** 调用方对已销毁实例更新数据或导出 SVG
- **THEN** 更新抛出明确错误，SVG 字符串为空，容器中不重新生成图表

#### Scenario: 宿主节点保留
- **WHEN** 容器原有其他子节点并创建、更新及销毁图表
- **THEN** 仅图表拥有的节点被更新或删除，其他子节点保留

#### Scenario: 宿主原有 SVG
- **WHEN** 容器在图表创建前已包含另一个 SVG，随后导出并销毁图表
- **THEN** 导出内容仅包含该图表，宿主原有 SVG 保持不变

### Requirement: 根据目标元素创建和查找图表

组件 SHALL 支持 CSS 选择器字符串或 HTMLElement 创建图表，包括 `.class-name` 和 `#id`；选择器匹配多个元素时 SHALL 沿用首个匹配语义。实例 SHALL 绑定解析后的元素，不随元素类名变化而重新绑定。宿主 SHALL 能传入模板 ref 的实际 DOM 值而无需组件依赖宿主框架。

#### Scenario: 类名创建
- **WHEN** 调用方传入匹配容器的 `.waveform` 选择器
- **THEN** 返回绑定首个匹配容器的实例，其更新、导出与销毁操作只作用于该图表

#### Scenario: 模板 ref 创建
- **WHEN** 宿主挂载完成后传入模板 ref 对应的 HTMLElement
- **THEN** 图表在该元素中创建，组件不要求安装宿主 UI 框架

#### Scenario: 目标无效
- **WHEN** 创建时传入未匹配的选择器、非法选择器、空值或非 HTMLElement
- **THEN** 抛出明确错误，不创建节点、实例记录或遗留观察器

### Requirement: 元素与实例映射

Waveform.init SHALL 在无实例时创建图表、已有活实例时返回原实例且不覆盖数据或配置。Waveform.getInstanceByDom SHALL 根据相同目标规则返回实例，无匹配元素或无实例时返回 undefined；非法选择器或无效类型 SHALL 抛错。destroy SHALL 解除映射并允许在同一元素重新初始化。

#### Scenario: 重复初始化
- **WHEN** 对同一元素重复调用 init 并传入不同配置
- **THEN** 返回同一个实例，原数据与配置保持不变，不重复注册资源

#### Scenario: 查找并操作
- **WHEN** 使用选择器或同一 HTMLElement 查找已创建的实例
- **THEN** 返回原实例，调用方能够更新数据、调整尺寸或销毁图表

#### Scenario: 销毁并重新创建
- **WHEN** 原实例销毁后再次查询并初始化同一元素
- **THEN** 查询返回 undefined，初始化返回一个新的有效实例

### Requirement: 读取生效配置

组件 SHALL 提供 getOptions 返回包含默认值的公共配置快照；修改该快照 SHALL 不改变实例状态，函数配置 SHALL 保留功能。销毁后的读取 SHALL 抛出明确错误。

#### Scenario: Demo 读取配置
- **WHEN** 宿主创建或更新图表后调用 getOptions
- **THEN** 能读取生效配置填充表单，无需访问内部解析模块

#### Scenario: 快照隔离
- **WHEN** 调用方修改快照中的嵌套对象或数组
- **THEN** 图表配置不变，直到显式提交更新

#### Scenario: 读取快照不固化默认配置
- **WHEN** Demo 读取生效配置展示表单，并修改一个字段
- **THEN** Demo 仅提交该字段的 patch，不回传整个解析快照；原先未显式设置的轴、标题和默认值仍按原规则解析
