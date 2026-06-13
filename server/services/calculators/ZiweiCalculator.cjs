// 紫微斗数计算器模块
// 专注于排盘计算逻辑，不包含分析解释

const BaseData = require('../common/BaseData.cjs');
const BaziCalculator = require('./BaziCalculator.cjs');

class ZiweiCalculator {
  constructor() {
    this.baseData = new BaseData();
    this.baziCalculator = new BaziCalculator();
    
    // 十四主星数据
    this.mainStars = {
      1: '紫微', 2: '天机', 3: '太阳', 4: '武曲', 5: '天同',
      6: '廉贞', 7: '天府', 8: '太阴', 9: '贪狼', 10: '巨门',
      11: '天相', 12: '天梁', 13: '七杀', 14: '破军'
    };
    
    // 六吉星
    this.luckyStars = ['文昌', '文曲', '左辅', '右弼', '天魁', '天钺'];
    
    // 六煞星
    this.unluckyStars = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];
    
    // 四化表（使用BaseData统一提供）
    this.sihuaTable = this.baseData.getSiHuaTable();
    
    // 紫微星位置查找表[局数][日数-1] = 地支索引
    // 基于《紫微斗数全书》安星法，参考标准万年历对照表
    this.ziweiTable = {
      2: [1,2,4,3,5,4,6,5,7,6,8,7,10,9,11,10,0,11,2,1,4,3,6,5,8,7,10,9,0,11],
      3: [0,1,2,3,5,4,6,5,7,8,6,9,8,10,7,11,10,0,11,1,2,3,5,4,6,5,7,8,6,9],
      4: [2,1,0,11,3,2,1,0,4,3,2,5,6,5,4,3,7,6,9,8,11,10,7,8,1,0,11,6,9,10],
      5: [4,3,2,1,0,5,4,3,2,9,8,7,6,1,0,11,10,3,2,1,0,7,6,5,4,11,10,9,8,3],
      6: [10,7,11,8,5,2,9,6,4,0,11,10,8,9,7,6,4,3,0,1,11,8,5,6,2,3,4,0,5,6]
    };
  }
  
  // 计算完整紫微斗数排盘
  calculateZiweiChart(birth_date, birth_time, gender) {
    // 先计算八字
    const baziChart = this.baziCalculator.calculatePreciseBazi(birth_date, birth_time);
    
    // 计算农历信息
    const lunarInfo = this.calculateLunarInfo(birth_date);
    
    // 计算命宫
    const mingGong = this.calculateMingGong(lunarInfo.month, lunarInfo.hour);
    
    // 计算身宫
    const shenGong = this.calculateShenGong(lunarInfo.month, lunarInfo.hour);
    
    // 计算五行局（需要命宫地支和年干）
    const yearStemIndex = this.baseData.getStemIndex(baziChart.year_pillar.stem);
    const wuxingJu = this.calculateWuxingJu(mingGong.index, yearStemIndex);
    
    // 安排十四主星（基于五行局和农历日）
    const mainStarPositions = this.arrangeMainStars(wuxingJu.number, lunarInfo.day);
    
    // 安排六吉星
    const luckyStarPositions = this.arrangeLuckyStars(baziChart, lunarInfo);
    
    // 安排六煞星
    const unluckyStarPositions = this.arrangeUnluckyStars(baziChart, lunarInfo);
    
    // 计算四化（使用年柱的天干，已考虑立春调整）
    const siHua = this.calculateSiHua(baziChart.year_pillar.stem);
    
    // 生成十二宫位
    const twelvePalaces = this.generateTwelvePalaces(
      mingGong.index, 
      mainStarPositions, 
      luckyStarPositions, 
      unluckyStarPositions
    );
    
    return {
      bazi_info: baziChart,
      lunar_info: lunarInfo,
      ming_gong: mingGong,
      shen_gong: shenGong,
      wuxing_ju: wuxingJu,
      main_star_positions: mainStarPositions,
      lucky_star_positions: luckyStarPositions,
      unlucky_star_positions: unluckyStarPositions,
      si_hua: siHua,
      twelve_palaces: twelvePalaces
    };
  }
  
  // 计算农历信息（使用BaseData的农历转换）
  calculateLunarInfo(birth_date) {
    const birthDate = new Date(birth_date);
    const year = birthDate.getFullYear();
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    
    // 使用精确的公历转农历算法
    const lunar = this.baseData.solarToLunar(year, month, day);
    
    return {
      year: lunar.year,
      month: lunar.month,
      day: lunar.day,
      isLeap: lunar.isLeap,
      solar_year: year,
      solar_month: month,
      solar_day: day,
      hour: this.getHourIndex(birthDate.getHours())
    };
  }
  
  // 获取时辰索引
  getHourIndex(hour) {
    if (hour >= 23 || hour < 1) return 0;  // 子时
    if (hour >= 1 && hour < 3) return 1;   // 丑时
    if (hour >= 3 && hour < 5) return 2;   // 寅时
    if (hour >= 5 && hour < 7) return 3;   // 卯时
    if (hour >= 7 && hour < 9) return 4;   // 辰时
    if (hour >= 9 && hour < 11) return 5;  // 巳时
    if (hour >= 11 && hour < 13) return 6; // 午时
    if (hour >= 13 && hour < 15) return 7; // 未时
    if (hour >= 15 && hour < 17) return 8; // 申时
    if (hour >= 17 && hour < 19) return 9; // 酉时
    if (hour >= 19 && hour < 21) return 10; // 戌时
    if (hour >= 21 && hour < 23) return 11; // 亥时
    return 6; // 默认午时
  }
  
  // 计算命宫
  calculateMingGong(month, hour) {
    // 命宫 = 寅宫 + 月份 - 时辰
    const mingGongIndex = (2 + month - hour + 12) % 12;
    
    return {
      index: mingGongIndex,
      position: this.baseData.getBranchByIndex(mingGongIndex),
      description: `命宫在${this.baseData.getBranchByIndex(mingGongIndex)}`
    };
  }
  
  // 计算身宫
  calculateShenGong(month, hour) {
    // 身宫 = 亥宫 + 月份 + 时辰
    const shenGongIndex = (11 + month + hour) % 12;
    
    return {
      index: shenGongIndex,
      position: this.baseData.getBranchByIndex(shenGongIndex),
      description: `身宫在${this.baseData.getBranchByIndex(shenGongIndex)}`
    };
  }
  
  // 计算五行局（基于命宫天干的纳音五行）
  calculateWuxingJu(mingGongIndex, yearStemIndex) {
    // 命宫天干：使用五虎遁月公式
    // 命宫地支对应的月份 = (mingGongIndex - 2 + 12) % 12 + 1
    const lunarMonth = (mingGongIndex - 2 + 12) % 12 + 1;
    const mingStemIndex = (((yearStemIndex % 5) * 2 + lunarMonth + 1) % 10 + 10) % 10;
    
    // 纳音五行决定五行局
    const nayin = this.baseData.getNayinWuxing(mingStemIndex, mingGongIndex);
    
    const wuxingJuMap = {
      '金': { name: '金四局', number: 4, element: '金' },
      '木': { name: '木三局', number: 3, element: '木' },
      '水': { name: '水二局', number: 2, element: '水' },
      '火': { name: '火六局', number: 6, element: '火' },
      '土': { name: '土五局', number: 5, element: '土' }
    };
    
    return wuxingJuMap[nayin.element] || wuxingJuMap['水'];
  }
  
  // 安排十四主星（基于紫微安星法）
  arrangeMainStars(wuxingJuNumber, lunarDay) {
    const starPositions = {};
    
    // 初始化所有宫位
    for (let i = 0; i < 12; i++) {
      starPositions[i] = [];
    }
    
    // 紫微星位置：查表法，基于五行局数和农历日
    const day = Math.max(1, Math.min(lunarDay, 30));
    const ziweiPosition = (this.ziweiTable[wuxingJuNumber] || this.ziweiTable[2])[day - 1];
    starPositions[ziweiPosition].push('紫微');
    
    // 紫微星系：紫微逆时针排列
    // 口诀：“紫微逆去天机星，隔一太阳武曲辰，连接天同空二宫，廉贞居处方是真”
    // 紫微->天机(前1)->空->太阳(前3)->武曲(前4)->天同(前5)->空->空->廉贞(前8)
    const tianji = (ziweiPosition - 1 + 12) % 12;
    starPositions[tianji].push('天机');
    
    const taiyang = (ziweiPosition - 3 + 12) % 12;
    starPositions[taiyang].push('太阳');
    
    const wuqu = (ziweiPosition - 4 + 12) % 12;
    starPositions[wuqu].push('武曲');
    
    const tiantong = (ziweiPosition - 5 + 12) % 12;
    starPositions[tiantong].push('天同');
    
    const lianzhen = (ziweiPosition - 8 + 12) % 12;
    starPositions[lianzhen].push('廉贞');
    
    // 天府星位置：与紫微关于寅申轴对称
    // 公式：天府 = (16 - 紫微) % 12
    const tianfu = (16 - ziweiPosition) % 12;
    starPositions[tianfu].push('天府');
    
    // 天府星系：天府顺时针排列
    // 天府->太阴(后1)->贪狼(后2)->巨门(后3)->天相(后4)->天梁(后5)->七杀(后6)->空->空->破军(后10)
    const taiyin = (tianfu + 1) % 12;
    starPositions[taiyin].push('太阴');
    
    const tanlang = (tianfu + 2) % 12;
    starPositions[tanlang].push('贪狼');
    
    const jumen = (tianfu + 3) % 12;
    starPositions[jumen].push('巨门');
    
    const tianxiang = (tianfu + 4) % 12;
    starPositions[tianxiang].push('天相');
    
    const tianliang = (tianfu + 5) % 12;
    starPositions[tianliang].push('天梁');
    
    const qisha = (tianfu + 6) % 12;
    starPositions[qisha].push('七杀');
    
    const pojun = (tianfu + 10) % 12;
    starPositions[pojun].push('破军');
    
    return starPositions;
  }
  
  // 安排六吉星
  arrangeLuckyStars(baziChart, lunarInfo) {
    const starPositions = {};
    
    // 初始化所有宫位
    for (let i = 0; i < 12; i++) {
      starPositions[i] = [];
    }
    
    // 文昌文曲的安排
    const wenchang = this.calculateWenchangPosition(lunarInfo.hour);
    const wenqu = this.calculateWenquPosition(lunarInfo.hour);
    
    starPositions[wenchang].push('文昌');
    starPositions[wenqu].push('文曲');
    
    // 左辅右弼的安排
    const zuofu = this.calculateZuofuPosition(lunarInfo.month);
    const youbi = this.calculateYoubiPosition(lunarInfo.month);
    
    starPositions[zuofu].push('左辅');
    starPositions[youbi].push('右弼');
    
    // 天魁天钺的安排
    const tiankui = this.calculateTiankuiPosition(baziChart.year_pillar.stem);
    const tianyue = this.calculateTianyuePosition(baziChart.year_pillar.stem);
    
    starPositions[tiankui].push('天魁');
    starPositions[tianyue].push('天钺');
    
    return starPositions;
  }
  
  // 计算文昌位置
  calculateWenchangPosition(hour) {
    const wenchangTable = [9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8];
    return wenchangTable[hour] || 0;
  }
  
  // 计算文曲位置
  calculateWenquPosition(hour) {
    const wenquTable = [3, 2, 1, 0, 11, 10, 9, 8, 7, 6, 5, 4];
    return wenquTable[hour] || 0;
  }
  
  // 计算左辅位置
  calculateZuofuPosition(month) {
    return (month + 1) % 12;
  }
  
  // 计算右弼位置
  calculateYoubiPosition(month) {
    return (13 - month) % 12;
  }
  
  // 计算天魁位置
  calculateTiankuiPosition(yearStem) {
    const tiankuiTable = {
      '甲': 1, '乙': 0, '丙': 11, '丁': 10, '戊': 1,
      '己': 0, '庚': 9, '辛': 8, '壬': 7, '癸': 6
    };
    return tiankuiTable[yearStem] || 0;
  }
  
  // 计算天钺位置
  calculateTianyuePosition(yearStem) {
    const tianyueTable = {
      '甲': 7, '乙': 6, '丙': 5, '丁': 4, '戊': 7,
      '己': 6, '庚': 3, '辛': 2, '壬': 1, '癸': 0
    };
    return tianyueTable[yearStem] || 0;
  }
  
  // 安排六煞星
  arrangeUnluckyStars(baziChart, lunarInfo) {
    const starPositions = {};
    
    // 初始化所有宫位
    for (let i = 0; i < 12; i++) {
      starPositions[i] = [];
    }
    
    // 擎羊陀罗的安排
    const qingyang = this.calculateQingyangPosition(baziChart.year_pillar.branch);
    const tuoluo = this.calculateTuoluoPosition(baziChart.year_pillar.branch);
    
    starPositions[qingyang].push('擎羊');
    starPositions[tuoluo].push('陀罗');
    
    // 火星铃星的安排
    const huoxing = this.calculateHuoxingPosition(lunarInfo.year, lunarInfo.hour);
    const lingxing = this.calculateLingxingPosition(lunarInfo.year, lunarInfo.hour);
    
    starPositions[huoxing].push('火星');
    starPositions[lingxing].push('铃星');
    
    // 地空地劫的安排
    const dikong = this.calculateDikongPosition(lunarInfo.hour);
    const dijie = this.calculateDijiePosition(lunarInfo.hour);
    
    starPositions[dikong].push('地空');
    starPositions[dijie].push('地劫');
    
    return starPositions;
  }
  
  // 计算擎羊位置
  calculateQingyangPosition(yearBranch) {
    const branchIndex = this.baseData.getBranchIndex(yearBranch);
    return (branchIndex + 1) % 12;
  }
  
  // 计算陀罗位置
  calculateTuoluoPosition(yearBranch) {
    const branchIndex = this.baseData.getBranchIndex(yearBranch);
    return (branchIndex - 1 + 12) % 12;
  }
  
  // 计算火星位置
  calculateHuoxingPosition(year, hour) {
    const yearBranchIndex = (year - 4) % 12;
    return (yearBranchIndex + hour) % 12;
  }
  
  // 计算铃星位置
  calculateLingxingPosition(year, hour) {
    const yearBranchIndex = (year - 4) % 12;
    return (yearBranchIndex - hour + 12) % 12;
  }
  
  // 计算地空位置
  calculateDikongPosition(hour) {
    return (11 - hour + 12) % 12;
  }
  
  // 计算地劫位置
  calculateDijiePosition(hour) {
    return (hour + 1) % 12;
  }
  
  // 计算四化（使用BaseData统一四化表）
  calculateSiHua(yearStem) {
    // yearStem可以是天干字符串（如'甲'）或年份数字
    if (typeof yearStem === 'number') {
      yearStem = this.baseData.getStemByIndex((yearStem - 4) % 10);
    }
    const siHua = this.sihuaTable[yearStem] || this.sihuaTable['甲'];
    
    return {
      year_stem: yearStem,
      hua_lu: { star: siHua.lu, meaning: '化禄主财禄，增强星曜的正面能量' },
      hua_quan: { star: siHua.quan, meaning: '化权主权力，增强星曜的权威性' },
      hua_ke: { star: siHua.ke, meaning: '化科主名声，增强星曜的声誉' },
      hua_ji: { star: siHua.ji, meaning: '化忌主阻碍，需要特别注意的星曜' }
    };
  }
  
  // 生成十二宫位
  generateTwelvePalaces(mingGongIndex, mainStarPositions, luckyStarPositions, unluckyStarPositions) {
    const palaceNames = ['命宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫', '迁移宫', '交友宫', '事业宫', '田宅宫', '福德宫', '父母宫'];
    const palaces = {};
    
    for (let i = 0; i < 12; i++) {
      const palaceIndex = (mingGongIndex + i) % 12;
      const palaceName = palaceNames[i];
      
      // 整合所有星曜
      const allStars = [
        ...(mainStarPositions[palaceIndex] || []),
        ...(luckyStarPositions[palaceIndex] || []),
        ...(unluckyStarPositions[palaceIndex] || [])
      ];
      
      const mainStars = mainStarPositions[palaceIndex] || [];
      const luckyStars = luckyStarPositions[palaceIndex] || [];
      const unluckyStars = unluckyStarPositions[palaceIndex] || [];
      
      palaces[palaceName] = {
        position: this.baseData.getBranchByIndex(palaceIndex),
        palace_index: palaceIndex,
        all_stars: allStars,
        main_stars: mainStars,
        lucky_stars: luckyStars,
        unlucky_stars: unluckyStars,
        star_count: allStars.length
      };
    }
    
    return palaces;
  }
  
  // 计算大限（基于五行局和命宫天干阴阳）
  calculateMajorPeriods(mingGongIndex, gender, wuxingJu, birthYear, yearStemIndex) {
    const periods = [];
    const startAge = wuxingJu.number;
    
    // 大限方向由命宫天干阴阳和性别共同决定
    const lunarMonth = (mingGongIndex - 2 + 12) % 12 + 1;
    const monthBranchIndex = (lunarMonth + 1) % 12;
    const mingStemIndex = (((yearStemIndex % 5) * 2 + monthBranchIndex) % 10 + 10) % 10;
    const isYangMing = mingStemIndex % 2 === 0;
    const isMale = gender === 'male' || gender === '男';
    const direction = (isMale && isYangMing) || (!isMale && !isYangMing) ? 1 : -1;
    
    for (let i = 0; i < 12; i++) {
      const palaceIndex = (mingGongIndex + direction * i + 12) % 12;
      const startAgeForPeriod = startAge + i * 10;
      
      periods.push({
        sequence: i + 1,
        palace_name: this.getPalaceNameByIndex(palaceIndex, mingGongIndex),
        position: this.baseData.getBranchByIndex(palaceIndex),
        start_age: startAgeForPeriod,
        end_age: startAgeForPeriod + 9,
        start_year: birthYear + startAgeForPeriod,
        end_year: birthYear + startAgeForPeriod + 9
      });
    }
    
    return periods;
  }
  
  // 根据索引获取宫位名称
  getPalaceNameByIndex(palaceIndex, mingGongIndex) {
    const palaceNames = ['命宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫', '迁移宫', '交友宫', '事业宫', '田宅宫', '福德宫', '父母宫'];
    const relativeIndex = (palaceIndex - mingGongIndex + 12) % 12;
    return palaceNames[relativeIndex];
  }
}

module.exports = ZiweiCalculator;