# demo-configuration Specification

## Purpose
规定独立演示应用在配置编辑、数据切换和页面生命周期中的可见行为，使重构后的演示仍能验证组件功能，并确保演示所需的界面依赖及页面样式不会成为图表消费者的使用条件。

## Requirements

### Requirement: 配置能力保持

Demo SHALL 只提交用户编辑的配置 patch，不将包含默认值的完整 getOptions 快照回传。Demo SHALL 保留当前配置面板提供的字段、输入校验、样式继承、单多值轴切换和空状态预览能力，支持原始与科学计数示例数据切换。

#### Scenario: 值轴模式往返
- **WHEN** 用户编辑多值轴配置，切换为单值轴后再恢复多值轴
- **THEN** 按现有规则恢复轴配置和序列绑定，预览与表单状态一致

#### Scenario: 无效输入
- **WHEN** 用户输入当前字段规则判定无效的值
- **THEN** 界面给出可感知反馈且不向图表提交无效值

### Requirement: 宿主生命周期与独立构建

Demo SHALL 能独立开发和构建，并兼容根路径及 /waveform-display/ 部署；预览卸载后 SHALL 释放图表资源，重新挂载 SHALL 不重复订阅。表单控件 SHALL 保持键盘可操作和可访问名称。

#### Scenario: 卸载后重新挂载
- **WHEN** 预览被卸载并重新挂载
- **THEN** 仅存在一个有效图表实例和一套事件订阅，配置变更不产生重复更新

#### Scenario: 子路径部署
- **WHEN** Demo 使用 /waveform-display/ 作为部署基础路径构建
- **THEN** 页面、脚本、样式和示例数据均能在该路径加载

### Requirement: 动画配置与演示

Demo SHALL 提供动画开关、入场方向、时长、延迟、错峰及更新动画配置，并通过公共控制接口提供暂停、恢复和结束操作；这些控件 SHALL 不改变组件默认关闭动画的契约。

#### Scenario: 动画交互演示
- **WHEN** 用户在满足动画前置条件的 Demo 场景中开启动画、切换示例数据并暂停后恢复
- **THEN** 预览按配置过渡且继续剩余进度，数据和配置编辑仍使用组件公共 API

### Requirement: 原始配置与实例所有权

Demo SHALL 使用自己维护的原始选项草稿编辑 yAxes 替换数组，不把 getOptions 中未显式设置的默认属性写回。预览 SHALL 只销毁自己创建的图表；自有容器已被占用时 SHALL 报告错误而不复用或销毁宿主实例。

#### Scenario: 编辑轴颜色不改变自动标题
- **WHEN** 原始轴未设置 title.visible，用户仅编辑该轴颜色
- **THEN** 提交的 yAxes 保留 title.visible 未设置，自动标题规则不被默认 false 固化

#### Scenario: 挂载到被占用容器
- **WHEN** Demo 预览目标中已有宿主创建的有效实例
- **THEN** 预览报告冲突且不接管，卸载时原实例仍可用
