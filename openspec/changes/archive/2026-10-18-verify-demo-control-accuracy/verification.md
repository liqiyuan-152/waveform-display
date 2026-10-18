# 执行与验证记录

日期：2026-10-18。变更：`verify-demo-control-accuracy`。功能验收与最终门禁完成；归档结果见文末。以下历次“当前/待办”均为历史时点，最终结论见 final-audit.md。

## 证据入口

- `evidence/initial/`：迁入的首轮 177 项清单、报告和缺陷截图，属于修复前历史记录，不代表当前实现状态。
- `evidence/browser-results.json`：修复批次真实浏览器操作后的 SVG 属性结果。
- `evidence/inheritance-fixed.jpg`：返回继承后的橙色曲线及 4.5 线宽，与历史缺陷截图对照。
- `evidence/zero-width-fixed.jpg`：零线宽修复后的界面。
- `evidence/layout-verified.jpg`：900×480 内部坐标下手动留白结果。
- `evidence/regression-before.log`：修复前回归暴露失败；其中点样式参考数据随后改为真正删除属性，避免参考对象重复同一缺陷。
- `evidence/regression-after.log`：修复后 24 个针对性普通测试通过。
- `evidence/regression-node20.log`：Node 20 下扩充布局场景后 26 个普通测试通过。
- `evidence/pnpm-check-node20.log`：修复批次的 Node 20 阶段全量检查，包含最终补充的边界断言。

## 规范场景与任务映射

| 规范场景 | 任务 | 自动化证据 | 浏览器证据及边界 |
| --- | --- | --- | --- |
| 值轴模式往返 | 5 中值轴条目、9.3 | `tests/demo/App.controls.test.ts` 左右轴独立编辑/单多轴恢复场景 | 执行批次17补充真实浏览器多→单→多及右轴选择；证据见 `browser-batch17-axis-mode.json` |
| 无效输入 | 3.4—3.6、3.8—3.11，其他字段相关条目 | App 测试断言非法比例、高度限制、留白、颜色、格式和刻度步长不改变 SVG | 比例 0 得到 aria-invalid=true，SVG 高度仍为 300；其他字段边界继续按清单签收 |
| 单曲线恢复全局继承 | 2.1、2.2、2.4、2.5；8.1—8.11 | `tests/integration/Waveform.styleInheritance.test.ts` 的五种线条字段、六种点字段、零值与 false 覆盖；App 测试实际勾选颜色/线宽继承 | C-01 从全局 #ff8800/4.5 继承后，再全局更新为 #0088ff/6；其余曲线仍为原色/1.5。全部曲线和所有面板字段的完整组合仍待验收 |
| 零线宽与图例一致 | 2.3—2.5 | App 及样式集成测试验证曲线、图例、同步 SVG 导出均为 0 | C-02 实测 curve=0、legend=0 |
| 从属控件满足显示条件 | 3.12、4、6、7 相关条目 | App 测试覆盖边框显隐、线点、跨零零线、文字、图例、空状态恢复 | 首轮抽查见历史报告，完整候选项和边界仍按 tasks.md 执行 |

177 项原始任务在 tasks.md 第 3—9 组逐条展开；补充判定要求见 acceptance.md。表中的自动化覆盖不等于每条任务要求的所有边界和浏览器组合均已完成；没有完整证据的条目保持未勾选。

## 修复批次完成的实现

1. C-01：`src/renderer/series.ts` 对每个单曲线线条/数据点字段使用空值回退，全局继承不再被显式 undefined 覆盖；显式 0 与 false 保留。
2. C-02：`src/renderer/legend.ts` 的线宽使用空值回退，单曲线 0 不再被逻辑或替换为全局线宽。
3. 两个原先的 `it.fails` 已转换为普通测试；新增 12 个样式集成场景及 2 个布局 App 场景。

## 修复批次完成的布局验证

- 响应式：关闭时高度 480，开启后使用宽高比；jsdom 宽度 800、比例 2 时高度 400。真实浏览器容器宽度 1192、比例 2 时高度 596。
- 高度限制：最小高度 500 可抬高目标；最大高度 300 可截断目标，边界 1 也正确；比例最小允许值 0.1 可接受，0 和空输入被拒绝。
- 四向留白：手动上40/右50/下60/左70 时，绘图区 transform=translate(70,40)，900×480 中宽780、高380。各项 0 被接受，负数和清空被拒绝。恢复原留白及自动模式后绘图区宽度恢复。
- 边框显示：关闭移除边框和背景；重新开启保留之前边框样式。

对应任务 3.3—3.12 的证据以 App 自动化为主，浏览器补查响应式比例/上限/非法值和四向几何。固定尺寸的屏幕物理像素行为、全部颜色/样式候选、其他轴/文字/动画等条目仍保持待办。

## 阶段命令结果（非最终验收）

- 运行时：Node v20.20.2，pnpm 9.15.0；使用已安装的 Node 20 路径运行，无新增依赖。
- `pnpm check`：41 个文件、434 个普通测试通过；类型检查、库构建、Demo 构建通过。新增文件没有预期失败用例。
- Demo 构建保留已有的大文件体积提示，不影响构建成功。
- `openspec validate verify-demo-control-accuracy --strict`：通过，日志见 `evidence/openspec-validation.log`。
- OpenSpec 工件齐备仅代表计划可执行；177 项尚未全部验收，变更继续开放。

## 文档审核后的状态修正

此前未明确响应式冲突配置、数值 width 分支、极端留白和窄宽往返等组合。任务 3.3—3.11 因补齐要求重新标为待完成，既有证据保留，不再把局部覆盖视为整项完成。10.1—10.3 改回待完成：434 项通过属于阶段结果，最终门禁需在所有任务结束后重跑。首轮审核时共189项，9项完成、180项待完成；这是当时的进度快照，后续修正见下节。数量降低来自审核纠正范围，不代表已有测试失效。

新增“合法清空与恢复自动值”规范场景：已有 App 测试验证 X min 清空和编号清空；Y offset、tickStep、编号 fontSize 的清空和浏览器验证仍由任务5、7对应项跟踪，未宣称完成。历史 evidence/apply-status.json 是审核前进度快照，当前状态以 tasks.md 和最新 CLI 输出为准。

## 第二轮文档审核

- 静态比对字段清单：当前字段定义含141项（含左右值轴展开），全部路径已存在于原始177项目录，无重复路径。该检查只证明字段路径覆盖，不证明导航、复合入口和交互组合覆盖。
- 增补1.4版本证据、2.6独立几何预期、9.26导航、9.27色板Alpha，共4项任务；这些任务未执行。
- 2.2重新标为待完成：当前零值测试只检查输入对象保留size=0，没有断言符号实际面积为0。visible和其他继承的既有证据仍保留；不再将测试名称当成完整断言覆盖。
- 补明零时长忽略延迟/错峰、不自动重播、场景version共享及追加回绕语义。任务9.21跟踪追加标签的契约待明确项。
- 新增的规范“合法清空”场景现已加入下表映射；其余尚未验证字段保持待办。

| 规范场景 | 对应任务 | 已有证据与限制 |
| --- | --- | --- |
| 合法清空与恢复自动值 | 5.6/5.7（X范围）、5.11（步长）、5.48/5.68（左右标题offset）、7.12/7.15（编号/字号） | App测试直接检查X min和编号清空；其他字段及浏览器往返需补，不以getOptions默认值代替实际绘制 |

当前共193项，8项完成、185项待完成；执行状态仍为进行中。第二轮未执行产品测试，434项通过仍是修复批次的历史结果，不是文档增补任务已通过。最新结构校验与CLI进度见evidence/openspec-validation-reviewed-2.log及apply-status-reviewed-2.json。

## 下一批执行

以下为审核时的执行顺序，实际完成情况见执行批次1。后续从3.3—3.11响应式组合与极端留白继续，再验收边框剩余样式、全部线点候选值、X/左右值轴、网格零线、文字图例、全部曲线继承和动画时间过程。每批记录证据后再勾选；全部完成前不归档。

## 执行批次1：尺寸、独立几何、导航与颜色

本批为实际执行任务，区别于前两轮仅文档审核。用户已明确选择：保留旧点持续追加；尺寸采用有限正数、正px和(0,100]%并拒绝非法值。相关契约已加入demo-configuration及chart-update-and-interaction的delta规范，README同步说明兼容行为变化。批次1记录时高度上下限冲突尚未明确；后续用户确认相等合法、冲突拒绝并保留原图，已在执行批次4验证并签收3.3—3.6。

| 任务 | 独立预期与实际 | 证据/结果 |
| --- | --- | --- |
| 1.4 | 每批保存Git提交、差异、完整源/测试/数据SHA256、Node/pnpm和命令；浏览器记录viewport、主题、稳定数据身份、用例编号及验证边界 | capture-manifest.py及execution-batch-1-complete-manifest.json；browser-batch1-final.json；完成。浏览器版本未由工具暴露，明确记录不可得；本批不签收动画时间 |
| 2.2、2.6 | 240×160、四边20、显式[0,2]域得到200×120绘图区；三点目标(0,120)/(100,0)/(200,60)。直线/三种阶梯逐个顶点匹配；四种符号按4×size²、圆面积/多边形公式验算，坐标舍入容差0.00051、面积容差0.03。继承大小4→0→2.5→4、显式0且全局改6、false隐藏、同伴不变、导出均验证 | Waveform.controlGeometry.test.ts的8项及样式继承12项；geometry-node20.log与本批全量日志。size=0不再只断言输入，完成 |
| 3.1、3.2 | 固定640px/240px及数字640/240的viewBox与屏幕均640×240；50%/25%参照896×622宿主得到448×155.5；小数0.5/1.25合法。零/负值/非法单位/非有限/空输入均报错且保留上一有效SVG，有效输入消除错误。390×844窄屏显示360×135，恢复宽屏回640×240；百分比容器观察及responsive优先级另由集成测试覆盖 | Waveform.dimensions.test.ts、fields.test.ts；浏览器B1F-DIM-*，屏幕容差0.02；dimensions-final.jpg、dimensions-narrow.jpg；完成 |
| 9.26 | 6配置页签、所有子分类、3动画页签鼠标遍历；方向键/Home/End与焦点/选择一致；子分类真实键盘左右往返、分类/曲线选择记忆、不意外改图；第4条曲线→单曲线数据集后选择正确收敛 | B1F-NAV-*、SeriesForm.selection.test.ts；selection-before/after-node20.log及修复前后截图；完成 |
| 9.27 | 8预设的文本、色块、SVG一致；Alpha鼠标拖到0.25，独立stroke-opacity=0.5，组合0.125；键盘0→1、关闭重开保持蓝色，Alpha=0.5且opacity=0.5得到组合0.25。继承入口禁用，手柄有名称；rgba/hsla/4位及8位hex透明输入恢复保留RGB | B1F-COLOR-*、B1F-ALPHA-*；ColorControl.test.ts、fields.test.ts；alpha-zero-before/after-node20.log、alpha-final.jpg；完成。透明度乘积按SVG属性语义验证，不宣称像素颜色测量 |
| 9.21（部分） | 生成器从当前数据每曲线追加1点，保留旧ID/X/Y/样式/绑定，31次不回绕；空点集及从其他场景追加均覆盖 | animationScenarios.test.ts的2项通过；Demo按钮交互、轴/网格、中间帧与终态仍待补，任务继续未勾选 |

本批实际修复：C-03尺寸字符串被忽略且固定宽度被CSS拉满；C-04追加场景重算/回绕；C-05数据变少后选择框残留旧名称；C-06Alpha到0再恢复变黑；C-07滑块名称只设在容器而非实际手柄。C-05与C-06均先用普通回归复现失败，再修复通过。几何测试初次将零半径圆预期为圆弧，核对后改为等价的M0,0退化路径，不把这一预期修正记为产品缺陷。

源版本与最终检查：execution-batch-1-complete-manifest.json记录Node v20.20.2、pnpm 9.15.0和完整指纹；execution-batch-1-complete-check-node20.log确认45文件、455项测试通过，类型检查、库与Demo构建通过，仍有既有Demo大文件体积提示。中间失败日志保留：execution-batch-1-check-node20.log包含原先接受auto的旧断言与新契约冲突；execution-batch-1-final-check-node20.log记录新增Vue测试的类型声明问题，随后改用有类型的父组件驱动props并通过全量检查。

browser-batch1.json保留探索与修复前记录，其中早期导航selected类名读取存在渲染时机歧义，不作签收。最终36组浏览器断言见browser-batch1-final.json，全部通过；使用实际checked状态复核导航，包含窄宽往返，结束后恢复宽高100%。源指纹可复核，不追认最早无版本记录的历史结果。

本批新增完成1.4、2.2、2.6、3.1、3.2、9.26、9.27，共7项。当前15/193完成、178项待完成。最终门禁10.1—10.4保持未勾选：本批pnpm check通过不代表全部控件验收完成。OpenSpec严格校验及最新CLI进度分别记录在evidence/openspec-validation-execution-batch1.log、evidence/apply-status-execution-batch1.json。


## 第三轮文档审核（当前状态）

核对了尺寸delta、追加生成器、OptionsDraft及响应式观察器实现。本轮只改文档：纠正百分比响应式条件，补充非法输入后续patch隔离、Demo/API边界区分、空数组/空预览追加待明确项和观察器释放组合。详细问题见review.md第三轮；未运行产品测试，未新增已完成项。前文“当前8/193”为第二轮时点的历史快照，当前仍为15/193完成、178项待完成。阶段455项测试通过也不代表新增组合已验收。

结构校验与进度快照见evidence/openspec-validation-reviewed-3.log和evidence/apply-status-reviewed-3.json；这些只证明文档可解析及当前任务计数，不作为功能通过证据。


## 执行批次2：边框颜色、宽度、样式和圆角

| 任务 | 独立预期与实际 | 证据/结果 |
| --- | --- | --- |
| 3.13 背景颜色 | 真实颜色输入支持六位十六进制、rgba 半透明和 transparent；非法值/清空显示错误且 SVG 背景与前一有效值不变，恢复初值清除错误 | 浏览器 `B2-background-*`，`browser-batch2-frame.json`；通过 |
| 3.14 边框颜色 | 同上，stroke 属性精确匹配输入；非法值不改变图框或曲线 | 浏览器 `B2-border-*`；通过 |
| 3.15 边框宽度 | 真实步进框输入 3.5、0、0.25、1000；负数/清空拒绝；ArrowUp 由2步进到2.1；stroke-width精确匹配 | 浏览器 `B2-stroke-width-*`、`B2-width-keyboard`；组件回归15项通过 |
| 3.16 边框样式 | 通过弹出菜单实际点击 solid/dashed/dotted，再用 combobox键盘展开、ArrowUp、Enter选择；solid无 dash/cap，dashed为`6 4`，dotted为`1 3`且round | 浏览器 `B2-style-*`、`B2-style-keyboard-corrected`；frame-controls-node20.log；通过 |
| 3.17 圆角 | 输入3.5、0、0.25、1000，负数/清空拒绝；背景和边框rx同步；ArrowUp由0步进到1 | 浏览器 `B2-rx-*`、`B2-radius-keyboard`；通过 |

本批所有边框编辑前后曲线路径保持一致，证明边框控制没有误改波形数据。截图见 `evidence/frame-controls-batch2.jpg`。本批测试追加到 `tests/demo/App.controls.test.ts`，涵盖完整颜色、数值边界、非法恢复和候选样式。


## 用户确认补充：响应式高度上下限

用户确认：`responsive.minHeight === responsive.maxHeight` 合法；`minHeight > maxHeight` 必须拒绝并保留上一有效波形。已在 `resolveOptions` 和 `OptionsDraft.set` 实现原子校验；组件集成与草稿测试各通过，证据见 `Waveform.dimensions.test.ts`、`OptionsDraft.test.ts` 及 `responsive-limits-node20.log`。这不改变Demo最小高度输入下限1与公共API允许0的区分。

## 执行批次4：响应式布局与四向留白

本批完成了浏览器逐项操作并保存 `evidence/browser-batch3-responsive.json`、`evidence/browser-batch3-padding.json` 及对应截图。演示页实际切换百分比宽高和响应式开关，设置宽高比2、最小高度100、最大高度300；随后输入最小高度400而最大高度300，界面显示“最小高度不能大于最大高度”，波形保持上一有效结果。恢复后关闭自动留白，输入上/右/下/左留白40/50/60/70，绘图区平移为 `translate(70,40)`，尺寸按四边扣除。

结合 `Waveform.dimensions.test.ts` 的百分比、数字、px、非法尺寸、上下限相等/冲突、ResizeObserver 释放和固定尺寸恢复断言，以及 `App.controls.test.ts` 的非法输入与自动留白恢复断言，3.3—3.11 的浏览器、SVG结果、边界和生命周期证据已齐全，可以签收。

本批同时完成数据点控件的浏览器复核，证据为 `evidence/browser-batch4-points.json` 和 `evidence/point-controls-batch4.jpg`。实际打开数据点分类并切换显示，输入大小0、颜色 `#112233`、边框色 `#445566`、边框宽度2.5；自动化几何预期验证四种形状的绝对路径/面积、零大小退化和非法输入原图保留，浏览器入口验证显示开关与步进/颜色字段绑定。结合既有真实下拉候选项操作，4.7—4.12 满足候选、边界、非法值、清空、恢复及 SVG 对象范围要求，可以签收。

X 轴首批策略证据保存为 `evidence/browser-batch5-x-axis.json` 和 `evidence/x-axis-controls-batch5.jpg`。浏览器实际展开并点击“数据范围”和“仅终点”，修改策略刻度数为5，切换包含手动范围、显示坐标轴、隐藏端点刻度和显示端点值；重载后恢复初始场景。与现有 X 轴集成/App 测试的 SVG 端点、可见性和格式断言合并，5.1、5.2、5.4、5.5、5.12、5.13 已完成；刻度数量和其余数值字段仍需补齐边界后再签收。

网格控件批次证据为 `evidence/browser-batch6-grid.json` 和 `evidence/grid-controls-batch6.jpg`。浏览器实际从虚线切换到实线，输入公共颜色 `#123456`、宽度2.5、X/Y网格宽度4/5，并从左轴切换到右轴；同一批操作关闭并恢复了总网格与 X 网格。现有 App/SVG 测试已核对对应 stroke 属性、显隐和轴ID。6.1、6.2、6.5、6.7、6.9 已完成；颜色和各宽度的非法/清空边界仍待补测。

本批回归日志 `evidence/grid-axis-node20.log` 中，App 控件、X 轴、网格和刻度集成测试全部通过；零线的跨零阈值、样式和参考轴自动化覆盖保持有效，但真实浏览器零线仍需在跨零数据场景下补拍证据。

零线跨零浏览器批次已补齐：`evidence/browser-batch7-zero-line.json`、`evidence/zero-line-controls-batch7.jpg`。在值轴 `[-10, 10]` 下，零线实际显示；浏览器输入颜色 `#123456`、透明度0.25、宽度2.5、虚线 `8 2`，并从左轴切换右轴，随后关闭显隐开关。零线真实跨零显示和参考轴入口已验证；6.10、6.15 可以签收，颜色/透明度/宽度/虚线的非法和清空边界仍待补测。

`zero-line-boundaries-node20.log` 新增了颜色、透明度和宽度的非法/清空回归：错误提示出现，SVG 和上一有效值保持不变。结合浏览器有效值证据，6.11、6.12、6.13 已签收；6.14 的虚线是自由文本，空值语义仍需明确，因此继续待办。

文字控件浏览器批次已保存为 `evidence/browser-batch9-text.json` 和 `evidence/text-controls-batch9.jpg`。实际设置标题“波形审计”、右对齐、颜色/字号/字重，并设置图框编号42、颜色、透明度0.3、字号40、serif字体和700字重；截图确认标题与编号进入波形。现有 `App.controls.test.ts` 已核对对应 SVG 属性及编号清空行为，但标题/炮号/字体等文本边界和图例四角组合尚未完整验证，因此本批暂不勾选7组任务。

随后扩展 `text-controls-node20.log`：标题三种对齐均核对 `text-anchor`，标题和炮号覆盖中文/Unicode、首尾空白及长文本，长文本按既有适配规则缩小字号而不越界。结合浏览器入口证据，7.1（标题显隐）、7.3（标题对齐）、7.7（炮号显隐）和7.12（图框编号文本及清空）已完成；颜色、字号、字重等其余字段仍需补齐边界后签收。

图例批次证据为 `evidence/browser-batch11-legend.json`、`evidence/legend-controls-batch11.jpg`。浏览器实际遍历左上、右上、左下、右下四个位置，横向/纵向两个方向，并输入颜色、字号18、间距12、线长36、最大宽度70；截图确认右下纵向图例可见。`text-legend-node20.log` 还验证颜色、字号、间距、线长和最大宽度的非法/清空输入保持上一有效 SVG。7.18—7.25 已完成。

空状态批次证据为 `evidence/browser-batch12-empty.json`、`evidence/empty-state-controls-batch12-visible.jpg`。浏览器进入空数据预览，设置提示文字“暂无波形 Ω”、颜色 `#123456`、字号20，显示开关关闭/恢复后退出预览，原始坐标轴和曲线恢复。`empty-state-node20.log` 补充颜色和字号非法/清空输入的原图保留断言。7.26—7.29 已完成。

曲线级批次证据为 `evidence/browser-batch13-series.json`、`evidence/series-controls-batch13.jpg`。浏览器展开曲线选择并选择第二条曲线 `SX2_7_02`，关闭颜色/线宽的全局继承，设置颜色 `#123456`、线宽4.5；截图显示仅该曲线变为粗线深色，其他曲线保持原样。结合现有继承回归中全局更新、同伴隔离和恢复继承断言，8.1、8.2 已完成；其它曲线点样式和连线字段继续待补浏览器组合。

曲线连线批次补充为 `evidence/browser-batch14-series-line.json`、`evidence/series-line-controls-batch14.jpg`：第二条曲线关闭连线类型、线型和透明度继承，实际切换阶梯起点/中点/终点、实线/虚线/点划线候选，最终为阶梯终点、虚线、透明度0.4。曲线点批次为 `evidence/browser-batch15-series-point.json`、`evidence/series-point-controls-batch15.jpg`：关闭六个点字段继承开关，设置显示、方形、大小6、颜色 `#112233`、边框色 `#445566`、边框宽度2.5，截图显示仅所选曲线点样式变化。结合 `Waveform.styleInheritance.test.ts` 的绝对继承/零值/false隔离断言，8.3—8.11 已完成。

导航与数据批次证据为 `evidence/browser-batch16-navigation-data.json`、`evidence/navigation-data-batch16.jpg`。浏览器依次切换深色、浅色、跟随系统主题，再切换小数值测试和原始数据；小数值场景出现科学计数法轴标签，恢复原始数据后四条曲线及选择列表恢复。9.1、9.2 已完成；当时值轴模式、动画和数据场景时序仍继续待办，值轴模式已在执行批次17补验并签收，动画和其余数据场景仍待办。

## 执行批次17：值轴模式与选择

浏览器在“坐标轴→值轴”页签实际执行多值轴→单值轴→多值轴往返。单值轴状态只渲染1个值轴，多值轴恢复为2个值轴；恢复后打开值轴选择器并选择“右轴”，选择器状态保持，4条曲线仍在且波形正常。证据为 `evidence/browser-batch17-axis-mode.json` 和 `evidence/value-axis-navigation-batch17.jpg`。

结合 `tests/demo/App.controls.test.ts` 中左右轴独立编辑、单/多值轴恢复及选择状态测试，9.3 的模式往返和状态恢复验收完成。9.4 和 9.5 的完整补验见执行批次18。

## 执行批次18：值轴与曲线选择隔离

真实 Demo 在原始数据、多值轴状态下分别选择左轴和右轴，修改轴线颜色为 `#abcdef` 和 `#fedcba`；随后打开曲线页签选择 `SX2_7_02`，确认表单颜色由第一条曲线的值切换为第二条曲线的 `#dc2626`，再修改为 `#123abc`。四条曲线始终保留，右轴选择器和曲线选择器均显示对应目标。

证据：`evidence/browser-batch18-axis-series-selection.json`、`evidence/value-axis-selection-batch18.png`、`evidence/series-selection-batch18.png`。

自动化补强位于 `tests/demo/App.controls.test.ts`：左右轴范围分别设为 `[-1,1]` 与 `[-100,100]`，通过每条绑定曲线首点 Y 坐标验证只重算目标轴曲线，另一轴保持不变；曲线选择测试验证第二条曲线的颜色/线宽表单值、非继承状态、编辑后的同伴颜色和线宽隔离。结合 `Waveform.axes.test.ts` 的轴绑定与实际映射断言，本批完成 9.4、9.5。

本批定向回归：6 个文件、109 个测试通过；覆盖 Demo 控件、曲线/轴配置面板、轴集成和动画生命周期。完整 `pnpm check` 仍保留到所有验收任务完成后的最终门禁。

## 执行批次19：曲线坐标轴绑定往返

真实 Demo 在多值轴、原始数据下选择 `SX2_7_03_CH1`，将其坐标轴从左轴切换到右轴，再切回左轴。切换后右侧轴标签和刻度范围随绑定目标变化，选择器显示“右轴”；恢复后选择器回到“左轴”，轴标签恢复，曲线数量保持不变。证据为 `evidence/browser-batch19-series-axis-binding.json`、`evidence/series-axis-binding-batch19.png` 和 `evidence/series-axis-binding-batch19-restored.png`。

自动化测试 `tests/demo/App.controls.test.ts` 设置左右轴为明显不同的 `[-1,1]` 与 `[-100,100]` 范围，切换第一条曲线绑定并比较其首点 Y 坐标；绑定右轴时坐标改变，切回左轴后恢复。结合 `tests/integration/Waveform.axes.test.ts` 的轴实际映射与参考轴断言，9.6 完成。

## 执行批次20：空预览与全部曲线隐藏

真实 Demo 逐个取消四条图例复选框，确认四个复选框均为关闭、曲线路径消失但图框和坐标轴仍保留；随后重新勾选四条曲线，曲线和刻度恢复。截图与状态记录见 `evidence/browser-batch20-empty-vs-hidden.json` 和 `evidence/all-series-hidden-batch20.png`。

结合既有空预览证据 `evidence/browser-batch12-empty.json`，自动化测试 `tests/demo/App.controls.test.ts` 分别通过 `toggleSeries` 隐藏/恢复四条曲线，以及打开/退出空预览：隐藏曲线时没有空状态文字，空预览时没有曲线路径并显示 `No waveform data`，退出后四条曲线恢复。9.7 完成。

## 执行批次21：全局动画开关与数据场景

真实 Demo 重载后分别保持“启用动画”打开和关闭，进入“数据场景”点击“追加点”；两种状态都更新了四条曲线，关闭状态允许静态收敛。截图和步骤记录见 `evidence/browser-batch21-animation-switch.json`、`evidence/animation-scenario-enabled-batch21.png`、`evidence/animation-scenario-disabled-batch21.png`。

`tests/demo/App.controls.test.ts` 验证开关对后续场景更新生效；`tests/integration/Waveform.animation.test.ts` 覆盖动画阈值降级、类别开关组合、reduced-motion、零时长和静态收敛。9.8 完成。动画的具体方向、时长、延迟、错峰、暂停/恢复/结束仍由 9.9—9.20 分项验收。

批次22补齐动画控件入口：真实 Demo 选择入场方向“从中心展开”、设置时长600ms、延迟100ms、错峰50ms，并切换更新缓动到“匀速”、更新时长0；证据见 `evidence/browser-batch22-animation-controls.json`、`evidence/animation-entrance-controls-batch22.png`、`evidence/animation-update-controls-batch22.png`。`tests/demo/App.controls.test.ts` 覆盖入场字段非法值/清空恢复、重播按钮在开关和空预览下的禁用条件；`tests/animation/Animation.test.ts` 覆盖三种入场裁剪方向、零时长及 linear/cubicInOut 非对称进度；`tests/integration/Waveform.animation.test.ts` 覆盖延迟、错峰、类别隔离、更新零时长、暂停/恢复/结束、旧帧淘汰和 reduced-motion。9.9—9.20 完成。

## 执行批次23：追加点 31 次入口复验

真实 Demo 重载后进入“数据场景”，连续点击“追加点”31 次（10+10+11）。点击过程中按钮始终可用，右侧波形持续渲染，未出现异常或回绕；证据为 `evidence/browser-batch23-append-31.json` 和 `evidence/append-31-clicks-batch23.png`。由于浏览器 AX 树不暴露 SVG 数据点数量，本批的精确数量、旧点身份及其 X/Y、样式、坐标轴绑定由 `tests/demo/animationScenarios.test.ts` 的完整 1–31 版本断言提供：每次恰好增加一个点，旧数组前缀保持不变，10/20/30 边界不回绕，X 坐标持续递增；空点集、从其他场景追加也已覆盖。

9.21 仍不签收：当前缺少真实浏览器中间动画帧、轴/网格/零线同步属性的独立证据，以及无曲线数组和空预览入口的明确行为定义。上述缺口完成前，不能把入口可用性和生成器断言扩大为完整任务通过。

本轮文档审核发现 9.22–9.25 原有证据映射过于笼统，不能把场景生成器的存在等同于波形渲染验收。已补充 `tests/demo/animationScenarios.test.ts`：滑动窗口断言每次淘汰首点并新增末点；极端位移断言数据保持有限值；自动留白场景断言拓扑不变且振幅发生变化。`tests/integration/Waveform.animation.test.ts` 的共享域逐帧断言继续覆盖曲线、值轴和刻度的同域收敛。定向结果：34 tests passed。9.22–9.25 仍待真实 Demo 操作、逐帧 SVG 属性/绘图区检查和截图证据，未勾选任务。

## 执行批次24：动画数据场景入口

真实 Demo 在“数据场景”页依次点击“滑动窗口”“坐标域变化”“极端位移”“自动留白变化”。四个入口都能触发波形更新；AX 树显示滑动窗口的 X 轴已移动到 32–45，坐标域变化显示 0–13，极端位移的 Y 轴范围显示为 -4–4，自动留白场景仍有波形及 -1–1 标签。结构化记录见 `evidence/browser-batch24-animation-scenarios.json`。

本批仍不签收 9.22–9.25：浏览器 AX 树无法提供逐帧 SVG 几何、绘图区边界或自动留白像素，尚缺 DOM 属性/截图证据以确认淘汰点无残留、曲线与轴/网格/零线逐帧共用比例尺、极端位移的降级条件及文字遮挡规则。不得把“入口可点击且轴标签变化”扩大为完整验收。

## 执行批次27：Chrome DevTools SVG 终态取证

使用 Chrome DevTools 对 Demo 的真实 SVG 进行读取，并在每个场景等待 1.1 秒后记录 DOM 属性。滑动窗口的 X 端点从 0–3000 变为 1–14，网格列数与裁剪宽度同步；坐标域变化和极端位移保持曲线、轴、网格结构并分别得到 -2–2 与 -4–4 的值轴标签；自动留白变化使图框宽度从536变为631，标题、图例和编号文字盒仍可测。完整记录见 `evidence/browser-batch27-svg-scenarios.json`。

批次27补齐了终态 DOM/SVG 证据，但场景入口快速收敛，无法稳定截取中间动画帧；9.22–9.25 仍需将可控时钟测试与逐帧 SVG 采样对应起来，并明确极端位移的降级条件后再签收。

## 执行批次29：中间帧 SVG 比例尺回归

新增 `Waveform.animation.test.ts` 的滑动窗口集成用例，固定100ms线性更新，在25/50/75/100ms分别断言独立公式：X域为 `[p,2+p]`，Y域为 `[-2-2p,2+2p]`，保留点b的Y为 `2+2p`，淘汰点a不再进入表现数据，新点d进入目标集合。每帧检查实际 SVG 点符号位置、X/Y轴刻度和网格的变换，以及零线Y等于绘图区高度一半；结束后无RAF残留。轴允许隐藏端点刻度，因此逐个按绑定数值核对坐标，不要求轴与网格刻度数量相等。

定向回归共35项通过，日志为 `evidence/animation-shared-scales-node20-batch29.log`。这补齐固定小样例的逐帧几何证据；Demo场景和极端/自动留白的剩余组合仍保持待办，不提前勾选9.21–9.25。

## 执行批次30：全局线条完整验收与 C-08 修复

从重载Demo进入坐标域变化(version=1)，使用无局部覆盖的signal/reference两曲线补验全局颜色、宽度、透明度。浏览器通过原生输入事件覆盖六位颜色、rgba、transparent、宽度0/0.25/3.5/1000、透明度0/0.25/1，非法颜色、负宽度、越界透明度和清空均报错并保留上一有效路径与样式；恢复初值清除错误。完整路径和每步预期/实际见 `evidence/browser-batch30-global-line.json`，截图为 `evidence/global-line-restored-batch30.png`。

真实点击四种连线、三种线型候选并恢复；按X域[0,13]、Y域[-2,2]、536×508绘图区和正弦公式独立核对全部直线/阶梯转折坐标，容差0.00051。真实键盘ArrowUp将线宽1.5变为1.6，滑块ArrowLeft将透明度1变为0.95，反向按键恢复。关闭线条得到0路径，重开后2条路径及样式保持。证据为 `evidence/browser-batch30-line-enums.json`。原始四条曲线显式颜色/线宽覆盖的隔离仍由批次2、继承回归和本轮App混合覆盖测试证明。

发现C-08：ConfigField将未验证的raw草稿传给Slider，输入透明度-0.1时Slider自动夹成0并触发change，错误被清除且波形意外变透明。修复为Slider只读取已提交value；新回归先复现失败，修复后对全部range字段验证负数/越界/非有限/清空不提交、滑块动作可修复草稿。App回归验证真实SVG不变以及跨字段编辑和单/多轴往返不泄漏拒绝值。定向4文件147项通过，日志为 `evidence/global-line-node20-batch30.log`。4.1–4.6完成；整个变更仍保持开放。

类型检查还发现既有边框测试的异构数组被推断为string|null，已为固定元组添加as const保留各列类型；`evidence/typecheck-node20-batch30.log`确认库与Demo类型检查通过。

## 执行批次31：网格颜色与宽度边界

真实Demo通过原生输入事件依次验证公共颜色六位hex/rgba/transparent、非法字符串/清空，以及公共/X/Y网格宽度2.5或4或5、0、0.25、1000、负数/清空。颜色与宽度精确写入所有目标网格线；方向宽度只影响目标方向，非法输入保留先前网格与曲线全部路径。结构化记录含27个输入步骤的预期/实际，见 `evidence/browser-batch31-grid-boundaries.json`，截图为 `evidence/grid-boundaries-batch31.png`。

App回归另覆盖NaN/Infinity、合法修正消除错误、方向覆盖优先于公共宽度和曲线几何不变；定向5文件163项通过（`evidence/line-grid-node20-batch31.log`）。结束时重载恢复真正的初始无方向覆盖状态，而不是把方向宽度设为1冒充恢复继承；确认公共宽度1，X/Y宽度编辑器为空，颜色#475569，公共宽度ArrowUp/Down事件均同步两方向。6.3、6.4、6.6、6.8完成。

## 执行批次32：C-08三类范围字段回归

追加曲线级style.opacity后，范围字段回归覆盖line.opacity、frameNumberStyle.opacity、style.opacity三类。为保留可复核的修复前证据，临时恢复原raw绑定运行定向回归，三类均在-0.1输入时失败，随后在finally恢复修复后的文件；日志为 `evidence/range-draft-before-batch32.log`。修复后的最终定向5文件164项通过，见 `evidence/range-line-grid-after-batch32.log`；类型检查见 `evidence/typecheck-node20-batch32.log`，版本指纹见 `evidence/execution-batch32-manifest.json`。

新增2.7跟踪C-08，任务总数194；4.1–4.6与6.3/6.4/6.6/6.8共10项本轮签收，C-08新增项也完成，当前109/194完成、85项待完成。最终门禁仍保持未勾选，不运行最终pnpm check或归档。

## 执行批次3：线点控件回归与数据点边界（历史记录）

补保存了线条控件的浏览器截图与结构化记录：`evidence/line-controls-batch2.jpg`、`evidence/browser-batch2-line.json`。实测显示线条关闭时路径数降为0，恢复后回到4；四种连线类型产生不同路径，三种线型分别映射为无虚线、`8 5`、`8 4 2 4`，透明度键盘调整后为0.95。原始四条曲线显式覆盖颜色和线宽，因此全局颜色/宽度输入不会覆盖它们；这属于优先级契约，不能把“不变”误判为控件失效。

新增 `tests/demo/App.controls.test.ts` 数据点边界断言，并记录于 `evidence/point-line-controls-node20.log`：线条与数据点独立于线条显隐，四种形状、填充色、边框色和边框宽度均映射到实际 SVG；大小为0时符号路径所有坐标退化为0；负值、清空和非法颜色产生错误且保留上一有效 SVG；恢复6后重新绘制非零符号。该批自动化验证通过，但尚未完成真实浏览器逐输入边界及所有点控件任务的完整签收，4.7—4.12继续保持待办。

## 执行批次33：X范围、范围策略刻度数与主刻度

新增3个App控件回归，覆盖策略刻度数对[1.2,13.2]的扩展、data/nice与includeExplicit/bounds组合；手动范围负值/反向/相等/清空的端点和点映射；nice/legacy、minInterval、显式step的优先级及数值边界。`.0f`负数预期使用Unicode负号，修正的是测试预期。定向3文件171项通过，见 `evidence/x-axis-node20-batch33.log`，源指纹见 `evidence/execution-batch33-manifest.json`。

真实浏览器以两个带ID的固定点作准备，关闭动画后通过原生输入setter/input事件编辑数值，真实点击数据范围、易读范围、Legacy和Nice候选，真实ArrowUp/Down检查刻度数量8→9→8。结构化记录保存65步及70项独立断言，全部通过：域[-5,20]下首点X=绘图区宽×6.2/25，SVG路径绝对容差0.00051；[0,14]、count5下nice主刻度[0,3,6,9,12]，legacy为[0,2,4,6,8,10,12,14]；minInterval4改为[0,4,8,12]，显式step2覆盖间隔4。非法值显示字段错误且完整SVG不变，合法修正/清空解除错误，nice超大count保持有限且不超过100。见 `evidence/browser-batch33-x-axis.json` 与 `evidence/x-axis-batch33.png`。截图仅证明终态布局，精度由数值和路径断言证明。

结束后重载，检查范围空值、策略刻度数10、刻度数量8、间隔0、步长空值、两种nice策略及4条初始曲线恢复，见 `evidence/browser-batch33-restoration.json`。5.3、5.6–5.11共7项完成，进度116/194，78项待完成；其余轴样式、标题等不因已有正常值断言便提前签收。历史批次的待办措辞只描述该批状态，最新进度以本批OpenSpec CLI快照为准。

## 执行批次34：X刻度几何、格式与样式

5.14–5.21共8项完成。新增两个App回归覆盖长度/间距/线宽的0、小数和1000、字号1/1.25/1000，以及负数、非有限、非法清空和修正；颜色覆盖hex、rgba、transparent、非法字符串及空值。刻度线y2为负长度，文字y和端点y为间距；字号作用于主刻度文字及端点组；X样式编辑不改动两个值轴的完整DOM。间距或字号为1000时，显式step的容量细化和端点排除可令中间刻度为空，此时以端点属性验证实际值，不要求刻度仍存在。回归也覆盖定点/科学计数格式、空格式恢复单位后缀、显式格式优先于单位，以及单位Unicode、空白、长文本和清空。D3接受的格式字母不随意判非法，非法用语法错误not-a-format和..2f验证。

真实浏览器在重载后的4条原始曲线上执行73步，135项独立断言全部通过，见 `evidence/browser-batch34-x-style.json`。真实点击两个颜色面板的预设色，并用文字颜色Alpha滑块的ArrowLeft确认rgba(22,163,74,0.95)同时写入刻度和端点；数值输入采用原生setter/input事件，不宣称为真实键盘打字。截图 `evidence/x-style-batch34.png` 只记录恢复正常样式后的布局，不宣称极大输入无溢出。重载恢复11个字段及4曲线见 `evidence/browser-batch34-restoration.json`。

定向3文件173项通过、库与Demo类型检查通过，日志为 `evidence/x-style-node20-batch34.log`、`evidence/typecheck-node20-batch34.log`，源指纹见 `evidence/execution-batch34-manifest.json`。当前124/194完成、70项待完成；未执行最终门禁或归档。

## 执行批次35：X标题显隐、文本、样式及偏移

5.22–5.28共7项完成。新增App回归覆盖标题与单位的普通、中文/Unicode、空白、长文本及清空，颜色hex/rgba/transparent和非法/空值，字号1/1.25/18/1000及非法边界，offset的0/100/120.25及非法边界，字重700/bold/normal/空值/无效长文本；隐藏再打开保留完整标题DOM。自动留白会同步移动图框右边，因此offset100→120.25按标题相对图框的间距断言20.25，不要求绝对X变化20.25。适配测试不复制实现的文本宽度估算公式，实际边界在浏览器测量。

`evidence/browser-batch35-x-title.json` 记录54步、118项断言全部通过，包含真实标题开关往返与颜色面板候选点击。真实computedStyle确认bold=700、normal=400、空/无效CSS字重回退400，SVG仍保留原始属性；这不表示表单拒绝无效CSS。长中文标题最终字号2.21，实际旋转矩形保持在SVG内且与现有炮号不重叠，屏幕几何容差0.02px；截图为 `evidence/x-title-long-batch35.png`。offset相对差值20.25，数值容差1e-8。结束重载恢复6个标题字段、Time (ms)与4条原始曲线，见 `evidence/browser-batch35-restoration.json`。

定向3文件142项通过，最终日志与当前源指纹分别为 `evidence/x-title-final-node20-batch35.log`、`evidence/execution-batch35-final-manifest.json`；早期带估算式断言的同批日志与指纹保留为历史。类型检查见 `evidence/typecheck-node20-batch35.log`。当前131/194完成、63项待完成；值轴、其余文字布局和场景验收继续保持待办，最终门禁及归档未执行。

## 执行批次36：左右值轴显隐、范围与刻度策略

5.29–5.33、5.49–5.53共10项完成。两个参数化App回归在独立绑定left/right的两曲线上逐轴验证[-5,20]、反向[30,20]、相等2/2扩为[1,3]、NaN/Infinity/非法文本、清空回自动域；逐轴验证nice自动[1.3,8.7]扩为[0,10]、count5主刻度[0,2,4,6,8,10]，固定[1.3,8.7]下nice仅[2,4,6,8]，legacy含精确端点。count1/1.5/1000合法且nice不超过100主刻度；0/负数/非有限/清空拒绝。轴隐藏不隐藏曲线，恢复后DOM语义一致；使用isEqualNode比较，避免属性顺序差异被误报。

真实浏览器 `evidence/browser-batch36-value-domains.json` 包含64步和116项独立断言。API仅准备带稳定曲线/点ID的两曲线与关闭动画；值轴选择、两侧Legacy/Nice候选、显隐和右轴count5→6→5键盘步进均用真实DevTools点击/按键，数值文本用原生setter/input事件。左右曲线分别按各自域计算两点Y坐标，路径绝对容差0.00051；刻度位置另按比例尺加d3的0.5px偏移检查，容差1e-8。修改一侧仍保持另一侧域映射，允许自动留白引起共同X坐标变化。截图 `evidence/value-domains-batch36.png` 记录正常终态，重载恢复4曲线、双轴visible=true、min/max空、count6及nice策略见 `evidence/browser-batch36-restoration-final.json`；原恢复记录误设预期count10，保留失败记录，已依据默认配置修正预期而未修改产品。

定向3文件176项通过、库与Demo类型检查通过，日志为 `evidence/value-domains-node20-batch36.log`、`evidence/typecheck-node20-batch36.log`，源指纹为 `evidence/execution-batch36-manifest.json`。当前141/194完成、53项待完成，最终门禁及归档继续待办。

## 执行批次37：左右值轴刻度几何与颜色

5.34/5.35/5.37–5.40及5.54/5.55/5.57–5.60共12项完成。两个参数化App回归与真实浏览器在4条原始曲线上逐轴验证刻度长度/间距/轴线宽度的0、小数、正常值和1000；字号1/1.25/18/1000；负数、NaN、Infinity、非法清空，字号另含0/0.5；有效修正恢复。左刻度线x2=长度、右x2=-长度，左文字x=-间距、右x=间距，线宽精确，字号同时作用于刻度和轴头；颜色hex/rgba/transparent与非法/空值均核对，文字颜色也作用于轴头。另一轴的刻度值和全部刻度样式保持不变，自动留白可调整两侧几何。

`evidence/browser-batch37-value-style.json` 记录108步、212项断言，全部通过。真实选择左右轴，并实际打开两轴的轴线/文字四个颜色面板、点击预设色并核对目标轴；其余输入采用原生setter/input事件。极大值验证属性映射与错误保持，不宣称任意字号/间距仍有可读布局。正常终态截图 `evidence/value-style-batch37.png`；结束重载恢复两轴各6个字段及4曲线，见 `evidence/browser-batch37-restoration.json`。

定向3文件178项通过、库与Demo类型检查通过，见 `evidence/value-style-node20-batch37.log`、`evidence/typecheck-node20-batch37.log`；源指纹为 `evidence/execution-batch37-manifest.json`。当前153/194完成、41项待完成，尚未签收值轴格式/单位和标题等剩余项，最终门禁及归档未执行。

## 执行批次38：左右值轴格式与单位

5.36/5.41/5.56/5.61共4项完成。两侧固定[0,1000]、count3，默认文字[0,0.5,1]，左轴头单位在前、右轴头指数在前，使用两个NBSP连接。普通/Unicode/长单位保留，轴头trim空白；纯空白/清空单位仅保留E+03。显式.2f或.1e按原值绘制并隐藏轴头；非法语法not-a-format/..2f报错且完整SVG保持，清空格式恢复默认科学计数与单位。与X轴的默认单位后缀语义分别验收，不混用。

浏览器34步、78项断言通过，见 `evidence/browser-batch38-value-format.json`；真实切换左右轴，数值/格式/单位通过原生setter/input事件输入，逐步检查另一侧刻度值和文字不变。结束重载恢复两轴格式空、单位ms、范围空、count6和4条曲线，见 `evidence/browser-batch38-restoration.json`。定向3文件180项通过，日志 `evidence/value-format-node20-batch38.log`，版本指纹 `evidence/execution-batch38-manifest.json`，类型检查 `evidence/typecheck-node20-batch38.log`。当前157/194完成、37项待完成。

随后开始标题探测发现C-09：右值轴长中文标题尺寸约2974px，SVG高约602px，固定14字号导致裁切；修复前几何见 `evidence/browser-batch39-title-before.json`。标题项不以属性文字正确而提前签收，后续独立修复和复验。

## 执行批次39：左右值轴标题与 C-09

完成2.8、5.42–5.48、5.62–5.68共15项。修复前普通回归失败见 `evidence/value-title-before-node20-batch39.log`。绘制阶段按实际测量或全宽字符估算缩小字号，以1/64px向下量化防止浏览器小字号取整越界；保留完整文字及配置字号上限，缩短及重排重新计算，临时测量节点释放。

`evidence/browser-batch39-value-title.json` 包含120步、280项最终选用断言通过；9个中间失败或旧适配步骤显式标记supersededBy。1–99步为比例适配，100–110步为量化试验，111–120步为最终1/64px复验；先前未受量化影响的文本/颜色/字重证据保留，最终源另经自动化回归。最终中文标题长度499.84375px、可用504px，长单位503.59375px；短标题恢复14。最终截图 `evidence/value-title-final-batch39.png`，重载恢复见 `evidence/browser-batch39-restoration.json`。真实选择轴、开关和颜色预设；文本使用原生setter/input事件。

左右分别验证文本、独立单位、颜色、字号、字重、offset及显隐恢复。最终4文件192项通过，类型检查通过，见 `evidence/value-title-final-node20-batch39.log`、`evidence/typecheck-node20-batch39.log`、`evidence/execution-batch39-final-manifest.json`。当前172/195完成、23项待完成，最终门禁及归档仍开放。

## 执行批次40：确认并验证追加空状态规则

按用户确认同步delta、设计、验收及任务9.21：无曲线禁用追加、不创建示例；空预览使用底层曲线追加并退出预览。生成器取消空数组示例回退，按钮按底层曲线数量禁用，处理函数另有空数组保护；其他场景不受禁用影响。

`evidence/browser-batch40-append-empty.json` 的4个检查全部通过。真实点击空预览和追加，4条原始曲线从1000点增至1001点，逐条精确比较旧点前缀和曲线元数据，退出预览后4条路径恢复。无曲线分支没有Demo清空入口，明确使用Vue开发状态updateSeries([])准备，再检查按钮disabled及直接调用处理函数不修改SVG；真实点击坐标域变化仍可创建2曲线。浏览器1100×700、Chrome155，完成后重载页面恢复。

最终2文件42项通过，见 `evidence/append-empty-node20-batch40-final.log`；类型检查通过见 `evidence/typecheck-node20-batch40-final.log`，版本指纹 `evidence/execution-batch40-final-manifest.json`。早期类型检查发现新增测试的Vue组件props推导不足，改为明确的测试状态类型，原失败日志保留；没有因此修改产品类型契约。OpenSpec严格校验通过，见 `evidence/openspec-validation-execution-batch40-final.log`；CLI任务快照见 `evidence/apply-status-execution-batch40.json`。9.21尚需合并完整几何/动画证据，不因空状态分支通过提前签收；进度维持172/195，23项待办。

## 执行批次41：零线虚线自由文本

App定向39项通过，见 `evidence/zero-dash-node20-batch41.log`，源指纹 `evidence/execution-batch41-manifest.json`。新增回归逐项检查raw配置、SVG属性、错误状态、曲线几何不变及显隐恢复。真实浏览器11组输入均符合独立预期，见 `evidence/browser-batch41-zero-dash.json`：8 2、0、小数逗号、奇数项、百分比精确解析，none/空白/非法文本computed为none。未把CSS回退记作表单拒绝；域和动画用API准备，零线分类真实点击，文本用原生setter/input，结束重载恢复。

类型检查通过见 `evidence/typecheck-node20-batch41.log`，6.14签收。随后发现C-10，新增2.9，总数196。

## 执行批次43：图表标题文字与样式

7.2/7.4–7.6共4项完成。定向1项普通App回归通过，39项跳过不计通过数，见 `evidence/chart-title-node20-batch43.log`；类型检查通过见 `evidence/typecheck-node20-batch43.log`。当前源指纹随后保存为 `evidence/execution-batch43-manifest.json`，不追认为测试前采集。浏览器31步通过，见 `evidence/browser-batch43-chart-title.json`，包括Unicode/空白/长文本/空隐藏、三类颜色、字号1/1.25/22/1000、非法颜色与数值保持原图、字重computed回退、真实显隐恢复。文本用原生setter/input；大字号和长图表标题仅验证配置/属性映射，图表标题无自动缩放承诺，与已适配的旋转标题分别说明。结束重载恢复。当前178/196完成、18项待办，最终门禁继续开放。

## 执行批次42：修复长中文炮号与X标题重叠 C-10

两段长中文同时显示时原重叠309.625px，证据 `evidence/browser-batch42-shot-before.json`。新增native/fallback两个普通回归均因长度151.2超可用92失败，见 `evidence/metadata-before-corrected-node20-batch42.log`；更早日志是测试误用不存在的setup辅助函数，不作为产品失败证据。改为共用实际测量/全宽字符估算并释放临时节点，字号按1/64px向下量化、无空间时为0。

浏览器修复后间隔17.890625px，高度300时20.311218px，缩短后炮号/X标题恢复14，见 `evidence/browser-batch42-shot-after.json`、`evidence/browser-batch42-sizing-restoration.json`；脚本调用Demo edit用于本缺陷的精确数据准备与复验，未宣称真实输入操作。截图 `evidence/metadata-fit-batch42.png`，结束重载恢复。首次修复后旧ASCII测试仍把空格估为0.6，因测量器空格为0.33产生错误预期；改为按空白/普通字符独立计算，原日志保留于 `evidence/metadata-after-node20-batch42.log`。最终3文件59项通过，类型检查通过，见 `evidence/metadata-final-node20-batch42.log`、`evidence/typecheck-node20-batch42.log`，指纹 `evidence/execution-batch42-final-manifest.json`。2.9签收，其余文字控件仍需完整边界验收。当前174/196完成、22项待办，最终门禁及归档未执行。

## 执行批次44：炮号与编号文字样式

完成7.8–7.11、7.13–7.17共9项。新增两个参数化App回归通过，40项跳过不计通过数，见 `evidence/shot-number-node20-batch44.log`；类型检查通过见 `evidence/typecheck-node20-batch44.log`，当前源指纹随后采集于 `evidence/execution-batch44-manifest.json`。浏览器68步全部通过，见 `evidence/browser-batch44-shot-number.json`：炮号普通/Unicode/空白/长文/清空、颜色hex/rgba/transparent、字号1/1.25/18/1000上限、字重raw及computed、非法数值/颜色保持原图、真实显隐恢复；编号另验证透明度0/0.25/1及非法草稿隔离、字体空白回默认、字号清空按min(120,0.65h,0.9w/1.2)独立公式恢复自动。长炮号实际空间适配见批次42，未仅以字号属性替代边界。分类/显隐使用真实DevTools点击，文本用原生setter/input；结束重载恢复。当前187/196完成、9项待办，仅数据场景5项及最终门禁4项未完成。

## 执行批次45：数据场景逐帧闭环

9.21–9.25共5项签收。准备脚本 `evidence/browser-batch45-harness.js` 使用Demo实际组件和库实例，固定800×400/四边留白、2条14点曲线、legacy/data域及400ms线性更新；初始reduced-motion=false、document.hidden=false。页面加载后接管performance.now和RAF，每100ms推进一次。场景按钮用DOM click触发同一Demo处理函数；真实DevTools点击的actionability依赖原生RAF，在接管后超时，此处不宣称真实鼠标操作，真实点击入口由批次23/27/40的独立证据支持。

`evidence/browser-batch45-scenario-frames.json` 含7次操作、27个采样帧全部通过：追加1→滑动2→滑动3→坐标域4→追加5→极端6→留白7。目标域按数据极值独立计算（极端显式[-4,4]），各帧按旧点ID与目标点插值、旧域/新域线性插值计算坐标，逐点核对完整路径（容差0.00051）、点符号（1e-8）、X/Y轴与网格刻度（独立scale+0.5px）及零线；域和样式保留不只读取配置。滑动后的路径/点集合与目标ID列表完全对应，淘汰点无残留。前5操作分别在0/25/50/75/100%核对，终态动画停止且不再持有库RAF handle。

极端位移约3.815e9px，大于4×绘图区对角线阈值2765.61，允许静态降级；路径/符号数值有限、实际裁剪620×306、无entry裁剪残留，推进1000ms不被旧帧覆盖，不计作时长通过。留白操作前启用自动留白并降低手动最小边距，取消横向90约束后绘图区620→728，符合布局变化静态降级；图例/炮号/X标题/编号矩形均在SVG内，炮号与X标题间距大于12px，后续帧不覆盖终态。剩余UI过渡RAF明确与库animator handle区分。截图 `evidence/scenario-padding-batch45.png` 已视觉核查。结束重载恢复4×1000点、双轴、100%尺寸、自动留白和原生时钟，见 `evidence/browser-batch45-restoration.json`。

生成器31次持续追加、跨场景、空点集的精确数据回归及共享域动画回归35项通过，见 `evidence/scenario-frames-node20-batch45.log`，版本指纹 `evidence/execution-batch45-manifest.json`。结合批次23的31次真实点击、批次40空数组/空预览分支和本批中间几何补齐9.21，不将单层证据扩大为全部通过。当前192/196完成，仅最终门禁4项待办。

## 执行批次46：最终审计补齐四曲线样式与绑定

逐项审计发现8.1–8.11要求每条曲线，而早期浏览器记录集中于第二条。新增4个参数化App回归，对原始4个曲线ID分别覆盖11项自定义→继承→全局更新，验证其他显式覆盖曲线的完整线/点DOM不变、选择不改图、继承时编辑禁用。阶梯按独立顶点公式核对，菱形按四顶点面积4×size²核对；数据替换为三点样本且保留原名称/轴绑定。4项通过，见 `evidence/all-series-final-node20-batch46.log`；早期失败是测试误写dash-dot预期，按既有8 4 2 4纠正，未改产品。

真实DevTools下拉逐个选择原始4条名称，48条浏览器断言全部通过，见 `evidence/browser-batch46-all-series.json`，准备/验证脚本 `evidence/browser-batch46-harness.js`。文本采用原生setter/input，布尔/继承用DOM click，枚举通过ConfigField公开change事件；不将组件事件说成真实候选点击，真实候选入口由批次14/15补证。每条开始前重置全局值，确保“再改全局”不是相同值无操作。

另补四条曲线分别绑定对侧再恢复，共8条精确映射断言，见 `evidence/browser-batch46-all-bindings.json`；使用ASelect公开update:value事件，左域[-2,2]右域[-4,4]，独立计算y=-1的首点坐标，逐条验证路径及点、原绑定恢复、同伴图形不变。真实轴选择入口见批次19。结束重载恢复4×1000点及原配置，环境/恢复见 `evidence/browser-batch46-restoration.json`。

新增测试后重新执行完整pnpm check：45文件502项普通测试通过，类型检查、库与Demo构建均通过，日志 `evidence/pnpm-check-final-reviewed-node20.log`，运行前指纹 `evidence/execution-final-reviewed-manifest.json`（Node v20.20.2、pnpm9.15.0）。早期498项最终检查作为补审前历史保留；本次502项为提交当前源的最终门禁依据。现仅需完成证据审计、严格校验及归档。

## 最终门禁与签收

10.1–10.3通过：Node v20.20.2、pnpm9.15.0下完整pnpm check退出0，45文件502项普通测试、类型、库和Demo构建全部通过；保留既有Demo大包体积提示。严格校验通过见 `evidence/openspec-validation-final-reviewed.log`。当前141个src/demo/tests与依赖文件SHA256与最终运行前指纹完全一致，未在最终检查后修改产品或测试。

10.4审计见 final-audit.md 与 `evidence/final-traceability-audit.json`：196个唯一任务、177项基础目录及增补任务均已逐组核对，显式证据引用无缺失；C-01–C-10及尺寸/追加/上下限契约均有修复与复验，补审四曲线样式和绑定无遗漏。审计文件记录签署10.4前195项完成/仅10.4待签，不将这一历史快照改写为已归档；最终196/196以最后CLI状态和归档结果为准。无it.fails或only掩盖失败，git diff --check通过。证据存在性检查不代替功能断言，具体断言与限制在各执行批次中保留。

归档完成：`openspec archive verify-demo-control-accuracy --yes --json`退出0，归档为2026-10-18-verify-demo-control-accuracy，主规范新增4项Requirement、修改1项。结果见 `evidence/archive-final.json`，归档前CLI完整状态见 `evidence/apply-status-final-complete.json`（196/196、remaining=0）。归档后demo-configuration及chart-update-and-interaction两份主规范严格校验均通过，见 `evidence/main-demo-spec-final.log`、`evidence/main-interaction-spec-final.log`；再次核对141个源指纹无变化、归档证据文件全部保留、git diff --check通过。未提交代码或发布制品。
