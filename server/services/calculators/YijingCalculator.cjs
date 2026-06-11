// 易经计算器模块
// 专注于起卦计算逻辑，不包含卦象解释

const EnhancedRandom = require('../common/EnhancedRandom.cjs');

class YijingCalculator {
  constructor() {
    this.enhancedRandom = new EnhancedRandom();
    
    // 八卦基础数据
    this.trigrams = {
      '乾': { binary: '111', number: 1, element: '金', nature: '阳' },
      '兑': { binary: '110', number: 2, element: '金', nature: '阴' },
      '离': { binary: '101', number: 3, element: '火', nature: '阴' },
      '震': { binary: '001', number: 4, element: '木', nature: '阳' },
      '巽': { binary: '011', number: 5, element: '木', nature: '阴' },
      '坎': { binary: '010', number: 6, element: '水', nature: '阳' },
      '艮': { binary: '100', number: 7, element: '土', nature: '阳' },
      '坤': { binary: '000', number: 8, element: '土', nature: '阴' }
    };
    
    // 六十四卦索引表
    this.hexagramIndex = this.buildHexagramIndex();
  }
  
  // 构建六十四卦索引
  buildHexagramIndex() {
    const index = {};
    
    // 简化的六十四卦映射（实际应该包含完整的64卦）
    for (let upper = 1; upper <= 8; upper++) {
      for (let lower = 1; lower <= 8; lower++) {
        const hexNumber = (upper - 1) * 8 + lower;
        const upperBinary = this.getTrigramBinary(upper);
        const lowerBinary = this.getTrigramBinary(lower);
        const fullBinary = upperBinary + lowerBinary;
        
        index[fullBinary] = hexNumber;
        index[hexNumber] = {
          upper: upper,
          lower: lower,
          binary: fullBinary,
          upperTrigram: this.getTrigramName(upper),
          lowerTrigram: this.getTrigramName(lower)
        };
      }
    }
    
    return index;
  }
  
  // 根据数字获取卦的二进制
  getTrigramBinary(number) {
    const binaryMap = {
      1: '111', // 乾
      2: '110', // 兑
      3: '101', // 离
      4: '001', // 震
      5: '011', // 巽
      6: '010', // 坎
      7: '100', // 艮
      8: '000'  // 坤
    };
    return binaryMap[number] || '111';
  }
  
  // 根据数字获取卦名
  getTrigramName(number) {
    const nameMap = {
      1: '乾', 2: '兑', 3: '离', 4: '震',
      5: '巽', 6: '坎', 7: '艮', 8: '坤'
    };
    return nameMap[number] || '乾';
  }
  
  // 增强金钱卦起卦法
  generateHexagramByCoin() {
    const hexagramData = this.enhancedRandom.generateFullHexagram();
    const mainHexNumber = this.getHexagramByBinary(hexagramData.binary);
    
    return {
      mainHex: mainHexNumber,
      changingLines: hexagramData.changingLines,
      method: hexagramData.method,
      randomQuality: hexagramData.quality,
      binary: hexagramData.binary,
      upperTrigram: this.getUpperTrigram(hexagramData.binary),
      lowerTrigram: this.getLowerTrigram(hexagramData.binary)
    };
  }
  
  // 增强数字起卦法
  generateHexagramByNumber(currentTime, userId) {
    const timeNum = currentTime.getTime();
    const userNum = userId ? parseInt(String(userId).slice(-3)) || 123 : 123;
    
    // 使用增强随机数生成器增加随机性
    const randomFactor = Math.floor(this.enhancedRandom.getHighQualityRandom() * 1000);
    
    const upperTrigramNum = (Math.floor(timeNum / 1000) + userNum + randomFactor) % 8 || 8;
    const lowerTrigramNum = (Math.floor(timeNum / 100) + userNum * 2 + randomFactor * 2) % 8 || 8;
    const changingLinePos = (timeNum + userNum + randomFactor) % 6 + 1;
    
    const mainHexNumber = this.getHexagramNumber(upperTrigramNum, lowerTrigramNum);
    const binary = this.getTrigramBinary(upperTrigramNum) + this.getTrigramBinary(lowerTrigramNum);
    
    return {
      mainHex: mainHexNumber,
      changingLines: [changingLinePos],
      method: '增强数字起卦法',
      upperTrigram: upperTrigramNum,
      lowerTrigram: lowerTrigramNum,
      randomQuality: this.enhancedRandom.assessRandomQuality(),
      binary: binary
    };
  }
  
  // 梅花易数起卦法
  generateHexagramByPlumBlossom(currentTime, userId, question) {
    const questionLength = question ? question.length : 8;
    const timeSum = currentTime.getHours() + currentTime.getMinutes();
    const userFactor = userId ? parseInt(String(userId).slice(-2)) || 12 : 12;
    
    // 使用增强随机数增加变化
    const randomEnhancement = Math.floor(this.enhancedRandom.getHighQualityRandom() * 50);
    
    const upperTrigramNum = (questionLength + timeSum + randomEnhancement) % 8 || 8;
    const lowerTrigramNum = (questionLength + timeSum + userFactor + randomEnhancement) % 8 || 8;
    const changingLinePos = (questionLength + timeSum + userFactor + randomEnhancement) % 6 + 1;
    
    const mainHexNumber = this.getHexagramNumber(upperTrigramNum, lowerTrigramNum);
    const binary = this.getTrigramBinary(upperTrigramNum) + this.getTrigramBinary(lowerTrigramNum);
    
    return {
      mainHex: mainHexNumber,
      changingLines: [changingLinePos],
      method: '梅花易数起卦法',
      upperTrigram: upperTrigramNum,
      lowerTrigram: lowerTrigramNum,
      questionLength: questionLength,
      binary: binary
    };
  }
  
  // 时间起卦法
  generateHexagramByTime(currentTime, userId) {
    const year = currentTime.getFullYear();
    const month = currentTime.getMonth() + 1;
    const day = currentTime.getDate();
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    
    const userFactor = userId ? parseInt(String(userId).slice(-2)) || 1 : 1;
    
    // 使用增强随机数优化
    const timeRandom = this.enhancedRandom.getHighQualityRandom();
    const randomBoost = Math.floor(timeRandom * 100);
    
    const upperTrigramNum = (year + month + day + userFactor + randomBoost) % 8 || 8;
    const lowerTrigramNum = (year + month + day + hour + minute + userFactor + randomBoost) % 8 || 8;
    const changingLinePos = (year + month + day + hour + minute + userFactor + randomBoost) % 6 + 1;
    
    const mainHexNumber = this.getHexagramNumber(upperTrigramNum, lowerTrigramNum);
    const binary = this.getTrigramBinary(upperTrigramNum) + this.getTrigramBinary(lowerTrigramNum);
    
    return {
      mainHex: mainHexNumber,
      changingLines: [changingLinePos],
      method: '时间起卦法',
      upperTrigram: upperTrigramNum,
      lowerTrigram: lowerTrigramNum,
      timeFactors: { year, month, day, hour, minute },
      binary: binary
    };
  }
  
  // 个性化起卦法
  generatePersonalizedHexagram(currentTime, userId, question) {
    // 使用个性化随机数
    const personalizedRandom = this.enhancedRandom.generatePersonalizedRandom(userId, question);
    
    // 基于问题内容的权重
    const questionWeight = this.calculateQuestionWeight(question);
    
    // 时间因子
    const timeFactor = (currentTime.getTime() % 86400000) / 86400000;
    
    // 综合计算上下卦
    const combinedFactor = (personalizedRandom + questionWeight + timeFactor) / 3;
    const upperTrigramNum = Math.floor(combinedFactor * 8) + 1;
    const lowerTrigramNum = Math.floor((combinedFactor * 13) % 8) + 1;
    
    // 动爻位置基于问题的复杂度
    const questionComplexity = question ? question.length % 6 : 0;
    const changingLinePos = (Math.floor(personalizedRandom * 6) + questionComplexity) % 6 + 1;
    
    const mainHexNumber = this.getHexagramNumber(upperTrigramNum, lowerTrigramNum);
    const binary = this.getTrigramBinary(upperTrigramNum) + this.getTrigramBinary(lowerTrigramNum);
    
    return {
      mainHex: mainHexNumber,
      changingLines: [changingLinePos],
      method: '个性化起卦法',
      upperTrigram: upperTrigramNum,
      lowerTrigram: lowerTrigramNum,
      personalizationFactor: {
        userInfluence: personalizedRandom,
        questionWeight: questionWeight,
        timeFactor: timeFactor
      },
      binary: binary
    };
  }
  
  // 计算问题权重
  calculateQuestionWeight(question) {
    if (!question) return 0.5;
    
    // 基于问题长度和内容的权重计算
    const lengthWeight = Math.min(question.length / 50, 1);
    
    // 关键词权重
    const keywords = ['事业', '感情', '财运', '健康', '学业', '婚姻', '工作', '投资'];
    const keywordCount = keywords.filter(keyword => question.includes(keyword)).length;
    const keywordWeight = Math.min(keywordCount / keywords.length, 1);
    
    // 问号数量（表示疑问程度）
    const questionMarks = (question.match(/[？?]/g) || []).length;
    const questionWeight = Math.min(questionMarks / 3, 1);
    
    return (lengthWeight + keywordWeight + questionWeight) / 3;
  }
  
  // 根据上下卦数字获取卦号
  getHexagramNumber(upperTrigram, lowerTrigram) {
    return (upperTrigram - 1) * 8 + lowerTrigram;
  }
  
  // 根据二进制获取卦号
  getHexagramByBinary(binary) {
    return this.hexagramIndex[binary] || 1;
  }
  
  // 获取上卦
  getUpperTrigram(binary) {
    const upperBinary = binary.substring(0, 3);
    for (const [name, data] of Object.entries(this.trigrams)) {
      if (data.binary === upperBinary) {
        return { name: name, number: data.number, element: data.element };
      }
    }
    return { name: '乾', number: 1, element: '金' };
  }
  
  // 获取下卦
  getLowerTrigram(binary) {
    const lowerBinary = binary.substring(3, 6);
    for (const [name, data] of Object.entries(this.trigrams)) {
      if (data.binary === lowerBinary) {
        return { name: name, number: data.number, element: data.element };
      }
    }
    return { name: '乾', number: 1, element: '金' };
  }
  
  // 计算变卦
  calculateChangingHexagram(mainHexBinary, changingLines) {
    if (!changingLines || changingLines.length === 0) {
      return null;
    }
    
    let changingBinary = mainHexBinary.split('');
    
    // 变换动爻
    changingLines.forEach(linePos => {
      const index = 6 - linePos; // 从下往上数
      if (index >= 0 && index < 6) {
        changingBinary[index] = changingBinary[index] === '1' ? '0' : '1';
      }
    });
    
    const changingHexBinary = changingBinary.join('');
    const changingHexNumber = this.getHexagramByBinary(changingHexBinary);
    
    return {
      hexNumber: changingHexNumber,
      binary: changingHexBinary,
      upperTrigram: this.getUpperTrigram(changingHexBinary),
      lowerTrigram: this.getLowerTrigram(changingHexBinary)
    };
  }
  
  // 计算互卦
  calculateInterHexagram(mainHexBinary) {
    // 互卦取2、3、4爻为下卦，3、4、5爻为上卦
    const lines = mainHexBinary.split('');
    const lowerInter = lines[4] + lines[3] + lines[2]; // 2、3、4爻
    const upperInter = lines[3] + lines[2] + lines[1]; // 3、4、5爻
    
    const interBinary = upperInter + lowerInter;
    const interHexNumber = this.getHexagramByBinary(interBinary);
    
    return {
      hexNumber: interHexNumber,
      binary: interBinary,
      upperTrigram: this.getUpperTrigram(interBinary),
      lowerTrigram: this.getLowerTrigram(interBinary)
    };
  }
  
  // 计算错卦（阴阳相反）
  calculateOppositeHexagram(mainHexBinary) {
    const oppositeBinary = mainHexBinary.split('').map(bit => bit === '1' ? '0' : '1').join('');
    const oppositeHexNumber = this.getHexagramByBinary(oppositeBinary);
    
    return {
      hexNumber: oppositeHexNumber,
      binary: oppositeBinary,
      upperTrigram: this.getUpperTrigram(oppositeBinary),
      lowerTrigram: this.getLowerTrigram(oppositeBinary)
    };
  }
  
  // 计算综卦（上下颠倒）
  calculateReverseHexagram(mainHexBinary) {
    const reverseBinary = mainHexBinary.split('').reverse().join('');
    const reverseHexNumber = this.getHexagramByBinary(reverseBinary);
    
    return {
      hexNumber: reverseHexNumber,
      binary: reverseBinary,
      upperTrigram: this.getUpperTrigram(reverseBinary),
      lowerTrigram: this.getLowerTrigram(reverseBinary)
    };
  }
  
  // 分析卦象的五行关系
  analyzeElementRelation(upperTrigram, lowerTrigram) {
    const upperElement = upperTrigram.element;
    const lowerElement = lowerTrigram.element;
    
    // 五行生克关系
    const relations = {
      '木': { generates: '火', controls: '土', generatedBy: '水', controlledBy: '金' },
      '火': { generates: '土', controls: '金', generatedBy: '木', controlledBy: '水' },
      '土': { generates: '金', controls: '水', generatedBy: '火', controlledBy: '木' },
      '金': { generates: '水', controls: '木', generatedBy: '土', controlledBy: '火' },
      '水': { generates: '木', controls: '火', generatedBy: '金', controlledBy: '土' }
    };
    
    let relationship = '和谐';
    if (relations[upperElement].generates === lowerElement) {
      relationship = '上生下';
    } else if (relations[lowerElement].generates === upperElement) {
      relationship = '下生上';
    } else if (relations[upperElement].controls === lowerElement) {
      relationship = '上克下';
    } else if (relations[lowerElement].controls === upperElement) {
      relationship = '下克上';
    }
    
    return {
      upperElement: upperElement,
      lowerElement: lowerElement,
      relationship: relationship,
      harmony: relationship === '和谐' || relationship.includes('生')
    };
  }
  
  // 获取随机数生成器统计信息
  getRandomStatistics() {
    return this.enhancedRandom.getStatistics();
  }
  
  // 刷新随机数熵源
  refreshRandomEntropy() {
    this.enhancedRandom.refreshEntropyPool();
  }
}

module.exports = YijingCalculator;