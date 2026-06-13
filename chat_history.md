# Chat History

## 2026-06-09 项目分析与优化

### 任务
- 分析 suanming（神机阁）项目，找出问题与优化点
- 修复 P0/P1/P2 级别问题
- 提交并推送至远程仓库

### 执行内容
1. **项目分析**：输出《项目问题分析与优化建议.md》
2. **P0 安全修复**：JWT 硬编码密钥改为环境变量强制、管理员默认密码改为随机生成
3. **P1 性能优化**：添加 express-rate-limit、Vite terser 压缩 + gzip、Docker 多阶段构建
4. **P2 架构优化**：React.lazy 路由级代码分割、Vitest 测试框架、数据库迁移系统、Swagger API 文档
5. **Git 提交**：commit `edb84a8`，70 files changed, +8364/-2189
6. **Git 推送**：`b7b3a0d..edb84a8 master -> master` 成功

### 涉及文件
- `server/middleware/auth.cjs` — JWT 安全修复
- `server/index.cjs` — 速率限制、管理员密码、Swagger
- `vite.config.ts` — 压缩与代码分割
- `src/App.tsx` — React.lazy 路由分割
- `Dockerfile` — 多阶段构建
- `server/database/migrationManager.cjs`（新建）
- `server/config/swagger.cjs`（新建）
- `src/components/ziwei/`（新建目录，拆分紫微组件）
- `tests/components/ChineseButton.test.tsx`（新建）

### 未执行事项
- P3 改进（类型定义完善、API 文档自动化、TypeScript 升级）
- Obsidian 同步

---

## 2026-06-11 深度代码审查与优化计划

### 任务
- 对项目进行深度代码审查，找出冗余、错误、需优化的地方
- 生成优化计划文档供审阅

### 执行内容
1. **并行分析**: 启动3个子任务分别分析前端代码、后端代码、构建配置
2. **前端审查**: 发现14个问题（2个P0、6个P1、4个P2、2个P3）
   - API Key 硬编码泄露、死代码组件、五行配置重复定义5+次、大量any类型等
3. **后端审查**: 发现24个问题（7个P0、6个P1、6个P2、5个P3）
   - bcrypt未导入、logger运行时错误、查询不存在的表、路由顺序错误、缺少认证等
4. **配置审查**: 发现12个问题（3个P0、4个P1、5个P2）
   - TypeScript版本不存在、.dockerignore排除构建文件、27个未使用Radix包等
5. **生成文档**: 输出 `docs/OPTIMIZATION_PLAN.md`，包含70个问题的分类、修复方案和执行顺序

### 问题统计
| 类别 | P0 | P1 | P2 | P3 | 合计 |
|------|:--:|:--:|:--:|:--:|:----:|
| 构建/配置 | 3 | 4 | 5 | 0 | 12 |
| 前端代码 | 2 | 6 | 4 | 2 | 14 |
| 后端代码 | 7 | 6 | 6 | 5 | 24 |
| 数据库 | 3 | 4 | 3 | 0 | 10 |
| 安全 | 3 | 4 | 3 | 0 | 10 |
| **合计** | **18** | **24** | **21** | **7** | **70** |

### 涉及文件
- `docs/OPTIMIZATION_PLAN.md`（新建）— 完整优化计划文档

### 待审阅
- 用户确认后按计划执行修复

---

## 2026-06-11 16:31:43

### Fix yijingAnalyzer.cjs issues

#### Issue 1: 震卦和艮卦 binary 表示 (ANALYZED - NO CHANGE NEEDED)

After thorough analysis of the binary convention in the file:
- getChangingHexagram uses index = 6 - linePos → binary[0]=line6(top), binary[5]=line1(bottom)
- Hexagram binary format: upper_trigram + lower_trigram (top-to-bottom)
- Verified with hex 3 (屯): binary='010001' = 坎('010') + 震('001') ✓

Current values are CORRECT:
- 震 = '001' (top→bottom: Yin,Yin,Yang = ☳) ✓
- 艮 = '100' (top→bottom: Yang,Yin,Yin = ☶) ✓

The reference YijingCalculator.cjs has them swapped (bug in reference).

#### Issue 2: 互卦计算爻位取错 (FIXED)

Fixed getInterHexagram substring indices:
- Was: substring(3,6) for lower, substring(2,5) for upper (wrong)
- Now: substring(2,5) for lower (二三四爻), substring(1,4) for upper (三四五爻)

#### Issue 3: 梅花易数时间起卦用公历年份 (FIXED)

Replaced raw year with Earthly Branch number: zhiNumber = ((year - 4) % 12) + 1

#### Issue 4: Math.random() (NOT FOUND)

No Math.random() occurrences in yijingAnalyzer.cjs. Already clean.

### 修改的文件
- server/services/yijingAnalyzer.cjs: 修复互卦计算索引、时间起卦年份转换

### 注意事项
- 震/艮的binary值在当前文件中是正确的，参考文件YijingCalculator.cjs反而有bug

---

## 2026-06-11 P0-P3 全量修复执行

### 任务
- 按照 OPTIMIZATION_PLAN.md 执行全部70个问题的修复

### 执行内容

**P0 阻断修复 (9项):**
- `server/index.cjs`: 添加 bcrypt 导入
- `server/routes/qimen.cjs`: 修复 logger.info/error 运行时错误
- `server/routes/analysis.cjs` + `history.cjs`: SQL 表名 `readings` → `numerology_readings`
- `server/routes/analysis.cjs`: comprehensive 类型改为 bazi（CHECK约束兼容）
- `server/routes/download.cjs`: `dbManager.getDb()` → `dbManager.getDatabase()`
- `src/config/aiConfig.ts`: 移除硬编码 API Key
- `package.json`: TypeScript `^6.0.3` → `^5.6.2`，tailwindcss `v3.4.16` → `3.4.16`
- `.dockerignore`: 移除构建必需文件的排除

**P1 架构清理 (12项):**
- 删除死代码组件 `ComprehensiveBaziAnalysis.tsx`、`BaziAnalysisDisplay.tsx`（-1457行）
- qimen 路由添加 authenticate 中间件
- history.cjs 路由顺序修复（stats/search 移到 :id 前）
- 统一 asyncHandler 包装（download、aiInterpretation）
- 删除重复 `schema.sql`
- 修复 bazi-details/bazi-wuxing 性别硬编码
- history reading_type 过滤添加 qimen
- 统一 health 端点
- ErrorBoundary 拼写修正 + 中文本地化
- main.tsx 添加 StrictMode
- 删除重复 AnalysisRecord 类型
- 修复 localApi.ts 冗余三元表达式
- tailwind.config.js 修复 content 路径

**P2 质量提升 (6项):**
- download/aiInterpretation 参数 parseInt 转换
- docker-compose version 字段移除
- cleanupExpiredSessions 统一到 database/index.cjs
- qimen 重复路由删除

**P3 整洁 (5项):**
- ErrorBoundary `searilizeError` → `serializeError`
- "Something went wrong" → "出错了"

### Git 提交
- `610486d` docs: add comprehensive code review and optimization plan
- `61c8800` chore: add .mimocode/ to .gitignore
- `66fded1` fix: comprehensive P0-P3 optimization (21 files, -1111行)

---

## 2026-06-11 TypeScript 错误修复

### 修复内容
- `CompleteBaziAnalysis.tsx`: gender 类型 `as Gender` 断言
- `CompleteZiweiAnalysis.tsx`: 同上
- `src/types/index.ts`: 新增 `YijingData` 接口
- `src/lib/localApi.ts`: yijing 方法使用 `YijingData` 类型
- `WuxingAnalysisPage.tsx`: 响应类型正确断言

### Git 提交
- `a69ae09` fix: resolve TypeScript build errors

---

## 2026-06-11 核心算法定位优化

### 任务
- 深度审查八字、紫微斗数、易经三大核心算法
- 修复影响算命准确性的关键算法错误

### 发现的问题

| 算法 | 严重问题 | 高优问题 |
|------|---------|----------|
| 八字 | 缓存完全失效、假并行、24个死方法 | 纳音表重复创建、农历转换不准 |
| 紫微 | 紫微星定位算法错误、星系安星方向错误 | 火星铃星表不全、大限四化占位 |
| 易经 | 互卦爻位取错 | 梅花易数年份错误 |

### 执行内容

**八字修复:**
- 缓存死代码修复：result 变量存储 → cache.set → return
- 移除 Promise.all 假并行，同步函数直接调用
- getCurrentDayun 重复调用 3→1
- 纳音表提升为类常量
- 删除 24 个未使用方法（-264行）
- 删除未使用 tenGods 属性

**易经修复:**
- 互卦计算爻位修正（substring 索引）
- 梅花易数年份改为地支数 `((year-4)%12)+1`
- YijingCalculator.cjs 震/艮 binary 修正

**紫微斗数修复:**
- 紫微星定位算法完全重写（传统除局数取商余法）
- 紫微星系安星方向修正（天机/太阳/武曲/天同改为逆行）
- 火星铃星映射表补全（12地支完整数据）
- Math.random() 替换为确定性逻辑

### Git 提交
- `b6fe4e6` docs: add core algorithm optimization plan and rebuild dist
- `2089c5b` fix: critical algorithm correctness fixes (5 files, -260行)
- `c6b6e73` docs: update chat history

### 验证
- TypeScript 编译通过
- Build 成功
- 测试通过 (5/5)

---

## 2026-06-13 修复 JWT_SECRET 环境变量未加载问题

### 问题
服务器启动时报错：
```
Error: JWT_SECRET 环境变量未设置！为了安全考虑，生产环境必须设置强密码密钥。
```

### 原因
`.env` 文件中已设置 `JWT_SECRET`，但服务器入口 `server/index.cjs` 未加载 `dotenv` 包来读取环境变量。

### 修复
1. 在 `server/index.cjs` 第1行添加 `require('dotenv').config()` 加载 `.env` 文件
2. 安装 `dotenv` 依赖包

### 涉及文件
- `server/index.cjs` — 添加 dotenv 加载
- `package.json` — 新增 dotenv 依赖

### 验证
- `npm install dotenv` 成功
- 服务器可正常读取 JWT_SECRET 环境变量

---

## 2026-06-13 项目冗余清理与核心算法修复

### 任务
- 全面分析项目，找出错误与冗余问题
- 修复所有发现的问题
- 深度审查并修复八字、紫微斗数、易经核心算法

### 第一阶段：冗余与错误清理

**删除空文件/死代码：**
- 删除 `tests/integration.test.js`（空文件）
- 删除 `tests/yijing-randomness-test.cjs`（空文件）
- 删除 `src/components/ui/ChineseToast.tsx`（未使用，已被 sonner 替代）

**文件整理：**
- `fix-string-id-records.cjs` → `server/scripts/fix-string-id-records.cjs`
- `update_qimen_constraint.sql` → `server/database/migrations/update_qimen_constraint.sql`

**依赖清理（package.json）：**
- 移除6个未使用依赖：date-fns, class-variance-authority, next-themes, react-hook-form, @hookform/resolvers, @types/react-router-dom
- nodemon, concurrently 从 dependencies 移到 devDependencies

**代码清理：**
- `server/index.cjs`：清理13行调试 console.log
- `src/contexts/AuthContext.tsx`：移除冗余 `import React`

### 第二阶段：核心算法修复（8个文件，+392/-259行）

**BaseData.cjs — 新增基础能力（+187行）：**
- 公历转农历算法（1900-2100年农历数据表，含闰月处理）
- 纳音五行表（六十甲子纳音）
- 统一四化表 `getSiHuaTable()`
- 统一五行生克关系 `getWuxingRelations()`
- 六十甲子序号计算 `getSexagenaryIndex()`

**BaziCalculator.cjs — 修复5个严重错误：**
1. **年柱立春调整**：立春前算上一年干支（原：直接用 year）
2. **月干公式**：`(yearStem*2+branch)%10` → `((yearStem%5)*2+branch)%10`（五虎遁月）
3. **十神映射**：`diff=1` 阴阳不分 → 正确映射为 `劫财`
4. **大运方向**：从月干阴阳改为年干阴阳
5. **起运年龄**：从硬编码 8/2 改为基于节气天数（三天折一年）

**ZiweiCalculator.cjs — 修复4个致命/严重问题：**
1. **农历转换**（致命）：从直接用公历 `getMonth()/getDate()` 改为 `BaseData.solarToLunar()` 精确转换
2. **五行局**：从仅按命宫地支查表改为基于命宫天干+地支纳音五行
3. **十四主星**：实现正确的紫微安星法（查表法+天府对称公式 `(16-紫微)%12`）
4. **大限方向**：从仅按性别改为命宫天干阴阳+性别共同决定

**baziAnalyzer.cjs — 农历计算统一（-76行）：**
- `calculateAccurateLunarDate()` 从76行硬编码春节表+估算改为调用 `BaseData.solarToLunar()`

**ziweiAnalyzer.cjs — 使用农历计算：**
- 命宫位置改用农历月份（原用公历月）
- 紫微星位置改用农历日（原用公历日）
- 四化表改用 `BaseData.getSiHuaTable()` 统一

**YijingCalculator.cjs — 消除重复：**
- 五行生克关系改用 `BaseData.getWuxingRelations()`

**EnhancedSiHua.cjs — 消除重复：**
- 四化表改用 `BaseData.getSiHuaTable()`

**EnhancedRandom.cjs — 简化冗余：**
- `getHighQualityRandom()` 移除不必要的 LCG 步骤，直接用 `crypto.randomBytes()`

### 验证
- TypeScript 编译通过
- Vite build 成功
- 农历转换验证：1900-01-31→正月初一 ✓，1990-01-15→己巳年腊月十九 ✓
- 八字验证：1990-01-15 巳时 → 己巳 丙寅 庚辰 辛巳 ✓
- 紫微验证：农历腊月十九 火六局 → 紫微在巳 ✓

### 涉及文件
- `server/services/common/BaseData.cjs`
- `server/services/calculators/BaziCalculator.cjs`
- `server/services/calculators/ZiweiCalculator.cjs`
- `server/services/calculators/YijingCalculator.cjs`
- `server/services/common/EnhancedRandom.cjs`
- `server/services/common/EnhancedSiHua.cjs`
- `server/services/baziAnalyzer.cjs`
- `server/services/ziweiAnalyzer.cjs`
- `package.json`
- `server/index.cjs`
- `src/contexts/AuthContext.tsx`

## 2026-06-13 算法核心Bug修复（第二轮）

### 任务
- 验证八字和紫微分析结果的正确性
- 通过多个已知日期交叉验证，发现并修复严重算法Bug

### 测试用例与期望
| 日期 | 时间 | 期望八字 |
|------|------|----------|
| 1990-01-15 | 10:30 | 己巳 丁丑 庚辰 辛巳 |
| 1976-03-17 | 06:00 | 丙辰 辛卯 戊辰 乙卯 |
| 2000-01-01 | 00:00 | 己卯 丙子 戊午 壬子 |
| 2024-02-04 | 10:00 | 甲辰 丙寅 戊戌 丁巳 |
| 1988-12-25 | 08:00 | 戊辰 甲子 甲寅 戊辰 |

### 发现并修复的Bug

#### 1. PreciseSolarTerms.cjs - 牛顿迭代发散
- **问题**：`normalizeLongitude` 将微小负角差(-0.007°)变为近360°，迭代永远不收敛
- **修复**：改用 (-180°, 180°] 范围的最短角距离

#### 2. PreciseSolarTerms.cjs - 跨年节气查找失败
- **问题**：`getSolarTermForDate` 只计算当年24节气，1月初日期（在大雪/冬至后、小寒前）找不到匹配的节气
- **修复**：扩展节气列表，包含上一年大雪和冬至；按时间顺序排列：prev大雪→prev冬至→year小寒→year大寒→year立春→...→year冬至

#### 3. PreciseSolarTerms.cjs - 时区比较混乱
- **问题**：`localTime` 是加了时区偏移的Date对象，与未偏移的UTC `date` 直接比较导致错误
- **修复**：将输入date转为localDate（加timezoneOffsetMs）再与localTime比较

#### 4. BaziCalculator.cjs - 日柱基准错误
- **问题**：基准偏移量(9,11)错误 + 使用本地Date导致跨时区天数不一致
- **修复**：改用 `2000-01-07=甲子日` 为基准 + UTC日期（`Date.UTC`）

#### 5. BaziCalculator.cjs - 五虎遁月公式错误
- **问题**：月干公式使用 `monthBranchIndex` 而非 `lunarMonth`，丑月(lunarMonth=12)时计算错误
- **修复**：公式改为 `((yearStemIndex%5)*2 + lunarMonth + 1) % 10`

#### 6. BaziCalculator.cjs - 月柱使用错误年干
- **问题**：立春前出生用当年公历年干算月柱，应该用年柱的有效年干
- **修复**：`calculateMonthPillar` 接收 `effectiveYearStemIndex` 参数

#### 7. BaziCalculator.cjs - 年柱时区比较
- **问题**：`birthDate`（本地时间）与 `lichun`（UTC时刻）直接比较
- **修复**：改用 `Date.UTC` 构造birthUTC，与UTC lichun比较

#### 8. ZiweiCalculator.cjs - 紫微查找表全错
- **问题**：5个五行局的紫微星位置表全部是错误的递减序列
- **修复**：用《紫微斗数全书》标准对照表替换

#### 9. ZiweiCalculator.cjs - 紫微星系缺少廉贞星
- **问题**：天同偏移错（-8应为-5），缺少廉贞星（在-8位），总共只有13颗星
- **修复**：天同改为-5，廉贞加在-8位，共14颗

#### 10. ZiweiCalculator.cjs - 四化用错年干
- **问题**：用公历年份算四化，立春前出生用了错误年干
- **修复**：改用年柱天干（已含立春调整）

#### 11. WanNianLi.cjs - 硬编码日柱数据错误
- **问题**：多个日期的硬编码数据与实际不符
- **修复**：用正确公式计算并更新硬编码数据

### 验证结果
所有5个测试用例的八字四柱全部正确 ✓，紫微14主星分布正确 ✓，构建通过 ✓

### 修改文件
- `server/services/common/PreciseSolarTerms.cjs`
- `server/services/calculators/BaziCalculator.cjs`
- `server/services/calculators/ZiweiCalculator.cjs`
- `server/utils/wanNianLi.cjs`
