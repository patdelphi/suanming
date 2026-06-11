# 核心算法定位优化计划

> 创建日期: 2026-06-11
> 基于深度代码审查的算法正确性修复方案
> 优先级: 正确性Bug > 性能 > 代码质量

---

## 一、执行摘要

| 阶段 | 影响范围 | 预估工时 | 风险等级 |
|------|---------|---------|---------|
| Phase 1: 紫微斗数核心算法修复 | ziweiAnalyzer.cjs | 6-8h | 高（算法重构） |
| Phase 2: 易经卦象数据修复 | yijingAnalyzer.cjs | 4-6h | 中（数据补全） |
| Phase 3: 八字分析器修复 | baziAnalyzer.cjs | 3-4h | 低（bug修复） |
| Phase 4: 共享工具统一 | calculators/ + common/ | 2-3h | 中（架构调整） |
| **合计** | | **15-21h** | |

---

## 二、Phase 1: 紫微斗数核心算法修复（最高优先级）

### 1.1 紫微星定位算法完全错误

**文件**: `server/services/ziweiAnalyzer.cjs:498-526`
**问题**: 当前实现使用 `(day-1) % 12` 加 juNumber 偏移，这是完全错误的。传统紫微斗数紫微星定位需要使用「除局数取商余」法。

**正确算法**:
```
紫微星定位口诀：
设生日数为 D，五行局数为 N
1. D ÷ N，若整除则商数 Q = D/N，余数 R = 0
2. 若不能整除，向上取整 Q = ceil(D/N)，R = Q*N - D
3. 紫微星位置 = 寅宫起数 Q 位（顺时针），再根据余数 R 调整
```

**修复方案**:
```javascript
// 替换 calculateZiweiStarPosition 方法
calculateZiweiStarPosition(day, juNumber) {
  // 传统紫微星定位算法：除局数定宫位
  const quotient = Math.floor(day / juNumber);
  const remainder = day % juNumber;
  
  // 紫微星从寅宫起数，顺行 quotient 位
  // 寅=2, 卯=3, 辰=4, ..., 子=0, 丑=1
  let position = (2 + quotient) % 12;
  
  // 余数不为0时，需要调整
  if (remainder !== 0) {
    // 余数为奇数顺行，偶数逆行
    const adjust = Math.floor(remainder / 2);
    if (remainder % 2 === 1) {
      position = (position + adjust) % 12;
    } else {
      position = (position - adjust + 12) % 12;
    }
  }
  
  return position;
}
```

**验证**: 需要对照传统排盘软件验证多个出生日期的紫微星位置。

### 1.2 紫微星系安星方向错误

**文件**: `server/services/ziweiAnalyzer.cjs:610-629`
**问题**: 天机星应在紫微星**逆时针**一位（紫微逆行），代码却放在顺时针一位。

**正确安星规则**（紫微星系）:
| 星曜 | 相对紫微位置 | 方向 |
|------|------------|------|
| 紫微 | 0 | - |
| 天机 | -1 | 逆行 |
| 太阳 | -2 | 逆行 |
| 武曲 | -3 | 逆行 |
| 天同 | -4 | 逆行 |
| 廉贞 | +1 | 顺行 |

**修复方案**:
```javascript
arrangeZiweiStarSystem(starPositions, ziweiPosition) {
  starPositions[ziweiPosition].push('紫微');
  // 天机：紫微逆行一位
  starPositions[(ziweiPosition - 1 + 12) % 12].push('天机');
  // 太阳：紫微逆行二位
  starPositions[(ziweiPosition - 2 + 12) % 12].push('太阳');
  // 武曲：紫微逆行三位
  starPositions[(ziweiPosition - 3 + 12) % 12].push('武曲');
  // 天同：紫微逆行四位
  starPositions[(ziweiPosition - 4 + 12) % 12].push('天同');
  // 廉贞：紫微顺行一位
  starPositions[(ziweiPosition + 1) % 12].push('廉贞');
}
```

### 1.3 五行局计算使用年柱纳音而非命宫天干纳音

**文件**: `server/services/ziweiAnalyzer.cjs:332-352`
**问题**: `calculateWuxingJu` 使用 `baziInfo.year` 的纳音，但传统紫微斗数五行局应基于**命宫天干**的纳音。

**正确算法**:
1. 先计算命宫位置
2. 取命宫天干（根据年干和月份推算）
3. 用命宫天干+命宫地支 查纳音表确定五行局

**修复方案**:
```javascript
calculateWuxingJu(baziInfo, mingGongIndex) {
  // 命宫天干由年干和月份决定（五虎遁月法）
  const yearStem = baziInfo.year.charAt(0);
  const monthStem = this.getYearStemMonthStem(yearStem, mingGongIndex);
  const mingGongBranch = this.baseData.getBranchByIndex(mingGongIndex);
  
  // 用命宫干支查纳音
  const nayin = this.calculateNayin(monthStem, mingGongBranch);
  const juType = this.getNayinWuxingJu(nayin);
  const juNumber = this.wuxingJu[juType];
  
  return { type: juType, number: juNumber, nayin: nayin };
}
```

### 1.4 命宫计算使用公历月而非农历月

**文件**: `server/services/ziweiAnalyzer.cjs:436-459`
**问题**: `calculateMingGongPosition` 使用 `birthDate.getMonth()` 获取公历月份，但紫微斗数命宫计算必须使用**农历月份**。

**修复方案**: 在命宫计算前先调用准确的农历转换函数，使用农历月进行计算。

### 1.5 火星铃星映射表数据不全

**文件**: `server/services/ziweiAnalyzer.cjs` (火星铃星计算方法)
**问题**: 映射表只有子丑寅3年的数据，其他9年地支默认为0。

**修复方案**: 补全完整的12地支映射表。

### 1.6 大限四化用年干替代（占位实现）

**文件**: `server/services/ziweiAnalyzer.cjs` (四化计算相关)
**问题**: 大限四化应基于大运天干，当前用年干替代。

**修复方案**: 在大限计算中，使用大运天干查询四化表。

### 1.7 Math.random() 导致非确定性输出

**文件**: `server/services/ziweiAnalyzer.cjs:2268, 2365`
**问题**: `analyzeLiuNianFortune` 和 `analyzeTimingCoordination` 使用 `Math.random()` 产生随机结果。

**修复方案**: 替换为基于命盘数据的确定性算法（如根据十神、五行生克关系决定措辞）。

### 1.8 双架构统一

**文件**: `server/services/ziweiAnalyzer.cjs` vs `server/services/calculators/ZiweiCalculator.cjs`
**问题**: 两套类有不同的逻辑实现，Analyzer 包含计算+分析，Calculator 只包含计算。

**修复方案**: 统一使用 Calculator 进行计算，Analyzer 调用 Calculator 并添加分析层。

---

## 三、Phase 2: 易经卦象数据修复

### 3.1 震卦和艮卦 binary 表示互换

**文件**: `server/services/yijingAnalyzer.cjs:28, 32`
**问题**: 
- 当前: 震='001', 艮='100'
- 正确: 震='100' (阳阳阴), 艮='001' (阴阳阴)

**验证**: 二进制表示应遵循从上到下的爻序（上爻→中爻→下爻）。

**修复方案**:
```javascript
'震': { binary: '100', ... },  // 原为 '001'
'艮': { binary: '001', ... },  // 原为 '100'
```

**注意**: `calculators/YijingCalculator.cjs:58, 61` 已有正确实现，需同步修复 Analyzer。

### 3.2 互卦计算下互卦爻位取错

**文件**: `server/services/yijingAnalyzer.cjs:432-437`
**问题**: 互卦取2、3、4爻为下卦，3、4、5爻为上卦。当前代码 `substring(3,6)` 取的是第4、5、6爻（索引3-5），应该是第2、3、4爻（索引1-3）。

**正确算法**:
```javascript
getInterHexagram(hexInfo) {
  const binary = hexInfo.binary;
  // 互卦：取2、3、4爻为下卦，3、4、5爻为上卦
  // binary索引: 0=上爻, 1=五爻, 2=四爻, 3=三爻, 4=二爻, 5=初爻
  const lowerInter = binary.substring(3, 6); // 索引3,4,5 = 三二初爻 → 作为下卦
  const upperInter = binary.substring(1, 4); // 索引1,2,3 = 五四三爻 → 作为上卦
  const interBinary = upperInter + lowerInter;
  // ... 查找对应卦
}
```

**修正**: `substring(2, 5)` 应改为 `substring(1, 4)`。

### 3.3 梅花易数用公历年份数字而非地支数

**文件**: `server/services/yijingAnalyzer.cjs:181-203`
**问题**: `generateHexagramByTime` 直接使用 `year`（公历年份数字如2026），但梅花易数时间起卦应使用**地支数**（年份对12取余对应地支序号）。

**正确算法**:
```javascript
generateHexagramByTime(currentTime, userId) {
  const year = currentTime.getFullYear();
  const month = currentTime.getMonth() + 1;
  const day = currentTime.getDate();
  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();
  
  // 地支数：(年份-4) % 12 + 1，或简化为年份 % 12 映射
  const zhiNumber = ((year - 4) % 12) + 1; // 子=1, 丑=2, ..., 亥=12
  
  const userFactor = userId ? parseInt(String(userId).slice(-5).replace(/[^0-9]/g, '') || '12', 10) : 12;
  
  const upperTrigramNum = (zhiNumber + month + day + userFactor) % 8 || 8;
  const lowerTrigramNum = (zhiNumber + month + day + hour + minute + userFactor) % 8 || 8;
  const changingLinePos = (zhiNumber + month + day + hour + minute + userFactor) % 6 + 1;
  // ...
}
```

### 3.4 64卦数据不完整

**文件**: `server/services/yijingAnalyzer.cjs:1592-3259`
**问题**: grep显示有64个卦定义（1-64），但需验证每个卦的 binary、上下卦、爻辞是否正确完整。

**修复方案**: 
1. 逐一验证64卦的 binary 表示（对照标准64卦序）
2. 验证每个卦的上下卦组合是否正确
3. 补全缺失的爻辞数据

---

## 四、Phase 3: 八字分析器修复

### 4.1 缓存死代码

**文件**: `server/services/baziAnalyzer.cjs:157-215`
**问题**: `performFullBaziAnalysis()` 在 L157 直接 return 结果对象，L213-215 的 `cache.set()` 永远不会执行。

**修复方案**:
```javascript
// 将 L157-211 的返回值存入 result 变量
const result = {
  analysis_type: 'bazi',
  // ... 所有字段
};

// 在 return 之前存储缓存
this.cache.set('bazi', birth_data, result);
return result;
```

### 4.2 假并行（Promise.all 包装同步函数）

**文件**: `server/services/baziAnalyzer.cjs:140-151`
**问题**: `Promise.resolve(this.xxx())` 包装同步函数，Promise.all 无法实现真正的并行。

**修复方案**: 移除 `Promise.resolve()` 包装，对于同步函数直接调用；只对真正异步的函数使用 Promise.all。或者将同步函数改为异步（使用 worker_threads 或 setImmediate 分片）。

### 4.3 重复 getCurrentDayun 调用

**文件**: `server/services/baziAnalyzer.cjs:1333, 1374, 1377, 1387`
**问题**: `getCurrentDayun(correctDayunSequence, currentAge)` 被调用了3次，参数完全相同。

**修复方案**: 在 `calculatePreciseFortuneAsync` 中只调用一次，结果存入变量复用。

### 4.4 Nayin 表每次调用重建

**文件**: `server/services/ziweiAnalyzer.cjs:357-373`（以及 baziAnalyzer 中类似代码）
**问题**: `calculateNayin` 方法内每次调用都创建完整的纳音表对象。

**修复方案**: 将纳音表提升为类常量（constructor 中初始化或使用 static 属性）。

### 4.5 农历转换极度不准

**文件**: `server/services/baziAnalyzer.cjs:2166-2229`
**问题**: 只有1976-1990年共15年的春节数据，且假设每月30天。

**修复方案**: 
1. 扩展春节日期数据至1900-2100年（约200年）
2. 使用精确的农历算法（考虑大小月、闰月）
3. 或引入第三方农历库（如 `lunar-javascript`）

### 4.6 起运计算使用硬编码日期

**文件**: `server/services/baziAnalyzer.cjs` (calculateStartLuckAge 相关)
**问题**: 起运时间计算没有使用 PreciseSolarTerms，而是使用简化的日期估算。

**修复方案**: 集成 PreciseSolarTerms 计算精确的节气时间，用于起运计算。

### 4.7 重复的 LifeGuidance async/sync 版本

**文件**: `server/services/baziAnalyzer.cjs`
**问题**: `generateComprehensiveLifeGuidance` 和 `generateComprehensiveLifeGuidanceAsync` 产生相同输出，异步版本的结果被丢弃（L154重新调用同步版本）。

**修复方案**: 移除 async 版本，或统一使用一个版本。

### 4.8 19个死方法（约170行）

**文件**: `server/services/baziAnalyzer.cjs`
**问题**: 多个方法从未被调用。

**修复方案**: 通过静态分析工具（或手动检查）识别并删除死代码。

---

## 五、Phase 4: 共享工具统一

### 5.1 统一 Calculator 和 Analyzer 架构

**涉及文件**:
- `server/services/calculators/BaziCalculator.cjs`
- `server/services/calculators/ZiweiCalculator.cjs`
- `server/services/calculators/YijingCalculator.cjs`
- `server/services/baziAnalyzer.cjs`
- `server/services/ziweiAnalyzer.cjs`
- `server/services/yijingAnalyzer.cjs`

**方案**: 
1. Calculator 负责纯计算逻辑（四柱、排盘、起卦）
2. Analyzer 调用 Calculator 并添加分析/解释层
3. Analyzer 不应包含计算逻辑

### 5.2 复用 PreciseSolarTerms

**问题**: baziAnalyzer 使用简化的节气表（L39-52），而 PreciseSolarTerms 已有精确计算。

**修复方案**: 在 baziAnalyzer 中引入并使用 PreciseSolarTerms 替代简化节气表。

### 5.3 复用 BaseData

**问题**: 多处重复定义天干地支、五行等数据。

**修复方案**: 统一使用 BaseData.cjs 中的共享数据，移除各文件中的重复定义。

---

## 六、测试验证计划

### 6.1 紫微斗数测试

创建 `tests/ziwei-correctness-test.cjs`:
- 使用已知出生数据对照传统排盘软件结果
- 验证紫微星位置、五行局、命宫位置
- 验证十四主星安星结果
- 验证四化飞星结果

### 6.2 易经测试

创建 `tests/yijing-correctness-test.cjs`:
- 验证64卦 binary 表示正确性
- 验证互卦、错卦、综卦计算
- 验证梅花易数起卦算法

### 6.3 八字测试

扩展 `tests/zishi-fix-test.cjs`:
- 验证缓存命中
- 验证农历转换准确性
- 验证大运计算正确性

### 6.4 回归测试

运行现有测试套件确保无破坏性变更:
```bash
node tests/ziwei-algorithm-test.cjs
node tests/yijing-randomness-test.cjs
node tests/zishi-fix-test.cjs
node tests/integration.test.cjs
```

---

## 七、风险评估

| 变更 | 风险 | 缓解措施 |
|------|------|---------|
| 紫微星定位算法重构 | 高 - 可能影响所有排盘结果 | 逐步替换，每步验证 |
| 卦象 binary 修正 | 中 - 影响起卦和变卦 | 对照标准数据验证 |
| 农历算法替换 | 中 - 影响多个分析模块 | 使用成熟第三方库 |
| 缓存修复 | 低 - 只影响性能 | 直接修复 |
| 死代码删除 | 低 - 不影响功能 | 静态分析确认 |

---

## 八、执行顺序建议

```
Phase 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7 → 1.8
    ↓
Phase 2.1 → 2.2 → 2.3 → 2.4
    ↓
Phase 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6 → 3.7 → 3.8
    ↓
Phase 4.1 → 4.2 → 4.3
```

每个 Phase 完成后运行完整测试套件，确认无回归后再进入下一 Phase。
