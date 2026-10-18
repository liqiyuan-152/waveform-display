## ADDED Requirements

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
