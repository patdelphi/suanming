// 八字分析服务模块
// 基于传统四柱八字理论的动态分析系统

const SolarTermsCalculator = require('../utils/solarTerms.cjs');
const WanNianLi = require('../utils/wanNianLi.cjs');
const BaseData = require('./common/BaseData.cjs');
const AnalysisCache = require('./common/AnalysisCache.cjs');

class BaziAnalyzer {
  constructor() {
    // 初始化共享基础数据
    this.baseData = new BaseData();
    
    // 初始化节气计算器和万年历
    this.solarTermsCalculator = new SolarTermsCalculator();
    this.wanNianLi = new WanNianLi();
    
    // 初始化缓存机制
    this.cache = new AnalysisCache({
      maxSize: 500,
      defaultTTL: 1800000 // 30分钟
    });
    
    // 纳音五行对照表（60甲子纳音）
    this.nayinTable = {
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

    // 二十四节气表（简化版）
    this.solarTerms = {
      1: { start: 4, name: '立春' }, // 2月4日左右立春
      2: { start: 19, name: '雨水' },
      3: { start: 6, name: '惊蛰' },
      4: { start: 21, name: '春分' },
      5: { start: 5, name: '清明' },
      6: { start: 21, name: '谷雨' },
      7: { start: 6, name: '立夏' },
      8: { start: 21, name: '小满' },
      9: { start: 6, name: '芒种' },
      10: { start: 22, name: '夏至' },
      11: { start: 7, name: '小暑' },
      12: { start: 23, name: '大暑' }
    };
  }

  /**
   * 完全个性化的八字分析主函数 - 基于真实用户数据
   * @param {Object} birth_data - 出生数据
   * @param {string} birth_data.birth_date - 出生日期 (YYYY-MM-DD)
   * @param {string} birth_data.birth_time - 出生时间 (HH:MM)
   * @param {string} birth_data.gender - 性别 ('male'/'female' 或 '男'/'女')
   * @param {string} birth_data.birth_place - 出生地点（可选）
   * @param {string} birth_data.name - 姓名（可选）
   * @returns {Promise<Object>} 八字分析结果
   */
  async performFullBaziAnalysis(birth_data) {
    try {
      // 输入参数验证
      if (!birth_data || typeof birth_data !== 'object') {
        throw new Error('输入数据无效：必须提供有效的出生数据对象');
      }
      
      const { birth_date, birth_time, gender, birth_place, name } = birth_data;
      
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
      
      // 验证出生地点长度
      if (birth_place && (typeof birth_place !== 'string' || birth_place.length > 100)) {
        throw new Error('输入数据无效：出生地点长度不能超过100个字符');
      }
      
      // 检查缓存
      const cachedResult = this.cache.get('bazi', birth_data);
      if (cachedResult) {
        return cachedResult;
      }
      
      const personalizedName = (name && name.trim()) || '您';

      // 1. 精确计算八字四柱（基础计算，必须先完成）
      const baziChart = this.calculatePreciseBazi(birth_date, birth_time);
      
      // 2-6. 直接调用同步函数，仅对真正异步的函数使用await
      const wuxingAnalysis = this.performDetailedWuxingAnalysis(baziChart, gender, personalizedName);
      const patternAnalysis = this.determineAccuratePattern(baziChart, gender, personalizedName);
      const fortuneAnalysis = await this.calculatePreciseFortuneAsync(baziChart, birth_date, gender, personalizedName);
      
      // 更新依赖关系的分析结果
      const finalLifeGuidance = this.generateComprehensiveLifeGuidance(baziChart, patternAnalysis, wuxingAnalysis, gender, personalizedName);
      const finalModernGuidance = this.generateModernApplications(baziChart, patternAnalysis, gender, personalizedName);

      const result = {
        analysis_type: 'bazi',
        analysis_date: new Date().toISOString(),
        basic_info: {
          personal_data: {
            name: personalizedName,
            birth_date: birth_date,
            birth_time: birth_time || '12:00',
            gender: gender === 'male' || gender === '男' ? '男性' : '女性',
            birth_place: birth_place || '未提供'
          },
          bazi_chart: baziChart,
          pillar_interpretations: this.generatePillarInterpretations(baziChart, gender, personalizedName),
          lunar_info: this.calculateLunarInfo(birth_date),
          zishi_calculation_note: this.generateZishiCalculationNote(baziChart, birth_time)
        },
        wuxing_analysis: {
          element_distribution: wuxingAnalysis.distribution,
          balance_analysis: wuxingAnalysis.detailed_analysis,
          personality_traits: wuxingAnalysis.personality_traits,
          improvement_suggestions: wuxingAnalysis.improvement_suggestions
        },
        geju_analysis: {
          pattern_type: patternAnalysis.pattern_name,
          pattern_strength: patternAnalysis.strength,
          characteristics: patternAnalysis.detailed_traits,
          career_path: patternAnalysis.suitable_careers,
          life_meaning: patternAnalysis.philosophical_meaning,
          development_strategy: patternAnalysis.action_plan
        },
        dayun_analysis: {
          current_age: fortuneAnalysis.current_age,
          start_luck_age: fortuneAnalysis.start_luck_age,
          current_dayun: fortuneAnalysis.current_dayun,
          dayun_sequence: fortuneAnalysis.life_periods,
          yearly_fortune: fortuneAnalysis.current_year_analysis,
          future_outlook: fortuneAnalysis.next_decade_forecast,
          dayun_influence: fortuneAnalysis.dayun_analysis,
          detailed_yearly_analysis: fortuneAnalysis.detailed_yearly_analysis
        },
        life_guidance: {
          overall_summary: finalLifeGuidance.comprehensive_summary,
          career_development: finalLifeGuidance.career_guidance,
          wealth_management: finalLifeGuidance.wealth_guidance,
          marriage_relationships: finalLifeGuidance.relationship_guidance,
          health_wellness: finalLifeGuidance.health_guidance,
          personal_development: finalLifeGuidance.self_improvement
        },
        modern_applications: {
          lifestyle_recommendations: finalModernGuidance.daily_life,
          career_strategies: finalModernGuidance.professional_development,
          relationship_advice: finalModernGuidance.interpersonal_skills,
          decision_making: finalModernGuidance.timing_guidance
        }
      };
      
      // 存储到缓存
      this.cache.set('bazi', birth_data, result);
      return result;
      
    } catch (error) {
      console.error('Complete Bazi analysis error:', error);
      throw error;
    }
  }

  // 精确计算八字四柱 - 基于传统万年历算法
  calculatePreciseBazi(birth_date, birth_time) {
    const birthDate = new Date(birth_date);
    const birthYear = birthDate.getFullYear();
    const birthMonth = birthDate.getMonth() + 1;
    const birthDay = birthDate.getDate();
    const birthHour = birth_time ? parseInt(birth_time.split(':')[0]) : 12;
    const birthMinute = birth_time ? parseInt(birth_time.split(':')[1]) : 0;

    // 判断是否为晚子时（23:00-24:00）
    const isLateZiShi = birthHour === 23;
    
    // 1. 年柱计算 - 基于精确立春节气
    const yearPillar = this.calculateYearPillar(birthYear, birthMonth, birthDay, birthHour, birthMinute);
    
    // 2. 月柱计算 - 基于精确节气交替
    const monthPillar = this.calculateMonthPillar(birthYear, birthMonth, birthDay, yearPillar.stemIndex, birthHour, birthMinute);
    
    // 3. 日柱计算 - 基于万年历推算
    const dayPillar = this.calculateDayPillar(birthYear, birthMonth, birthDay);
    
    // 4. 时柱计算 - 基于日干推时干，晚子时需要特殊处理
    const hourPillar = this.calculateHourPillar(birthHour, birthMinute, dayPillar.stemIndex, birthYear, birthMonth, birthDay);

    const result = {
      year_pillar: {
        stem: yearPillar.stem,
        branch: yearPillar.branch,
        element: this.getElementFromStem(yearPillar.stem),
        hidden_stems: this.baseData.getBranchHiddenStems(yearPillar.branch),
        ten_god: this.calculateTenGod(dayPillar.stem, yearPillar.stem)
      },
      month_pillar: {
        stem: monthPillar.stem,
        branch: monthPillar.branch,
        element: this.getElementFromStem(monthPillar.stem),
        hidden_stems: this.baseData.getBranchHiddenStems(monthPillar.branch),
        ten_god: this.calculateTenGod(dayPillar.stem, monthPillar.stem),
        is_month_order: true // 月令为提纲
      },
      day_pillar: {
        stem: dayPillar.stem,
        branch: dayPillar.branch,
        element: this.getElementFromStem(dayPillar.stem),
        hidden_stems: this.baseData.getBranchHiddenStems(dayPillar.branch),
        ten_god: '日主', // 日主本身
        is_day_master: true
      },
      hour_pillar: {
        stem: hourPillar.stem,
        branch: hourPillar.branch,
        element: this.getElementFromStem(hourPillar.stem),
        hidden_stems: this.baseData.getBranchHiddenStems(hourPillar.branch),
        ten_god: this.calculateTenGod(dayPillar.stem, hourPillar.stem),
        zishi_type: hourPillar.zishi_type,
        is_late_zishi: hourPillar.is_late_zishi,
        is_early_zishi: hourPillar.is_early_zishi
      },
      day_master: dayPillar.stem,
      day_master_element: this.getElementFromStem(dayPillar.stem),
      // 添加纳音五行信息
      nayin_info: {
        year_nayin: this.calculateNayin(yearPillar.stem, yearPillar.branch),
        month_nayin: this.calculateNayin(monthPillar.stem, monthPillar.branch),
        day_nayin: this.calculateNayin(dayPillar.stem, dayPillar.branch),
        hour_nayin: this.calculateNayin(hourPillar.stem, hourPillar.branch)
      },
      month_order: monthPillar.branch,
      complete_chart: `${yearPillar.stem}${yearPillar.branch} ${monthPillar.stem}${monthPillar.branch} ${dayPillar.stem}${dayPillar.branch} ${hourPillar.stem}${hourPillar.branch}`,
      // 添加五行旺衰分析
      element_strength: this.analyzeElementStrength(dayPillar.stem, monthPillar.branch, {
        year: yearPillar,
        month: monthPillar,
        day: dayPillar,
        hour: hourPillar
      })
    };
    
    return result;
  }

  // 计算纳音五行
  calculateNayin(stem, branch) {
    const ganzhi = stem + branch;
    return this.nayinTable[ganzhi] || '大林木';
  }
  
  // 年柱计算 - 基于精确立春节气
  calculateYearPillar(year, month, day, hour = 12, minute = 0) {
    let actualYear = year;
    
    // 使用精确的立春时间判断
    const currentDate = new Date(year, month - 1, day, hour, minute);
    const isAfterSpring = this.solarTermsCalculator.isAfterSpringBeginning(currentDate);
    
    if (!isAfterSpring) {
      actualYear = year - 1;
    }
    
    // 修正年份计算基准（以1984年甲子年为基准）
    const stemIndex = (actualYear - 1984) % 10;
    const branchIndex = (actualYear - 1984) % 12;
    
    // 确保索引为正数
    const finalStemIndex = ((stemIndex % 10) + 10) % 10;
    const finalBranchIndex = ((branchIndex % 12) + 12) % 12;
    
    return {
      stem: this.baseData.getStemByIndex(finalStemIndex),
        branch: this.baseData.getBranchByIndex(finalBranchIndex),
      stemIndex: finalStemIndex,
      branchIndex: finalBranchIndex
    };
  }
  
  // 月柱计算 - 基于精确节气
  calculateMonthPillar(year, month, day, yearStemIndex, hour = 12, minute = 0) {
    // 使用精确的节气时间确定月支
    const currentDate = new Date(year, month - 1, day, hour, minute);
    const solarTermMonth = this.solarTermsCalculator.getSolarTermMonth(currentDate);
    
    // 获取月支索引
    const branchNames = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const monthBranchIndex = branchNames.indexOf(solarTermMonth.monthBranch);
    
    // 月干推算：甲己之年丙作首，乙庚之年戊为头，丙辛之年庚寅上，丁壬壬位顺行流，戊癸甲寅好追求
    const monthStemBase = {
      0: 2, // 甲年从丙开始（寅月丙寅）
      1: 4, // 乙年从戊开始（寅月戊寅）
      2: 6, // 丙年从庚开始（寅月庚寅）
      3: 8, // 丁年从壬开始（寅月壬寅）
      4: 0, // 戊年从甲开始（寅月甲寅）
      5: 2, // 己年从丙开始（寅月丙寅）
      6: 4, // 庚年从戊开始（寅月戊寅）
      7: 6, // 辛年从庚开始（寅月庚寅）
      8: 8, // 壬年从壬开始（寅月壬寅）
      9: 0  // 癸年从甲开始（寅月甲寅）
    };
    
    // 月支索引：寅=2, 卯=3, 辰=4, 巳=5, 午=6, 未=7, 申=8, 酉=9, 戌=10, 亥=11, 子=0, 丑=1
    // 月干 = 年干对应的起始月干 + (月支索引 - 寅月索引)
    const monthStemIndex = (monthStemBase[yearStemIndex] + (monthBranchIndex - 2 + 12) % 12) % 10;
    
    return {
      stem: this.baseData.getStemByIndex(monthStemIndex),
        branch: this.baseData.getBranchByIndex(monthBranchIndex),
      stemIndex: monthStemIndex,
      branchIndex: monthBranchIndex
    };
  }
  
  // 日柱计算 - 权威万年历查表法
  calculateDayPillar(year, month, day) {
    // 使用权威万年历数据获取精确日柱
    return this.wanNianLi.getAccurateDayPillar(year, month, day);
  }
  
  // 时柱计算 - 日干推时干，支持早晚子时区分
  calculateHourPillar(hour, minute, dayStemIndex, year, month, day) {
    // 判断子时类型
    let isLateZiShi = false;
    let isEarlyZiShi = false;
    let actualDayStemIndex = dayStemIndex;
    
    if (hour === 23) {
      // 晚子时（23:00-23:59）：日柱用当天，时柱用第二天的日干推算
      isLateZiShi = true;
      // 获取第二天的日柱来推算时干
      const nextDay = new Date(year, month - 1, day + 1);
      const nextDayPillar = this.calculateDayPillar(nextDay.getFullYear(), nextDay.getMonth() + 1, nextDay.getDate());
      actualDayStemIndex = nextDayPillar.stemIndex;
    } else if (hour === 0) {
      // 早子时（00:00-00:59）：日柱和时柱都用当天
      isEarlyZiShi = true;
    }
    
    // 时支计算
    let hourBranchIndex;
    if (hour === 23 || hour === 0) {
      // 子时统一为0
      hourBranchIndex = 0;
    } else {
      // 其他时辰按原逻辑计算
      hourBranchIndex = Math.floor((hour + 1) / 2) % 12;
    }
    
    // 时干推算：甲己还加甲
    const hourStemBase = {
      0: 0, // 甲日、己日从甲开始
      1: 2, // 乙日、庚日从丙开始
      2: 4, // 丙日、辛日从戊开始
      3: 6, // 丁日、壬日从庚开始
      4: 8, // 戊日、癸日从壬开始
      5: 0, // 己日从甲开始
      6: 2, // 庚日从丙开始
      7: 4, // 辛日从戊开始
      8: 6, // 壬日从庚开始
      9: 8  // 癸日从壬开始
    };
    
    const hourStemIndex = (hourStemBase[actualDayStemIndex] + hourBranchIndex) % 10;
    
    return {
      stem: this.baseData.getStemByIndex(hourStemIndex),
      branch: this.baseData.getBranchByIndex(hourBranchIndex),
      stemIndex: hourStemIndex,
      branchIndex: hourBranchIndex,
      // 添加子时类型标识
      zishi_type: isLateZiShi ? '晚子时' : (isEarlyZiShi ? '早子时' : null),
      is_late_zishi: isLateZiShi,
      is_early_zishi: isEarlyZiShi
    };
  }

  // 计算十神关系
  calculateTenGod(dayMaster, targetStem) {
    if (dayMaster === targetStem) {
      return '比肩';
    }
    
    const dayElement = this.getElementFromStem(dayMaster);
    const targetElement = this.getElementFromStem(targetStem);
    const relation = this.getElementRelation(dayElement, targetElement);
    
    // 根据阴阳和五行关系确定十神
    const dayYinYang = this.getStemYinYang(dayMaster);
    const targetYinYang = this.getStemYinYang(targetStem);
    const sameYinYang = dayYinYang === targetYinYang;
    
    switch (relation) {
      case 'same':
        return sameYinYang ? '比肩' : '劫财';
      case 'generate': // 我生者
        return sameYinYang ? '食神' : '伤官';
      case 'overcome': // 我克者
        return sameYinYang ? '偏财' : '正财';
      case 'beOvercome': // 克我者
        return sameYinYang ? '七杀' : '正官';
      case 'beGenerated': // 生我者
        return sameYinYang ? '偏印' : '正印';
      default:
        return '未知';
    }
  }
  
  // 获取天干阴阳属性
  getStemYinYang(stem) {
    const yangStems = ['甲', '丙', '戊', '庚', '壬'];
    return yangStems.includes(stem) ? '阳' : '阴';
  }
  
  // 五行旺衰分析 - 核心算法
  analyzeElementStrength(dayMaster, monthBranch, pillars) {
    const dayElement = this.getElementFromStem(dayMaster);
    
    // 1. 月令旺衰 - 最重要的因素
    const monthStrength = this.getMonthStrength(dayElement, monthBranch);
    
    // 2. 地支藏干分析
    const hiddenStemSupport = this.analyzeHiddenStemSupport(dayElement, pillars);
    
    // 3. 天干通根分析
    const stemSupport = this.analyzeStemSupport(dayElement, pillars);
    
    // 4. 综合旺衰判断
    const overallStrength = this.calculateOverallStrength(monthStrength, hiddenStemSupport, stemSupport);
    
    return {
      month_strength: monthStrength,
      hidden_stem_support: hiddenStemSupport,
      stem_support: stemSupport,
      overall_strength: overallStrength,
      strength_level: this.getStrengthLevel(overallStrength),
      use_god_analysis: this.analyzeUseGod(dayElement, overallStrength, pillars)
    };
  }
  
  // 月令旺衰判断
  getMonthStrength(element, monthBranch) {
    const seasonStrength = {
      '木': { '寅': '旺', '卯': '旺', '辰': '余气', '巳': '死', '午': '死', '未': '死', '申': '绝', '酉': '绝', '戌': '墓', '亥': '生', '子': '生', '丑': '休' },
      '火': { '寅': '生', '卯': '生', '辰': '休', '巳': '旺', '午': '旺', '未': '余气', '申': '死', '酉': '死', '戌': '墓', '亥': '绝', '子': '绝', '丑': '死' },
      '土': { '寅': '死', '卯': '死', '辰': '旺', '巳': '相', '午': '相', '未': '旺', '申': '休', '酉': '休', '戌': '旺', '亥': '死', '子': '死', '丑': '旺' },
      '金': { '寅': '绝', '卯': '绝', '辰': '墓', '巳': '死', '午': '死', '未': '死', '申': '旺', '酉': '旺', '戌': '余气', '亥': '生', '子': '生', '丑': '相' },
      '水': { '寅': '死', '卯': '死', '辰': '墓', '巳': '绝', '午': '绝', '未': '死', '申': '生', '酉': '生', '戌': '死', '亥': '旺', '子': '旺', '丑': '余气' }
    };
    
    return seasonStrength[element]?.[monthBranch] || '平';
  }
  
  // 地支藏干支持度分析
  analyzeHiddenStemSupport(dayElement, pillars) {
    let supportScore = 0;
    const supportDetails = [];
    
    Object.values(pillars).forEach(pillar => {
      const hiddenStems = this.baseData.getBranchHiddenStems(pillar.branch);
      hiddenStems.forEach((hiddenStem, index) => {
        const hiddenElement = this.getElementFromStem(hiddenStem);
        const relation = this.getElementRelation(hiddenElement, dayElement);
        
        let score = 0;
        if (relation === 'same') score = 3;
        else if (relation === 'beGenerated') score = 2;
        else if (relation === 'generate') score = -1;
        else if (relation === 'overcome') score = -2;
        else if (relation === 'beOvercome') score = -3;
        
        // 本气得分最高，中气次之，余气最低
        const positionMultiplier = index === 0 ? 1.0 : index === 1 ? 0.6 : 0.3;
        const finalScore = score * positionMultiplier;
        
        supportScore += finalScore;
        if (Math.abs(finalScore) > 0.5) {
          supportDetails.push({
            branch: pillar.branch,
            hidden_stem: hiddenStem,
            relation: relation,
            score: finalScore
          });
        }
      });
    });
    
    return {
      total_score: supportScore,
      details: supportDetails,
      level: supportScore > 3 ? '强' : supportScore > 0 ? '中' : supportScore > -3 ? '弱' : '很弱'
    };
  }
  
  // 天干支持度分析
  analyzeStemSupport(dayElement, pillars) {
    let supportScore = 0;
    const supportDetails = [];
    
    Object.entries(pillars).forEach(([position, pillar]) => {
      if (position === 'day') return; // 跳过日主本身
      
      const stemElement = this.getElementFromStem(pillar.stem);
      const relation = this.getElementRelation(stemElement, dayElement);
      
      let score = 0;
      if (relation === 'same') score = 2;
      else if (relation === 'beGenerated') score = 1.5;
      else if (relation === 'generate') score = -0.5;
      else if (relation === 'overcome') score = -1;
      else if (relation === 'beOvercome') score = -1.5;
      
      supportScore += score;
      if (Math.abs(score) > 0) {
        supportDetails.push({
          position: position,
          stem: pillar.stem,
          relation: relation,
          score: score
        });
      }
    });
    
    return {
      total_score: supportScore,
      details: supportDetails,
      level: supportScore > 2 ? '强' : supportScore > 0 ? '中' : supportScore > -2 ? '弱' : '很弱'
    };
  }
  
  // 综合旺衰计算
  calculateOverallStrength(monthStrength, hiddenSupport, stemSupport) {
    const monthScore = {
      '旺': 4, '相': 2, '休': 0, '囚': -2, '死': -3, '绝': -4, '墓': -1, '生': 1, '余气': 1
    }[monthStrength] || 0;
    
    const totalScore = monthScore + hiddenSupport.total_score + stemSupport.total_score;
    
    return {
      month_score: monthScore,
      hidden_score: hiddenSupport.total_score,
      stem_score: stemSupport.total_score,
      total_score: totalScore
    };
  }
  
  // 旺衰等级判断
  getStrengthLevel(overallStrength) {
    const score = overallStrength.total_score;
    if (score >= 6) return '太旺';
    if (score >= 3) return '偏旺';
    if (score >= -1) return '中和';
    if (score >= -4) return '偏弱';
    return '太弱';
  }
  
  // 用神分析
  analyzeUseGod(dayElement, strengthAnalysis, pillars) {
    const strengthLevel = this.getStrengthLevel(strengthAnalysis);
    let useGod = '';
    let avoidGod = '';
    let analysis = '';
    
    if (strengthLevel === '太旺' || strengthLevel === '偏旺') {
      // 身旺用官杀、食伤、财星
      const restrainElements = this.getRestrainElements(dayElement);
      const drainElements = this.getDrainElements(dayElement);
      const consumeElements = this.getConsumeElements(dayElement);
      
      useGod = `${restrainElements.join('、')}（官杀）、${drainElements.join('、')}（食伤）、${consumeElements.join('、')}（财星）`;
      avoidGod = `${dayElement}（比劫）、${this.getGenerateElements(dayElement).join('、')}（印星）`;
      analysis = `日主${dayElement}${strengthLevel}，需要克泄耗来平衡，宜用官杀制身、食伤泄秀、财星耗身。`;
    } else if (strengthLevel === '太弱' || strengthLevel === '偏弱') {
      // 身弱用印星、比劫
      const generateElements = this.getGenerateElements(dayElement);
      
      useGod = `${generateElements.join('、')}（印星）、${dayElement}（比劫）`;
      avoidGod = `${this.getRestrainElements(dayElement).join('、')}（官杀）、${this.getDrainElements(dayElement).join('、')}（食伤）、${this.getConsumeElements(dayElement).join('、')}（财星）`;
      analysis = `日主${dayElement}${strengthLevel}，需要生扶来增强，宜用印星生身、比劫助身。`;
    } else {
      // 中和命格
      useGod = '因时制宜，随运而变';
      avoidGod = '过旺过弱之五行';
      analysis = `日主${dayElement}中和，命格平衡，宜顺其自然，忌大起大落。`;
    }
    
    return {
      use_god: useGod,
      avoid_god: avoidGod,
      analysis: analysis,
      strength_level: strengthLevel
    };
  }
  
  // 获取克制元素
  getRestrainElements(element) {
    const restrainMap = {
      '木': ['金'],
      '火': ['水'],
      '土': ['木'],
      '金': ['火'],
      '水': ['土']
    };
    return restrainMap[element] || [];
  }
  
  // 获取泄秀元素
  getDrainElements(element) {
    const drainMap = {
      '木': ['火'],
      '火': ['土'],
      '土': ['金'],
      '金': ['水'],
      '水': ['木']
    };
    return drainMap[element] || [];
  }
  
  // 获取耗身元素
  getConsumeElements(element) {
    const consumeMap = {
      '木': ['土'],
      '火': ['金'],
      '土': ['水'],
      '金': ['木'],
      '水': ['火']
    };
    return consumeMap[element] || [];
  }
  
  // 获取生扶元素
  getGenerateElements(element) {
    const generateMap = {
      '木': ['水'],
      '火': ['木'],
      '土': ['火'],
      '金': ['土'],
      '水': ['金']
    };
    return generateMap[element] || [];
  }
  
  // 详细五行分析 - 基于真实旺衰
  performDetailedWuxingAnalysis(baziChart, gender, name) {
    const dayMaster = baziChart.day_master;
    const dayMasterElement = baziChart.day_master_element;
    const strengthAnalysis = baziChart.element_strength;

    // 统计五行分布（包含地支藏干）
    const elements = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
    const elementDetails = { '木': [], '火': [], '土': [], '金': [], '水': [] };
    
    // 统计天干
    ['year_pillar', 'month_pillar', 'day_pillar', 'hour_pillar'].forEach(pillar => {
      const stemElement = baziChart[pillar].element;
      elements[stemElement] += 2; // 天干力量较强
      elementDetails[stemElement].push(`${pillar.replace('_pillar', '')}干${baziChart[pillar].stem}`);
    });
    
    // 统计地支藏干
    ['year_pillar', 'month_pillar', 'day_pillar', 'hour_pillar'].forEach(pillar => {
      const hiddenStems = baziChart[pillar].hidden_stems;
      hiddenStems.forEach((hiddenStem, index) => {
        const hiddenElement = this.getElementFromStem(hiddenStem);
        const weight = index === 0 ? 1.5 : index === 1 ? 1.0 : 0.5; // 本气、中气、余气权重
        elements[hiddenElement] += weight;
        elementDetails[hiddenElement].push(`${pillar.replace('_pillar', '')}支藏${hiddenStem}`);
      });
    });

    // 生成个性化分析
    const genderTitle = gender === 'male' || gender === '男' ? '男命' : '女命';
    const strengthLevel = strengthAnalysis.strength_level;
    const useGodAnalysis = strengthAnalysis.use_god_analysis;
    
    const personalityTraits = this.generateAdvancedPersonalityTraits(dayMaster, strengthLevel, useGodAnalysis, gender);
    const balanceAnalysis = this.generateAdvancedBalanceAnalysis(elements, dayMasterElement, strengthAnalysis, name);
    const improvementSuggestions = this.generateAdvancedImprovementSuggestions(useGodAnalysis, strengthLevel, name, gender, baziChart);

    return {
      distribution: elements,
      element_details: elementDetails,
      detailed_analysis: `${name}的八字中，日主${dayMaster}(${dayMasterElement}元素)${strengthLevel}，${genderTitle}${dayMasterElement}命格。${useGodAnalysis.analysis}${balanceAnalysis}`,
      personality_traits: personalityTraits,
      improvement_suggestions: improvementSuggestions,
      strength_analysis: strengthAnalysis
    };
  }

  // 高级个性特质分析 - 基于旺衰和用神
  generateAdvancedPersonalityTraits(dayMaster, strengthLevel, useGodAnalysis, gender) {
    const baseDayMasterTraits = {
      '甲': {
        base: '如参天大树般正直挺拔，具有开拓进取的精神和天然的领导气质',
        strong: '性格刚强果断，具有很强的主导欲和控制欲，不轻易妥协',
        weak: '性格相对温和，善于合作，但有时缺乏决断力和主见'
      },
      '乙': {
        base: '如花草般柔韧而富有生命力，具有很强的适应能力和艺术天赋',
        strong: '个性坚韧不拔，善于在逆境中成长，具有很强的生命力',
        weak: '性格温柔细腻，但有时过于敏感，容易受外界影响'
      },
      '丙': {
        base: '如太阳般光明磊落，性格开朗热情，具有很强的感染力和表现欲',
        strong: '性格热情奔放，具有很强的表现欲和领导才能，但有时过于张扬',
        weak: '性格温和亲切，但有时缺乏自信，需要他人的认可和支持'
      },
      '丁': {
        base: '如星火般温暖细腻，思维敏锐，具有细致的观察力和创意能力',
        strong: '思维敏锐，洞察力强，具有很好的直觉和判断力',
        weak: '性格内向细腻，但有时过于敏感，容易多愁善感'
      },
      '戊': {
        base: '如高山般稳重厚实，具有很强的责任心和包容心，值得信赖',
        strong: '性格稳重可靠，具有很强的责任感，但有时过于固执',
        weak: '性格温和包容，但有时缺乏主见，容易被他人影响'
      },
      '己': {
        base: '如沃土般温和包容，具有很好的亲和力和协调能力，善于照顾他人',
        strong: '具有很强的包容心和协调能力，善于处理人际关系',
        weak: '性格温和谦逊，但有时过于迁就他人，缺乏自我主张'
      },
      '庚': {
        base: '如利剑般刚毅果断，具有很强的原则性和执行力，做事雷厉风行',
        strong: '性格刚毅果断，具有很强的原则性，但有时过于严厉',
        weak: '性格相对温和，但仍保持一定的原则性，善于变通'
      },
      '辛': {
        base: '如珠宝般精致优雅，注重品质和细节，具有很好的审美能力',
        strong: '追求完美，注重品质，具有很好的审美能力和品味',
        weak: '性格温和优雅，但有时过于追求完美，容易钻牛角尖'
      },
      '壬': {
        base: '如江河般胸怀宽广，具有很强的包容性和变通能力，智慧深邃',
        strong: '智慧深邃，变通能力强，具有很好的适应性',
        weak: '性格温和包容，但有时缺乏坚持，容易随波逐流'
      },
      '癸': {
        base: '如露水般纯净灵性，直觉敏锐，具有很强的感知能力和同情心',
        strong: '直觉敏锐，感知能力强，具有很好的洞察力',
        weak: '性格温柔敏感，但有时过于情绪化，容易受情感影响'
      }
    };

    const traits = baseDayMasterTraits[dayMaster] || {
      base: '性格温和平衡，具有良好的适应能力',
      strong: '性格相对稳定',
      weak: '性格相对温和'
    };

    let personalityDescription = traits.base;
    
    // 根据旺衰调整性格描述
    if (strengthLevel === '太旺' || strengthLevel === '偏旺') {
      personalityDescription += `。由于日主${strengthLevel}，${traits.strong}。`;
    } else if (strengthLevel === '太弱' || strengthLevel === '偏弱') {
      personalityDescription += `。由于日主${strengthLevel}，${traits.weak}。`;
    } else {
      personalityDescription += '。日主中和，性格相对平衡稳定。';
    }
    
    // 根据用神添加建议
    personalityDescription += `建议在生活中多接触${useGodAnalysis.use_god.split('（')[0]}相关的事物，有助于性格的完善和运势的提升。`;
    
    const genderModification = gender === 'male' || gender === '男' 
      ? '作为男性，建议发挥阳刚之气，承担更多责任' 
      : '作为女性，建议发挥阴柔之美，注重内在修养';
    
    return personalityDescription + genderModification + '。';
  }
  
  // 高级平衡分析 - 基于旺衰理论
  generateAdvancedBalanceAnalysis(elements, dayElement, strengthAnalysis, name) {
    const strengthLevel = strengthAnalysis.strength_level;
    const monthStrength = strengthAnalysis.month_strength;
    const useGodAnalysis = strengthAnalysis.use_god_analysis;
    
    let analysis = `月令${monthStrength}，`;
    
    if (strengthLevel === '太旺') {
      analysis += `日主过于强旺，需要克泄耗来平衡。命局中最需要${useGodAnalysis.use_god}来调节，避免${useGodAnalysis.avoid_god}进一步增强日主力量。`;
    } else if (strengthLevel === '偏旺') {
      analysis += `日主偏强，适度的克泄耗有利于发挥才能。建议重点关注${useGodAnalysis.use_god}相关的发展方向。`;
    } else if (strengthLevel === '中和') {
      analysis += `日主中和，五行相对平衡，是比较理想的命格。宜顺其自然发展，避免大的起伏变化。`;
    } else if (strengthLevel === '偏弱') {
      analysis += `日主偏弱，需要适当的生扶来增强力量。建议多接触${useGodAnalysis.use_god}相关的环境和事物。`;
    } else {
      analysis += `日主过弱，急需生扶来增强根基。必须重点加强${useGodAnalysis.use_god}方面的修养和环境。`;
    }
    
    return analysis;
  }
  
  // 高级个性化改进建议 - 基于具体八字组合的深度分析
  generateAdvancedImprovementSuggestions(useGodAnalysis, strengthLevel, name, gender, baziChart) {
    const suggestions = [];
    const dayMaster = baziChart.day_master;
    const dayMasterElement = baziChart.day_master_element;
    
    // 基于日主和用神的个性化建议
    const personalizedAdvice = this.generatePersonalizedAdvice(dayMaster, useGodAnalysis.use_god, strengthLevel, gender, name);
    suggestions.push(personalizedAdvice);
    
    // 基于四柱组合的综合建议
    const combinationAdvice = this.generateCombinationAdvice(baziChart, useGodAnalysis, name);
    suggestions.push(combinationAdvice);
    
    // 基于旺衰程度的精准建议
    const strengthAdvice = this.generateStrengthBasedAdvice(strengthLevel, dayMasterElement, name, gender);
    suggestions.push(strengthAdvice);
    
    return suggestions.join('；') + '。';
  }
  
  // 生成个性化建议
  generatePersonalizedAdvice(dayMaster, useGod, strengthLevel, gender, name) {
    const dayMasterAdvice = {
      '甲': `${name}，您的日主甲木如参天大树，${useGod.includes('水') ? '需要充足的水分滋养，建议多亲近水源，从事流动性行业' : useGod.includes('火') ? '需要阳光照耀，建议多接触阳光，发挥创造才能' : '需要土壤扎根，建议脚踏实地，稳步发展'}。性格上您天生具有领导气质，但要注意不可过于刚硬，学会柔中带刚。`,
      '乙': `${name}，您的日主乙木如柔韧花草，${useGod.includes('水') ? '需要细水长流的滋润，建议培养耐心，从事需要细致的工作' : useGod.includes('火') ? '需要温和阳光，建议保持乐观心态，发挥艺术天赋' : '需要肥沃土壤，建议注重积累，稳中求进'}。您天生温和善良，但要学会在适当时候展现坚韧。`,
      '丙': `${name}，您的日主丙火如太阳光辉，${useGod.includes('木') ? '需要木材助燃，建议多结交志同道合的朋友，团队合作' : useGod.includes('水') ? '需要水来调节，建议保持冷静理性，避免过于冲动' : '天生光明磊落，建议发挥正面影响力'}。您性格开朗热情，但要注意控制脾气，学会包容。`,
      '丁': `${name}，您的日主丁火如温暖烛光，${useGod.includes('木') ? '需要木材续燃，建议持续学习，不断充实自己' : useGod.includes('水') ? '需要适度调节，建议在热情与理性间找到平衡' : '天生温暖人心，建议从事服务他人的工作'}。您细腻敏感，善解人意，但要增强自信心。`,
      '戊': `${name}，您的日主戊土如高山大地，${useGod.includes('火') ? '需要阳光普照，建议积极向上，发挥稳重品格' : useGod.includes('金') ? '蕴含金矿，建议发掘自身潜力，从事实业' : '天生厚德载物，建议承担更多责任'}。您稳重可靠，但要避免过于固执，学会变通。`,
      '己': `${name}，您的日主己土如田园沃土，${useGod.includes('火') ? '需要温暖滋养，建议保持积极心态，培养人际关系' : useGod.includes('金') ? '能生金养金，建议从事金融或精密工作' : '天生包容性强，建议发挥协调能力'}。您温和包容，善于照顾他人，但要学会为自己争取。`,
      '庚': `${name}，您的日主庚金如刀剑钢铁，${useGod.includes('土') ? '需要土来生养，建议脚踏实地，积累实力' : useGod.includes('水') ? '需要水来淬炼，建议在挫折中成长，越挫越勇' : '天生意志坚强，建议从事需要决断的工作'}。您果断坚毅，但要学会柔和待人，刚柔并济。`,
      '辛': `${name}，您的日主辛金如珠宝美玉，${useGod.includes('土') ? '需要土来孕育，建议注重内在修养，提升品味' : useGod.includes('水') ? '需要水来洗练，建议保持纯净心灵，发挥艺术天赋' : '天生气质优雅，建议从事精美行业'}。您细腻优雅，品味高雅，但要增强执行力。`,
      '壬': `${name}，您的日主壬水如江河大海，${useGod.includes('金') ? '需要金来生源，建议结交贵人，借力发展' : useGod.includes('木') ? '能滋养万物，建议发挥智慧，帮助他人成长' : '天生智慧如海，建议从事智力密集型工作'}。您聪明灵活，适应力强，但要学会专注，避免三心二意。`,
      '癸': `${name}，您的日主癸水如甘露雨水，${useGod.includes('金') ? '需要金来生养，建议寻找可靠支持，稳步前进' : useGod.includes('木') ? '能润物无声，建议发挥细致特质，从事精细工作' : '天生纯净善良，建议保持初心'}。您温柔细腻，善于感化他人，但要增强自信和主见。`
    };
    
    return dayMasterAdvice[dayMaster] || `${name}，根据您的日主特质，建议发挥自身优势，补强不足之处。`;
  }
  
  // 生成组合建议
  generateCombinationAdvice(baziChart, useGodAnalysis, name) {
    const yearStem = baziChart.year_pillar.stem;
    const monthBranch = baziChart.month_pillar.branch;
    const dayStem = baziChart.day_master;
    const hourBranch = baziChart.hour_pillar.branch;
    
    // 分析年月日时的组合特征
    const seasonMap = {
      '寅': '春', '卯': '春', '辰': '春',
      '巳': '夏', '午': '夏', '未': '夏', 
      '申': '秋', '酉': '秋', '戌': '秋',
      '亥': '冬', '子': '冬', '丑': '冬'
    };
    
    const season = seasonMap[monthBranch];
    const timeMap = {
      '子': '深夜', '丑': '凌晨', '寅': '黎明', '卯': '清晨',
      '辰': '上午', '巳': '上午', '午': '正午', '未': '下午',
      '申': '下午', '酉': '傍晚', '戌': '黄昏', '亥': '夜晚'
    };
    
    const timeOfDay = timeMap[hourBranch];
    
    return `${name}，您生于${season}季${timeOfDay}时分，这个时空组合赋予了您独特的能量场。${season === '春' ? '春生者生机勃勃，适合创新发展' : season === '夏' ? '夏生者热情奔放，适合展现才华' : season === '秋' ? '秋生者收敛内敛，适合积累沉淀' : '冬生者深沉内敛，适合厚积薄发'}。${timeOfDay.includes('夜') || timeOfDay.includes('凌晨') ? '夜时出生者思维深邃，适合从事需要深度思考的工作' : '日时出生者阳光开朗，适合从事需要沟通交流的工作'}。`;
  }
  
  // 生成基于旺衰的建议
  generateStrengthBasedAdvice(strengthLevel, dayMasterElement, name, gender) {
    const strengthAdvice = {
      '太旺': `${name}，您的${dayMasterElement}行能量过于旺盛，建议适当收敛锋芒，学会低调行事。在人际交往中要多倾听他人意见，避免过于自我。${gender === 'male' || gender === '男' ? '作为男性，您天生具有强势特质，但要学会温和待人，刚柔并济' : '作为女性，您个性较强，建议在坚持原则的同时保持女性的温柔魅力'}。`,
      '偏旺': `${name}，您的${dayMasterElement}行能量较为旺盛，这是您的优势所在。建议充分发挥自身特长，但要注意团队合作，不可过于独断专行。${gender === 'male' || gender === '男' ? '男性的您适合担任领导角色，但要学会授权和信任他人' : '女性的您可以在事业上积极进取，同时保持内在的柔美'}。`,
      '中和': `${name}，您的${dayMasterElement}行能量平衡，这是非常难得的命格。建议保持现有的平衡状态，在各个方面都能稳步发展。${gender === 'male' || gender === '男' ? '男性的您性格温和理性，适合从事需要平衡协调的工作' : '女性的您内外兼修，能够很好地平衡事业与家庭'}。`,
      '偏弱': `${name}，您的${dayMasterElement}行能量略显不足，建议多寻求外界支持，加强自身修养。要学会借力发力，通过团队合作来实现目标。${gender === 'male' || gender === '男' ? '男性的您要增强自信心，多参与社交活动，扩大人脉圈' : '女性的您要发挥细腻优势，在细节中体现价值'}。`,
      '太弱': `${name}，您的${dayMasterElement}行能量较为薄弱，建议重点加强自身实力，多学习充电。要学会依靠贵人相助，选择合适的平台发展。${gender === 'male' || gender === '男' ? '男性的您要培养坚韧品格，在逆境中成长' : '女性的您要发挥柔韧特质，以柔克刚，以退为进'}。`
    };
    
    return strengthAdvice[strengthLevel] || `${name}，建议根据自身特点，扬长避短，稳步发展。`;
  }

  // 辅助函数实现
  getElementFromStem(stem) {
    const stemElements = {
      '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
      '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
    };
    return stemElements[stem] || '土';
  }

  getBranchElement(branch) {
    const branchElements = {
      '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
      '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
    };
    return branchElements[branch] || '土';
  }
  
  // 五行关系判断
  getElementRelation(element1, element2) {
    if (element1 === element2) return 'same';
    
    const generateCycle = {
      '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
    };
    
    const overcomeCycle = {
      '木': '土', '火': '金', '土': '水', '金': '木', '水': '火'
    };
    
    if (generateCycle[element1] === element2) return 'generate';
    if (overcomeCycle[element1] === element2) return 'overcome';
    if (generateCycle[element2] === element1) return 'beGenerated';
    if (overcomeCycle[element2] === element1) return 'beOvercome';
    
    return 'neutral';
  }

  getElementNatureDescription(element) {
    const descriptions = {
      '木': '生机勃勃、向上发展、具有创新精神',
      '火': '热情奔放、积极主动、具有领导才能',
      '土': '稳重踏实、包容宽厚、具有责任感',
      '金': '坚毅果断、追求完美、具有原则性',
      '水': '智慧灵活、适应性强、具有包容性'
    };
    return descriptions[element] || '平衡和谐';
  }

  getElementDetailedTraits(element) {
    const traits = {
      '木': '创新进取、生机勃勃',
      '火': '热情活跃、表现突出',
      '土': '稳重可靠、包容厚德',
      '金': '坚毅果断、追求卓越',
      '水': '智慧深邃、变通灵活'
    };
    return traits[element] || '平衡发展';
  }

  getElementMissingTraits(element) {
    const missing = {
      '木': '创新精神和成长动力',
      '火': '热情活力和表现能力',
      '土': '稳重品格和责任意识',
      '金': '决断力和原则性',
      '水': '智慧思考和灵活应变'
    };
    return missing[element] || '综合素质';
  }

  // 动态格局判定系统 - 基于十神和月令
  determineAccuratePattern(baziChart, gender, name) {
    const dayMaster = baziChart.day_master;
    const monthBranch = baziChart.month_order;
    const monthStem = baziChart.month_pillar.stem;
    const strengthAnalysis = baziChart.element_strength;
    
    // 1. 判断月令十神
    const monthTenGod = baziChart.month_pillar.ten_god;
    
    // 2. 分析月令藏干
    const monthHiddenStems = baziChart.month_pillar.hidden_stems;
    const monthMainGod = this.calculateTenGod(dayMaster, monthHiddenStems[0]);
    
    // 3. 格局判定
    let patternName = '';
    let patternType = '';
    let patternStrength = '';
    
    // 正格判定（以月令为准）
    if (['正官', '正财', '正印', '食神'].includes(monthMainGod)) {
      patternName = monthMainGod + '格';
      patternType = '正格';
    } else if (['七杀', '偏财', '偏印', '伤官'].includes(monthMainGod)) {
      patternName = monthMainGod + '格';
      patternType = '正格';
    } else if (['比肩', '劫财'].includes(monthMainGod)) {
      patternName = '建禄格';
      patternType = '正格';
    } else {
      // 特殊格局判定
      const specialPattern = this.analyzeSpecialPattern(baziChart);
      if (specialPattern) {
        patternName = specialPattern.name;
        patternType = specialPattern.type;
      } else {
        patternName = '杂气格';
        patternType = '正格';
      }
    }
    
    // 4. 格局强度评估
    patternStrength = this.evaluatePatternStrength(baziChart, patternName, strengthAnalysis);
    
    // 5. 生成详细特征
    const detailedTraits = this.generatePatternTraits(patternName, patternType, strengthAnalysis, gender, name);
    
    // 6. 适合职业分析
    const suitableCareers = this.generatePatternCareers(patternName, strengthAnalysis, gender);
    
    // 7. 人生哲学
    const philosophicalMeaning = this.generatePatternPhilosophy(patternName, patternType, strengthAnalysis);
    
    // 8. 行动计划
    const actionPlan = this.generatePatternActionPlan(patternName, strengthAnalysis, gender);
    
    return {
      pattern_name: patternName,
      pattern_type: patternType,
      strength: patternStrength,
      month_ten_god: monthMainGod,
      detailed_traits: detailedTraits,
      suitable_careers: suitableCareers,
      philosophical_meaning: philosophicalMeaning,
      action_plan: actionPlan,
      pattern_analysis: this.generatePatternAnalysis(patternName, baziChart, strengthAnalysis)
    };
  }
  
  // 特殊格局分析
  analyzeSpecialPattern(baziChart) {
    const dayMaster = baziChart.day_master;
    const strengthLevel = baziChart.element_strength.strength_level;
    
    // 从强格判定
    if (strengthLevel === '太旺') {
      const supportCount = this.countSameElementSupport(baziChart);
      if (supportCount >= 3) {
        return { name: '从强格', type: '特殊格局' };
      }
    }
    
    // 从弱格判定
    if (strengthLevel === '太弱') {
      const restrainCount = this.countRestrainElements(baziChart);
      if (restrainCount >= 3) {
        return { name: '从弱格', type: '特殊格局' };
      }
    }
    
    return null;
  }
  
  // 计算同类五行支持数量
  countSameElementSupport(baziChart) {
    const dayElement = baziChart.day_master_element;
    let count = 0;
    
    ['year_pillar', 'month_pillar', 'hour_pillar'].forEach(pillar => {
      if (baziChart[pillar].element === dayElement) count++;
      baziChart[pillar].hidden_stems.forEach(hiddenStem => {
        if (this.getElementFromStem(hiddenStem) === dayElement) count++;
      });
    });
    
    return count;
  }
  
  // 计算克制元素数量
  countRestrainElements(baziChart) {
    const dayElement = baziChart.day_master_element;
    const restrainElements = this.getRestrainElements(dayElement);
    let count = 0;
    
    ['year_pillar', 'month_pillar', 'hour_pillar'].forEach(pillar => {
      if (restrainElements.includes(baziChart[pillar].element)) count++;
      baziChart[pillar].hidden_stems.forEach(hiddenStem => {
        if (restrainElements.includes(this.getElementFromStem(hiddenStem))) count++;
      });
    });
    
    return count;
  }
  
  // 格局强度评估
  evaluatePatternStrength(baziChart, patternName, strengthAnalysis) {
    const strengthLevel = strengthAnalysis.strength_level;
    const monthStrength = strengthAnalysis.month_strength;
    
    if (patternName.includes('从')) {
      // 特殊格局强度
      return strengthLevel === '太旺' || strengthLevel === '太弱' ? '上等' : '中等';
    } else {
      // 正格强度
      if (monthStrength === '旺' && (strengthLevel === '中和' || strengthLevel === '偏旺')) {
        return '上等';
      } else if (monthStrength === '相' || monthStrength === '生') {
        return '中上';
      } else if (monthStrength === '休' || monthStrength === '余气') {
        return '中等';
      } else {
        return '偏弱';
      }
    }
  }
  
  // 生成格局特征
  generatePatternTraits(patternName, patternType, strengthAnalysis, gender, name) {
    const patternTraits = {
      '正官格': `${name}具有正官格特征，性格正直有原则，具有很强的责任感和正义感，适合在正统行业发展`,
      '七杀格': `${name}具有七杀格特征，性格刚毅果断，具有很强的开拓精神和竞争意识，适合在竞争激烈的环境中发展`,
      '正财格': `${name}具有正财格特征，性格务实稳重，具有很好的理财能力和商业头脑，适合从事财务相关工作`,
      '偏财格': `${name}具有偏财格特征，性格灵活变通，具有很好的投资眼光和商业敏感度，适合从事投资贸易`,
      '正印格': `${name}具有正印格特征，性格温和慈祥，具有很强的学习能力和文化修养，适合从事教育文化工作`,
      '偏印格': `${name}具有偏印格特征，性格独特敏锐，具有很强的直觉和创新能力，适合从事技术研发工作`,
      '食神格': `${name}具有食神格特征，性格温和乐观，具有很好的表达能力和艺术天赋，适合从事文艺创作`,
      '伤官格': `${name}具有伤官格特征，性格聪明机敏，具有很强的表现欲和创新精神，适合从事创意设计`,
      '建禄格': `${name}具有建禄格特征，性格自立自强，具有很强的独立能力和进取精神，适合自主创业`,
      '从强格': `${name}具有从强格特征，性格强势主导，具有很强的领导能力，但需要学会适度收敛`,
      '从弱格': `${name}具有从弱格特征，性格随和适应，具有很好的协调能力，适合在团队中发挥作用`
    };
    
    const baseTraits = patternTraits[patternName] || `${name}具有${patternName}特征，性格相对平衡`;
    const strengthModification = strengthAnalysis.strength_level === '中和' 
      ? '，命格平衡，发展稳定' 
      : `，日主${strengthAnalysis.strength_level}，${strengthAnalysis.use_god_analysis.analysis}`;
    
    return baseTraits + strengthModification;
  }
  
  // 生成格局适合职业
  generatePatternCareers(patternName, strengthAnalysis, gender) {
    const careerMap = {
      '正官格': '公务员、法官、律师、管理人员、教师、医生等正统职业',
      '七杀格': '军人、警察、企业家、销售经理、竞技体育、外科医生等需要果断的职业',
      '正财格': '会计师、银行家、理财顾问、商人、房地产经纪等财务相关职业',
      '偏财格': '投资顾问、贸易商、股票经纪、风险投资、国际贸易等灵活性强的职业',
      '正印格': '教师、学者、作家、编辑、图书管理员、文化工作者等文教职业',
      '偏印格': '研究员、工程师、设计师、心理咨询师、占卜师等技术性职业',
      '食神格': '厨师、艺术家、演员、主持人、美食评论家、娱乐业等表现性职业',
      '伤官格': '设计师、广告创意、发明家、自媒体、艺术创作等创新性职业',
      '建禄格': '企业家、个体经营、自由职业、项目经理等独立性强的职业',
      '从强格': '企业高管、政治家、军事将领等需要强势领导的职业',
      '从弱格': '助理、秘书、服务业、协调员等需要配合他人的职业'
    };
    
    const baseCareers = careerMap[patternName] || '根据个人兴趣和能力选择合适的职业';
    const genderModification = gender === 'male' || gender === '男' 
      ? '，作为男性宜选择更具挑战性和领导性的岗位' 
      : '，作为女性宜选择更注重细致和协调的岗位';
    
    return baseCareers + genderModification;
  }
  
  // 生成格局哲学意义
  generatePatternPhilosophy(patternName, patternType, strengthAnalysis) {
    const philosophyMap = {
      '正官格': '人生以正道为本，遵纪守法，稳步发展，追求社会认可和地位',
      '七杀格': '人生充满挑战，需要勇敢面对，在竞争中成长，追求突破和成就',
      '正财格': '人生以务实为本，脚踏实地，积累财富，追求物质安全和稳定',
      '偏财格': '人生机遇多变，需要把握时机，灵活应变，追求财富和自由',
      '正印格': '人生以学习为本，注重修养，传承文化，追求智慧和品德',
      '偏印格': '人生独特多彩，需要创新思维，另辟蹊径，追求个性和突破',
      '食神格': '人生以快乐为本，享受生活，表达自我，追求艺术和美好',
      '伤官格': '人生以创新为本，挑战传统，表现才华，追求个性和成就',
      '建禄格': '人生以自立为本，依靠自己，独立奋斗，追求自主和成功',
      '从强格': '人生以强势为本，发挥优势，主导局面，但需要学会包容',
      '从弱格': '人生以顺应为本，适应环境，借力发展，追求和谐共赢'
    };
    
    return philosophyMap[patternName] || '人生需要平衡发展，顺应自然规律';
  }
  
  // 生成格局行动计划
  generatePatternActionPlan(patternName, strengthAnalysis, gender) {
    const useGodAnalysis = strengthAnalysis.use_god_analysis;
    const strengthLevel = strengthAnalysis.strength_level;
    
    let actionPlan = '';
    
    if (strengthLevel === '太旺' || strengthLevel === '偏旺') {
      actionPlan = '建议多参与团队合作，发挥领导才能，同时要学会倾听他人意见，避免过于强势';
    } else if (strengthLevel === '太弱' || strengthLevel === '偏弱') {
      actionPlan = '建议多寻求贵人帮助，加强自身修养，提升内在实力，逐步建立自信';
    } else {
      actionPlan = '建议保持现有的平衡状态，稳步发展，避免大的变动';
    }
    
    actionPlan += `。在五行调理方面，${useGodAnalysis.analysis.replace('日主', '').replace('，', '，建议')}`;
    
    const genderPlan = gender === 'male' || gender === '男' 
      ? '作为男性，要承担更多责任，发挥阳刚之气' 
      : '作为女性，要注重内在修养，发挥阴柔之美';
    
    return actionPlan + '。' + genderPlan + '。';
  }
  
  // 生成格局分析
  generatePatternAnalysis(patternName, baziChart, strengthAnalysis) {
    const monthTenGod = baziChart.month_pillar.ten_god;
    const monthStrength = strengthAnalysis.month_strength;
    const strengthLevel = strengthAnalysis.strength_level;
    
    return `格局分析：月令${baziChart.month_order}，藏干主气为${baziChart.month_pillar.hidden_stems[0]}，与日主${baziChart.day_master}形成${monthTenGod}关系，故为${patternName}。月令${monthStrength}，日主${strengthLevel}，${strengthAnalysis.use_god_analysis.analysis}`;
  }

  // 精确大运流年分析 - 基于传统起运法
  calculatePreciseFortune(baziChart, birth_date, gender, name) {
    const birthDate = new Date(birth_date);
    const currentYear = new Date().getFullYear();
    const currentAge = currentYear - birthDate.getFullYear();
    
    // 1. 计算起运时间
    const startLuckAge = this.calculateStartLuckAge(baziChart, birthDate, gender);
    
    // 2. 推算大运干支
    const dayunSequence = this.calculateDayunSequence(baziChart, gender, startLuckAge);
    
    // 3. 确定当前大运
    const currentDayun = this.getCurrentDayun(dayunSequence, currentAge);
    
    // 4. 分析当前流年
    const currentYearAnalysis = this.analyzeCurrentYear(baziChart, currentYear, currentDayun);
    
    // 5. 未来十年预测
    const nextDecadeForecast = this.generateDecadeForecast(baziChart, dayunSequence, currentAge);
    
    // 6. 详细流年分析
    const detailedYearlyAnalysis = this.generateDetailedYearlyAnalysis(baziChart, currentDayun, currentYear, currentAge);
    
    return {
      current_age: currentAge,
      start_luck_age: startLuckAge,
      current_period: currentDayun ? `${currentDayun.start_age}-${currentDayun.end_age}岁 ${currentDayun.stem}${currentDayun.branch}大运` : '未起运',
      current_dayun: currentDayun,
      life_periods: dayunSequence,
      current_year_analysis: currentYearAnalysis,
      next_decade_forecast: nextDecadeForecast,
      dayun_analysis: this.analyzeDayunInfluence(baziChart, currentDayun),
      detailed_yearly_analysis: detailedYearlyAnalysis
    };
  }

  // 异步版本的精准大运流年分析（优化性能）
  async calculatePreciseFortuneAsync(baziChart, birth_date, gender, name) {
    const birthDate = new Date(birth_date);
    const currentYear = new Date().getFullYear();
    const currentAge = currentYear - birthDate.getFullYear();
    
    // 并行计算各个组件
    const [startLuckAge, dayunSequence] = await Promise.all([
      Promise.resolve(this.calculateStartLuckAge(baziChart, birthDate, gender)),
      Promise.resolve(this.calculateDayunSequence(baziChart, gender, 0)) // 临时起运年龄
    ]);
    
    // 重新计算正确的大运序列
    const correctDayunSequence = this.calculateDayunSequence(baziChart, gender, startLuckAge);
    
    // 确定当前大运
    const currentDayun = this.getCurrentDayun(correctDayunSequence, currentAge);
    
    // 并行计算分析结果
    const [currentYearAnalysis, nextDecadeForecast, detailedYearlyAnalysis] = await Promise.all([
      new Promise(resolve => {
        setTimeout(() => {
          resolve(this.analyzeCurrentYear(baziChart, currentYear, currentDayun));
        }, 0);
      }),
      new Promise(resolve => {
        setTimeout(() => {
          resolve(this.generateDecadeForecast(baziChart, correctDayunSequence, currentAge));
        }, 0);
      }),
      new Promise(resolve => {
        setTimeout(() => {
          resolve(this.generateDetailedYearlyAnalysis(baziChart, currentDayun, currentYear, currentAge));
        }, 0);
      })
    ]);
    
    return {
      current_age: currentAge,
      start_luck_age: startLuckAge,
      current_period: currentDayun ? `${currentDayun.start_age}-${currentDayun.end_age}岁 ${currentDayun.stem}${currentDayun.branch}大运` : '未起运',
      current_dayun: currentDayun,
      life_periods: correctDayunSequence,
      current_year_analysis: currentYearAnalysis,
      next_decade_forecast: nextDecadeForecast,
      dayun_analysis: this.analyzeDayunInfluence(baziChart, currentDayun),
      detailed_yearly_analysis: detailedYearlyAnalysis
    };
  }

  // 计算起运年龄
  calculateStartLuckAge(baziChart, birthDate, gender) {
    const birthYear = birthDate.getFullYear();
    const birthMonth = birthDate.getMonth() + 1;
    const birthDay = birthDate.getDate();
    
    // 判断阳年阴年
    const yearStemIndex = this.baseData.getStemIndex(baziChart.year_pillar.stem);
    const isYangYear = yearStemIndex % 2 === 0;
    
    // 男命阳年、女命阴年顺行，男命阴年、女命阳年逆行
    const isMale = gender === 'male' || gender === '男';
    const isForward = (isMale && isYangYear) || (!isMale && !isYangYear);
    
    // 计算到下一个节气的天数（简化计算）
    let daysToNextTerm = 0;
    if (isForward) {
      // 顺行：计算到下一个节气的天数
      daysToNextTerm = this.calculateDaysToNextTerm(birthMonth, birthDay);
    } else {
      // 逆行：计算到上一个节气的天数
      daysToNextTerm = this.calculateDaysToPrevTerm(birthMonth, birthDay);
    }
    
    // 三天折一年
    const startAge = Math.floor(daysToNextTerm / 3);
    return Math.max(1, startAge); // 最少1岁起运
  }
  
  // 计算到下一个节气的天数（简化）
  calculateDaysToNextTerm(month, day) {
    const termDays = {
      1: 4, 2: 19, 3: 6, 4: 21, 5: 5, 6: 21,
      7: 6, 8: 21, 9: 6, 10: 22, 11: 7, 12: 23
    };
    
    const nextTermDay = termDays[month] || 15;
    if (day < nextTermDay) {
      return nextTermDay - day;
    } else {
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextMonthTermDay = termDays[nextMonth] || 15;
      const daysInMonth = new Date(2024, month, 0).getDate();
      return (daysInMonth - day) + nextMonthTermDay;
    }
  }
  
  // 计算到上一个节气的天数（简化）
  calculateDaysToPrevTerm(month, day) {
    const termDays = {
      1: 4, 2: 19, 3: 6, 4: 21, 5: 5, 6: 21,
      7: 6, 8: 21, 9: 6, 10: 22, 11: 7, 12: 23
    };
    
    const currentTermDay = termDays[month] || 15;
    if (day > currentTermDay) {
      return day - currentTermDay;
    } else {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevTermDay = termDays[prevMonth] || 15;
      return day + (30 - prevTermDay); // 简化计算
    }
  }
  
  // 推算大运干支序列
  calculateDayunSequence(baziChart, gender, startAge) {
    const monthStemIndex = this.baseData.getStemIndex(baziChart.month_pillar.stem);
    const monthBranchIndex = this.baseData.getBranchIndex(baziChart.month_pillar.branch);
    
    // 判断顺逆
    const yearStemIndex = this.baseData.getStemIndex(baziChart.year_pillar.stem);
    const isYangYear = yearStemIndex % 2 === 0;
    const isMale = gender === 'male' || gender === '男';
    const isForward = (isMale && isYangYear) || (!isMale && !isYangYear);
    
    const dayunSequence = [];
    
    for (let i = 0; i < 8; i++) { // 计算8步大运
      let stemIndex, branchIndex;
      
      if (isForward) {
        stemIndex = (monthStemIndex + i + 1) % 10;
        branchIndex = (monthBranchIndex + i + 1) % 12;
      } else {
        stemIndex = (monthStemIndex - i - 1 + 10) % 10;
        branchIndex = (monthBranchIndex - i - 1 + 12) % 12;
      }
      
      const startAgeForThisDayun = startAge + i * 10;
      const endAgeForThisDayun = startAgeForThisDayun + 9;
      
      const dayunStem = this.baseData.getStemByIndex(stemIndex);
      const dayunBranch = this.baseData.getBranchByIndex(branchIndex);
      const dayunElement = this.getElementFromStem(dayunStem);
      const dayunTenGod = this.calculateTenGod(baziChart.day_master, dayunStem);
      
      dayunSequence.push({
        period: i + 1,
        start_age: startAgeForThisDayun,
        end_age: endAgeForThisDayun,
        stem: dayunStem,
        branch: dayunBranch,
        element: dayunElement,
        ten_god: dayunTenGod,
        ganzhi: `${dayunStem}${dayunBranch}`,
        analysis: this.analyzeDayunPeriod(baziChart, dayunStem, dayunBranch, dayunTenGod)
      });
    }
    
    return dayunSequence;
  }
  
  // 确定当前大运
  getCurrentDayun(dayunSequence, currentAge) {
    return dayunSequence.find(dayun => 
      currentAge >= dayun.start_age && currentAge <= dayun.end_age
    ) || null;
  }
  
  // 分析大运时期特征
  analyzeDayunPeriod(baziChart, dayunStem, dayunBranch, dayunTenGod) {
    const dayElement = baziChart.day_master_element;
    const dayunElement = this.getElementFromStem(dayunStem);
    const relation = this.getElementRelation(dayunElement, dayElement);
    const strengthAnalysis = baziChart.element_strength;
    
    let analysis = '';
    
    // 基于十神分析大运特征
    const tenGodAnalysis = {
      '比肩': '此运期适合合作发展，朋友助力较多，但要注意财务管理',
      '劫财': '此运期竞争激烈，需要谨慎理财，避免因朋友破财',
      '食神': '此运期创意丰富，适合艺术创作，身体健康，子女运佳',
      '伤官': '此运期才华横溢，适合创新突破，但要注意言行谨慎',
      '正财': '此运期财运稳定，适合投资理财，感情婚姻顺利',
      '偏财': '此运期财运机会多，适合投机投资，但要控制风险',
      '正官': '此运期事业发展，适合求职升迁，社会地位提升',
      '七杀': '此运期挑战较多，需要勇敢面对，适合开拓新领域',
      '正印': '此运期学习运佳，适合进修深造，贵人相助较多',
      '偏印': '此运期思维敏锐，适合技术研发，但要注意健康'
    };
    
    analysis = tenGodAnalysis[dayunTenGod] || '此运期需要根据具体情况灵活应对';
    
    // 结合日主旺衰调整分析
    const strengthLevel = strengthAnalysis.strength_level;
    if (strengthLevel === '偏弱' || strengthLevel === '太弱') {
      if (['比肩', '劫财', '正印', '偏印'].includes(dayunTenGod)) {
        analysis += '，此运对您特别有利，能够增强个人实力';
      } else if (['正官', '七杀', '食神', '伤官'].includes(dayunTenGod)) {
        analysis += '，此运压力较大，需要谨慎应对，多寻求帮助';
      }
    } else if (strengthLevel === '偏旺' || strengthLevel === '太旺') {
      if (['正官', '七杀', '食神', '伤官', '正财', '偏财'].includes(dayunTenGod)) {
        analysis += '，此运能够很好地发挥您的才能，适合积极进取';
      } else if (['比肩', '劫财', '正印', '偏印'].includes(dayunTenGod)) {
        analysis += '，此运可能过于强势，需要学会收敛和包容';
      }
    }
    
    return analysis;
  }
  
  // 分析当前流年
  analyzeCurrentYear(baziChart, currentYear, currentDayun) {
    const yearStemIndex = (currentYear - 4) % 10;
    const yearBranchIndex = (currentYear - 4) % 12;
    const yearStem = this.baseData.getStemByIndex(yearStemIndex);
    const yearBranch = this.baseData.getBranchByIndex(yearBranchIndex);
    const yearTenGod = this.calculateTenGod(baziChart.day_master, yearStem);
    
    let analysis = `${currentYear}年${yearStem}${yearBranch}，流年十神为${yearTenGod}。`;
    
    // 流年与大运的关系
    if (currentDayun) {
      const dayunYearRelation = this.getElementRelation(
        this.getElementFromStem(yearStem),
        this.getElementFromStem(currentDayun.stem)
      );
      
      if (dayunYearRelation === 'same') {
        analysis += '流年与大运同气，运势较为稳定。';
      } else if (dayunYearRelation === 'generate') {
        analysis += '流年生大运，有贵人相助，运势向好。';
      } else if (dayunYearRelation === 'overcome') {
        analysis += '流年克大运，需要谨慎应对，避免冲动。';
      } else if (dayunYearRelation === 'beGenerated') {
        analysis += '大运生流年，付出较多，但有收获。';
      } else if (dayunYearRelation === 'beOvercome') {
        analysis += '大运克流年，压力较大，需要坚持。';
      }
    }
    
    // 基于流年十神的具体建议
    const yearAdvice = {
      '比肩': '适合合作发展，朋友运佳，但要注意理财',
      '劫财': '竞争激烈，需要谨慎投资，避免借贷',
      '食神': '创意丰富，身体健康，适合艺术创作',
      '伤官': '才华横溢，但要注意言行，避免口舌是非',
      '正财': '财运稳定，适合投资，感情顺利',
      '偏财': '财运机会多，但要控制风险，避免投机',
      '正官': '事业运佳，适合求职升迁，社会地位提升',
      '七杀': '挑战较多，需要勇敢面对，适合开拓',
      '正印': '学习运佳，贵人相助，适合进修',
      '偏印': '思维敏锐，适合研发，但要注意健康'
    };
    
    analysis += yearAdvice[yearTenGod] || '需要根据具体情况灵活应对';
    
    return analysis;
  }
  
  // 生成未来十年预测
  generateDecadeForecast(baziChart, dayunSequence, currentAge) {
    const nextDecade = dayunSequence.filter(dayun => 
      dayun.start_age > currentAge && dayun.start_age <= currentAge + 10
    );
    
    if (nextDecade.length === 0) {
      return '未来十年继续当前大运的影响，建议保持稳定发展。';
    }
    
    let forecast = '未来十年运势展望：';
    
    nextDecade.forEach(dayun => {
      forecast += `${dayun.start_age}-${dayun.end_age}岁${dayun.ganzhi}运，${dayun.analysis}。`;
    });
    
    return forecast;
  }
  
  // 分析大运对命局的影响
  analyzeDayunInfluence(baziChart, currentDayun) {
    if (!currentDayun) {
      return '尚未起运，以原局为主。';
    }
    
    const dayElement = baziChart.day_master_element;
    const dayunElement = this.getElementFromStem(currentDayun.stem);
    const dayunBranchElement = this.getBranchElement(currentDayun.branch);
    const strengthAnalysis = baziChart.element_strength;
    
    let influence = `当前${currentDayun.ganzhi}大运，天干${currentDayun.stem}为${currentDayun.ten_god}，`;
    
    // 分析大运对日主的影响
    const stemRelation = this.getElementRelation(dayunElement, dayElement);
    const branchRelation = this.getElementRelation(dayunBranchElement, dayElement);
    
    if (stemRelation === 'same' || stemRelation === 'beGenerated') {
      influence += '天干有利于日主，';
    } else if (stemRelation === 'overcome' || stemRelation === 'beOvercome') {
      influence += '天干对日主有制约，';
    }
    
    if (branchRelation === 'same' || branchRelation === 'beGenerated') {
      influence += '地支有利于日主。';
    } else if (branchRelation === 'overcome' || branchRelation === 'beOvercome') {
      influence += '地支对日主有制约。';
    }
    
    // 结合原局旺衰给出建议
    const strengthLevel = strengthAnalysis.strength_level;
    if (strengthLevel === '偏弱' || strengthLevel === '太弱') {
      if (stemRelation === 'same' || stemRelation === 'beGenerated') {
        influence += '此运有助于增强实力，宜积极进取。';
      } else {
        influence += '此运压力较大，宜谨慎保守，寻求帮助。';
      }
    } else if (strengthLevel === '偏旺' || strengthLevel === '太旺') {
      if (stemRelation === 'overcome' || stemRelation === 'generate') {
        influence += '此运有助于发挥才能，宜主动出击。';
      } else {
        influence += '此运可能过于强势，宜学会收敛。';
      }
    }
    
    return influence;
  }

  generateComprehensiveLifeGuidance(baziChart, patternAnalysis, wuxingAnalysis, gender, name) {
    return {
      comprehensive_summary: `${name}，根据您的八字分析，您具有良好的命理基础，建议充分发挥自身优势`,
      career_guidance: '在事业发展方面，建议选择稳定发展的行业，注重积累经验',
      wealth_guidance: '在财富管理方面，建议稳健投资，避免投机',
      relationship_guidance: '在感情关系方面，建议真诚待人，重视家庭和谐',
      health_guidance: '在健康养生方面，建议规律作息，适度运动',
      self_improvement: '在个人修养方面，建议多读书学习，提升内在品质'
    };
  }

  generateModernApplications(baziChart, patternAnalysis, gender, name) {
    const dayMaster = baziChart.day_master;
    const dayMasterElement = baziChart.day_master_element;
    const strengthLevel = baziChart.element_strength?.strength_level || '中和';
    const monthBranch = baziChart.month_pillar.branch;
    
    return {
      daily_life: this.generateDailyLifeAdvice(dayMaster, dayMasterElement, strengthLevel, gender, name),
      professional_development: this.generateProfessionalAdvice(baziChart, patternAnalysis, gender, name),
      interpersonal_skills: this.generateInterpersonalAdvice(dayMaster, strengthLevel, gender, name),
      timing_guidance: this.generateTimingAdvice(monthBranch, dayMasterElement, name),
      digital_age_advice: this.generateDigitalAgeAdvice(dayMaster, dayMasterElement, gender, name),
      investment_guidance: this.generateInvestmentAdvice(baziChart, strengthLevel, name),
      health_optimization: this.generateHealthOptimization(dayMasterElement, strengthLevel, gender, name)
    };
  }
  
  // 生成日常生活建议
  generateDailyLifeAdvice(dayMaster, dayMasterElement, strengthLevel, gender, name) {
    const elementAdvice = {
      '木': `${name}，您的${dayMasterElement}命适合早起，建议6-7点起床，多接触绿色植物。居住环境宜朝东，房间多放置木质家具和绿植。饮食上多吃蔬菜水果，少吃辛辣食物。`,
      '火': `${name}，您的${dayMasterElement}命适合阳光充足的环境，建议多进行户外活动。居住环境宜朝南，房间色调以红色、橙色为主。饮食上可适当吃辣，但要注意降火。`,
      '土': `${name}，您的${dayMasterElement}命适合稳定规律的生活，建议固定作息时间。居住环境宜选择地势平坦的地方，房间色调以黄色、棕色为主。饮食上注重营养均衡。`,
      '金': `${name}，您的${dayMasterElement}命适合整洁有序的环境，建议保持房间清洁。居住环境宜朝西，房间多用白色、银色装饰。饮食上多吃白色食物，如白萝卜、梨等。`,
      '水': `${name}，您的${dayMasterElement}命适合临水而居，建议多喝水，常洗澡。居住环境宜朝北或临水，房间色调以蓝色、黑色为主。饮食上多吃海鲜、黑色食物。`
    };
    
    let advice = elementAdvice[dayMasterElement] || `${name}，建议保持规律的生活作息。`;
    
    if (strengthLevel === '太旺' || strengthLevel === '偏旺') {
      advice += '由于您能量较旺，建议适当进行冥想或瑜伽来平衡内心，避免过度兴奋。';
    } else if (strengthLevel === '太弱' || strengthLevel === '偏弱') {
      advice += '由于您能量较弱，建议多进行适度运动来增强体质，保持积极心态。';
    }
    
    return advice;
  }
  
  // 生成职业发展建议
  generateProfessionalAdvice(baziChart, patternAnalysis, gender, name) {
    const dayMaster = baziChart.day_master;
    const dayMasterElement = baziChart.day_master_element;
    const strengthLevel = baziChart.element_strength?.strength_level || '中和';
    
    const careerAdvice = {
      '甲': `${name}，您的甲木特质适合领导管理类工作，如企业高管、项目经理、教育管理等。建议发挥您的组织协调能力，在团队中担任核心角色。`,
      '乙': `${name}，您的乙木特质适合创意设计类工作，如平面设计、园艺、文案策划等。建议发挥您的艺术天赋和细腻感知力。`,
      '丙': `${name}，您的丙火特质适合公众服务类工作，如销售、演讲、媒体、公关等。建议发挥您的感染力和表现力。`,
      '丁': `${name}，您的丁火特质适合精细服务类工作，如咨询、培训、医疗、美容等。建议发挥您的耐心和专业技能。`,
      '戊': `${name}，您的戊土特质适合实业建设类工作，如建筑、房地产、制造业等。建议发挥您的稳重和执行力。`,
      '己': `${name}，您的己土特质适合服务协调类工作，如人力资源、客服、行政管理等。建议发挥您的亲和力和协调能力。`,
      '庚': `${name}，您的庚金特质适合技术专业类工作，如工程师、医生、律师等。建议发挥您的专业技能和决断力。`,
      '辛': `${name}，您的辛金特质适合精品服务类工作，如珠宝、奢侈品、高端服务等。建议发挥您的品味和细致。`,
      '壬': `${name}，您的壬水特质适合流通贸易类工作，如国际贸易、物流、金融等。建议发挥您的灵活性和适应力。`,
      '癸': `${name}，您的癸水特质适合研究分析类工作，如科研、数据分析、心理咨询等。建议发挥您的洞察力和专注力。`
    };
    
    let advice = careerAdvice[dayMaster] || `${name}，建议根据自身特长选择合适的职业方向。`;
    
    if (strengthLevel === '太旺' || strengthLevel === '偏旺') {
      advice += '您适合担任领导职务，但要学会授权和团队合作。';
    } else if (strengthLevel === '太弱' || strengthLevel === '偏弱') {
      advice += '建议先从基础岗位做起，通过不断学习提升来获得发展机会。';
    }
    
    return advice;
  }
  
  // 生成人际交往建议
  generateInterpersonalAdvice(dayMaster, strengthLevel, gender, name) {
    const interpersonalStyles = {
      '甲': `${name}，您天生具有领导魅力，在人际交往中要注意倾听他人意见，避免过于强势。建议多参与团队活动，发挥组织协调作用。`,
      '乙': `${name}，您性格温和亲切，容易获得他人好感。建议在保持温和的同时，适当表达自己的观点和立场。`,
      '丙': `${name}，您热情开朗，善于活跃气氛。建议在社交中保持真诚，避免过于张扬，学会照顾内向朋友的感受。`,
      '丁': `${name}，您细腻体贴，善于察言观色。建议主动表达关心，但要避免过度敏感，学会保护自己的情绪。`,
      '戊': `${name}，您稳重可靠，是朋友们的依靠。建议在提供帮助的同时，也要学会寻求他人的支持。`,
      '己': `${name}，您包容性强，善于调解矛盾。建议在帮助他人的同时，也要为自己的利益考虑。`,
      '庚': `${name}，您直率坦诚，但有时过于直接。建议在表达观点时注意方式方法，学会委婉表达。`,
      '辛': `${name}，您优雅细致，注重品质。建议在追求完美的同时，也要包容他人的不完美。`,
      '壬': `${name}，您聪明灵活，善于变通。建议在灵活应对的同时，保持一定的原则和底线。`,
      '癸': `${name}，您温柔敏感，善解人意。建议增强自信心，在关心他人的同时也要关爱自己。`
    };
    
    let advice = interpersonalStyles[dayMaster] || `${name}，建议在人际交往中保持真诚和善意。`;
    
    if (strengthLevel === '太旺' || strengthLevel === '偏旺') {
      advice += '您个性较强，要学会换位思考，多理解他人的立场。';
    } else if (strengthLevel === '太弱' || strengthLevel === '偏弱') {
      advice += '建议增强自信心，勇于表达自己的想法和需求。';
    }
    
    return advice;
  }
  
  // 生成时机把握建议
  generateTimingAdvice(monthBranch, dayMasterElement, name) {
    const seasonMap = {
      '寅': '春', '卯': '春', '辰': '春',
      '巳': '夏', '午': '夏', '未': '夏',
      '申': '秋', '酉': '秋', '戌': '秋',
      '亥': '冬', '子': '冬', '丑': '冬'
    };
    
    const birthSeason = seasonMap[monthBranch];
    
    const seasonAdvice = {
      '春': `${name}，您出生在春季，天生具有生发之气。建议在春季（2-4月）进行重要决策和新项目启动，这是您的幸运季节。`,
      '夏': `${name}，您出生在夏季，天生具有旺盛之气。建议在夏季（5-7月）展现才华和推进事业，这是您的能量高峰期。`,
      '秋': `${name}，您出生在秋季，天生具有收获之气。建议在秋季（8-10月）进行总结和收获，这是您的成果展现期。`,
      '冬': `${name}，您出生在冬季，天生具有储藏之气。建议在冬季（11-1月）进行规划和学习，这是您的积累充电期。`
    };
    
    let advice = seasonAdvice[birthSeason] || `${name}，建议根据季节变化调整工作节奏。`;
    
    // 根据五行元素添加具体时机建议
    const elementTiming = {
      '木': '每日6-10点是您的最佳工作时间，适合处理重要事务。',
      '火': '每日10-14点是您的最佳工作时间，适合展示和表现。',
      '土': '每日14-18点是您的最佳工作时间，适合稳定和执行。',
      '金': '每日18-22点是您的最佳工作时间，适合分析和决策。',
      '水': '每日22-2点是您的最佳思考时间，适合规划和创意。'
    };
    
    advice += elementTiming[dayMasterElement] || '';
    
    return advice;
  }
  
  // 生成数字时代建议
  generateDigitalAgeAdvice(dayMaster, dayMasterElement, gender, name) {
    const digitalAdvice = {
      '木': `${name}，在数字时代建议多使用绿色主题的应用界面，关注环保科技和生物技术领域。适合从事互联网教育、在线设计等工作。`,
      '火': `${name}，建议多使用社交媒体展示才华，关注新媒体和直播行业。适合从事网络营销、内容创作等工作。`,
      '土': `${name}，建议注重数字安全和隐私保护，关注区块链和数字货币。适合从事电商平台、数字金融等稳定的互联网行业。`,
      '金': `${name}，建议学习编程和数据分析技能，关注人工智能和精密制造。适合从事软件开发、数据科学等技术工作。`,
      '水': `${name}，建议保持信息敏感度，关注云计算和物联网技术。适合从事网络运营、数字咨询等流动性强的工作。`
    };
    
    return digitalAdvice[dayMasterElement] || `${name}，建议积极拥抱数字化时代，提升数字技能。`;
  }
  
  // 生成投资理财建议
  generateInvestmentAdvice(baziChart, strengthLevel, name) {
    const dayMasterElement = baziChart.day_master_element;
    const monthBranch = baziChart.month_pillar.branch;
    
    const investmentStyles = {
      '木': `${name}，您适合长期投资和成长型投资，如股票基金、绿色能源等。建议定期定额投资，耐心等待收获。`,
      '火': `${name}，您适合短期投资和热门投资，但要控制风险。建议关注科技股、新兴产业，但要及时止盈止损。`,
      '土': `${name}，您适合稳健投资和保值投资，如房地产、债券等。建议以安全为主，稳步增值。`,
      '金': `${name}，您适合贵金属投资和价值投资，如黄金、优质股票等。建议精选投资标的，长期持有。`,
      '水': `${name}，您适合灵活投资和流动性投资，如货币基金、短期理财等。建议保持资金流动性，随时调整。`
    };
    
    let advice = investmentStyles[dayMasterElement] || `${name}，建议根据自身风险承受能力选择投资方式。`;
    
    if (strengthLevel === '太旺' || strengthLevel === '偏旺') {
      advice += '您决策力强，但要避免过度自信，建议分散投资降低风险。';
    } else if (strengthLevel === '太弱' || strengthLevel === '偏弱') {
      advice += '建议先从低风险投资开始，逐步积累经验和资金。';
    }
    
    return advice;
  }
  
  // 生成健康优化建议
  generateHealthOptimization(dayMasterElement, strengthLevel, gender, name) {
    const healthAdvice = {
      '木': `${name}，您要注意肝胆和眼部健康，建议多吃绿色蔬菜，进行拉伸运动如瑜伽、太极。避免熬夜和过度用眼。`,
      '火': `${name}，您要注意心脏和血液循环，建议适度有氧运动，多吃红色食物。避免过度兴奋和情绪激动。`,
      '土': `${name}，您要注意脾胃和消化系统，建议规律饮食，多吃黄色食物如小米、南瓜。避免暴饮暴食。`,
      '金': `${name}，您要注意肺部和呼吸系统，建议多做深呼吸练习，多吃白色食物如梨、银耳。避免吸烟和空气污染。`,
      '水': `${name}，您要注意肾脏和泌尿系统，建议多喝水，多吃黑色食物如黑豆、黑芝麻。避免过度劳累。`
    };
    
    let advice = healthAdvice[dayMasterElement] || `${name}，建议保持规律的作息和适度的运动。`;
    
    if (strengthLevel === '太旺' || strengthLevel === '偏旺') {
      advice += '您精力旺盛，但要注意适度休息，避免过度消耗。';
    } else if (strengthLevel === '太弱' || strengthLevel === '偏弱') {
      advice += '建议加强营养补充和体质锻炼，提高身体抵抗力。';
    }
    
    if (gender === 'female' || gender === '女') {
      advice += '作为女性，要特别注意气血调养和内分泌平衡。';
    }
    
    return advice;
  }

  // 生成四柱详细解释
  generatePillarInterpretations(baziChart, gender, name) {
    const interpretations = {
      year_pillar: this.interpretYearPillar(baziChart.year_pillar, baziChart.day_master, gender, name),
      month_pillar: this.interpretMonthPillar(baziChart.month_pillar, baziChart.day_master, baziChart.element_strength, gender, name),
      day_pillar: this.interpretDayPillar(baziChart.day_pillar, baziChart.element_strength, gender, name),
      hour_pillar: this.interpretHourPillar(baziChart.hour_pillar, baziChart.day_master, gender, name)
    };
    
    return interpretations;
  }
  
  // 年柱解释
  interpretYearPillar(yearPillar, dayMaster, gender, name) {
    const tenGod = yearPillar.ten_god;
    const stemElement = yearPillar.element;
    const branchElement = this.getBranchElement(yearPillar.branch);
    const hiddenStems = yearPillar.hidden_stems;
    
    let interpretation = `${name}的年柱${yearPillar.stem}${yearPillar.branch}，天干${yearPillar.stem}为${stemElement}，与日主${dayMaster}形成${tenGod}关系。`;
    
    // 基于十神关系的年柱含义
    const yearMeanings = {
      '正官': '祖上有官贵之气，家族重视名誉和地位，早年受到良好的道德教育，具有正统的价值观念',
      '七杀': '祖上性格刚强，家族具有开拓精神，早年环境较为严格，培养了坚韧不拔的性格',
      '正财': '祖上勤俭持家，家族注重实际和稳定，早年生活环境务实，培养了良好的理财观念',
      '偏财': '祖上善于经营，家族具有商业头脑，早年接触多元化环境，培养了灵活的思维方式',
      '正印': '祖上重视文化教育，家族书香门第，早年受到良好的文化熏陶，具有深厚的学习基础',
      '偏印': '祖上思维独特，家族具有创新精神，早年环境多变，培养了独立思考的能力',
      '食神': '祖上性格温和，家族和睦融洽，早年生活环境宽松，培养了乐观开朗的性格',
      '伤官': '祖上才华横溢，家族重视才能表现，早年环境活跃，培养了强烈的表现欲望',
      '比肩': '祖上自立自强，家族注重独立精神，早年学会自力更生，培养了坚强的意志力',
      '劫财': '祖上竞争意识强，家族环境较为复杂，早年经历一些波折，培养了应变能力'
    };
    
    interpretation += yearMeanings[tenGod] || '年柱体现了祖辈的影响和早年的成长环境';
    
    // 地支藏干的影响
    if (hiddenStems.length > 1) {
      interpretation += `。地支${yearPillar.branch}藏干${hiddenStems.join('、')}，表明祖辈影响具有多重层面，`;
      interpretation += `主要体现在${this.getHiddenStemInfluence(hiddenStems[0], dayMaster)}方面。`;
    }
    
    return interpretation;
  }
  
  // 月柱解释
  interpretMonthPillar(monthPillar, dayMaster, strengthAnalysis, gender, name) {
    const tenGod = monthPillar.ten_god;
    const monthStrength = strengthAnalysis.month_strength;
    const strengthLevel = strengthAnalysis.strength_level;
    
    let interpretation = `${name}的月柱${monthPillar.stem}${monthPillar.branch}，为月令提纲，天干${monthPillar.stem}与日主${dayMaster}形成${tenGod}关系，月令${monthStrength}。`;
    
    // 基于月令十神的详细解释
    const monthMeanings = {
      '正官': `月令正官${monthStrength}，表明${name}具有正统的价值观念和强烈的责任感。青年时期适合在正规机构发展，重视社会地位和名誉。${gender === '男性' ? '男命月令正官，事业心强，适合从政或管理工作' : '女命月令正官，夫星得力，婚姻美满，配偶有能力'}`,
      '七杀': `月令七杀${monthStrength}，表明${name}性格刚毅果断，具有很强的开拓精神和竞争意识。青年时期充满挑战，需要勇敢面对困难。${gender === '男性' ? '男命月令七杀，适合军警或竞争激烈的行业' : '女命月令七杀，个性较强，需要找到能够理解和包容的伴侣'}`,
      '正财': `月令正财${monthStrength}，表明${name}具有很好的理财能力和商业头脑。青年时期财运稳定，适合从事实业或金融相关工作。${gender === '男性' ? '男命月令正财，妻财并美，婚姻幸福' : '女命月令正财，理财有道，家庭经济稳定'}`,
      '偏财': `月令偏财${monthStrength}，表明${name}具有敏锐的商业嗅觉和投资眼光。青年时期财运机会多，但需要控制风险。${gender === '男性' ? '男命月令偏财，异性缘佳，但需要专一' : '女命月令偏财，善于理财，但要避免投机'}`,
      '正印': `月令正印${monthStrength}，表明${name}具有很强的学习能力和文化修养。青年时期学业有成，适合从事教育或文化工作。${gender === '男性' ? '男命月令正印，母亲贤能，得到很好的教育' : '女命月令正印，知书达理，是贤妻良母的典型'}`,
      '偏印': `月令偏印${monthStrength}，表明${name}思维敏锐独特，具有很强的直觉和创新能力。青年时期适合从事技术或研发工作。${gender === '男性' ? '男命月令偏印，思维独特，适合技术创新' : '女命月令偏印，聪明机智，但要注意与长辈的关系'}`,
      '食神': `月令食神${monthStrength}，表明${name}性格温和乐观，具有很好的表达能力和艺术天赋。青年时期生活愉快，适合从事文艺或服务行业。${gender === '男性' ? '男命月令食神，子女缘佳，晚年享福' : '女命月令食神，温柔贤淑，子女有出息'}`,
      '伤官': `月令伤官${monthStrength}，表明${name}聪明机敏，具有很强的表现欲和创新精神。青年时期才华横溢，但要注意言行谨慎。${gender === '男性' ? '男命月令伤官，才华出众，但要注意克制' : '女命月令伤官，聪明美丽，但要注意感情问题'}`,
      '比肩': `月令比肩${monthStrength}，表明${name}性格自立自强，具有很强的独立能力。青年时期适合与朋友合作，但要注意理财。${gender === '男性' ? '男命月令比肩，朋友多助，但要防破财' : '女命月令比肩，独立性强，但要注意夫妻关系'}`,
      '劫财': `月令劫财${monthStrength}，表明${name}竞争意识强，具有很好的应变能力。青年时期竞争激烈，需要谨慎理财。${gender === '男性' ? '男命月令劫财，兄弟朋友多，但要防小人' : '女命月令劫财，性格较强，要注意与配偶的关系'}`
    };
    
    interpretation += monthMeanings[tenGod] || '月柱体现了青年时期的发展特点和人生方向';
    
    // 结合日主旺衰的分析
    if (strengthLevel === '太旺' || strengthLevel === '偏旺') {
      interpretation += `。由于日主${strengthLevel}，月令的影响更加明显，建议适度收敛，发挥正面作用。`;
    } else if (strengthLevel === '太弱' || strengthLevel === '偏弱') {
      interpretation += `。由于日主${strengthLevel}，需要月令的生扶，建议充分发挥月令的积极作用。`;
    }
    
    return interpretation;
  }
  
  // 日柱解释
  interpretDayPillar(dayPillar, strengthAnalysis, gender, name) {
    const dayStem = dayPillar.stem;
    const dayBranch = dayPillar.branch;
    const dayElement = dayPillar.element;
    const strengthLevel = strengthAnalysis.strength_level;
    const useGodAnalysis = strengthAnalysis.use_god_analysis;
    
    let interpretation = `${name}的日柱${dayStem}${dayBranch}，日主${dayStem}为${dayElement}命，${strengthLevel}。`;
    
    // 日主特性分析
    const dayMasterTraits = {
      '甲': `甲木日主，如参天大树，性格正直挺拔，具有开拓进取的精神。${gender === '男性' ? '男命甲木，天生具有领导气质，适合开创性事业' : '女命甲木，性格独立坚强，是现代女性的典型'}`,
      '乙': `乙木日主，如花草藤蔓，性格柔韧灵活，具有很强的适应能力。${gender === '男性' ? '男命乙木，温文尔雅，善于协调人际关系' : '女命乙木，温柔美丽，具有很好的艺术天赋'}`,
      '丙': `丙火日主，如太阳之火，性格光明磊落，具有很强的感染力。${gender === '男性' ? '男命丙火，热情开朗，天生的领导者' : '女命丙火，活泼大方，人缘极佳'}`,
      '丁': `丁火日主，如星火烛光，性格温暖细腻，具有敏锐的洞察力。${gender === '男性' ? '男命丁火，思维敏锐，适合文化创意工作' : '女命丁火，温柔体贴，是理想的贤内助'}`,
      '戊': `戊土日主，如高山大地，性格稳重厚实，具有很强的包容心。${gender === '男性' ? '男命戊土，稳重可靠，是值得信赖的伙伴' : '女命戊土，贤惠持家，家庭和睦'}`,
      '己': `己土日主，如田园沃土，性格温和包容，具有很好的亲和力。${gender === '男性' ? '男命己土，温和谦逊，善于照顾他人' : '女命己土，温柔贤淑，是标准的贤妻良母'}`,
      '庚': `庚金日主，如刀剑钢铁，性格刚毅果断，具有很强的原则性。${gender === '男性' ? '男命庚金，刚毅果断，适合需要决断力的工作' : '女命庚金，性格较强，需要找到能够欣赏的伴侣'}`,
      '辛': `辛金日主，如珠宝首饰，性格精致优雅，具有很好的审美能力。${gender === '男性' ? '男命辛金，注重品质，追求完美' : '女命辛金，美丽优雅，具有很好的品味'}`,
      '壬': `壬水日主，如江河大海，性格胸怀宽广，具有很强的包容性。${gender === '男性' ? '男命壬水，智慧深邃，适合需要智慧的工作' : '女命壬水，温柔如水，善解人意'}`,
      '癸': `癸水日主，如雨露甘霖，性格纯净灵性，具有很强的感知能力。${gender === '男性' ? '男命癸水，直觉敏锐，具有很好的洞察力' : '女命癸水，温柔敏感，需要细心呵护'}`
    };
    
    interpretation += dayMasterTraits[dayStem] || '日主体现了个人的核心性格特征';
    
    // 日支配偶宫分析
    const spouseAnalysis = this.analyzeSpousePalace(dayBranch, dayStem, gender);
    interpretation += `。日支${dayBranch}为配偶宫，${spouseAnalysis}`;
    
    // 结合用神分析
    interpretation += `。${useGodAnalysis.analysis}`;
    
    return interpretation;
  }
  
  // 时柱解释
  interpretHourPillar(hourPillar, dayMaster, gender, name) {
    const tenGod = hourPillar.ten_god;
    const hourStem = hourPillar.stem;
    const hourBranch = hourPillar.branch;
    
    let interpretation = `${name}的时柱${hourStem}${hourBranch}，天干${hourStem}与日主${dayMaster}形成${tenGod}关系。`;
    
    // 基于十神关系的时柱含义
    const hourMeanings = {
      '正官': `时柱正官，表明${name}晚年享有很好的社会地位和名誉，子女有出息，能够光宗耀祖。${gender === '男性' ? '男命时柱正官，晚年事业有成，受人尊敬' : '女命时柱正官，子女贵气，晚年享福'}`,
      '七杀': `时柱七杀，表明${name}晚年仍然保持进取精神，子女性格刚强，具有开拓能力。${gender === '男性' ? '男命时柱七杀，晚年仍有作为，子女能干' : '女命时柱七杀，子女个性强，需要正确引导'}`,
      '正财': `时柱正财，表明${name}晚年财运稳定，子女孝顺，能够享受天伦之乐。${gender === '男性' ? '男命时柱正财，晚年财运佳，子女孝顺' : '女命时柱正财，子女有财运，晚年不愁吃穿'}`,
      '偏财': `时柱偏财，表明${name}晚年财运机会多，子女善于经营，具有商业头脑。${gender === '男性' ? '男命时柱偏财，晚年财源广进，子女有商业天赋' : '女命时柱偏财，子女理财有道，晚年富足'}`,
      '正印': `时柱正印，表明${name}晚年受到很好的照顾，子女孝顺有文化，重视教育。${gender === '男性' ? '男命时柱正印，晚年享清福，子女有文化' : '女命时柱正印，子女孝顺，晚年安详'}`,
      '偏印': `时柱偏印，表明${name}晚年思维仍然敏锐，子女聪明独特，具有创新能力。${gender === '男性' ? '男命时柱偏印，晚年仍有创新，子女聪明' : '女命时柱偏印，子女有特殊才能，但要注意沟通'}`,
      '食神': `时柱食神，表明${name}晚年生活愉快，子女温和孝顺，家庭和睦。${gender === '男性' ? '男命时柱食神，晚年享福，子女孝顺' : '女命时柱食神，子女温顺，晚年幸福'}`,
      '伤官': `时柱伤官，表明${name}晚年仍然才华横溢，子女聪明有才，但要注意引导。${gender === '男性' ? '男命时柱伤官，晚年仍有才华，子女聪明' : '女命时柱伤官，子女有才华，但要注意教育方式'}`,
      '比肩': `时柱比肩，表明${name}晚年朋友多助，子女独立自强，具有很好的自立能力。${gender === '男性' ? '男命时柱比肩，晚年朋友多，子女自立' : '女命时柱比肩，子女独立，晚年有依靠'}`,
      '劫财': `时柱劫财，表明${name}晚年需要注意理财，子女竞争意识强，要正确引导。${gender === '男性' ? '男命时柱劫财，晚年要防破财，子女要正确引导' : '女命时柱劫财，子女个性强，要注意教育'}`
    };
    
    interpretation += hourMeanings[tenGod] || '时柱体现了晚年运势和子女关系';
    
    // 时支子女宫分析
    const childrenAnalysis = this.analyzeChildrenPalace(hourBranch, gender);
    interpretation += `时支${hourBranch}为子女宫，${childrenAnalysis}。`;
    
    return interpretation;
  }
  
  // 配偶宫分析
  analyzeSpousePalace(dayBranch, dayStem, gender) {
    const branchElement = this.getBranchElement(dayBranch);
    const dayElement = this.getElementFromStem(dayStem);
    const relation = this.getElementRelation(branchElement, dayElement);
    
    let analysis = '';
    
    if (relation === 'same') {
      analysis = `配偶与您五行相同，性格相似，容易产生共鸣，但也要注意避免过于相似而缺乏互补`;
    } else if (relation === 'generate') {
      analysis = `配偶能够帮助您，是您的贵人，婚姻关系和谐，配偶对您的事业发展有积极作用`;
    } else if (relation === 'beGenerated') {
      analysis = `您对配偶付出较多，配偶依赖性较强，需要您的照顾和支持`;
    } else if (relation === 'overcome') {
      analysis = `您在婚姻中较为主导，配偶性格相对温和，但要注意不要过于强势`;
    } else if (relation === 'beOvercome') {
      analysis = `配偶性格较强，在婚姻中有一定的主导权，您需要学会适当的包容和理解`;
    }
    
    // 地支特性分析
    const branchTraits = {
      '子': '配偶聪明机智，善于变通，但有时较为感性',
      '丑': '配偶稳重踏实，勤劳持家，是可靠的伴侣',
      '寅': '配偶性格开朗，有进取心，喜欢新鲜事物',
      '卯': '配偶温和善良，有艺术气质，注重生活品质',
      '辰': '配偶包容性强，有领导能力，事业心较重',
      '巳': '配偶聪明美丽，有魅力，但有时较为敏感',
      '午': '配偶热情开朗，有活力，社交能力强',
      '未': '配偶温柔体贴，顾家，有很好的亲和力',
      '申': '配偶机智灵活，有商业头脑，适应能力强',
      '酉': '配偶注重外表，有品味，追求完美',
      '戌': '配偶忠诚可靠，有责任心，是值得信赖的伴侣',
      '亥': '配偶善良纯真，有同情心，但有时较为理想化'
    };
    
    analysis += `。${branchTraits[dayBranch] || '配偶具有独特的性格特征'}`;
    
    return analysis;
  }
  
  // 子女宫分析
  analyzeChildrenPalace(hourBranch, gender) {
    const branchTraits = {
      '子': '子女聪明活泼，学习能力强，但需要正确引导',
      '丑': '子女稳重踏实，做事认真，是可靠的孩子',
      '寅': '子女性格开朗，有领导才能，适合培养其独立性',
      '卯': '子女温和善良，有艺术天赋，适合文艺方面的培养',
      '辰': '子女有组织能力，适合培养其管理才能',
      '巳': '子女聪明机智，反应敏锐，但要注意其情绪管理',
      '午': '子女热情活泼，有表现欲，适合培养其特长',
      '未': '子女温顺听话，有同情心，是贴心的孩子',
      '申': '子女机智灵活，适应能力强，有商业天赋',
      '酉': '子女注重细节，追求完美，适合精细化培养',
      '戌': '子女忠诚可靠，有责任心，是值得骄傲的孩子',
      '亥': '子女善良纯真，有想象力，需要保护其天真本性'
    };
    
    return branchTraits[hourBranch] || '子女具有独特的性格特征，需要因材施教';
  }
  
  // 地支藏干影响分析
  getHiddenStemInfluence(hiddenStem, dayMaster) {
    const tenGod = this.calculateTenGod(dayMaster, hiddenStem);
    const influences = {
      '正官': '正统教育和道德品格',
      '七杀': '严格管教和竞争意识',
      '正财': '实用主义和理财观念',
      '偏财': '商业思维和灵活应变',
      '正印': '文化教育和学术修养',
      '偏印': '独特思维和创新能力',
      '食神': '乐观心态和艺术天赋',
      '伤官': '表现欲望和创新精神',
      '比肩': '独立精神和自立能力',
      '劫财': '竞争意识和应变能力'
    };
    
    return influences[tenGod] || '综合素质的培养';
  }
  
  calculateLunarInfo(birth_date) {
    const birthDate = new Date(birth_date);
    const year = birthDate.getFullYear();
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    
    // 计算干支年
    const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const diZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const zodiacAnimals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    
    const ganIndex = (year - 4) % 10;
    const zhiIndex = (year - 4) % 12;
    const ganzhiYear = tianGan[ganIndex] + diZhi[zhiIndex];
    const zodiac = zodiacAnimals[zhiIndex];
    
    // 计算节气信息
    let solarTerm = this.calculateSolarTerm(month, day);
    
    // 改进的农历日期计算
    const lunarInfo = this.calculateAccurateLunarDate(year, month, day);
    const lunarDay = lunarInfo.day;
    const lunarMonth = lunarInfo.month;
    const lunarYear = lunarInfo.year;
    
    return {
      lunar_date: `农历${this.getChineseYear(lunarYear)}年${this.getChineseMonth(lunarMonth)}月${this.getChineseDay(lunarDay)}日`,
      lunar_year: `${this.getChineseYear(lunarYear)}年`,
      lunar_month: this.getChineseMonth(lunarMonth) + '月',
      lunar_day: this.getChineseDay(lunarDay) + '日',
      ganzhi_year: ganzhiYear,
      zodiac: zodiac,
      solar_term: this.calculateDetailedSolarTerm(month, day)
    };
  }
  
  // 改进的公历转农历计算方法（使用BaseData的统一农历算法）
  calculateAccurateLunarDate(year, month, day) {
    return this.baseData.solarToLunar(year, month, day);
  }
  
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
  
  // 转换为中文月份
  getChineseMonth(month) {
    const chineseMonths = ['', '正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '腊'];
    return chineseMonths[month] || '未知';
  }
  
  // 转换为中文日期
  getChineseDay(day) {
    const chineseDays = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                        '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                        '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
    return chineseDays[day] || '未知';
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
   
   // 生成子时计算方法说明
   generateZishiCalculationNote(baziChart, birth_time) {
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
         expert_opinion: '根据命理学专家主流观点，子时分为早子时和晚子时，计算方法有所不同。'
       };
       
       if (isLateZishi) {
         note.calculation_method = '晚子时计算法：日柱用当天干支，时柱用第二天日干推算';
         note.explanation = `您出生在晚子时（${birth_time}），采用专家推荐的计算方法：` +
           `日柱保持当天的${baziChart.day_pillar.stem}${baziChart.day_pillar.branch}，` +
           `时柱${baziChart.hour_pillar.stem}${baziChart.hour_pillar.branch}是用第二天的日干推算得出。` +
           `这种方法能更准确地反映晚子时出生者的命理特征。`;
       } else {
         note.calculation_method = '早子时计算法：日柱和时柱都用当天干支推算';
         note.explanation = `您出生在早子时（${birth_time}），采用传统计算方法：` +
           `日柱和时柱都使用当天的干支进行推算，` +
           `日柱为${baziChart.day_pillar.stem}${baziChart.day_pillar.branch}，` +
           `时柱为${baziChart.hour_pillar.stem}${baziChart.hour_pillar.branch}。`;
       }
       
       return note;
     }
     
     return null;
   }
 
  // 生成详细流年分析
  generateDetailedYearlyAnalysis(baziChart, currentDayun, currentYear, currentAge) {
    const yearlyAnalysis = [];
    
    // 分析当前年及未来5年
    for (let i = 0; i < 6; i++) {
      const analysisYear = currentYear + i;
      const analysisAge = currentAge + i;
      
      // 计算流年干支
      const yearStemIndex = (analysisYear - 4) % 10;
      const yearBranchIndex = (analysisYear - 4) % 12;
      const yearStem = this.baseData.getStemByIndex(yearStemIndex);
    const yearBranch = this.baseData.getBranchByIndex(yearBranchIndex);
      const yearTenGod = this.calculateTenGod(baziChart.day_master, yearStem);
      
      // 确定该年的大运
      const yearDayun = this.getDayunForAge(baziChart, analysisAge, currentDayun);
      
      // 生成详细分析
      const yearAnalysis = {
        year: analysisYear,
        age: analysisAge,
        year_ganzhi: `${yearStem}${yearBranch}`,
        year_stem: yearStem,
        year_branch: yearBranch,
        year_ten_god: yearTenGod,
        dayun_period: yearDayun ? `${yearDayun.ganzhi}大运` : '未起运',
        overall_fortune: this.analyzeYearlyOverallFortune(baziChart, yearStem, yearBranch, yearTenGod, yearDayun),
        career_fortune: this.analyzeYearlyCareerFortune(yearTenGod, yearDayun, baziChart.element_strength),
        wealth_fortune: this.analyzeYearlyWealthFortune(yearTenGod, yearStem, baziChart),
        relationship_fortune: this.analyzeYearlyRelationshipFortune(yearTenGod, yearBranch, baziChart, analysisAge),
        health_fortune: this.analyzeYearlyHealthFortune(yearBranch, baziChart.day_master_element),
        monthly_highlights: this.generateMonthlyHighlights(analysisYear, yearTenGod, baziChart),
        key_advice: this.generateYearlyKeyAdvice(yearTenGod, yearDayun, baziChart.element_strength)
      };
      
      yearlyAnalysis.push(yearAnalysis);
    }
    
    return yearlyAnalysis;
  }
  
  // 获取指定年龄的大运
  getDayunForAge(baziChart, age, currentDayun) {
    // 如果有当前大运且年龄在范围内，返回当前大运
    if (currentDayun && age >= currentDayun.start_age && age <= currentDayun.end_age) {
      return currentDayun;
    }
    
    // 否则需要重新计算（简化处理）
    return currentDayun;
  }
  
  // 分析年度整体运势
  analyzeYearlyOverallFortune(baziChart, yearStem, yearBranch, yearTenGod, yearDayun) {
    const dayElement = baziChart.day_master_element;
    const yearElement = this.getElementFromStem(yearStem);
    const yearBranchElement = this.getBranchElement(yearBranch);
    const strengthLevel = baziChart.element_strength.strength_level;
    
    let fortune = '';
    
    // 基于流年十神的整体运势
    const fortuneByTenGod = {
      '正官': '整体运势稳定向上，适合求职升迁，社会地位有所提升，但要注意遵守规则',
      '七杀': '整体运势充满挑战，压力较大，但也是突破的好时机，需要勇敢面对困难',
      '正财': '整体运势平稳，财运稳定，适合投资理财，感情生活和谐',
      '偏财': '整体运势机会较多，财运有起伏，适合把握机会，但要控制风险',
      '正印': '整体运势有贵人相助，学习运佳，适合进修提升，身体健康',
      '偏印': '整体运势变化较多，思维活跃，适合创新研发，但要注意健康',
      '食神': '整体运势轻松愉快，创意丰富，适合艺术创作，身心愉悦',
      '伤官': '整体运势才华横溢，表现机会多，但要注意言行谨慎，避免冲突',
      '比肩': '整体运势朋友助力多，适合合作发展，但要注意理财，防止破财',
      '劫财': '整体运势竞争激烈，需要谨慎理财，防范小人，但也有突破机会'
    };
    
    fortune = fortuneByTenGod[yearTenGod] || '整体运势需要根据具体情况灵活应对';
    
    // 结合日主旺衰调整
    if (strengthLevel === '偏弱' || strengthLevel === '太弱') {
      if (['比肩', '劫财', '正印', '偏印'].includes(yearTenGod)) {
        fortune += '，此年对您特别有利，能够增强实力';
      } else {
        fortune += '，此年压力较大，需要寻求帮助和支持';
      }
    } else if (strengthLevel === '偏旺' || strengthLevel === '太旺') {
      if (['正官', '七杀', '食神', '伤官', '正财', '偏财'].includes(yearTenGod)) {
        fortune += '，此年能够很好地发挥才能，适合积极进取';
      } else {
        fortune += '，此年可能过于强势，需要学会收敛';
      }
    }
    
    return fortune;
  }
  
  // 分析年度事业运势
  analyzeYearlyCareerFortune(yearTenGod, yearDayun, strengthAnalysis) {
    const careerFortunes = {
      '正官': '事业运势极佳，适合求职、升迁或转换到更正规的机构，领导认可度高',
      '七杀': '事业运势充满挑战，适合开拓新领域或接受有挑战性的工作，需要勇气和决心',
      '正财': '事业运势稳定，适合从事实业或与金融相关的工作，收入稳定增长',
      '偏财': '事业运势机会多变，适合从事销售、投资或多元化经营，但要控制风险',
      '正印': '事业运势有贵人相助，适合从事教育、文化或需要专业知识的工作',
      '偏印': '事业运势适合技术创新，从事研发或需要独特思维的工作，但要注意与同事关系',
      '食神': '事业运势轻松愉快，适合从事文艺、餐饮或服务行业，工作环境和谐',
      '伤官': '事业运势才华得以发挥，适合从事创意、媒体或表演相关工作，但要注意人际关系',
      '比肩': '事业运势适合合作发展，与同事关系良好，但要注意避免合作中的利益冲突',
      '劫财': '事业运势竞争激烈，需要防范同事竞争，但也有机会在竞争中脱颖而出'
    };
    
    return careerFortunes[yearTenGod] || '事业运势需要根据具体情况把握机会';
  }
  
  // 分析年度财运
  analyzeYearlyWealthFortune(yearTenGod, yearStem, baziChart) {
    const wealthFortunes = {
      '正官': '财运稳定，主要来源于正当收入，适合稳健投资，避免投机',
      '七杀': '财运有波动，需要通过努力获得，适合高风险高回报的投资，但要谨慎',
      '正财': '财运极佳，收入稳定增长，适合各种投资理财，是积累财富的好时机',
      '偏财': '财运机会多，有意外之财的可能，适合投机投资，但要控制贪心',
      '正印': '财运平稳，主要通过知识技能获得收入，不适合大额投资',
      '偏印': '财运变化较大，收入来源多样化，适合技术投资，但要防范风险',
      '食神': '财运轻松获得，通过才艺或服务获得收入，适合小额稳健投资',
      '伤官': '财运通过才华获得，收入可能不稳定，需要合理规划财务',
      '比肩': '财运需要与人合作获得，但要防范合作中的财务纠纷',
      '劫财': '财运容易破财，需要谨慎理财，避免借贷和担保'
    };
    
    return wealthFortunes[yearTenGod] || '财运需要根据具体情况合理规划';
  }
  
  // 分析年度感情运势
  analyzeYearlyRelationshipFortune(yearTenGod, yearBranch, baziChart, age) {
    const relationshipFortunes = {
      '正官': '感情运势稳定，适合结婚或确定关系，对方条件较好，关系正式',
      '七杀': '感情运势有挑战，可能遇到性格强势的对象，需要磨合和理解',
      '正财': '感情运势和谐，适合谈婚论嫁，经济条件对感情有积极影响',
      '偏财': '感情运势机会多，异性缘佳，但要注意专一，避免多角关系',
      '正印': '感情运势有长辈介入，适合通过正当途径认识对象，关系稳定',
      '偏印': '感情运势较为复杂，可能遇到年龄差距较大或特殊背景的对象',
      '食神': '感情运势轻松愉快，适合自然发展的恋情，关系和谐甜蜜',
      '伤官': '感情运势多姿多彩，魅力增强，但要注意避免感情纠纷',
      '比肩': '感情运势需要主动争取，可能遇到竞争对手，要展现自己的优势',
      '劫财': '感情运势容易有第三者介入，需要维护现有关系，避免感情破财'
    };
    
    let fortune = relationshipFortunes[yearTenGod] || '感情运势需要根据具体情况把握';
    
    // 根据年龄调整建议
    if (age < 25) {
      fortune += '。年轻时期，建议以学业和事业为重，感情顺其自然';
    } else if (age >= 25 && age < 35) {
      fortune += '。正值适婚年龄，可以积极寻找合适的伴侣';
    } else {
      fortune += '。成熟阶段，重视感情质量和稳定性';
    }
    
    return fortune;
  }
  
  // 分析年度健康运势
  analyzeYearlyHealthFortune(yearBranch, dayMasterElement) {
    const healthByBranch = {
      '子': '注意肾脏和泌尿系统健康，避免过度劳累，多休息',
      '丑': '注意脾胃消化系统，饮食要规律，避免暴饮暴食',
      '寅': '注意肝胆健康，保持心情愉快，避免熬夜',
      '卯': '注意肝脏和神经系统，保持作息规律，适度运动',
      '辰': '注意脾胃和皮肤健康，饮食清淡，保持环境整洁',
      '巳': '注意心脏和血液循环，避免过度兴奋，保持平和心态',
      '午': '注意心脏和小肠健康，避免上火，多喝水',
      '未': '注意脾胃和消化系统，饮食要有节制，避免过甜过腻',
      '申': '注意肺部和呼吸系统，避免感冒，保持空气流通',
      '酉': '注意肺部和大肠健康，避免辛辣食物，保持排便通畅',
      '戌': '注意脾胃和关节健康，避免湿气，保持干燥环境',
      '亥': '注意肾脏和生殖系统，避免寒凉，保持温暖'
    };
    
    return healthByBranch[yearBranch] || '注意身体健康，保持良好的生活习惯';
  }
  
  // 生成月度重点
  generateMonthlyHighlights(year, yearTenGod, baziChart) {
    const highlights = [];
    
    // 根据流年十神生成关键月份的提醒
    if (['正官', '七杀'].includes(yearTenGod)) {
      highlights.push('3月、9月：事业发展的关键月份，适合求职或升迁');
      highlights.push('6月、12月：需要注意工作压力，适当调节');
    } else if (['正财', '偏财'].includes(yearTenGod)) {
      highlights.push('2月、8月：财运较佳的月份，适合投资理财');
      highlights.push('5月、11月：需要谨慎理财，避免大额支出');
    } else if (['正印', '偏印'].includes(yearTenGod)) {
      highlights.push('4月、10月：学习运佳，适合进修提升');
      highlights.push('7月、1月：贵人运旺，适合寻求帮助');
    }
    
    return highlights;
  }
  
  // 生成年度关键建议
  generateYearlyKeyAdvice(yearTenGod, yearDayun, strengthAnalysis) {
    const adviceByTenGod = {
      '正官': '把握升迁机会，遵守规则制度，建立良好的社会形象',
      '七杀': '勇敢面对挑战，化压力为动力，但要注意方式方法',
      '正财': '稳健投资理财，积累财富，维护良好的人际关系',
      '偏财': '把握投资机会，但要控制风险，避免贪心',
      '正印': '重视学习提升，寻求贵人帮助，保持谦逊态度',
      '偏印': '发挥创新能力，但要注意与人沟通，避免孤立',
      '食神': '发挥才艺特长，享受生活乐趣，保持乐观心态',
      '伤官': '展现个人才华，但要注意言行谨慎，避免冲突',
      '比肩': '加强合作交流，但要注意利益分配，防范纠纷',
      '劫财': '谨慎理财投资，防范小人，但也要把握突破机会'
    };
    
    return adviceByTenGod[yearTenGod] || '根据具体情况灵活应对，保持积极心态';
  }
}

module.exports = BaziAnalyzer;