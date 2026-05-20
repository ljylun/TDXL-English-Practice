# 智能考试倒计时系统 - 工作日志

---
Task ID: 1
Agent: Main Agent
Task: 项目初始化和结构探索

Work Log:
- 探索项目结构，确认 Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui 技术栈
- 确认可用的 shadcn/ui 组件列表（Card, Button, Progress, Badge, Tooltip, Separator 等）
- 确认项目已有 dev server 运行在 3000 端口

Stage Summary:
- 项目基础架构确认完毕
- 可用组件资源明确

---
Task ID: 2
Agent: Main Agent
Task: 实现考试倒计时系统核心功能

Work Log:
- 创建 `src/lib/exam-data.ts` - 7个考试阶段数据定义
- 创建 `src/hooks/use-exam-timer.ts` - 考试计时器 Hook
- 创建 `src/hooks/use-tts.ts` - 语音合成 Hook
- 创建 `src/lib/time-utils.ts` - 时间格式化工具函数
- 创建 `src/app/page.tsx` - 主页面组件

Stage Summary:
- 核心计时逻辑完成
- 7阶段自动切换功能实现
- 10秒预警语音提醒功能实现
- 可视化 UI 完成

---
Task ID: 3
Agent: Main Agent + QA Subagent
Task: Bug 修复和功能增强（第一轮）

Work Log:
- 修复模态框点击穿透问题
- 修复 isDark useState 顺序问题
- 添加暗色模式切换
- 添加键盘快捷键
- 添加提示音功能
- 添加重置确认弹窗
- 禁止考试进行中切换阶段

Stage Summary:
- 第一轮 QA bug 全部修复
- 新增 6 项增强功能

---
Task ID: 4
Agent: Cron Review Agent
Task: 第二轮 QA + Bug 修复 + 功能增强

## 项目当前状态描述/判断
应用功能完整，核心计时、TTS、暗色模式、键盘快捷键均正常工作。上一轮 QA 发现以下问题需修复，同时需要增加新功能以提升用户体验。

## 当前目标/已完成的修改/验证结果

### Bug 修复
1. **BUG-2 修复**: 阶段跳转时，之前阶段现在正确显示"已跳过"而非"已完成"
   - 重构 `useExamTimer` hook，增加 `completedStages` Set 追踪自然完成的阶段
   - 侧边栏区分三种状态：✓已完成（绿色）、⏭已跳过（琥珀色）、—未参与（灰色）
   - 提供 `isStageCompleted()` 和 `isStageSkipped()` 方法

2. **BUG-3 修复**: 跳转阶段时"已用时间"现在正确显示为 00:00（而非虚假的已用时间）
   - `jumpToStage()` 重置 `completedStages`、`startedAt`、`totalElapsedSeconds`
   - 只有自然完成的计时才累计已用时间

3. **BUG-4 修复**: 暗色模式偏好现在持久化到 localStorage
   - 使用 `exam-timer-dark-mode` key 存储
   - 初始化时优先读取 localStorage，其次检测系统偏好

4. **BUG-5 修复**: 所有 header 图标按钮添加 `aria-label` 属性
   - Voice/TTS 按钮添加动态 aria-label
   - Sound/Bell 按钮添加动态 aria-label
   - Dark mode、Clock、Fullscreen、Keyboard 按钮均添加 aria-label

### 新增功能
5. **跳过阶段功能 (N 键)**: 考试运行中可跳过当前阶段
   - 新增 `skipStage()` 方法，跳过时标记为"已跳过"而非"已完成"
   - UI 出现"跳过本阶段"按钮（琥珀色描边，仅运行/暂停时显示）
   - 键盘快捷键 N 可快速跳过

6. **Browser Notification API**: 背景标签页时发送浏览器通知
   - 阶段切换和时间预警时自动发送通知
   - 首次开始考试时请求通知权限
   - 通知内容包含具体切换信息

7. **Framer Motion 动画**: 阶段切换和弹窗动画
   - 阶段图标切换时旋转动画（spring + rotate）
   - 计时器数字淡入淡出动画
   - 所有模态框（选择阶段、确认重置、快捷键）添加 scale + opacity 弹出动画
   - 彩纸粒子组件使用 Framer Motion 物理动画

8. **考试完成庆祝效果**: 最后阶段倒计时结束时
   - 🎊 彩纸粒子雨（50个粒子，6种颜色，3-5秒下落）
   - 🏆 计时器显示奖杯图标
   - 🎵 胜利旋律音效（C5-E5-G5-C6）
   - 🗣️ 语音播报"恭喜你，考试结束！"
   - 📱 浏览器通知"考试结束"

9. **全屏模式 (F 键)**: 无干扰考试环境
   - 使用 Fullscreen API
   - Header 工具栏添加全屏切换按钮
   - ESC 退出全屏自动检测

10. **localStorage 持久化**: 设置跨会话保持
    - 暗色模式偏好
    - TTS 开关状态
    - 提示音开关状态

### 验证结果
- ✅ ESLint 检查通过（0 errors, 0 warnings）
- ✅ Dev server 编译正常
- ✅ QA 测试通过：开始/暂停/跳过/重置/暗色模式全功能正常
- ✅ 跳过阶段显示"已跳过"（非"已完成"）
- ✅ 重置确认弹窗正常工作
- ✅ 无控制台错误

## 未解决问题或风险，建议下一阶段优先事项

1. **计时精度优化**: 当前使用 `setInterval(tick, 1000)` 长时间运行可能产生漂移。建议改用 `Date.now()` 增量计算精确时间差。Hook 中已预留 `startedAt`/`runSegmentStart`/`totalElapsedSeconds` 字段，但 tick 逻辑仍使用简单递减。

2. **考试历史记录**: 可使用 Prisma + SQLite 存储每次考试的完成时间、跳过记录等，提供历史回顾功能。

3. **自定义时间配置**: 允许用户自定义各阶段时长，而非硬编码。

4. **移动端优化**: 当前移动端布局可用但仍有改进空间，如底部固定控制栏、手势操作等。

5. **页面可见性处理**: 当页面切到后台时 `setInterval` 可能被浏览器节流，导致计时不准。建议使用 `visibilitychange` 事件 + `Date.now()` 校准。

---
Task ID: 5
Agent: Cron Review Agent (Round 3)
Task: 第三轮 QA + Bug 修复 + 功能增强

## 项目当前状态描述/判断
应用功能完备，核心计时、TTS、暗色模式、键盘快捷键、跳过阶段、全屏模式、浏览器通知等均正常工作。第二轮优化后代码质量良好，但 QA 发现多个细节 bug 需修复，同时需继续增加新功能和视觉打磨。

## 当前目标/已完成的修改/验证结果

### Bug 修复
1. **BUG-1 修复**: `stageElapsedMinutes` 计算错误 - 刚开始3秒就显示"已用时1分钟"
   - 改为 `const stageElapsedSeconds = currentStage.duration * 60 - timer.remainingSeconds`
   - 显示格式改为 `M:SS / XX分钟`，精确到秒

2. **BUG-2 修复**: `confettiShownRef` 使用 `useState` 而非 `useRef`
   - 改为 `useRef(false)`，避免不必要的重新渲染

3. **BUG-3 修复**: Escape 键无法关闭重置确认弹窗
   - 在 Escape case 中添加 `setShowResetConfirm(false)`

4. **BUG-4 修复**: AudioContext 资源泄漏
   - 创建单例 `getAudioContext()` 函数复用同一 AudioContext
   - 自动处理 suspended/closed 状态

5. **BUG-5 修复**: 未使用的 import `SkipForwardIcon`
   - 移除，只保留 `SkipForward`

6. **VISUAL-1 改善**: 暗色模式下次要文字对比度不足
   - 侧边栏文字从 `dark:text-slate-400` 改为 `dark:text-slate-300`
   - 进度条文字从 `dark:text-slate-400` 改为 `dark:text-slate-300`

7. **VISUAL-3 修复**: 圆形进度 SVG 使用固定像素尺寸
   - 改为 `w-[240px] h-[240px] sm:w-[280px] sm:h-[280px]` 响应式
   - SVG 使用 `viewBox` + `width="100%" height="100%"` 缩放

### 新增功能
8. **自定义时间配置**: 用户可修改各阶段考试时长
   - 新增设置对话框（Dialog 组件），使用 Settings2 图标入口
   - 每个阶段可输入自定义分钟数（1-120），留空恢复默认
   - 新增 `updateDurations()` 方法动态更新 EXAM_STAGES 数据
   - 仅在 idle/finished 状态可配置

9. **计时精度提升 + 页面可见性校准**:
   - 新增 `runSegmentStart` + `remainingAtSegmentStart` 精确追踪计时段
   - 添加 `visibilitychange` 事件监听器
   - 页面从后台切回前台时，通过 `Date.now()` 增量校准倒计时
   - 如果阶段在后台期间已结束，自动触发阶段切换

10. **移动端底部固定控制栏**:
    - 新增 `sm:hidden` 固定底部控制栏（开始/暂停 + 跳过 + 重置）
    - 使用 `fixed bottom-0` + `backdrop-blur-md` + `safe-area-bottom`
    - Footer 添加 `pb-16 sm:pb-0` 避免被控制栏遮挡
    - 桌面端隐藏底部栏，保持原有按钮布局

### 视觉打磨
11. 更精细的响应式设计（text-xs/text-sm、p-3/p-4 等）
12. 暗色模式下更清晰的文字对比度
13. 侧边栏和快速统计卡片适配移动端字号

### 验证结果
- ✅ ESLint 检查通过（0 errors, 0 warnings）
- ✅ Dev server 编译正常
- ✅ QA 测试通过：计时精确、"已用时"显示正确、暂停/重置正常
- ✅ 无控制台错误

## 未解决问题或风险，建议下一阶段优先事项

1. **考试历史记录**: 可使用 Prisma + SQLite 存储每次考试的完成时间、跳过记录等。

2. **PWA 支持**: 添加 manifest.json 和 Service Worker，支持离线使用和添加到主屏幕。

3. **进度可视化增强**: 在总览面板下方添加时间轴图表，展示各阶段占比和当前进度。

4. **多考试模板**: 支持保存和加载不同的考试配置（不同阶段和时长）。

5. **倒计时完成时的页面闪烁**: 在浏览器标签页中可以通过 favicon 变化提醒用户。

---
Task ID: 3-a
Agent: Feature Agent
Task: Add Exam History Feature with Prisma

## 项目当前状态描述/判断
应用功能完备，核心计时、TTS、暗色模式、键盘快捷键、跳过阶段、全屏模式、浏览器通知、自定义时间配置等均正常工作。需要新增考试历史记录功能，使用 Prisma + SQLite 持久化存储。

## 当前目标/已完成的修改/验证结果

### 1. Prisma Schema - ExamHistory 模型
- 在 `prisma/schema.prisma` 中新增 `ExamHistory` 模型
- 字段：id (auto-increment), startedAt, finishedAt (nullable), status, totalDurationSeconds, stagesJson, createdAt
- status 支持 "completed" | "abandoned" | "in_progress"
- stagesJson 存储为 String，应用层 JSON.parse/stringify
- 运行 `bun run db:push` 成功同步

### 2. API Routes - /api/exam-history
- 创建 `src/app/api/exam-history/route.ts`
- **GET**: 返回所有考试记录，按 createdAt 降序排列
- **POST**: 创建新考试记录，接受 startedAt, status, totalDurationSeconds, stagesJson
- **PATCH**: 更新已有记录，接受 id, status, finishedAt, stagesJson
- 所有 API 错误处理优雅，返回适当的 HTTP 状态码

### 3. 前端集成 - 考试历史追踪
- 新增 `StageRecord` 和 `ExamHistoryRecord` 类型定义
- 新增状态变量：`currentExamId`, `historyRecords`, `expandedHistoryId`, `examStagesRef`
- **开始考试时**：调用 POST API 创建新记录，保存返回的 id
- **考试完成时**：调用 PATCH API 标记 "completed"，附带 finishedAt 和 stagesJson
- **考试重置时**：调用 PATCH API 标记 "abandoned"，附带 finishedAt 和 stagesJson
- **跳过阶段时**：调用 PATCH API 更新 stagesJson
- 新增 `handleSkipStage` 函数替代直接 `timer.skipStage()` 调用，集成历史追踪
- API 失败时不阻塞 UI（graceful degradation）

### 4. History Dialog UI
- 在 header 工具栏新增 History 图标按钮
- 点击后打开 Dialog 显示考试历史列表
- 每条记录显示：日期时间、状态 Badge（已完成=绿色、已放弃=琥珀色）、总时长
- 点击条目可展开显示各阶段详细状态（✓已完成/⏭已跳过/—未参与）
- 空状态提示："暂无考试记录，完成一次考试后将在此显示"
- Dialog 可滚动，max-h-[85vh]
- 使用 shadcn/ui 的 Dialog, Badge 组件

### 验证结果
- ✅ ESLint 检查通过（0 errors, 0 warnings）
- ✅ Dev server 编译正常
- ✅ GET /api/exam-history 返回 200
- ✅ POST /api/exam-history 返回 201 并创建记录
- ✅ PATCH /api/exam-history 返回 200 并更新记录
- ✅ 主页面返回 200
- ✅ 原有功能未受影响

### 修改文件
- `prisma/schema.prisma` - 新增 ExamHistory 模型
- `src/app/api/exam-history/route.ts` - 新建 API 路由
- `src/app/page.tsx` - 新增历史追踪逻辑和 History Dialog UI

---
Task ID: 3-b
Agent: Feature Agent
Task: Add Timeline Visualization and Dynamic Favicon

## 项目当前状态描述/判断
应用功能完备，核心计时、TTS、暗色模式、键盘快捷键、跳过阶段、全屏模式、浏览器通知、自定义时间配置、考试历史记录等均正常工作。需要新增动态 Favicon、时间轴可视化、下一阶段预览功能。

## 当前目标/已完成的修改/验证结果

### 1. 动态 Favicon (`useDynamicFavicon` hook)
- 创建 `src/hooks/use-dynamic-favicon.ts`
- 5 种状态对应的 SVG favicon：
  - **idle**: 灰色圆 + 时钟图标（默认状态）
  - **running**: 绿色圆 + 白色内圆（正常计时）
  - **urgent**: 琥珀色圆 + 白色内圆（≤30秒）
  - **warning**: 红色圆 + 白色内圆（≤10秒）
  - **finished**: 绿色圆 + 白色对勾
- 使用 `data:image/svg+xml` URI 动态更新 `<link rel="icon">`
- 仅在状态变化时更新 DOM（避免每秒更新）
- 卸载时恢复默认 favicon
- SVG 精简（< 300 bytes）

### 2. 时间轴可视化组件
- 在 Quick Stats 卡片和侧边栏之间新增时间轴 Card
- 水平条形图展示各阶段占总时长比例
- 颜色编码：
  - 已完成阶段：emerald/绿色 + ✓
  - 已跳过阶段：amber/琥珀色 + ⏭
  - 当前阶段：emerald + animated pulse + ring 高亮
  - 未达阶段：slate/灰色 + 阶段编号
- 每个阶段区域显示：图标/状态、名称（截断）、时长
- 下方进度指示器（三角形 caret）实时跟随进度
- 响应式设计：`min-w-[500px]` + `overflow-x-auto` 移动端可滚动

### 3. 下一阶段预览
- 计时器卡片下方新增 "下一阶段" 预览卡片
- 仅在考试运行/暂停且非最后阶段时显示
- 虚线边框（border-dashed）
- 显示下一阶段图标、名称、时长、英文名
- ChevronRight 指示箭头

### 4. 集成
- `useDynamicFavicon(timer.status, timer.remainingSeconds)` 在 Home 组件中调用
- 导入 `useDynamicFavicon` hook

### 验证结果
- ✅ ESLint 检查通过（0 errors, 0 warnings）
- ✅ Dev server 编译正常，GET / 200
- ✅ 原有功能未受影响

### 修改文件
- `src/hooks/use-dynamic-favicon.ts` - 新建动态 Favicon hook
- `src/app/page.tsx` - 新增时间轴可视化、下一阶段预览、Favicon hook 集成

---
Task ID: 6
Agent: Frontend Styling Expert
Task: Massively Enhance Visual Styling and Micro-Interactions

## 项目当前状态描述/判断
应用功能完备，核心计时、TTS、暗色模式、键盘快捷键、跳过阶段、全屏模式、浏览器通知、自定义时间配置、考试历史记录、时间轴可视化、动态Favicon等均正常工作。UI功能完整但视觉打磨不足，需要大幅增强视觉样式和微交互。

## 当前目标/已完成的修改/验证结果

### 1. Timer Ring Enhancement (计时器环形进度增强)
- **SVG Glow Effect**: 添加 `feGaussianBlur` 滤镜实现进度环发光效果
  - 亮色模式: `stdDeviation="6"` 中等发光
  - 暗色模式: `stdDeviation="10"` 更强发光（`ring-glow-dark` 滤镜，双重 blur 合并）
- **Tick Marks (刻度线)**: 60条时钟面刻度线环绕圆环
  - 每5格一条粗刻度线 (1.5px)，其余细刻度线 (0.75px)
  - 粗线使用 `text-slate-300 dark:text-slate-600`，细线使用 `text-slate-200 dark:text-slate-700`
  - viewBox 扩展至 320x320 以容纳刻度线
- **Rotating Background Ring**: 运行时背景环缓慢旋转 (60s/圈)
  - 使用 CSS `ring-rotate` keyframe animation
  - 内层还有一条虚线环反向旋转 (30s/圈)，增强动态感
- **Gradient Stroke**: 进度环使用 SVG `linearGradient` 渐变描边
  - 翡翠色渐变: `#10b981 → #34d399 → #059669`
  - 琥珀色渐变: `#f59e0b → #fbbf24 → #d97706`
  - 红色渐变: `#ef4444 → #f87171 → #dc2626`

### 2. Card Hover Effects (卡片悬停效果)
- **Quick Stats Cards**: 添加 `card-hover-lift` 类
  - hover 时 `translateY(-2px)` + 增强阴影
  - 亮色模式: `0 8px 25px -5px rgba(0,0,0,0.1)`
  - 暗色模式: `0 8px 25px -5px rgba(0,0,0,0.4)`
- **Main Timer Card**: 添加 `card-inner-glow` 类（暗色模式下 1px 内边框微光）
- **Stage Overview Sidebar Items**: 添加 `sidebar-item-highlight` 类
  - 左侧3px绿色竖线，hover 时 `scaleY(0→1)` 滑入动画
  - 当前激活项始终显示高亮竖线

### 3. Button Enhancements (按钮增强)
- **Main Action Button**: 渐变背景替代纯色
  - 默认状态: `bg-gradient-to-r from-emerald-600 to-teal-600`
  - 暂停状态: `bg-gradient-to-r from-red-500 to-rose-600`
- **Ripple Effect**: 添加 `btn-ripple` 类
  - 点击时 CSS `::after` 伪元素从点击点扩散的涟漪效果
  - 使用 `ripple` keyframe animation (0.6s ease-out)
- **Skip Button Dashed Border Animation**: 添加 `skip-btn-dashed` 类
  - SVG rect 使用 `stroke-dasharray: 8 4` + `dash-march` 动画
  - 虚线边框持续移动，视觉引导注意

### 4. Status Transition Animations (状态转换动画)
- **Stage Flip Animation**: 阶段切换时 `stage-flip-enter` 类
  - `perspective(600px) rotateY(-15deg) translateX(-20px)` → 正常位置
  - 0.5s ease-out 3D翻转滑入效果
- **Urgent/Warning Pulse Background**: `urgent-pulse-bg` 类
  - 全屏半透明红/琥珀色覆盖层，1.5s 周期脉冲
  - opacity 在 0~0.08 之间变化，微妙但不干扰
- **Green Flash on Exam Finish**: `green-flash-overlay` 类
  - 考试完成时全屏翡翠绿闪烁 (0.8s ease-out)
  - opacity 从 0.5 渐隐到 0

### 5. Progress Bar Enhancements (进度条增强)
- **Animated Gradient Shimmer**: `progress-shimmer` 类
  - 200% 宽度的渐变背景 + 2s 无限循环 `shimmer` 动画
  - 三种状态对应三种渐变色（翡翠/琥珀/红色）
- **Milestone Markers**: 阶段分界处菱形标记
  - 45度旋转的小方块 (1.5x1.5)，已过阶段为翡翠色，未到为灰色
- **Floating Tooltip**: hover 进度条时显示当前阶段名
  - 0.2s 淡入动画，带小三角箭头指向进度条
  - `opacity-0 group-hover:opacity-100` 过渡

### 6. Header Enhancement (页头增强)
- **Animated Gradient Border**: `header-shimmer-border` 类
  - 底部2px渐变线（翡翠→青→紫→青→翡翠），3s循环
  - 使用 `::after` 伪元素 + `header-shimmer` keyframe
- **Scroll Shadow**: `header-scrolled` 类
  - 监听 `window.scrollY > 10` 添加更深阴影
  - 使用 passive scroll 事件监听器
  - 暗色模式下阴影更重

### 7. Typography Enhancements (排版增强)
- **Tabular Nums**: `timer-digits` 类
  - `font-variant-numeric: tabular-nums` 确保数字等宽
  - 应用于计时器数字、快速统计卡片的已用/剩余时间
- **Text Shadow Glow**: 紧急/警告状态文字发光
  - `timer-glow-warning`: 红色三重 text-shadow (10px/20px/40px)
  - `timer-glow-urgent`: 琥珀色三重 text-shadow
- **Letter Spacing**: 当前阶段名 `tracking-wider`
  - 应用于侧边栏当前项阶段名、进度条当前阶段标签

### 8. Dark Mode Enhancements (暗色模式增强)
- **Inner Border Glow**: `card-inner-glow` 类
  - 暗色模式下 `box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06)`
  - 应用于所有卡片（主计时卡、统计卡、时间轴卡、侧边栏卡）
- **Pronounced Ring Glow**: 暗色模式专属 `ring-glow-dark` SVG 滤镜
  - 双重 `feMergeNode in="blur"` 实现更强烈发光
- **Starfield Background**: `dark-starfield` 类
  - 纯 CSS 实现，15个随机位置的 `radial-gradient` 微光点
  - 模拟星空效果，1-1.5px 大小，opacity 0.06~0.18

### 9. Mobile Enhancements (移动端增强)
- **Haptic Feedback Simulation**: `mobile-haptic` 类
  - active 状态时 0.15s scale(1→0.95→1) 缩放动画
  - 应用于底部控制栏所有按钮
- **Larger Touch Targets**: `min-h-[44px]`
  - 所有可交互列表项、按钮添加最小 44px 触摸高度
  - 符合 WCAG 移动端触摸目标要求
- **Timer Circle Sizing**: 保留响应式 `w-[220px] sm:w-[280px]`
  - 移动端更小但 viewBox 自适应缩放

### 10. Tooltip Polish (工具提示优化)
- **Fade-in Animation**: `tooltip-animate` 类
  - 同时应用 `fade-in` (0.2s) 和 `scale-in` (0.15s) 动画
- **Delay**: `delayDuration={300}` 
  - TooltipProvider 添加 300ms 延迟防止快速滑过时闪烁
- **Arrow Caret**: 进度条 tooltip 带小三角箭头
  - CSS border trick 实现指向触发元素的三角形

### CSS Keyframes Added (globals.css)
- `shimmer` - 进度条渐变闪烁
- `ring-rotate` - 环形进度旋转
- `dash-march` - 虚线行进动画
- `pulse-glow` - 脉冲发光
- `gradient-x` - 渐变滑动
- `fade-in` / `scale-in` - 淡入/缩放进入
- `header-shimmer` - 头部渐变边框
- `float-up` - 上浮动画
- `green-flash` - 绿色闪烁
- `urgent-pulse` - 紧急脉冲
- `haptic` - 触觉反馈
- `ripple` - 涟漪效果
- `stage-flip-in` - 阶段3D翻转
- `prefers-reduced-motion` 媒体查询 - 禁用所有动画

### 验证结果
- ✅ Next.js build 成功（0 errors）
- ✅ Dev server 正常运行，页面渲染正确
- ✅ 所有 SVG 滤镜和渐变正确渲染
- ✅ 进度条动画、刻度线、发光效果可见
- ✅ 暗色模式星空背景、内边框发光正常
- ✅ 原有功能未受影响

### 修改文件
- `src/app/globals.css` - 新增 14 个 CSS keyframes、15+ 工具类、reduced-motion 支持
- `src/app/page.tsx` - 全面视觉增强（SVG滤镜/渐变/刻度线、卡片效果、按钮渐变/涟漪/虚线动画、状态转换、进度条增强、页头增强、排版增强、暗色模式增强、移动端增强、工具提示优化）

---
Task ID: 7
Agent: Main Agent (Round 4 QA + Bug Fix + Integration)
Task: 最终 QA 测试、Bug 修复、整合验证

## 项目当前状态描述/判断
应用功能丰富，包括核心计时、TTS、暗色模式、键盘快捷键、跳过阶段、全屏模式、浏览器通知、自定义时间配置、考试历史记录（Prisma）、时间轴可视化、动态Favicon、大量视觉增强效果。需要最终 QA 验证、修复发现的 Bug。

## 当前目标/已完成的修改/验证结果

### Bug 修复
1. **Hydration Mismatch 修复**: SVG 刻度线浮点精度导致服务端/客户端渲染不一致
   - 将刻度线坐标值四舍五入到4位小数 `Math.round(val * 10000) / 10000`
   - 消除 React hydration mismatch 警告

2. **ESLint Error 修复**: `setShowGreenFlash(true)` 在 useEffect 中同步调用 setState
   - 使用 `setTimeout(() => { setShowGreenFlash(true); ... }, 0)` 延迟执行
   - 避免 cascading renders 问题

### QA 测试结果 (agent-browser)
- ✅ 页面加载正常，无 hydration 错误
- ✅ 开始/暂停/跳过/重置功能正常
- ✅ 暗色模式切换正常
- ✅ 考试历史记录对话框正常显示
- ✅ 时间轴可视化正常渲染
- ✅ 动态 Favicon 正常更新
- ✅ ESLint 0 errors, 0 warnings
- ✅ 无控制台错误
- ✅ API 端点正常 (GET/POST/PATCH /api/exam-history)

### 验证结果
- ✅ ESLint 检查通过（0 errors, 0 warnings）
- ✅ Dev server 编译正常
- ✅ agent-browser 全流程测试通过
- ✅ 无 hydration mismatch 警告
- ✅ 无运行时错误

## 未解决问题或风险，建议下一阶段优先事项

1. **PWA 支持**: 添加 manifest.json 和 Service Worker，支持离线使用和添加到主屏幕。

2. **多考试模板**: 支持保存和加载不同的考试配置（不同阶段和时长），可从考试历史中加载配置。

3. **国际化 (i18n)**: 支持英文界面切换，方便非中文用户使用。

4. **数据导出**: 考试历史记录导出为 CSV/PDF 报告，包含各阶段详细数据。

5. **性能优化**: page.tsx 已超过 1300 行，建议拆分为独立组件（TimerRing、TimelineBar、HistoryDialog 等）以提升可维护性。

6. **E2E 测试**: 使用 Playwright/Cypress 编写自动化端到端测试。

## 项目完整功能清单

### 核心功能
- 7阶段自动切换倒计时（口语交际→词汇单选→阅读理解→完型填空→短文完成→英译汉→写作）
- 开始/暂停/继续/重置
- 跳过阶段（N键 + UI按钮）
- 自定义时间配置
- 阶段选择跳转
- 计时精度校准（visibilitychange + Date.now()）

### 通知与提醒
- TTS 语音提醒（10秒预警 + 阶段切换）
- AudioContext 音效（预警单音 + 结束双音 + 完成旋律）
- Browser Notification API（后台标签页通知）
- 动态 Favicon（绿/琥珀/红/对勾状态指示）

### 视觉效果
- SVG 圆形进度环（渐变描边 + 发光滤镜 + 60刻度线 + 旋转动画）
- 紧急/警告状态脉冲背景 + 文字发光
- 考试完成绿色闪烁 + 彩纸粒子雨
- 阶段切换 3D 翻转动画
- 进度条闪光渐变 + 菱形里程碑标记
- 卡片悬停升起效果
- 按钮渐变背景 + 涟漪效果 + 虚线行进动画
- Header 渐变边框 + 滚动阴影
- 暗色模式星空背景 + 内边框发光
- 工具提示淡入动画 + 延迟显示
- 移动端触觉反馈模拟
- prefers-reduced-motion 无障碍支持

### 数据功能
- Prisma + SQLite 考试历史记录（开始/完成/放弃追踪）
- 阶段级别详情（完成/跳过/未参与状态）
- 历史对话框（展开查看各阶段详情）
- localStorage 设置持久化（暗色模式/TTS/音效）

### UI/UX
- 暗色模式（系统偏好检测 + 手动切换 + 持久化）
- 全屏模式（F键 + 按钮）
- 键盘快捷键（Space/N/R/T/S/D/F/Esc）
- 移动端底部固定控制栏
- 下一阶段预览卡片
- 时间轴可视化（阶段占比 + 当前进度指示器）
- 总体进度条 + 阶段进度条
- 动态页面标题
- 重置确认弹窗

---
Task ID: 8
Agent: Feature Agent
Task: PWA Support + Exam Statistics Dashboard + Enhanced Styling

## 项目当前状态描述/判断
应用功能丰富，包括核心计时、TTS、暗色模式、键盘快捷键、跳过阶段、全屏模式、浏览器通知、自定义时间配置、考试历史记录（Prisma）、时间轴可视化、动态Favicon、大量视觉增强效果。需要新增 PWA 支持、考试统计仪表盘、增强视觉效果。

## 当前目标/已完成的修改/验证结果

### 1. PWA 支持

#### a) manifest.json
- 创建 `/public/manifest.json`
- 应用名：智能考试倒计时系统 / 考试倒计时
- 背景色 `#0f172a`，主题色 `#10b981`
- 使用 SVG 图标（支持任意尺寸）

#### b) SVG 图标
- 创建 `/public/icon.svg` - 翡翠/青绿渐变背景 + 白色时钟图标
- 创建 `/public/logo.svg` - 同上（用于浏览器通知图标）
- 包含时钟刻度、指针、顶部按钮等细节

#### c) Layout Meta 配置
- 重构 `src/app/layout.tsx`
- 添加 `<link rel="manifest" href="/manifest.json" />`
- 添加 `<meta name="theme-color" content="#10b981" />`
- 添加 Apple Touch Icon 链接
- 添加 Apple Mobile Web App 元标签（capable, statusBarStyle, title）
- 使用 Next.js `viewport` export 替代手动 meta
- 修改 `lang` 属性为 `zh-CN`

#### d) Service Worker
- 创建 `/public/sw.js`
- Cache-first 策略用于静态资源（/、manifest.json、icon.svg、logo.svg）
- Network-first 策略用于 API 调用（/api/*）
- 安装时缓存 app shell，激活时清理旧缓存
- 后台更新缓存（stale-while-revalidate）

#### e) Service Worker 注册
- 在 `page.tsx` 中添加 `useEffect` 注册 SW
- 使用 `navigator.serviceWorker.register("/sw.js")`

#### f) PWA 安装横幅
- 监听 `beforeinstallprompt` 事件
- 存储事件引用到 `installPrompt` state
- 显示翡翠绿渐变安装横幅（Framer Motion 动画）
- 包含安装按钮和关闭按钮
- 安装成功后自动隐藏

### 2. 考试统计仪表盘

#### a) 统计摘要
- 使用 `useMemo` 计算 `examStats`
- 显示在历史对话框顶部
- 统计项：总次数、完成率、平均时长、最佳阶段
- 使用 `glass-card` 样式的统计面板

#### b) 阶段完成率条形图
- 纯 CSS 条形图（无外部库）
- 每个阶段一行，显示名称 + 进度条 + 百分比
- 颜色编码：≥80% 翡翠绿、≥50% 青绿、≥30% 琥珀、<30% 红色
- 平滑过渡动画

#### c) 删除历史记录
- API: 新增 DELETE `/api/exam-history` 端点
  - 接受 `{ id: number }` 请求体
  - 调用 `db.examHistory.delete()` 删除记录
  - 返回 `{ success: true }`
- UI: 每条历史记录右侧添加垃圾桶按钮
  - 点击后显示"删除"+"取消"确认按钮（内联确认）
  - 删除成功后从列表移除，无需刷新

### 3. 增强视觉效果

#### a) Glass Morphism 玻璃态效果
- `.glass-card` 类：`backdrop-filter: blur(16px) saturate(180%)`
- 亮色模式：`rgba(255,255,255,0.7)` 背景 + 白色半透明边框
- 暗色模式：`rgba(30,41,59,0.7)` 背景 + 微透明白色边框
- 应用于：主计时卡、快速统计卡、时间轴卡、侧边栏卡、下一阶段预览卡、统计面板

#### b) 渐变网格背景
- 3 个模糊渐变圆形（blob），绝对定位 + 动画浮动
- blob-1: 翡翠绿（600px），左上方
- blob-2: 青色（500px），右侧
- blob-3: 琥珀色（400px），底部
- `mesh-float` 动画：20-25s 周期，平移 + 缩放
- 亮色模式 opacity 0.15，暗色模式 0.08
- 暗色模式使用更深色调

#### c) 计时器数字过渡动画
- `.timer-digit-container` + `.timer-digit-slide` 类
- `digit-slide-up` keyframe：从下方滑入（translateY(100%) → 0）
- 0.3s cubic-bezier 缓动

#### d) 悬停状态增强
- 侧边栏项目：`sidebar-item-highlight:hover` 增加 `scale(1.01)` + 阴影
- 快速统计卡：`.stats-card-gradient-border` 渐变边框效果
  - 使用 CSS mask 实现仅边框渐变
  - hover 时 opacity 0→1 过渡
  - 同时 translateY(-2px) + 翡翠绿阴影
- 控制按钮：`.btn-gradient-shadow` 渐变阴影
  - hover: 翡翠绿发光阴影
  - active: scale(0.98) 按压反馈

#### e) 暂停时呼吸动画
- `.timer-ring-breathing` 类
- 计时器容器在 `timer.status === "paused"` 时应用
- 2s 周期：opacity 0.6→1 + scale 0.98→1.02

#### f) Toast 通知组件
- 替代纯浏览器通知的应用内通知
- 固定在右上角，z-index 55
- 3 种类型：stage（青色）、warning（琥珀色）、complete（翡翠绿）
- Framer Motion 弹出动画（x: 80→0, scale: 0.95→1）
- 3 秒后自动消失
- 带图标：CheckCircle2、AlertCircle
- 在阶段切换、时间预警、考试完成时触发

### 验证结果
- ✅ ESLint 检查通过（0 errors, 0 warnings）
- ✅ Dev server 编译正常
- ✅ PWA manifest 正确配置
- ✅ Service Worker 注册正常
- ✅ DELETE API 端点正常
- ✅ 统计面板和条形图正确渲染
- ✅ 玻璃态效果和渐变背景正常
- ✅ 暂停呼吸动画正常
- ✅ Toast 通知弹出和自动消失正常
- ✅ 原有功能未受影响

### 修改文件
- `public/manifest.json` - 新建 PWA manifest
- `public/icon.svg` - 新建 SVG 应用图标
- `public/logo.svg` - 新建 SVG logo
- `public/sw.js` - 新建 Service Worker
- `src/app/layout.tsx` - 添加 PWA meta 标签和 manifest
- `src/app/globals.css` - 新增 glass-card、gradient-mesh、timer-digit、hover-states、breathing CSS
- `src/app/api/exam-history/route.ts` - 新增 DELETE 端点

---
Task ID: 4
Agent: Feature Agent
Task: Focus Mode, Exam Templates, Digit Animation, Share Results, Visual Polish

## 项目当前状态描述/判断
应用功能丰富，包括核心计时、TTS、暗色模式、键盘快捷键、跳过阶段、全屏模式、浏览器通知、自定义时间配置、考试历史记录（Prisma）、时间轴可视化、动态Favicon、大量视觉增强效果、PWA支持、统计仪表盘等。需要新增专注模式、考试模板、计时器数字动画、分享结果功能和更多视觉打磨。

## 当前目标/已完成的修改/验证结果

### 1. 专注模式 (Focus Mode)
- 在 header 工具栏添加 Eye/EyeOff 图标按钮切换专注模式
- 专注模式 ON 时：
  - 隐藏侧边栏（考试流程总览面板）
  - 隐藏时间轴可视化
  - 隐藏快速统计卡片
  - 仅显示主计时器卡片、简化控制和下一阶段预览
  - 计时器卡片占满宽度（`lg:col-span-3`）
  - 计时器卡片内添加 `focus-ambient-gradient` 渐变动画背景
  - 页面标题显示 "🎯 专注模式"
  - 页面副标题显示 "专注当前，一气呵成"
  - 计时器内部显示 "🎯 专注模式" 文字指示
- 键盘快捷键 M 键切换专注模式
- 专注模式偏好持久化到 localStorage（`exam-timer-focus-mode`）

### 2. 考试模板 (Exam Templates)
- 创建 `src/lib/exam-templates.ts` 定义3个考试模板：
  - **同等学力英语** (`tdxl-en`) - 7阶段：口语交际15分钟、词汇单选10分钟、阅读理解45分钟、完型填空10分钟、短文完成20分钟、英译汉20分钟、写作30分钟
  - **CET-4 大学英语四级** (`cet4`) - 4阶段：写作30分钟、听力25分钟、阅读40分钟、翻译30分钟
  - **CET-6 大学英语六级** (`cet6`) - 4阶段：写作30分钟、听力30分钟、阅读40分钟、翻译30分钟
- 每个模板包含：id, name, nameEn, description, icon, stages数组
- 修改 `exam-data.ts` 添加 `updateExamStages()` 函数动态替换 EXAM_STAGES 数组内容
- 修改 `use-exam-timer.ts` 添加 `loadStages()` 方法支持加载新阶段集合
- 在设置对话框中添加模板选择器，显示模板图标、名称、英文名、阶段数和总时长
- 选择模板时动态更新 EXAM_STAGES 并重置计时器
- 选择模板后自动关闭设置对话框并清空自定义时长

### 3. 增强计时器数字动画
- 将计时器显示拆分为单个数字，每个数字使用 `timer-digit-container` + `timer-digit-slide` 组件
- 使用 `key` 属性包含数字值，数字变化时自动触发 `slide-up` CSS 动画
- 运行时冒号（:）使用 `colon-pulse` CSS 类实现脉冲闪烁效果
- 已有的 `digit-slide-up` keyframe 动画（从下方滑入，0.3s cubic-bezier）

### 4. 分享结果功能
- 考试完成后显示"分享结果"按钮（桌面和移动端）
- 点击后生成文本摘要报告：
  - 考试类型、日期、总用时
  - 各阶段详情（状态图标、阶段名、用时/总时长、状态文字）
  - 完成率统计
- "复制文本"按钮复制到剪贴板，显示 Toast 通知 "已复制到剪贴板"
- "下载报告"按钮下载为 .txt 文件
- 报告文本在预览区可滚动查看
- 使用 `handleOpenShareDialog` 预计算分享文本避免 ref 访问问题

### 5. 视觉打磨

#### a) 阶段完成庆祝动画
- 自然完成阶段时（非跳过），侧边栏对应项添加 `stage-complete-flash` 类
- 绿色闪烁 + 缩放动画（0.6s ease-out）

#### b) 计时器环形进度完成爆发
- 当 stageProgress 达到 99.5%-100.5% 时显示环爆发动画
- `ring-burst` 类：环形边框短暂放大并淡出（0.5s ease-out）
- 使用计算属性 `showRingBurstNow` 避免状态更新问题

#### c) 侧边栏进度点
- 每个侧边栏阶段项旁添加小型 SVG 圆形进度环
- 当前阶段：实时显示阶段进度
- 已完成阶段：100% 进度
- 已跳过阶段：约30%进度
- 未开始阶段：不显示进度环
- 使用 `sidebar-progress-ring` CSS 类实现平滑过渡

#### d) Header 运行时渐变
- 考试运行时，header 背景添加 `header-running-gradient` 渐变
- 亮色模式：白色 → 微翡翠绿 → 白色
- 暗色模式：深蓝灰 → 微翡翠绿 → 深蓝灰
- 非运行时保持原有半透明白色/深色背景

#### e) 数字计数器动画
- 快速统计卡片的"已用时间"和"剩余总时间"添加 `number-flash` 类
- 数字变化时短暂高亮闪烁效果（scale + brightness 动画，0.4s）

### 6. 新增 CSS 类和动画 (globals.css)
- `focus-ambient-gradient` + `focus-ambient-drift` keyframe - 专注模式背景渐变
- `stage-complete-flash` + `stage-celebrate` keyframe - 阶段完成庆祝
- `ring-burst` + `ring-burst-anim` keyframe - 环形爆发动画
- `header-running-gradient` - Header 运行渐变
- `number-flash` + `number-highlight` keyframe - 数字高亮
- `colon-pulse` + `colon-blink` keyframe - 冒号脉冲
- `sidebar-progress-ring` - 侧边栏进度环过渡

### 7. 其他改进
- 键盘快捷键列表新增 "M 专注模式"
- Footer 快捷键提示新增 "M 专注"
- 侧边栏"总阶段"显示从硬编码 "7个阶段" 改为动态 `{EXAM_STAGES.length}个阶段`
- 设置对话框标题从"自定义时间配置"改为"考试配置"
- Header 标题在专注模式下显示 "🎯 专注模式"

### 验证结果
- ✅ ESLint 检查通过（0 errors, 0 warnings）
- ✅ Dev server 编译正常
- ✅ 原有功能未受影响
- ✅ 模板切换功能正常
- ✅ 专注模式隐藏/显示正常
- ✅ 分享结果对话框正常

### 修改文件
- `src/lib/exam-templates.ts` - 新建考试模板定义
- `src/lib/exam-data.ts` - 添加 updateExamStages() 函数
- `src/hooks/use-exam-timer.ts` - 添加 loadStages() 方法
- `src/app/globals.css` - 新增专注模式、庆祝、爆发、渐变、数字高亮等 CSS
- `src/app/page.tsx` - 专注模式、模板选择器、数字动画、分享结果、视觉打磨
- `src/app/page.tsx` - PWA 注册、安装横幅、Toast 通知、统计仪表盘、删除功能、glass-card 应用、呼吸动画

---
Task ID: 9
Agent: Main Agent
Task: QA Testing + Bug Fix + Feature Integration + Worklog Update

## 项目当前状态描述/判断
应用功能非常丰富，已包含核心计时、TTS、暗色模式、键盘快捷键、跳过阶段、全屏模式、浏览器通知、自定义时间配置、考试历史记录、时间轴可视化、动态Favicon、大量视觉增强、PWA支持、统计仪表盘、专注模式、考试模板、分享结果等功能。本轮进行 QA 测试、修复发现的 Bug、验证所有新功能。

## 当前目标/已完成的修改/验证结果

### QA 测试 (agent-browser)
1. ✅ 页面加载正常，无 hydration 错误
2. ✅ 开始/暂停/跳过/重置功能正常
3. ✅ 暗色模式切换正常
4. ✅ 考试历史记录对话框正常显示（含统计面板和条形图）
5. ✅ 时间轴可视化正常渲染
6. ✅ 动态 Favicon 正确更新
7. ✅ 设置对话框和自定义时间配置正常
8. ✅ 全屏模式切换正常
9. ✅ 键盘快捷键列表正常显示
10. ✅ API 端点正常 (GET/POST/PATCH/DELETE /api/exam-history)
11. ✅ 专注模式切换正常（M键 + 按钮）
12. ✅ 考试模板选择和切换正常（同等学力英语/CET-4/CET-6）
13. ✅ PWA 安装横幅逻辑就绪
14. ✅ 无控制台错误

### Bug 修复
1. **Duplicate `showRingBurstNow`**: 变量在第281行和第531行重复定义
   - 移除第531行的重复定义，保留第281行的原始定义
   - 修复后无编译错误，页面正常加载

### 验证结果
- ✅ ESLint 检查通过（0 errors, 0 warnings）
- ✅ Dev server 编译正常
- ✅ agent-browser 全流程测试通过
- ✅ 无运行时错误
- ✅ 无控制台错误

## 项目完整功能清单（更新版）

### 核心功能
- 7阶段自动切换倒计时（口语交际→词汇单选→阅读理解→完型填空→短文完成→英译汉→写作）
- 开始/暂停/继续/重置
- 跳过阶段（N键 + UI按钮）
- 自定义时间配置
- 阶段选择跳转
- 计时精度校准（visibilitychange + Date.now()）
- **考试模板选择**（同等学力英语/CET-4/CET-6）
- **专注模式**（M键切换，隐藏非必要元素）

### 通知与提醒
- TTS 语音提醒（10秒预警 + 阶段切换）
- AudioContext 音效（预警单音 + 结束双音 + 完成旋律）
- Browser Notification API（后台标签页通知）
- 动态 Favicon（绿/琥珀/红/对勾状态指示）
- **应用内 Toast 通知**（阶段切换/预警/完成）

### 视觉效果
- SVG 圆形进度环（渐变描边 + 发光滤镜 + 60刻度线 + 旋转动画）
- **计时器数字逐位动画** + 冒号脉冲
- **环形进度完成爆发动画**
- 紧急/警告状态脉冲背景 + 文字发光
- 考试完成绿色闪烁 + 彩纸粒子雨
- 阶段切换 3D 翻转动画
- **阶段完成庆祝动画**（侧边栏绿色闪烁）
- 进度条闪光渐变 + 菱形里程碑标记
- **玻璃态效果**（Glass Morphism）+ 渐变网格背景
- 卡片悬停升起效果 + 渐变边框
- 按钮渐变背景 + 涟漪效果 + 虚线行进动画 + 渐变阴影
- Header 渐变边框 + **运行时渐变背景** + 滚动阴影
- 暗色模式星空背景 + 内边框发光
- 暂停时呼吸动画
- 侧边栏进度点（SVG 圆形进度环）
- 数字计数器高亮动画
- 工具提示淡入动画 + 延迟显示
- 移动端触觉反馈模拟
- prefers-reduced-motion 无障碍支持

### 数据功能
- Prisma + SQLite 考试历史记录（开始/完成/放弃追踪）
- 阶段级别详情（完成/跳过/未参与状态）
- 历史对话框（展开查看各阶段详情）
- **统计仪表盘**（总次数、完成率、平均时长、最佳阶段 + 条形图）
- **删除历史记录**（内联确认）
- **分享结果**（复制到剪贴板 + 下载为 .txt）
- localStorage 设置持久化（暗色模式/TTS/音效/专注模式）

### PWA 功能
- manifest.json + SVG 图标
- Service Worker（离线缓存）
- PWA 安装横幅（beforeinstallprompt）
- Apple Mobile Web App 支持

### UI/UX
- 暗色模式（系统偏好检测 + 手动切换 + 持久化）
- 全屏模式（F键 + 按钮）
- 键盘快捷键（Space/N/R/T/S/D/F/M/Esc）
- 移动端底部固定控制栏
- 下一阶段预览卡片
- 时间轴可视化（阶段占比 + 当前进度指示器）
- 总体进度条 + 阶段进度条
- 动态页面标题
- 重置确认弹窗

## 未解决问题或风险，建议下一阶段优先事项

1. **组件拆分**: page.tsx 已超过 2031 行，建议拆分为独立组件（TimerRing、TimelineBar、HistoryDialog、SettingsDialog、ShareDialog、ToastContainer 等）以提升可维护性。

2. **国际化 (i18n)**: 支持英文界面切换，方便非中文用户使用。

3. **数据导出增强**: 考试历史记录导出为 CSV/PDF 报告，包含各阶段详细数据。

4. **多考试模板扩展**: 支持用户自定义创建和保存考试模板（自定义阶段名称、时长、顺序）。

5. **E2E 测试**: 使用 Playwright/Cypress 编写自动化端到端测试。

6. **性能优化**: 大量 CSS 动画和 Framer Motion 在低端设备上可能卡顿，建议添加性能检测和降级策略。

7. **离线体验完善**: Service Worker 缓存策略优化，确保离线时完整可用。

---
Task ID: 3-a
Agent: Feature Agent
Task: Add "Countdown-to-Start" Animation + "Exam Resume" (Auto-save State) Features

## 项目当前状态描述/判断
应用功能丰富，已有核心计时、TTS、暗色模式、键盘快捷键、跳过阶段、全屏模式、浏览器通知、自定义时间配置、考试历史记录、时间轴可视化、动态Favicon、大量视觉增强、PWA支持、统计仪表盘、专注模式、考试模板、分享结果等功能。需要完善"开始倒计时动画"和"考试状态自动保存与恢复"功能，修复已有实现中的问题。

## 当前目标/已完成的修改/验证结果

### Feature 1: Countdown-to-Start Animation (开始倒计时动画) 修复与增强

1. **CountdownOverlay 组件重构** (`src/components/timer/countdown-overlay.tsx`)
   - 移除组件内的自定义音频函数 (`playCountdownBeep`, `playGoSound`)
   - 新增 `onPlayWarningBeep` 和 `onPlayEndBeep` 回调 props，使用外部 `playBeep("warning")` 和 `playBeep("end")` 函数
   - 这样复用已有的音效系统（包括音量控制、AudioContext 单例），避免重复创建 AudioContext
   - 修复了之前 page.tsx 和 CountdownOverlay 同时播放音效导致双音的问题
   - 新增第二层扩散环动画（teal 色，延迟 0.1s），增强视觉层次感
   - 将"取消"按钮移至右下角（`absolute bottom-8 right-8`），不干扰中央倒计时视觉
   - 添加 `initialBeepRef` 防止重复播放初始音效

2. **page.tsx 倒计时逻辑修复**
   - 移除 `startCountdown()` 中的内联音频播放代码（之前重复创建 AudioContext 播放 beep）
   - 倒计时音效现在统一由 CountdownOverlay 组件通过回调触发
   - 传入 `onPlayWarningBeep={() => { if (soundEnabled) playBeep("warning"); }}` 和 `onPlayEndBeep={() => { if (soundEnabled) playBeep("end"); }}`
   - `startCountdown` 的依赖数组从 `[soundEnabled]` 简化为 `[]`

### Feature 2: Exam Resume / Auto-save State (考试状态自动保存与恢复) 修复与增强

3. **useExamTimer hook 新增 `restoreState()` 方法** (`src/hooks/use-exam-timer.ts`)
   - 新增 `restoreState(params)` 方法，可以一次性设置 `currentStageIndex`、`remainingSeconds`、`completedStages`、`status`
   - 参数类型：`{ currentStageIndex: number; remainingSeconds: number; completedStages: number[]; status: "running" | "paused" }`
   - 自动设置 `hasWarnedCurrentStage`（当 remainingSeconds ≤ 10 时为 true）
   - 自动设置 `runSegmentStart`（running 时为 `Date.now()`）和 `remainingAtSegmentStart`
   - 调用 `clearTimer()` 确保旧定时器不干扰
   - 将 `completedStages` number[] 转为 Set<number> 存储

4. **自动保存逻辑修复** (`src/app/page.tsx`)
   - 修复 `completedStages` 序列化 bug：原代码 `Array.from(timer.isStageCompleted ? [] : [])` 总是返回空数组
   - 改为直接收集已完成阶段索引：`for (i...) if (timer.isStageCompleted(i)) completedIndices.push(i)`
   - 将 `status` 类型从 `string` 改为 `"running" | "paused"`（与 SavedExamState 类型一致）
   - 移除先设置错误空数组再覆盖的两步操作，改为一步构建正确的 state 对象

5. **Resume Dialog 增强** (`src/components/timer/resume-dialog.tsx`)
   - 新增 `getStageName()` 函数，通过 `templateId` 查找对应模板获取真实阶段名称和图标
   - 当前阶段显示从"第X阶段"改为显示实际阶段名和图标（如"🎤 口语交际"）
   - 剩余时间显示考虑时间漂移：`adjustedRemaining = Math.max(0, remainingSeconds - elapsedSinceSave)`
   - 如果剩余时间已为 0 且考试在运行中，显示"已超时（将自动跳转）"
   - 新增练习模式状态显示
   - 暂停状态提示文案区分："考试暂停中，继续后将恢复到暂停时的状态"
   - `SavedExamState.status` 类型从 `string` 改为 `"running" | "paused"`

6. **恢复考试逻辑重构** (`src/app/page.tsx` - `handleResumeExam`)
   - 使用新的 `timer.restoreState()` 方法替代 `jumpToStage()` + `start()` 的组合
   - 之前的方式无法恢复 `remainingSeconds` 和 `completedStages`，现在可以完整恢复所有状态
   - 时间漂移处理增强：
     - 暂停状态：不调整时间（因为考试没有在运行）
     - 运行状态：计算 `elapsedSinceSave = Date.now() - saved.timestamp`
     - 如果当前阶段剩余时间用完，自动将当前阶段标记为已完成，进入下一阶段
     - 循环消耗各阶段时长，直到找到正确的当前阶段
     - 如果所有阶段都已完成，直接 start() 让考试结束
   - 修复 `createExamRecord` 条件：从 `!practiceMode` 改为 `!state.practiceMode`（使用保存的状态而非当前状态）

### 验证结果
- ✅ ESLint 检查通过（0 errors, 0 warnings）
- ✅ Dev server 编译正常
- ✅ 页面加载正常
- ✅ API 端点正常
- ✅ 原有功能未受影响

### 修改文件
- `src/hooks/use-exam-timer.ts` - 新增 `restoreState()` 方法
- `src/components/timer/countdown-overlay.tsx` - 重构音效系统（回调替代内部实现）、移动取消按钮、新增第二层扩散环
- `src/components/timer/resume-dialog.tsx` - 显示真实阶段名称、时间漂移显示、状态类型修正
- `src/app/page.tsx` - 修复自动保存序列化、重构恢复逻辑使用 restoreState()、修复倒计时音效重复

## 文件统计
| 文件 | 行数 | 说明 |
|------|------|------|
| src/app/page.tsx | 2031 | 主页面组件 |
| src/app/globals.css | 764 | 全局样式 |
| src/lib/exam-templates.ts | 183 | 考试模板定义 |
| src/lib/exam-data.ts | 102 | 考试阶段数据 |
| src/hooks/use-exam-timer.ts | 335 | 计时器 Hook |
| src/app/layout.tsx | 68 | 根布局 |
| public/manifest.json | 14 | PWA manifest |
| public/sw.js | 87 | Service Worker |

---
Task ID: 10
Agent: Feature Agent
Task: Practice Mode Enhancement, Volume Control, Enhanced Footer, Progress Bar Tooltip, Visual Polish

## Completed Changes

### 1. Practice Mode Enhancement
- Badge text shows "练习中" instead of "进行中" when practice mode is active
- Badge color uses amber (bg-amber-500) in practice mode
- L key shortcut for lap markers in practice mode (already existed)
- Practice mode persisted in localStorage (already existed)

### 2. Volume Control
- Module-level _volumeLevel variable (0-100) initialized from localStorage
- playBeep: all AudioContext gain nodes multiplied by volume factor
- TTS: setTTSVolume() export function, utterance.volume uses module variable
- Volume slider popup UI: Framer Motion animated glass-card panel
- Custom slider thumb styling (emerald green + shadow + hover scale)
- Volume persisted in exam-timer-volume localStorage key

### 3. Enhanced Footer
- Template name displayed in footer left side
- Practice mode indicator badge when active
- "本次已用时 XX:XX" quick stats when exam is running
- Interactive hover effects on keyboard shortcut hints

### 4. Progress Bar Rich Tooltip
- Framer Motion animated tooltip on hover
- Shows: current stage name, stage progress %, stage remaining, total remaining, estimated completion time
- Glass-card styling

### 5. Visual Polish
- Idle state: pulsing "按 Space 开始" text in timer ring
- Running indicator: green pulsing dot + LIVE text next to header title
- Card depth effect: 3-layer shadow on main timer card
- Volume slider animation CSS

### Verification
- ESLint: 0 errors, 0 warnings
- Dev server: compiling normally
- Page: returns 200
- All existing features unaffected

### Modified Files
- src/app/page.tsx
- src/hooks/use-tts.ts
- src/components/timer/timer-ring.tsx
- src/components/timer/overall-progress-bar.tsx
- src/app/globals.css

---
Task ID: 3-b
Agent: Feature Agent
Task: Add Motivational Quotes + Ambient White Noise Features

Work Log:
- Created `src/lib/quotes.ts` with 35 Chinese motivational quotes (15 古诗文, 10 名人名言, 10 现代励志语)
- Each quote has `text` and optional `author` fields
- Created `src/components/timer/ambient-sound.tsx` with Web Audio API noise generation
  - White noise: random samples
  - Pink noise: Voss-McCartney algorithm
  - Brown noise: integrated white noise
  - Coffee shop: modulated brown noise with LFO
- AmbientSound component: Headphones icon button in header, glass-card dropdown panel with 4 noise types + volume slider
- Ambient sound pauses on exam pause (fade out), resumes on exam resume (fade in), stops on idle/finished
- Ambient sound settings persisted to localStorage (exam-timer-ambient-sound, exam-timer-ambient-volume)
- Separate AudioContext for ambient (not the beep singleton) to avoid conflicts
- Added motivational quote display in timer card tips section
- Quote changes every 60 seconds during exam running
- Framer Motion AnimatePresence fade-in/fade-out animation on quote change
- Quote style: text-xs italic text-slate-400 dark:text-slate-500, non-intrusive
- Fixed ESLint error: setIsPlaying(false) in effect body → deferred with setTimeout
- Verified: ESLint 0 errors, dev server compiling, page returns 200

Stage Summary:
- 35 Chinese motivational quotes collection created
- Ambient white noise component with 4 noise types (white/pink/brown/coffee)
- Quotes shown during exam with fade transitions
- Ambient sound integrates with timer lifecycle (pause/resume/stop)
- All settings persisted to localStorage
- ESLint passing, no runtime errors

---
Task ID: 10
Agent: Main Agent
Task: QA + Component Extraction + New Features + Enhanced Styling

## 项目当前状态描述/判断
应用功能极为丰富，已有核心计时、TTS、暗色模式、键盘快捷键、跳过阶段、全屏模式、浏览器通知、自定义时间配置、考试历史记录、时间轴可视化、动态Favicon、大量视觉增强、PWA支持、统计仪表盘、专注模式、考试模板、分享结果、笔记面板、阶段转换动画、粒子轨迹等功能。本轮进行 QA 测试、组件拆分、新增功能和视觉打磨。

## 当前目标/已完成的修改/验证结果

### QA 测试 (agent-browser)
1. ✅ 页面加载正常，无 hydration 错误
2. ✅ 开始/暂停/跳过/重置功能正常（Space键 + 按钮）
3. ✅ 暗色模式切换正常
4. ✅ 专注模式切换正常（M键 + 按钮，标题显示"🎯 专注模式"）
5. ✅ 考试历史记录对话框正常（含统计面板、条形图、删除功能）
6. ✅ 设置对话框和考试模板切换正常（同等学力英语/CET-4/CET-6）
7. ✅ 笔记面板正常（打开/关闭/输入/自动保存/重新打开）
8. ✅ 音量控制滑块正常（0-100，显示当前值80）
9. ✅ LIVE 运行指示器正常
10. ✅ 无控制台错误
11. ✅ ESLint 0 errors, 0 warnings

### 组件拆分（从 2031 行 → 1219 行）
将 page.tsx 拆分为 15 个独立组件文件（src/components/timer/）：
- `confetti.tsx` (37行) - 彩纸粒子效果
- `control-buttons.tsx` (98行) - 桌面/移动端控制按钮
- `history-dialog.tsx` (269行) - 考试历史对话框 + 统计仪表盘
- `modals.tsx` (115行) - 阶段选择/重置确认/快捷键模态框
- `notes-panel.tsx` (181行) - 笔记面板 + 圈标记
- `overall-progress-bar.tsx` (164行) - 总体进度条 + 富文本提示
- `settings-dialog.tsx` (134行) - 考试配置对话框 + 模板选择
- `share-dialog.tsx` (44行) - 分享结果对话框
- `stage-sidebar.tsx` (115行) - 考试流程侧边栏 + 进度点
- `stage-transition-overlay.tsx` (73行) - 阶段转换全屏动画
- `timeline-bar.tsx` (115行) - 时间轴可视化
- `timer-particle-trail.tsx` (137行) - Canvas 粒子轨迹
- `timer-ring.tsx` (280行) - SVG 圆形进度环
- `toast-notifications.tsx` (49行) - Toast 通知系统

### 新增功能
1. **音量控制**: 点击音效按钮弹出音量滑块（0-100），影响 AudioContext 和 TTS 音量
2. **练习模式增强**: 运行时显示"练习中"琥珀色 Badge
3. **LIVE 运行指示器**: 考试运行时标题旁显示绿色脉冲圆点 + "LIVE"文字
4. **空闲状态提示**: 计时器空闲时显示脉冲的"按 Space 开始"文字
5. **富文本进度条提示**: 悬停进度条显示当前阶段、剩余时间、预计完成时间
6. **增强 Footer**: 显示模板名称、练习模式指示器、已用时统计

### 视觉打磨
7. **卡片深度效果**: 主计时卡 3 层阴影（紧密深色 + 中等翡翠色 + 宽散漫反射）
8. **Footer 闪光边框**: 匹配 Header 的渐变闪光边框
9. **音量滑块玻璃态**: 半透明背景 + 自定义翡翠色滑块样式

### 验证结果
- ✅ ESLint 检查通过（0 errors, 0 warnings）
- ✅ Dev server 编译正常
- ✅ agent-browser 全流程测试通过
- ✅ 无运行时错误
- ✅ 组件拆分后所有功能正常

## 项目完整功能清单（最终版）

### 核心功能
- 7阶段自动切换倒计时 + 考试模板选择（同等学力英语/CET-4/CET-6）
- 开始/暂停/继续/重置 + 跳过阶段
- 自定义时间配置 + 阶段选择跳转
- 计时精度校准（visibilitychange + Date.now()）
- 专注模式（M键切换）+ 练习模式
- 笔记面板（P键切换）+ 圈标记（L键）

### 通知与提醒
- TTS 语音提醒 + AudioContext 音效（可调音量）
- Browser Notification + 动态 Favicon
- 应用内 Toast 通知 + LIVE 运行指示器

### 视觉效果（30+ 效果）
- SVG 圆形进度环（渐变描边 + 发光滤镜 + 60刻度线 + 旋转动画）
- 计时器数字逐位动画 + 冒号脉冲 + 粒子轨迹
- 环形进度完成爆发 + 阶段转换全屏动画
- 紧急/警告脉冲背景 + 文字发光 + 空闲脉冲提示
- 考试完成绿色闪烁 + 彩纸粒子雨 + 3D翻转动画
- 玻璃态效果 + 渐变网格背景 + 卡片深度阴影
- 卡片悬停升起 + 渐变边框 + 按钮渐变阴影 + 涟漪效果
- Header 运行时渐变 + Footer 闪光边框
- 暗色模式星空背景 + 内边框发光 + 暂停呼吸动画
- 侧边栏进度点 + 数字高亮动画 + prefers-reduced-motion

### 数据功能
- Prisma + SQLite 考试历史记录 + 统计仪表盘 + 条形图
- 删除历史记录 + 分享结果（复制/下载）
- 音量控制 + localStorage 全部设置持久化

### PWA + UI/UX
- manifest + Service Worker + PWA 安装横幅
- 暗色/全屏/专注/练习模式
- 键盘快捷键（Space/N/R/T/S/D/F/M/L/P/Esc）
- 移动端底部控制栏 + 富文本进度条提示
- 15 个独立组件，可维护性大幅提升

## 文件统计
| 文件 | 行数 | 说明 |
|------|------|------|
| src/app/page.tsx | 1219 | 主页面（从2031→1219行，减少40%）|
| src/components/timer/*.tsx | 1810 | 15个独立组件 |
| src/app/globals.css | 865 | 全局样式 |
| src/hooks/use-exam-timer.ts | 335 | 计时器 Hook |
| src/hooks/use-tts.ts | 58 | TTS Hook（新增音量控制）|

## 未解决问题或风险，建议下一阶段优先事项

1. **国际化 (i18n)**: 支持英文界面切换，当前所有文本硬编码为中文。

2. **数据导出增强**: 考试历史记录导出为 CSV/PDF 报告。

3. **自定义模板**: 支持用户创建和保存自定义考试模板。

4. **更多考试模板**: 添加 TEM-4/TEM-8、GRE、TOEFL 等模板。

5. **E2E 测试**: 使用 Playwright 编写自动化端到端测试。

6. **离线体验完善**: Service Worker 缓存策略优化。

7. **性能优化**: 大量动画在低端设备上可能卡顿，考虑性能降级策略。

---
Task ID: 3-a
Agent: Feature Agent
Task: Add Break Timer Between Stages + Estimated Completion Time

Work Log:
- Created `src/components/timer/break-timer-overlay.tsx` - New BreakTimerOverlay component
  - Calming teal/cyan color scheme with glass-card styling
  - "休息时间" heading with Coffee icon
  - Large countdown digits with colon-pulse animation
  - SVG circular progress ring with teal gradient (distinct from main timer's emerald)
  - "跳过休息" (Skip Break) button - resumes exam immediately
  - "延长休息 +1分钟" (Extend +1 min) button - adds 60 seconds to break
  - Auto-starts next stage when break time expires
  - Gentle ascending chime sound (E5-G5-B5 sine wave) when break ends
  - Framer Motion scale/opacity entrance animation with backdrop blur
- Modified `src/app/page.tsx`:
  - Added `showBreakTimer` and `breakDuration` state (default 2 minutes, persisted to localStorage)
  - Added break duration persistence: `exam-timer-break-duration`
  - Modified stage transition tracking effect to detect natural stage completions
  - When a stage naturally ends AND breakDuration > 0 AND not practice mode AND not finished: pause exam timer and show break overlay
  - Added `handleSkipBreak` callback to dismiss break and resume exam timer
  - Integrated BreakTimerOverlay component in the render tree (z-[80])
  - Added estimated completion time display below the timer ring
    - Shows "预计完成时间: HH:MM" only when exam is running or paused
    - Calculates: Date.now() + (remaining total seconds * 1000) formatted as time
    - Updates in real-time with each render
    - Uses Clock icon, subtle text style (text-slate-400/dark:text-slate-500)
  - Passed `breakDuration` and `setBreakDuration` props to SettingsDialog
- Modified `src/components/timer/settings-dialog.tsx`:
  - Added "休息时间" (Break Time) section with 5 radio-style options
  - Options: 无休息(0), 1分钟, 2分钟(default), 3分钟, 5分钟
  - Cyan/teal selection style matching break timer theme
  - Hint text: "阶段自然完成后自动休息，跳过的阶段不触发休息"
  - Added `breakDuration` and `setBreakDuration` props to interface
  - Imported Coffee icon from lucide-react (unused but available)
- Modified `src/app/globals.css`:
  - Added `break-timer-ambient` - breathing box-shadow glow animation (3s cycle)
  - Added `break-card-entrance` - scale + translateY + box-shadow entrance animation
  - Added `estimated-time-display` - subtle opacity pulse (4s cycle)

Stage Summary:
- Break Timer feature fully implemented: configurable 0-5 min break between natural stage completions
- Estimated Completion Time display added below timer ring
- Break duration persisted to localStorage (`exam-timer-break-duration`)
- ESLint passes with 0 errors, 0 warnings
- Dev server compiles normally

---
Task ID: 3-c
Agent: Frontend Styling Expert
Task: Visual Polish and Micro-Interaction Enhancements

Work Log:
- Read worklog.md and all relevant source files (timer-ring.tsx, page.tsx, globals.css, stage-sidebar.tsx, overall-progress-bar.tsx)
- Enhanced Timer Ring Visual Effects:
  - Added pulsating inner glow ring (emerald, opacity 0.3→0.8) when running via `ring-pulsating-glow` CSS class + `inner-glow-soft` SVG filter
  - Added second hand tick animation: a glowing dot that rotates around the ring based on elapsed seconds with trailing dot
  - Added gradient sweep/shimmer on progress arc via `ring-shimmer-sweep` CSS class (brightness 1→1.2→1 cycle)
  - Added heartbeat animation when isWarning (≤10s) via `ring-heartbeat` CSS class (scale 1→1.03→1→1.02→1 mimicking heartbeat rhythm)
  - Added frozen crystal effect when paused: blue tint overlay on progress arc + `ring-frozen-crystal` CSS class with shimmer animation
- Enhanced Card Depth and Shadows:
  - Added 3D tilt effect on main timer card: `onMouseMove` calculates `rotateX/rotateY` (max 3°) based on cursor position relative to card center
  - Added layered shadow via `card-layered-shadow` CSS class (4 layers: 1px/4px/12px/24px offsets)
  - Added border glow that changes with timer state: `border-glow-running` (emerald), `border-glow-urgent` (amber), `border-glow-warning` (red), `border-glow-paused` (teal)
- Enhanced Typography & Text Effects:
  - Added text gradient on timer digits: `text-gradient-timer` (white→light gray in light, slate-100→slate-300 in dark)
  - Added animated color shift for warning/urgent: `text-color-cycle` (red→orange→red) and `text-color-cycle-urgent` (amber→orange→amber)
  - Added typewriter reveal animation for stage name: `TypewriterText` component with characters appearing one by one (0.05s delay)
  - Added superscript ordinal styling for stage number: `stage-ordinal-number` (bold, 1.1em, emerald color)
- Enhanced Progress Bar:
  - Added glowing leading edge: `progress-glow-edge` CSS with pulsing bright dot + shadow at progress edge
  - Added particle trail behind progress: tiny dots that spawn at edge and fade away via `progress-particle` CSS
  - Added milestone pulse when reached: `milestone-pulse` CSS animation on diamond markers when progress crosses them
  - Added countdown timer badge: `progress-remaining-badge` showing "剩余 XX:XX" next to progress bar header
- Enhanced Sidebar Items:
  - Changed step indicators from stage.id to numbered stepper (1, 2, 3...) using `i + 1`
  - Added connecting line between steps: `step-connector-line-segment` with completed (emerald), current (pulsing gradient), upcoming (gray) states
  - Added tooltip with stage details on hover: `sidebar-tooltip-card` showing icon, name, duration, English name, and tips
  - Added breathing border animation on current stage when paused: `breathing-border` CSS class
- Added 19 new CSS classes and animations to globals.css:
  - `card-3d-tilt`, `ring-second-hand`, `ring-heartbeat`, `text-gradient-timer`, `text-color-cycle`, `typewriter-reveal`/`typewriter-char`, `progress-glow-edge`, `step-connector-line`, `breathing-border`, `ring-pulsating-glow`, `ring-frozen-crystal`, `ring-shimmer-sweep`, `progress-particle`, `milestone-pulse`, `border-glow-*`, `stage-ordinal-number`, `sidebar-tooltip-card`, `card-layered-shadow`, `progress-remaining-badge`
  - All new animations covered by existing `@media (prefers-reduced-motion: reduce)` rule
- Ran ESLint: 0 errors, 0 warnings
- Ran Next.js build: successful compilation

Stage Summary:
- Timer ring now has pulsating inner glow, second hand dot, gradient shimmer, heartbeat on warning, and frozen crystal on pause
- Main timer card has 3D tilt on hover, layered depth shadows, and state-dependent border glow
- Timer digits have gradient text effect; warning/urgent states have animated color cycling
- Stage name uses typewriter reveal; stage number has bold emerald ordinal styling
- Progress bar has glowing leading edge, particle trail, milestone pulse, and remaining time badge
- Sidebar has numbered stepper indicators, connecting timeline lines, detail tooltips, and breathing border on current
- All 19 new CSS classes follow existing patterns and support reduced-motion preferences

---
Task ID: 11
Agent: Main Agent (Session 2 - QA + Bug Fix + New Features + Visual Enhancement)
Task: QA测试 + Bug修复 + 新功能开发 + 视觉增强

## 项目当前状态描述/判断
应用功能极为丰富，包含核心计时、TTS、暗色模式、键盘快捷键、跳过阶段、全屏模式、浏览器通知、自定义时间配置、考试历史记录、时间轴可视化、动态Favicon、大量视觉增强、PWA支持、统计仪表盘、专注模式、考试模板、分享结果、笔记面板、练习模式等。本轮进行QA测试、修复Bug、新增功能和视觉增强。

## 当前目标/已完成的修改/验证结果

### Bug 修复
1. **专注模式未隐藏总体进度条**: OverallProgressBar 在专注模式下仍可见
   - 修复: `{!focusMode && <OverallProgressBar ... />}`
2. **历史记录孤立的"进行中"状态**: 页面关闭后记录卡在 in_progress
   - 修复1: 页面加载时自动将 in_progress 记录标记为 abandoned
   - 修复2: beforeunload 事件 + 同步 XHR 将当前考试标记为 abandoned
   - QA验证: 所有孤立记录已正确清理

### 新增功能
3. **休息计时器**: 阶段自然完成后提供休息时间（break-timer-overlay.tsx）
4. **预计完成时间**: 实时显示预计完成时间 HH:MM
5. **励志语录**: 35条中文励志名言，60秒轮换（quotes.ts）
6. **白噪音**: 4种噪音类型，Web Audio API 生成（ambient-sound.tsx）

### 视觉增强
7. 计时器环: 脉冲内发光、秒针点动画、渐变扫描微光、警告心跳、暂停冰晶
8. 卡片: 3D倾斜、多层阴影、状态发光边框
9. 排版: 渐变文本、颜色循环、打字机揭示、序号样式
10. 进度条: 发光前沿、粒子尾迹、里程碑脉冲、剩余时间徽章
11. 侧边栏: 编号步骤、连接线、悬停提示、呼吸边框

### QA 验证结果
- ✅ ESLint 0 errors, 0 warnings
- ✅ Dev server 编译正常，页面加载 200
- ✅ agent-browser 全流程测试通过
- ✅ 专注模式正确隐藏进度条/侧边栏/统计/时间轴
- ✅ 孤立历史记录自动清理为"已放弃"
- ✅ 白噪音面板4种类型 + 音量滑块正常
- ✅ 暗色模式切换正常
- ✅ 无控制台错误

## 未解决问题或风险，建议下一阶段优先事项
1. **国际化 (i18n)**: 支持英文界面切换
2. **组件拆分**: page.tsx 仍然很长，建议进一步拆分
3. **数据导出增强**: CSV/PDF 报告导出
4. **自定义考试模板**: 用户自定义创建和保存模板
5. **性能模式**: 大量动画在低端设备可能卡顿
6. **实时同步**: 多设备同步考试进度

---
Task ID: 3-a
Agent: Feature Agent
Task: Add Countdown-to-Start Animation + Exam Resume (Auto-save State) Features

Work Log:
- Created `src/components/timer/countdown-overlay.tsx` - Full-screen 3-2-1 countdown animation component
  - Glass-card backdrop with stronger gradient mesh opacity
  - Large animated number (text-9xl) with Framer Motion scale+opacity animation
  - Stage icon and stage name displayed ("口语交际 即将开始")
  - Expanding pulse ring on each number change using AnimatePresence
  - Cancel button ("取消") to abort the countdown
  - Beep sounds on each number (3=440Hz, 2=523Hz, 1=659Hz) and GO sound (C5-E5-G5 triad)
  - Used useRef for isGo state to avoid ESLint set-state-in-effect errors
- Created `src/components/timer/resume-dialog.tsx` - Exam state recovery dialog
  - Uses shadcn/ui Dialog component with glass-card styling
  - Displays saved info: stage name, remaining time, when saved, exam status
  - Two buttons: "继续考试" (Resume) and "放弃并重新开始" (Discard)
  - Resume: restores state, recalculates remaining time with Date.now() drift correction
  - Discard: clears saved state, starts fresh
- Added CSS to `src/app/globals.css`:
  - `.countdown-gradient-text` - Gradient text for countdown numbers (white→emerald)
  - `.countdown-go-text` - Gradient text for "GO!" with pulse animation
  - `.countdown-number-glow` - Drop-shadow glow for numbers
  - `.resume-info-icon` - Pulsing info icon animation
  - `.resume-dialog-glass` - Glass morphism effect for resume dialog
- Integrated into `src/app/page.tsx`:
  - Added `showCountdown`, `countdownNumber`, `countdownIntervalRef` state
  - Added `showResumeDialog`, `savedExamState` state
  - Modified `handleMainButton` to trigger `startCountdown()` instead of direct timer.start()
  - `startCountdown()`: Sets countdown visible, starts 1-second interval to decrement 3→2→1→0
  - `handleCountdownEnd()`: Actually starts the exam timer and creates exam record
  - `handleCountdownCancel()`: Clears interval and hides overlay
  - Auto-save logic: Every 5 seconds during running/paused, saves to localStorage `exam-timer-saved-state`
  - Mount-time check: On component mount, checks for saved state and shows resume dialog
  - `handleResumeExam()`: Restores state with time drift correction, handles template switching
  - `handleDiscardSavedState()`: Clears saved state from localStorage
  - Clear saved state on completion, reset, and abandonment
  - Rendered `CountdownOverlay` and `ResumeDialog` components in the JSX
- Fixed ESLint errors: Replaced useState for isGo with useRef in countdown-overlay.tsx to avoid set-state-in-effect warnings

Stage Summary:
- Countdown-to-Start Animation: 3-2-1 visual+audio countdown before exam starts, with glass-card overlay, gradient text, expanding pulse rings, and cancel button
- Exam Resume / Auto-save State: Auto-saves exam state every 5 seconds to localStorage, detects and offers resume on page reload with time drift correction
- ESLint passes with 0 errors, 0 warnings
- Dev server compiles normally
- All existing functionality preserved

---
Task ID: 3-b
Agent: Feature Agent
Task: Add Export CSV + i18n Language Toggle

Work Log:
- Created API route `src/app/api/exam-history/export/route.ts` for CSV export with BOM support for Excel Chinese characters
- CSV dynamically generates columns based on max stages, includes date, status, total duration, per-stage status and elapsed time
- Added "导出CSV" (Export CSV) button in history-dialog.tsx header with Download icon, triggers file download and shows toast
- Created `src/lib/i18n.ts` with 120+ translation keys organized by section (header, timer, status, controls, sidebar, history, settings, modals, shortcuts, share, progress, timeline, break, ambient, PWA, footer, notifications, etc.)
- Added `Language` type ('zh' | 'en') and `t()` function for simple lightweight i18n
- Added `formatDate()`, `formatDateTime()`, `formatTimeShort()` helpers for locale-aware date formatting
- Added language state to page.tsx with localStorage persistence (`exam-timer-language`), default 'zh'
- Added language toggle button (Languages icon) in header toolbar, toggles between zh and en instantly
- Updated all child components to accept and use `language` prop:
  - `control-buttons.tsx` - button labels (skip, reset, share)
  - `history-dialog.tsx` - dialog title, empty state, stats labels, export CSV button, status badges, stage time labels
  - `settings-dialog.tsx` - dialog title, template labels, practice mode, break time, custom duration, apply/cancel
  - `stage-sidebar.tsx` - section headers, status text, voice/sound on/off, duration labels, tooltip content
  - `modals.tsx` - stage selection, reset confirmation, keyboard shortcuts
  - `overall-progress-bar.tsx` - overall progress, remaining, total duration, rich tooltip labels
  - `timeline-bar.tsx` - timeline title, minute abbreviation
  - `share-dialog.tsx` - share title, copy/download buttons, close
  - `timer-ring.tsx` - idle prompt, remaining/elapsed labels, stage progress, overtime, all stages completed, focus/practice indicators
  - `break-timer-overlay.tsx` - break title, subtitle, remaining, skip/extend buttons, extended info
  - `stage-transition-overlay.tsx` - stage ordinal prefix/suffix, stage name display
  - `ambient-sound.tsx` - ambient title, noise type labels/descriptions, volume label
- Replaced ALL hardcoded Chinese text in page.tsx with `t()` calls (header title/subtitle, badges, tooltips, stage status, timer labels, tips, PWA banner, page title, footer)
- When language is 'en', stage names display English (nameEn), date formats use MM/DD/YYYY instead of YYYY年MM月DD日
- Language toggle feels instant (no page reload), persisted to localStorage

Stage Summary:
- Export CSV API endpoint working: GET /api/exam-history/export returns CSV with BOM, Chinese headers, dynamic stage columns
- Export CSV button in History Dialog with toast notification "已导出CSV文件"
- i18n system: 120+ translation keys covering all UI text in both zh and en
- Language toggle button in header (Languages icon), instant switching, persisted to localStorage
- All 13 child components updated to support i18n via `language` prop and `t()` function
- Date formatting adapts to language (zh: YYYY/MM/DD, en: MM/DD/YYYY)
- ESLint passes with 0 errors, 0 warnings
- Dev server compiles normally, all existing functionality preserved

---
Task ID: 12
Agent: Main Agent (Session 3 - QA + New Features + i18n Bug Fixes)
Task: QA测试 + 新功能开发 + i18n缺陷修复

## 项目当前状态描述/判断
应用功能极为丰富，已包含核心计时、TTS、暗色模式、键盘快捷键、跳过阶段、全屏模式、浏览器通知、自定义时间配置、考试历史记录、时间轴可视化、动态Favicon、大量视觉增强、PWA支持、统计仪表盘、专注模式、考试模板、分享结果、笔记面板、练习模式、休息计时器、预计完成时间、励志语录、白噪音等。本轮进行QA测试、新增功能、修复i18n缺陷。

## 当前目标/已完成的修改/验证结果

### QA 测试 (agent-browser)
- ✅ 页面加载正常，无错误
- ✅ 考试开始/暂停/跳过/重置正常
- ✅ 暗色模式、专注模式切换正常
- ✅ 白噪音面板正常
- ✅ 3-2-1 倒计时开始动画正常
- ✅ 语言切换中英文正常
- ✅ 历史记录孤立记录自动清理
- ✅ ESLint 0 errors, 0 warnings

### 新增功能

1. **3-2-1 开始倒计时动画**: 点击"开始考试"后显示3-2-1倒计时
   - 新组件 `src/components/timer/countdown-overlay.tsx`
   - 全屏覆盖层 + 玻璃模糊效果
   - 大号数字(text-9xl) + Framer Motion scale/opacity 动画
   - 显示阶段图标和名称
   - 扩展圆环动画
   - 取消按钮
   - 倒计时数字提示音 + 开始音效

2. **考试状态自动保存与恢复**: 页面刷新/关闭后可恢复考试进度
   - 每5秒自动保存状态到 localStorage
   - 新组件 `src/components/timer/resume-dialog.tsx`
   - 恢复对话框显示阶段名、剩余时间、保存时间
   - 时间偏移校准（暂停不调时间，运行时根据Date.now()校准）
   - 超时自动进入下一阶段
   - `useExamTimer` hook 新增 `restoreState()` 方法
   - 考试完成/重置/放弃时清除保存状态

3. **导出考试历史为CSV**: 支持导出考试记录
   - 新API `src/app/api/exam-history/export/route.ts`
   - 动态生成CSV列（基于最大阶段数）
   - BOM支持Excel中文
   - 历史对话框添加"导出CSV"按钮
   - Toast通知确认

4. **中英文切换 (i18n)**: 全应用语言切换
   - 新文件 `src/lib/i18n.ts` - 130+ 翻译键
   - `t(key, lang)` 函数 + `Language` 类型
   - Header 添加 Languages 图标切换按钮
   - 13个子组件全部更新支持 language prop
   - 所有硬编码中文文本替换为 `t()` 调用

### i18n 缺陷修复

5. **ExamStage 添加 tipsEn 字段**: 所有阶段提示支持英文
   - `exam-data.ts`: 7个阶段添加 tipsEn
   - `exam-templates.ts`: 3个模板共15个阶段添加 tipsEn
   - `page.tsx`: 使用 `language === "en" ? tipsEn : tips` 显示

6. **Resume Dialog 国际化**: 修复恢复对话框硬编码中文
   - 所有文本使用 `t()` 函数
   - 添加15个 resume.* 翻译键到 i18n.ts
   - 添加 language prop

### 验证结果
- ✅ ESLint 0 errors, 0 warnings
- ✅ Dev server 编译正常
- ✅ 倒计时3-2-1动画正常（带音效）
- ✅ 语言切换即时生效
- ✅ CSV导出API返回200
- ✅ 无控制台错误

## 未解决问题或风险，建议下一阶段优先事项
1. **组件拆分**: page.tsx 仍然很长，建议进一步拆分
2. **i18n 完善**: 部分动态生成的消息（如阶段切换通知）可能仍有硬编码中文
3. **自定义考试模板**: 用户自定义创建和保存模板
4. **性能模式**: 大量动画在低端设备可能卡顿
5. **数据导出增强**: PDF报告导出
6. **多设备同步**: WebSocket实时同步考试进度

---
Task ID: 10
Agent: Main Agent (Round 5 QA + Bug Fix + Feature Enhancement)
Task: QA测试、Bug修复、新功能开发

## 项目当前状态描述/判断
应用功能非常丰富，已包含核心计时、TTS、暗色模式、键盘快捷键、跳过阶段、全屏模式、浏览器通知、自定义时间配置、考试历史记录、时间轴可视化、动态Favicon、大量视觉增强、PWA支持、统计仪表盘、专注模式、考试模板、分享结果、i18n、笔记、环境白噪音、练习模式、恢复考试、休息计时器、倒计时启动动画、动态引用等功能。本轮进行QA测试、修复已用时间计算Bug、新增主题色自定义、喝水提醒、视觉打磨和考试分析图表。

## 当前目标/已完成的修改/验证结果

### Bug 修复
1. **已用时间计算修复**: 跳过阶段时"已用时间"不再显示完整阶段时长
   - 在 `useExamTimer` hook 中新增 `totalElapsedSeconds` 字段，每次 tick 递增1
   - 新增 `stageElapsedMap` (Map<number, number>) 追踪每个阶段的实际运行秒数
   - 所有状态转换（start/reset/jumpToStage/skipStage/updateDurations/loadStages/restoreState）均正确初始化新字段
   - "已用时间"显示从 `EXAM_STAGES.reduce(...)` 改为使用 `timer.totalElapsedSeconds`
   - 分享报告文本也使用准确的 `timer.totalElapsedSeconds`
   - 每阶段已用时间使用 `timer.stageElapsedMap.get(i)` 获取

### 新增功能

2. **主题强调色自定义 (Accent Color)**:
   - 5种颜色可选：翡翠(Emerald)、琥珀(Amber)、玫瑰(Rose)、紫罗兰(Violet)、青色(Cyan)
   - CSS自定义属性方案：`data-accent="emerald"` 属性选择器驱动颜色切换
   - 定义 `--color-accent-50` 到 `--color-accent-600` + `--color-accent-from/to` 变量
   - Header 新增颜色选择器按钮，点击展开5色选项
   - 计时器环形进度SVG渐变颜色动态跟随主题色
   - 控制按钮渐变、边框、文字颜色均跟随主题色
   - 键盘快捷键 `C` 键循环切换颜色
   - localStorage 持久化 (`exam-timer-accent-color`)

3. **喝水/休息健康提醒**:
   - 可配置间隔（10/15/20/25/30分钟），默认20分钟
   - 考试运行时自动触发：Toast通知 + 温和440Hz音效 + TTS语音 + 浏览器通知
   - 不在警告/紧急状态(≤30s)或暂停时触发
   - Header 水滴按钮（Droplet图标）：开启时青色填充，关闭时灰色
   - 显示当前会话喝水次数Badge
   - 水滴下落CSS动画 (`water-drop-fall`)
   - 5秒伸展休息微型倒计时 (`🧘 伸展休息 5s`)
   - 设置对话框新增喝水提醒开关和间隔选择
   - 键盘快捷键 `W` 键手动触发
   - 分享报告新增喝水提醒次数

4. **考试趋势分析图表**:
   - 新组件 `src/components/timer/exam-analytics-chart.tsx`
   - 纯CSS/SVG条形图，最近10次考试
   - 条形高度=完成率，颜色=完成(绿)/放弃(琥珀)
   - 日期标签 + 百分比标签 + 网格线 + 图例
   - 统计摘要：平均完成率、总练习时长、最常练习阶段
   - 集成到历史对话框顶部

5. **视觉打磨增强**:
   - 玻璃态卡片悬停边框动画（边框渐变为强调色 + 发光阴影）
   - 运行中计时器卡片内部径向渐变脉冲发光 (`glass-card-running`)
   - 侧边栏激活项：左→右强调色渐变背景 + 脉冲绿色点指示器
   - 进度条闪光效果 (`progress-sparkle` - 亮点从左到右移动)
   - 卡片入场动画（交错淡入 + 上移，时间轴滑入，计时器缩放入场）
   - 页脚增强：顶部渐变微光线 + 运行中脉冲绿点 + 快捷键标签悬停缩放
   - 响应式改进：极小屏(<360px)统计卡1列，Header工具栏水平滚动

### 验证结果
- ✅ ESLint 检查通过（0 errors, 0 warnings）
- ✅ Dev server 编译正常
- ✅ agent-browser QA 全流程测试通过
- ✅ 已用时间修复验证：跳过阶段后显示实际运行秒数（非完整阶段时长）
- ✅ 主题色切换正常（5色可选，C键循环）
- ✅ 喝水提醒开关和设置正常
- ✅ 历史记录对话框含分析图表
- ✅ 无控制台错误，无页面错误

## 未解决问题或风险，建议下一阶段优先事项

1. **组件拆分**: page.tsx 仍然很长（超过1600行），建议拆分为独立组件（QuickStatsCard、TimerCard、HeaderToolbar等）
2. **i18n 完善**: 部分动态生成的消息（阶段切换通知、喝水提醒等）可能仍有硬编码中文
3. **自定义考试模板**: 用户自定义创建和保存模板（当前只有3个预设模板）
4. **性能优化**: 大量CSS动画在低端设备可能卡顿，建议添加性能模式自动检测
5. **PDF报告导出**: 生成包含图表的PDF考试报告
6. **多设备同步**: WebSocket实时同步考试进度
7. **考试模板市场**: 社区分享和下载考试模板
