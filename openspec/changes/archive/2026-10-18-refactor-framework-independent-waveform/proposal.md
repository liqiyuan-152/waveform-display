## Why

当前 0.1.17 已无 Vue 或 Ant Design 依赖，但 Waveform 同时负责配置、状态、布局和绘制，原生配置面板也集中在单个大文件。需要以类为主体重新划分组件职责，并将 Demo 独立为 Vue 应用，为后续交互扩展、多实例和可维护性建立边界。

## What Changes

- 图表库保持纯 TypeScript + D3/SVG；Vue 3 和 Ant Design Vue（ant-design-vue）仅用于 Demo。
- 将 src/demo 移到根目录 demo，分离库与 Demo 构建、类型检查和样式。
- 使用门面、模型/视图分离、策略、观察者、命令、模板方法和视图注册机制重构；借鉴 ECharts，不引入 ECharts 运行时。
- 保留现有构造、updateData、updateOptions、render、SVG 导出及 destroy 接口和默认同步更新行为。
- 支持 CSS 类名选择器、ID 选择器及 DOM 元素创建图表，提供 init 和 getInstanceByDom；Vue 模板 ref 通过其 DOM 值接入，不引入 Vue 类型。
- 增加 getOptions 公开配置快照，供 Demo 展示配置，避免深导入内部解析模块。
- **BREAKING**：直接重复构造同容器实例、销毁后更新等调用改为明确报错；初始化和销毁仅处理自身节点，不再清空宿主其他内容。保留正常使用路径的接口兼容，数据提交将建立独立快照，外部原地修改需显式再次提交；发布时记录这些行为变化。
- 增加原子 update、resize、类型化事件订阅和 dispatchAction；强化销毁及多实例隔离。
- 整理测试目录和架构文档，补充产物依赖检查及浏览器视觉回归。

- 参考同级 waveform-analysis 的框架无关动画系统，移植数值引擎及适用预设，重写本组件的表现层适配；首期提供入场、错峰、数据过渡和 X/Y 轴范围动画及生命周期控制，默认关闭以保持现有同步行为。

- 本项目不提供分页或标注功能，对应动画不实现，也不预留专用 API、配置或扩展槽。

- 数据更新动画参考 ECharts 的 add/update/remove 差异匹配；支持点增删、滑动窗口、序列增删重排及 X/Y 域协同过渡，新增可选点 ID 并对歧义匹配明确降级。

- 参考 waveform-analysis 的 X/Y 刻度算法，新增可选 nice 刻度策略；保持 legacy 默认与显式 tickStep 行为，统一轴、网格和动画刻度来源。

## Capabilities

### New Capabilities

- `framework-independent-component`: 组件发布边界、兼容接口、多实例和资源生命周期。
- `chart-update-and-interaction`: 原子更新、事件订阅、交互动作和同步导出契约。
- `demo-configuration`: 独立 Demo 的配置、数据切换和宿主生命周期行为。

- `chart-animation`: 可选表现层动画、控制、连续更新接管、可访问性降级与同步最终态导出。

- `axis-ticks`: X/Y 刻度生成、固定边界、精度安全、标签布局与动画一致性。

### Modified Capabilities

无。仓库此前未建立 OpenSpec 规范；上述规范同时记录本次需要保持的基线和新增行为。

## Impact

涉及 src、tests、demo、Vite/TypeScript 配置、package.json、锁文件、CI 和部署路径。保持一个 npm 包，Demo 依赖作为开发依赖；公共 JS、声明文件和样式不得依赖 Vue 或 Ant Design Vue。允许内部大规模重构，保留正常调用路径的公共 API；生命周期防护与节点所有权的行为变化见上方 BREAKING 条目。本变更目前仅为规划，任务完成后才可归档。
