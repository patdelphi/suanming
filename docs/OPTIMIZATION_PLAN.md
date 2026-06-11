# 神机阁 项目代码审查与优化计划

> 审查日期: 2026-06-11
> 项目版本: v3.1
> 审查范围: 前端代码、后端代码、构建配置、安全、数据库

---

## 一、问题总览

| 类别 | P0 (阻断/安全) | P1 (高优) | P2 (中优) | P3 (低优) | 合计 |
|------|:-:|:-:|:-:|:-:|:-:|
| **构建/配置** | 3 | 4 | 5 | 0 | 12 |
| **前端代码** | 2 | 6 | 4 | 2 | 14 |
| **后端代码** | 7 | 6 | 6 | 5 | 24 |
| **数据库** | 3 | 4 | 3 | 0 | 10 |
| **安全** | 3 | 4 | 3 | 0 | 10 |
| **合计** | **18** | **24** | **21** | **7** | **70** |

---

## 二、P0 — 必须立即修复（阻断运行 / 安全漏洞）

### 2.1 后端 `bcrypt` 未导入导致生产环境崩溃
- **文件**: `server/index.cjs:43`
- **问题**: `bcrypt.hashSync` 被调用但文件顶部未 `require('bcryptjs')`
- **影响**: 生产环境启动时创建管理员用户会抛出 `ReferenceError: bcrypt is not defined`
- **修复**: 在文件顶部添加 `const bcrypt = require('bcryptjs');`

### 2.2 qimen 路由 `logger.info/error` 运行时错误
- **文件**: `server/routes/qimen.cjs` (第159、168、231、239、348、357、409、493、590行)
- **问题**: `logger.cjs` 导出 `{ requestLogger, apiLogger, errorLogger }`，但代码调用 `logger.info()` / `logger.error()`
- **影响**: 所有带日志的奇门路由会抛出 `TypeError: logger.info is not a function`
- **修复**: 将 `logger.info` 改为 `console.log`，或在 `logger.cjs` 中导出带 `info/error` 方法的 logger 对象

### 2.3 SQL 查询引用不存在的表 `readings`
- **文件**: `server/routes/analysis.cjs` (第651、703、781、792行), `server/routes/history.cjs` (第382、387、431、471、488行)
- **问题**: 查询 `FROM readings`，实际表名是 `numerology_readings`
- **影响**: `/ai-recommendations`、`/ai-optimize-accuracy`、`/ai-stats`、`/compare`、`/batch-compare`、`/trends` 路由全部报 `SQLITE_ERROR`
- **修复**: 将所有 `readings` 替换为 `numerology_readings`

### 2.4 `comprehensive` 类型违反 CHECK 约束
- **文件**: `server/routes/analysis.cjs:441`
- **问题**: 插入 `reading_type='comprehensive'`，但 CHECK 约束只允许 `bazi/ziwei/yijing/wuxing/qimen`
- **影响**: 综合分析保存历史记录失败
- **修复**: 在数据库迁移中添加 `'comprehensive'` 到 CHECK 约束，或改用已有的合法类型

### 2.5 `dbManager.getDb()` 方法不存在
- **文件**: `server/routes/download.cjs:151`
- **问题**: 调用 `dbManager.getDb()`，但 `DatabaseManager` 只有 `getDatabase()`
- **影响**: 下载历史记录功能运行时崩溃
- **修复**: 改为 `dbManager.getDatabase()`

### 2.6 前端 API Key 硬编码泄露
- **文件**: `src/config/aiConfig.ts:14`
- **问题**: `apiKey: import.meta.env.VITE_AI_API_KEY || 'dee444451bdf4232920a88ef430ce753.Z4SAbECrSnf5JMq7'`
- **影响**: API Key 泄露到代码仓库
- **修复**: 移除硬编码 fallback，环境变量未设置时抛出明确错误或使用空字符串

### 2.7 `typescript: ^6.0.3` 版本不存在
- **文件**: `package.json:119`
- **问题**: TypeScript 6 未发布，`npm ci` 可能失败
- **修复**: 改为 `^5.6.2`（与 README 一致）

### 2.8 `.dockerignore` 排除构建必需文件
- **文件**: `.dockerignore`
- **问题**: 排除了 `vite.config.ts`、`tsconfig*.json`，但 `npm run build:prod` 需要它们
- **修复**: 从 `.dockerignore` 中移除这些文件

### 2.9 `tailwindcss: v3.4.16` 版本格式错误
- **文件**: `package.json:117`
- **问题**: 包名带 `v` 前缀，npm 可能无法正确解析
- **修复**: 改为 `3.4.16`（去掉 `v`）

---

## 三、P1 — 高优先级（架构/维护/安全）

### 3.1 前端重复组件清理

| 组件 | 行数 | 状态 | 建议 |
|------|------|------|------|
| `ComprehensiveBaziAnalysis.tsx` | 481 | **完全未使用** | 删除 |
| `BaziAnalysisDisplay.tsx` | 976 | 仅被导入但未调用 | 删除，清理 `AnalysisResultDisplay` 中的导入 |
| `CompleteBaziAnalysis.tsx` | 1251 | 实际使用 | 保留，拆分大组件 |

**操作**: 删除前两个文件，统一使用 `CompleteBaziAnalysis`。

### 3.2 五行配置/辅助函数统一抽取

以下配置在 5+ 个文件中重复定义:
- `elementColors`、`elementSymbols`、`wuxingColors`、`yinyangColors`
- `getBranchElement`、`getStemYinYang` 等辅助函数
- `safeGet`、`safeRender` 工具函数

**操作**: 创建 `src/lib/wuxingConfig.ts`，统一导出，各组件引用。

### 3.3 后端 qimenAnalyzer 重复方法清理

`QimenAnalyzer` 类中有大量方法被 `QimenCalculator` 覆盖:
- `getWuXingRelation` (第262行 vs 第1135行)
- `getGanZhiWuXing` (第274行 vs 第1160行)
- `isSanQi` (第288行 vs 第1169行)
- `getPalaceName` (第252行 vs 第1187行)
- `calculateTiming` (第646行 vs 第2254行)
- `getCurrentSeason` (3个版本)

**操作**: 删除 `QimenAnalyzer` 中被覆盖的旧方法，统一使用 `QimenCalculator` 的实现。

### 3.4 qimen 路由添加认证中间件
- **文件**: `server/routes/qimen.cjs`
- **问题**: 所有路由未使用 `authenticate` 中间件，任何人可调用并写入数据库（硬编码 `userId=1`）
- **修复**: 为所有需要写入数据库的路由添加 `authenticate`

### 3.5 路由顺序修复
- **文件**: `server/routes/history.cjs`
- **问题**:
  - `GET /stats/summary` 在 `GET /:id` 之后，`'stats'` 被当作 id
  - `GET /search/:query` 在 `GET /:id` 之后，`'search'` 被当作 id
  - `DELETE /`（批量删除）在 `DELETE /:id` 之后，永远无法匹配
- **修复**: 将固定路径路由移到参数路由之前

### 3.6 异步错误捕获统一
- **文件**: `server/routes/download.cjs`、`server/routes/aiInterpretation.cjs`
- **问题**: 使用原始 `async` 函数，异步错误不被全局处理器捕获
- **修复**: 用 `asyncHandler` 包装所有异步路由处理器

### 3.7 TypeScript 严格模式
- **文件**: `tsconfig.app.json`
- **问题**: `noImplicitAny`、`noUnusedLocals` 等全部 `false`，类型安全形同虚设
- **修复**: 逐步开启，先开 `noUnusedLocals` + `noUnusedParameters`，清理后再开 `noImplicitAny`

### 3.8 后端 `schema.sql` 清理
- **文件**: `server/database/schema.sql`
- **问题**: 与 `migrations/0001_initial_schema.sql` 完全重复，且未被引用
- **修复**: 删除 `schema.sql`

### 3.9 `InputValidator` 大量未使用方法
- **文件**: `server/utils/inputValidator.cjs`
- **问题**: 定义了 16+ 个验证方法，实际只用了 3 个基础方法
- **修复**: 删除未使用的高级验证方法，或在路由中实际接入

### 3.10 `analysis.cjs` 中 `bazi-details`/`bazi-wuxing` 性别硬编码
- **文件**: `server/routes/analysis.cjs:529, 561`
- **问题**: `gender` 硬编码为 `'male'`
- **修复**: 从请求体中读取性别参数

---

## 四、P2 — 中优先级（代码质量/一致性）

### 4.1 前端 UI 组件库统一
- `WuxingAnalysisPage` 和 `BaziDetailsPage` 使用旧版 `Button`/`Card`
- 其他页面使用 `ChineseButton`/`ChineseCard`
- **修复**: 统一使用 Chinese* 系列组件，删除旧版组件文件

### 4.2 `API_BASE_URL` 重复计算
- `aiInterpretationService.ts` 中定义了 3 次
- **修复**: 复用 `localApi.ts` 中的配置

### 4.3 组件内常量提取到模块外
- `elementColors`、`tenGodColors`、`yongShenNameMap` 等在组件函数内定义
- **修复**: 提取为模块级常量或独立配置文件

### 4.4 `window.location.reload()` 反模式
- 4 个分析组件的重试按钮使用 `window.location.reload()`
- **修复**: 改用 React 状态重置

### 4.5 响应格式统一
- 各路由返回格式不一致: `{data:{...}}`、`{success:true,data:{...}}`、直接返回 Buffer
- **修复**: 统一为 `{success: boolean, data?: {...}, error?: {code, message}}`

### 4.6 纳音五行表重复
- `baziAnalyzer.cjs` 和 `ziweiAnalyzer.cjs` 各定义一次
- **修复**: 提取到 `common/BaseData.cjs`

### 4.7 天干地支映射重复
- `qimenAnalyzer.cjs` 和 `BaseData.cjs` 各定义一次
- **修复**: 统一使用 `BaseData.cjs`

### 4.8 JSON 解析重复代码
- `history.cjs` 中 3 处几乎相同的 JSON 解析逻辑
- **修复**: 提取为公共函数

### 4.9 `CleanupExpiredSessions` 重复调度
- `auth.cjs` 和 `database/index.cjs` 各有一套
- **修复**: 统一在 `database/index.cjs` 中管理

### 4.10 `Numeric/limit` 未转整数
- `download.cjs`、`aiInterpretation.cjs` 中 query string 参数未 `parseInt()`
- **修复**: 添加参数类型转换

### 4.11 qimen 重复路由注册
- `POST /api/qimen/analyze` 注册两次
- **修复**: 删除第二个（第186行），保留完整的第一个

### 4.12 端口配置统一
- `.env.example` 用 3001，Dockerfile/docker-compose 用 8000
- **修复**: 统一端口配置，文档说明差异

---

## 五、P3 — 低优先级（代码整洁）

### 5.1 ErrorBoundary 拼写错误
- `searilizeError` → `serializeError`

### 5.2 ErrorBoundary 中英文混用
- "Something went wrong." → 改为中文

### 5.3 `StrictMode` 缺失
- `main.tsx` 未用 `<StrictMode>` 包裹

### 5.4 `hooks/use-mobile.tsx` 扩展名错误
- 无 JSX 代码，应为 `.ts`

### 5.5 `localApi.ts` 三元表达式冗余
- `koyeb.app` 和非 `koyeb.app` 返回相同值

### 5.6 `docker-compose.yml` 的 `version: '3.8'` 已废弃

### 5.7 `NumerologyReading` 与 `AnalysisRecord` 类型重复
- 两个接口字段高度重叠

---

## 六、建议执行顺序

### 第一阶段: 修复阻断问题 (P0)
预计耗时: 2-3小时
1. 修复 `bcrypt` 导入
2. 修复 `logger` 调用
3. 修复 `readings` → `numerology_readings`
4. 修复 `comprehensive` CHECK 约束
5. 修复 `dbManager.getDb()`
6. 移除硬编码 API Key
7. 修复 `typescript` 版本号
8. 修复 `.dockerignore`
9. 修复 `tailwindcss` 版本号

### 第二阶段: 架构清理 (P1)
预计耗时: 1-2天
1. 删除死代码组件
2. 统一五行配置/辅助函数
3. 清理 qimenAnalyzer 重复方法
4. 添加 qimen 认证中间件
5. 修复路由顺序
6. 统一异步错误捕获
7. 开启 TypeScript 严格检查
8. 清理未使用代码

### 第三阶段: 质量提升 (P2)
预计耗时: 2-3天
1. 统一 UI 组件
2. 统一响应格式
3. 消除重复定义
4. 参数类型转换
5. 端口统一

### 第四阶段: 代码整洁 (P3)
预计耗时: 半天
1. 拼写修正
2. 语言统一
3. 类型清理

---

## 七、涉及文件清单

### 需要修改的文件
| 文件 | 修改类型 |
|------|---------|
| `server/index.cjs` | 修复 bcrypt 导入、统一健康检查 |
| `server/routes/qimen.cjs` | 修复 logger、添加认证、删除重复路由 |
| `server/routes/analysis.cjs` | 修复表名、CHECK 约束、性别硬编码 |
| `server/routes/history.cjs` | 修复表名、路由顺序、JSON 解析 |
| `server/routes/download.cjs` | 修复 getDb()、参数转换 |
| `server/routes/aiInterpretation.cjs` | 添加 asyncHandler、参数转换 |
| `server/services/qimenAnalyzer.cjs` | 删除重复方法 |
| `server/utils/inputValidator.cjs` | 删除未使用方法 |
| `server/middleware/logger.cjs` | 添加 info/error 方法 |
| `src/config/aiConfig.ts` | 移除硬编码 API Key |
| `src/components/AnalysisResultDisplay.tsx` | 删除死导入 |
| `src/lib/wuxingConfig.ts` | **新建** - 统一五行配置 |
| `tsconfig.app.json` | 开启严格检查 |
| `package.json` | 修复版本号、清理依赖 |
| `.dockerignore` | 移除构建必需文件 |
| `tailwind.config.js` | 修复 CJS/ESM |
| `docker-compose.yml` | 统一端口、移除 version |

### 需要删除的文件
| 文件 | 原因 |
|------|------|
| `src/components/ComprehensiveBaziAnalysis.tsx` | 完全未使用 |
| `src/components/BaziAnalysisDisplay.tsx` | 未被实际调用 |
| `server/database/schema.sql` | 与 migration 重复 |

---

*审查完成。请审阅后确认执行计划。*
