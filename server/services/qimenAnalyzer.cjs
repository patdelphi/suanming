// 奇门遁甲专业分析服务模块
// 基于传统奇门遁甲理论的完整实现

const AnalysisCache = require('./common/AnalysisCache.cjs');
const EnhancedRandom = require('./common/EnhancedRandom.cjs');
const TimeConverter = require('../utils/timeConverter.cjs');
const SolarTerms = require('../utils/solarTerms.cjs');
const BaziAnalyzer = require('./baziAnalyzer.cjs');

class QimenAnalyzer {
  constructor() {
    // 初始化基础数据
    this.initializeBasicData();
    this.initializePatterns();
    this.initializeSolarTerms();
    this.initializeWuXingData();
    this.initializeGanZhiData();
    
    // 初始化缓存机制
    this.cache = new AnalysisCache({
      maxSize: 100,
      defaultTTL: 3600000 // 1小时（奇门盘相对稳定）
    });
    
    // 初始化增强随机数生成器
    this.enhancedRandom = new EnhancedRandom();
    
    // 初始化时间转换器
    this.timeConverter = new TimeConverter();
    
    // 初始化八字分析器（复用农历计算功能）
    this.baziAnalyzer = new BaziAnalyzer();
    
    // 初始化节气计算器
    this.solarTerms = new SolarTerms();
    
    // 初始化计算器和分析器
    this.calculator = new QimenCalculator(this);
    this.patternAnalyzer = new PatternAnalyzer(this);
    this.yongShenAnalyzer = new YongShenAnalyzer(this);
    this.predictionGenerator = new PredictionGenerator(this);
  }

  // 初始化基础数据
  initializeBasicData() {
    // 天干地支
    this.TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    this.DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    
    // 九星数据
    this.JIUXING = {
      '天蓬': { element: '水', palace: 1, nature: '凶', meaning: '智谋、盗贼、暗昧之事' },
      '天任': { element: '土', palace: 2, nature: '吉', meaning: '田土、房屋、慈祥之事' },
      '天冲': { element: '木', palace: 3, nature: '凶', meaning: '冲动、急躁、军事之事' },
      '天辅': { element: '木', palace: 4, nature: '吉', meaning: '文书、教育、辅佐之事' },
      '天禽': { element: '土', palace: 5, nature: '吉', meaning: '中正、和合、调解之事' },
      '天心': { element: '金', palace: 6, nature: '吉', meaning: '医药、技艺、心灵之事' },
      '天柱': { element: '金', palace: 7, nature: '凶', meaning: '法律、支撑、阻碍之事' },
      '天芮': { element: '土', palace: 8, nature: '凶', meaning: '疾病、困顿、阻滞之事' },
      '天英': { element: '火', palace: 9, nature: '凶', meaning: '文明、礼仪、光明之事' }
    };
    
    // 八门数据
    this.BAMEN = {
      '休门': { element: '水', palace: 1, nature: '吉', meaning: '休息、和谐、文书、学习、养生吉利' },
      '死门': { element: '土', palace: 2, nature: '凶', meaning: '死亡、坟墓、终结、吊丧、破财' },
      '伤门': { element: '木', palace: 3, nature: '凶', meaning: '伤害、竞争、体育、讨债、捕猎' },
      '杜门': { element: '木', palace: 4, nature: '中', meaning: '闭塞、隐藏、躲避、修炼、防守' },
      '中宫': { element: '土', palace: 5, nature: '中', meaning: '中央、调和、平衡' },
      '开门': { element: '金', palace: 6, nature: '吉', meaning: '开创、领导、官贵、求财、出行吉利' },
      '惊门': { element: '金', palace: 7, nature: '凶', meaning: '惊恐、官司、口舌、意外、变动' },
      '生门': { element: '土', palace: 8, nature: '吉', meaning: '生育、房地产、农业、求财、治病吉利' },
      '景门': { element: '火', palace: 9, nature: '中', meaning: '文采、考试、宴会、血光、官司' }
    };
    
    // 八神数据
    this.BASHEN = {
      '值符': { nature: '吉', season: 'all', meaning: '主事者、领导、贵人、权威' },
      '螣蛇': { nature: '凶', season: 'all', meaning: '虚诈、惊恐、怪异、变化、文书纠纷' },
      '太阴': { nature: '吉', season: 'all', meaning: '阴私、暗昧、女性、隐秘、策划' },
      '六合': { nature: '吉', season: 'all', meaning: '和合、婚姻、合作、中介、媒人' },
      '白虎': { nature: '凶', season: 'autumn_winter', meaning: '凶猛、争斗、疾病、死亡、官司' },
      '勾陈': { nature: '凶', season: 'spring_summer', meaning: '田土、房屋、牢狱、纠缠、迟缓' },
      '朱雀': { nature: '凶', season: 'spring_summer', meaning: '文书、信息、口舌、官司、血光' },
      '玄武': { nature: '凶', season: 'autumn_winter', meaning: '盗贼、欺骗、暗昧、流动、智谋' },
      '九地': { nature: '吉', season: 'all', meaning: '坤土、柔顺、隐藏、农业、基础' },
      '九天': { nature: '吉', season: 'all', meaning: '乾金、刚健、高远、飞扬、创新' }
    };
    
    // 九宫方位
    this.JIUGONG = {
      1: { name: '坎宫', direction: '北', trigram: '坎', element: '水' },
      2: { name: '坤宫', direction: '西南', trigram: '坤', element: '土' },
      3: { name: '震宫', direction: '东', trigram: '震', element: '木' },
      4: { name: '巽宫', direction: '东南', trigram: '巽', element: '木' },
      5: { name: '中宫', direction: '中央', trigram: '中', element: '土' },
      6: { name: '乾宫', direction: '西北', trigram: '乾', element: '金' },
      7: { name: '兑宫', direction: '西', trigram: '兑', element: '金' },
      8: { name: '艮宫', direction: '东北', trigram: '艮', element: '土' },
      9: { name: '离宫', direction: '南', trigram: '离', element: '火' }
    };
  }

  // 初始化五行数据
  initializeWuXingData() {
    this.WUXING = {
      '木': { 
        sheng: '火', // 木生火
        ke: '土',   // 木克土
        shengBy: '水', // 水生木
        keBy: '金',   // 金克木
        season: '春',
        direction: ['东', '东南'],
        color: '青'
      },
      '火': {
        sheng: '土',
        ke: '金',
        shengBy: '木',
        keBy: '水',
        season: '夏',
        direction: ['南'],
        color: '红'
      },
      '土': {
        sheng: '金',
        ke: '水',
        shengBy: '火',
        keBy: '木',
        season: '四季',
        direction: ['中央', '西南', '东北'],
        color: '黄'
      },
      '金': {
        sheng: '水',
        ke: '木',
        shengBy: '土',
        keBy: '火',
        season: '秋',
        direction: ['西', '西北'],
        color: '白'
      },
      '水': {
        sheng: '木',
        ke: '火',
        shengBy: '金',
        keBy: '土',
        season: '冬',
        direction: ['北'],
        color: '黑'
      }
    };
  }

  // 初始化干支数据
  initializeGanZhiData() {
    this.GANZHI_WUXING = {
      // 天干五行
      '甲': '木', '乙': '木',
      '丙': '火', '丁': '火',
      '戊': '土', '己': '土',
      '庚': '金', '辛': '金',
      '壬': '水', '癸': '水'
    };
    
    this.DIZHI_WUXING = {
      // 地支五行
      '子': '水', '丑': '土', '寅': '木', '卯': '木',
      '辰': '土', '巳': '火', '午': '火', '未': '土',
      '申': '金', '酉': '金', '戌': '土', '亥': '水'
    };
    
    // 地支对应时辰
    this.DIZHI_TIME = {
      '子': [23, 1], '丑': [1, 3], '寅': [3, 5], '卯': [5, 7],
      '辰': [7, 9], '巳': [9, 11], '午': [11, 13], '未': [13, 15],
      '申': [15, 17], '酉': [17, 19], '戌': [19, 21], '亥': [21, 23]
    };
    
    // 六甲旬首
    this.LIUJIA_XUN = {
      '甲子': { empty: ['戌', '亥'], liuyi: '戊' },
      '甲戌': { empty: ['申', '酉'], liuyi: '己' },
      '甲申': { empty: ['午', '未'], liuyi: '庚' },
      '甲午': { empty: ['辰', '巳'], liuyi: '辛' },
      '甲辰': { empty: ['寅', '卯'], liuyi: '壬' },
      '甲寅': { empty: ['子', '丑'], liuyi: '癸' }
    };
  }

  // 初始化格局模式
  initializePatterns() {
    this.PATTERNS = {
      // 三奇格局
      '乙奇得使': { type: '三奇', level: '吉', score: 15, description: '乙奇临值使门，主文书、合同、女性贵人相助' },
      '日奇伏吟': { type: '三奇', level: '凶', score: -10, description: '乙奇在本宫不动，主事情反复，女性有阻' },
      '月奇悖师': { type: '三奇', level: '凶', score: -15, description: '丙奇临太白星（庚），主官司、争斗' },
      '丙奇升殿': { type: '三奇', level: '大吉', score: 25, description: '丙奇临离宫，得地得时，主文明、礼仪大吉' },
      '玉女守门': { type: '三奇', level: '吉', score: 20, description: '丁奇临生门、开门、休门，主婚姻美满' },
      '星奇朝斗': { type: '三奇', level: '吉', score: 18, description: '丁奇临天心星，主医药、技艺精进' },
      
      // 六仪格局
      '青龙返首': { type: '六仪', level: '吉', score: 12, description: '戊加己，主田土、房产大利' },
      '太白入荧': { type: '六仪', level: '凶', score: -12, description: '戊加庚，主争斗、官司' },
      '青龙折足': { type: '六仪', level: '凶', score: -10, description: '戊加辛，主破财、疾病' },
      '贵人入狱': { type: '六仪', level: '凶', score: -8, description: '己加戊，主贵人受困' },
      '地网高张': { type: '六仪', level: '凶', score: -15, description: '己加癸，主牢狱、困顿' },
      '太白逢星': { type: '六仪', level: '吉', score: 10, description: '庚加乙，主官司得理' },
      '亭亭之格': { type: '六仪', level: '吉', score: 15, description: '庚加丁，主婚姻、合作' },
      
      // 特殊格局
      '伏吟': { type: '特殊', level: '不利', score: -5, description: '天盘与地盘同宫，主事情反复、迟缓、不动' },
      '反吟': { type: '特殊', level: '动荡', score: -8, description: '天盘与地盘相冲，主事情变化、动荡、不稳' },
      '飞宫': { type: '特殊', level: '变化', score: 0, description: '值符飞到其他宫位，主变化、升迁或降职' }
    };
  }

  // 初始化节气数据
  initializeSolarTerms() {
    this.SOLAR_TERMS = {
      // 阳遁节气（冬至到夏至前）
      '冬至': { yindun: false, formula: { '上元': 1, '中元': 7, '下元': 4 } },
      '小寒': { yindun: false, formula: { '上元': 2, '中元': 8, '下元': 5 } },
      '大寒': { yindun: false, formula: { '上元': 3, '中元': 9, '下元': 6 } },
      '立春': { yindun: false, formula: { '上元': 8, '中元': 5, '下元': 2 } },
      '雨水': { yindun: false, formula: { '上元': 9, '中元': 6, '下元': 3 } },
      '惊蛰': { yindun: false, formula: { '上元': 1, '中元': 7, '下元': 4 } },
      '春分': { yindun: false, formula: { '上元': 3, '中元': 9, '下元': 6 } },
      '清明': { yindun: false, formula: { '上元': 4, '中元': 1, '下元': 7 } },
      '谷雨': { yindun: false, formula: { '上元': 5, '中元': 2, '下元': 8 } },
      '立夏': { yindun: false, formula: { '上元': 4, '中元': 1, '下元': 7 } },
      '小满': { yindun: false, formula: { '上元': 5, '中元': 2, '下元': 8 } },
      '芒种': { yindun: false, formula: { '上元': 6, '中元': 3, '下元': 9 } },
      
      // 阴遁节气（夏至到冬至前）
      '夏至': { yindun: true, formula: { '上元': 9, '中元': 3, '下元': 6 } },
      '小暑': { yindun: true, formula: { '上元': 8, '中元': 2, '下元': 5 } },
      '大暑': { yindun: true, formula: { '上元': 7, '中元': 1, '下元': 4 } },
      '立秋': { yindun: true, formula: { '上元': 2, '中元': 5, '下元': 8 } },
      '处暑': { yindun: true, formula: { '上元': 1, '中元': 4, '下元': 7 } },
      '白露': { yindun: true, formula: { '上元': 9, '中元': 3, '下元': 6 } },
      '秋分': { yindun: true, formula: { '上元': 7, '中元': 1, '下元': 4 } },
      '寒露': { yindun: true, formula: { '上元': 6, '中元': 9, '下元': 3 } },
      '霜降': { yindun: true, formula: { '上元': 5, '中元': 8, '下元': 2 } },
      '立冬': { yindun: true, formula: { '上元': 6, '中元': 9, '下元': 3 } },
      '小雪': { yindun: true, formula: { '上元': 5, '中元': 8, '下元': 2 } },
      '大雪': { yindun: true, formula: { '上元': 4, '中元': 7, '下元': 1 } }
    };
  }

  // 获取宫位名称
  getPalaceName(position) {
    const palaceNames = [
      '坎一宫', '坤二宫', '震三宫',
      '巽四宫', '中五宫', '乾六宫',
      '兑七宫', '艮八宫', '离九宫'
    ];
    return palaceNames[position] || '未知宫位';
  }
  
  // 获取五行关系
  getWuXingRelation(wuxing1, wuxing2) {
    const relations = {
      '木': { '火': '生', '土': '克', '金': '被克', '水': '被生', '木': '比和' },
      '火': { '土': '生', '金': '克', '水': '被克', '木': '被生', '火': '比和' },
      '土': { '金': '生', '水': '克', '木': '被克', '火': '被生', '土': '比和' },
      '金': { '水': '生', '木': '克', '火': '被克', '土': '被生', '金': '比和' },
      '水': { '木': '生', '火': '克', '土': '被克', '金': '被生', '水': '比和' }
    };
    return relations[wuxing1]?.[wuxing2] || '无关';
  }
  
  // 获取干支五行
  getGanZhiWuXing(ganzhi) {
    const ganWuxing = {
      '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
      '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
    };
    const zhiWuxing = {
      '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土',
      '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金',
      '戌': '土', '亥': '水'
    };
    return ganWuxing[ganzhi] || zhiWuxing[ganzhi] || null;
  }
  
  // 判断是否为三奇
  isSanQi(element) {
    return ['乙', '丙', '丁'].includes(element);
  }
  
  // 获取当前季节
  getCurrentSeason(date) {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return '春';
    if (month >= 5 && month <= 7) return '夏';
    if (month >= 8 && month <= 10) return '秋';
    return '冬';
  }
  
  /**
   * 奇门遁甲分析主函数
   * @param {Object} inputData - 输入数据
   * @param {string} inputData.question - 占卜问题
   * @param {number} inputData.user_id - 用户ID
   * @param {Object} inputData.birth_data - 出生数据（可选）
   * @param {string} inputData.datetime - 起局时间（可选，默认当前时间）
   * @returns {Object} 奇门遁甲分析结果
   */
  performQimenAnalysis(inputData) {
    try {
      // 输入参数验证
      if (!inputData || typeof inputData !== 'object') {
        throw new Error('输入数据无效：必须提供有效的输入对象');
      }
      
      const { question, user_id, birth_data, datetime } = inputData;
      
      // 验证必要参数
      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        throw new Error('输入数据无效：问题不能为空');
      }
      
      if (question.length > 200) {
        throw new Error('输入数据无效：问题长度不能超过200个字符');
      }
      
      if (user_id !== undefined && (!Number.isInteger(user_id) || user_id <= 0)) {
        throw new Error('输入数据无效：用户ID必须是正整数');
      }
      
      // 检查缓存
      const cachedResult = this.cache.get('qimen', inputData);
      if (cachedResult) {
        return cachedResult;
      }
      
      const currentTime = datetime ? new Date(datetime) : new Date();
      
      // 起局
      const qimenPan = this.calculator.calculateQimenPan(currentTime);
      
      // 选择用神
      const yongShen = this.yongShenAnalyzer.selectYongShen(question, birth_data, qimenPan);
      
      // 格局分析
      const patterns = this.patternAnalyzer.analyzePatterns(qimenPan);
      
      // 用神分析
      const yongShenAnalysis = this.yongShenAnalyzer.analyzeYongShen(yongShen, qimenPan);
      
      // 生成预测结果
      const prediction = this.predictionGenerator.generatePrediction(qimenPan, yongShenAnalysis, question, patterns);
      
      const result = {
        analysis_type: 'qimen',
        analysis_date: currentTime.toISOString(),
        basic_info: {
          divination_data: {
            question: question.trim(),
            divination_time: currentTime.toISOString(),
            method: '时家奇门',
            lunar_info: this.calculateLunarInfo(currentTime)
          },
          qimen_info: {
            jieqi: qimenPan.timeInfo?.jieqi || '未知',
            yuan: qimenPan.timeInfo?.yuan || '未知',
            jushu: qimenPan.timeInfo?.jushu || qimenPan.jushu || '未知',
            yindun: qimenPan.timeInfo?.yindun !== undefined ? (qimenPan.timeInfo.yindun ? '阴遁' : '阳遁') : (qimenPan.yindun ? '阴遁' : '阳遁'),
            zhifu: qimenPan.zhifu || '未知',
            zhishi: qimenPan.zhishi || '未知',
            ganzhi: {
              year: qimenPan.timeInfo?.year || { gan: '未知', zhi: '未知' },
              month: qimenPan.timeInfo?.month || { gan: '未知', zhi: '未知' },
              day: qimenPan.timeInfo?.day || { gan: '未知', zhi: '未知' },
              hour: qimenPan.timeInfo?.hour || { gan: '未知', zhi: '未知' }
            }
          }
        },
        detailed_analysis: {
          qimen_pan: {
            dipan: qimenPan.dipan,
            tianpan: qimenPan.tianpan,
            structure_analysis: this.analyzePanStructure(qimenPan)
          },
          yongshen_analysis: yongShenAnalysis,
          pattern_analysis: patterns,
          wuxing_analysis: this.analyzeWuXing(qimenPan),
          timing_analysis: this.analyzeTimingFactors(qimenPan, currentTime)
        },
        prediction_result: prediction,
        guidance: {
          key_message: prediction.overall,
          action_advice: prediction.suggestions,
          timing_guidance: prediction.timing,
          success_probability: prediction.probability
        }
      };
      
      // 存储到缓存
      this.cache.set('qimen', inputData, result);
      return result;
      
    } catch (error) {
      console.error('奇门遁甲分析详细错误:', error);
      throw error;
    }
  }

  // 计算奇门盘
  calculateQimenPan(datetime) {
    const timeInfo = this.calculateTimeInfo(datetime);
    const dipan = this.calculateDiPan(timeInfo);
    const tianpan = this.calculateTianPan(dipan, timeInfo);
    const { zhifu, zhishi } = this.calculateZhiFuZhiShi(dipan, tianpan, timeInfo);
    
    return {
      timeInfo,
      dipan,
      tianpan,
      zhifu,
      zhishi
    };
  }

  // 计算时间信息
  calculateTimeInfo(datetime) {
    const year = datetime.getFullYear();
    const month = datetime.getMonth() + 1;
    const day = datetime.getDate();
    const hour = datetime.getHours();
    
    // 转换为干支
    const yearGZ = this.getYearGanZhi(year);
    const monthGZ = this.getMonthGanZhiByDate(datetime);
    const dayGZ = this.getDayGanZhi(datetime);
    const hourGZ = this.getHourGanZhi(hour, dayGZ.gan);
    
    // 计算节气
    const jieqi = this.calculateJieQi(datetime);
    const yuan = this.calculateYuan(datetime, jieqi);
    const { jushu, yindun } = this.calculateJuShu(jieqi, yuan);
    
    return {
      year: yearGZ,
      month: monthGZ,
      day: dayGZ,
      hour: hourGZ,
      jieqi: jieqi.name,
      yuan,
      jushu,
      yindun
    };
  }

  // 计算地盘
  calculateDiPan(timeInfo) {
    const dipan = new Array(9).fill(null).map(() => ({
      ganzhi: null,
      star: null,
      door: null,
      god: null
    }));
    
    // 排三奇六仪
    this.arrangeSanQiLiuYi(dipan, timeInfo.jushu, timeInfo.yindun);
    
    // 排九星
    this.arrangeJiuXing(dipan, timeInfo.jushu);
    
    // 排八门
    this.arrangeBaMen(dipan, timeInfo.hour.zhi);
    
    // 排八神
    this.arrangeBaShen(dipan, timeInfo.yindun);
    
    return dipan;
  }

  // 计算天盘
  calculateTianPan(dipan, timeInfo) {
    const tianpan = new Array(9).fill(null).map(() => ({
      ganzhi: null,
      star: null,
      door: null,
      god: null
    }));
    
    // 找到时干在地盘的位置
    const shiganPosition = this.findShiganPosition(dipan, timeInfo.hour.gan);
    
    // 按阴阳遁规律排列天盘
    if (timeInfo.yindun) {
      this.arrangeYindunTianpan(tianpan, dipan, shiganPosition);
    } else {
      this.arrangeYangdunTianpan(tianpan, dipan, shiganPosition);
    }
    
    return tianpan;
  }

  // 计算值符值使
  calculateZhiFuZhiShi(dipan, tianpan, timeInfo) {
    // 值符随时干
    const shiganPosition = this.findShiganPosition(dipan, timeInfo.hour.gan);
    const zhifu = dipan[shiganPosition].star;
    
    // 值使随时支
    const zhizhiPosition = this.findZhizhiPosition(dipan, timeInfo.hour.zhi);
    const zhishi = dipan[zhizhiPosition].door;
    
    return { zhifu, zhishi };
  }

  // 选择用神
  selectYongShen(question, birthData, qimenPan) {
    const yongshen = {};
    
    // 基础用神
    yongshen.rigan = qimenPan.timeInfo.day.gan; // 日干代表求测人
    
    // 根据问题类型选择特殊用神
    const questionType = this.classifyQuestion(question);
    
    switch (questionType) {
      case '婚姻':
        yongshen.self = '乙'; // 女方
        yongshen.spouse = '庚'; // 男方
        yongshen.matchmaker = '六合';
        break;
        
      case '求财':
        yongshen.wealth = '生门';
        yongshen.capital = '戊';
        yongshen.opportunity = '开门';
        break;
        
      case '疾病':
        yongshen.illness = '天芮';
        yongshen.doctor = '天心';
        yongshen.medicine = '乙';
        break;
        
      case '官司':
        yongshen.lawsuit = '景门';
        yongshen.judge = '值符';
        yongshen.opponent = this.getOpponentYongshen(yongshen.rigan);
        break;
        
      case '求职':
        yongshen.job = '开门';
        yongshen.company = '值符';
        yongshen.process = '值使';
        break;
        
      default:
        yongshen.matter = '时干';
        yongshen.result = '值使';
    }
    
    return yongshen;
  }

  // 分析格局
  analyzePatterns(qimenPan) {
    const patterns = [];
    
    // 分析三奇格局
    patterns.push(...this.analyzeSanQiPatterns(qimenPan));
    
    // 分析六仪格局
    patterns.push(...this.analyzeLiuYiPatterns(qimenPan));
    
    // 分析特殊格局
    patterns.push(...this.analyzeSpecialPatterns(qimenPan));
    
    return patterns;
  }

  // 分析用神
  analyzeYongShen(yongshen, qimenPan) {
    const analysis = {};
    
    for (const [key, value] of Object.entries(yongshen)) {
      const position = this.findYongShenPosition(value, qimenPan);
      if (position !== -1) {
        analysis[key] = {
          position,
          palace: this.JIUGONG[position + 1].name,
          wangshui: this.calculateWangShui(value, qimenPan.timeInfo),
          door: qimenPan.tianpan[position].door,
          star: qimenPan.tianpan[position].star,
          god: qimenPan.tianpan[position].god,
          status: this.evaluateYongShenStatus(position, qimenPan)
        };
      }
    }
    
    return analysis;
  }

  // 生成预测结果
  /**
   * 生成预测结果
   * @param {Object} qimenPan - 奇门盘
   * @param {Object} yongShenAnalysis - 用神分析
   * @param {string} question - 问题描述
   * @param {Array} patterns - 格局列表
   * @returns {Object} 预测结果
   */
  generatePrediction(qimenPan, yongShenAnalysis, question, patterns) {
    // 计算应期
    const timing = this.calculateTiming(qimenPan, yongShenAnalysis, patterns);
    
    // 计算成功概率
    const probability = this.calculateProbability(yongShenAnalysis, patterns);
    
    // 生成整体评价
    const overall = this.generateOverallAssessment(probability, yongShenAnalysis);
    
    // 生成详细分析
    const details = this.generateDetailedAnalysis(qimenPan, yongShenAnalysis, patterns);
    
    // 生成建议
    const suggestions = this.generateSuggestions(yongShenAnalysis, patterns, timing);
    
    return {
      overall,
      probability,
      details,
      suggestions,
      timing: timing.description,
      timingDetails: timing,
      favorableTime: timing.favorableTime,
      unfavorableTime: timing.unfavorableTime
    };
  }
  
  /**
   * 计算应期
   * @param {Object} qimenPan - 奇门盘
   * @param {Object} yongShenAnalysis - 用神分析
   * @param {Array} patterns - 格局列表
   * @returns {Object} 应期分析
   */
  calculateTiming(qimenPan, yongShenAnalysis, patterns) {
    const timingFactors = [];
    
    // 基于用神旺衰的应期
    const yongShenTiming = this.calculateYongShenTiming(yongShenAnalysis);
    timingFactors.push(yongShenTiming);
    
    // 基于格局的应期
    const patternTiming = this.calculatePatternTiming(patterns);
    timingFactors.push(patternTiming);
    
    // 基于节气的应期
    const seasonalTiming = this.calculateSeasonalTiming(qimenPan);
    timingFactors.push(seasonalTiming);
    
    // 基于值符值使的应期
    const zhifuzhishiTiming = this.calculateZhifuzhishiTiming(qimenPan);
    timingFactors.push(zhifuzhishiTiming);
    
    // 综合应期判断
    return this.synthesizeTiming(timingFactors);
  }
  
  /**
   * 基于用神计算应期
   * @param {Object} yongShenAnalysis - 用神分析
   * @returns {Object} 用神应期
   */
  calculateYongShenTiming(yongShenAnalysis) {
    const { overall } = yongShenAnalysis;
    
    if (overall.favorability >= 70) {
      return {
        type: '用神应期',
        timing: '近期',
        score: 3,
        description: '用神状态佳，近期有利',
        timeframe: '1-3个月'
      };
    } else if (overall.favorability >= 50) {
      return {
        type: '用神应期',
        timing: '中期',
        score: 1,
        description: '用神状态中等，需等待时机',
        timeframe: '3-6个月'
      };
    } else {
      return {
        type: '用神应期',
        timing: '远期',
        score: -1,
        description: '用神状态不佳，需长期等待',
        timeframe: '6个月以上'
      };
    }
  }
  
  /**
   * 基于格局计算应期
   * @param {Array} patterns - 格局列表
   * @returns {Object} 格局应期
   */
  calculatePatternTiming(patterns) {
    if (!patterns || patterns.length === 0) {
      return {
        type: '格局应期',
        timing: '中期',
        score: 0,
        description: '无明显格局，时机平常',
        timeframe: '3-6个月'
      };
    }
    
    // 找到最重要的格局
    const topPattern = patterns[0];
    
    if (topPattern.score >= 20) {
      return {
        type: '格局应期',
        timing: '近期',
        score: 3,
        description: `${topPattern.name}格局大吉，近期应验`,
        timeframe: '1-2个月'
      };
    } else if (topPattern.score >= 10) {
      return {
        type: '格局应期',
        timing: '中期',
        score: 2,
        description: `${topPattern.name}格局较吉，中期应验`,
        timeframe: '2-4个月'
      };
    } else if (topPattern.score <= -10) {
      return {
        type: '格局应期',
        timing: '不利',
        score: -2,
        description: `${topPattern.name}格局不利，需避开`,
        timeframe: '暂不宜行动'
      };
    } else {
      return {
        type: '格局应期',
        timing: '中期',
        score: 0,
        description: '格局平常，时机一般',
        timeframe: '3-6个月'
      };
    }
  }
  
  /**
   * 基于节气计算应期
   * @param {Object} qimenPan - 奇门盘
   * @returns {Object} 节气应期
   */
  calculateSeasonalTiming(qimenPan) {
    const currentSeason = this.analyzer.getCurrentSeason(new Date());
    const nextSeason = this.getNextSeason(currentSeason);
    
    // 根据当前节气判断应期
    const seasonalStrength = this.getSeasonalStrength(qimenPan, currentSeason);
    
    if (seasonalStrength >= 2) {
      return {
        type: '节气应期',
        timing: '当季',
        score: 2,
        description: `${currentSeason}季有利，当季应验`,
        timeframe: '本季度内'
      };
    } else if (seasonalStrength <= -2) {
      return {
        type: '节气应期',
        timing: '来季',
        score: 1,
        description: `${currentSeason}季不利，${nextSeason}季转机`,
        timeframe: '下个季度'
      };
    } else {
      return {
        type: '节气应期',
        timing: '平常',
        score: 0,
        description: '节气影响平常',
        timeframe: '不受季节限制'
      };
    }
  }
  
  /**
   * 基于值符值使计算应期
   * @param {Object} qimenPan - 奇门盘
   * @returns {Object} 值符值使应期
   */
  calculateZhifuzhishiTiming(qimenPan) {
    const zhifuzhishiInfo = qimenPan.details;
    
    if (!zhifuzhishiInfo || !zhifuzhishiInfo.relationship) {
      return {
        type: '值符值使应期',
        timing: '中期',
        score: 0,
        description: '值符值使关系平常',
        timeframe: '3-6个月'
      };
    }
    
    const { relationship } = zhifuzhishiInfo;
    
    if (relationship.isHarmony) {
      return {
        type: '值符值使应期',
        timing: '近期',
        score: 2,
        description: '值符值使和谐，近期有利',
        timeframe: '1-3个月'
      };
    } else {
      return {
        type: '值符值使应期',
        timing: '中期',
        score: -1,
        description: '值符值使不和，需等待时机',
        timeframe: '3-6个月'
      };
    }
  }
  
  /**
   * 综合应期判断
   * @param {Array} timingFactors - 应期因素
   * @returns {Object} 综合应期
   */
  synthesizeTiming(timingFactors) {
    const totalScore = timingFactors.reduce((sum, factor) => sum + factor.score, 0);
    const averageScore = totalScore / timingFactors.length;
    
    let mainTiming, description, timeframe;
    
    if (averageScore >= 2) {
      mainTiming = '近期';
      description = '多项因素有利，近期应验';
      timeframe = '1-3个月';
    } else if (averageScore >= 1) {
      mainTiming = '中近期';
      description = '整体趋势向好，中近期应验';
      timeframe = '2-4个月';
    } else if (averageScore >= 0) {
      mainTiming = '中期';
      description = '时机平常，中期应验';
      timeframe = '3-6个月';
    } else if (averageScore >= -1) {
      mainTiming = '中远期';
      description = '需要等待，中远期应验';
      timeframe = '6-12个月';
    } else {
      mainTiming = '远期';
      description = '时机不利，需长期等待';
      timeframe = '12个月以上';
    }
    
    // 确定有利和不利时间
    const favorableTime = this.getFavorableTime(timingFactors);
    const unfavorableTime = this.getUnfavorableTime(timingFactors);
    
    return {
      description,
      mainTiming,
      timeframe,
      score: averageScore,
      factors: timingFactors,
      favorableTime,
      unfavorableTime
    };
  }
  
  /**
   * 获取有利时间
   * @param {Array} timingFactors - 应期因素
   * @returns {Array} 有利时间列表
   */
  getFavorableTime(timingFactors) {
    const favorableFactors = timingFactors.filter(factor => factor.score > 0);
    
    return favorableFactors.map(factor => ({
      period: factor.timeframe,
      reason: factor.description,
      strength: factor.score
    }));
  }
  
  /**
   * 获取不利时间
   * @param {Array} timingFactors - 应期因素
   * @returns {Array} 不利时间列表
   */
  getUnfavorableTime(timingFactors) {
    const unfavorableFactors = timingFactors.filter(factor => factor.score < 0);
    
    return unfavorableFactors.map(factor => ({
      period: factor.timeframe,
      reason: factor.description,
      strength: Math.abs(factor.score)
    }));
  }
  
  /**
   * 获取下个季节
   * @param {string} currentSeason - 当前季节
   * @returns {string} 下个季节
   */
  getNextSeason(currentSeason) {
    const seasonCycle = ['春', '夏', '秋', '冬'];
    const currentIndex = seasonCycle.indexOf(currentSeason);
    return seasonCycle[(currentIndex + 1) % 4];
  }
  
  /**
   * 获取节气强度
   * @param {Object} qimenPan - 奇门盘
   * @param {string} season - 季节
   * @returns {number} 节气强度
   */
  getSeasonalStrength(qimenPan, season) {
    // 简化的节气强度计算
    const seasonWuxingMap = {
      '春': '木',
      '夏': '火',
      '秋': '金',
      '冬': '水'
    };
    
    const seasonWuxing = seasonWuxingMap[season];
    let strength = 0;
    
    // 检查主要用神与季节的关系
    if (qimenPan.timeInfo && qimenPan.timeInfo.day) {
      const riganWuxing = this.analyzer.getGanZhiWuXing(qimenPan.timeInfo.day.gan);
      if (riganWuxing) {
        const relation = this.analyzer.getWuXingRelation(seasonWuxing, riganWuxing);
        if (relation === '生') strength += 2;
        else if (relation === '比和') strength += 1;
        else if (relation === '克') strength -= 2;
      }
    }
    
    return strength;
  }
  
  /**
   * 计算成功概率
   * @param {Object} yongShenAnalysis - 用神分析
   * @param {Array} patterns - 格局列表
   * @returns {number} 成功概率（0-100）
   */
  calculateProbability(yongShenAnalysis, patterns) {
    let baseProbability = 50; // 基础概率
    
    // 基于用神分析调整概率
    if (yongShenAnalysis && yongShenAnalysis.overall) {
      const favorability = yongShenAnalysis.overall.favorability;
      if (typeof favorability === 'number') {
        baseProbability = favorability;
      } else {
        // 如果没有favorability，基于用神旺衰计算
        let yongShenScore = 0;
        let yongShenCount = 0;
        
        // 遍历所有用神分析
        ['primary', 'secondary', 'auxiliary'].forEach(category => {
          if (yongShenAnalysis[category]) {
            Object.values(yongShenAnalysis[category]).forEach(analysis => {
              if (analysis && analysis.wangshui) {
                yongShenCount++;
                switch (analysis.wangshui) {
                  case '旺': yongShenScore += 20; break;
                  case '相': yongShenScore += 10; break;
                  case '休': yongShenScore += 0; break;
                  case '囚': yongShenScore -= 10; break;
                  case '死': yongShenScore -= 20; break;
                }
              }
            });
          }
        });
        
        if (yongShenCount > 0) {
          baseProbability = 50 + (yongShenScore / yongShenCount);
        }
      }
    }
    
    // 根据格局调整概率
    if (patterns && patterns.length > 0) {
      const patternScore = patterns.reduce((sum, pattern) => {
        const score = pattern.score || 0;
        return sum + score;
      }, 0);
      
      // 格局影响权重调整
      const patternAdjustment = Math.min(Math.max(patternScore * 0.8, -25), 25);
      baseProbability += patternAdjustment;
    }
    
    // 确保概率在合理范围内
    return Math.min(Math.max(Math.round(baseProbability), 15), 85);
  }
  
  /**
   * 生成整体评价
   * @param {number} probability - 成功概率
   * @param {Object} yongShenAnalysis - 用神分析
   * @returns {string} 整体评价
   */
  generateOverallAssessment(probability, yongShenAnalysis) {
    if (probability >= 80) {
      return '非常有利，成功可能性很大';
    } else if (probability >= 70) {
      return '比较有利，成功可能性较大';
    } else if (probability >= 60) {
      return '相对有利，有一定成功可能';
    } else if (probability >= 50) {
      return '中等，需要努力争取';
    } else if (probability >= 40) {
      return '相对不利，需要谨慎行动';
    } else if (probability >= 30) {
      return '比较不利，建议暂缓行动';
    } else {
      return '很不利，不建议行动';
    }
  }

  // 计算综合评分
  calculateOverallScore(yongShenAnalysis, patterns) {
    let score = 50; // 基础分
    
    // 用神旺衰评分
    for (const [key, analysis] of Object.entries(yongShenAnalysis)) {
      switch (analysis.wangshui) {
        case '旺': score += 15; break;
        case '相': score += 10; break;
        case '休': score += 0; break;
        case '囚': score -= 10; break;
        case '死': score -= 15; break;
      }
    }
    
    // 格局评分
    for (const pattern of patterns) {
      switch (pattern.level) {
        case '大吉': score += 20; break;
        case '吉': score += 10; break;
        case '中': score += 0; break;
        case '凶': score -= 10; break;
        case '大凶': score -= 20; break;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  // 解释评分
  interpretScore(score) {
    if (score >= 80) return '大吉，事情非常顺利';
    if (score >= 65) return '较为有利，成功概率较高';
    if (score >= 50) return '中等，需要努力争取';
    if (score >= 35) return '较为困难，需要谨慎行事';
    return '不利，建议暂缓或改变策略';
  }

  // 辅助方法：计算农历信息（复用八字分析器的农历算法）
  calculateLunarInfo(datetime) {
    try {
      // 将datetime转换为日期字符串格式
      const date = new Date(datetime);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD格式
      
      // 复用八字分析器的农历计算功能
      const lunarInfo = this.baziAnalyzer.calculateLunarInfo(dateStr);
      
      return {
        year: lunarInfo.ganzhi_year,
        month: lunarInfo.lunar_month,
        day: lunarInfo.lunar_day,
        description: lunarInfo.lunar_date,
        zodiac: lunarInfo.zodiac,
        solar_term: lunarInfo.solar_term
      };
    } catch (error) {
      console.error('农历信息计算失败:', error);
      // 降级处理：返回基本信息
      return {
        year: '未知',
        month: '未知',
        day: '未知',
        description: '农历信息计算失败'
      };
    }
  }

  // 辅助方法：分类问题类型
  classifyQuestion(question) {
    const keywords = {
      '婚姻': ['婚姻', '结婚', '恋爱', '感情', '配偶', '对象'],
      '求财': ['财运', '投资', '生意', '赚钱', '收入', '财富'],
      '疾病': ['健康', '疾病', '治病', '医院', '身体', '病情'],
      '官司': ['官司', '诉讼', '法律', '纠纷', '争议', '法院'],
      '求职': ['工作', '求职', '面试', '职业', '就业', '跳槽']
    };
    
    for (const [type, words] of Object.entries(keywords)) {
      if (words.some(word => question.includes(word))) {
        return type;
      }
    }
    
    return '其他';
  }

  // 核心工具方法
  
  /**
   * 获取五行生克关系
   * @param {string} element1 - 第一个五行
   * @param {string} element2 - 第二个五行
   * @returns {string} 生克关系
   */
  getWuXingRelation(element1, element2) {
    if (!this.WUXING[element1] || !this.WUXING[element2]) {
      return '无关系';
    }
    
    if (this.WUXING[element1].sheng === element2) {
      return '生';
    } else if (this.WUXING[element1].ke === element2) {
      return '克';
    } else if (this.WUXING[element1].shengBy === element2) {
      return '被生';
    } else if (this.WUXING[element1].keBy === element2) {
      return '被克';
    } else if (element1 === element2) {
      return '比和';
    }
    
    return '无关系';
  }
  
  /**
   * 获取干支五行属性
   * @param {string} ganZhi - 天干或地支
   * @returns {string} 五行属性
   */
  getGanZhiWuXing(ganZhi) {
    return this.GANZHI_WUXING[ganZhi] || this.DIZHI_WUXING[ganZhi] || '未知';
  }
  
  /**
   * 判断是否为三奇
   * @param {string} gan - 天干
   * @returns {boolean} 是否为三奇
   */
  isSanQi(gan) {
    return ['乙', '丙', '丁'].includes(gan);
  }
  
  /**
   * 判断是否为六仪
   * @param {string} gan - 天干
   * @returns {boolean} 是否为六仪
   */
  isLiuYi(gan) {
    return ['戊', '己', '庚', '辛', '壬', '癸'].includes(gan);
  }
  
  /**
   * 获取宫位名称
   * @param {number} palace - 宫位数字(0-8)
   * @returns {string} 宫位名称
   */
  getPalaceName(palace) {
    return this.JIUGONG[palace + 1]?.name || '未知宫';
  }
  
  /**
   * 获取方位信息
   * @param {number} palace - 宫位数字(0-8)
   * @returns {string} 方位
   */
  getDirection(palace) {
    return this.JIUGONG[palace + 1]?.direction || '未知方位';
  }
  
  /**
   * 计算旺衰状态
   * @param {string} element - 五行
   * @param {string} season - 季节
   * @returns {string} 旺衰状态
   */
  calculateWangShuiByElement(element, season) {
    const elementData = this.WUXING[element];
    if (!elementData) return '未知';
    
    if (elementData.season === season) {
      return '旺';
    }
    
    // 相：我生者为相
    const shengElement = this.WUXING[elementData.sheng];
    if (shengElement && shengElement.season === season) {
      return '相';
    }
    
    // 休：生我者为休
    const shengByElement = this.WUXING[elementData.shengBy];
    if (shengByElement && shengByElement.season === season) {
      return '休';
    }
    
    // 囚：克我者为囚
    const keByElement = this.WUXING[elementData.keBy];
    if (keByElement && keByElement.season === season) {
      return '囚';
    }
    
    // 死：我克者为死
    const keElement = this.WUXING[elementData.ke];
    if (keElement && keElement.season === season) {
      return '死';
    }
    
    return '平';
  }
  
  /**
   * 获取当前季节
   * @param {Date} datetime - 日期时间
   * @returns {string} 季节
   */
  getCurrentSeason(datetime) {
    const month = datetime.getMonth() + 1;
    
    if (month >= 3 && month <= 5) return '春';
    if (month >= 6 && month <= 8) return '夏';
    if (month >= 9 && month <= 11) return '秋';
    return '冬';
  }
  
  // 时间转换方法（使用TimeConverter）
  getYearGanZhi(year) {
    return this.timeConverter.getYearGanZhi(year);
  }
  
  getMonthGanZhi(year, month) {
    return this.timeConverter.getMonthGanZhi(year, month);
  }
  
  getMonthGanZhiByDate(datetime) {
    return this.timeConverter.getMonthGanZhiByDate(datetime);
  }
  
  getDayGanZhi(datetime) {
    return this.timeConverter.getDayGanZhi(datetime);
  }
  
  getHourGanZhi(hour, dayGan) {
    return this.timeConverter.getHourGanZhi(hour, dayGan);
  }
  
  // 节气计算方法（使用SolarTerms）
  calculateJieQi(datetime) {
    return this.solarTerms.getCurrentSolarTerm(datetime);
  }
  
  calculateYuan(datetime, jieqi) {
    return this.solarTerms.calculateYuan(datetime, jieqi);
  }
  
  calculateJuShu(jieqi, yuan) {
    const solarTermData = this.SOLAR_TERMS[jieqi.name];
    if (!solarTermData) {
      throw new Error(`未知节气: ${jieqi.name}`);
    }
    
    const jushu = solarTermData.formula[yuan];
    const yindun = solarTermData.yindun;
    
    return { jushu, yindun };
  }
  
  /**
   * 排布三奇六仪到地盘
   * @param {Array} dipan - 地盘数组
   * @param {number} jushu - 局数
   * @param {boolean} yindun - 是否阴遁
   * @returns {Object} 排布信息和格局提示
   */
  arrangeSanQiLiuYi(dipan, jushu, yindun) {
    // 三奇六仪完整序列
    const ganzhiSequence = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
    const ganzhiTypes = ['六仪', '六仪', '六仪', '六仪', '六仪', '六仪', '三奇', '三奇', '三奇'];
    
    // 根据局数确定戊的起始位置
    const startPosition = this.getWuPositionByJushu(jushu);
    
    // 记录排布信息
    const arrangementInfo = {
      startPosition,
      yindun,
      jushu,
      ganzhiPositions: {},
      potentialPatterns: []
    };
    
    // 按照传统奇门遁甲规律排布
    for (let i = 0; i < 9; i++) {
      let position;
      
      if (yindun) {
        // 阴遁：逆时针排列
        position = (startPosition - i + 9) % 9;
      } else {
        // 阳遁：顺时针排列
        position = (startPosition + i) % 9;
      }
      
      if (dipan[position]) {
        const ganzhi = ganzhiSequence[i];
        dipan[position].ganzhi = ganzhi;
        dipan[position].ganzhiType = ganzhiTypes[i];
        dipan[position].ganzhiIndex = i;
        
        // 记录干支位置信息
        arrangementInfo.ganzhiPositions[ganzhi] = {
          palace: position,
          palaceName: this.getPalaceName(position),
          type: ganzhiTypes[i],
          wuxing: this.getGanZhiWuXing(ganzhi)
        };
        
        // 检查潜在格局
        this.checkPotentialPatterns(ganzhi, position, arrangementInfo);
      }
    }
    
    return arrangementInfo;
  }
  
  /**
   * 检查潜在的格局组合
   * @param {string} ganzhi - 当前干支
   * @param {number} position - 当前位置
   * @param {Object} arrangementInfo - 排布信息
   */
  checkPotentialPatterns(ganzhi, position, arrangementInfo) {
    const palaceName = this.getPalaceName(position);
    
    // 检查三奇特殊位置
    if (['乙', '丙', '丁'].includes(ganzhi)) {
      // 三奇到特定宫位的格局提示
      const specialPositions = {
        '乙': { '离宫': '日奇升殿', '坎宫': '日奇入墓' },
        '丙': { '离宫': '月奇升殿', '坎宫': '月奇入墓' },
        '丁': { '离宫': '星奇升殿', '坎宫': '星奇入墓' }
      };
      
      if (specialPositions[ganzhi] && specialPositions[ganzhi][palaceName]) {
        arrangementInfo.potentialPatterns.push({
          name: specialPositions[ganzhi][palaceName],
          type: '三奇格局',
          ganzhi,
          palace: position,
          palaceName
        });
      }
    }
    
    // 检查六仪特殊组合
    if (['戊', '己', '庚', '辛', '壬', '癸'].includes(ganzhi)) {
      // 六仪的特殊格局检查将在后续完善
      if (ganzhi === '戊' && palaceName === '中宫') {
        arrangementInfo.potentialPatterns.push({
          name: '戊居中宫',
          type: '六仪格局',
          ganzhi,
          palace: position,
          palaceName
        });
      }
    }
  }
  
  /**
   * 根据局数获取戊的位置
   * @param {number} jushu - 局数
   * @returns {number} 戊的位置(0-8)
   */
  getWuPositionByJushu(jushu) {
    // 局数对应戊的位置（按照奇门遁甲传统规律）
    const wuPositions = {
      1: 0, // 一局戊在坎宫
      2: 1, // 二局戊在坤宫
      3: 2, // 三局戊在震宫
      4: 3, // 四局戊在巽宫
      5: 4, // 五局戊在中宫
      6: 5, // 六局戊在乾宫
      7: 6, // 七局戊在兑宫
      8: 7, // 八局戊在艮宫
      9: 8  // 九局戊在离宫
    };
    
    return wuPositions[jushu] !== undefined ? wuPositions[jushu] : 0;
  }
  
  /**
   * 排布九星到地盘
   * @param {Array} dipan - 地盘数组
   * @param {number} jushu - 局数
   * @param {boolean} yindun - 是否阴遁
   * @returns {Object} 九星排布信息
   */
  arrangeJiuXing(dipan, jushu, yindun) {
    // 九星序列（按洛书顺序）
    const stars = ['天蓬', '天任', '天冲', '天辅', '天英', '天芮', '天柱', '天心', '天禽'];
    const starWuxing = ['水', '土', '木', '木', '火', '土', '金', '金', '土'];
    const starNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    // 根据局数和阴阳遁确定天英星的位置
    const tianYingPosition = this.getTianYingPositionByJushu(jushu, yindun);
    
    const starInfo = {
      tianYingPosition,
      starPositions: {},
      starRelations: []
    };
    
    // 排布九星
    for (let i = 0; i < 9; i++) {
      let position;
      
      if (yindun) {
        // 阴遁：从天英星位置逆时针排列
        position = (tianYingPosition - (i - 4) + 9) % 9;
      } else {
        // 阳遁：从天英星位置顺时针排列
        position = (tianYingPosition + (i - 4) + 9) % 9;
      }
      
      if (dipan[position]) {
        const star = stars[i];
        dipan[position].star = star;
        dipan[position].starWuxing = starWuxing[i];
        dipan[position].starNumber = starNumbers[i];
        
        // 记录星位信息
        starInfo.starPositions[star] = {
          palace: position,
          palaceName: this.getPalaceName(position),
          wuxing: starWuxing[i],
          number: starNumbers[i],
          isZhifu: false // 将在值符计算时更新
        };
        
        // 分析星宫关系
        this.analyzeStarPalaceRelation(star, position, starInfo);
      }
    }
    
    return starInfo;
  }
  
  /**
   * 分析星宫关系
   * @param {string} star - 星名
   * @param {number} position - 宫位
   * @param {Object} starInfo - 星位信息
   */
  analyzeStarPalaceRelation(star, position, starInfo) {
    const palaceName = this.getPalaceName(position);
    const starWuxing = this.JIUXING[star]?.element;
    const palaceWuxing = this.JIUGONG[position + 1]?.element;
    
    if (starWuxing && palaceWuxing) {
      const relation = this.getWuXingRelation(starWuxing, palaceWuxing);
      
      starInfo.starRelations.push({
        star,
        palace: position,
        palaceName,
        relation,
        starWuxing,
        palaceWuxing,
        isHarmony: ['生', '比和'].includes(relation)
      });
    }
  }
  
  /**
   * 根据局数获取天英星位置
   * @param {number} jushu - 局数
   * @param {boolean} yindun - 是否阴遁
   * @returns {number} 天英星位置(0-8)
   */
  getTianYingPositionByJushu(jushu, yindun) {
    // 天英星固定在离九宫（位置8），其他星按局数和阴阳遁排布
    // 这里返回的是整个九星排布的基准位置
    const basePositions = {
      1: 0, // 一局：坎宫为基准
      2: 1, // 二局：坤宫为基准
      3: 2, // 三局：震宫为基准
      4: 3, // 四局：巽宫为基准
      5: 4, // 五局：中宫为基准
      6: 5, // 六局：乾宫为基准
      7: 6, // 七局：兑宫为基准
      8: 7, // 八局：艮宫为基准
      9: 8  // 九局：离宫为基准
    };
    
    return basePositions[jushu] !== undefined ? basePositions[jushu] : 8;
  }
  
  /**
   * 排布八门到地盘
   * @param {Array} dipan - 地盘数组
   * @param {string} hourZhi - 时支
   * @param {boolean} yindun - 是否阴遁
   * @returns {Object} 八门排布信息
   */
  arrangeBaMen(dipan, hourZhi, yindun) {
    // 八门序列（按洛书顺序，跳过中宫）
    const doors = ['休门', '死门', '伤门', '杜门', '景门', '惊门', '开门', '生门'];
    const doorWuxing = ['水', '土', '木', '木', '火', '金', '金', '土'];
    const doorAttributes = ['吉', '凶', '凶', '凶', '凶', '凶', '大吉', '大吉'];
    
    // 根据时支确定值使门的位置
    const zhishiPosition = this.getZhishiPositionByZhi(hourZhi);
    
    const doorInfo = {
      zhishiPosition,
      zhishiDoor: null,
      doorPositions: {},
      doorRelations: []
    };
    
    // 八宫位置映射（跳过中宫）
    const palaceMapping = [0, 1, 2, 3, 5, 6, 7, 8]; // 跳过位置4（中宫）
    
    // 排布八门
    for (let i = 0; i < 8; i++) {
      let doorIndex;
      
      if (yindun) {
        // 阴遁：逆时针排列
        doorIndex = (zhishiPosition - i + 8) % 8;
      } else {
        // 阳遁：顺时针排列
        doorIndex = (zhishiPosition + i) % 8;
      }
      
      const position = palaceMapping[doorIndex];
      const door = doors[i];
      
      if (dipan[position]) {
        dipan[position].door = door;
        dipan[position].doorWuxing = doorWuxing[i];
        dipan[position].doorAttribute = doorAttributes[i];
        
        // 记录门位信息
        doorInfo.doorPositions[door] = {
          palace: position,
          palaceName: this.getPalaceName(position),
          wuxing: doorWuxing[i],
          attribute: doorAttributes[i],
          isZhishi: i === 0 // 第一个门是值使门
        };
        
        if (i === 0) {
          doorInfo.zhishiDoor = door;
        }
        
        // 分析门宫关系
        this.analyzeDoorPalaceRelation(door, position, doorInfo);
      }
    }
    
    // 中宫不排门
    if (dipan[4]) {
      dipan[4].door = null;
      dipan[4].doorWuxing = null;
      dipan[4].doorAttribute = null;
    }
    
    return doorInfo;
  }
  
  /**
   * 分析门宫关系
   * @param {string} door - 门名
   * @param {number} position - 宫位
   * @param {Object} doorInfo - 门位信息
   */
  analyzeDoorPalaceRelation(door, position, doorInfo) {
    const palaceName = this.getPalaceName(position);
    const doorWuxing = this.BAMEN[door]?.element;
    const palaceWuxing = this.JIUGONG[position + 1]?.element;
    
    if (doorWuxing && palaceWuxing) {
      const relation = this.getWuXingRelation(doorWuxing, palaceWuxing);
      
      doorInfo.doorRelations.push({
        door,
        palace: position,
        palaceName,
        relation,
        doorWuxing,
        palaceWuxing,
        isHarmony: ['生', '比和'].includes(relation)
      });
    }
  }
  
  /**
   * 根据地支获取值使门位置
   * @param {string} zhi - 地支
   * @returns {number} 值使门位置
   */
  getZhishiPositionByZhi(zhi) {
    // 地支对应的宫位
    const zhiPositions = {
      '子': 0, '丑': 1, '寅': 2, '卯': 2,
      '辰': 3, '巳': 3, '午': 8, '未': 1,
      '申': 6, '酉': 6, '戌': 7, '亥': 0
    };
    
    return zhiPositions[zhi] || 0;
  }
  
  /**
   * 排布八神到地盘
   * @param {Array} dipan - 地盘数组
   * @param {boolean} yindun - 是否阴遁
   * @returns {Object} 八神排布信息
   */
  arrangeBaShen(dipan, yindun) {
    const gods = ['值符', '螣蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'];
    const godAttributes = ['吉', '凶', '吉', '吉', '凶', '凶', '吉', '吉'];
    const godNatures = ['主', '辅', '阴', '和', '煞', '盗', '静', '动'];
    
    // 值符的位置（将在值符计算时确定，这里先用默认位置）
    const zhifuPosition = 0;
    
    const godInfo = {
      zhifuPosition,
      godPositions: {},
      godRelations: []
    };
    
    // 八宫位置映射（跳过中宫）
    const palaceMapping = [0, 1, 2, 3, 5, 6, 7, 8];
    
    // 排布八神
    for (let i = 0; i < 8; i++) {
      let godIndex;
      
      if (yindun) {
        // 阴遁：逆时针排列
        godIndex = (zhifuPosition - i + 8) % 8;
      } else {
        // 阳遁：顺时针排列
        godIndex = (zhifuPosition + i) % 8;
      }
      
      const position = palaceMapping[godIndex];
      const god = gods[i];
      
      if (dipan[position]) {
        dipan[position].god = god;
        dipan[position].godAttribute = godAttributes[i];
        dipan[position].godNature = godNatures[i];
        
        // 记录神位信息
        godInfo.godPositions[god] = {
          palace: position,
          palaceName: this.getPalaceName(position),
          attribute: godAttributes[i],
          nature: godNatures[i],
          isZhifu: i === 0 // 第一个神是值符
        };
        
        // 分析神宫关系
        this.analyzeGodPalaceRelation(god, position, godInfo);
      }
    }
    
    // 中宫不排神
    if (dipan[4]) {
      dipan[4].god = null;
      dipan[4].godAttribute = null;
      dipan[4].godNature = null;
    }
    
    return godInfo;
  }
  
  /**
   * 分析神宫关系
   * @param {string} god - 神名
   * @param {number} position - 宫位
   * @param {Object} godInfo - 神位信息
   */
  analyzeGodPalaceRelation(god, position, godInfo) {
    const palaceName = this.getPalaceName(position);
    const godData = this.BASHEN[god];
    
    if (godData) {
      godInfo.godRelations.push({
        god,
        palace: position,
        palaceName,
        attribute: godData.attribute || '中性',
        nature: godData.nature || '平',
        meaning: godData.meaning || '未知'
      });
    }
  }
  
  findShiganPosition(dipan, shigan) {
    return dipan.findIndex(item => item.ganzhi === shigan);
  }
  
  findZhizhiPosition(dipan, zhizhi) {
    // 通过地支找到对应的天干位置
    // 地支与宫位的对应关系（传统奇门遁甲中的地支定位）
    const zhizhiPalaceMap = {
      '子': 0, // 坎一宫
      '丑': 7, // 艮八宫
      '寅': 7, // 艮八宫
      '卯': 2, // 震三宫
      '辰': 3, // 巽四宫
      '巳': 3, // 巽四宫
      '午': 8, // 离九宫
      '未': 1, // 坤二宫
      '申': 1, // 坤二宫
      '酉': 6, // 兑七宫
      '戌': 5, // 乾六宫
      '亥': 5  // 乾六宫
    };
    
    // 首先尝试直接映射
    const directPosition = zhizhiPalaceMap[zhizhi];
    if (directPosition !== undefined) {
      return directPosition;
    }
    
    // 如果直接映射失败，在地盘中搜索包含该地支的位置
    for (let i = 0; i < dipan.length; i++) {
      const palace = dipan[i];
      if (palace && palace.ganzhi) {
        // 检查干支组合中是否包含目标地支
        if (palace.ganzhi.includes && palace.ganzhi.includes(zhizhi)) {
          return i;
        }
        // 检查地支部分
        if (typeof palace.ganzhi === 'string' && palace.ganzhi.length >= 2) {
          const zhi = palace.ganzhi.charAt(1); // 取第二个字符作为地支
          if (zhi === zhizhi) {
            return i;
          }
        }
        // 检查是否有单独的地支属性
        if (palace.zhi === zhizhi) {
          return i;
        }
      }
    }
    
    // 如果都找不到，返回默认位置（坎宫）
    return 0;
  }
  
  arrangeYindunTianpan(tianpan, dipan, shiganPosition) {
    // 阴遁天盘排列
    for (let i = 0; i < 9; i++) {
      tianpan[i] = { ...dipan[(shiganPosition + i) % 9] };
    }
  }
  
  arrangeYangdunTianpan(tianpan, dipan, shiganPosition) {
    // 阳遁天盘排列
    for (let i = 0; i < 9; i++) {
      tianpan[i] = { ...dipan[(shiganPosition + i) % 9] };
    }
  }
  
  analyzeSanQiPatterns(qimenPan) {
    // 分析三奇格局
    return [];
  }
  
  analyzeLiuYiPatterns(qimenPan) {
    // 分析六仪格局
    return [];
  }
  
  analyzeSpecialPatterns(qimenPan) {
    // 分析特殊格局
    return [];
  }
  
  findYongShenPosition(yongshen, qimenPan) {
    // 找到用神在盘中的位置
    return 0;
  }
  
  calculateWangShui(element, timeInfo) {
    // 获取元素五行
    const elementWuxing = this.getGanZhiWuXing(element);
    if (!elementWuxing) {
      return '休'; // 无法确定五行时返回休
    }
    
    // 根据节气计算旺衰
    const jieqi = timeInfo.jieqi || this.solarTerms.getCurrentSolarTerm(new Date()).name;
    
    // 节气对应的五行旺衰
    const seasonalWangshui = {
      // 春季 - 木旺火相土死金囚水休
      '立春': { '木': '旺', '火': '相', '土': '死', '金': '囚', '水': '休' },
      '雨水': { '木': '旺', '火': '相', '土': '死', '金': '囚', '水': '休' },
      '惊蛰': { '木': '旺', '火': '相', '土': '死', '金': '囚', '水': '休' },
      '春分': { '木': '旺', '火': '相', '土': '死', '金': '囚', '水': '休' },
      '清明': { '木': '旺', '火': '相', '土': '死', '金': '囚', '水': '休' },
      '谷雨': { '木': '旺', '火': '相', '土': '死', '金': '囚', '水': '休' },
      
      // 夏季 - 火旺土相金死水囚木休
      '立夏': { '火': '旺', '土': '相', '金': '死', '水': '囚', '木': '休' },
      '小满': { '火': '旺', '土': '相', '金': '死', '水': '囚', '木': '休' },
      '芒种': { '火': '旺', '土': '相', '金': '死', '水': '囚', '木': '休' },
      '夏至': { '火': '旺', '土': '相', '金': '死', '水': '囚', '木': '休' },
      '小暑': { '火': '旺', '土': '相', '金': '死', '水': '囚', '木': '休' },
      '大暑': { '火': '旺', '土': '相', '金': '死', '水': '囚', '木': '休' },
      
      // 秋季 - 金旺水相木死火囚土休
      '立秋': { '金': '旺', '水': '相', '木': '死', '火': '囚', '土': '休' },
      '处暑': { '金': '旺', '水': '相', '木': '死', '火': '囚', '土': '休' },
      '白露': { '金': '旺', '水': '相', '木': '死', '火': '囚', '土': '休' },
      '秋分': { '金': '旺', '水': '相', '木': '死', '火': '囚', '土': '休' },
      '寒露': { '金': '旺', '水': '相', '木': '死', '火': '囚', '土': '休' },
      '霜降': { '金': '旺', '水': '相', '木': '死', '火': '囚', '土': '休' },
      
      // 冬季 - 水旺木相火死土囚金休
      '立冬': { '水': '旺', '木': '相', '火': '死', '土': '囚', '金': '休' },
      '小雪': { '水': '旺', '木': '相', '火': '死', '土': '囚', '金': '休' },
      '大雪': { '水': '旺', '木': '相', '火': '死', '土': '囚', '金': '休' },
      '冬至': { '水': '旺', '木': '相', '火': '死', '土': '囚', '金': '休' },
      '小寒': { '水': '旺', '木': '相', '火': '死', '土': '囚', '金': '休' },
      '大寒': { '水': '旺', '木': '相', '火': '死', '土': '囚', '金': '休' }
    };
    
    const jieqiData = seasonalWangshui[jieqi];
    if (jieqiData && jieqiData[elementWuxing]) {
      return jieqiData[elementWuxing];
    }
    
    // 默认返回休
    return '休';
  }
  
  evaluateYongShenStatus(position, qimenPan) {
    if (position === -1) {
      return '未知';
    }
    
    const { dipan, tianpan, timeInfo } = qimenPan;
    const palace = dipan[position];
    
    if (!palace) {
      return '未知';
    }
    
    let score = 0;
    let factors = [];
    
    // 1. 检查宫位内的星门神组合
    const star = palace.star;
    const door = palace.door;
    const god = palace.god;
    
    // 吉星加分
    const auspiciousStars = ['天任', '天辅', '天心'];
    const inauspiciousStars = ['天蓬', '天冲', '天柱', '天芮'];
    
    if (auspiciousStars.includes(star)) {
      score += 20;
      factors.push(`${star}为吉星`);
    } else if (inauspiciousStars.includes(star)) {
      score -= 15;
      factors.push(`${star}为凶星`);
    }
    
    // 吉门加分
    const auspiciousDoors = ['开门', '休门', '生门'];
    const inauspiciousDoors = ['死门', '惊门', '伤门'];
    
    if (auspiciousDoors.includes(door)) {
      score += 15;
      factors.push(`${door}为吉门`);
    } else if (inauspiciousDoors.includes(door)) {
      score -= 12;
      factors.push(`${door}为凶门`);
    }
    
    // 吉神加分
    const auspiciousGods = ['值符', '六合', '太阴'];
    const inauspiciousGods = ['白虎', '螣蛇', '朱雀'];
    
    if (auspiciousGods.includes(god)) {
      score += 10;
      factors.push(`${god}为吉神`);
    } else if (inauspiciousGods.includes(god)) {
      score -= 8;
      factors.push(`${god}为凶神`);
    }
    
    // 2. 检查宫位本身的吉凶
    const palaceInfo = this.JIUGONG[position + 1];
    if (palaceInfo) {
      // 特殊宫位
      if (position === 4) { // 中宫
        score += 5;
        factors.push('居中宫，得中正之气');
      } else if ([0, 2, 6, 8].includes(position)) { // 四正宫
        score += 3;
        factors.push('居四正宫，位置较佳');
      }
    }
    
    // 3. 检查时间因素
    const hourZhi = timeInfo.hour.zhi;
    const auspiciousHours = ['子', '卯', '午', '酉'];
    if (auspiciousHours.includes(hourZhi)) {
      score += 5;
      factors.push('时辰有利');
    }
    
    // 4. 检查节气因素
    const jieqi = timeInfo.jieqi;
    const majorSolarTerms = ['春分', '夏至', '秋分', '冬至', '立春', '立夏', '立秋', '立冬'];
    if (majorSolarTerms.includes(jieqi)) {
      score += 3;
      factors.push('节气有利');
    }
    
    // 5. 综合评估
    let status, description;
    if (score >= 30) {
      status = '极佳';
      description = '用神状态极佳，各方面条件都很有利';
    } else if (score >= 20) {
      status = '很好';
      description = '用神状态很好，大部分条件有利';
    } else if (score >= 10) {
      status = '良好';
      description = '用神状态良好，条件较为有利';
    } else if (score >= 0) {
      status = '一般';
      description = '用神状态一般，需要谨慎行事';
    } else if (score >= -10) {
      status = '较差';
      description = '用神状态较差，存在不利因素';
    } else {
      status = '很差';
      description = '用神状态很差，多数条件不利';
    }
    
    return {
      status,
      score,
      description,
      factors,
      palace: {
        position,
        star,
        door,
        god,
        palaceName: this.JIUGONG[position + 1]?.name || '未知宫'
      }
    };
  }
  
  /**
   * 生成详细分析
   * @param {Object} qimenPan - 奇门盘
   * @param {Object} yongShenAnalysis - 用神分析
   * @param {Array} patterns - 格局列表
   * @returns {Object} 详细分析
   */
  generateDetailedAnalysis(qimenPan, yongShenAnalysis, patterns) {
    const analysis = {
      yongshen_status: this.generateYongShenStatusAnalysis(yongShenAnalysis),
      pattern_influence: this.generatePatternInfluenceAnalysis(patterns),
      palace_analysis: this.generatePalaceAnalysis(qimenPan),
      wuxing_balance: this.generateWuXingAnalysis(qimenPan),
      timing_factors: this.generateTimingAnalysis(qimenPan),
      overall_trend: this.generateOverallTrendAnalysis(yongShenAnalysis, patterns)
    };
    
    return analysis;
  }
  
  /**
   * 生成用神状态分析
   */
  generateYongShenStatusAnalysis(yongShenAnalysis) {
    if (!yongShenAnalysis || !yongShenAnalysis.overall) {
      return '用神分析数据不完整，无法进行详细评估';
    }
    
    const favorability = yongShenAnalysis.overall.favorability || 50;
    
    if (favorability >= 80) {
      return '用神状态极佳，各项要素配合得当，时机非常有利，建议积极行动';
    } else if (favorability >= 65) {
      return '用神状态良好，大部分要素较为有利，整体趋势向好，可以适度推进';
    } else if (favorability >= 50) {
      return '用神状态一般，有利不利因素并存，需要谨慎评估，稳步前进';
    } else if (favorability >= 35) {
      return '用神状态偏弱，不利因素较多，建议暂缓行动，等待更好时机';
    } else {
      return '用神状态不佳，阻力较大，不宜贸然行动，应重新规划策略';
    }
  }
  
  /**
   * 生成格局影响分析
   */
  generatePatternInfluenceAnalysis(patterns) {
    if (!patterns || patterns.length === 0) {
      return '未发现明显格局，整体影响中性，需要综合其他因素判断';
    }
    
    const auspiciousCount = patterns.filter(p => p.level === '吉' || p.level === '大吉').length;
    const inauspiciousCount = patterns.filter(p => p.level === '凶' || p.level === '大凶').length;
    
    if (auspiciousCount > inauspiciousCount) {
      return `发现${auspiciousCount}个吉利格局，${inauspiciousCount}个不利格局，整体格局偏向有利，可以借助吉格之力推进事情发展`;
    } else if (inauspiciousCount > auspiciousCount) {
      return `发现${inauspiciousCount}个不利格局，${auspiciousCount}个吉利格局，需要化解凶格影响，谨慎行事避免不利后果`;
    } else {
      return `吉凶格局数量相当，影响相互抵消，整体趋势平稳，需要依靠个人努力创造机会`;
    }
  }
  
  /**
   * 生成宫位分析
   */
  generatePalaceAnalysis(qimenPan) {
    if (!qimenPan || !qimenPan.dipan) {
      return '奇门盘数据不完整，无法进行宫位分析';
    }
    
    const palaceNames = ['坎宫', '坤宫', '震宫', '巽宫', '中宫', '乾宫', '兑宫', '艮宫', '离宫'];
    const activePalaces = [];
    
    for (let i = 0; i < 9; i++) {
      const palace = qimenPan.dipan[i];
      if (palace && (palace.star || palace.door || palace.god)) {
        activePalaces.push(palaceNames[i]);
      }
    }
    
    return `当前奇门盘中${activePalaces.join('、')}等宫位较为活跃，星门神配置完整，形成了相对稳定的能量分布格局`;
  }
  
  /**
   * 生成五行分析
   */
  generateWuXingAnalysis(qimenPan) {
    const wuxingCount = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
    
    if (qimenPan && qimenPan.dipan) {
      for (let i = 0; i < 9; i++) {
        const palace = qimenPan.dipan[i];
        if (palace && palace.gan) {
          const wuxing = this.getGanZhiWuXing(palace.gan);
          if (wuxingCount[wuxing] !== undefined) {
            wuxingCount[wuxing]++;
          }
        }
      }
    }
    
    const maxWuxing = Object.keys(wuxingCount).reduce((a, b) => wuxingCount[a] > wuxingCount[b] ? a : b);
    const total = Object.values(wuxingCount).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
      return { dominant: '未知', balance: '无法判断', suggestions: '数据不足，无法分析' };
    }
    
    const dominantRatio = wuxingCount[maxWuxing] / total;
    let balance, suggestions;
    
    if (dominantRatio >= 0.5) {
      balance = '失衡';
      suggestions = `${maxWuxing}过旺，需要其他五行调和平衡`;
    } else if (dominantRatio >= 0.3) {
      balance = '较为平衡';
      suggestions = `${maxWuxing}稍强，整体尚可，注意维持平衡`;
    } else {
      balance = '平衡';
      suggestions = '五行分布均匀，相互制约，整体和谐';
    }
    
    return { dominant: maxWuxing, balance, suggestions };
  }
  
  /**
   * 生成时机分析
   */
  generateTimingAnalysis(qimenPan) {
    const currentDate = new Date();
    const season = this.getCurrentSeason(currentDate);
    
    let favorability, notes;
    
    switch (season) {
      case '春季':
        favorability = '有利';
        notes = '春季木旺，万物复苏，利于新的开始和发展';
        break;
      case '夏季':
        favorability = '较为有利';
        notes = '夏季火旺，阳气充沛，利于积极行动和扩展';
        break;
      case '秋季':
        favorability = '中等';
        notes = '秋季金旺，收获季节，利于总结和巩固成果';
        break;
      case '冬季':
        favorability = '需谨慎';
        notes = '冬季水旺，宜蛰伏养精，不宜大动作';
        break;
      default:
        favorability = '中等';
        notes = '时机平常，需要综合其他因素判断';
    }
    
    return { season, favorability, notes };
  }
  
  /**
   * 生成整体趋势分析
   */
  generateOverallTrendAnalysis(yongShenAnalysis, patterns) {
    const favorability = yongShenAnalysis?.overall?.favorability || 50;
    const patternScore = patterns ? patterns.reduce((sum, p) => sum + (p.score || 0), 0) : 0;
    
    const totalScore = favorability + patternScore;
    
    if (totalScore >= 80) {
      return '整体趋势非常积极，各项因素配合良好，成功概率很高，建议抓住机会全力推进';
    } else if (totalScore >= 60) {
      return '整体趋势较为积极，大部分因素有利，有较好的成功基础，可以稳步推进';
    } else if (totalScore >= 40) {
      return '整体趋势中性偏好，有利不利因素并存，需要谨慎规划，稳中求进';
    } else if (totalScore >= 20) {
      return '整体趋势偏向不利，阻力较大，建议暂缓行动，寻找更好时机';
    } else {
      return '整体趋势不佳，不利因素较多，不建议贸然行动，应重新评估策略';
    }
  }
  
  /**
   * 获取当前季节
   */
  getCurrentSeason(date) {
    const month = date.getMonth() + 1;
    
    if (month >= 3 && month <= 5) {
      return '春季';
    } else if (month >= 6 && month <= 8) {
      return '夏季';
    } else if (month >= 9 && month <= 11) {
      return '秋季';
    } else {
      return '冬季';
    }
  }
  
  /**
   * 生成建议
   * @param {Object} yongShenAnalysis - 用神分析
   * @param {Array} patterns - 格局列表
   * @param {Object} timing - 应期分析
   * @returns {Array} 建议列表
   */
  generateSuggestions(yongShenAnalysis, patterns, timing) {
    const suggestions = [];
    
    // 基于用神状态的建议
    if (yongShenAnalysis && yongShenAnalysis.overall) {
      const favorability = yongShenAnalysis.overall.favorability || 50;
      
      if (favorability >= 70) {
        suggestions.push('用神得力，时机有利，可以积极主动地推进计划');
        suggestions.push('抓住当前的有利时机，果断行动，成功概率较高');
      } else if (favorability >= 50) {
        suggestions.push('用神状态一般，需要谨慎评估，稳步推进');
        suggestions.push('可以适度行动，但要做好充分准备和风险控制');
      } else {
        suggestions.push('用神不利，建议暂缓行动，等待更好的时机');
        suggestions.push('当前阻力较大，宜以守为攻，积蓄力量');
      }
    }
    
    // 基于格局的建议
    if (patterns && patterns.length > 0) {
      const auspiciousPatterns = patterns.filter(p => p.level === '吉' || p.level === '大吉');
      const inauspiciousPatterns = patterns.filter(p => p.level === '凶' || p.level === '大凶');
      
      if (auspiciousPatterns.length > inauspiciousPatterns.length) {
        suggestions.push('格局组合整体有利，可以借助贵人力量，寻求合作机会');
        suggestions.push('吉格当头，宜主动出击，把握机遇，扩大成果');
      } else if (inauspiciousPatterns.length > 0) {
        suggestions.push('存在不利格局，需要化解阻碍，避免冲动行事');
        suggestions.push('凶格影响，宜低调行事，避免锋芒太露，以免招致麻烦');
      }
    }
    
    // 基于应期的建议
    if (timing && timing.mainTiming) {
      switch (timing.mainTiming) {
        case '近期':
          suggestions.push('应期在即，宜抓紧时间行动，不可错失良机');
          break;
        case '中期':
          suggestions.push('需要耐心等待，做好充分准备，时机成熟时再行动');
          break;
        case '远期':
          suggestions.push('应期较远，宜长远规划，循序渐进，不可急于求成');
          break;
      }
    }
    
    // 通用建议
    suggestions.push('保持积极心态，相信自己的判断，同时要灵活应变');
    suggestions.push('多与有经验的人交流，听取不同意见，完善行动方案');
    
    return suggestions;
  }
  
  calculateTiming(yongShenAnalysis, qimenPan) {
    // 计算应期
    return {
      bestTime: '近期',
      avoidTime: '无特别禁忌'
    };
  }
  
  getOpponentYongshen(rigan) {
    // 获取对手用神
    const opposites = {
      '甲': '庚', '乙': '辛', '丙': '壬', '丁': '癸', '戊': '甲',
      '己': '乙', '庚': '甲', '辛': '乙', '壬': '丙', '癸': '丁'
    };
    return opposites[rigan] || '庚';
  }
  
  analyzePanStructure(qimenPan) {
    // 分析盘面结构
    return {
      overall: '结构平衡',
      strengths: ['用神得力'],
      weaknesses: ['需注意时机']
    };
  }
  
  analyzeWuXing(qimenPan) {
    // 分析五行
    return {
      dominant: '金',
      balance: '较为平衡',
      suggestions: ['注意水火调和']
    };
  }
  
  analyzeTimingFactors(qimenPan, currentTime) {
    // 分析时间因素
    return {
      season: '春季',
      favorability: '有利',
      notes: ['春季木旺，利于发展']
    };
  }
}

// 奇门计算器类
class QimenCalculator {
  constructor(analyzer) {
    this.analyzer = analyzer;
  }
  
  // 计算完整的奇门盘
  calculateQimenPan(datetime) {
    const timeInfo = this.calculateTimeInfo(datetime);
    const dipan = this.calculateDiPan(timeInfo);
    const tianpan = this.calculateTianPan(dipan, timeInfo);
    const { zhifu, zhishi } = this.calculateZhiFuZhiShi(dipan, tianpan, timeInfo);
    
    return {
      timeInfo,
      dipan,
      tianpan,
      zhifu,
      zhishi,
      jushu: timeInfo.jushu,
      yindun: timeInfo.yindun
    };
  }
  
  /**
   * 计算时间信息
   * @param {Date} datetime - 日期时间
   * @returns {Object} 时间信息
   */
  calculateTimeInfo(datetime) {
    const year = datetime.getFullYear();
    const month = datetime.getMonth() + 1;
    const day = datetime.getDate();
    const hour = datetime.getHours();
    
    // 转换为干支
    const yearGZ = this.analyzer.getYearGanZhi(year);
    const monthGZ = this.analyzer.getMonthGanZhiByDate(datetime);
    const dayGZ = this.analyzer.getDayGanZhi(datetime);
    const hourGZ = this.analyzer.getHourGanZhi(hour, dayGZ.gan);
    
    // 计算节气
    const jieqi = this.analyzer.calculateJieQi(datetime);
    const yuan = this.analyzer.calculateYuan(datetime, jieqi);
    const { jushu, yindun } = this.analyzer.calculateJuShu(jieqi, yuan);
    
    return {
      year: yearGZ,
      month: monthGZ,
      day: dayGZ,
      hour: hourGZ,
      jieqi: jieqi.name,
      yuan,
      jushu,
      yindun
    };
  }
  
  /**
   * 计算地盘
   * @param {Object} timeInfo - 时间信息
   * @returns {Array} 地盘数组
   */
  calculateDiPan(timeInfo) {
    const dipan = new Array(9).fill(null).map(() => ({
      ganzhi: null,
      star: null,
      door: null,
      god: null
    }));
    
    // 排三奇六仪
    const arrangementInfo = this.analyzer.arrangeSanQiLiuYi(dipan, timeInfo.jushu, timeInfo.yindun);
    
    // 保存排布信息到时间信息中
    timeInfo.arrangementInfo = arrangementInfo;
    
    // 排九星
    const starInfo = this.analyzer.arrangeJiuXing(dipan, timeInfo.jushu, timeInfo.yindun);
    timeInfo.starInfo = starInfo;
    
    // 排八门
    const doorInfo = this.analyzer.arrangeBaMen(dipan, timeInfo.hour.zhi, timeInfo.yindun);
    timeInfo.doorInfo = doorInfo;
    
    // 排八神
    const godInfo = this.analyzer.arrangeBaShen(dipan, timeInfo.yindun);
    timeInfo.godInfo = godInfo;
    
    return dipan;
  }
  
  /**
   * 计算天盘
   * @param {Array} dipan - 地盘数组
   * @param {Object} timeInfo - 时间信息
   * @returns {Array} 天盘数组
   */
  calculateTianPan(dipan, timeInfo) {
    const tianpan = new Array(9).fill(null).map(() => ({
      ganzhi: null,
      star: null,
      door: null,
      god: null,
      tianpanInfo: {
        originalPosition: null,
        isFeigong: false,
        feigongType: null
      }
    }));
    
    // 找到时干在地盘的位置（值符位置）
    const shiganPosition = this.findShiganPosition(dipan, timeInfo.hour.gan);
    const zhifuStar = dipan[shiganPosition]?.star;
    
    // 找到值符星在地盘的原始位置
    const zhifuOriginalPosition = this.findStarOriginalPosition(zhifuStar, timeInfo.starInfo);
    
    // 计算天盘转换信息
    const tianpanInfo = {
      shiganPosition,
      zhifuStar,
      zhifuOriginalPosition,
      rotationOffset: this.calculateRotationOffset(shiganPosition, zhifuOriginalPosition, timeInfo.yindun),
      transformations: []
    };
    
    // 按阴阳遁规律排列天盘
    if (timeInfo.yindun) {
      this.arrangeYindunTianpan(tianpan, dipan, tianpanInfo);
    } else {
      this.arrangeYangdunTianpan(tianpan, dipan, tianpanInfo);
    }
    
    // 记录天盘信息
    timeInfo.tianpanInfo = tianpanInfo;
    
    return tianpan;
  }
  
  /**
   * 计算旋转偏移量
   * @param {number} shiganPosition - 时干位置
   * @param {number} zhifuOriginalPosition - 值符原始位置
   * @param {boolean} yindun - 是否阴遁
   * @returns {number} 旋转偏移量
   */
  calculateRotationOffset(shiganPosition, zhifuOriginalPosition, yindun) {
    if (zhifuOriginalPosition === -1) {
      return 0; // 无法确定原始位置，不旋转
    }
    
    let offset;
    if (yindun) {
      // 阴遁：逆时针旋转
      offset = (zhifuOriginalPosition - shiganPosition + 9) % 9;
    } else {
      // 阳遁：顺时针旋转
      offset = (shiganPosition - zhifuOriginalPosition + 9) % 9;
    }
    
    return offset;
  }
  
  /**
   * 找到星的原始位置
   * @param {string} star - 星名
   * @param {Object} starInfo - 星位信息
   * @returns {number} 原始位置，-1表示未找到
   */
  findStarOriginalPosition(star, starInfo) {
    if (!starInfo || !starInfo.starPositions[star]) {
      return -1;
    }
    
    // 星的原始位置就是其在地盘的位置
    return starInfo.starPositions[star].palace;
  }
  
  /**
   * 计算值符值使
   * @param {Array} dipan - 地盘数组
   * @param {Array} tianpan - 天盘数组
   * @param {Object} timeInfo - 时间信息
   * @returns {Object} 值符值使信息
   */
  calculateZhiFuZhiShi(dipan, tianpan, timeInfo) {
    // 找到时干在地盘的位置
    const shiganPosition = this.findShiganPosition(dipan, timeInfo.hour.gan);
    const zhifuStar = dipan[shiganPosition]?.star;
    
    // 找到时支对应的门
    const zhishiDoor = this.findZhishiDoor(timeInfo.hour.zhi, timeInfo.doorInfo);
    
    // 计算值符值使的详细信息
    const zhifuzhishiInfo = {
      zhifu: {
        star: zhifuStar,
        position: shiganPosition,
        palace: this.analyzer.getPalaceName(shiganPosition),
        ganzhi: timeInfo.hour.gan,
        isFeigong: this.checkFeigong(zhifuStar, shiganPosition, timeInfo.starInfo)
      },
      zhishi: {
        door: zhishiDoor,
        position: this.findDoorPosition(zhishiDoor, dipan),
        palace: this.analyzer.getPalaceName(this.findDoorPosition(zhishiDoor, dipan)),
        zhi: timeInfo.hour.zhi,
        isFeigong: this.checkDoorFeigong(zhishiDoor, timeInfo.doorInfo)
      },
      relationship: this.analyzeZhifuZhishiRelation(zhifuStar, zhishiDoor)
    };
    
    // 更新星位和门位的值符值使标记
    this.updateZhifuZhishiMarks(timeInfo, zhifuzhishiInfo);
    
    return {
      zhifu: zhifuStar,
      zhishi: zhishiDoor,
      details: zhifuzhishiInfo
    };
  }
  
  /**
   * 检查值符是否飞宫
   * @param {string} zhifuStar - 值符星
   * @param {number} position - 当前位置
   * @param {Object} starInfo - 星位信息
   * @returns {boolean} 是否飞宫
   */
  checkFeigong(zhifuStar, position, starInfo) {
    if (!starInfo || !starInfo.starPositions[zhifuStar]) {
      return false;
    }
    
    const originalPosition = starInfo.starPositions[zhifuStar].palace;
    return originalPosition !== position;
  }
  
  /**
   * 检查值使门是否飞宫
   * @param {string} zhishiDoor - 值使门
   * @param {Object} doorInfo - 门位信息
   * @returns {boolean} 是否飞宫
   */
  checkDoorFeigong(zhishiDoor, doorInfo) {
    if (!doorInfo || !doorInfo.doorPositions[zhishiDoor]) {
      return false;
    }
    
    // 检查门是否在其本宫位置
    const doorPosition = doorInfo.doorPositions[zhishiDoor].palace;
    const expectedPosition = this.getDoorOriginalPosition(zhishiDoor);
    
    return expectedPosition !== -1 && expectedPosition !== doorPosition;
  }
  
  /**
   * 获取门的原始宫位
   * @param {string} door - 门名
   * @returns {number} 原始宫位，-1表示无固定宫位
   */
  getDoorOriginalPosition(door) {
    const doorOriginalPositions = {
      '休门': 0, // 坎宫
      '死门': 1, // 坤宫
      '伤门': 2, // 震宫
      '杜门': 3, // 巽宫
      '景门': 8, // 离宫
      '惊门': 5, // 乾宫
      '开门': 6, // 兑宫
      '生门': 7  // 艮宫
    };
    
    return doorOriginalPositions[door] !== undefined ? doorOriginalPositions[door] : -1;
  }
  
  /**
   * 找到值使门
   * @param {string} hourZhi - 时支
   * @param {Object} doorInfo - 门位信息
   * @returns {string} 值使门
   */
  findZhishiDoor(hourZhi, doorInfo) {
    if (doorInfo && doorInfo.zhishiDoor) {
      return doorInfo.zhishiDoor;
    }
    
    // 根据时支确定值使门（简化处理）
    const zhishiMapping = {
      '子': '休门', '丑': '死门', '寅': '伤门', '卯': '杜门',
      '辰': '景门', '巳': '惊门', '午': '开门', '未': '生门',
      '申': '休门', '酉': '死门', '戌': '伤门', '亥': '杜门'
    };
    
    return zhishiMapping[hourZhi] || '休门';
  }
  
  /**
   * 找到门在地盘的位置
   * @param {string} door - 门名
   * @param {Array} dipan - 地盘数组
   * @returns {number} 门的位置
   */
  findDoorPosition(door, dipan) {
    for (let i = 0; i < dipan.length; i++) {
      if (dipan[i] && dipan[i].door === door) {
        return i;
      }
    }
    return -1;
  }
  
  /**
   * 分析值符值使关系
   * @param {string} zhifuStar - 值符星
   * @param {string} zhishiDoor - 值使门
   * @returns {Object} 关系分析
   */
  analyzeZhifuZhishiRelation(zhifuStar, zhishiDoor) {
    const starWuxing = this.analyzer.JIUXING[zhifuStar]?.element;
    const doorWuxing = this.analyzer.BAMEN[zhishiDoor]?.element;
    
    if (starWuxing && doorWuxing) {
      const relation = this.analyzer.getWuXingRelation(starWuxing, doorWuxing);
      
      return {
        starWuxing,
        doorWuxing,
        relation,
        isHarmony: ['生', '比和'].includes(relation),
        description: this.getZhifuZhishiDescription(relation)
      };
    }
    
    return {
      relation: '未知',
      isHarmony: false,
      description: '无法确定关系'
    };
  }
  
  /**
   * 获取值符值使关系描述
   * @param {string} relation - 五行关系
   * @returns {string} 关系描述
   */
  getZhifuZhishiDescription(relation) {
    const descriptions = {
      '生': '值符生值使，主动有力，事情顺利',
      '被生': '值使生值符，得助有力，贵人相助',
      '克': '值符克值使，主动克制，需要努力',
      '被克': '值使克值符，受制约束，阻力较大',
      '比和': '值符值使同气，和谐一致，平稳发展'
    };
    
    return descriptions[relation] || '关系复杂，需综合判断';
  }
  
  /**
   * 更新值符值使标记
   * @param {Object} timeInfo - 时间信息
   * @param {Object} zhifuzhishiInfo - 值符值使信息
   */
  updateZhifuZhishiMarks(timeInfo, zhifuzhishiInfo) {
    // 更新星位的值符标记
    if (timeInfo.starInfo && timeInfo.starInfo.starPositions[zhifuzhishiInfo.zhifu.star]) {
      timeInfo.starInfo.starPositions[zhifuzhishiInfo.zhifu.star].isZhifu = true;
    }
    
    // 更新门位的值使标记
    if (timeInfo.doorInfo && timeInfo.doorInfo.doorPositions[zhifuzhishiInfo.zhishi.door]) {
      timeInfo.doorInfo.doorPositions[zhifuzhishiInfo.zhishi.door].isZhishi = true;
    }
  }
  
  /**
   * 找到时干在地盘的位置
   * @param {Array} dipan - 地盘数组
   * @param {string} shigan - 时干
   * @returns {number} 位置索引
   */
  findShiganPosition(dipan, shigan) {
    for (let i = 0; i < dipan.length; i++) {
      if (dipan[i].ganzhi === shigan) {
        return i;
      }
    }
    return 0; // 默认返回坎宫
  }
  
  /**
   * 找到时支对应的位置
   * @param {Array} dipan - 地盘数组
   * @param {string} zhizhi - 时支
   * @returns {number} 位置索引
   */
  findZhizhiPosition(dipan, zhizhi) {
    // 通过时支找到对应的天干位置（六甲遁法）
    const liujiaXun = this.analyzer.LIUJIA_XUN;
    
    for (const [xunShou, xunData] of Object.entries(liujiaXun)) {
      if (!xunData.empty.includes(zhizhi)) {
        // 找到对应的六仪
        const liuyi = xunData.liuyi;
        for (let i = 0; i < dipan.length; i++) {
          if (dipan[i].ganzhi === liuyi) {
            return i;
          }
        }
      }
    }
    
    return 0; // 默认返回坎宫
  }
  
  /**
   * 阳遁天盘排列
   * @param {Array} tianpan - 天盘数组
   * @param {Array} dipan - 地盘数组
   * @param {Object} tianpanInfo - 天盘信息
   */
  arrangeYangdunTianpan(tianpan, dipan, tianpanInfo) {
    const { shiganPosition, rotationOffset } = tianpanInfo;
    
    // 阳遁：根据值符位置进行顺时针转换
    for (let i = 0; i < 9; i++) {
      // 计算源位置（考虑旋转偏移）
      const sourcePos = (i + rotationOffset) % 9;
      
      // 复制地盘信息到天盘
      tianpan[i] = {
        ganzhi: dipan[sourcePos]?.ganzhi || null,
        star: dipan[sourcePos]?.star || null,
        door: dipan[sourcePos]?.door || null,
        god: dipan[sourcePos]?.god || null,
        tianpanInfo: {
          originalPosition: sourcePos,
          isFeigong: sourcePos !== i,
          feigongType: this.getFeigongType(sourcePos, i),
          transformation: `地盘${sourcePos}宫 → 天盘${i}宫`
        }
      };
      
      // 记录转换信息
      tianpanInfo.transformations.push({
        tianpanPosition: i,
        dipanPosition: sourcePos,
        isFeigong: sourcePos !== i,
        element: dipan[sourcePos]?.ganzhi || dipan[sourcePos]?.star || dipan[sourcePos]?.door
      });
    }
  }
  
  /**
   * 阴遁天盘排列
   * @param {Array} tianpan - 天盘数组
   * @param {Array} dipan - 地盘数组
   * @param {Object} tianpanInfo - 天盘信息
   */
  arrangeYindunTianpan(tianpan, dipan, tianpanInfo) {
    const { shiganPosition, rotationOffset } = tianpanInfo;
    
    // 阴遁：根据值符位置进行逆时针转换
    for (let i = 0; i < 9; i++) {
      // 计算源位置（考虑旋转偏移，阴遁逆向）
      const sourcePos = (i - rotationOffset + 9) % 9;
      
      // 复制地盘信息到天盘
      tianpan[i] = {
        ganzhi: dipan[sourcePos]?.ganzhi || null,
        star: dipan[sourcePos]?.star || null,
        door: dipan[sourcePos]?.door || null,
        god: dipan[sourcePos]?.god || null,
        tianpanInfo: {
          originalPosition: sourcePos,
          isFeigong: sourcePos !== i,
          feigongType: this.getFeigongType(sourcePos, i),
          transformation: `地盘${sourcePos}宫 → 天盘${i}宫`
        }
      };
      
      // 记录转换信息
      tianpanInfo.transformations.push({
        tianpanPosition: i,
        dipanPosition: sourcePos,
        isFeigong: sourcePos !== i,
        element: dipan[sourcePos]?.ganzhi || dipan[sourcePos]?.star || dipan[sourcePos]?.door
      });
    }
  }
  
  /**
   * 获取飞宫类型
   * @param {number} originalPos - 原始位置
   * @param {number} currentPos - 当前位置
   * @returns {string} 飞宫类型
   */
  getFeigongType(originalPos, currentPos) {
    if (originalPos === currentPos) {
      return '伏吟'; // 不动
    }
    
    // 计算位置关系
    const diff = Math.abs(originalPos - currentPos);
    const oppositePairs = [[0, 8], [1, 7], [2, 6], [3, 5]]; // 对冲宫位
    
    // 检查是否为对冲（反吟）
    for (const [pos1, pos2] of oppositePairs) {
      if ((originalPos === pos1 && currentPos === pos2) || 
          (originalPos === pos2 && currentPos === pos1)) {
        return '反吟';
      }
    }
    
    // 其他情况为飞宫
    if (diff === 1 || diff === 8) {
      return '相邻飞宫';
    } else if (diff === 2 || diff === 7) {
      return '隔一飞宫';
    } else {
      return '远距飞宫';
    }
  }
}

// 格局分析器类
class PatternAnalyzer {
  constructor(analyzer) {
    this.analyzer = analyzer;
  }
  
  analyzePatterns(qimenPan) {
    const patterns = [];
    
    // 分析三奇格局
    patterns.push(...this.analyzeSanQiPatterns(qimenPan));
    
    // 分析六仪格局
    patterns.push(...this.analyzeLiuYiPatterns(qimenPan));
    
    // 分析特殊格局
    patterns.push(...this.analyzeSpecialPatterns(qimenPan));
    
    // 分析组合格局
    patterns.push(...this.analyzeCombinationPatterns(qimenPan));
    
    // 分析飞宫格局
    patterns.push(...this.analyzeFeigongPatterns(qimenPan));
    
    // 按重要性排序
    return this.sortPatternsByImportance(patterns);
  }
  
  /**
   * 分析三奇格局
   * @param {Object} qimenPan - 奇门盘
   * @returns {Array} 三奇格局列表
   */
  analyzeSanQiPatterns(qimenPan) {
    const patterns = [];
    const { dipan, tianpan, timeInfo } = qimenPan;
    
    // 三奇：乙丙丁
    const sanqi = ['乙', '丙', '丁'];
    const sanqiNames = { '乙': '日奇', '丙': '月奇', '丁': '星奇' };
    
    for (const qi of sanqi) {
      const qiPosition = this.findGanzhiPosition(qi, dipan);
      if (qiPosition === -1) continue;
      
      const palace = qiPosition;
      const palaceName = this.analyzer.getPalaceName(palace);
      const star = dipan[palace]?.star;
      const door = dipan[palace]?.door;
      const god = dipan[palace]?.god;
      
      // 检查三奇得奇门格局
      if (this.isAuspiciousDoor(door)) {
        patterns.push({
          name: `${sanqiNames[qi]}得奇门`,
          type: '三奇格局',
          level: '吉',
          score: 20,
          palace,
          palaceName,
          elements: { qi, star, door, god },
          description: `${sanqiNames[qi]}临${door}，主事情顺利，贵人相助`
        });
      }
      
      // 检查三奇升殿格局
      if (this.isSanqiShengdian(qi, palace)) {
        patterns.push({
          name: `${sanqiNames[qi]}升殿`,
          type: '三奇格局',
          level: '大吉',
          score: 25,
          palace,
          palaceName,
          elements: { qi, star, door, god },
          description: `${sanqiNames[qi]}居${palaceName}，得地得时，大吉之象`
        });
      }
      
      // 检查三奇入墓格局
      if (this.isSanqiRumu(qi, palace)) {
        patterns.push({
          name: `${sanqiNames[qi]}入墓`,
          type: '三奇格局',
          level: '凶',
          score: -15,
          palace,
          palaceName,
          elements: { qi, star, door, god },
          description: `${sanqiNames[qi]}入${palaceName}，受困受制，不利发展`
        });
      }
    }
    
    return patterns;
  }
  
  /**
   * 分析六仪格局
   * @param {Object} qimenPan - 奇门盘
   * @returns {Array} 六仪格局列表
   */
  analyzeLiuYiPatterns(qimenPan) {
    const patterns = [];
    const { dipan, tianpan, timeInfo } = qimenPan;
    
    // 检查经典六仪格局
    const liuyiPatterns = {
      '戊加己': { name: '青龙返首', level: '吉', score: 12, desc: '主田土房产大利' },
      '戊加庚': { name: '太白入荧', level: '凶', score: -12, desc: '主争斗官司' },
      '戊加辛': { name: '青龙折足', level: '凶', score: -10, desc: '主破财疾病' },
      '己加戊': { name: '贵人入狱', level: '凶', score: -8, desc: '主贵人受困' },
      '己加癸': { name: '地网高张', level: '凶', score: -15, desc: '主牢狱困顿' },
      '庚加乙': { name: '太白逢星', level: '吉', score: 10, desc: '主官司得理' },
      '庚加丁': { name: '亭亭之格', level: '吉', score: 15, desc: '主婚姻合作' }
    };
    
    // 检查天盘地盘组合
    for (let i = 0; i < 9; i++) {
      const tianGan = tianpan[i]?.ganzhi;
      const diGan = dipan[i]?.ganzhi;
      
      if (tianGan && diGan) {
        const combination = `${tianGan}加${diGan}`;
        const patternInfo = liuyiPatterns[combination];
        
        if (patternInfo) {
          patterns.push({
            name: patternInfo.name,
            type: '六仪格局',
            level: patternInfo.level,
            score: patternInfo.score,
            palace: i,
            palaceName: this.analyzer.getPalaceName(i),
            elements: {
              tianGan,
              diGan,
              star: dipan[i]?.star,
              door: dipan[i]?.door,
              god: dipan[i]?.god
            },
            description: `${tianGan}加${diGan}，${patternInfo.desc}`
          });
        }
      }
    }
    
    return patterns;
  }
  
  /**
   * 分析特殊格局
   * @param {Object} qimenPan - 奇门盘
   * @returns {Array} 特殊格局列表
   */
  analyzeSpecialPatterns(qimenPan) {
    const patterns = [];
    const { dipan, tianpan, timeInfo } = qimenPan;
    
    // 检查伏吟反吟格局
    let fuyinCount = 0;
    let fanyinCount = 0;
    
    for (let i = 0; i < 9; i++) {
      const tianInfo = tianpan[i]?.tianpanInfo;
      if (tianInfo) {
        if (tianInfo.feigongType === '伏吟') {
          fuyinCount++;
        } else if (tianInfo.feigongType === '反吟') {
          fanyinCount++;
        }
      }
    }
    
    if (fuyinCount >= 3) {
      patterns.push({
        name: '伏吟格局',
        type: '特殊格局',
        level: '不利',
        score: -5,
        palace: -1,
        palaceName: '全局',
        elements: { count: fuyinCount },
        description: '多宫伏吟，主事情反复迟缓，不宜主动'
      });
    }
    
    if (fanyinCount >= 3) {
      patterns.push({
        name: '反吟格局',
        type: '特殊格局',
        level: '动荡',
        score: -8,
        palace: -1,
        palaceName: '全局',
        elements: { count: fanyinCount },
        description: '多宫反吟，主事情变化动荡，需谨慎应对'
      });
    }
    
    // 检查值符飞宫格局
    if (timeInfo.tianpanInfo && timeInfo.tianpanInfo.rotationOffset !== 0) {
      patterns.push({
        name: '值符飞宫',
        type: '特殊格局',
        level: '变化',
        score: 0,
        palace: timeInfo.tianpanInfo.shiganPosition,
        palaceName: this.analyzer.getPalaceName(timeInfo.tianpanInfo.shiganPosition),
        elements: {
          zhifu: timeInfo.tianpanInfo.zhifuStar,
          offset: timeInfo.tianpanInfo.rotationOffset
        },
        description: '值符飞宫，主有变化升迁或职位调动'
      });
    }
    
    return patterns;
  }
  
  /**
   * 分析组合格局
   * @param {Object} qimenPan - 奇门盘
   * @returns {Array} 组合格局列表
   */
  analyzeCombinationPatterns(qimenPan) {
    const patterns = [];
    const { dipan, tianpan, timeInfo } = qimenPan;
    
    // 检查星门组合格局
    for (let i = 0; i < 9; i++) {
      const star = dipan[i]?.star;
      const door = dipan[i]?.door;
      
      if (star && door) {
        const combination = this.getStarDoorCombination(star, door);
        if (combination) {
          patterns.push({
            name: combination.name,
            type: '星门组合',
            level: combination.level,
            score: combination.score,
            palace: i,
            palaceName: this.analyzer.getPalaceName(i),
            elements: { star, door },
            description: combination.description
          });
        }
      }
    }
    
    return patterns;
  }
  
  /**
   * 分析飞宫格局
   * @param {Object} qimenPan - 奇门盘
   * @returns {Array} 飞宫格局列表
   */
  analyzeFeigongPatterns(qimenPan) {
    const patterns = [];
    const { tianpan, timeInfo } = qimenPan;
    
    if (!timeInfo.tianpanInfo) return patterns;
    
    const { transformations } = timeInfo.tianpanInfo;
    
    // 分析重要的飞宫组合
    for (const transform of transformations) {
      if (transform.isFeigong && transform.element) {
        const feigongPattern = this.getFeigongPattern(transform);
        if (feigongPattern) {
          patterns.push(feigongPattern);
        }
      }
    }
    
    return patterns;
  }
  
  // 辅助方法
  findGanzhiPosition(ganzhi, dipan) {
    for (let i = 0; i < dipan.length; i++) {
      if (dipan[i]?.ganzhi === ganzhi) {
        return i;
      }
    }
    return -1;
  }
  
  isAuspiciousDoor(door) {
    return ['开门', '休门', '生门'].includes(door);
  }
  
  isSanqiShengdian(qi, palace) {
    const shengdianMap = {
      '乙': [8], // 日奇升殿在离宫
      '丙': [8], // 月奇升殿在离宫
      '丁': [8]  // 星奇升殿在离宫
    };
    return shengdianMap[qi]?.includes(palace) || false;
  }
  
  isSanqiRumu(qi, palace) {
    const rumuMap = {
      '乙': [0], // 日奇入墓在坎宫
      '丙': [0], // 月奇入墓在坎宫
      '丁': [0]  // 星奇入墓在坎宫
    };
    return rumuMap[qi]?.includes(palace) || false;
  }
  
  getStarDoorCombination(star, door) {
    const combinations = {
      '天心开门': { name: '天心开门', level: '大吉', score: 25, description: '天心配开门，主升迁发达' },
      '天任生门': { name: '天任生门', level: '吉', score: 20, description: '天任配生门，主财源广进' },
      '天英景门': { name: '天英景门', level: '吉', score: 18, description: '天英配景门，主文书喜庆' }
    };
    
    const key = star + door;
    return combinations[key] || null;
  }
  
  getFeigongPattern(transform) {
    // 根据飞宫情况判断格局
    if (this.analyzer.isSanQi(transform.element)) {
      return {
        name: '三奇飞宫',
        type: '飞宫格局',
        level: '变化',
        score: 5,
        palace: transform.tianpanPosition,
        palaceName: this.analyzer.getPalaceName(transform.tianpanPosition),
        elements: { element: transform.element },
        description: `${transform.element}飞宫，主有变动机遇`
      };
    }
    return null;
  }
  
  sortPatternsByImportance(patterns) {
    return patterns.sort((a, b) => {
      // 按分数绝对值排序，分数高的在前
      return Math.abs(b.score) - Math.abs(a.score);
    });
  }
}

// 用神分析器类
class YongShenAnalyzer {
  constructor(analyzer) {
    this.analyzer = analyzer;
  }
  
  /**
   * 智能选择用神
   * @param {string} question - 问题描述
   * @param {Object} birthData - 出生信息
   * @param {Object} qimenPan - 奇门盘
   * @returns {Object} 用神配置
   */
  selectYongShen(question, birthData, qimenPan) {
    const questionType = this.analyzer.classifyQuestion(question);
    const rigan = qimenPan.timeInfo.day.gan;
    const gender = birthData?.gender || '未知';
    
    // 基础用神配置
    const yongshen = {
      rigan,
      questionType,
      primary: {},
      secondary: {},
      auxiliary: {}
    };
    
    // 根据问题类型配置用神
    switch (questionType) {
      case '婚姻':
        yongshen.primary = this.getMarriageYongshen(gender, qimenPan);
        yongshen.secondary = {
          matchmaker: '六合',
          marriage_palace: '兑宫',
          relationship_door: '休门'
        };
        break;
        
      case '求财':
        yongshen.primary = this.getWealthYongshen(qimenPan);
        yongshen.secondary = {
          capital: '戊',
          profit: '天任',
          opportunity: '开门'
        };
        break;
        
      case '疾病':
        yongshen.primary = this.getHealthYongshen(qimenPan);
        yongshen.secondary = {
          doctor: '天心',
          medicine: '乙',
          recovery: '生门'
        };
        break;
        
      case '官司':
        yongshen.primary = this.getLawsuitYongshen(qimenPan);
        yongshen.secondary = {
          judge: '天心',
          evidence: '丁',
          justice: '开门'
        };
        break;
        
      case '求职':
        yongshen.primary = this.getCareerYongshen(qimenPan);
        yongshen.secondary = {
          boss: '天心',
          opportunity: '开门',
          success: '生门'
        };
        break;
        
      case '学业':
        yongshen.primary = this.getStudyYongshen(qimenPan);
        yongshen.secondary = {
          teacher: '天心',
          wisdom: '丁',
          exam: '景门'
        };
        break;
        
      case '出行':
        yongshen.primary = this.getTravelYongshen(qimenPan);
        yongshen.secondary = {
          safety: '九天',
          direction: '值符',
          timing: '开门'
        };
        break;
        
      default:
        yongshen.primary = {
          matter: qimenPan.timeInfo.hour.gan,
          result: qimenPan.zhishi
        };
        yongshen.secondary = {
          timing: '值符',
          method: '值使'
        };
    }
    
    // 添加辅助用神
    yongshen.auxiliary = {
      zhifu: qimenPan.zhifu,
      zhishi: qimenPan.zhishi,
      season: this.analyzer.getCurrentSeason(new Date()),
      dayMaster: rigan
    };
    
    return yongshen;
  }
  
  /**
   * 获取婚姻用神
   * @param {string} gender - 性别
   * @param {Object} qimenPan - 奇门盘
   * @returns {Object} 婚姻用神
   */
  getMarriageYongshen(gender, qimenPan) {
    if (gender === '男') {
      return {
        self: '庚', // 男命以庚为自己
        spouse: '乙', // 以乙为妻子
        relationship: '六合'
      };
    } else if (gender === '女') {
      return {
        self: '乙', // 女命以乙为自己
        spouse: '庚', // 以庚为丈夫
        relationship: '六合'
      };
    } else {
      return {
        self: qimenPan.timeInfo.day.gan,
        spouse: this.getSpouseGan(qimenPan.timeInfo.day.gan),
        relationship: '六合'
      };
    }
  }
  
  /**
   * 获取求财用神
   * @param {Object} qimenPan - 奇门盘
   * @returns {Object} 求财用神
   */
  getWealthYongshen(qimenPan) {
    return {
      wealth: '生门', // 生门主财源
      investment: '戊', // 戊为资本
      profit: '天任', // 天任主财利
      timing: '开门' // 开门主机会
    };
  }
  
  /**
   * 获取健康用神
   * @param {Object} qimenPan - 奇门盘
   * @returns {Object} 健康用神
   */
  getHealthYongshen(qimenPan) {
    return {
      health: qimenPan.timeInfo.day.gan, // 日干为自身
      illness: '天芮', // 天芮主疾病
      treatment: '天心', // 天心主医疗
      recovery: '生门' // 生门主康复
    };
  }
  
  /**
   * 获取官司用神
   * @param {Object} qimenPan - 奇门盘
   * @returns {Object} 官司用神
   */
  getLawsuitYongshen(qimenPan) {
    return {
      plaintiff: qimenPan.timeInfo.day.gan, // 日干为求测人
      defendant: this.getOpponentGan(qimenPan.timeInfo.day.gan), // 对方
      judge: '天心', // 天心为法官
      verdict: '开门' // 开门主判决
    };
  }
  
  /**
   * 获取求职用神
   * @param {Object} qimenPan - 奇门盘
   * @returns {Object} 求职用神
   */
  getCareerYongshen(qimenPan) {
    return {
      self: qimenPan.timeInfo.day.gan, // 日干为自己
      job: '庚', // 庚为工作
      boss: '天心', // 天心为领导
      success: '开门' // 开门主成功
    };
  }
  
  /**
   * 获取学业用神
   * @param {Object} qimenPan - 奇门盘
   * @returns {Object} 学业用神
   */
  getStudyYongshen(qimenPan) {
    return {
      student: qimenPan.timeInfo.day.gan, // 日干为学生
      knowledge: '丁', // 丁为文书学问
      teacher: '天心', // 天心为老师
      exam: '景门' // 景门主考试
    };
  }
  
  /**
   * 获取出行用神
   * @param {Object} qimenPan - 奇门盘
   * @returns {Object} 出行用神
   */
  getTravelYongshen(qimenPan) {
    return {
      traveler: qimenPan.timeInfo.day.gan, // 日干为出行人
      journey: '九天', // 九天主远行
      safety: '太阴', // 太阴主平安
      destination: '开门' // 开门主目的地
    };
  }
  
  /**
   * 获取配偶干支
   * @param {string} rigan - 日干
   * @returns {string} 配偶干支
   */
  getSpouseGan(rigan) {
    const spouseMap = {
      '甲': '己', '乙': '庚', '丙': '辛', '丁': '壬', '戊': '癸',
      '己': '甲', '庚': '乙', '辛': '丙', '壬': '丁', '癸': '戊'
    };
    return spouseMap[rigan] || '庚';
  }
  
  /**
   * 获取对手干支
   * @param {string} rigan - 日干
   * @returns {string} 对手干支
   */
  getOpponentGan(rigan) {
    // 以克我者为对手
    const opponentMap = {
      '甲': '庚', '乙': '辛', '丙': '壬', '丁': '癸', '戊': '甲',
      '己': '乙', '庚': '丙', '辛': '丁', '壬': '戊', '癸': '己'
    };
    return opponentMap[rigan] || '庚';
  }
  
  /**
   * 分析用神状态
   * @param {Object} yongshen - 用神配置
   * @param {Object} qimenPan - 奇门盘
   * @returns {Object} 用神分析结果
   */
  analyzeYongShen(yongshen, qimenPan) {
    const analysis = {
      primary: {},
      secondary: {},
      auxiliary: {},
      overall: {
        favorability: 0,
        strength: 0,
        timing: '中等',
        recommendation: ''
      }
    };
    
    // 分析主用神
    if (yongshen.primary) {
      for (const [key, value] of Object.entries(yongshen.primary)) {
        if (typeof value === 'string') {
          analysis.primary[key] = this.analyzeElementStatus(value, qimenPan);
        }
      }
    }
    
    // 分析次用神
    if (yongshen.secondary) {
      for (const [key, value] of Object.entries(yongshen.secondary)) {
        if (typeof value === 'string') {
          analysis.secondary[key] = this.analyzeElementStatus(value, qimenPan);
        }
      }
    }
    
    // 分析辅助用神
    if (yongshen.auxiliary) {
      for (const [key, value] of Object.entries(yongshen.auxiliary)) {
        if (typeof value === 'string') {
          analysis.auxiliary[key] = this.analyzeElementStatus(value, qimenPan);
        }
      }
    }
    
    // 兼容旧格式
    for (const [key, value] of Object.entries(yongshen)) {
      if (typeof value === 'string' && !['questionType', 'rigan'].includes(key)) {
        if (!analysis.primary[key] && !analysis.secondary[key] && !analysis.auxiliary[key]) {
          analysis.primary[key] = this.analyzeElementStatus(value, qimenPan);
        }
      }
    }
    
    // 综合评估
    analysis.overall = this.calculateOverallAnalysis(analysis, qimenPan);
    
    return analysis;
  }
  
  /**
   * 查找元素在奇门盘中的位置
   * @param {string} element - 元素（干支、星、门、神）
   * @param {Object} qimenPan - 奇门盘
   * @returns {number} 位置索引，-1表示未找到
   */
  findElementPosition(element, qimenPan) {
    const { dipan } = qimenPan;
    
    // 查找干支
    for (let i = 0; i < dipan.length; i++) {
      if (dipan[i]?.ganzhi === element) {
        return i;
      }
    }
    
    // 查找九星
    for (let i = 0; i < dipan.length; i++) {
      if (dipan[i]?.star === element) {
        return i;
      }
    }
    
    // 查找八门
    for (let i = 0; i < dipan.length; i++) {
      if (dipan[i]?.door === element) {
        return i;
      }
    }
    
    // 查找八神
    for (let i = 0; i < dipan.length; i++) {
      if (dipan[i]?.god === element) {
        return i;
      }
    }
    
    return -1;
  }
  
  /**
   * 分析元素状态
   * @param {string} element - 元素（干支、星、门、神）
   * @param {Object} qimenPan - 奇门盘
   * @returns {Object} 元素状态分析
   */
  analyzeElementStatus(element, qimenPan) {
    const position = this.findElementPosition(element, qimenPan);
    const wangshui = this.calculateWangShui(element, position, qimenPan);
    const palaceRelation = this.analyzePalaceRelation(element, position, qimenPan);
    const seasonalInfluence = this.analyzeSeasonalInfluence(element, qimenPan);
    
    // 综合评分
    const score = this.calculateElementScore(wangshui, palaceRelation, seasonalInfluence);
    
    return {
      element,
      position,
      palaceName: position !== -1 ? this.analyzer.getPalaceName(position) : '未找到',
      wangshui: wangshui.level,
      wangshuiScore: wangshui.score,
      palaceRelation: palaceRelation.relation,
      palaceHarmony: palaceRelation.harmony,
      seasonalInfluence: seasonalInfluence.influence,
      seasonalScore: seasonalInfluence.score,
      totalScore: score,
      status: this.getStatusByScore(score),
      description: this.generateElementDescription(element, wangshui, palaceRelation, seasonalInfluence)
    };
  }
  
  classifyQuestion(question) {
    const keywords = {
      '婚姻': ['婚姻', '结婚', '恋爱', '感情'],
      '求财': ['财运', '投资', '生意', '赚钱'],
      '疾病': ['健康', '疾病', '治病', '身体'],
      '官司': ['官司', '诉讼', '法律', '纠纷'],
      '求职': ['工作', '求职', '面试', '职业']
    };
    
    for (const [type, words] of Object.entries(keywords)) {
      if (words.some(word => question.includes(word))) {
        return type;
      }
    }
    
    return '其他';
  }
  
  findYongShenPosition(yongshen, qimenPan) {
    const { dipan, tianpan } = qimenPan;
    
    // 如果用神是字符串，直接查找
    if (typeof yongshen === 'string') {
      return this.findElementPosition(yongshen, qimenPan);
    }
    
    // 如果用神是对象，查找主用神
    if (yongshen && typeof yongshen === 'object') {
      // 查找主用神（primary）
      if (yongshen.primary) {
        for (const [key, value] of Object.entries(yongshen.primary)) {
          if (typeof value === 'string') {
            const position = this.findElementPosition(value, qimenPan);
            if (position !== -1) {
              return position;
            }
          }
        }
      }
      
      // 查找次用神（secondary）
      if (yongshen.secondary) {
        for (const [key, value] of Object.entries(yongshen.secondary)) {
          if (typeof value === 'string') {
            const position = this.findElementPosition(value, qimenPan);
            if (position !== -1) {
              return position;
            }
          }
        }
      }
      
      // 查找辅助用神（auxiliary）
      if (yongshen.auxiliary) {
        for (const [key, value] of Object.entries(yongshen.auxiliary)) {
          if (typeof value === 'string') {
            const position = this.findElementPosition(value, qimenPan);
            if (position !== -1) {
              return position;
            }
          }
        }
      }
    }
    
    return -1; // 未找到
  }
  
  /**
   * 计算旺衰
   * @param {string} element - 元素
   * @param {number} position - 位置
   * @param {Object} qimenPan - 奇门盘
   * @returns {Object} 旺衰分析
   */
  calculateWangShui(element, position, qimenPan) {
    if (position === -1) {
      return { level: '未知', score: 0, reason: '元素未找到' };
    }
    
    // 获取元素五行
    const elementWuxing = this.getElementWuxing(element);
    if (!elementWuxing) {
      return { level: '未知', score: 0, reason: '无法确定五行' };
    }
    
    // 基于节气的旺衰
    const seasonalWangshui = this.getSeasonalWangshui(elementWuxing, qimenPan);
    
    // 基于宫位的旺衰
    const palaceWangshui = this.getPalaceWangshui(elementWuxing, position);
    
    // 基于时间的旺衰
    const timeWangshui = this.getTimeWangshui(elementWuxing, qimenPan.timeInfo);
    
    // 综合计算
    const totalScore = seasonalWangshui.score + palaceWangshui.score + timeWangshui.score;
    const level = this.getWangshuiLevel(totalScore);
    
    return {
      level,
      score: totalScore,
      seasonal: seasonalWangshui,
      palace: palaceWangshui,
      time: timeWangshui,
      reason: `节气${seasonalWangshui.level}，宫位${palaceWangshui.level}，时间${timeWangshui.level}`
    };
  }
  
  getElementWuxing(element) {
    // 先检查是否为干支
    const ganzhiWuxing = this.analyzer.getGanZhiWuXing(element);
    if (ganzhiWuxing) return ganzhiWuxing;
    
    // 检查是否为九星
    const starWuxing = this.analyzer.JIUXING[element]?.element;
    if (starWuxing) return starWuxing;
    
    // 检查是否为八门
    const doorWuxing = this.analyzer.BAMEN[element]?.element;
    if (doorWuxing) return doorWuxing;
    
    // 检查是否为八神
    const godWuxing = this.analyzer.BASHEN[element]?.wuxing;
    if (godWuxing) return godWuxing;
    
    return null;
  }
  
  // 根据节气计算五行旺衰
  getSeasonalWangshui(wuxing, qimenPan) {
    const { timeInfo } = qimenPan;
    const jieqi = timeInfo.jieqi;
    
    // 节气对应的季节和五行旺衰关系
    const seasonalWangshui = {
      // 春季 - 木旺火相土死金囚水休
      '立春': { '木': { level: '旺', score: 15 }, '火': { level: '相', score: 10 }, '土': { level: '死', score: -10 }, '金': { level: '囚', score: -5 }, '水': { level: '休', score: 0 } },
      '雨水': { '木': { level: '旺', score: 15 }, '火': { level: '相', score: 10 }, '土': { level: '死', score: -10 }, '金': { level: '囚', score: -5 }, '水': { level: '休', score: 0 } },
      '惊蛰': { '木': { level: '旺', score: 15 }, '火': { level: '相', score: 10 }, '土': { level: '死', score: -10 }, '金': { level: '囚', score: -5 }, '水': { level: '休', score: 0 } },
      '春分': { '木': { level: '旺', score: 15 }, '火': { level: '相', score: 10 }, '土': { level: '死', score: -10 }, '金': { level: '囚', score: -5 }, '水': { level: '休', score: 0 } },
      '清明': { '木': { level: '旺', score: 15 }, '火': { level: '相', score: 10 }, '土': { level: '死', score: -10 }, '金': { level: '囚', score: -5 }, '水': { level: '休', score: 0 } },
      '谷雨': { '木': { level: '旺', score: 15 }, '火': { level: '相', score: 10 }, '土': { level: '死', score: -10 }, '金': { level: '囚', score: -5 }, '水': { level: '休', score: 0 } },
      
      // 夏季 - 火旺土相金死水囚木休
      '立夏': { '火': { level: '旺', score: 15 }, '土': { level: '相', score: 10 }, '金': { level: '死', score: -10 }, '水': { level: '囚', score: -5 }, '木': { level: '休', score: 0 } },
      '小满': { '火': { level: '旺', score: 15 }, '土': { level: '相', score: 10 }, '金': { level: '死', score: -10 }, '水': { level: '囚', score: -5 }, '木': { level: '休', score: 0 } },
      '芒种': { '火': { level: '旺', score: 15 }, '土': { level: '相', score: 10 }, '金': { level: '死', score: -10 }, '水': { level: '囚', score: -5 }, '木': { level: '休', score: 0 } },
      '夏至': { '火': { level: '旺', score: 15 }, '土': { level: '相', score: 10 }, '金': { level: '死', score: -10 }, '水': { level: '囚', score: -5 }, '木': { level: '休', score: 0 } },
      '小暑': { '火': { level: '旺', score: 15 }, '土': { level: '相', score: 10 }, '金': { level: '死', score: -10 }, '水': { level: '囚', score: -5 }, '木': { level: '休', score: 0 } },
      '大暑': { '火': { level: '旺', score: 15 }, '土': { level: '相', score: 10 }, '金': { level: '死', score: -10 }, '水': { level: '囚', score: -5 }, '木': { level: '休', score: 0 } },
      
      // 秋季 - 金旺水相木死火囚土休
      '立秋': { '金': { level: '旺', score: 15 }, '水': { level: '相', score: 10 }, '木': { level: '死', score: -10 }, '火': { level: '囚', score: -5 }, '土': { level: '休', score: 0 } },
      '处暑': { '金': { level: '旺', score: 15 }, '水': { level: '相', score: 10 }, '木': { level: '死', score: -10 }, '火': { level: '囚', score: -5 }, '土': { level: '休', score: 0 } },
      '白露': { '金': { level: '旺', score: 15 }, '水': { level: '相', score: 10 }, '木': { level: '死', score: -10 }, '火': { level: '囚', score: -5 }, '土': { level: '休', score: 0 } },
      '秋分': { '金': { level: '旺', score: 15 }, '水': { level: '相', score: 10 }, '木': { level: '死', score: -10 }, '火': { level: '囚', score: -5 }, '土': { level: '休', score: 0 } },
      '寒露': { '金': { level: '旺', score: 15 }, '水': { level: '相', score: 10 }, '木': { level: '死', score: -10 }, '火': { level: '囚', score: -5 }, '土': { level: '休', score: 0 } },
      '霜降': { '金': { level: '旺', score: 15 }, '水': { level: '相', score: 10 }, '木': { level: '死', score: -10 }, '火': { level: '囚', score: -5 }, '土': { level: '休', score: 0 } },
      
      // 冬季 - 水旺木相火死土囚金休
      '立冬': { '水': { level: '旺', score: 15 }, '木': { level: '相', score: 10 }, '火': { level: '死', score: -10 }, '土': { level: '囚', score: -5 }, '金': { level: '休', score: 0 } },
      '小雪': { '水': { level: '旺', score: 15 }, '木': { level: '相', score: 10 }, '火': { level: '死', score: -10 }, '土': { level: '囚', score: -5 }, '金': { level: '休', score: 0 } },
      '大雪': { '水': { level: '旺', score: 15 }, '木': { level: '相', score: 10 }, '火': { level: '死', score: -10 }, '土': { level: '囚', score: -5 }, '金': { level: '休', score: 0 } },
      '冬至': { '水': { level: '旺', score: 15 }, '木': { level: '相', score: 10 }, '火': { level: '死', score: -10 }, '土': { level: '囚', score: -5 }, '金': { level: '休', score: 0 } },
      '小寒': { '水': { level: '旺', score: 15 }, '木': { level: '相', score: 10 }, '火': { level: '死', score: -10 }, '土': { level: '囚', score: -5 }, '金': { level: '休', score: 0 } },
      '大寒': { '水': { level: '旺', score: 15 }, '木': { level: '相', score: 10 }, '火': { level: '死', score: -10 }, '土': { level: '囚', score: -5 }, '金': { level: '休', score: 0 } }
    };
    
    const jieqiData = seasonalWangshui[jieqi];
    if (jieqiData && jieqiData[wuxing]) {
      return jieqiData[wuxing];
    }
    
    // 默认返回平和状态
    return { level: '休', score: 0 };
  }
  
  getPalaceWangshui(wuxing, position) {
    // 九宫与五行的对应关系
    const palaceWuxing = this.analyzer.JIUGONG[position + 1]?.element;
    if (!palaceWuxing) {
      return { level: '休', score: 0 };
    }
    
    // 计算五行生克关系
    const relation = this.analyzer.getWuXingRelation(wuxing, palaceWuxing);
    
    let level, score;
    switch (relation) {
      case '生': // 我生宫位，泄气
        level = '泄';
        score = -8;
        break;
      case '被生': // 宫位生我，得气
        level = '旺';
        score = 12;
        break;
      case '克': // 我克宫位，耗气
        level = '耗';
        score = -5;
        break;
      case '被克': // 宫位克我，受制
        level = '囚';
        score = -12;
        break;
      case '比和': // 同类五行，和谐
        level = '旺';
        score = 10;
        break;
      default:
        level = '休';
        score = 0;
    }
    
    // 特殊宫位加成
    if (position === 4) { // 中宫
      score += 3; // 中宫得地利
    }
    
    return { level, score };
  }
  
  getTimeWangshui(wuxing, timeInfo) {
    const { hour } = timeInfo;
    const hourZhi = hour.zhi;
    
    // 时辰地支对应的五行
    const zhiWuxing = {
      '子': '水', '丑': '土', '寅': '木', '卯': '木',
      '辰': '土', '巳': '火', '午': '火', '未': '土',
      '申': '金', '酉': '金', '戌': '土', '亥': '水'
    };
    
    const timeWuxing = zhiWuxing[hourZhi];
    if (!timeWuxing) {
      return { level: '休', score: 0 };
    }
    
    // 计算与时辰五行的关系
    const relation = this.analyzer.getWuXingRelation(wuxing, timeWuxing);
    
    let level, score;
    switch (relation) {
      case '生': // 我生时辰，主动
        level = '相';
        score = 8;
        break;
      case '被生': // 时辰生我，得助
        level = '旺';
        score = 12;
        break;
      case '克': // 我克时辰，消耗
        level = '耗';
        score = -3;
        break;
      case '被克': // 时辰克我，受阻
        level = '囚';
        score = -8;
        break;
      case '比和': // 同类，和谐
        level = '旺';
        score = 10;
        break;
      default:
        level = '休';
        score = 0;
    }
    
    // 特殊时辰调整
    if (['子', '午', '卯', '酉'].includes(hourZhi)) {
      // 四正时辰，力量较强
      score += 2;
    } else if (['辰', '戌', '丑', '未'].includes(hourZhi)) {
      // 四库时辰，蓄藏之力
      score += 1;
    }
    
    return { level, score };
  }
  
  getWangshuiLevel(score) {
    if (score >= 20) return '旺';
    if (score >= 10) return '相';
    if (score >= 0) return '休';
    if (score >= -10) return '囚';
    return '死';
  }
  
  analyzePalaceRelation(element, position, qimenPan) {
    if (position === -1) {
      return { relation: '未知', score: 0, harmony: false };
    }
    
    const { dipan, tianpan } = qimenPan;
    const palace = dipan[position];
    const palaceInfo = this.analyzer.JIUGONG[position + 1];
    
    if (!palace || !palaceInfo) {
      return { relation: '未知', score: 0, harmony: false };
    }
    
    // 获取元素五行
    const elementWuxing = this.getElementWuxing(element);
    const palaceWuxing = palaceInfo.element;
    
    if (!elementWuxing || !palaceWuxing) {
      return { relation: '未知', score: 0, harmony: false };
    }
    
    // 计算五行关系
    const wuxingRelation = this.analyzer.getWuXingRelation(elementWuxing, palaceWuxing);
    
    let relation, score, harmony;
    switch (wuxingRelation) {
      case '生':
        relation = '生助宫位';
        score = 8;
        harmony = true;
        break;
      case '被生':
        relation = '得宫位生助';
        score = 15;
        harmony = true;
        break;
      case '克':
        relation = '克制宫位';
        score = -5;
        harmony = false;
        break;
      case '被克':
        relation = '被宫位克制';
        score = -15;
        harmony = false;
        break;
      case '比和':
        relation = '与宫位和谐';
        score = 12;
        harmony = true;
        break;
      default:
        relation = '关系平和';
        score = 0;
        harmony = true;
    }
    
    // 检查宫位内其他元素的影响
    let additionalScore = 0;
    
    // 检查同宫的星、门、神
    if (palace.star && palace.star !== element) {
      const starWuxing = this.analyzer.JIUXING[palace.star]?.element;
      if (starWuxing) {
        const starRelation = this.analyzer.getWuXingRelation(elementWuxing, starWuxing);
        if (starRelation === '被生') additionalScore += 3;
        else if (starRelation === '被克') additionalScore -= 3;
      }
    }
    
    if (palace.door && palace.door !== element) {
      const doorWuxing = this.analyzer.BAMEN[palace.door]?.element;
      if (doorWuxing) {
        const doorRelation = this.analyzer.getWuXingRelation(elementWuxing, doorWuxing);
        if (doorRelation === '被生') additionalScore += 2;
        else if (doorRelation === '被克') additionalScore -= 2;
      }
    }
    
    // 特殊宫位加成
    if (position === 4) { // 中宫
      additionalScore += 2; // 中宫为中心，有利
    }
    
    const finalScore = score + additionalScore;
    
    return {
      relation,
      score: finalScore,
      harmony,
      wuxingRelation,
      palaceElement: palaceWuxing,
      elementWuxing,
      additionalInfluence: additionalScore
    };
  }
  
  analyzeSeasonalInfluence(element, qimenPan) {
    const { timeInfo } = qimenPan;
    const jieqi = timeInfo.jieqi;
    
    // 获取元素五行
    const elementWuxing = this.getElementWuxing(element);
    if (!elementWuxing) {
      return { influence: '未知', score: 0, season: '未知' };
    }
    
    // 节气对应的季节
    const seasonMap = {
      '立春': '春', '雨水': '春', '惊蛰': '春', '春分': '春', '清明': '春', '谷雨': '春',
      '立夏': '夏', '小满': '夏', '芒种': '夏', '夏至': '夏', '小暑': '夏', '大暑': '夏',
      '立秋': '秋', '处暑': '秋', '白露': '秋', '秋分': '秋', '寒露': '秋', '霜降': '秋',
      '立冬': '冬', '小雪': '冬', '大雪': '冬', '冬至': '冬', '小寒': '冬', '大寒': '冬'
    };
    
    const season = seasonMap[jieqi] || '未知';
    
    // 五行与季节的关系
    const seasonalInfluence = {
      '春': {
        '木': { influence: '极为有利', score: 20, reason: '木旺于春，得时令之助' },
        '火': { influence: '较为有利', score: 12, reason: '木生火，春季火相' },
        '土': { influence: '极为不利', score: -15, reason: '木克土，春季土死' },
        '金': { influence: '不利', score: -8, reason: '金克木，春季金囚' },
        '水': { influence: '平和', score: 3, reason: '水生木，春季水休但有生助之功' }
      },
      '夏': {
        '火': { influence: '极为有利', score: 20, reason: '火旺于夏，得时令之助' },
        '土': { influence: '较为有利', score: 12, reason: '火生土，夏季土相' },
        '金': { influence: '极为不利', score: -15, reason: '火克金，夏季金死' },
        '水': { influence: '不利', score: -8, reason: '水克火，夏季水囚' },
        '木': { influence: '平和', score: 3, reason: '木生火，夏季木休但有生助之功' }
      },
      '秋': {
        '金': { influence: '极为有利', score: 20, reason: '金旺于秋，得时令之助' },
        '水': { influence: '较为有利', score: 12, reason: '金生水，秋季水相' },
        '木': { influence: '极为不利', score: -15, reason: '金克木，秋季木死' },
        '火': { influence: '不利', score: -8, reason: '火克金，秋季火囚' },
        '土': { influence: '平和', score: 3, reason: '土生金，秋季土休但有生助之功' }
      },
      '冬': {
        '水': { influence: '极为有利', score: 20, reason: '水旺于冬，得时令之助' },
        '木': { influence: '较为有利', score: 12, reason: '水生木，冬季木相' },
        '火': { influence: '极为不利', score: -15, reason: '水克火，冬季火死' },
        '土': { influence: '不利', score: -8, reason: '土克水，冬季土囚' },
        '金': { influence: '平和', score: 3, reason: '金生水，冬季金休但有生助之功' }
      }
    };
    
    const seasonData = seasonalInfluence[season];
    if (seasonData && seasonData[elementWuxing]) {
      const result = seasonData[elementWuxing];
      return {
        influence: result.influence,
        score: result.score,
        season,
        elementWuxing,
        jieqi,
        reason: result.reason
      };
    }
    
    // 默认返回
    return {
      influence: '平和',
      score: 0,
      season,
      elementWuxing,
      jieqi,
      reason: '季节影响不明显'
    };
  }
  
  calculateElementScore(wangshui, palaceRelation, seasonalInfluence) {
    return wangshui.score + palaceRelation.score + seasonalInfluence.score;
  }
  
  getStatusByScore(score) {
    if (score >= 25) return '极佳';
    if (score >= 20) return '很好';
    if (score >= 15) return '良好';
    if (score >= 10) return '一般';
    if (score >= 5) return '较差';
    return '很差';
  }
  
  generateElementDescription(element, wangshui, palaceRelation, seasonalInfluence) {
    return `${element}处于${wangshui.level}状态，宫位关系${palaceRelation.relation || '和谐'}，季节影响${seasonalInfluence.influence || '有利'}`;
  }
  
  calculateOverallAnalysis(analysis, qimenPan) {
    // 计算总体评分
    let totalScore = 0;
    let elementCount = 0;
    
    // 统计各类用神的评分
    ['primary', 'secondary', 'auxiliary'].forEach(category => {
      if (analysis[category]) {
        Object.values(analysis[category]).forEach(element => {
          if (element && typeof element.totalScore === 'number') {
            totalScore += element.totalScore;
            elementCount++;
          }
        });
      }
    });
    
    const averageScore = elementCount > 0 ? totalScore / elementCount : 0;
    
    return {
      favorability: Math.max(0, Math.min(100, averageScore * 2)), // 转换为0-100分
      strength: this.getStrengthLevel(averageScore),
      timing: this.getTimingAssessment(qimenPan),
      recommendation: this.getRecommendation(averageScore)
    };
  }
  
  getStrengthLevel(score) {
    if (score >= 25) return '很强';
    if (score >= 20) return '较强';
    if (score >= 15) return '中等';
    if (score >= 10) return '较弱';
    return '很弱';
  }
  
  getTimingAssessment(qimenPan) {
    const { timeInfo, dipan, tianpan, zhifu, zhishi } = qimenPan;
    let score = 0;
    let factors = [];
    
    // 1. 值符值使分析
    if (zhifu && zhishi) {
      // 值符为吉星
      const auspiciousStars = ['天任', '天辅', '天心'];
      if (auspiciousStars.includes(zhifu.star)) {
        score += 15;
        factors.push('值符为吉星');
      } else if (['天蓬', '天冲', '天柱', '天芮'].includes(zhifu.star)) {
        score -= 10;
        factors.push('值符为凶星');
      }
      
      // 值使为吉门
      const auspiciousDoors = ['开门', '休门', '生门'];
      if (auspiciousDoors.includes(zhishi.door)) {
        score += 12;
        factors.push('值使为吉门');
      } else if (['死门', '惊门', '伤门'].includes(zhishi.door)) {
        score -= 8;
        factors.push('值使为凶门');
      }
    }
    
    // 2. 时辰分析
    const hourZhi = timeInfo.hour.zhi;
    const auspiciousHours = ['子', '卯', '午', '酉']; // 四正时
    if (auspiciousHours.includes(hourZhi)) {
      score += 8;
      factors.push('四正时辰，力量强盛');
    }
    
    // 3. 节气分析
    const jieqi = timeInfo.jieqi;
    const seasonalBonus = {
      '春分': 10, '夏至': 10, '秋分': 10, '冬至': 10, // 四季之中
      '立春': 8, '立夏': 8, '立秋': 8, '立冬': 8     // 四立之始
    };
    if (seasonalBonus[jieqi]) {
      score += seasonalBonus[jieqi];
      factors.push(`${jieqi}节气有利`);
    }
    
    // 4. 阴阳遁分析
    const currentMonth = new Date().getMonth() + 1;
    const isYangSeason = currentMonth >= 3 && currentMonth <= 8; // 春夏为阳
    if ((timeInfo.yindun && !isYangSeason) || (!timeInfo.yindun && isYangSeason)) {
      score += 5;
      factors.push('阴阳遁与季节相配');
    }
    
    // 5. 格局分析（简化）
     let hasAuspiciousPattern = false;
     const auspiciousStarsForPattern = ['天任', '天辅', '天心'];
     const auspiciousDoorsForPattern = ['开门', '休门', '生门'];
     
     for (let i = 0; i < dipan.length; i++) {
       const palace = dipan[i];
       if (palace && palace.star && palace.door) {
         // 检查吉格
         if (auspiciousStarsForPattern.includes(palace.star) && auspiciousDoorsForPattern.includes(palace.door)) {
           score += 6;
           hasAuspiciousPattern = true;
         }
       }
     }
     if (hasAuspiciousPattern) {
       factors.push('存在吉利格局');
     }
    
    // 6. 综合评估
    let timing, recommendation;
    if (score >= 30) {
      timing = '极佳';
      recommendation = '时机极佳，宜积极行动，把握良机';
    } else if (score >= 20) {
      timing = '很好';
      recommendation = '时机很好，可以大胆行动';
    } else if (score >= 10) {
      timing = '较好';
      recommendation = '时机较好，可以谨慎行动';
    } else if (score >= 0) {
      timing = '适中';
      recommendation = '时机适中，宜观察后行动';
    } else if (score >= -10) {
      timing = '较差';
      recommendation = '时机较差，宜谨慎观望';
    } else {
      timing = '不佳';
      recommendation = '时机不佳，宜暂缓行动';
    }
    
    return {
      timing,
      score,
      recommendation,
      factors,
      analysis: {
        zhifuAnalysis: zhifu ? `值符${typeof zhifu === 'object' ? zhifu.star : zhifu}` : '值符未知',
        zhishiAnalysis: zhishi ? `值使${typeof zhishi === 'object' ? zhishi.door : zhishi}` : '值使未知',
        hourAnalysis: `${hourZhi}时`,
        seasonAnalysis: `${jieqi}节气`,
        yindunAnalysis: timeInfo.yindun ? '阴遁' : '阳遁'
      }
    };
  }
  
  getRecommendation(score) {
    if (score >= 20) {
      return '时机很好，可以积极行动';
    } else if (score >= 15) {
      return '时机较好，可以谨慎行动';
    } else if (score >= 10) {
      return '时机一般，建议观望';
    } else {
      return '时机不佳，建议等待';
    }
  }
}

// 预测生成器类
class PredictionGenerator {
  constructor(analyzer) {
    this.analyzer = analyzer;
  }
  
  generatePrediction(qimenPan, yongShenAnalysis, question, patterns) {
    // 使用主分析器的概率计算方法
    const probability = this.analyzer.calculateProbability(yongShenAnalysis, patterns);
    
    return {
      overall: this.analyzer.generateOverallAssessment(probability, yongShenAnalysis),
      probability: probability,
      details: this.analyzer.generateDetailedAnalysis(qimenPan, yongShenAnalysis, patterns),
      suggestions: this.analyzer.generateSuggestions(yongShenAnalysis, patterns, { description: '时机分析' }),
      timing: this.calculateTiming(yongShenAnalysis, qimenPan)
    };
  }
  
  calculateOverallScore(yongShenAnalysis, patterns) {
    let score = 50;
    
    // 格局评分
    for (const pattern of patterns) {
      const patternData = this.analyzer.PATTERNS[pattern.name];
      if (patternData) {
        score += patternData.score || 0;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  interpretScore(score) {
    if (score >= 80) return '大吉，事情非常顺利';
    if (score >= 65) return '较为有利，成功概率较高';
    if (score >= 50) return '中等，需要努力争取';
    if (score >= 35) return '较为困难，需要谨慎行事';
    return '不利，建议暂缓或改变策略';
  }
  
  generateDetailedAnalysis(yongShenAnalysis, patterns) {
    return ['用神状态良好', '格局组合有利'];
  }
  
  generateSuggestions(yongShenAnalysis, qimenPan, question) {
    return ['把握时机', '积极行动'];
  }
  
  calculateTiming(yongShenAnalysis, qimenPan) {
    return {
      bestTime: '近期',
      avoidTime: '无特别禁忌'
    };
  }

}

module.exports = QimenAnalyzer;