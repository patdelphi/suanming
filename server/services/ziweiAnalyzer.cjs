// 专业紫微斗数分析服务模块
// 基于传统紫微斗数理论的精确实现

const BaseData = require('./common/BaseData.cjs');
const AnalysisCache = require('./common/AnalysisCache.cjs');
const StarBrightness = require('./common/StarBrightness.cjs');
const EnhancedSiHua = require('./common/EnhancedSiHua.cjs');
const BaziAnalyzer = require('./baziAnalyzer.cjs');

class ZiweiAnalyzer {
  constructor() {
    // 初始化八字分析器和共享基础数据
    this.baziAnalyzer = new BaziAnalyzer();
    this.baseData = new BaseData();
    
    // 初始化缓存机制
    this.cache = new AnalysisCache({
      maxSize: 300,
      defaultTTL: 2700000 // 45分钟
    });
    
    // 初始化星曜亮度计算系统
    this.starBrightness = new StarBrightness();
    
    // 初始化增强四化飞星系统
    this.enhancedSiHua = new EnhancedSiHua();
    this.palaceNames = ['命宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫', '迁移宫', '交友宫', '事业宫', '田宅宫', '福德宫', '父母宫'];
    
    // 十四主星
    this.majorStars = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];
    
    // 六吉星
    this.luckyStars = ['文昌', '文曲', '左辅', '右弼', '天魁', '天钺'];
    
    // 六煞星
    this.unluckyStars = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];
    
    // 其他重要星曜
    this.otherStars = ['禄存', '天马', '红鸾', '天喜', '孤辰', '寡宿', '天刑', '天姚'];
    
    // 长生十二神
    this.twelveGods = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
    
    // 五行局对应表
     this.wuxingJu = {
       '水二局': 2, '木三局': 3, '金四局': 4, '土五局': 5, '火六局': 6
     };
     
     // 使用BaseData统一的四化表
     this.sihuaTable = this.baseData.getSiHuaTable();
   }
  
  // 计算农历信息（复用八字分析器的农历算法）
  calculateLunarInfo(birth_date) {
    try {
      // 直接复用八字分析器的农历计算功能，避免重复实现
      return this.baziAnalyzer.calculateLunarInfo(birth_date);
    } catch (error) {
      console.error('农历信息计算失败:', error);
      // 降级处理：返回基本信息
      const birthDate = new Date(birth_date);
      const year = birthDate.getFullYear();
      return {
        lunar_date: '农历信息计算失败',
        lunar_year: `${year}年`,
        lunar_month: '未知月',
        lunar_day: '未知日',
        ganzhi_year: '未知',
        zodiac: '未知',
        solar_term: '未知'
      };
    }
  }
    
    // 转换为中文年份
    getChineseYear(year) {
      const chineseNumbers = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
      return year.toString().split('').map(digit => chineseNumbers[parseInt(digit)]).join('');
    }
    
    // 计算详细的节气信息（显示节气区间）
    calculateDetailedSolarTerm(month, day) {
      const solarTerms = {
        1: [{ day: 5, name: '小寒' }, { day: 20, name: '大寒' }],
        2: [{ day: 3, name: '立春' }, { day: 18, name: '雨水' }],
        3: [{ day: 5, name: '惊蛰' }, { day: 20, name: '春分' }],
        4: [{ day: 4, name: '清明' }, { day: 20, name: '谷雨' }],
        5: [{ day: 5, name: '立夏' }, { day: 21, name: '小满' }],
        6: [{ day: 5, name: '芒种' }, { day: 21, name: '夏至' }],
        7: [{ day: 7, name: '小暑' }, { day: 22, name: '大暑' }],
        8: [{ day: 7, name: '立秋' }, { day: 23, name: '处暑' }],
        9: [{ day: 7, name: '白露' }, { day: 23, name: '秋分' }],
        10: [{ day: 8, name: '寒露' }, { day: 23, name: '霜降' }],
        11: [{ day: 7, name: '立冬' }, { day: 22, name: '小雪' }],
        12: [{ day: 7, name: '大雪' }, { day: 22, name: '冬至' }]
      };
      
      const monthTerms = solarTerms[month];
      if (!monthTerms) return '节气间';
      
      const [firstTerm, secondTerm] = monthTerms;
      
      // 判断具体位置
      if (day < firstTerm.day - 2) {
        // 在第一个节气之前，属于上个月的第二个节气之后
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevMonthTerms = solarTerms[prevMonth];
        if (prevMonthTerms) {
          return `${prevMonthTerms[1].name}后至${firstTerm.name}前`;
        }
        return `${firstTerm.name}前`;
      } else if (day >= firstTerm.day - 2 && day <= firstTerm.day + 2) {
        return `${firstTerm.name}期间`;
      } else if (day > firstTerm.day + 2 && day < secondTerm.day - 2) {
        return `${firstTerm.name}后至${secondTerm.name}前`;
      } else if (day >= secondTerm.day - 2 && day <= secondTerm.day + 2) {
        return `${secondTerm.name}期间`;
      } else {
        // 在第二个节气之后，属于下个月第一个节气之前
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextMonthTerms = solarTerms[nextMonth];
        if (nextMonthTerms) {
          return `${secondTerm.name}后至${nextMonthTerms[0].name}前`;
        }
        return `${secondTerm.name}后`;
      }
    }
   
   // 已删除重复的农历计算方法，现在复用八字分析器的功能
  
  // 计算节气信息
  calculateSolarTerm(month, day) {
    const solarTerms = {
      2: { 3: '立春', 18: '雨水' },
      3: { 5: '惊蛰', 20: '春分' },
      4: { 4: '清明', 20: '谷雨' },
      5: { 5: '立夏', 21: '小满' },
      6: { 5: '芒种', 21: '夏至' },
      7: { 7: '小暑', 22: '大暑' },
      8: { 7: '立秋', 23: '处暑' },
      9: { 7: '白露', 23: '秋分' },
      10: { 8: '寒露', 23: '霜降' },
      11: { 7: '立冬', 22: '小雪' },
      12: { 7: '大雪', 22: '冬至' },
      1: { 5: '小寒', 20: '大寒' }
    };
    
    const monthTerms = solarTerms[month];
    if (monthTerms) {
      for (const [termDay, termName] of Object.entries(monthTerms)) {
        if (day >= parseInt(termDay) - 2 && day <= parseInt(termDay) + 2) {
          return termName;
        }
      }
    }
    
    return '节气间';
  }
  
  // 已删除重复的中文转换方法，现在复用八字分析器的功能
  
  // 生成子时计算方法说明（紫微斗数版本）
  generateZishiCalculationNote(baziInfo, birth_time) {
    if (!birth_time) {
      return null;
    }
    
    const hour = parseInt(birth_time.split(':')[0]);
    
    if (hour === 23 || hour === 0) {
      const isLateZishi = hour === 23;
      const isEarlyZishi = hour === 0;
      
      let note = {
        is_zishi: true,
        zishi_type: isLateZishi ? '晚子时' : '早子时',
        calculation_method: '',
        explanation: '',
        ziwei_impact: '',
        expert_opinion: '紫微斗数中子时的处理直接影响命宫位置和星曜分布，需要准确区分早晚子时。'
      };
      
      if (isLateZishi) {
        note.calculation_method = '晚子时计算法：命宫位置按当天计算，但时辰干支用第二天推算';
        note.explanation = `您出生在晚子时（${birth_time}），在紫微斗数排盘中：` +
          `命宫位置按当天的月份和时辰确定，但八字时柱采用第二天日干推算。`;
        note.ziwei_impact = '这种计算方法确保了紫微斗数命盘的准确性，避免了子时归属不明确导致的排盘错误。';
      } else {
        note.calculation_method = '早子时计算法：命宫位置和时辰干支都按当天计算';
        note.explanation = `您出生在早子时（${birth_time}），在紫微斗数排盘中：` +
          `命宫位置和八字时柱都按当天的标准方法计算。`;
        note.ziwei_impact = '早子时的处理相对简单，按照传统方法即可确保排盘的准确性。';
      }
      
      return note;
    }
    
    return null;
   }

  /**
   * 专业紫微斗数分析主函数
   * @param {Object} birth_data - 出生数据
   * @param {string} birth_data.birth_date - 出生日期 (YYYY-MM-DD)
   * @param {string} birth_data.birth_time - 出生时间 (HH:MM)
   * @param {string} birth_data.gender - 性别 ('male'/'female' 或 '男'/'女')
   * @param {string} birth_data.name - 姓名（可选）
   * @returns {Object} 紫微斗数分析结果
   */
  performRealZiweiAnalysis(birth_data) {
    try {
      // 输入参数验证
      if (!birth_data || typeof birth_data !== 'object') {
        throw new Error('输入数据无效：必须提供有效的出生数据对象');
      }
      
      const { name, birth_date, birth_time, gender } = birth_data;
      
      // 验证出生日期
      if (!birth_date || typeof birth_date !== 'string') {
        throw new Error('输入数据无效：出生日期不能为空');
      }
      
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(birth_date)) {
        throw new Error('输入数据无效：出生日期格式必须为 YYYY-MM-DD');
      }
      
      const birthDateObj = new Date(birth_date);
      if (isNaN(birthDateObj.getTime())) {
        throw new Error('输入数据无效：出生日期无效');
      }
      
      const currentDate = new Date();
      const minDate = new Date('1900-01-01');
      if (birthDateObj < minDate || birthDateObj > currentDate) {
        throw new Error('输入数据无效：出生日期必须在1900年至今之间');
      }
      
      // 验证出生时间
      if (birth_time && typeof birth_time === 'string') {
        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(birth_time)) {
          throw new Error('输入数据无效：出生时间格式必须为 HH:MM');
        }
        
        const [hours, minutes] = birth_time.split(':').map(Number);
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          throw new Error('输入数据无效：出生时间无效');
        }
      }
      
      // 验证性别
      if (!gender || typeof gender !== 'string') {
        throw new Error('输入数据无效：性别不能为空');
      }
      
      const validGenders = ['male', 'female', '男', '女', '男性', '女性'];
      if (!validGenders.includes(gender)) {
        throw new Error('输入数据无效：性别必须是 male/female 或 男/女');
      }
      
      // 验证姓名长度
      if (name && (typeof name !== 'string' || name.length > 50)) {
        throw new Error('输入数据无效：姓名长度不能超过50个字符');
      }
      
      const personName = (name && name.trim()) || '您';
      const personGender = gender === 'male' || gender === '男' ? '男性' : '女性';
    
    // 计算精确的八字信息
    const baziInfo = this.calculatePreciseBazi(birth_date, birth_time);
    
    // 计算五行局
    const wuxingJu = this.calculateWuxingJu(baziInfo);
    
    // 计算命宫位置
    const mingGongPosition = this.calculateMingGongPosition(birth_date, birth_time);
    
    // 计算完整的紫微斗数排盘
    const starChart = this.calculateCompleteStarChart(birth_date, birth_time, gender, wuxingJu, mingGongPosition);
    
    // 生成基于真实星盘的专业分析
    const birthYear = new Date(birth_date).getFullYear();
    const analysis = this.generateProfessionalAnalysis(starChart, personName, personGender, baziInfo, wuxingJu, birthYear);
    
    return {
      analysis_type: 'ziwei',
      analysis_date: new Date().toISOString(),
      basic_info: {
        personal_data: {
          name: personName,
          birth_date: birth_date,
          birth_time: birth_time || '12:00',
          gender: personGender
        },
        bazi_info: baziInfo,
        wuxing_ju: wuxingJu,
        ming_gong_position: mingGongPosition,
        lunar_info: this.calculateLunarInfo(birth_date),
        zishi_calculation_note: this.generateZishiCalculationNote(baziInfo, birth_time)
      },
      ziwei_analysis: {
        ming_gong: starChart.mingGong,
        ming_gong_stars: starChart.mingGongStars,
        twelve_palaces: starChart.twelvePalaces,
        si_hua: starChart.siHua,
        major_periods: starChart.majorPeriods,
        star_chart: starChart.completeChart,
        wuxing_ju_info: wuxingJu
      },
      detailed_analysis: analysis
    };
    
    } catch (error) {
      console.error('紫微斗数分析详细错误:', error);
      throw error;
    }
  }

  // 计算五行局（紫微斗数核心算法）- 基于纳音五行
  calculateWuxingJu(baziInfo) {
    const { year, month, day, hour } = baziInfo;
    
    // 提取年干支
    const yearStem = year.charAt(0);
    const yearBranch = year.charAt(1);
    
    // 根据年干支计算纳音五行局
    const nayin = this.calculateNayin(yearStem, yearBranch);
    const juType = this.getNayinWuxingJu(nayin);
    const juNumber = this.wuxingJu[juType];
    
    return {
      type: juType,
      number: juNumber,
      nayin: nayin,
      description: `${juType}，纳音${nayin}，大限每${juNumber * 10}年一步`,
      start_age: this.calculateStartAge(juNumber, baziInfo.birth_info.gender || 'male')
    };
  }
  
  // 计算纳音五行
  calculateNayin(stem, branch) {
    // 纳音五行对照表（60甲子纳音）
    const nayinTable = {
      '甲子': '海中金', '乙丑': '海中金', '丙寅': '炉中火', '丁卯': '炉中火',
      '戊辰': '大林木', '己巳': '大林木', '庚午': '路旁土', '辛未': '路旁土',
      '壬申': '剑锋金', '癸酉': '剑锋金', '甲戌': '山头火', '乙亥': '山头火',
      '丙子': '涧下水', '丁丑': '涧下水', '戊寅': '城头土', '己卯': '城头土',
      '庚辰': '白蜡金', '辛巳': '白蜡金', '壬午': '杨柳木', '癸未': '杨柳木',
      '甲申': '泉中水', '乙酉': '泉中水', '丙戌': '屋上土', '丁亥': '屋上土',
      '戊子': '霹雳火', '己丑': '霹雳火', '庚寅': '松柏木', '辛卯': '松柏木',
      '壬辰': '长流水', '癸巳': '长流水', '甲午': '砂中金', '乙未': '砂中金',
      '丙申': '山下火', '丁酉': '山下火', '戊戌': '平地木', '己亥': '平地木',
      '庚子': '壁上土', '辛丑': '壁上土', '壬寅': '金箔金', '癸卯': '金箔金',
      '甲辰': '覆灯火', '乙巳': '覆灯火', '丙午': '天河水', '丁未': '天河水',
      '戊申': '大驿土', '己酉': '大驿土', '庚戌': '钗钏金', '辛亥': '钗钏金',
      '壬子': '桑柘木', '癸丑': '桑柘木', '甲寅': '大溪水', '乙卯': '大溪水',
      '丙辰': '沙中土', '丁巳': '沙中土', '戊午': '天上火', '己未': '天上火',
      '庚申': '石榴木', '辛酉': '石榴木', '壬戌': '大海水', '癸亥': '大海水'
    };
    
    const ganzhi = stem + branch;
    return nayinTable[ganzhi] || '大林木';
  }
  
  // 根据纳音确定五行局
  getNayinWuxingJu(nayin) {
    // 纳音五行局对照表
    const nayinJuMap = {
      // 金纳音 -> 金四局
      '海中金': '金四局', '剑锋金': '金四局', '白蜡金': '金四局', 
      '砂中金': '金四局', '金箔金': '金四局', '钗钏金': '金四局',
      
      // 木纳音 -> 木三局
      '大林木': '木三局', '杨柳木': '木三局', '松柏木': '木三局',
      '平地木': '木三局', '桑柘木': '木三局', '石榴木': '木三局',
      
      // 水纳音 -> 水二局
      '涧下水': '水二局', '泉中水': '水二局', '长流水': '水二局',
      '天河水': '水二局', '大溪水': '水二局', '大海水': '水二局',
      
      // 火纳音 -> 火六局
      '炉中火': '火六局', '山头火': '火六局', '霹雳火': '火六局',
      '山下火': '火六局', '覆灯火': '火六局', '天上火': '火六局',
      
      // 土纳音 -> 土五局
      '路旁土': '土五局', '城头土': '土五局', '屋上土': '土五局',
      '壁上土': '土五局', '大驿土': '土五局', '沙中土': '土五局'
    };
    
    return nayinJuMap[nayin] || '土五局';
  }

  // 计算起运年龄
  calculateStartAge(juNumber, gender) {
    // 根据五行局和性别计算起运年龄
    const baseAge = gender === 'male' || gender === '男' ? 2 : 5;
    return baseAge + (juNumber - 2);
  }

  // 计算精确的八字信息
  calculatePreciseBazi(birthDateStr, birthTimeStr) {
    // 使用优化后的八字分析器获取精确的八字信息
    const baziResult = this.baziAnalyzer.calculatePreciseBazi(birthDateStr, birthTimeStr);
    
    return {
      year: baziResult.year_pillar.stem + baziResult.year_pillar.branch,
      month: baziResult.month_pillar.stem + baziResult.month_pillar.branch,
      day: baziResult.day_pillar.stem + baziResult.day_pillar.branch,
      hour: baziResult.hour_pillar.stem + baziResult.hour_pillar.branch,
      birth_info: {
        year: new Date(birthDateStr).getFullYear(),
        month: new Date(birthDateStr).getMonth() + 1,
        day: new Date(birthDateStr).getDate(),
        hour: birthTimeStr ? parseInt(birthTimeStr.split(':')[0]) : 12,
        minute: birthTimeStr ? parseInt(birthTimeStr.split(':')[1]) : 0,
        day_master: baziResult.day_master,
        day_master_element: baziResult.day_master_element
      }
    };
  }

  // 计算精确的命宫位置（使用农历月日）
  calculateMingGongPosition(birthDateStr, birthTimeStr) {
    const birthDate = new Date(birthDateStr);
    const [hour, minute] = birthTimeStr ? birthTimeStr.split(':').map(Number) : [12, 0];
    
    // 使用农历月日计算命宫
    const year = birthDate.getFullYear();
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    const lunarInfo = this.baseData.solarToLunar(year, month, day);
    const lunarMonth = lunarInfo.month;
    
    // 紫微斗数命宫计算：寅宫起正月，顺数至生月，再从生月宫逆数至生时
    // 寅宫起正月：寅=2, 卯=3, 辰=4, 巳=5, 午=6, 未=7, 申=8, 酉=9, 戌=10, 亥=11, 子=0, 丑=1
    const monthPosition = (lunarMonth + 1) % 12; // 寅宫起正月
    
    // 时辰对应地支：子=0, 丑=1, 寅=2, ..., 亥=11
    const hourBranch = Math.floor((hour + 1) / 2) % 12;
    
    // 命宫计算：从生月宫逆数至生时
    const mingGongIndex = (monthPosition - hourBranch + 12) % 12;
    
    return {
      index: mingGongIndex,
      branch: this.baseData.getBranchByIndex(mingGongIndex),
      description: `命宫在${this.baseData.getBranchByIndex(mingGongIndex)}宫`
    };
  }

  // 计算完整的紫微斗数排盘（使用农历日）
  calculateCompleteStarChart(birthDateStr, birthTimeStr, gender, wuxingJu, mingGongPosition) {
    const birthDate = new Date(birthDateStr);
    const year = birthDate.getFullYear();
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    // 使用农历日计算紫微星位置
    const lunarInfo = this.baseData.solarToLunar(year, month, day);
    const lunarDay = lunarInfo.day;
    const mingGongIndex = mingGongPosition.index;
    
    // 计算紫微星位置（使用农历日）
    const ziweiPosition = this.calculateZiweiStarPosition(lunarDay, wuxingJu.number);
    
    // 安排十四主星
    const mainStarPositions = this.arrangeMainStars(ziweiPosition, mingGongIndex);
    
    // 安排六吉星
    const luckyStarPositions = this.arrangeLuckyStars(birthDate, mingGongIndex);
    
    // 安排六煞星
    const unluckyStarPositions = this.arrangeUnluckyStars(birthDate, mingGongIndex);
    
    // 计算十二宫位
    const twelvePalaces = this.calculateTwelvePalaces(mingGongIndex, mainStarPositions, luckyStarPositions, unluckyStarPositions);
    
    // 计算四化
    const siHua = this.calculateSiHua(birthDate.getFullYear());
    
    // 计算大限
    const majorPeriods = this.calculateMajorPeriods(mingGongIndex, gender, wuxingJu, birthDate.getFullYear());
    
    return {
      mingGong: this.baseData.getBranchByIndex(mingGongIndex),
      mingGongStars: mainStarPositions[mingGongIndex] || [],
      twelvePalaces: twelvePalaces,
      siHua: siHua,
      majorPeriods: majorPeriods,
      completeChart: this.generateCompleteChart(twelvePalaces, mainStarPositions, luckyStarPositions, unluckyStarPositions)
    };
  }

  // 计算紫微星位置（基于五行局的传统算法）
  // 算法：将生日除以五行局数，根据商和余数确定紫微星在十二宫的位置
  calculateZiweiStarPosition(day, juNumber) {
    if (!day || day < 1 || !juNumber || juNumber < 2) {
      return 2; // 默认返回寅宫
    }

    const quotient = Math.floor(day / juNumber);
    const remainder = day % juNumber;

    if (remainder === 0) {
      // 能整除：紫微星在寅宫起，顺数(商-1)位
      // 寅=2, 顺行商-1位
      return (2 + quotient - 1 + 12) % 12;
    }

    // 不能整除：根据余数奇偶进退
    // 基准位：从寅宫起，顺数商位
    const basePosition = (2 + quotient) % 12;

    if (remainder % 2 === 1) {
      // 余数为奇数：从基准位顺行 floor(余数/2)+1 位
      return (basePosition + Math.floor(remainder / 2) + 1) % 12;
    } else {
      // 余数为偶数：从基准位逆行 余数/2 位
      return (basePosition - remainder / 2 + 12) % 12;
    }
  }

  // 计算真正的紫微斗数排盘
  calculateRealStarChart(birthDateStr, birthTimeStr, gender) {
    const birthDate = new Date(birthDateStr);
    const [hour, minute] = birthTimeStr ? birthTimeStr.split(':').map(Number) : [12, 0];
    
    const year = birthDate.getFullYear();
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    
    // 根据出生时间计算命宫位置（真正的紫微斗数算法）
    const mingGongIndex = this.calculateMingGongIndex(month, hour);
    const mingGong = this.baseData.getBranchByIndex(mingGongIndex);
    
    // 先计算八字和五行局（紫微星定位依赖五行局数）
    const baziInfo = this.calculatePreciseBazi(birthDateStr, birthTimeStr);
    const wuxingJu = this.calculateWuxingJu(baziInfo);
    
    // 计算紫微星位置（基于五行局的传统算法）
    const ziweiPosition = this.calculateZiweiStarPosition(day, wuxingJu.number);
    
    // 排布十四主星
    const starPositions = this.arrangeMainStars(ziweiPosition, mingGongIndex);
    
    // 安排六吉星
    const luckyStarPositions = this.arrangeLuckyStars(birthDate, mingGongIndex);
    
    // 安排六煞星
    const unluckyStarPositions = this.arrangeUnluckyStars(birthDate, mingGongIndex);
    
    // 计算十二宫位
    const twelvePalaces = this.calculateTwelvePalaces(mingGongIndex, starPositions, luckyStarPositions, unluckyStarPositions);
    
    // 计算四化
    const siHua = this.calculateSiHua(year);
    
    // 计算大限
    const majorPeriods = this.calculateMajorPeriods(mingGongIndex, gender, wuxingJu, year);
    
    return {
      mingGong: mingGong,
      mingGongStars: starPositions[mingGongIndex] || [],
      twelvePalaces: twelvePalaces,
      siHua: siHua,
      majorPeriods: majorPeriods,
      birthChart: this.generateCompleteChart(twelvePalaces, starPositions, luckyStarPositions, unluckyStarPositions)
    };
  }

  // 计算命宫位置索引（简化版本，用于旧方法兼容）
  calculateMingGongIndex(month, hour) {
    // 紫微斗数命宫计算公式：寅宫起正月，顺数至生月，再从生月宫逆数至生时
    const monthPosition = (month + 1) % 12; // 寅宫起正月
    const hourBranch = Math.floor((hour + 1) / 2) % 12;
    const mingGongPosition = (monthPosition - hourBranch + 12) % 12;
    return mingGongPosition;
  }

  // 计算紫微星位置（兼容方法，内部委托给正确的五行局算法）
  calculateZiweiPosition(day, mingGongIndex) {
    // 此方法保留兼容性，但紫微星定位必须基于五行局数
    // 实际使用中应通过 calculateZiweiStarPosition(day, juNumber) 调用
    return this.calculateZiweiStarPosition(day, 5); // 默认土五局，实际应传入正确局数
  }

  // 精确安排十四主星（传统紫微斗数安星法）
  arrangeMainStars(ziweiPosition, mingGongIndex) {
    const starPositions = {};
    
    // 初始化所有宫位
    for (let i = 0; i < 12; i++) {
      starPositions[i] = [];
    }
    
    // 紫微星系安星（北斗星系）
    this.arrangeZiweiStarSystem(starPositions, ziweiPosition);
    
    // 天府星系安星（南斗星系）
    this.arrangeTianfuStarSystem(starPositions, ziweiPosition);
    
    return starPositions;
  }
  
  // 安排紫微星系（北斗七星）
  arrangeZiweiStarSystem(starPositions, ziweiPosition) {
    // 紫微星固定位置
    starPositions[ziweiPosition].push('紫微');
    
    // 天机星：紫微逆行一位
    starPositions[(ziweiPosition - 1 + 12) % 12].push('天机');
    
    // 太阳星：紫微逆行二位
    starPositions[(ziweiPosition - 2 + 12) % 12].push('太阳');
    
    // 武曲星：紫微逆行三位
    starPositions[(ziweiPosition - 3 + 12) % 12].push('武曲');
    
    // 天同星：紫微逆行四位
    starPositions[(ziweiPosition - 4 + 12) % 12].push('天同');
    
    // 廉贞星：紫微顺行一位
    starPositions[(ziweiPosition + 1) % 12].push('廉贞');
  }
  
  // 安排天府星系（南斗六星）
  arrangeTianfuStarSystem(starPositions, ziweiPosition) {
    // 天府星：紫微对宫（相对180度）
    const tianfuPosition = (ziweiPosition + 6) % 12;
    starPositions[tianfuPosition].push('天府');
    
    // 太阴星：天府逆行一位
    starPositions[(tianfuPosition - 1 + 12) % 12].push('太阴');
    
    // 贪狼星：天府逆行二位
    starPositions[(tianfuPosition - 2 + 12) % 12].push('贪狼');
    
    // 巨门星：天府逆行三位
    starPositions[(tianfuPosition - 3 + 12) % 12].push('巨门');
    
    // 天相星：天府逆行四位
    starPositions[(tianfuPosition - 4 + 12) % 12].push('天相');
    
    // 天梁星：天府逆行五位
    starPositions[(tianfuPosition - 5 + 12) % 12].push('天梁');
    
    // 七杀星：天府逆行六位
    starPositions[(tianfuPosition - 6 + 12) % 12].push('七杀');
    
    // 破军星：天府逆行七位
    starPositions[(tianfuPosition - 7 + 12) % 12].push('破军');
  }

  // 安排六吉星
  arrangeLuckyStars(birthDate, mingGongIndex) {
    const luckyPositions = {};
    const year = birthDate.getFullYear();
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    const [hour] = birthDate.toTimeString().split(':').map(Number);
    
    // 初始化所有宫位
    for (let i = 0; i < 12; i++) {
      luckyPositions[i] = [];
    }
    
    // 文昌星：根据出生时辰安星
    const wenchangPosition = this.calculateWenchangPosition(hour);
    luckyPositions[wenchangPosition].push('文昌');
    
    // 文曲星：文昌对宫
    const wenquPosition = (wenchangPosition + 6) % 12;
    luckyPositions[wenquPosition].push('文曲');
    
    // 左辅星：根据出生月份安星
    const zuofuPosition = this.calculateZuofuPosition(month);
    luckyPositions[zuofuPosition].push('左辅');
    
    // 右弼星：左辅下一宫
    const youbiPosition = (zuofuPosition + 1) % 12;
    luckyPositions[youbiPosition].push('右弼');
    
    // 天魁星：根据出生年干安星
    const tiankuiPosition = this.calculateTiankuiPosition(year);
    luckyPositions[tiankuiPosition].push('天魁');
    
    // 天钺星：根据出生年干安星
    const tianyuePosition = this.calculateTianyuePosition(year);
    luckyPositions[tianyuePosition].push('天钺');
    
    return luckyPositions;
  }

  // 安排六煞星
  arrangeUnluckyStars(birthDate, mingGongIndex) {
    const unluckyPositions = {};
    const year = birthDate.getFullYear();
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    const [hour] = birthDate.toTimeString().split(':').map(Number);
    
    // 初始化所有宫位
    for (let i = 0; i < 12; i++) {
      unluckyPositions[i] = [];
    }
    
    // 擎羊星：根据出生年干安星
    const qingyangPosition = this.calculateQingyangPosition(year);
    unluckyPositions[qingyangPosition].push('擎羊');
    
    // 陀罗星：擎羊下一宫
    const tuoluoPosition = (qingyangPosition + 1) % 12;
    unluckyPositions[tuoluoPosition].push('陀罗');
    
    // 火星：根据出生时辰和年支安星
    const huoxingPosition = this.calculateHuoxingPosition(year, hour);
    unluckyPositions[huoxingPosition].push('火星');
    
    // 铃星：根据出生时辰和年支安星
    const lingxingPosition = this.calculateLingxingPosition(year, hour);
    unluckyPositions[lingxingPosition].push('铃星');
    
    // 地空星：根据出生时辰安星
    const dikongPosition = this.calculateDikongPosition(hour);
    unluckyPositions[dikongPosition].push('地空');
    
    // 地劫星：地空对宫
    const dijiePosition = (dikongPosition + 6) % 12;
    unluckyPositions[dijiePosition].push('地劫');
    
    return unluckyPositions;
  }

  // 计算十二宫位（整合所有星曜）
  calculateTwelvePalaces(mingGongIndex, mainStarPositions, luckyStarPositions, unluckyStarPositions) {
    const palaces = {};
    
    for (let i = 0; i < 12; i++) {
      const palaceIndex = (mingGongIndex + i) % 12;
      const palaceName = this.palaceNames[i];
      
      // 整合所有星曜
      const allStars = [
        ...(mainStarPositions[palaceIndex] || []),
        ...(luckyStarPositions[palaceIndex] || []),
        ...(unluckyStarPositions[palaceIndex] || [])
      ];
      
      const mainStars = mainStarPositions[palaceIndex] || [];
      const luckyStars = luckyStarPositions[palaceIndex] || [];
      const unluckyStars = unluckyStarPositions[palaceIndex] || [];
      
      // 计算星曜亮度和组合效果
      const position = this.baseData.getBranchByIndex(palaceIndex);
      const brightnessAnalysis = this.starBrightness.analyzeStarCombination(allStars, position);
      
      palaces[palaceName] = {
        position: position,
        palace_index: palaceIndex,
        all_stars: allStars,
        main_stars: mainStars,
        lucky_stars: luckyStars,
        unlucky_stars: unluckyStars,
        star_count: allStars.length,
        interpretation: this.generatePalaceInterpretation(palaceName, mainStars, luckyStars, unluckyStars),
        strength: this.calculatePalaceStrength(mainStars, luckyStars, unluckyStars),
        palace_nature: this.determinePalaceNature(palaceName),
        key_influences: this.analyzeKeyInfluences(mainStars, luckyStars, unluckyStars),
        brightness_analysis: {
           overall_brightness: brightnessAnalysis.level,
           brightness_score: brightnessAnalysis.averageScore,
           brightness_description: brightnessAnalysis.description,
           combination_effect: brightnessAnalysis.combinationEffect,
           star_details: brightnessAnalysis.starDetails,
           recommendations: brightnessAnalysis.recommendations
         }
       };
    }
    
    return palaces;
  }

  // 生成完整星盘
  generateCompleteChart(twelvePalaces, mainStarPositions, luckyStarPositions, unluckyStarPositions) {
    const chart = {
      chart_type: '紫微斗数命盘',
      palace_distribution: {},
      star_summary: {
        main_stars: 0,
        lucky_stars: 0,
        unlucky_stars: 0,
        total_stars: 0
      }
    };
    
    // 统计星曜分布
    Object.keys(twelvePalaces).forEach(palaceName => {
      const palace = twelvePalaces[palaceName];
      chart.palace_distribution[palaceName] = {
        position: palace.position,
        stars: palace.all_stars,
        strength: palace.strength
      };
      
      chart.star_summary.main_stars += palace.main_stars.length;
      chart.star_summary.lucky_stars += palace.lucky_stars.length;
      chart.star_summary.unlucky_stars += palace.unlucky_stars.length;
      chart.star_summary.total_stars += palace.all_stars.length;
    });
    
    return chart;
  }

  // 各星曜安星计算方法
  
  // 文昌星安星
  calculateWenchangPosition(hour) {
    const hourBranch = Math.floor((hour + 1) / 2) % 12;
    const wenchangMap = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 11]; // 戌酉申未午巳辰卯寅丑子亥
    return wenchangMap[hourBranch];
  }

  // 左辅星安星
  calculateZuofuPosition(month) {
    return (month + 1) % 12; // 寅宫起正月
  }

  // 天魁星安星
  calculateTiankuiPosition(year) {
    const yearStemIndex = (year - 4) % 10;
    const tiankuiMap = [1, 0, 11, 10, 1, 0, 11, 10, 5, 4]; // 甲乙丙丁戊己庚辛壬癸
    return tiankuiMap[yearStemIndex];
  }

  // 天钺星安星
  calculateTianyuePosition(year) {
    const yearStemIndex = (year - 4) % 10;
    const tianyueMap = [7, 8, 9, 10, 7, 8, 9, 10, 3, 2]; // 甲乙丙丁戊己庚辛壬癸
    return tianyueMap[yearStemIndex];
  }

  // 擎羊星安星
  calculateQingyangPosition(year) {
    const yearStemIndex = (year - 4) % 10;
    const qingyangMap = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // 甲乙丙丁戊己庚辛壬癸
    return qingyangMap[yearStemIndex];
  }

  // 火星安星
  // 传统规则：寅午戌年从丑宫起子时顺行，申子辰年从寅宫起子时顺行，
  // 巳酉丑年从卯宫起子时顺行，亥卯未年从酉宫起子时顺行
  calculateHuoxingPosition(year, hour) {
    const yearBranchIndex = (year - 4) % 12;
    const hourBranch = Math.floor((hour + 1) / 2) % 12;
    // 火星起始宫位：寅午戌→丑(1), 申子辰→寅(2), 巳酉丑→卯(3), 亥卯未→酉(9)
    const huoxingStartMap = [2, 3, 1, 9, 2, 3, 1, 9, 2, 3, 1, 9];
    const startPosition = huoxingStartMap[yearBranchIndex];
    return (startPosition + hourBranch) % 12;
  }

  // 铃星安星
  // 传统规则：寅午戌年从卯宫起子时顺行，申子辰年从戌宫起子时顺行，
  // 巳酉丑年从戌宫起子时顺行，亥卯未年从戌宫起子时顺行
  calculateLingxingPosition(year, hour) {
    const yearBranchIndex = (year - 4) % 12;
    const hourBranch = Math.floor((hour + 1) / 2) % 12;
    // 铃星起始宫位：寅午戌→卯(3), 申子辰→戌(10), 巳酉丑→戌(10), 亥卯未→戌(10)
    const lingxingStartMap = [10, 10, 3, 10, 10, 10, 3, 10, 10, 10, 3, 10];
    const startPosition = lingxingStartMap[yearBranchIndex];
    return (startPosition + hourBranch) % 12;
  }

  // 地空星安星
  calculateDikongPosition(hour) {
    const hourBranch = Math.floor((hour + 1) / 2) % 12;
    const dikongMap = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 11];
    return dikongMap[hourBranch];
  }

  // 计算四化
  calculateSiHua(year) {
    const yearStemIndex = (year - 4) % 10;
    const yearStem = this.baseData.getStemByIndex(yearStemIndex);
    const siHua = this.sihuaTable[yearStem] || this.sihuaTable['甲'];
    
    // 使用增强四化系统
     const currentYear = new Date().getFullYear();
     const currentMonth = new Date().getMonth() + 1;
     const daxianStem = yearStem; // 简化处理，实际应该根据大限计算
     
     const enhancedSiHuaData = this.enhancedSiHua.calculateMultiLevelSiHua(
       year, currentYear, currentMonth, daxianStem
     );
     
     return {
       year_stem: yearStem,
       // 保持原有格式兼容性
       hua_lu: { star: siHua.lu, meaning: '化禄主财禄，增强星曜的正面能量' },
       hua_quan: { star: siHua.quan, meaning: '化权主权力，增强星曜的权威性' },
       hua_ke: { star: siHua.ke, meaning: '化科主名声，增强星曜的声誉' },
       hua_ji: { star: siHua.ji, meaning: '化忌主阻碍，需要特别注意的星曜' },
       // 新增增强四化数据
       enhanced_sihua: enhancedSiHuaData,
       multi_level_analysis: {
         birth_year_effects: enhancedSiHuaData.birth_sihua,
         current_year_effects: enhancedSiHuaData.current_year_sihua,
         interaction_summary: enhancedSiHuaData.interaction_analysis
       }
     };
  }
  
  // 分析四化星的详细效果
  analyzeSiHuaEffects(siHua) {
    return {
      lu_effect: {
        star: siHua.lu,
        nature: '化禄',
        primary_meaning: '财禄、贵人、机遇',
        secondary_effects: ['增加收入机会', '遇贵人相助', '事业发展顺利'],
        activation_conditions: '逢吉星加会，效果更佳'
      },
      quan_effect: {
        star: siHua.quan,
        nature: '化权',
        primary_meaning: '权威、能力、成就',
        secondary_effects: ['提升领导能力', '增强决策权', '获得权威地位'],
        activation_conditions: '需要主动争取，方能发挥'
      },
      ke_effect: {
        star: siHua.ke,
        nature: '化科',
        primary_meaning: '名声、学问、考试',
        secondary_effects: ['学业进步', '考试顺利', '名声提升'],
        activation_conditions: '需要持续学习和努力'
      },
      ji_effect: {
        star: siHua.ji,
        nature: '化忌',
        primary_meaning: '阻碍、困扰、变化',
        secondary_effects: ['遇到阻碍', '情绪波动', '需要调整策略'],
        mitigation_methods: ['保持冷静', '寻求帮助', '调整心态']
      }
    };
  }
  
  // 分析四化星的相互作用
  analyzeSiHuaInteractions(siHua) {
    const interactions = [];
    
    // 分析化禄与化权的配合
    if (siHua.lu && siHua.quan) {
      interactions.push({
        type: '禄权配合',
        description: `${siHua.lu}化禄与${siHua.quan}化权相配，财权并重，发展潜力大`,
        effect: '正面'
      });
    }
    
    // 分析化忌的影响
    if (siHua.ji) {
      interactions.push({
        type: '化忌影响',
        description: `${siHua.ji}化忌需要特别注意，可能带来相关领域的挑战`,
        effect: '需要注意',
        suggestions: ['保持谨慎', '提前准备', '寻求化解方法']
      });
    }
    
    return interactions;
   }
   
   // 提取关键互动效应
   extractKeyInteractions(palaceInteractions) {
     const keyInteractions = [];
     
     Object.entries(palaceInteractions).forEach(([palaceName, interaction]) => {
       if (interaction.overall_interaction_strength > 0.7) {
         keyInteractions.push({
           palace: palaceName,
           strength: interaction.overall_interaction_strength,
           type: '强互动',
           description: `${palaceName}与其他宫位形成强烈互动效应`
         });
       }
     });
     
     return keyInteractions.sort((a, b) => b.strength - a.strength).slice(0, 5);
   }
   
   // 生成互动建议
   generateInteractionRecommendations(palaceInteractions, personName) {
     const recommendations = [];
     
     Object.entries(palaceInteractions).forEach(([palaceName, interaction]) => {
       const effects = interaction.interaction_effects;
       
       if (effects.opposite_palace.strength > 0.6) {
         recommendations.push({
           type: '对宫平衡',
           palace: palaceName,
           recommendation: `${personName}需要注意${palaceName}与${effects.opposite_palace.target_palace}的平衡发展`
         });
       }
       
       if (effects.triangle_palaces.average_strength > 0.7) {
         recommendations.push({
           type: '三合助力',
           palace: palaceName,
           recommendation: `${personName}可以善用${palaceName}的三合宫位带来的助力`
         });
       }
     });
     
     return recommendations.slice(0, 8);
   }
   
   // 分析动态效应
   analyzeDynamicEffects(palaceInteractions, siHuaData) {
     const dynamicEffects = {
       current_active_palaces: [],
       potential_conflicts: [],
       enhancement_opportunities: [],
       timing_suggestions: []
     };
     
     // 分析当前活跃宫位
     Object.entries(palaceInteractions).forEach(([palaceName, interaction]) => {
       if (interaction.overall_interaction_strength > 0.6) {
         dynamicEffects.current_active_palaces.push({
           palace: palaceName,
           activity_level: interaction.overall_interaction_strength,
           main_effects: this.summarizePalaceEffects(interaction.interaction_effects)
         });
       }
     });
     
     // 基于四化数据分析潜在冲突
     if (siHuaData.enhanced_sihua?.interaction_analysis?.conflicts) {
       dynamicEffects.potential_conflicts = siHuaData.enhanced_sihua.interaction_analysis.conflicts.map(conflict => ({
         type: conflict.type,
         description: conflict.impact,
         affected_areas: this.mapConflictToPalaces(conflict)
       }));
     }
     
     return dynamicEffects;
   }
   
   // 总结宫位效应
   summarizePalaceEffects(effects) {
     const summary = [];
     
     if (effects.opposite_palace.strength > 0.5) {
       summary.push(`对宫${effects.opposite_palace.target_palace}影响较强`);
     }
     
     if (effects.triangle_palaces.average_strength > 0.5) {
       summary.push(`三合宫位${effects.triangle_palaces.target_palaces.join('、')}形成助力`);
     }
     
     return summary;
   }
   
   // 映射冲突到宫位
   mapConflictToPalaces(conflict) {
     // 简化映射，实际应该根据具体冲突类型进行详细分析
     const affectedPalaces = ['命宫', '财帛宫', '事业宫', '夫妻宫'];
     return affectedPalaces.slice(0, 2);
   }

  // 计算大限（基于五行局）
  calculateMajorPeriods(mingGongIndex, gender, wuxingJu, birthYear) {
    const periods = [];
    const isMale = gender === 'male' || gender === '男';
    const startAge = wuxingJu.start_age;
    const periodLength = 10; // 每个大限10年
    
    // 计算当前年龄
    const currentYear = new Date().getFullYear();
    const currentAge = currentYear - birthYear; // 使用真实出生年份
    
    for (let i = 0; i < 12; i++) {
      const ageStart = startAge + i * periodLength;
      const ageEnd = ageStart + periodLength - 1;
      
      // 根据性别确定大限宫位顺序
      const palaceIndex = isMale ? 
        (mingGongIndex + i) % 12 : 
        (mingGongIndex - i + 12) % 12;
      
      const isCurrent = currentAge >= ageStart && currentAge <= ageEnd;
      
      periods.push({
        period_number: i + 1,
        age_range: `${ageStart}-${ageEnd}岁`,
        palace_branch: this.baseData.getBranchByIndex(palaceIndex),
        palace_name: this.palaceNames[i],
        is_current: isCurrent,
        wuxing_ju: wuxingJu.type,
        description: `第${i + 1}大限：${ageStart}-${ageEnd}岁，在${this.baseData.getBranchByIndex(palaceIndex)}宫（${this.palaceNames[i]}）`
      });
    }
    
    return {
      start_age: startAge,
      period_length: periodLength,
      wuxing_ju: wuxingJu.type,
      current_period: periods.find(p => p.is_current) || periods[0],
      all_periods: periods
    };
  }

  // 生成专业宫位解读
  generatePalaceInterpretation(palaceName, mainStars, luckyStars, unluckyStars) {
    const baseInterpretations = {
      '命宫': '代表个人的性格、外貌、才能和一生的命运走向',
      '兄弟宫': '代表兄弟姐妹关系、朋友关系和合作伙伴',
      '夫妻宫': '代表婚姻状况、配偶特质和感情生活',
      '子女宫': '代表子女缘分、创造力和部属关系',
      '财帛宫': '代表财运、理财能力和金钱观念',
      '疾厄宫': '代表健康状况、疾病倾向和意外灾厄',
      '迁移宫': '代表外出运、变动和人际关系',
      '交友宫': '代表朋友关系、社交能力和人脉网络',
      '事业宫': '代表事业发展、工作状况和社会地位',
      '田宅宫': '代表不动产、居住环境和家庭状况',
      '福德宫': '代表精神享受、兴趣爱好和福分',
      '父母宫': '代表父母关系、长辈缘分和权威关系'
    };
    
    let interpretation = baseInterpretations[palaceName] || '此宫位的基本含义';
    
    // 分析主星影响
    if (mainStars.length > 0) {
      interpretation += `。主星为${mainStars.join('、')}，`;
      interpretation += this.getStarInfluence(mainStars[0], palaceName);
    }
    
    // 分析吉星影响
    if (luckyStars.length > 0) {
      interpretation += `。吉星${luckyStars.join('、')}加持，增强正面能量`;
    }
    
    // 分析煞星影响
    if (unluckyStars.length > 0) {
      interpretation += `。煞星${unluckyStars.join('、')}同宫，需要特别注意相关事项`;
    }
    
    return interpretation;
  }

  // 计算宫位强度（综合考虑所有星曜）
  calculatePalaceStrength(mainStars, luckyStars, unluckyStars) {
    let strength = 0;
    
    // 主星强度评分
    const strongMainStars = ['紫微', '天府', '太阳', '武曲', '天同', '廉贞'];
    const mediumMainStars = ['天机', '太阴', '贪狼', '巨门', '天相', '天梁'];
    const weakMainStars = ['七杀', '破军'];
    
    mainStars.forEach(star => {
      if (strongMainStars.includes(star)) strength += 3;
      else if (mediumMainStars.includes(star)) strength += 2;
      else if (weakMainStars.includes(star)) strength += 1;
    });
    
    // 吉星加分
    luckyStars.forEach(star => {
      strength += 1;
    });
    
    // 煞星减分
    unluckyStars.forEach(star => {
      strength -= 1;
    });
    
    // 判定强度等级
    if (strength >= 5) return '旺';
    if (strength >= 3) return '得地';
    if (strength >= 1) return '平';
    if (strength >= -1) return '不得地';
    return '陷';
  }

  // 确定宫位性质
  determinePalaceNature(palaceName) {
    const natures = {
      '命宫': '自我宫',
      '兄弟宫': '手足宫',
      '夫妻宫': '配偶宫',
      '子女宫': '子息宫',
      '财帛宫': '财富宫',
      '疾厄宫': '健康宫',
      '迁移宫': '外缘宫',
      '交友宫': '人际宫',
      '事业宫': '官禄宫',
      '田宅宫': '家业宫',
      '福德宫': '精神宫',
      '父母宫': '长辈宫'
    };
    return natures[palaceName] || '未知宫位';
  }

  // 分析关键影响
  analyzeKeyInfluences(mainStars, luckyStars, unluckyStars) {
    const influences = [];
    
    // 分析主星影响
    mainStars.forEach(star => {
      influences.push({
        star: star,
        type: 'main',
        influence: this.getStarKeyInfluence(star)
      });
    });
    
    // 分析吉星影响
    luckyStars.forEach(star => {
      influences.push({
        star: star,
        type: 'lucky',
        influence: '增强正面能量，带来助力'
      });
    });
    
    // 分析煞星影响
    unluckyStars.forEach(star => {
      influences.push({
        star: star,
        type: 'unlucky',
        influence: '带来挑战，需要谨慎应对'
      });
    });
    
    return influences;
  }

  // 获取星曜关键影响
  getStarKeyInfluence(star) {
    const influences = {
      '紫微': '帝王之星，具有领导才能和贵气',
      '天机': '智慧之星，善于策划和变通',
      '太阳': '光明之星，具有权威性和正义感',
      '武曲': '财星，意志坚强，理财有方',
      '天同': '福星，性格温和，享受生活',
      '廉贞': '囚星，感情丰富，追求完美',
      '天府': '库星，稳重保守，善于积累',
      '太阴': '富星，温柔体贴，直觉敏锐',
      '贪狼': '桃花星，多才多艺，善于交际',
      '巨门': '暗星，口才出众，善于分析',
      '天相': '印星，忠诚可靠，协调能力强',
      '天梁': '荫星，正直善良，有长者风范',
      '七杀': '将星，勇敢果断，开拓性强',
      '破军': '耗星，创新求变，不拘传统'
    };
    return influences[star] || '具有独特的影响力';
  }

  // 获取星曜影响
  getStarInfluence(star) {
    const influences = {
      '紫微': '具有领导才能和贵气，适合担任管理职务',
      '天机': '聪明机智，善于策划，适合从事智力工作',
      '太阳': '光明磊落，具有权威性，适合公职或领导工作',
      '武曲': '意志坚强，执行力强，适合财经或技术工作',
      '天同': '性格温和，人缘好，适合服务性工作',
      '廉贞': '个性鲜明，有艺术天分，适合创意工作',
      '天府': '稳重可靠，有组织能力，适合管理工作',
      '太阴': '细腻敏感，直觉力强，适合文艺或服务工作',
      '贪狼': '多才多艺，善于交际，适合业务或娱乐工作',
      '巨门': '口才好，分析力强，适合教育或传媒工作',
      '天相': '忠诚可靠，协调能力强，适合辅助性工作',
      '天梁': '正直善良，有长者风范，适合教育或公益工作',
      '七杀': '勇敢果断，开拓性强，适合竞争性工作',
      '破军': '创新求变，不拘传统，适合开创性工作'
    };
    
    return influences[star] || '具有独特的个性特质';
  }

  // 生成出生图
  generateBirthChart(twelvePalaces, starPositions) {
    const chart = {};
    
    Object.keys(twelvePalaces).forEach(palaceName => {
      const palace = twelvePalaces[palaceName];
      chart[palaceName] = {
        position: palace.position,
        stars: palace.stars,
        strength: palace.strength
      };
    });
    
    return chart;
  }

  // 生成专业的紫微斗数分析
  generateProfessionalAnalysis(starChart, personName, personGender, baziInfo, wuxingJu, birthYear) {
    const mingGongStars = starChart.mingGongStars;
    const mainStar = mingGongStars[0] || '天机'; // 默认天机星
    const twelvePalaces = starChart.twelvePalaces;
    
    // 计算宫位互动效应
    const palaceInteractions = this.enhancedSiHua.analyzePalaceInteractions(twelvePalaces, starChart.siHua);
    
    return {
      personality_analysis: this.generatePersonalityAnalysis(personName, personGender, twelvePalaces['命宫'], mainStar),
      career_analysis: this.generateCareerAnalysis(personName, twelvePalaces['事业宫'], twelvePalaces['命宫'], starChart.majorPeriods),
      wealth_analysis: this.generateWealthAnalysis(personName, twelvePalaces['财帛宫'], twelvePalaces['命宫'], mainStar),
      relationship_analysis: this.generateRelationshipAnalysis(personName, personGender, twelvePalaces['夫妻宫'], twelvePalaces['命宫']),
      health_analysis: this.generateHealthAnalysis(personName, twelvePalaces['疾厄宫'], twelvePalaces['命宫']),
      family_analysis: this.generateFamilyAnalysis(personName, twelvePalaces, personGender),
      timing_analysis: this.generateTimingAnalysis(personName, starChart.majorPeriods, wuxingJu, birthYear),
      life_guidance: this.generateLifeGuidance(personName, mainStar, twelvePalaces, starChart.siHua),
      // 新增宫位互动效应分析
      palace_interactions: {
        interaction_matrix: palaceInteractions,
        key_interactions: this.extractKeyInteractions(palaceInteractions),
        interaction_recommendations: this.generateInteractionRecommendations(palaceInteractions, personName),
        dynamic_effects: this.analyzeDynamicEffects(palaceInteractions, starChart.siHua)
      }
    };
  }

  // 生成深度个性分析
  generatePersonalityAnalysis(personName, personGender, mingGong, mainStar) {
    const mainStars = mingGong.main_stars;
    const luckyStars = mingGong.lucky_stars;
    const unluckyStars = mingGong.unlucky_stars;
    const position = mingGong.position;
    
    return {
      overview: this.generatePersonalityOverview(personName, position, mainStars, mainStar, personGender),
      core_traits: this.analyzeDeepPersonalityTraits(mainStars, luckyStars, unluckyStars, personName, personGender),
      strengths: this.analyzePersonalizedStrengths(mainStars, luckyStars, personName, personGender),
      challenges: this.analyzePersonalizedChallenges(mainStars, unluckyStars, personName, personGender),
      development_potential: this.analyzePersonalizedPotential(mainStars, luckyStars, personGender, personName),
      life_attitude: this.analyzePersonalizedLifeAttitude(mainStar, personGender, personName),
      personality_evolution: this.analyzePersonalityEvolution(mainStars, personName, personGender),
      social_interaction: this.analyzeSocialInteractionStyle(mainStars, luckyStars, personName),
      decision_making: this.analyzeDecisionMakingStyle(mainStars, personName, personGender)
    };
  }
  
  // 生成个性化概述
  generatePersonalityOverview(personName, position, mainStars, mainStar, personGender) {
    const starCombination = mainStars.join('、') || '无主星';
    const positionInfluence = this.getPositionPersonalityInfluence(position);
    const genderModifier = personGender === '男性' ? '展现出男性的阳刚特质' : '体现了女性的阴柔魅力';
    
    return `${personName}，您的命宫坐落在${position}，主星为${starCombination}。${positionInfluence}这样的星曜组合使您${this.getStarCombinationPersonality(mainStars, personName)}，同时${genderModifier}。您的人生格局${this.getLifePatternDescription(mainStar, personName)}。`;
  }
  
  // 获取宫位对性格的影响
  getPositionPersonalityInfluence(position) {
    const positionInfluences = {
      '子': '您天生具有智慧和灵活性，思维敏捷，适应能力强。子宫属水，代表智慧和流动性，使您在处理复杂问题时能够灵活变通，善于从多个角度思考问题。',
      '丑': '您性格稳重踏实，做事有条不紊，具有很强的耐心和毅力。丑宫属土，代表稳定和积累，使您在面对困难时能够坚持不懈，通过持续努力获得成功。',
      '寅': '您充满活力和创造力，勇于开拓，具有领导潜质。寅宫属木，代表生长和创新，使您具有强烈的进取心和开拓精神，善于在新领域中发挥才华。',
      '卯': '您温和善良，具有艺术天赋，人际关系和谐。卯宫属木，代表温和和美感，使您在人际交往中表现出色，具有很强的亲和力和艺术鉴赏能力。',
      '辰': '您聪明好学，具有很强的分析能力和判断力。辰宫属土，代表智慧和储藏，使您善于学习和积累知识，在专业领域能够达到很高的水平。',
      '巳': '您热情奔放，具有很强的表现力和感染力。巳宫属火，代表热情和表达，使您在社交场合中能够吸引他人注意，具有很强的影响力和说服力。',
      '午': '您光明磊落，具有正义感，喜欢帮助他人。午宫属火，代表光明和正义，使您在道德品格上表现突出，容易获得他人的信任和尊重。',
      '未': '您细腻敏感，具有很强的直觉力和同情心。未宫属土，代表细腻和包容，使您在情感方面非常敏锐，善于理解和关怀他人的需求。',
      '申': '您机智灵活，具有很强的变通能力和商业头脑。申宫属金，代表变化和机智，使您在商业活动中表现出色，善于把握机会和创造价值。',
      '酉': '您追求完美，注重细节，具有很强的审美能力。酉宫属金，代表精致和完美，使您在工作和生活中都追求高标准，具有很强的品质意识。',
      '戌': '您忠诚可靠，具有很强的责任感和正义感。戌宫属土，代表忠诚和守护，使您在团队中成为可靠的支柱，能够承担重要的责任和使命。',
      '亥': '您包容性强，具有很强的想象力和创造力。亥宫属水，代表包容和智慧，使您在思维上非常开阔，能够接纳不同的观点和创新的想法。'
    };
    
    return positionInfluences[position] || '您具有独特的性格特质。';
  }
  
  // 获取星曜组合的性格特征
  getStarCombinationPersonality(mainStars, personName) {
    if (mainStars.length === 0) {
      return '虽然命宫无主星，但这反而赋予了您更大的可塑性和发展空间';
    }
    
    if (mainStars.length === 1) {
      const star = mainStars[0];
      const singleStarPersonality = {
        '紫微': '具有天生的领导气质和贵族风范，喜欢受人尊敬，有很强的自尊心',
        '天机': '思维敏捷，善于策划，具有很强的分析能力和应变能力',
        '太阳': '光明磊落，热情开朗，具有很强的正义感和表现欲',
        '武曲': '意志坚强，执行力强，具有很强的赚钱能力和理财观念',
        '天同': '性格温和，人缘好，具有很强的亲和力和包容心',
        '廉贞': '感情丰富，有艺术天分，但情绪波动较大',
        '天府': '稳重可靠，善于积累，注重安全感',
        '太阴': '细腻敏感，直觉力强，善于照顾他人',
        '贪狼': '多才多艺，善于交际，欲望强烈，喜欢新鲜事物',
        '巨门': '口才好，分析力强，善于发现问题',
        '天相': '忠诚可靠，协调能力强，善于辅助他人',
        '天梁': '正直善良，有长者风范，具有很强的责任感',
        '七杀': '冲劲十足，勇于开拓，不怕困难',
        '破军': '喜欢变化，勇于创新，不满足现状'
      };
      
      return singleStarPersonality[star] || '具有独特的个性特征';
    }
    
    // 双星或多星组合的特殊分析
    const starSet = new Set(mainStars);
    
    if (starSet.has('紫微') && starSet.has('天府')) {
      return '集领导才能与稳重品格于一身，既有帝王之气又有宰相之才';
    }
    if (starSet.has('紫微') && starSet.has('贪狼')) {
      return '既有领导欲望又富有才艺，能在多个领域展现才华';
    }
    if (starSet.has('太阳') && starSet.has('太阴')) {
      return '阴阳调和，既有阳光的热情又有月亮的温柔，性格平衡';
    }
    if (starSet.has('武曲') && starSet.has('贪狼')) {
      return '既有赚钱能力又有多元才华，适合多方面发展';
    }
    
    return `融合了${mainStars.join('、')}的特质，形成了独特而复合的性格特征`;
  }
  
  // 深度性格特质分析
  analyzeDeepPersonalityTraits(mainStars, luckyStars, unluckyStars, personName, personGender) {
     let traits = [];
     
     // 基于主星的核心特质
     mainStars.forEach(star => {
       const starTraits = this.getStarCoreTraits(star, personName, personGender);
       traits.push(starTraits);
     });
     
     // 吉星的正面影响
     if (luckyStars.length > 0) {
       const luckyInfluence = this.getLuckyStarsInfluence(luckyStars, personName);
       traits.push(luckyInfluence);
     }
     
     // 煞星的挑战与成长
     if (unluckyStars.length > 0) {
       const challengeGrowth = this.getUnluckyStarsGrowth(unluckyStars, personName);
       traits.push(challengeGrowth);
     }
     
     return traits.join('；');
   }
   
   // 获取主星核心特质
   getStarCoreTraits(star, personName, personGender) {
     const genderPrefix = personGender === '男性' ? '作为男性' : '作为女性';
     
     const starTraits = {
       '紫微': `${personName}，您具有天生的领导魅力和高贵气质。${genderPrefix}，您展现出强烈的责任感和使命感，喜欢在团队中担任核心角色，但有时可能过于在意他人的看法`,
       '天机': `${personName}，您的思维极其敏捷，善于洞察事物的本质。${genderPrefix}，您具有很强的策划能力和应变能力，但有时可能因为想得太多而错失行动的最佳时机`,
       '太阳': `${personName}，您如太阳般光明磊落，具有强烈的正义感。${genderPrefix}，您天生具有感染他人的能力，喜欢帮助他人，但要注意不要过度消耗自己的能量`,
       '武曲': `${personName}，您意志坚强，执行力超群。${genderPrefix}，您具有很强的目标导向性和实现能力，在财务管理方面有天赋，但要学会在坚持中保持灵活`,
       '天同': `${personName}，您性格温和，具有很强的亲和力。${genderPrefix}，您善于营造和谐的氛围，人际关系良好，但有时可能因为过于随和而缺乏主见`,
       '廉贞': `${personName}，您感情丰富，具有艺术天赋。${genderPrefix}，您追求美好的事物，有很强的审美能力，但情绪波动较大，需要学会情绪管理`,
       '天府': `${personName}，您稳重可靠，是他人的依靠。${genderPrefix}，您善于积累和管理，注重安全感，具有很强的组织能力，但有时可能过于保守`,
       '太阴': `${personName}，您细腻敏感，直觉力强。${genderPrefix}，您善于照顾他人，具有很强的同理心，但有时可能过于敏感，容易受到情绪影响`,
       '贪狼': `${personName}，您多才多艺，充满魅力。${genderPrefix}，您善于交际，适应能力强，喜欢尝试新事物，但要注意专注力的培养`,
       '巨门': `${personName}，您口才出众，分析能力强。${genderPrefix}，您善于发现问题的关键，具有很强的研究精神，但要注意表达方式的温和`,
       '天相': `${personName}，您忠诚可靠，协调能力强。${genderPrefix}，您善于辅助他人，具有很强的服务精神，但要学会在帮助他人的同时也要为自己考虑`,
       '天梁': `${personName}，您正直善良，具有长者风范。${genderPrefix}，您有很强的责任感和正义感，喜欢帮助弱者，但要避免过于严肃`,
       '七杀': `${personName}，您冲劲十足，勇于开拓。${genderPrefix}，您不怕困难，具有很强的开拓精神，但要学会在冲劲中保持理性`,
       '破军': `${personName}，您勇于创新，不满足现状。${genderPrefix}，您具有很强的变革能力，善于突破，但要注意在变化中保持稳定的核心价值`
     };
     
     return starTraits[star] || `${personName}，您具有${star}的独特特质`;
   }
   
   // 获取吉星影响
   getLuckyStarsInfluence(luckyStars, personName) {
     const influences = [];
     
     luckyStars.forEach(star => {
       const starInfluence = {
         '文昌': `${personName}，文昌星的加持使您文思敏捷，学习能力强，在文化艺术方面有特殊天赋`,
         '文曲': `${personName}，文曲星的影响让您口才出众，表达能力强，善于与人沟通交流`,
         '左辅': `${personName}，左辅星的帮助使您容易得到贵人相助，在团队中能发挥重要作用`,
         '右弼': `${personName}，右弼星的支持让您具有很强的协调能力，善于处理人际关系`,
         '天魁': `${personName}，天魁星的庇佑使您容易遇到年长的贵人，在关键时刻得到指导`,
         '天钺': `${personName}，天钺星的照耀让您具有很强的直觉力，能够把握机会`
       };
       
       if (starInfluence[star]) {
         influences.push(starInfluence[star]);
       }
     });
     
     return influences.join('；');
   }
   
   // 获取煞星成长机会
   getUnluckyStarsGrowth(unluckyStars, personName) {
     const growthOpportunities = [];
     
     unluckyStars.forEach(star => {
       const starGrowth = {
         '擎羊': `${personName}，擎羊星虽然带来冲动，但也赋予了您勇往直前的勇气，学会控制冲动就能化阻力为动力`,
         '陀罗': `${personName}，陀罗星可能带来拖延，但也培养了您的耐心和坚持，学会把握节奏就能稳步前进`,
         '火星': `${personName}，火星虽然容易急躁，但也给了您快速行动的能力，学会冷静思考就能事半功倍`,
         '铃星': `${personName}，铃星可能带来波动，但也增强了您的敏感度，学会情绪管理就能化挑战为优势`,
         '地空': `${personName}，地空星虽然可能带来空想，但也赋予了您丰富的想象力，脚踏实地就能实现理想`,
         '地劫': `${personName}，地劫星可能带来变化，但也培养了您的适应能力，学会稳中求变就能化险为夷`
       };
       
       if (starGrowth[star]) {
         growthOpportunities.push(starGrowth[star]);
       }
     });
     
     return growthOpportunities.join('；');
   }

  // 生成事业分析
  generateCareerAnalysis(personName, careerPalace, mingGong, majorPeriods) {
    const careerStars = careerPalace.main_stars;
    const mingGongStars = mingGong.main_stars;
    const careerLucky = careerPalace.lucky_stars;
    const careerUnlucky = careerPalace.unlucky_stars;
    const careerPosition = careerPalace.position;
    
    return {
      career_overview: this.generatePersonalizedCareerOverview(personName, careerStars, mingGongStars, careerPosition),
      career_potential: this.analyzeDeepCareerPotential(careerStars, mingGongStars, careerLucky, personName),
      suitable_industries: this.analyzePersonalizedIndustries(careerStars, mingGongStars, personName),
      leadership_style: this.analyzePersonalizedLeadershipStyle(mingGongStars, careerStars, personName),
      career_development: this.analyzePersonalizedCareerDevelopment(careerStars, careerPalace.strength, personName),
      peak_career_periods: this.analyzeDetailedCareerPeakPeriods(majorPeriods, careerStars, personName),
      career_challenges: this.analyzeCareerChallenges(careerUnlucky, careerStars, personName),
      success_strategies: this.generateCareerSuccessStrategies(careerStars, mingGongStars, personName),
      networking_guidance: this.generateNetworkingGuidance(careerStars, careerLucky, personName),
      career_transformation: this.analyzeCareerTransformation(careerStars, majorPeriods, personName),
      modern_career_advice: this.generateModernCareerAdvice(careerStars, mingGongStars, personName)
    };
  }

  // 生成财富分析
  generateWealthAnalysis(personName, wealthPalace, mingGong, mainStar) {
    const wealthStars = wealthPalace.main_stars;
    const wealthLucky = wealthPalace.lucky_stars;
    const wealthUnlucky = wealthPalace.unlucky_stars;
    const wealthPosition = wealthPalace.position;
    const mingGongStars = mingGong.main_stars;
    
    return {
      wealth_overview: this.generatePersonalizedWealthOverview(personName, wealthStars, mainStar, wealthPosition),
      wealth_potential: this.analyzeDeepWealthPotential(wealthStars, wealthLucky, wealthUnlucky, personName),
      earning_style: this.analyzePersonalizedEarningStyle(wealthStars, mainStar, personName),
      investment_tendency: this.analyzePersonalizedInvestmentTendency(wealthStars, mingGongStars, personName),
      financial_management: this.analyzePersonalizedFinancialManagement(wealthStars, wealthPalace.strength, personName),
      wealth_timing: this.analyzeDetailedWealthTiming(wealthStars, wealthLucky, personName),
      wealth_obstacles: this.analyzeWealthObstacles(wealthUnlucky, wealthStars, personName),
      wealth_opportunities: this.analyzeWealthOpportunities(wealthStars, wealthLucky, personName),
      passive_income: this.analyzePassiveIncomeOpportunities(wealthStars, mingGongStars, personName),
      financial_planning: this.generateFinancialPlanningAdvice(wealthStars, mainStar, personName),
      modern_wealth_strategies: this.generateModernWealthStrategies(wealthStars, mingGongStars, personName),
      risk_management: this.analyzeFinancialRiskManagement(wealthStars, wealthUnlucky, personName)
    };
  }

  // 生成感情分析
  generateRelationshipAnalysis(personName, personGender, marriagePalace, mingGong) {
    const marriageStars = marriagePalace.main_stars;
    const marriageLucky = marriagePalace.lucky_stars;
    const marriageUnlucky = marriagePalace.unlucky_stars;
    const marriagePosition = marriagePalace.position;
    const mingGongStars = mingGong.main_stars;
    
    return {
      relationship_overview: this.generatePersonalizedRelationshipOverview(personName, marriageStars, personGender, marriagePosition),
      marriage_fortune: this.analyzeDeepMarriageFortune(marriageStars, marriageLucky, marriageUnlucky, personName),
      spouse_characteristics: this.analyzeDetailedSpouseCharacteristics(marriageStars, personGender, personName),
      relationship_pattern: this.analyzePersonalizedRelationshipPattern(marriageStars, mingGongStars, personName),
      love_style: this.analyzeLoveStyle(marriageStars, mingGongStars, personGender, personName),
      marriage_timing: this.analyzeDetailedMarriageTiming(marriageStars, marriagePalace.strength, personName),
      relationship_challenges: this.analyzeDeepRelationshipChallenges(marriageUnlucky, marriageStars, personName),
      compatibility_analysis: this.analyzeCompatibilityFactors(marriageStars, mingGongStars, personName),
      relationship_growth: this.analyzeRelationshipGrowth(marriageStars, marriageLucky, personName),
      communication_style: this.analyzeCommunicationStyle(marriageStars, mingGongStars, personName),
      intimacy_patterns: this.analyzeIntimacyPatterns(marriageStars, personGender, personName),
      relationship_advice: this.generateComprehensiveRelationshipAdvice(marriageStars, personName, personGender),
      modern_dating_guidance: this.generateModernDatingGuidance(marriageStars, mingGongStars, personName, personGender)
    };
  }

  // 生成健康分析
  generateHealthAnalysis(personName, healthPalace, mingGong) {
    const healthStars = healthPalace.main_stars;
    const healthUnlucky = healthPalace.unlucky_stars;
    const mingGongStars = mingGong.main_stars;
    
    return {
      constitution_analysis: this.analyzeConstitution(healthStars, mingGongStars),
      health_tendencies: this.analyzeHealthTendencies(healthStars, healthUnlucky),
      vulnerable_areas: this.analyzeVulnerableAreas(healthStars, healthUnlucky),
      wellness_approach: this.analyzeWellnessApproach(mingGongStars),
      prevention_focus: this.analyzePreventionFocus(healthUnlucky),
      health_advice: this.generateHealthAdvice(healthStars, personName)
    };
  }

  // 生成家庭分析
  generateFamilyAnalysis(personName, twelvePalaces, personGender) {
    const parentsPalace = twelvePalaces['父母宫'];
    const siblingsPalace = twelvePalaces['兄弟宫'];
    const childrenPalace = twelvePalaces['子女宫'];
    
    return {
      parents_relationship: this.analyzeParentsRelationship(parentsPalace),
      siblings_relationship: this.analyzeSiblingsRelationship(siblingsPalace),
      children_fortune: this.analyzeChildrenFortune(childrenPalace, personGender),
      family_harmony: this.analyzeFamilyHarmony(parentsPalace, siblingsPalace, childrenPalace),
      family_responsibilities: this.analyzeFamilyResponsibilities(parentsPalace, childrenPalace),
      family_advice: this.generateFamilyAdvice(parentsPalace, childrenPalace, personName)
    };
  }

  // 生成时机分析（包含流年分析）
  generateTimingAnalysis(personName, majorPeriods, wuxingJu, birthYear) {
    const currentPeriod = majorPeriods.current_period;
    const allPeriods = majorPeriods.all_periods;
    const currentYear = new Date().getFullYear();
    
    // 计算小限
    const xiaoXian = this.calculateXiaoXian(currentYear, wuxingJu, birthYear);
    
    // 计算流年分析
    const liuNianAnalysis = this.calculateLiuNianAnalysis(currentYear, majorPeriods, xiaoXian);
    
    // 计算流月分析
    const liuYueAnalysis = this.calculateLiuYueAnalysis(currentYear, new Date().getMonth() + 1);
    
    return {
      current_period_analysis: this.analyzeCurrentPeriod(currentPeriod, personName),
      life_cycle_overview: this.analyzeLifeCycle(allPeriods, wuxingJu),
      key_turning_points: this.analyzeKeyTurningPoints(allPeriods),
      favorable_periods: this.analyzeFavorablePeriods(allPeriods),
      challenging_periods: this.analyzeChallengingPeriods(allPeriods),
      timing_advice: this.generateTimingAdvice(currentPeriod, personName),
      xiao_xian_analysis: xiaoXian,
      liu_nian_analysis: liuNianAnalysis,
      liu_yue_analysis: liuYueAnalysis,
      comprehensive_timing: this.generateComprehensiveTimingAnalysis(currentPeriod, xiaoXian, liuNianAnalysis, liuYueAnalysis)
    };
  }

  // 计算小限
  calculateXiaoXian(currentYear, wuxingJu, birthYear) {
    const age = currentYear - birthYear;
    const xiaoXianIndex = (age - 1) % 12;
    
    return {
      current_age: age,
      xiao_xian_position: this.baseData.getBranchByIndex(xiaoXianIndex),
      xiao_xian_meaning: `${age}岁小限在${this.baseData.getBranchByIndex(xiaoXianIndex)}宫`,
      xiao_xian_influence: this.analyzeXiaoXianInfluence(xiaoXianIndex, age),
      yearly_theme: this.getXiaoXianYearlyTheme(xiaoXianIndex)
    };
  }

  // 计算流年分析
  calculateLiuNianAnalysis(currentYear, majorPeriods, xiaoXian) {
    const yearStemIndex = (currentYear - 4) % 10;
    const yearBranchIndex = (currentYear - 4) % 12;
    const yearStem = this.baseData.getStemByIndex(yearStemIndex);
    const yearBranch = this.baseData.getBranchByIndex(yearBranchIndex);
    
    // 流年四化
    const liuNianSiHua = this.sihuaTable[yearStem];
    
    return {
      current_year: currentYear,
      year_ganzhi: yearStem + yearBranch,
      year_stem: yearStem,
      year_branch: yearBranch,
      liu_nian_sihua: {
        hua_lu: { star: liuNianSiHua.lu, meaning: '流年化禄，主财运亨通' },
        hua_quan: { star: liuNianSiHua.quan, meaning: '流年化权，主权力地位' },
        hua_ke: { star: liuNianSiHua.ke, meaning: '流年化科，主名声学业' },
        hua_ji: { star: liuNianSiHua.ji, meaning: '流年化忌，需要谨慎注意' }
      },
      year_fortune_analysis: this.analyzeLiuNianFortune(yearStem, yearBranch, majorPeriods.current_period),
      year_focus_areas: this.getLiuNianFocusAreas(yearStem, yearBranch),
      year_opportunities: this.getLiuNianOpportunities(liuNianSiHua),
      year_challenges: this.getLiuNianChallenges(liuNianSiHua),
      monthly_preview: this.generateMonthlyPreview(currentYear)
    };
  }

  // 计算流月分析
  calculateLiuYueAnalysis(currentYear, currentMonth) {
    const monthBranchIndex = (currentMonth + 1) % 12; // 寅月起正月
    const monthBranch = this.baseData.getBranchByIndex(monthBranchIndex);
    
    return {
      current_month: currentMonth,
      month_branch: monthBranch,
      month_theme: this.getMonthTheme(currentMonth),
      month_fortune: this.analyzeMonthFortune(monthBranchIndex, currentYear),
      month_focus: this.getMonthFocus(currentMonth),
      month_advice: this.getMonthAdvice(monthBranchIndex),
      next_month_preview: this.getNextMonthPreview(currentMonth + 1)
    };
  }

  // 生成综合时机分析
  generateComprehensiveTimingAnalysis(daxian, xiaoxian, liunian, liuyue) {
    return {
      overall_timing: `当前处于${daxian.description}，${xiaoxian.xiao_xian_meaning}，${liunian.year_ganzhi}年`,
      timing_coordination: this.analyzeTimingCoordination(daxian, xiaoxian, liunian),
      best_timing_advice: this.getBestTimingAdvice(daxian, liunian),
      timing_warnings: this.getTimingWarnings(liunian.liu_nian_sihua),
      seasonal_guidance: this.getSeasonalGuidance(liuyue.current_month)
    };
  }

  // 生成人生指导（包含格局分析）
  generateLifeGuidance(personName, mainStar, twelvePalaces, siHua) {
    const mingGong = twelvePalaces['命宫'];
    const fuDe = twelvePalaces['福德宫'];
    const qianYi = twelvePalaces['迁移宫'];
    const tianzhai = twelvePalaces['田宅宫'];
    
    // 格局判定
    const patternAnalysis = this.analyzeZiweiPatterns(twelvePalaces, siHua);
    
    return {
      life_overview: this.generatePersonalizedLifeOverview(personName, mainStar, mingGong, patternAnalysis),
      life_purpose: this.analyzeDeepLifePurpose(mainStar, mingGong, siHua, personName),
      core_values: this.analyzePersonalizedCoreValues(mingGong, fuDe, personName),
      development_direction: this.analyzeComprehensiveDevelopmentDirection(mainStar, twelvePalaces, personName),
      spiritual_growth: this.analyzePersonalizedSpiritualGrowth(fuDe, siHua, personName),
      life_lessons: this.analyzeDeepLifeLessons(mingGong, twelvePalaces, personName),
      life_phases: this.analyzeLifePhases(twelvePalaces, siHua, personName),
      destiny_fulfillment: this.analyzeDestinyFulfillment(mainStar, patternAnalysis, personName),
      karmic_patterns: this.analyzeKarmicPatterns(mingGong, qianYi, personName),
      life_balance: this.analyzeLifeBalance(twelvePalaces, personName),
      legacy_building: this.analyzeLegacyBuilding(mingGong, tianzhai, personName),
      wisdom_cultivation: this.analyzeWisdomCultivation(fuDe, siHua, personName),
      overall_guidance: this.generateComprehensiveOverallGuidance(mainStar, personName, patternAnalysis),
      pattern_analysis: patternAnalysis,
      modern_life_integration: this.generateModernLifeIntegration(twelvePalaces, personName)
    };
  }

  // 紫微斗数格局判定系统
  analyzeZiweiPatterns(twelvePalaces, siHua) {
    const patterns = [];
    const mingGong = twelvePalaces['命宫'];
    const caiBo = twelvePalaces['财帛宫'];
    const shiYe = twelvePalaces['事业宫'];
    const fuQi = twelvePalaces['夫妻宫'];
    
    // 检测各种格局
    patterns.push(...this.detectMajorPatterns(twelvePalaces));
    patterns.push(...this.detectWealthPatterns(mingGong, caiBo));
    patterns.push(...this.detectCareerPatterns(mingGong, shiYe));
    patterns.push(...this.detectRelationshipPatterns(mingGong, fuQi));
    patterns.push(...this.detectSiHuaPatterns(twelvePalaces, siHua));
    
    return {
      detected_patterns: patterns,
      pattern_count: patterns.length,
      primary_pattern: patterns.length > 0 ? patterns[0] : null,
      pattern_strength: this.calculatePatternStrength(patterns),
      pattern_guidance: this.generatePatternGuidance(patterns)
    };
  }

  // 检测主要格局
  detectMajorPatterns(twelvePalaces) {
    const patterns = [];
    const mingGong = twelvePalaces['命宫'];
    const mingGongStars = mingGong.main_stars;
    
    // 紫府朝垣格
    if (mingGongStars.includes('紫微') && mingGongStars.includes('天府')) {
      patterns.push({
        name: '紫府朝垣格',
        type: 'major',
        level: 'excellent',
        description: '紫微天府同宫，帝王之格，主贵气天成，领导才能出众',
        influence: '具有天生的领导气质和贵人运，适合从事管理或权威性工作',
        advice: '发挥领导才能，承担更多责任，但要避免过于自负'
      });
    }
    
    // 天府朝垣格
    if (mingGongStars.includes('天府') && !mingGongStars.includes('紫微')) {
      patterns.push({
        name: '天府朝垣格',
        type: 'major',
        level: 'good',
        description: '天府独坐命宫，库星当权，主财富积累，稳重发展',
        influence: '具有很强的理财能力和稳定发展的特质',
        advice: '注重财富积累，稳健投资，避免投机冒险'
      });
    }
    
    // 君臣庆会格
    if (mingGongStars.includes('紫微') && (mingGongStars.includes('左辅') || mingGongStars.includes('右弼'))) {
      patterns.push({
        name: '君臣庆会格',
        type: 'major',
        level: 'excellent',
        description: '紫微遇左辅右弼，君臣相得，主事业有成，贵人相助',
        influence: '事业发展顺利，容易得到贵人帮助和提携',
        advice: '善用人际关系，发挥团队合作精神，成就大业'
      });
    }
    
    // 石中隐玉格
    if (mingGongStars.includes('巨门') && mingGongStars.includes('太阳')) {
      patterns.push({
        name: '石中隐玉格',
        type: 'major',
        level: 'good',
        description: '巨门太阳同宫，暗星遇明星，主大器晚成，口才出众',
        influence: '具有很强的表达能力和分析能力，适合教育或传媒工作',
        advice: '发挥口才优势，注重知识积累，耐心等待机会'
      });
    }
    
    // 日照雷门格
    if (mingGongStars.includes('太阳') && !mingGongStars.includes('巨门')) {
      patterns.push({
        name: '日照雷门格',
        type: 'major',
        level: 'good',
        description: '太阳独坐命宫，光明正大，主权威显赫，正义感强',
        influence: '具有很强的正义感和权威性，适合公职或领导工作',
        advice: '发挥正面影响力，坚持正义原则，服务社会大众'
      });
    }
    
    return patterns;
  }

  // 检测财富格局
  detectWealthPatterns(mingGong, caiBo) {
    const patterns = [];
    const mingGongStars = mingGong.main_stars;
    const caiBoStars = caiBo.main_stars;
    
    // 财禄夹印格
    if (caiBoStars.includes('武曲') && mingGong.lucky_stars.includes('禄存')) {
      patterns.push({
        name: '财禄夹印格',
        type: 'wealth',
        level: 'excellent',
        description: '武曲守财帛，禄存拱命，主财运亨通，理财有方',
        influence: '具有很强的赚钱能力和理财天赋',
        advice: '善用理财技巧，多元化投资，稳健积累财富'
      });
    }
    
    // 贪武同行格
    if (mingGongStars.includes('贪狼') && mingGongStars.includes('武曲')) {
      patterns.push({
        name: '贪武同行格',
        type: 'wealth',
        level: 'good',
        description: '贪狼武曲同宫，财星桃花星相会，主财运和人缘俱佳',
        influence: '通过人际关系和多元发展获得财富',
        advice: '发挥社交优势，拓展人脉网络，把握商机'
      });
    }
    
    return patterns;
  }

  // 检测事业格局
  detectCareerPatterns(mingGong, shiYe) {
    const patterns = [];
    const mingGongStars = mingGong.main_stars;
    const shiYeStars = shiYe.main_stars;
    
    // 将星得地格
    if (shiYeStars.includes('七杀') && shiYe.strength === '旺') {
      patterns.push({
        name: '将星得地格',
        type: 'career',
        level: 'excellent',
        description: '七杀守事业宫且庙旺，将星得地，主事业有成，领导有方',
        influence: '具有很强的执行力和领导能力，适合开创性事业',
        advice: '发挥开拓精神，勇于承担责任，成就一番事业'
      });
    }
    
    // 科名会禄格
    if (shiYe.lucky_stars.includes('文昌') || shiYe.lucky_stars.includes('文曲')) {
      patterns.push({
        name: '科名会禄格',
        type: 'career',
        level: 'good',
        description: '文昌文曲守事业宫，主学业有成，名声显赫',
        influence: '适合从事文教、学术或文化创意工作',
        advice: '注重学习和知识积累，发挥文才优势'
      });
    }
    
    return patterns;
  }

  // 检测感情格局
  detectRelationshipPatterns(mingGong, fuQi) {
    const patterns = [];
    const fuQiStars = fuQi.main_stars;
    
    // 红鸾天喜格
    if (fuQi.lucky_stars.includes('红鸾') || fuQi.lucky_stars.includes('天喜')) {
      patterns.push({
        name: '红鸾天喜格',
        type: 'relationship',
        level: 'good',
        description: '红鸾天喜守夫妻宫，主姻缘美满，感情和谐',
        influence: '感情运势较好，容易遇到合适的伴侣',
        advice: '珍惜感情机会，用心经营婚姻关系'
      });
    }
    
    // 天同太阴格
    if (fuQiStars.includes('天同') && fuQiStars.includes('太阴')) {
      patterns.push({
        name: '天同太阴格',
        type: 'relationship',
        level: 'good',
        description: '天同太阴守夫妻宫，主配偶温和，家庭和睦',
        influence: '配偶性格温和，家庭生活幸福美满',
        advice: '保持家庭和谐，相互理解支持'
      });
    }
    
    return patterns;
  }

  // 检测四化格局
  detectSiHuaPatterns(twelvePalaces, siHua) {
    const patterns = [];
    
    // 化禄拱命格
    const mingGong = twelvePalaces['命宫'];
    if (mingGong.main_stars.includes(siHua.lu)) {
      patterns.push({
        name: '化禄拱命格',
        type: 'sihua',
        level: 'excellent',
        description: `${siHua.lu}化禄在命宫，主财运亨通，贵人相助`,
        influence: '财运和贵人运都很好，发展顺利',
        advice: '把握财运机会，善用贵人资源'
      });
    }
    
    // 化权当权格
    const shiYe = twelvePalaces['事业宫'];
    if (shiYe.main_stars.includes(siHua.quan)) {
      patterns.push({
        name: '化权当权格',
        type: 'sihua',
        level: 'good',
        description: `${siHua.quan}化权在事业宫，主权力地位，事业有成`,
        influence: '在事业上容易获得权力和地位',
        advice: '善用权力，承担责任，成就事业'
      });
    }
    
    return patterns;
  }

  // 计算格局强度
  calculatePatternStrength(patterns) {
    if (patterns.length === 0) return 'weak';
    
    const excellentCount = patterns.filter(p => p.level === 'excellent').length;
    const goodCount = patterns.filter(p => p.level === 'good').length;
    
    if (excellentCount >= 2) return 'very_strong';
    if (excellentCount >= 1) return 'strong';
    if (goodCount >= 3) return 'moderate';
    if (goodCount >= 1) return 'fair';
    return 'weak';
  }

  // 生成格局指导
  generatePatternGuidance(patterns) {
    if (patterns.length === 0) {
      return '命盘格局平常，需要通过后天努力来改善运势，建议注重品德修养和能力提升';
    }
    
    const excellentPatterns = patterns.filter(p => p.level === 'excellent');
    const goodPatterns = patterns.filter(p => p.level === 'good');
    
    let guidance = '';
    
    if (excellentPatterns.length > 0) {
      guidance += `您的命盘中有${excellentPatterns.length}个优秀格局：${excellentPatterns.map(p => p.name).join('、')}。`;
      guidance += '这些格局为您带来很好的先天优势，建议充分发挥这些优势。';
    }
    
    if (goodPatterns.length > 0) {
      guidance += `另外还有${goodPatterns.length}个良好格局：${goodPatterns.map(p => p.name).join('、')}。`;
      guidance += '这些格局为您的发展提供了有利条件。';
    }
    
    guidance += '建议根据格局特点制定人生规划，发挥优势，规避劣势，创造美好人生。';
    
    return guidance;
  }

  // 获取个性优势
  getPersonalityStrengths(star) {
    const strengths = {
      '紫微': '领导能力强，有贵人相助，具有权威性',
      '天机': '聪明机智，反应敏捷，善于策划',
      '太阳': '光明正大，热情开朗，具有感召力',
      '武曲': '意志坚定，执行力强，理财有方',
      '天同': '性格温和，人际关系好，适应力强'
    };
    return strengths[star] || '具有独特的个人魅力';
  }

  // 获取个性弱点
  getPersonalityWeaknesses(star) {
    const weaknesses = {
      '紫微': '有时过于自信，容易忽视他人意见',
      '天机': '思虑过多，有时缺乏行动力',
      '太阳': '有时过于直接，可能伤害他人感情',
      '武曲': '过于注重物质，有时显得冷漠',
      '天同': '有时过于被动，缺乏主见'
    };
    return weaknesses[star] || '需要注意平衡发展';
  }

  // 获取适合的职业领域
  getSuitableCareerFields(careerPalace) {
    const stars = careerPalace.stars;
    if (stars.length === 0) return '适合稳定发展的传统行业';
    
    const mainStar = stars[0];
    const fields = {
      '紫微': '政府机关、大型企业管理、金融业',
      '天机': '科技业、咨询业、教育业',
      '太阳': '公务员、媒体业、娱乐业',
      '武曲': '金融业、制造业、军警',
      '天同': '服务业、医疗业、社会工作'
    };
    
    return fields[mainStar] || '多元化发展的现代服务业';
  }

  // 其他辅助方法的简化实现
  getCareerDevelopmentAdvice(star, gender) {
    return `根据${star}星的特质，建议${gender === '男性' ? '发挥男性的决断力' : '发挥女性的细致性'}，在职场中稳步发展`;
  }

  getCareerPeakPeriods(periods) {
    return periods.slice(2, 5).map(p => p.age_range).join('、');
  }

  getWealthPotential(wealthPalace) {
    return wealthPalace.stars.length > 0 ? '财运较佳，适合投资理财' : '财运平稳，宜稳健理财';
  }

  getInvestmentAdvice(star) {
    return `根据${star}星的特质，建议选择稳健的投资方式`;
  }

  getFinancialPlanning(gender) {
    return `${gender === '男性' ? '建议制定长期财务规划' : '建议注重家庭理财平衡'}`;
  }

  getMarriageOutlook(marriagePalace, gender) {
    return `婚姻宫${marriagePalace.strength === '旺' ? '较旺' : '平稳'}，${gender === '男性' ? '适合寻找贤内助' : '适合寻找可靠伴侣'}`;
  }

  getIdealPartnerTraits(star, gender) {
    return `适合寻找与${star}星互补的伴侣特质`;
  }

  getRelationshipAdvice(star) {
    return `在感情中发挥${star}星的优势，保持真诚沟通`;
  }

  getHealthTendencies(healthPalace) {
    return healthPalace.stars.length > 0 ? '需注意相关星曜影响的健康问题' : '整体健康状况良好';
  }

  getWellnessAdvice(star) {
    return `根据${star}星的特质，建议保持规律作息，适度运动`;
  }

  getPreventionFocus(baziInfo) {
    return '根据八字信息，建议注重五行平衡的养生方法';
  }

  getOverallFortune(star) {
    return `整体运势受${star}星影响，建议发挥其正面特质`;
  }

  getKeyLifePhases(periods) {
    return periods.slice(0, 3).map(p => `${p.age_range}为${p.palace_name}大限`).join('，');
  }

  getDevelopmentStrategy(star, gender) {
    return `建议以${star}星的特质为核心，${gender === '男性' ? '稳健发展' : '平衡发展'}，把握人生机遇`;
  }

  // 以下是新增的专业分析方法的简化实现
  // 实际使用中这些方法会根据星曜组合生成更详细的动态分析
  
  analyzePersonalityTraits(mainStars, luckyStars, unluckyStars) {
    const traits = [];
    mainStars.forEach(star => traits.push(this.getStarKeyInfluence(star)));
    return traits.join('，');
  }

  analyzePersonalityStrengths(mainStars, luckyStars) {
    return `具有${mainStars.join('、')}星的优势特质，${luckyStars.length > 0 ? '得到吉星助力' : '需要自我发挥'}`;
  }

  analyzePersonalityChallenges(mainStars, unluckyStars) {
    return unluckyStars.length > 0 ? `需要注意${unluckyStars.join('、')}星带来的挑战` : '整体发展较为顺利';
  }

  analyzePersonalityPotential(mainStars, luckyStars, gender) {
    return `${gender}具有很好的发展潜力，建议发挥${mainStars[0] || '天机'}星的特质`;
  }

  analyzeLifeAttitude(mainStar, gender) {
    return `以${mainStar}星为主导的人生态度，${gender === '男性' ? '稳重务实' : '细腻温和'}`;
  }

  analyzeCareerPotential(careerStars, mingGongStars) {
    return `事业发展潜力${careerStars.length > 0 ? '较好' : '需要努力开拓'}，适合发挥个人特长`;
  }

  analyzeSuitableIndustries(careerStars, mingGongStars) {
    const industries = ['教育培训', '咨询服务', '文化创意', '科技研发', '金融投资'];
    return industries.slice(0, 3).join('、');
  }

  analyzeLeadershipStyle(mingGongStars) {
    return mingGongStars.includes('紫微') ? '权威型领导' : '协作型领导';
  }

  analyzeCareerDevelopment(careerStars, strength) {
    return `事业发展${strength === '旺' ? '顺利' : '需要耐心积累'}，建议稳步前进`;
  }

  analyzeCareerPeakPeriods(majorPeriods) {
    return majorPeriods.all_periods.slice(2, 5).map(p => p.age_range).join('、');
  }

  generateCareerAdvice(careerStars, mingGongStars, personName) {
    return `${personName}应该发挥自身优势，在适合的领域深耕发展`;
  }

  analyzeWealthPotential(wealthStars, wealthLucky, wealthUnlucky) {
    const score = wealthStars.length * 2 + wealthLucky.length - wealthUnlucky.length;
    return score > 2 ? '财运较佳' : score > 0 ? '财运平稳' : '需要努力积累';
  }

  analyzeEarningStyle(wealthStars, mainStar) {
    return `适合通过${mainStar}星的特质获得收入，建议多元化发展`;
  }

  analyzeInvestmentTendency(wealthStars, mingGongStars) {
    return mingGongStars.includes('武曲') ? '适合稳健投资' : '建议保守理财';
  }

  analyzeFinancialManagement(wealthStars, strength) {
    return `理财能力${strength === '旺' ? '较强' : '需要学习提升'}，建议制定长期规划`;
  }

  analyzeWealthTiming(wealthStars) {
    return '财富积累需要时间，建议耐心经营';
  }

  generateFinancialAdvice(wealthStars, personName) {
    return `${personName}应该注重财务规划，稳健投资，避免投机`;
  }

  analyzeMarriageFortune(marriageStars, marriageLucky, marriageUnlucky) {
    const score = marriageStars.length + marriageLucky.length - marriageUnlucky.length;
    return score > 1 ? '婚姻运势较好' : '需要用心经营感情';
  }

  analyzeSpouseCharacteristics(marriageStars, gender) {
    return `配偶通常${gender === '男性' ? '温柔贤惠' : '稳重可靠'}，与您互补`;
  }

  analyzeRelationshipPattern(marriageStars, mingGongStars) {
    return '感情发展模式较为稳定，重视长期关系';
  }

  analyzeMarriageTiming(marriageStars, strength) {
    return `适婚年龄在${strength === '旺' ? '25-30岁' : '28-35岁'}之间`;
  }

  analyzeRelationshipChallenges(marriageUnlucky) {
    return marriageUnlucky.length > 0 ? '需要注意沟通和理解' : '感情发展较为顺利';
  }

  generateRelationshipAdvice(marriageStars, personName, gender) {
    return `${personName}在感情中应该保持真诚，用心经营婚姻关系`;
  }

  // 其他分析方法的简化实现
  analyzeConstitution(healthStars, mingGongStars) { return '体质整体良好，需要注意保养'; }
  analyzeHealthTendencies(healthStars, healthUnlucky) { return '注意预防常见疾病，保持健康生活方式'; }
  analyzeVulnerableAreas(healthStars, healthUnlucky) { return '注意心血管和消化系统健康'; }
  analyzeWellnessApproach(mingGongStars) { return '适合温和的养生方式，注重身心平衡'; }
  analyzePreventionFocus(healthUnlucky) { return '预防胜于治疗，定期体检很重要'; }
  generateHealthAdvice(healthStars, personName) { return `${personName}应该保持规律作息，适度运动`; }
  
  analyzeParentsRelationship(parentsPalace) { return '与父母关系和睦，得到长辈关爱'; }
  analyzeSiblingsRelationship(siblingsPalace) { return '兄弟姐妹关系良好，互相支持'; }
  analyzeChildrenFortune(childrenPalace, gender) { return '子女缘分深厚，家庭幸福'; }
  analyzeFamilyHarmony(parentsPalace, siblingsPalace, childrenPalace) { return '家庭和睦，亲情深厚'; }
  analyzeFamilyResponsibilities(parentsPalace, childrenPalace) { return '承担适当的家庭责任，平衡个人发展'; }
  generateFamilyAdvice(parentsPalace, childrenPalace, personName) { return `${personName}应该珍惜家庭关系，孝顺父母`; }
  
  analyzeCurrentPeriod(currentPeriod, personName) { return `${personName}目前处于${currentPeriod.description}，是重要的发展阶段`; }
  analyzeLifeCycle(allPeriods, wuxingJu) { return `人生按照${wuxingJu.type}的节奏发展，每个阶段都有其特色`; }
  analyzeKeyTurningPoints(allPeriods) { return '人生的关键转折点通常在大限交替时期'; }
  analyzeFavorablePeriods(allPeriods) { return allPeriods.slice(2, 6).map(p => p.age_range).join('、'); }
  analyzeChallengingPeriods(allPeriods) { return '需要特别注意的时期要谨慎应对'; }
  generateTimingAdvice(currentPeriod, personName) { return `${personName}应该把握当前时机，积极发展`; }
  
  analyzeLifePurpose(mainStar, mingGong, siHua) { return `人生目标是发挥${mainStar}星的特质，实现自我价值`; }
  analyzeCoreValues(mingGong, fuDe) { return '核心价值观注重诚信、善良和智慧'; }
  analyzeDevelopmentDirection(mainStar, twelvePalaces) { return `发展方向应该结合${mainStar}星的特质，全面发展`; }
  analyzeSpiritualGrowth(fuDe, siHua) { return '精神成长需要不断学习和修养'; }
  analyzeLifeLessons(mingGong, twelvePalaces) { return '人生课题是学会平衡各方面的发展'; }
  generateOverallGuidance(mainStar, personName) { return `${personName}应该发挥${mainStar}星的优势，创造美好人生`; }

  // 流年分析辅助方法
  analyzeXiaoXianInfluence(xiaoXianIndex, age) {
    const influences = {
      0: '子宫小限，主智慧学习，适合思考规划',
      1: '丑宫小限，主稳定积累，宜踏实工作',
      2: '寅宫小限，主生机勃勃，适合开创新局',
      3: '卯宫小限，主温和发展，宜人际交往',
      4: '辰宫小限，主变化转机，注意把握时机',
      5: '巳宫小限，主智慧显现，适合学习进修',
      6: '午宫小限，主光明发展，事业运势较好',
      7: '未宫小限，主收获成果，宜总结经验',
      8: '申宫小限，主行动力强，适合积极进取',
      9: '酉宫小限，主收敛整理，宜内省修养',
      10: '戌宫小限，主稳定发展，注重基础建设',
      11: '亥宫小限，主休养生息，适合蓄势待发'
    };
    return influences[xiaoXianIndex] || '运势平稳，宜顺势而为';
  }

  getXiaoXianYearlyTheme(xiaoXianIndex) {
    const themes = ['学习年', '积累年', '开创年', '发展年', '变化年', '进修年', '成就年', '收获年', '进取年', '修养年', '建设年', '蓄势年'];
    return themes[xiaoXianIndex] || '发展年';
  }

  analyzeLiuNianFortune(yearStem, yearBranch, currentPeriod) {
    return `${yearStem}${yearBranch}年与${currentPeriod.palace_name}大限相配，整体运势${currentPeriod.start_age % 2 === 0 ? '向好' : '平稳'}，需要把握机会`;
  }

  getLiuNianFocusAreas(yearStem, yearBranch) {
    const focusAreas = {
      '甲': ['事业发展', '学习进修', '人际关系'],
      '乙': ['财务管理', '健康养生', '家庭和谐'],
      '丙': ['创新创业', '表达沟通', '社交拓展'],
      '丁': ['感情婚姻', '艺术创作', '精神修养'],
      '戊': ['稳定发展', '投资理财', '基础建设'],
      '己': ['内在成长', '技能提升', '人脉积累'],
      '庚': ['决断执行', '目标达成', '领导管理'],
      '辛': ['细节完善', '品质提升', '专业精进'],
      '壬': ['流动变化', '适应调整', '机会把握'],
      '癸': ['内省思考', '智慧积累', '潜力开发']
    };
    return focusAreas[yearStem] || ['全面发展', '平衡协调', '稳步前进'];
  }

  getLiuNianOpportunities(sihua) {
    return [
      `${sihua.lu}化禄带来的财运机会`,
      `${sihua.quan}化权带来的权力机会`,
      `${sihua.ke}化科带来的名声机会`
    ];
  }

  getLiuNianChallenges(sihua) {
    return [
      `需要特别注意${sihua.ji}化忌带来的挑战`,
      '避免冲动决策，保持理性思考',
      '注意人际关系的维护和协调'
    ];
  }

  generateMonthlyPreview(currentYear) {
    const months = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    return months.map((month, index) => ({
      month: month,
      theme: `${month}主题：${['新开始', '积累期', '发展期', '调整期', '成长期', '收获期', '反思期', '准备期', '行动期', '完善期', '总结期', '规划期'][index]}`,
      focus: ['学习', '工作', '感情', '健康', '财运', '人际', '事业', '家庭', '投资', '创新', '休息', '计划'][index]
    }));
  }

  getMonthTheme(month) {
    const themes = {
      1: '新春开局，万象更新', 2: '春回大地，生机勃勃', 3: '春暖花开，适合发展',
      4: '春夏之交，变化调整', 5: '初夏时节，积极进取', 6: '仲夏时光，收获成果',
      7: '盛夏季节，注意平衡', 8: '夏秋之际，稳定发展', 9: '金秋时节，收获满满',
      10: '深秋季节，内省修养', 11: '初冬时节，蓄势待发', 12: '年终岁末，总结规划'
    };
    return themes[month] || '平稳发展，顺势而为';
  }

  analyzeMonthFortune(monthBranchIndex, currentYear) {
    const fortunes = ['运势上升', '平稳发展', '需要谨慎', '机会较多', '挑战与机遇并存'];
    return fortunes[monthBranchIndex % 5];
  }

  getMonthFocus(month) {
    const focuses = {
      1: '制定年度计划，开启新征程', 2: '人际关系建设，拓展社交圈', 3: '学习进修提升，增强实力',
      4: '事业发展规划，把握机遇', 5: '财务管理优化，理性投资', 6: '健康养生调理，平衡身心',
      7: '感情关系维护，增进理解', 8: '技能专业提升，精益求精', 9: '收获成果总结，经验积累',
      10: '内在修养提升，智慧增长', 11: '年终总结反思，查漏补缺', 12: '来年规划准备，蓄势待发'
    };
    return focuses[month] || '全面发展，平衡协调';
  }

  getMonthAdvice(monthBranchIndex) {
    const advices = [
      '保持积极心态，勇于尝试新事物',
      '稳扎稳打，注重基础建设',
      '把握机会，积极主动出击',
      '温和处事，重视人际和谐',
      '适应变化，灵活调整策略',
      '深入学习，提升专业能力',
      '发挥优势，展现个人魅力',
      '收获成果，总结经验教训',
      '行动果断，追求卓越品质',
      '内省修养，提升精神境界',
      '稳定发展，夯实基础根基',
      '休养生息，为未来做准备'
    ];
    return advices[monthBranchIndex] || '顺势而为，保持平常心';
  }

  getNextMonthPreview(nextMonth) {
    if (nextMonth > 12) nextMonth = 1;
    return {
      month: nextMonth,
      preview: `下月${nextMonth}月预览：${this.getMonthTheme(nextMonth)}`,
      preparation: '建议提前做好相应准备，把握时机'
    };
  }

  analyzeTimingCoordination(daxian, xiaoxian, liunian) {
    return `大限、小限、流年三者协调${daxian.start_age % 2 === 0 ? '较好' : '需要注意平衡'}，建议统筹规划`;
  }

  getBestTimingAdvice(daxian, liunian) {
    return `结合${daxian.palace_name}大限和${liunian.year_ganzhi}年的特点，建议在适当时机积极行动`;
  }

  getTimingWarnings(sihua) {
    return [
      `特别注意${sihua.ji}化忌的影响`,
      '避免在不利时机做重大决策',
      '保持谨慎乐观的态度'
    ];
  }

  getSeasonalGuidance(currentMonth) {
    const seasons = {
      1: '冬春之际，宜规划布局', 2: '春季开始，宜积极行动', 3: '春季发展，宜把握机会',
      4: '春夏之交，宜调整策略', 5: '初夏时节，宜稳步推进', 6: '仲夏时光，宜收获成果',
      7: '盛夏季节，宜保持平衡', 8: '夏秋之际，宜稳定发展', 9: '金秋时节，宜总结收获',
      10: '深秋季节，宜内省修养', 11: '初冬时节，宜蓄势待发', 12: '年终岁末，宜规划未来'
    };
    return seasons[currentMonth] || '顺应自然，把握节奏';
  }
  
  // 分析个性化优势
  analyzePersonalizedStrengths(mainStars, luckyStars, personName, personGender) {
    const strengths = [];
    
    // 基于主星的优势
    mainStars.forEach(star => {
      const starStrengths = this.getStarStrengths(star, personName, personGender);
      if (starStrengths) strengths.push(starStrengths);
    });
    
    // 基于吉星的加持
    if (luckyStars.length > 0) {
      const luckyBonus = this.getLuckyStarsBonus(luckyStars, personName);
      if (luckyBonus) strengths.push(luckyBonus);
    }
    
    return strengths.join('；') || `${personName}，您具有独特的个人优势`;
  }
  
  // 获取主星优势
  getStarStrengths(star, personName, personGender) {
    const genderPrefix = personGender === '男性' ? '作为男性' : '作为女性';
    
    const starStrengths = {
      '紫微': `${personName}，您具有天生的领导魅力和组织能力。${genderPrefix}，您能够在团队中发挥核心作用，具有很强的责任感和使命感`,
      '天机': `${personName}，您思维敏捷，善于策划和分析。${genderPrefix}，您具有很强的洞察力和应变能力，能够在复杂情况下找到最佳解决方案`,
      '太阳': `${personName}，您光明磊落，具有很强的正义感。${genderPrefix}，您天生具有感染他人的能力，能够成为他人的榜样和引导者`,
      '武曲': `${personName}，您意志坚强，执行力超群。${genderPrefix}，您具有很强的目标导向性和实现能力，在财务管理方面有天赋`,
      '天同': `${personName}，您性格温和，人际关系和谐。${genderPrefix}，您具有很强的亲和力和包容心，能够营造和谐的氛围`,
      '廉贞': `${personName}，您感情丰富，具有艺术天赋。${genderPrefix}，您追求美好的事物，有很强的审美能力和创造力`,
      '天府': `${personName}，您稳重可靠，善于积累和管理。${genderPrefix}，您注重安全感，具有很强的组织能力和理财天赋`,
      '太阴': `${personName}，您细腻敏感，直觉力强。${genderPrefix}，您善于照顾他人，具有很强的同理心和洞察力`,
      '贪狼': `${personName}，您多才多艺，充满魅力。${genderPrefix}，您善于交际，适应能力强，具有很强的学习能力`,
      '巨门': `${personName}，您口才出众，分析能力强。${genderPrefix}，您善于发现问题的关键，具有很强的研究精神和专业能力`,
      '天相': `${personName}，您忠诚可靠，协调能力强。${genderPrefix}，您善于辅助他人，具有很强的服务精神和团队合作能力`,
      '天梁': `${personName}，您正直善良，具有长者风范。${genderPrefix}，您有很强的责任感和正义感，能够给他人提供指导和帮助`,
      '七杀': `${personName}，您冲劲十足，勇于开拓。${genderPrefix}，您不怕困难，具有很强的开拓精神和执行力`,
      '破军': `${personName}，您勇于创新，不满足现状。${genderPrefix}，您具有很强的变革能力和突破精神，善于在变化中寻找机会`
    };
    
    return starStrengths[star];
  }
  
  // 获取吉星加持
  getLuckyStarsBonus(luckyStars, personName) {
    const bonuses = [];
    
    luckyStars.forEach(star => {
      const starBonus = {
        '文昌': `${personName}，文昌星的加持使您在学习和文化方面有特殊天赋，表达能力强`,
        '文曲': `${personName}，文曲星的影响让您口才出众，善于沟通交流，具有艺术气质`,
        '左辅': `${personName}，左辅星的帮助使您容易得到贵人相助，在团队中能发挥重要作用`,
        '右弼': `${personName}，右弼星的支持让您具有很强的协调能力，善于处理人际关系`,
        '天魁': `${personName}，天魁星的庇佑使您容易遇到年长的贵人，在关键时刻得到指导`,
        '天钺': `${personName}，天钺星的照耀让您具有很强的直觉力，能够把握机会`
      };
      
      if (starBonus[star]) {
        bonuses.push(starBonus[star]);
      }
    });
    
    return bonuses.join('；');
  }
  
  // 分析个性化挑战
  analyzePersonalizedChallenges(mainStars, unluckyStars, personName, personGender) {
    const challenges = [];
    
    // 基于主星的挑战
    mainStars.forEach(star => {
      const starChallenges = this.getStarChallenges(star, personName, personGender);
      if (starChallenges) challenges.push(starChallenges);
    });
    
    // 基于煞星的挑战
    if (unluckyStars.length > 0) {
      const unluckyChallenge = this.getUnluckyStarsChallenge(unluckyStars, personName);
      if (unluckyChallenge) challenges.push(unluckyChallenge);
    }
    
    return challenges.join('；') || `${personName}，您需要注意平衡发展，避免过度偏向某一方面`;
  }
  
  // 获取主星挑战
  getStarChallenges(star, personName, personGender) {
    const genderPrefix = personGender === '男性' ? '作为男性' : '作为女性';
    
    const starChallenges = {
      '紫微': `${personName}，您需要注意不要过于自我中心。${genderPrefix}，要学会倾听他人意见，避免过于强势`,
      '天机': `${personName}，您需要注意不要想得太多而缺乏行动。${genderPrefix}，要学会在思考和行动之间找到平衡`,
      '太阳': `${personName}，您需要注意不要过度消耗自己的能量。${genderPrefix}，要学会适度休息，避免过度付出`,
      '武曲': `${personName}，您需要注意不要过于注重物质而忽视情感。${genderPrefix}，要学会在坚持中保持灵活`,
      '天同': `${personName}，您需要注意不要过于随和而缺乏主见。${genderPrefix}，要学会在适当时候坚持自己的立场`,
      '廉贞': `${personName}，您需要注意情绪管理，避免过度敏感。${genderPrefix}，要学会在感性和理性之间找到平衡`,
      '天府': `${personName}，您需要注意不要过于保守而错失机会。${genderPrefix}，要学会在稳重中保持开放`,
      '太阴': `${personName}，您需要注意不要过于敏感而影响判断。${genderPrefix}，要学会保护自己的情绪边界`,
      '贪狼': `${personName}，您需要注意专注力的培养，避免三心二意。${genderPrefix}，要学会在多元发展中保持重点`,
      '巨门': `${personName}，您需要注意表达方式的温和，避免过于直接。${genderPrefix}，要学会在坚持真理的同时照顾他人感受`,
      '天相': `${personName}，您需要注意在帮助他人的同时也要为自己考虑。${genderPrefix}，要学会适当拒绝不合理要求`,
      '天梁': `${personName}，您需要注意不要过于严肃而缺乏灵活性。${genderPrefix}，要学会在原则性和灵活性之间找到平衡`,
      '七杀': `${personName}，您需要注意控制冲动，学会深思熟虑。${genderPrefix}，要学会在冲劲中保持理性`,
      '破军': `${personName}，您需要注意在变化中保持稳定的核心价值。${genderPrefix}，要学会在创新中保持连续性`
    };
    
    return starChallenges[star];
  }
  
  // 获取煞星挑战
  getUnluckyStarsChallenge(unluckyStars, personName) {
    const challenges = [];
    
    unluckyStars.forEach(star => {
      const starChallenge = {
        '擎羊': `${personName}，擎羊星提醒您要控制冲动，学会耐心等待合适的时机`,
        '陀罗': `${personName}，陀罗星提醒您要克服拖延，提高行动效率`,
        '火星': `${personName}，火星提醒您要控制急躁情绪，学会冷静思考`,
        '铃星': `${personName}，铃星提醒您要稳定情绪，避免过度波动`,
        '地空': `${personName}，地空星提醒您要脚踏实地，避免好高骛远`,
        '地劫': `${personName}，地劫星提醒您要谨慎理财，避免不必要的损失`
      };
      
      if (starChallenge[star]) {
        challenges.push(starChallenge[star]);
      }
    });
    
    return challenges.join('；');
  }
  
  // 分析个性化潜力
  analyzePersonalizedPotential(mainStars, luckyStars, personGender, personName) {
    const potentials = [];
    
    // 基于主星的潜力
    mainStars.forEach(star => {
      const starPotential = this.getStarPotential(star, personName, personGender);
      if (starPotential) potentials.push(starPotential);
    });
    
    // 基于吉星的潜力加成
    if (luckyStars.length > 0) {
      const luckyPotential = this.getLuckyStarsPotential(luckyStars, personName);
      if (luckyPotential) potentials.push(luckyPotential);
    }
    
    return potentials.join('；') || `${personName}，您具有无限的发展潜力，关键在于如何发掘和运用`;
  }
  
  // 获取主星潜力
  getStarPotential(star, personName, personGender) {
    const genderPrefix = personGender === '男性' ? '作为男性' : '作为女性';
    
    const starPotentials = {
      '紫微': `${personName}，您有成为杰出领导者的潜力。${genderPrefix}，您可以在管理、政治或大型组织中发挥重要作用`,
      '天机': `${personName}，您有成为优秀策划师的潜力。${genderPrefix}，您可以在咨询、策划或智力密集型行业中获得成功`,
      '太阳': `${personName}，您有成为公众人物的潜力。${genderPrefix}，您可以在教育、传媒或公共服务领域发光发热`,
      '武曲': `${personName}，您有成为财务专家的潜力。${genderPrefix}，您可以在金融、投资或实业领域取得卓越成就`,
      '天同': `${personName}，您有成为和谐使者的潜力。${genderPrefix}，您可以在服务、协调或人际关系领域发挥特长`,
      '廉贞': `${personName}，您有成为艺术家的潜力。${genderPrefix}，您可以在艺术、设计或创意产业中展现才华`,
      '天府': `${personName}，您有成为管理专家的潜力。${genderPrefix}，您可以在行政、管理或组织运营方面取得成功`,
      '太阴': `${personName}，您有成为心理专家的潜力。${genderPrefix}，您可以在心理咨询、教育或照护行业中发挥专长`,
      '贪狼': `${personName}，您有成为多元发展者的潜力。${genderPrefix}，您可以在多个领域同时发展，成为复合型人才`,
      '巨门': `${personName}，您有成为专业分析师的潜力。${genderPrefix}，您可以在研究、分析或专业咨询领域获得认可`,
      '天相': `${personName}，您有成为优秀助手的潜力。${genderPrefix}，您可以在辅助、支持或协调性工作中发挥重要作用`,
      '天梁': `${personName}，您有成为人生导师的潜力。${genderPrefix}，您可以在教育、指导或公益事业中贡献力量`,
      '七杀': `${personName}，您有成为开拓者的潜力。${genderPrefix}，您可以在创业、开拓或竞争性行业中取得突破`,
      '破军': `${personName}，您有成为变革者的潜力。${genderPrefix}，您可以在创新、改革或新兴行业中引领潮流`
    };
    
    return starPotentials[star];
  }
  
  // 获取吉星潜力加成
  getLuckyStarsPotential(luckyStars, personName) {
    const potentials = [];
    
    luckyStars.forEach(star => {
      const starPotential = {
        '文昌': `${personName}，文昌星增强了您的学习和表达潜力，有望在文化教育领域取得成就`,
        '文曲': `${personName}，文曲星提升了您的沟通和艺术潜力，有望在创意表达方面获得成功`,
        '左辅': `${personName}，左辅星增强了您的团队合作潜力，有望在协作性工作中发挥重要作用`,
        '右弼': `${personName}，右弼星提升了您的协调管理潜力，有望在组织管理方面取得成就`,
        '天魁': `${personName}，天魁星增强了您获得贵人帮助的潜力，有望在关键时刻得到重要支持`,
        '天钺': `${personName}，天钺星提升了您的直觉判断潜力，有望在需要洞察力的领域获得成功`
      };
      
      if (starPotential[star]) {
        potentials.push(starPotential[star]);
      }
    });
    
    return potentials.join('；');
  }
  
  // 分析个性化人生态度
  analyzePersonalizedLifeAttitude(mainStar, personGender, personName) {
    const genderPrefix = personGender === '男性' ? '作为男性' : '作为女性';
    
    const lifeAttitudes = {
      '紫微': `${personName}，您的人生态度是追求卓越和领导地位。${genderPrefix}，您相信通过努力和责任感可以实现人生价值，喜欢在团队中发挥核心作用`,
      '天机': `${personName}，您的人生态度是追求智慧和变化。${genderPrefix}，您相信知识就是力量，喜欢通过学习和思考来解决问题`,
      '太阳': `${personName}，您的人生态度是追求光明和正义。${genderPrefix}，您相信正直和热情可以感化他人，喜欢为他人带来希望和温暖`,
      '武曲': `${personName}，您的人生态度是追求实际和成果。${genderPrefix}，您相信通过努力工作可以获得物质成功，注重实际效果和结果`,
      '天同': `${personName}，您的人生态度是追求和谐和快乐。${genderPrefix}，您相信知足常乐，喜欢在平和的环境中享受生活`,
      '廉贞': `${personName}，您的人生态度是追求美好和完美。${genderPrefix}，您相信生活应该充满美感，注重精神层面的满足`,
      '天府': `${personName}，您的人生态度是追求稳定和积累。${genderPrefix}，您相信稳扎稳打可以获得长久成功，注重安全感和保障`,
      '太阴': `${personName}，您的人生态度是追求内在和深度。${genderPrefix}，您相信内心的丰富比外在的繁华更重要，注重精神世界的建设`,
      '贪狼': `${personName}，您的人生态度是追求多元和体验。${genderPrefix}，您相信人生应该丰富多彩，喜欢尝试不同的可能性`,
      '巨门': `${personName}，您的人生态度是追求真理和深度。${genderPrefix}，您相信通过深入研究可以发现真相，注重专业性和权威性`,
      '天相': `${personName}，您的人生态度是追求服务和奉献。${genderPrefix}，您相信帮助他人就是帮助自己，喜欢在服务中体现价值`,
      '天梁': `${personName}，您的人生态度是追求正义和责任。${genderPrefix}，您相信每个人都有社会责任，喜欢为弱者发声和提供帮助`,
      '七杀': `${personName}，您的人生态度是追求挑战和突破。${genderPrefix}，您相信只有在困难中才能成长，喜欢迎接各种挑战`,
      '破军': `${personName}，您的人生态度是追求变革和创新。${genderPrefix}，您相信变化是进步的动力，喜欢在变化中寻找机会`
    };
    
    return lifeAttitudes[mainStar] || `${personName}，您有着独特的人生态度和价值观，这是您最宝贵的财富`;
  }
  
  // 分析性格演化
  analyzePersonalityEvolution(mainStars, personName, personGender) {
    const evolution = `${personName}，根据您的主星${mainStars.join('、')}，您的性格会随着人生阶段的变化而不断演化。青年时期您可能更多展现星曜的基本特质，中年时期会逐渐整合各种经验形成成熟的个性，晚年时期则会达到性格的升华和圆融。${personGender === '男性' ? '作为男性，您的性格演化会更多体现在责任感和成就感的提升上' : '作为女性，您的性格演化会更多体现在智慧和包容性的增长上'}。`;
    
    return evolution;
  }
  
  // 分析社交互动风格
  analyzeSocialInteractionStyle(mainStars, luckyStars, personName) {
    const socialStyles = [];
    
    mainStars.forEach(star => {
      const starStyle = this.getStarSocialStyle(star);
      if (starStyle) socialStyles.push(starStyle);
    });
    
    const baseStyle = socialStyles.join('，同时');
    const luckyBonus = luckyStars.length > 0 ? '在吉星的加持下，您的人际关系会更加和谐顺利' : '';
    
    return `${personName}，您的社交风格${baseStyle}。${luckyBonus}`;
  }
  
  // 获取主星社交风格
  getStarSocialStyle(star) {
    const socialStyles = {
      '紫微': '倾向于在社交中担任领导角色，喜欢被人尊重和仰慕',
      '天机': '善于在社交中提供智慧建议，喜欢与人分享见解',
      '太阳': '在社交中充满热情和正能量，容易成为人群的焦点',
      '武曲': '在社交中比较直接务实，注重实际利益和结果',
      '天同': '在社交中温和友善，善于营造和谐的氛围',
      '廉贞': '在社交中注重品味和美感，喜欢与有艺术气质的人交往',
      '天府': '在社交中稳重可靠，容易获得他人的信任',
      '太阴': '在社交中比较内敛，但善于倾听和理解他人',
      '贪狼': '在社交中活跃多变，善于与不同类型的人交往',
      '巨门': '在社交中善于分析和表达，但有时过于直接',
      '天相': '在社交中善于协调和服务，容易成为团队的润滑剂',
      '天梁': '在社交中具有长者风范，善于给他人提供指导',
      '七杀': '在社交中比较直接有力，喜欢与有挑战性的人交往',
      '破军': '在社交中喜欢新鲜和变化，容易与创新型人才产生共鸣'
    };
    
    return socialStyles[star];
  }
  
  // 分析决策风格
  analyzeDecisionMakingStyle(mainStars, personName, personGender) {
    const decisionStyles = [];
    
    mainStars.forEach(star => {
      const starDecisionStyle = this.getStarDecisionStyle(star);
      if (starDecisionStyle) decisionStyles.push(starDecisionStyle);
    });
    
    const baseStyle = decisionStyles.join('，并且');
    const genderModifier = personGender === '男性' ? '作为男性，您在决策时会更多考虑责任和成就' : '作为女性，您在决策时会更多考虑和谐和感受';
    
    return `${personName}，您的决策风格${baseStyle}。${genderModifier}。`;
  }
  
  // 获取主星决策风格
  getStarDecisionStyle(star) {
    const decisionStyles = {
      '紫微': '倾向于从全局角度考虑问题，注重决策的权威性和影响力',
      '天机': '善于分析各种可能性，但有时会因为想得太多而延迟决策',
      '太阳': '倾向于做出光明正大的决策，注重决策的道德性和正义性',
      '武曲': '注重决策的实际效果和经济效益，倾向于快速果断的决策',
      '天同': '倾向于做出让大家都满意的决策，注重决策的和谐性',
      '廉贞': '在决策时会考虑美感和完美性，有时会因为追求完美而犹豫',
      '天府': '倾向于稳健保守的决策，注重决策的安全性和可靠性',
      '太阴': '在决策时会深入考虑各种细节，注重决策的周全性',
      '贪狼': '倾向于多元化的决策，喜欢保留多种选择的可能性',
      '巨门': '善于深入分析问题的本质，但决策过程可能比较谨慎',
      '天相': '在决策时会考虑对他人的影响，注重决策的协调性',
      '天梁': '倾向于做出有原则性的决策，注重决策的正确性和长远性',
      '七杀': '倾向于快速果断的决策，不怕承担决策的风险和责任',
      '破军': '倾向于创新性的决策，喜欢尝试不同寻常的解决方案'
    };
    
    return decisionStyles[star];
  }
  
  // 获取人生格局描述
  getLifePatternDescription(mainStar, personName) {
    const lifePatterns = {
      '紫微': `${personName}，注定要承担重要责任，在人生的舞台上发挥领导作用`,
      '天机': `${personName}，充满智慧和变化，人生路径多样且富有创意`,
      '太阳': `${personName}，光明磊落，注定要照亮他人，成为正能量的源泉`,
      '武曲': `${personName}，意志坚定，通过不懈努力必能获得物质成功`,
      '天同': `${personName}，追求和谐快乐，人生注重精神层面的满足`,
      '廉贞': `${personName}，感情丰富，人生充满艺术气息和美好追求`,
      '天府': `${personName}，稳重可靠，人生注重积累和长远发展`,
      '太阴': `${personName}，细腻敏感，人生重视内在修养和精神世界`,
      '贪狼': `${personName}，多才多艺，人生充满各种可能性和机遇`,
      '巨门': `${personName}，善于分析，人生注重专业发展和深度研究`,
      '天相': `${personName}，忠诚可靠，人生价值在于服务他人和协调关系`,
      '天梁': `${personName}，正直善良，人生使命是指导他人和维护正义`,
      '七杀': `${personName}，勇于开拓，人生充满挑战和突破的机会`,
      '破军': `${personName}，勇于创新，人生注定要在变革中寻找新的道路`
    };
    
    return lifePatterns[mainStar] || `${personName}，拥有独特的人生格局和发展道路`;
  }
  
  // ==================== 个性化事业分析方法 ====================
  
  // 生成个性化事业概述
  generatePersonalizedCareerOverview(personName, careerStars, mingGongStars, careerPosition) {
    const mainCareerStar = careerStars[0] || '天机';
    const mainMingStar = mingGongStars[0] || '天机';
    const positionInfluence = this.getCareerPositionInfluence(careerPosition);
    
    return `${personName}，您的事业宫位于${careerPosition}，主星为${careerStars.join('、') || '无主星'}。${positionInfluence}结合您命宫的${mainMingStar}星特质，您在事业发展上${this.getCareerStarCombinationAnalysis(mainCareerStar, mainMingStar, personName)}。您的职业天赋${this.getCareerTalentDescription(mainCareerStar, personName)}，适合在${this.getCareerFieldSuggestion(mainCareerStar, mainMingStar)}领域发展。`;
  }
  
  // 获取事业宫位影响
  getCareerPositionInfluence(position) {
    const influences = {
      '子': '您的事业发展具有很强的灵活性和适应性，善于在变化中寻找机会。',
      '丑': '您在事业上稳扎稳打，注重积累和长远发展，具有很强的耐力。',
      '寅': '您的事业充满活力和创新精神，勇于开拓新的领域和机会。',
      '卯': '您在事业上具有很强的创造力和表现力，适合需要创意的工作。',
      '辰': '您的事业发展具有很强的组织能力和领导潜质，适合管理岗位。',
      '巳': '您在事业上聪明机智，善于策划和分析，适合智力密集型工作。',
      '午': '您的事业充满热情和活力，具有很强的表现欲和领导魅力。',
      '未': '您在事业上注重和谐与合作，善于协调人际关系。',
      '申': '您的事业发展具有很强的执行力和实践能力，注重实际效果。',
      '酉': '您在事业上追求完美和精确，适合需要细致和专业的工作。',
      '戌': '您的事业发展稳重可靠，具有很强的责任感和使命感。',
      '亥': '您在事业上具有很强的直觉力和洞察力，善于把握机会。'
    };
    
    return influences[position] || '您在事业发展上具有独特的优势和特点。';
  }
  
  // 获取事业星曜组合分析
  getCareerStarCombinationAnalysis(careerStar, mingStar, personName) {
    const combinations = {
      '紫微': {
        '紫微': `${personName}，具有天生的领导才能，适合在高层管理或政府部门发挥才华`,
        '天机': `${personName}，结合了领导力和智慧，适合在策略规划或咨询行业发展`,
        '太阳': `${personName}，具有强大的影响力和感召力，适合在公共事业或教育领域发光发热`,
        '武曲': `${personName}，兼具领导力和执行力，适合在金融或实业领域取得成功`,
        '天同': `${personName}，能够在和谐的环境中发挥领导作用，适合服务性行业的管理工作`
      },
      '天机': {
        '紫微': `${personName}，智慧与权威并重，适合在智库或高端咨询领域发展`,
        '天机': `${personName}，具有超强的分析和策划能力，适合在研究或策略规划领域发展`,
        '太阳': `${personName}，智慧与正义并重，适合在法律或教育领域发挥专长`,
        '武曲': `${personName}，理性分析与实际执行并重，适合在金融分析或项目管理领域`,
        '天同': `${personName}，智慧与和谐并重，适合在人力资源或心理咨询领域发展`
      },
      '太阳': {
        '紫微': `${personName}，光明与权威并重，适合在政府部门或大型企业的领导岗位`,
        '天机': `${personName}，正义与智慧并重，适合在法律或新闻媒体领域发展`,
        '太阳': `${personName}，具有强大的正能量和影响力，适合在教育或公益事业领域`,
        '武曲': `${personName}，正直与执行力并重，适合在执法或军事领域发展`,
        '天同': `${personName}，温暖与和谐并重，适合在社会服务或医疗健康领域`
      }
    };
    
    return combinations[careerStar]?.[mingStar] || `${personName}，具有独特的事业发展潜力和优势`;
  }
  
  // 获取事业天赋描述
  getCareerTalentDescription(careerStar, personName) {
    const talents = {
      '紫微': `${personName}，体现在组织领导和统筹规划方面，能够在复杂的环境中保持清晰的方向感`,
      '天机': `${personName}，体现在分析思考和策略规划方面，善于发现问题的本质和解决方案`,
      '太阳': `${personName}，体现在沟通表达和团队激励方面，能够用正能量影响和带动他人`,
      '武曲': `${personName}，体现在执行实施和目标达成方面，具有很强的行动力和结果导向`,
      '天同': `${personName}，体现在协调合作和服务他人方面，能够营造和谐的工作氛围`,
      '廉贞': `${personName}，体现在创意设计和美学鉴赏方面，具有很强的艺术天赋和审美能力`,
      '天府': `${personName}，体现在资源整合和财务管理方面，善于积累和配置各种资源`,
      '太阴': `${personName}，体现在细致观察和深度分析方面，具有很强的洞察力和直觉`,
      '贪狼': `${personName}，体现在多元发展和适应变化方面，能够在不同领域都有所建树`,
      '巨门': `${personName}，体现在专业研究和深度分析方面，善于在专业领域建立权威`,
      '天相': `${personName}，体现在辅助支持和协调配合方面，是团队中不可或缺的重要角色`,
      '天梁': `${personName}，体现在指导培养和传承经验方面，具有很强的导师潜质`,
      '七杀': `${personName}，体现在开拓创新和突破困难方面，勇于挑战和改变现状`,
      '破军': `${personName}，体现在变革创新和重构优化方面，善于在变化中创造新的价值`
    };
    
    return talents[careerStar] || `${personName}，具有独特的职业天赋和发展潜力`;
  }
  
  // 获取事业领域建议
  getCareerFieldSuggestion(careerStar, mingStar) {
    const fields = {
      '紫微': '政府管理、企业高管、组织领导、公共管理',
      '天机': '战略咨询、研究分析、智库顾问、策略规划',
      '太阳': '教育培训、新闻媒体、公共关系、社会服务',
      '武曲': '金融投资、项目管理、执行实施、目标达成',
      '天同': '人力资源、客户服务、协调合作、团队建设',
      '廉贞': '创意设计、艺术文化、美学相关、品牌营销',
      '天府': '财务管理、资源配置、资产管理、投资理财',
      '太阴': '心理咨询、深度研究、数据分析、洞察服务',
      '贪狼': '多元发展、跨界合作、创新业务、适应性强的行业',
      '巨门': '专业研究、技术开发、学术研究、专业咨询',
      '天相': '辅助支持、协调服务、行政管理、后勤保障',
      '天梁': '教育指导、经验传承、培训发展、导师角色',
      '七杀': '创业开拓、市场拓展、销售业务、挑战性工作',
      '破军': '变革创新、重构优化、新兴行业、转型升级'
    };
    
    return fields[careerStar] || '适合您个人特质的多元化发展领域';
  }
  
  // 分析深度事业潜力
  analyzeDeepCareerPotential(careerStars, mingGongStars, careerLucky, personName) {
    const potentials = [];
    
    // 基于事业宫主星的潜力
    careerStars.forEach(star => {
      const starPotential = this.getCareerStarPotential(star, personName);
      if (starPotential) potentials.push(starPotential);
    });
    
    // 基于命宫主星的事业影响
    mingGongStars.forEach(star => {
      const mingInfluence = this.getMingGongCareerInfluence(star, personName);
      if (mingInfluence) potentials.push(mingInfluence);
    });
    
    // 基于吉星的事业加持
    if (careerLucky.length > 0) {
      const luckyBonus = this.getCareerLuckyStarsBonus(careerLucky, personName);
      if (luckyBonus) potentials.push(luckyBonus);
    }
    
    return potentials.join('；') || `${personName}，您具有独特的事业发展潜力`;
  }
  
  // 获取事业宫主星潜力
  getCareerStarPotential(star, personName) {
    const potentials = {
      '紫微': `${personName}，您有成为行业领袖的潜力，天生具备统领全局的能力，适合在大型组织中担任核心领导角色`,
      '天机': `${personName}，您有成为智慧顾问的潜力，善于洞察趋势和分析问题，适合在咨询和策略规划领域发挥专长`,
      '太阳': `${personName}，您有成为公众人物的潜力，具有很强的影响力和感召力，适合在需要公众曝光的领域发展`,
      '武曲': `${personName}，您有成为实业家的潜力，具有很强的执行力和目标达成能力，适合在金融和实业领域创造价值`,
      '天同': `${personName}，您有成为服务专家的潜力，善于营造和谐环境和服务他人，适合在服务性行业中发挥价值`,
      '廉贞': `${personName}，您有成为创意大师的潜力，具有很强的艺术天赋和审美能力，适合在创意和设计领域发光发热`,
      '天府': `${personName}，您有成为财富管理专家的潜力，善于积累和管理资源，适合在财务和投资领域取得成功`,
      '太阴': `${personName}，您有成为深度分析师的潜力，具有很强的洞察力和直觉，适合在研究和分析领域建立权威`,
      '贪狼': `${personName}，您有成为多元发展者的潜力，适应能力强且兴趣广泛，适合在多个领域同时发展`,
      '巨门': `${personName}，您有成为专业权威的潜力，善于深入研究和专业分析，适合在专业技术领域建立地位`,
      '天相': `${personName}，您有成为协调专家的潜力，善于辅助他人和协调关系，适合在支持性和协调性工作中发挥价值`,
      '天梁': `${personName}，您有成为导师和指导者的潜力，具有很强的经验传承能力，适合在教育和培训领域发展`,
      '七杀': `${personName}，您有成为开拓先锋的潜力，勇于挑战和突破，适合在需要开拓和创新的领域发挥才能`,
      '破军': `${personName}，您有成为变革推动者的潜力，善于在变化中创造价值，适合在转型和创新领域发挥作用`
    };
    
    return potentials[star];
  }
  
  // 获取命宫对事业的影响
  getMingGongCareerInfluence(star, personName) {
    const influences = {
      '紫微': `${personName}，您的紫微命格为事业发展提供了天然的权威感和领导魅力，容易获得他人的认可和支持`,
      '天机': `${personName}，您的天机命格为事业发展提供了敏锐的洞察力和分析能力，善于把握机会和趋势`,
      '太阳': `${personName}，您的太阳命格为事业发展提供了正面的影响力和感召力，容易成为团队的核心和榜样`,
      '武曲': `${personName}，您的武曲命格为事业发展提供了坚强的意志力和执行力，能够克服困难达成目标`,
      '天同': `${personName}，您的天同命格为事业发展提供了和谐的人际关系和合作精神，容易获得团队支持`,
      '廉贞': `${personName}，您的廉贞命格为事业发展提供了丰富的创意和美学素养，适合在创意领域发挥才华`,
      '天府': `${personName}，您的天府命格为事业发展提供了稳健的管理能力和资源整合能力，善于积累和发展`,
      '太阴': `${personName}，您的太阴命格为事业发展提供了细腻的观察力和深度思考能力，善于发现细节和本质`,
      '贪狼': `${personName}，您的贪狼命格为事业发展提供了多元的兴趣和强大的适应能力，能够在变化中成长`,
      '巨门': `${personName}，您的巨门命格为事业发展提供了深度的专业能力和分析思维，善于在专业领域建立权威`,
      '天相': `${personName}，您的天相命格为事业发展提供了优秀的协调能力和服务精神，善于辅助他人成功`,
      '天梁': `${personName}，您的天梁命格为事业发展提供了丰富的经验和指导能力，适合在教育和培养他人方面发挥价值`,
      '七杀': `${personName}，您的七杀命格为事业发展提供了强大的开拓精神和挑战勇气，善于在困难中寻找突破`,
      '破军': `${personName}，您的破军命格为事业发展提供了创新的思维和变革的勇气，善于在变化中创造新的机会`
    };
    
    return influences[star];
  }
  
  // 获取事业吉星加持
  getCareerLuckyStarsBonus(luckyStars, personName) {
    const bonuses = [];
    
    luckyStars.forEach(star => {
      const starBonus = {
        '文昌': `${personName}，文昌星在事业宫的加持使您在文化、教育、写作等领域有特殊天赋，表达能力强，容易获得学术或文化方面的成就`,
        '文曲': `${personName}，文曲星在事业宫的影响让您在沟通、艺术、创意等方面有独特优势，口才出众，适合需要表达和创意的工作`,
        '左辅': `${personName}，左辅星在事业宫的帮助使您容易得到贵人相助和团队支持，在协作性工作中能发挥重要作用`,
        '右弼': `${personName}，右弼星在事业宫的支持让您具有很强的协调管理能力，善于处理复杂的人际关系和工作事务`,
        '天魁': `${personName}，天魁星在事业宫的庇佑使您容易遇到年长的贵人和导师，在关键时刻得到重要的指导和支持`,
        '天钺': `${personName}，天钺星在事业宫的照耀让您具有很强的直觉判断力，能够在事业发展中把握关键机会和时机`
      };
      
      if (starBonus[star]) {
        bonuses.push(starBonus[star]);
      }
    });
    
    return bonuses.join('；');
   }
   
   // 分析个性化适合行业
   analyzePersonalizedIndustries(careerStars, mingGongStars, personName) {
     const industries = [];
     
     // 基于事业宫主星的行业建议
     careerStars.forEach(star => {
       const starIndustries = this.getStarSuitableIndustries(star, personName);
       if (starIndustries) industries.push(starIndustries);
     });
     
     // 基于命宫主星的行业影响
     mingGongStars.forEach(star => {
       const mingIndustries = this.getMingGongIndustryInfluence(star, personName);
       if (mingIndustries) industries.push(mingIndustries);
     });
     
     return industries.join('；') || `${personName}，您适合多元化的行业发展`;
   }
   
   // 获取主星适合的行业
   getStarSuitableIndustries(star, personName) {
     const industries = {
       '紫微': `${personName}，紫微星特质使您适合政府管理、大型企业高管、公共事业管理、组织领导等需要权威和统筹能力的行业`,
       '天机': `${personName}，天机星特质使您适合战略咨询、市场研究、数据分析、智库顾问、策略规划等需要智慧和分析能力的行业`,
       '太阳': `${personName}，太阳星特质使您适合教育培训、新闻媒体、公共关系、演艺娱乐、社会服务等需要影响力和表达能力的行业`,
       '武曲': `${personName}，武曲星特质使您适合金融投资、项目管理、工程建设、制造业、执行实施等需要执行力和目标导向的行业`,
       '天同': `${personName}，天同星特质使您适合人力资源、客户服务、社会工作、医疗健康、协调合作等需要和谐与服务精神的行业`,
       '廉贞': `${personName}，廉贞星特质使您适合创意设计、艺术文化、时尚美容、品牌营销、美学相关等需要创意和审美能力的行业`,
       '天府': `${personName}，天府星特质使您适合财务管理、银行保险、资产管理、投资理财、资源配置等需要管理和积累能力的行业`,
       '太阴': `${personName}，太阴星特质使您适合心理咨询、深度研究、数据分析、市场洞察、精细服务等需要洞察力和细致观察的行业`,
       '贪狼': `${personName}，贪狼星特质使您适合销售营销、跨界合作、创新业务、娱乐产业、多元发展等需要适应性和多元能力的行业`,
       '巨门': `${personName}，巨门星特质使您适合专业研究、技术开发、学术研究、法律服务、专业咨询等需要专业深度和分析能力的行业`,
       '天相': `${personName}，天相星特质使您适合行政管理、协调服务、后勤保障、辅助支持、团队协作等需要协调和服务能力的行业`,
       '天梁': `${personName}，天梁星特质使您适合教育指导、培训发展、经验传承、咨询顾问、导师角色等需要指导和传承能力的行业`,
       '七杀': `${personName}，七杀星特质使您适合创业开拓、市场拓展、销售业务、竞争性行业、挑战性工作等需要开拓精神和挑战勇气的行业`,
       '破军': `${personName}，破军星特质使您适合变革创新、重构优化、新兴行业、转型升级、创新科技等需要变革思维和创新能力的行业`
     };
     
     return industries[star];
   }
   
   // 获取命宫对行业选择的影响
   getMingGongIndustryInfluence(star, personName) {
     const influences = {
       '紫微': `${personName}，您的紫微命格增强了在权威性和领导性行业中的发展优势，容易在大型组织中获得认可`,
       '天机': `${personName}，您的天机命格增强了在智力密集型和策略性行业中的发展优势，善于把握行业趋势和机会`,
       '太阳': `${personName}，您的太阳命格增强了在公众性和影响力行业中的发展优势，容易在需要曝光度的行业中成功`,
       '武曲': `${personName}，您的武曲命格增强了在实业和金融行业中的发展优势，具有很强的目标达成和执行能力`,
       '天同': `${personName}，您的天同命格增强了在服务性和协调性行业中的发展优势，能够在和谐的环境中发挥最大价值`,
       '廉贞': `${personName}，您的廉贞命格增强了在创意和美学行业中的发展优势，具有独特的艺术天赋和审美能力`,
       '天府': `${personName}，您的天府命格增强了在管理和财务行业中的发展优势，善于资源整合和长期规划`,
       '太阴': `${personName}，您的太阴命格增强了在研究和分析行业中的发展优势，具有深度思考和洞察的能力`,
       '贪狼': `${personName}，您的贪狼命格增强了在多元和创新行业中的发展优势，能够在变化中找到新的机会`,
       '巨门': `${personName}，您的巨门命格增强了在专业和技术行业中的发展优势，善于在专业领域建立权威地位`,
       '天相': `${personName}，您的天相命格增强了在协调和支持行业中的发展优势，是团队中不可或缺的重要角色`,
       '天梁': `${personName}，您的天梁命格增强了在教育和指导行业中的发展优势，具有很强的经验传承和培养能力`,
       '七杀': `${personName}，您的七杀命格增强了在开拓和竞争行业中的发展优势，勇于在困难中寻找突破机会`,
       '破军': `${personName}，您的破军命格增强了在变革和创新行业中的发展优势，善于在变化中创造新的价值`
     };
     
     return influences[star];
    }
    
    // 分析个性化领导风格
    analyzePersonalizedLeadershipStyle(mingGongStars, careerStars, personName) {
      const styles = [];
      
      // 基于命宫主星的领导风格
      mingGongStars.forEach(star => {
        const mingStyle = this.getMingGongLeadershipStyle(star, personName);
        if (mingStyle) styles.push(mingStyle);
      });
      
      // 基于事业宫主星的领导特质
      careerStars.forEach(star => {
        const careerStyle = this.getCareerStarLeadershipStyle(star, personName);
        if (careerStyle) styles.push(careerStyle);
      });
      
      return styles.join('；') || `${personName}，您具有独特的领导风格和管理特质`;
    }
    
    // 获取命宫主星的领导风格
    getMingGongLeadershipStyle(star, personName) {
      const styles = {
        '紫微': `${personName}，您的紫微命格赋予您天生的权威感和统领能力，领导风格威严而有魅力，善于制定宏观战略和长远规划`,
        '天机': `${personName}，您的天机命格使您成为智慧型领导者，善于分析和策划，领导风格灵活机智，能够在复杂情况下找到最佳解决方案`,
        '太阳': `${personName}，您的太阳命格让您成为光明正大的领导者，领导风格开放透明，善于激励团队，能够用正能量影响和带动他人`,
        '武曲': `${personName}，您的武曲命格造就了您执行力强的领导风格，注重结果导向，善于制定明确目标并推动团队达成`,
        '天同': `${personName}，您的天同命格使您成为和谐型领导者，领导风格温和包容，善于营造良好的团队氛围和人际关系`,
        '廉贞': `${personName}，您的廉贞命格赋予您创新型的领导风格，富有创意和美感，善于激发团队的创造力和艺术潜能`,
        '天府': `${personName}，您的天府命格让您成为稳健型领导者，领导风格务实可靠，善于资源整合和团队建设`,
        '太阴': `${personName}，您的太阴命格使您成为细致入微的领导者，领导风格深思熟虑，善于观察和洞察团队成员的需求`,
        '贪狼': `${personName}，您的贪狼命格造就了您适应性强的领导风格，能够在不同环境中调整管理方式，善于激发团队活力`,
        '巨门': `${personName}，您的巨门命格使您成为专业型领导者，领导风格严谨专业，善于在专业领域建立权威和标准`,
        '天相': `${personName}，您的天相命格赋予您协调型的领导风格，善于平衡各方利益，是团队中的重要协调者和支持者`,
        '天梁': `${personName}，您的天梁命格让您成为导师型领导者，领导风格富有经验和智慧，善于指导和培养团队成员`,
        '七杀': `${personName}，您的七杀命格造就了您开拓型的领导风格，勇于挑战和突破，善于带领团队在困难中寻找机会`,
        '破军': `${personName}，您的破军命格使您成为变革型领导者，领导风格创新进取，善于在变化中带领团队创造新的价值`
      };
      
      return styles[star];
    }
    
    // 获取事业宫主星的领导特质
    getCareerStarLeadershipStyle(star, personName) {
      const styles = {
        '紫微': `${personName}，事业宫紫微星增强了您的组织统筹能力，在工作中展现出卓越的领导魅力和决策能力`,
        '天机': `${personName}，事业宫天机星增强了您的策略思维能力，在工作中善于制定智慧的计划和灵活的应对策略`,
        '太阳': `${personName}，事业宫太阳星增强了您的影响力和感召力，在工作中能够成为团队的精神领袖和榜样`,
        '武曲': `${personName}，事业宫武曲星增强了您的执行力和目标达成能力，在工作中展现出强大的行动力和结果导向`,
        '天同': `${personName}，事业宫天同星增强了您的协调合作能力，在工作中善于营造和谐的团队氛围`,
        '廉贞': `${personName}，事业宫廉贞星增强了您的创意领导能力，在工作中能够激发团队的创新思维和美学追求`,
        '天府': `${personName}，事业宫天府星增强了您的管理统筹能力，在工作中善于整合资源和建立稳固的团队基础`,
        '太阴': `${personName}，事业宫太阴星增强了您的洞察分析能力，在工作中善于发现问题的本质和团队的潜在需求`,
        '贪狼': `${personName}，事业宫贪狼星增强了您的多元领导能力，在工作中能够适应不同的团队和环境需求`,
        '巨门': `${personName}，事业宫巨门星增强了您的专业权威能力，在工作中能够在专业领域建立领导地位`,
        '天相': `${personName}，事业宫天相星增强了您的辅助协调能力，在工作中是团队中不可或缺的重要支持者`,
        '天梁': `${personName}，事业宫天梁星增强了您的指导培养能力，在工作中善于传承经验和培养下属`,
        '七杀': `${personName}，事业宫七杀星增强了您的开拓进取能力，在工作中勇于承担挑战和开创新的局面`,
        '破军': `${personName}，事业宫破军星增强了您的变革创新能力，在工作中善于推动变革和创造新的工作模式`
      };
      
      return styles[star];
    }
    
    // 分析个性化事业发展
    analyzePersonalizedCareerDevelopment(careerStars, careerStrength, personName) {
      const developments = [];
      
      // 基于事业宫主星的发展路径
      careerStars.forEach(star => {
        const starDevelopment = this.getStarCareerDevelopment(star, personName);
        if (starDevelopment) developments.push(starDevelopment);
      });
      
      // 基于事业宫强度的发展建议
      const strengthAdvice = this.getCareerStrengthAdvice(careerStrength, personName);
      if (strengthAdvice) developments.push(strengthAdvice);
      
      return developments.join('；') || `${personName}，您的事业发展具有独特的路径和机会`;
    }
    
    // 获取主星的事业发展路径
    getStarCareerDevelopment(star, personName) {
      const developments = {
        '紫微': `${personName}，您的事业发展适合从基层管理开始，逐步向高层领导发展，最终成为行业或组织的核心决策者`,
        '天机': `${personName}，您的事业发展适合从专业分析师开始，逐步向战略顾问发展，最终成为智慧型的行业专家`,
        '太阳': `${personName}，您的事业发展适合从公众服务开始，逐步扩大影响力，最终成为具有社会影响力的公众人物`,
        '武曲': `${personName}，您的事业发展适合从执行岗位开始，逐步向项目管理发展，最终成为实业领域的成功企业家`,
        '天同': `${personName}，您的事业发展适合从服务岗位开始，逐步向团队协调发展，最终成为和谐型的管理专家`,
        '廉贞': `${personName}，您的事业发展适合从创意工作开始，逐步向艺术管理发展，最终成为创意产业的领军人物`,
        '天府': `${personName}，您的事业发展适合从财务管理开始，逐步向资源整合发展，最终成为财富管理的专业人士`,
        '太阴': `${personName}，您的事业发展适合从研究分析开始，逐步向深度咨询发展，最终成为洞察力强的行业智者`,
        '贪狼': `${personName}，您的事业发展适合从多元尝试开始，逐步找到最适合的领域，最终成为跨界发展的成功人士`,
        '巨门': `${personName}，您的事业发展适合从专业技术开始，逐步向专业权威发展，最终成为行业内的技术专家`,
        '天相': `${personName}，您的事业发展适合从辅助工作开始，逐步向协调管理发展，最终成为团队中的重要支柱`,
        '天梁': `${personName}，您的事业发展适合从经验积累开始，逐步向指导培训发展，最终成为行业内的导师级人物`,
        '七杀': `${personName}，您的事业发展适合从挑战性工作开始，逐步向开拓创新发展，最终成为行业的开拓先锋`,
        '破军': `${personName}，您的事业发展适合从变革项目开始，逐步向创新领导发展，最终成为行业变革的推动者`
      };
      
      return developments[star];
    }
    
    // 获取事业宫强度建议
    getCareerStrengthAdvice(strength, personName) {
      if (strength === 'strong') {
        return `${personName}，您的事业宫力量强劲，事业发展顺利，建议积极进取，把握机会快速发展`;
      } else if (strength === 'medium') {
        return `${personName}，您的事业宫力量适中，事业发展稳定，建议稳扎稳打，注重积累和提升`;
      } else {
        return `${personName}，您的事业宫需要加强，建议通过学习提升和人脉建设来增强事业发展动力`;
      }
    }
    
    // 分析详细的事业高峰期
    analyzeDetailedCareerPeakPeriods(majorPeriods, careerStars, personName) {
      const periods = [];
      
      if (majorPeriods && majorPeriods.all_periods) {
        majorPeriods.all_periods.forEach((period, index) => {
          const periodAnalysis = this.getCareerPeriodAnalysis(period, careerStars, personName, index);
          if (periodAnalysis) periods.push(periodAnalysis);
        });
      }
      
      return periods.join('；') || `${personName}，您的事业发展将在不同阶段展现不同的特色和机会`;
    }
    
    // 获取事业时期分析
    getCareerPeriodAnalysis(period, careerStars, personName, index) {
      const ageRange = `${10 + index * 10}-${19 + index * 10}岁`;
      const mainCareerStar = careerStars[0] || '天机';
      
      const periodAdvice = {
        0: `${personName}，在${ageRange}期间，这是您事业的起步阶段，建议专注于基础技能的学习和积累`,
        1: `${personName}，在${ageRange}期间，这是您事业的成长阶段，${mainCareerStar}星的特质将开始显现，建议积极拓展专业领域`,
        2: `${personName}，在${ageRange}期间，这是您事业的发展阶段，建议把握机会，在专业领域建立自己的地位`,
        3: `${personName}，在${ageRange}期间，这是您事业的成熟阶段，建议发挥领导才能，承担更大的责任`,
        4: `${personName}，在${ageRange}期间，这是您事业的巅峰阶段，建议充分发挥${mainCareerStar}星的优势，实现事业目标`,
        5: `${personName}，在${ageRange}期间，这是您事业的传承阶段，建议将经验和智慧传授给后辈，建立持久的影响力`
      };
      
      return periodAdvice[index] || `${personName}，在${ageRange}期间，您的事业发展将有独特的机会和挑战`;
    }

  // 分析事业挑战
  analyzeCareerChallenges(careerUnlucky, careerStars, personName) {
    const challenges = [];
    
    careerUnlucky.forEach(star => {
      const starChallenges = {
        '擎羊': '容易在工作中遇到竞争激烈的环境，需要学会处理人际冲突',
        '陀罗': '工作进展可能较为缓慢，需要耐心和坚持',
        '火星': '工作中容易急躁，需要控制情绪，避免冲动决策',
        '铃星': '可能面临工作压力和焦虑，需要学会放松和调节',
        '地空': '理想与现实可能存在差距，需要脚踏实地',
        '地劫': '可能遇到意外的工作变动，需要保持灵活应变'
      };
      
      if (starChallenges[star]) {
        challenges.push(starChallenges[star]);
      }
    });
    
    return challenges.length > 0 ? challenges.join('；') : `${personName}，您的事业发展相对顺利，主要挑战来自于如何更好地发挥自身优势`;
  }

  // 生成事业成功策略
  generateCareerSuccessStrategies(careerStars, mingGongStars, personName) {
    const strategies = [];
    
    careerStars.forEach(star => {
      const starStrategies = {
        '紫微': `${personName}，紫微星事业成功策略：1) 培养领导魅力，提升个人影响力；2) 主动承担重要项目和责任；3) 建立权威专业形象；4) 发展战略思维，从全局角度思考问题；5) 建立高层次的人脉网络；6) 注重个人品牌建设。`,
        '天机': `${personName}，天机星事业成功策略：1) 持续学习新知识和技能；2) 发挥分析和策划优势；3) 把握行业发展趋势和机会；4) 培养创新思维和解决问题的能力；5) 建立智囊团队，集思广益；6) 注重信息收集和分析。`,
        '太阳': `${personName}，太阳星事业成功策略：1) 建立正面积极的职业形象；2) 主动帮助同事和下属成长；3) 发挥影响力和感召力；4) 参与公益活动，提升社会声誉；5) 在团队中发挥核心作用；6) 注重道德品格和职业操守。`,
        '武曲': `${personName}，武曲星事业成功策略：1) 注重实际成果和业绩表现；2) 持续提升专业技能和执行力；3) 设定明确的目标并坚持执行；4) 培养财务管理和成本控制能力；5) 在实业领域深耕发展；6) 建立可量化的成功指标。`,
        '天同': `${personName}，天同星事业成功策略：1) 营造和谐的工作氛围；2) 发挥团队协调和沟通能力；3) 建立良好的人际关系网络；4) 在服务性行业发挥优势；5) 注重工作与生活的平衡；6) 培养包容和理解的领导风格。`,
        '廉贞': `${personName}，廉贞星事业成功策略：1) 发挥创意和艺术天赋；2) 注重工作的美感和品质；3) 在创意产业中寻找机会；4) 培养审美能力和设计思维；5) 建立个人风格和特色；6) 平衡理性分析与感性创作。`,
        '天府': `${personName}，天府星事业成功策略：1) 采用稳健的发展策略；2) 注重资源积累和管理；3) 建立可靠的业务基础；4) 发挥财务管理和投资能力；5) 在传统行业中寻找机会；6) 培养长期规划和风险控制能力。`,
        '太阴': `${personName}，太阴星事业成功策略：1) 发挥细致入微的观察力；2) 在幕后支持和辅助角色中发光；3) 培养深度分析和研究能力；4) 注重细节和质量控制；5) 建立专业的技术能力；6) 在需要耐心和细心的领域发展。`,
        '贪狼': `${personName}，贪狼星事业成功策略：1) 保持多元化发展思路；2) 善于学习和适应新环境；3) 抓住各种发展机会；4) 培养销售和市场开拓能力；5) 建立广泛的社交网络；6) 保持对新趋势的敏感度。`,
        '巨门': `${personName}，巨门星事业成功策略：1) 深入专业领域，建立权威地位；2) 发挥分析和研究优势；3) 培养专业咨询和指导能力；4) 注重知识积累和经验总结；5) 在需要专业判断的领域发展；6) 建立专业声誉和口碑。`,
        '天相': `${personName}，天相星事业成功策略：1) 发挥协调和服务能力；2) 在团队中扮演重要支撑角色；3) 培养忠诚可靠的职业品格；4) 建立信任和合作关系；5) 在需要协调配合的岗位发光；6) 注重职业道德和责任感。`,
        '天梁': `${personName}，天梁星事业成功策略：1) 发挥指导和教育作用；2) 承担社会责任和使命；3) 建立正面的影响力；4) 培养长者风范和智慧；5) 在教育培训领域发展；6) 注重品德修养和人格魅力。`,
        '七杀': `${personName}，七杀星事业成功策略：1) 勇于接受挑战和开拓新领域；2) 在竞争激烈的环境中脱颖而出；3) 培养果断的决策能力；4) 敢于承担风险和责任；5) 在需要突破的项目中发挥作用；6) 建立强大的执行力和行动力。`,
        '破军': `${personName}，破军星事业成功策略：1) 勇于创新和推动变革；2) 在变化中寻找新机会；3) 培养颠覆性思维；4) 敢于打破传统模式；5) 在新兴行业中寻找发展空间；6) 保持对变化的适应能力。`
      };
      
      if (starStrategies[star]) {
        strategies.push(starStrategies[star]);
      }
    });
    
    // 通用事业成功建议
    const generalAdvice = `\n\n通用事业发展建议：\n1. 制定明确的职业规划和发展目标\n2. 持续学习和提升专业技能\n3. 建立良好的人际关系和职业网络\n4. 保持积极主动的工作态度\n5. 注重个人品牌和职业形象建设\n6. 寻找导师和榜样，学习成功经验\n7. 勇于接受挑战和承担责任\n8. 保持工作与生活的平衡`;
    
    return (strategies.length > 0 ? strategies.join('\n\n') : `${personName}，根据您的星曜特质，建议发挥自身优势，持续学习和成长`) + generalAdvice;
  }

  // 生成人脉指导
  generateNetworkingGuidance(careerStars, careerLucky, personName) {
    const guidance = [];
    
    careerLucky.forEach(star => {
      const starGuidance = {
        '文昌': '多参与文化活动，与文人雅士建立联系',
        '文曲': '发挥口才优势，通过交流建立人脉',
        '左辅': '善于辅助他人，建立互助关系',
        '右弼': '发挥协调能力，成为团队的纽带',
        '天魁': '寻求贵人相助，建立高层次的人脉关系',
        '天钺': '通过正当途径获得支持，建立可靠的合作关系'
      };
      
      if (starGuidance[star]) {
        guidance.push(starGuidance[star]);
      }
    });
    
    return guidance.length > 0 ? guidance.join('；') : `${personName}，建议主动参与行业活动，真诚待人，建立长期的合作关系`;
  }

  // 分析事业转型
  analyzeCareerTransformation(careerStars, majorPeriods, personName) {
    const transformations = [];
    
    careerStars.forEach(star => {
      const starTransformation = {
        '紫微': '适合从执行者转向管理者，承担更大的责任',
        '天机': '适合从单一专业转向综合规划，发挥策略优势',
        '太阳': '适合从幕后转向台前，发挥影响力',
        '武曲': '适合从技术转向管理，注重成果导向',
        '天同': '适合从竞争转向合作，发挥协调优势',
        '廉贞': '适合从传统转向创新，发挥艺术才能',
        '天府': '适合从冒险转向稳健，注重长期发展',
        '太阴': '适合从主导转向辅助，发挥支持作用',
        '贪狼': '适合多元化发展，不断学习新技能',
        '巨门': '适合深度专业化，建立专业权威',
        '天相': '适合从个人转向团队，发挥协调能力',
        '天梁': '适合从执行转向指导，承担教育责任',
        '七杀': '适合从稳定转向开拓，寻求新的挑战',
        '破军': '适合从传统转向创新，推动行业变革'
      };
      
      if (starTransformation[star]) {
        transformations.push(starTransformation[star]);
      }
    });
    
    return transformations.length > 0 ? transformations.join('；') : `${personName}，您的事业转型应该根据个人兴趣和市场需求来规划`;
  }

  // 生成现代事业建议
  generateModernCareerAdvice(careerStars, mingGongStars, personName) {
    const advice = [];
    
    careerStars.forEach(star => {
      const modernAdvice = {
        '紫微': `${personName}，紫微星现代事业发展建议：1) 适合创业或担任CEO、总裁等高级管理职位；2) 可考虑数字化转型、企业咨询、投资管理等领域；3) 发展个人IP和影响力，成为行业意见领袖；4) 关注ESG投资、可持续发展等前沿领域；5) 利用社交媒体建立个人品牌；6) 考虑跨界合作和资源整合。`,
        '天机': `${personName}，天机星现代事业发展建议：1) 适合从事大数据分析、人工智能、战略咨询等工作；2) 可发展为数据科学家、产品经理、商业分析师；3) 关注新兴技术趋势，如区块链、物联网等；4) 培养跨学科知识，成为复合型人才；5) 参与创新项目和研发工作；6) 建立技术专家的个人品牌。`,
        '太阳': `${personName}，太阳星现代事业发展建议：1) 适合从事新媒体运营、内容创作、公共关系等工作；2) 可发展为KOL、教育培训师、企业文化官；3) 利用短视频、直播等平台扩大影响力；4) 关注社会责任和公益事业；5) 发展个人教育品牌和课程；6) 在ESG和可持续发展领域发挥作用。`,
        '武曲': `${personName}，武曲星现代事业发展建议：1) 适合从事金融科技、项目管理、供应链管理等工作；2) 可发展为产品经理、运营总监、风控专家；3) 关注数字货币、区块链金融等新兴领域；4) 培养数据分析和风险管理能力；5) 在制造业数字化转型中发挥作用；6) 发展量化投资和智能理财技能。`,
        '天同': `${personName}，天同星现代事业发展建议：1) 适合从事用户体验设计、客户成功管理、团队协作工具开发等工作；2) 可发展为UX设计师、社区运营、企业文化建设者；3) 关注远程办公和协作工具的发展；4) 培养跨文化沟通和团队管理能力；5) 在健康科技和心理健康领域发展；6) 发展情商和软技能培训业务。`,
        '廉贞': `${personName}，廉贞星现代事业发展建议：1) 适合从事UI/UX设计、创意策划、时尚科技等工作；2) 可发展为创意总监、品牌设计师、数字艺术家；3) 关注AR/VR、数字艺术、NFT等新兴创意领域；4) 培养跨媒体创作和数字化设计能力；5) 在美妆科技、时尚电商等领域发展；6) 建立个人创意品牌和作品集。`,
        '天府': `${personName}，天府星现代事业发展建议：1) 适合从事财务科技、资产管理、企业服务等工作；2) 可发展为财务总监、投资顾问、企业服务专家；3) 关注智能财务、自动化会计等技术应用；4) 培养数字化财务管理和投资分析能力；5) 在保险科技、财富管理等领域发展；6) 发展稳健投资和风险管理专长。`,
        '太阴': `${personName}，太阴星现代事业发展建议：1) 适合从事数据分析、用户研究、质量管理等工作；2) 可发展为数据分析师、用户体验研究员、质量工程师；3) 关注机器学习、深度学习等技术应用；4) 培养精细化运营和数据挖掘能力；5) 在医疗科技、教育科技等需要细致分析的领域发展；6) 发展专业研究和咨询能力。`,
        '贪狼': `${personName}，贪狼星现代事业发展建议：1) 适合从事电商运营、社交媒体营销、跨境贸易等工作；2) 可发展为增长黑客、社交电商专家、国际业务拓展；3) 关注直播带货、社群营销等新兴商业模式；4) 培养多平台运营和国际化视野；5) 在新零售、共享经济等领域发展；6) 发展个人IP和多元化收入来源。`,
        '巨门': `${personName}，巨门星现代事业发展建议：1) 适合从事法律科技、医疗信息化、专业咨询等工作；2) 可发展为合规专家、医疗数据分析师、行业研究员；3) 关注人工智能在专业服务中的应用；4) 培养深度专业知识和跨领域整合能力；5) 在监管科技、精准医疗等领域发展；6) 建立专业权威和知识付费品牌。`,
        '天相': `${personName}，天相星现代事业发展建议：1) 适合从事客户成功管理、供应链协调、平台运营等工作；2) 可发展为客户成功经理、供应链专家、平台生态建设者；3) 关注B2B服务、企业协作平台等领域；4) 培养跨部门协调和生态建设能力；5) 在SaaS服务、企业数字化等领域发展；6) 发展服务设计和流程优化专长。`,
        '天梁': `${personName}，天梁星现代事业发展建议：1) 适合从事在线教育、知识付费、企业培训等工作；2) 可发展为在线教育专家、企业教练、知识博主；3) 关注AI教育、个性化学习等技术应用；4) 培养内容创作和教学设计能力；5) 在职业教育、终身学习等领域发展；6) 建立教育品牌和课程体系。`,
        '七杀': `${personName}，七杀星现代事业发展建议：1) 适合从事创业投资、业务拓展、竞争分析等工作；2) 可发展为创业者、投资经理、市场开拓专家；3) 关注新兴市场、颠覆性创新等机会；4) 培养敏锐的市场嗅觉和快速决策能力；5) 在共享经济、新能源等竞争激烈领域发展；6) 发展风险投资和创业孵化能力。`,
        '破军': `${personName}，破军星现代事业发展建议：1) 适合从事产品创新、技术研发、商业模式设计等工作；2) 可发展为产品创新专家、技术架构师、商业模式设计师；3) 关注前沿科技、颠覆性技术等领域；4) 培养创新思维和快速迭代能力；5) 在人工智能、生物科技等前沿领域发展；6) 发展技术创新和商业变革能力。`
      };
      
      if (modernAdvice[star]) {
        advice.push(modernAdvice[star]);
      }
    });
    
    // 通用现代职业发展建议
    const generalModernAdvice = `\n\n现代职业发展通用建议：\n1. 培养数字化技能和数据思维\n2. 保持终身学习的心态，关注新技术趋势\n3. 建立个人品牌和专业影响力\n4. 发展跨界合作和资源整合能力\n5. 关注可持续发展和社会责任\n6. 培养远程协作和数字化沟通能力\n7. 建立多元化收入来源和被动收入\n8. 保持创新思维和适应变化的能力`;
    
    return (advice.length > 0 ? advice.join('\n\n') : `${personName}，建议根据个人兴趣和市场趋势选择适合的现代职业发展方向`) + generalModernAdvice;
  }

  // ==================== 财富分析相关方法 ====================

  // 生成个性化财富概述
  generatePersonalizedWealthOverview(personName, wealthStars, mainStar, wealthPosition) {
    const starCombination = wealthStars.join('、') || '无主星';
    const positionInfluence = this.getWealthPositionInfluence(wealthPosition);
    
    return `${personName}，您的财帛宫位于${wealthPosition}，主星为${starCombination}。${positionInfluence}这样的星曜配置使您在财富积累方面${this.getWealthStarCombinationAnalysis(wealthStars, personName)}。您的财富格局${this.getWealthPatternDescription(mainStar, personName)}。`;
  }

  // 获取财帛宫位置影响
  getWealthPositionInfluence(position) {
    const positionInfluences = {
      '子': '您在财富管理上思维敏捷，善于抓住投资机会。',
      '丑': '您在财富积累上稳重踏实，注重长期投资。',
      '寅': '您在财富创造上充满活力，敢于冒险投资。',
      '卯': '您在财富管理上温和稳健，偏好安全投资。',
      '辰': '您在财富规划上聪明理性，善于分析投资。',
      '巳': '您在财富追求上热情积极，喜欢多元投资。',
      '午': '您在财富观念上光明正大，注重正当收入。',
      '未': '您在财富管理上细致谨慎，重视风险控制。',
      '申': '您在财富创造上灵活变通，善于把握商机。',
      '酉': '您在财富积累上精明能干，注重效率收益。',
      '戌': '您在财富观念上忠诚可靠，偏好稳定投资。',
      '亥': '您在财富管理上包容宽厚，注重长远规划。'
    };
    
    return positionInfluences[position] || '您在财富方面有独特的天赋和潜力。';
  }

  // 获取财富星曜组合分析
  getWealthStarCombinationAnalysis(wealthStars, personName) {
    if (wealthStars.length === 0) {
      return '虽然财帛宫无主星，但这意味着您的财富来源多样化，不受单一模式限制';
    }
    
    const starAnalysis = {
      '紫微': '具有贵族式的财富观念，适合从事高端行业或管理职位获得财富',
      '天机': '善于运用智慧理财，适合通过策划、咨询等智力型工作获得财富',
      '太阳': '财富来源光明正大，适合通过正当渠道和帮助他人获得财富',
      '武曲': '具有很强的赚钱能力，适合通过实业、技术等实际工作获得财富',
      '天同': '财富观念平和，适合通过稳定工作和合作获得财富',
      '廉贞': '对财富有独特品味，适合通过艺术、美容等相关行业获得财富',
      '天府': '善于积累财富，适合通过储蓄、投资等方式稳健增值',
      '太阴': '理财细致入微，适合通过精打细算和长期投资获得财富',
      '贪狼': '财富来源多元化，适合通过多种渠道和投资方式获得财富',
      '巨门': '善于发现财富机会，适合通过专业技能和深度研究获得财富',
      '天相': '财富管理忠诚可靠，适合通过服务他人和协调工作获得财富',
      '天梁': '财富观念正直，适合通过教育、指导等正面工作获得财富',
      '七杀': '敢于冒险投资，适合通过开拓性工作和竞争获得财富',
      '破军': '善于创新理财，适合通过变革和新兴行业获得财富'
    };
    
    return starAnalysis[wealthStars[0]] || '具有独特的财富获得方式和理财风格';
  }

  // 获取财富格局描述
  getWealthPatternDescription(mainStar, personName) {
    const patterns = {
      '紫微': `${personName}，注定要通过领导和管理获得丰厚财富`,
      '天机': `${personName}，智慧是您最大的财富，善用策略必能致富`,
      '太阳': `${personName}，光明正大的财富之路，帮助他人也能成就自己`,
      '武曲': `${personName}，实干致富，通过努力工作必能获得丰厚回报`,
      '天同': `${personName}，平稳致富，财富增长虽缓但持续稳定`,
      '廉贞': `${personName}，品味致富，通过美感和创意获得财富`,
      '天府': `${personName}，积累致富，善于储蓄和投资的理财高手`,
      '太阴': `${personName}，细水长流，通过精细管理获得稳定财富`,
      '贪狼': `${personName}，多元致富，财富来源广泛且机会众多`,
      '巨门': `${personName}，专业致富，通过深度专业技能获得高收入`,
      '天相': `${personName}，服务致富，通过帮助他人获得相应回报`,
      '天梁': `${personName}，正道致富，财富来源正当且受人尊敬`,
      '七杀': `${personName}，拼搏致富，敢于冒险必能获得丰厚回报`,
      '破军': `${personName}，创新致富，通过变革和创新开辟财富新路`
    };
    
    return patterns[mainStar] || `${personName}，拥有独特的财富发展格局`;
  }

  // 分析深度财富潜力
  analyzeDeepWealthPotential(wealthStars, wealthLucky, wealthUnlucky, personName) {
    const potentials = [];
    
    wealthStars.forEach(star => {
      const starPotential = {
        '紫微': '具有成为富豪的潜质，适合从事高端行业或创业',
        '天机': '智慧理财潜力巨大，适合投资咨询或策略规划',
        '太阳': '正面财富影响力强，适合公开透明的财富积累',
        '武曲': '实业致富潜力强，适合技术创新或制造业',
        '天同': '稳健理财潜力好，适合长期投资或合作经营',
        '廉贞': '艺术财富潜力大，适合创意产业或美容行业',
        '天府': '财富积累潜力强，适合金融投资或资产管理',
        '太阴': '精细理财潜力好，适合财务管理或精算工作',
        '贪狼': '多元财富潜力大，适合多种投资或跨界经营',
        '巨门': '专业财富潜力强，适合技术专利或专业服务',
        '天相': '协调财富潜力好，适合中介服务或团队合作',
        '天梁': '教育财富潜力大，适合知识付费或培训行业',
        '七杀': '冒险财富潜力强，适合高风险高回报投资',
        '破军': '创新财富潜力大，适合新兴行业或技术革新'
      };
      
      if (starPotential[star]) {
        potentials.push(starPotential[star]);
      }
    });
    
    return potentials.length > 0 ? potentials.join('；') : `${personName}，您有独特的财富发展潜力`;
  }

  // 分析个性化赚钱风格
  analyzePersonalizedEarningStyle(wealthStars, mainStar, personName) {
    const styles = [];
    
    wealthStars.forEach(star => {
      const earningStyle = {
        '紫微': '喜欢通过领导和管理获得收入，注重身份地位',
        '天机': '善于通过智慧和策略获得收入，重视效率',
        '太阳': '倾向于通过正当渠道获得收入，重视声誉',
        '武曲': '注重通过实际工作获得收入，重视成果',
        '天同': '偏好通过稳定工作获得收入，重视和谐',
        '廉贞': '喜欢通过创意工作获得收入，重视美感',
        '天府': '善于通过积累获得收入，重视安全',
        '太阴': '倾向于通过细致工作获得收入，重视稳定',
        '贪狼': '喜欢通过多元化获得收入，重视机会',
        '巨门': '善于通过专业技能获得收入，重视深度',
        '天相': '倾向于通过服务获得收入，重视关系',
        '天梁': '喜欢通过指导获得收入，重视正义',
        '七杀': '敢于通过冒险获得收入，重视挑战',
        '破军': '善于通过创新获得收入，重视变化'
      };
      
      if (earningStyle[star]) {
        styles.push(earningStyle[star]);
      }
    });
    
    return styles.length > 0 ? styles.join('；') : `${personName}，您有独特的赚钱风格`;
  }

  // 分析个性化投资倾向
  analyzePersonalizedInvestmentTendency(wealthStars, mingGongStars, personName) {
    const tendencies = [];
    
    wealthStars.forEach(star => {
      const investmentTendency = {
        '紫微': '偏好高端投资项目，注重投资的社会地位',
        '天机': '善于分析投资机会，偏好智能化投资',
        '太阳': '偏好透明度高的投资，注重投资的社会价值',
        '武曲': '偏好实业投资，注重投资的实际回报',
        '天同': '偏好稳健投资，注重投资的安全性',
        '廉贞': '偏好艺术品投资，注重投资的美学价值',
        '天府': '偏好保守投资，注重资产的保值增值',
        '太阴': '偏好长期投资，注重投资的持续性',
        '贪狼': '偏好多元化投资，注重投资的灵活性',
        '巨门': '偏好专业领域投资，注重投资的专业性',
        '天相': '偏好合作投资，注重投资的协调性',
        '天梁': '偏好道德投资，注重投资的正当性',
        '七杀': '敢于高风险投资，注重投资的挑战性',
        '破军': '偏好创新投资，注重投资的前瞻性'
      };
      
      if (investmentTendency[star]) {
        tendencies.push(investmentTendency[star]);
      }
    });
    
    return tendencies.length > 0 ? tendencies.join('；') : `${personName}，您有独特的投资倾向`;
  }

  // 分析个性化财务管理
  analyzePersonalizedFinancialManagement(wealthStars, wealthStrength, personName) {
    const management = [];
    
    wealthStars.forEach(star => {
      const financialManagement = {
        '紫微': '财务管理注重权威性，喜欢制定宏观财务规划',
        '天机': '财务管理注重策略性，善于运用各种理财工具',
        '太阳': '财务管理注重透明性，偏好公开透明的理财方式',
        '武曲': '财务管理注重实效性，重视投资回报率',
        '天同': '财务管理注重和谐性，偏好平衡的资产配置',
        '廉贞': '财务管理注重美感性，偏好有品味的投资',
        '天府': '财务管理注重安全性，善于风险控制',
        '太阴': '财务管理注重细致性，善于精打细算',
        '贪狼': '财务管理注重多样性，喜欢多元化投资',
        '巨门': '财务管理注重专业性，深入研究投资项目',
        '天相': '财务管理注重协调性，善于平衡各方利益',
        '天梁': '财务管理注重原则性，坚持正当理财',
        '七杀': '财务管理注重进取性，敢于承担投资风险',
        '破军': '财务管理注重创新性，喜欢尝试新的理财方式'
      };
      
      if (financialManagement[star]) {
        management.push(financialManagement[star]);
      }
    });
    
    return management.length > 0 ? management.join('；') : `${personName}，您有独特的财务管理风格`;
  }

  // 分析详细财富时机
  analyzeDetailedWealthTiming(wealthStars, wealthLucky, personName) {
    return `${personName}，根据您的财帛宫星曜配置，建议在事业稳定后开始大规模投资，把握市场机会的同时注重风险控制。`;
  }

  // 分析财富障碍
  analyzeWealthObstacles(wealthUnlucky, wealthStars, personName) {
    const obstacles = [];
    
    wealthUnlucky.forEach(star => {
      const starObstacles = {
        '擎羊': '容易因为急躁而做出错误的投资决策',
        '陀罗': '财富积累速度可能较慢，需要耐心等待',
        '火星': '投资时容易冲动，需要控制情绪',
        '铃星': '可能面临财务压力，需要合理规划',
        '地空': '理想与现实存在差距，需要脚踏实地',
        '地劫': '可能遇到意外的财务损失，需要预防风险'
      };
      
      if (starObstacles[star]) {
        obstacles.push(starObstacles[star]);
      }
    });
    
    return obstacles.length > 0 ? obstacles.join('；') : `${personName}，您的财富发展相对顺利，主要注意合理规划即可`;
  }

  // 分析财富机会
  analyzeWealthOpportunities(wealthStars, wealthLucky, personName) {
    const opportunities = [];
    
    wealthLucky.forEach(star => {
      const starOpportunities = {
        '文昌': '通过文化、教育相关投资获得收益',
        '文曲': '通过口才、交流相关工作获得财富',
        '左辅': '通过辅助他人获得相应回报',
        '右弼': '通过团队合作获得共同收益',
        '天魁': '获得贵人在财务方面的帮助',
        '天钺': '通过正当渠道获得财务支持'
      };
      
      if (starOpportunities[star]) {
        opportunities.push(starOpportunities[star]);
      }
    });
    
    return opportunities.length > 0 ? opportunities.join('；') : `${personName}，建议主动寻找合适的投资机会，发挥自身优势`;
  }

  // 分析被动收入机会
  analyzePassiveIncomeOpportunities(wealthStars, mingGongStars, personName) {
    return `${personName}，根据您的星曜特质，建议考虑通过投资理财、知识产权、租赁收入等方式建立被动收入来源。`;
  }

  // 生成理财规划建议
  generateFinancialPlanningAdvice(wealthStars, mainStar, personName) {
    const planningAdvice = [];
    
    // 根据主星特质给出具体理财建议
    const starAdvice = {
      '紫微': `${personName}，建议采用贵族式理财策略：1) 投资高端理财产品和蓝筹股；2) 建立多元化投资组合，包括股票、债券、房地产；3) 寻求专业理财顾问的建议；4) 注重长期价值投资，避免短期投机。`,
      '天机': `${personName}，建议采用智慧型理财策略：1) 深入研究投资标的，做好功课再投资；2) 关注科技股和成长型企业；3) 利用量化分析工具辅助决策；4) 定期调整投资组合，灵活应对市场变化。`,
      '太阳': `${personName}，建议采用阳光透明理财策略：1) 选择知名度高、透明度好的投资产品；2) 投资ESG概念股票和绿色债券；3) 参与公开透明的投资平台；4) 避免复杂的金融衍生品，坚持简单明了的投资方式。`,
      '武曲': `${personName}，建议采用实战型理财策略：1) 重点投资实业股票和REITs；2) 建立应急基金，确保财务安全；3) 采用定投策略，持续积累财富；4) 关注投资回报率，追求实际收益。`,
      '天同': `${personName}，建议采用和谐稳健理财策略：1) 选择风险适中的平衡型基金；2) 分散投资，不把鸡蛋放在一个篮子里；3) 与家人共同制定理财计划；4) 注重投资的稳定性和可持续性。`,
      '廉贞': `${personName}，建议采用品味型理财策略：1) 投资艺术品、收藏品等另类资产；2) 关注奢侈品牌和时尚产业股票；3) 选择有美学价值的投资标的；4) 平衡理性投资与感性偏好。`,
      '天府': `${personName}，建议采用稳健积累理财策略：1) 优先建立充足的储蓄基金；2) 投资稳定分红的蓝筹股；3) 考虑购买保险和年金产品；4) 制定长期财富积累计划，注重复利效应。`,
      '太阴': `${personName}，建议采用细致入微理财策略：1) 详细记录每笔收支，做好财务规划；2) 选择稳健的债券和货币基金；3) 关注细分行业的投资机会；4) 定期评估和调整投资组合。`,
      '贪狼': `${personName}，建议采用多元化理财策略：1) 投资多个不同行业和地区；2) 尝试新兴投资工具，如数字货币、P2P等；3) 保持一定比例的高风险高收益投资；4) 灵活调整投资策略，把握市场机会。`,
      '巨门': `${personName}，建议采用专业深度理财策略：1) 专注于自己熟悉的行业进行投资；2) 深入研究投资标的的基本面；3) 寻求专业的投资建议和分析报告；4) 建立自己的投资评估体系。`,
      '天相': `${personName}，建议采用协调平衡理财策略：1) 在风险和收益之间寻找平衡点；2) 选择信誉良好的金融机构；3) 与专业理财师合作制定投资计划；4) 注重投资的社会责任和道德标准。`,
      '天梁': `${personName}，建议采用稳重长远理财策略：1) 制定长期投资计划，坚持价值投资；2) 选择有社会价值的投资标的；3) 建立教育基金和养老基金；4) 传承财富管理经验给下一代。`,
      '七杀': `${personName}，建议采用进取型理财策略：1) 适当配置高风险高收益的投资产品；2) 关注新兴市场和成长股；3) 敢于在市场低迷时逆向投资；4) 设定明确的投资目标和止损点。`,
      '破军': `${personName}，建议采用创新突破理财策略：1) 关注颠覆性技术和新兴产业；2) 投资创新型企业和独角兽公司；3) 尝试新的投资模式和工具；4) 保持对市场变化的敏感度，及时调整策略。`
    };
    
    // 通用理财建议
    const generalAdvice = `\n\n通用理财原则：\n1. 建立紧急备用金（3-6个月生活费）\n2. 根据年龄调整风险偏好（100-年龄=股票配置比例）\n3. 定期定额投资，利用时间复利效应\n4. 分散投资风险，不要过度集中\n5. 持续学习理财知识，提升财商\n6. 定期检视投资组合，适时调整\n7. 控制投资成本，选择低费率产品\n8. 保持理性，避免情绪化投资决策`;
    
    return (starAdvice[mainStar] || `${personName}，建议制定适合自己的理财规划，合理配置资产，在保证安全的前提下追求稳健增长。`) + generalAdvice;
  }

  // 生成现代财富策略
  generateModernWealthStrategies(wealthStars, mingGongStars, personName) {
    return `${personName}，在数字化时代，建议关注科技投资、数字资产、在线教育等新兴领域的投资机会。`;
  }

  // 分析财务风险管理
  analyzeFinancialRiskManagement(wealthStars, wealthUnlucky, personName) {
    return `${personName}，建议建立应急基金，分散投资风险，定期评估投资组合，确保财务安全。`;
  }

  // ==================== 关系分析相关方法 ====================

  // 生成个性化关系概述
  generatePersonalizedRelationshipOverview(personName, marriageStars, personGender, marriagePosition) {
    const starCombination = marriageStars.join('、') || '无主星';
    const positionInfluence = this.getMarriagePositionInfluence(marriagePosition);
    const genderModifier = personGender === '男性' ? '在感情中展现男性的责任感和保护欲' : '在感情中体现女性的温柔和包容';
    
    return `${personName}，您的夫妻宫位于${marriagePosition}，主星为${starCombination}。${positionInfluence}这样的星曜配置使您在感情关系中${this.getMarriageStarCombinationAnalysis(marriageStars, personName)}，${genderModifier}。您的感情格局${this.getMarriagePatternDescription(marriageStars[0] || '天机', personName)}。`;
  }

  // 获取夫妻宫位置影响
  getMarriagePositionInfluence(position) {
    const positionInfluences = {
      '子': '您在感情中思维敏捷，善于沟通交流。',
      '丑': '您在感情中稳重踏实，注重长期关系。',
      '寅': '您在感情中充满活力，热情主动。',
      '卯': '您在感情中温和体贴，重视和谐。',
      '辰': '您在感情中理性分析，善于解决问题。',
      '巳': '您在感情中热情如火，表达直接。',
      '午': '您在感情中光明磊落，真诚待人。',
      '未': '您在感情中细致入微，关怀备至。',
      '申': '您在感情中灵活变通，善于调节。',
      '酉': '您在感情中精明能干，注重实际。',
      '戌': '您在感情中忠诚可靠，重视承诺。',
      '亥': '您在感情中包容宽厚，善解人意。'
    };
    
    return positionInfluences[position] || '您在感情方面有独特的魅力和特质。';
  }

  // 获取婚姻星曜组合分析
  getMarriageStarCombinationAnalysis(marriageStars, personName) {
    if (marriageStars.length === 0) {
      return '虽然夫妻宫无主星，但这意味着您的感情模式灵活多变，不受固定模式限制';
    }
    
    const starAnalysis = {
      '紫微': '具有贵族式的感情观念，期望在感情中占主导地位',
      '天机': '在感情中善于思考和规划，重视精神层面的交流',
      '太阳': '在感情中光明正大，喜欢公开表达爱意',
      '武曲': '在感情中注重实际，重视物质基础和安全感',
      '天同': '在感情中追求和谐快乐，重视精神契合',
      '廉贞': '在感情中富有激情，重视美感和浪漫',
      '天府': '在感情中稳重可靠，善于经营长期关系',
      '太阴': '在感情中细腻敏感，善于体察对方需求',
      '贪狼': '在感情中多姿多彩，喜欢新鲜感和变化',
      '巨门': '在感情中善于沟通，但有时过于挑剔',
      '天相': '在感情中忠诚可靠，善于协调和包容',
      '天梁': '在感情中成熟稳重，喜欢指导和保护对方',
      '七杀': '在感情中勇敢直接，敢于追求和表达',
      '破军': '在感情中喜欢变化，不满足于平淡的关系'
    };
    
    return starAnalysis[marriageStars[0]] || '具有独特的感情表达方式和相处模式';
  }

  // 获取婚姻格局描述
  getMarriagePatternDescription(mainStar, personName) {
    const patterns = {
      '紫微': `${personName}，注定要在感情中扮演重要角色，建立高品质的关系`,
      '天机': `${personName}，智慧是您感情的基础，善于经营精神层面的爱情`,
      '太阳': `${personName}，光明正大的感情观，真诚待人必能获得真爱`,
      '武曲': `${personName}，实际的感情观，通过行动表达爱意`,
      '天同': `${personName}，和谐的感情观，追求心灵的契合与平静`,
      '廉贞': `${personName}，浪漫的感情观，重视美感和激情`,
      '天府': `${personName}，稳定的感情观，善于建立长久的关系`,
      '太阴': `${personName}，细腻的感情观，重视内心的交流与理解`,
      '贪狼': `${personName}，多元的感情观，感情生活丰富多彩`,
      '巨门': `${personName}，深度的感情观，重视沟通和理解`,
      '天相': `${personName}，忠诚的感情观，重视承诺和责任`,
      '天梁': `${personName}，成熟的感情观，善于指导和保护`,
      '七杀': `${personName}，勇敢的感情观，敢于追求真爱`,
      '破军': `${personName}，创新的感情观，不断寻求感情的突破`
    };
    
    return patterns[mainStar] || `${personName}，拥有独特的感情发展格局`;
  }

  // 分析深度婚姻运势
  analyzeDeepMarriageFortune(marriageStars, marriageLucky, marriageUnlucky, personName) {
    return `${personName}，根据您的夫妻宫星曜配置，您的婚姻运势整体良好，建议在合适的时机主动寻找真爱。`;
  }

  // 分析详细配偶特征
  analyzeDetailedSpouseCharacteristics(marriageStars, personGender, personName) {
    const characteristics = [];
    
    marriageStars.forEach(star => {
      const spouseTraits = {
        '紫微': '配偶具有领导气质，有贵族风范，注重身份地位',
        '天机': '配偶聪明机智，善于思考，具有策划能力',
        '太阳': '配偶热情开朗，正直善良，具有正义感',
        '武曲': '配偶意志坚强，实干能力强，注重物质基础',
        '天同': '配偶性格温和，人缘好，具有亲和力',
        '廉贞': '配偶感情丰富，有艺术天分，注重美感',
        '天府': '配偶稳重可靠，善于理财，注重安全感',
        '太阴': '配偶细腻敏感，善于照顾人，具有母性/父性光辉',
        '贪狼': '配偶多才多艺，善于交际，具有魅力',
        '巨门': '配偶口才好，分析能力强，有时比较挑剔',
        '天相': '配偶忠诚可靠，协调能力强，善于辅助',
        '天梁': '配偶成熟稳重，有长者风范，具有责任感',
        '七杀': '配偶个性强烈，勇于开拓，不怕困难',
        '破军': '配偶喜欢变化，勇于创新，不满足现状'
      };
      
      if (spouseTraits[star]) {
        characteristics.push(spouseTraits[star]);
      }
    });
    
    return characteristics.length > 0 ? characteristics.join('；') : `${personName}，您的配偶将具有独特的个性特征`;
  }

  // 分析个性化关系模式
  analyzePersonalizedRelationshipPattern(marriageStars, mingGongStars, personName) {
    return `${personName}，根据您的星曜特质，您在感情中倾向于建立稳定而深入的关系，重视精神层面的交流。`;
  }

  // 分析恋爱风格
  analyzeLoveStyle(marriageStars, mingGongStars, personGender, personName) {
    return `${personName}，您的恋爱风格${personGender === '男性' ? '主动而直接，喜欢表达关怀' : '温柔而体贴，善于营造浪漫氛围'}。`;
  }

  // 分析详细婚姻时机
  analyzeDetailedMarriageTiming(marriageStars, marriageStrength, personName) {
    return `${personName}，根据您的夫妻宫强度，建议在25-30岁之间考虑婚姻，此时感情运势较为稳定。`;
  }

  // 分析深度关系挑战
  analyzeDeepRelationshipChallenges(marriageUnlucky, marriageStars, personName) {
    const challenges = [];
    
    marriageUnlucky.forEach(star => {
      const relationshipChallenges = {
        '擎羊': '感情中容易出现争执，需要学会控制脾气',
        '陀罗': '感情发展可能较慢，需要耐心等待',
        '火星': '感情中容易冲动，需要理性处理问题',
        '铃星': '可能面临感情压力，需要学会释放情绪',
        '地空': '理想与现实存在差距，需要务实对待感情',
        '地劫': '可能遇到感情变故，需要保持坚强'
      };
      
      if (relationshipChallenges[star]) {
        challenges.push(relationshipChallenges[star]);
      }
    });
    
    return challenges.length > 0 ? challenges.join('；') : `${personName}，您的感情发展相对顺利，主要注意沟通交流即可`;
  }

  // 分析兼容性因素
  analyzeCompatibilityFactors(marriageStars, mingGongStars, personName) {
    return `${personName}，建议寻找性格互补、价值观相近的伴侣，这样的组合最有利于长期关系的发展。`;
  }

  // 分析关系成长
  analyzeRelationshipGrowth(marriageStars, marriageLucky, personName) {
    return `${personName}，您的感情关系具有良好的成长潜力，通过相互理解和支持，关系会越来越深厚。`;
  }

  // 分析沟通风格
  analyzeCommunicationStyle(marriageStars, mingGongStars, personName) {
    return `${personName}，您在感情沟通中倾向于直接而真诚的表达方式，建议多倾听对方的想法。`;
  }

  // 分析亲密模式
  analyzeIntimacyPatterns(marriageStars, personGender, personName) {
    return `${personName}，您在亲密关系中${personGender === '男性' ? '注重行动表达，善于通过实际行为表达爱意' : '注重情感交流，善于营造温馨的氛围'}。`;
  }

  // 生成综合关系建议
  generateComprehensiveRelationshipAdvice(marriageStars, personName, personGender) {
    return `${personName}，建议在感情中保持真诚和耐心，通过良好的沟通建立深厚的感情基础。`;
  }

  // 生成现代约会指导
  generateModernDatingGuidance(marriageStars, mingGongStars, personName, personGender) {
    return `${personName}，在现代约会中，建议保持自然和真实，通过共同兴趣和价值观建立联系。`;
  }

  // ==================== 人生指导相关方法 ====================

  // 生成个性化人生概述
  generatePersonalizedLifeOverview(personName, mainStar, mingGong, patternAnalysis) {
    const mainStars = mingGong.main_stars;
    const starCombination = mainStars.join('、') || '无主星';
    
    return `${personName}，您的人生以${starCombination}为主导，${this.getLifeOverviewDescription(mainStar, personName)}。您的人生格局${this.getLifePatternOverview(patternAnalysis, personName)}，注定要在人生的道路上发挥独特的作用和价值。`;
  }

  // 获取人生概述描述
  getLifeOverviewDescription(mainStar, personName) {
    const descriptions = {
      '紫微': `${personName}，您天生具有领导者的气质，注定要在人生中承担重要责任`,
      '天机': `${personName}，您拥有智慧和策略思维，善于规划和指导人生方向`,
      '太阳': `${personName}，您具有光明正大的品格，人生使命是照亮和帮助他人`,
      '武曲': `${personName}，您拥有坚强的意志力，通过实干和努力创造人生价值`,
      '天同': `${personName}，您追求和谐快乐的人生，重视精神层面的满足`,
      '廉贞': `${personName}，您具有丰富的情感和艺术天赋，人生充满美感和创意`,
      '天府': `${personName}，您善于积累和管理，人生注重稳健发展和长远规划`,
      '太阴': `${personName}，您细腻敏感，善于照顾他人，人生价值在于默默奉献`,
      '贪狼': `${personName}，您多才多艺，人生充满各种可能性和机遇`,
      '巨门': `${personName}，您善于分析和研究，人生注重专业发展和深度探索`,
      '天相': `${personName}，您忠诚可靠，人生价值在于服务他人和协调关系`,
      '天梁': `${personName}，您正直善良，人生使命是指导他人和维护正义`,
      '七杀': `${personName}，您勇于开拓，人生充满挑战和突破的机会`,
      '破军': `${personName}，您勇于创新，人生注定要在变革中寻找新的道路`
    };
    
    return descriptions[mainStar] || `${personName}，您拥有独特的人生使命和发展道路`;
  }

  // 获取人生格局概述
  getLifePatternOverview(patternAnalysis, personName) {
    return '展现出独特而有意义的发展轨迹';
  }

  // 分析深度人生目的
  analyzeDeepLifePurpose(mainStar, mingGong, siHua, personName) {
    return `${personName}，您的人生目的是通过发挥${mainStar}星的特质，在人生的舞台上实现自我价值，同时为社会做出贡献。`;
  }

  // 分析个性化核心价值观
  analyzePersonalizedCoreValues(mingGong, fuDe, personName) {
    return `${personName}，您的核心价值观注重诚信、责任和成长，这些价值观将指导您做出正确的人生选择。`;
  }

  // 分析综合发展方向
  analyzeComprehensiveDevelopmentDirection(mainStar, twelvePalaces, personName) {
    return `${personName}，建议您在个人成长、事业发展和人际关系三个方面均衡发展，发挥自身优势的同时补强不足。`;
  }

  // 分析个性化精神成长
  analyzePersonalizedSpiritualGrowth(fuDe, siHua, personName) {
    return `${personName}，您的精神成长路径注重内在修养和智慧积累，通过不断学习和反思提升人生境界。`;
  }

  // 分析深度人生课题
  analyzeDeepLifeLessons(mingGong, twelvePalaces, personName) {
    return `${personName}，您的人生课题包括学会平衡、培养耐心、发展同理心，这些课题将帮助您成为更完整的人。`;
  }

  // 分析人生阶段
  analyzeLifePhases(twelvePalaces, siHua, personName) {
    return `${personName}，您的人生可以分为学习成长期、事业建立期、成熟稳定期和智慧传承期，每个阶段都有不同的重点和挑战。`;
  }

  // 分析命运实现
  analyzeDestinyFulfillment(mainStar, patternAnalysis, personName) {
    return `${personName}，通过发挥自身优势、把握机遇、克服挑战，您能够实现自己的人生理想和命运安排。`;
  }

  // 分析业力模式
  analyzeKarmicPatterns(mingGong, qianYi, personName) {
    return `${personName}，您的业力模式显示需要在人际关系和个人成长方面多加努力，通过善行积德改善命运。`;
  }

  // 分析人生平衡
  analyzeLifeBalance(twelvePalaces, personName) {
    return `${personName}，建议您在工作与生活、理想与现实、个人与他人之间寻找平衡点，这样才能获得真正的幸福。`;
  }

  // 分析遗产建设
  analyzeLegacyBuilding(mingGong, tianzhai, personName) {
    return `${personName}，您的遗产不仅包括物质财富，更重要的是精神财富和对后代的正面影响。`;
  }

  // 分析智慧培养
  analyzeWisdomCultivation(fuDe, siHua, personName) {
    return `${personName}，通过读书学习、人生体验、反思总结，您能够不断积累智慧，成为有深度的人。`;
  }

  // 生成综合整体指导
  generateComprehensiveOverallGuidance(mainStar, personName, patternAnalysis) {
    return `${personName}，人生是一场修行，建议您保持积极乐观的心态，勇敢面对挑战，珍惜每一个成长的机会。`;
  }

  // 生成现代生活整合
  generateModernLifeIntegration(twelvePalaces, personName) {
    return `${personName}，在现代社会中，建议您将传统智慧与现代生活相结合，既要保持文化根基，也要适应时代发展。`;
  }
}

module.exports = ZiweiAnalyzer;