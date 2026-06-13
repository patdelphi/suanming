// 增强四化飞星系统
// 实现动态四化分析和宫位互动效应计算

const BaseData = require('./BaseData.cjs');

class EnhancedSiHua {
  constructor() {
    this.baseData = new BaseData();
    // 使用BaseData统一的四化表
    this.sihuaTable = this.baseData.getSiHuaTable();
    
    // 四化星的基本属性
    this.sihuaProperties = {
      '化禄': {
        nature: '财禄',
        element: '土',
        energy: 'positive',
        strength: 5,
        keywords: ['财富', '享受', '缘分', '贵人'],
        palaceEffects: {
          '命宫': '增强个人魅力和财运',
          '财帛宫': '财源广进，理财有道',
          '事业宫': '事业发展顺利，收入稳定',
          '夫妻宫': '感情和谐，配偶有助'
        }
      },
      '化权': {
        nature: '权威',
        element: '木',
        energy: 'active',
        strength: 4,
        keywords: ['权力', '领导', '成就', '竞争'],
        palaceEffects: {
          '命宫': '增强领导能力和决策力',
          '事业宫': '职位提升，权责增加',
          '交友宫': '在团体中有影响力',
          '迁移宫': '外出发展有利'
        }
      },
      '化科': {
        nature: '名声',
        element: '水',
        energy: 'gentle',
        strength: 3,
        keywords: ['名声', '学问', '考试', '文化'],
        palaceEffects: {
          '命宫': '提升名声和学识',
          '子女宫': '子女学业有成',
          '交友宫': '结交文化界朋友',
          '迁移宫': '外出求学有利'
        }
      },
      '化忌': {
        nature: '阻碍',
        element: '火',
        energy: 'negative',
        strength: -3,
        keywords: ['阻碍', '困扰', '变化', '执着'],
        palaceEffects: {
          '命宫': '个性执着，易有困扰',
          '财帛宫': '理财需谨慎，避免损失',
          '夫妻宫': '感情易有波折',
          '疾厄宫': '注意健康问题'
        }
      }
    };
    
    // 宫位互动关系表
    this.palaceInteractions = {
      '命宫': {
        '对宫': '迁移宫',
        '三合': ['财帛宫', '事业宫'],
        '六合': '夫妻宫',
        '六冲': '迁移宫',
        '相邻': ['兄弟宫', '父母宫']
      },
      '兄弟宫': {
        '对宫': '交友宫',
        '三合': ['疾厄宫', '田宅宫'],
        '六合': '子女宫',
        '六冲': '交友宫',
        '相邻': ['命宫', '夫妻宫']
      },
      '夫妻宫': {
        '对宫': '事业宫',
        '三合': ['福德宫', '父母宫'],
        '六合': '命宫',
        '六冲': '事业宫',
        '相邻': ['兄弟宫', '子女宫']
      },
      '子女宫': {
        '对宫': '田宅宫',
        '三合': ['命宫', '迁移宫'],
        '六合': '兄弟宫',
        '六冲': '田宅宫',
        '相邻': ['夫妻宫', '财帛宫']
      },
      '财帛宫': {
        '对宫': '福德宫',
        '三合': ['兄弟宫', '交友宫'],
        '六合': '疾厄宫',
        '六冲': '福德宫',
        '相邻': ['子女宫', '疾厄宫']
      },
      '疾厄宫': {
        '对宫': '父母宫',
        '三合': ['夫妻宫', '事业宫'],
        '六合': '财帛宫',
        '六冲': '父母宫',
        '相邻': ['财帛宫', '迁移宫']
      },
      '迁移宫': {
        '对宫': '命宫',
        '三合': ['子女宫', '田宅宫'],
        '六合': '交友宫',
        '六冲': '命宫',
        '相邻': ['疾厄宫', '交友宫']
      },
      '交友宫': {
        '对宫': '兄弟宫',
        '三合': ['财帛宫', '福德宫'],
        '六合': '迁移宫',
        '六冲': '兄弟宫',
        '相邻': ['迁移宫', '事业宫']
      },
      '事业宫': {
        '对宫': '夫妻宫',
        '三合': ['疾厄宫', '父母宫'],
        '六合': '田宅宫',
        '六冲': '夫妻宫',
        '相邻': ['交友宫', '田宅宫']
      },
      '田宅宫': {
        '对宫': '子女宫',
        '三合': ['迁移宫', '福德宫'],
        '六合': '事业宫',
        '六冲': '子女宫',
        '相邻': ['事业宫', '福德宫']
      },
      '福德宫': {
        '对宫': '财帛宫',
        '三合': ['交友宫', '田宅宫'],
        '六合': '父母宫',
        '六冲': '财帛宫',
        '相邻': ['田宅宫', '父母宫']
      },
      '父母宫': {
        '对宫': '疾厄宫',
        '三合': ['夫妻宫', '事业宫'],
        '六合': '福德宫',
        '六冲': '疾厄宫',
        '相邻': ['福德宫', '命宫']
      }
    };
  }
  
  // 计算多层次四化系统
  calculateMultiLevelSiHua(birthYear, currentYear, currentMonth, daxianStem) {
    const birthYearStem = this.getYearStem(birthYear);
    const currentYearStem = this.getYearStem(currentYear);
    const currentMonthStem = this.getMonthStem(currentYear, currentMonth);
    
    return {
      birth_sihua: this.calculateSiHua(birthYearStem, '生年四化'),
      daxian_sihua: this.calculateSiHua(daxianStem, '大限四化'),
      current_year_sihua: this.calculateSiHua(currentYearStem, '流年四化'),
      current_month_sihua: this.calculateSiHua(currentMonthStem, '流月四化'),
      interaction_analysis: this.analyzeSiHuaInteractions([
        this.calculateSiHua(birthYearStem, '生年四化'),
        this.calculateSiHua(daxianStem, '大限四化'),
        this.calculateSiHua(currentYearStem, '流年四化')
      ])
    };
  }
  
  // 计算单层四化
  calculateSiHua(stem, type) {
    const sihua = this.sihuaTable[stem] || this.sihuaTable['甲'];
    
    return {
      type: type,
      stem: stem,
      hua_lu: {
        star: sihua.lu,
        nature: '化禄',
        properties: this.sihuaProperties['化禄'],
        activation_power: this.calculateActivationPower(sihua.lu, '化禄')
      },
      hua_quan: {
        star: sihua.quan,
        nature: '化权',
        properties: this.sihuaProperties['化权'],
        activation_power: this.calculateActivationPower(sihua.quan, '化权')
      },
      hua_ke: {
        star: sihua.ke,
        nature: '化科',
        properties: this.sihuaProperties['化科'],
        activation_power: this.calculateActivationPower(sihua.ke, '化科')
      },
      hua_ji: {
        star: sihua.ji,
        nature: '化忌',
        properties: this.sihuaProperties['化忌'],
        activation_power: this.calculateActivationPower(sihua.ji, '化忌')
      }
    };
  }
  
  // 计算四化星的激发力度
  calculateActivationPower(star, sihuaType) {
    const baseProperties = this.sihuaProperties[sihuaType];
    
    // 根据星曜本身的特性调整激发力度
    const starPowerMap = {
      '紫微': 1.2, '天机': 1.0, '太阳': 1.1, '武曲': 1.1, '天同': 0.9,
      '廉贞': 1.0, '天府': 1.1, '太阴': 0.9, '贪狼': 1.0, '巨门': 0.8,
      '天相': 1.0, '天梁': 1.0, '七杀': 1.1, '破军': 1.2
    };
    
    const starMultiplier = starPowerMap[star] || 1.0;
    const basePower = Math.abs(baseProperties.strength);
    
    return {
      base_power: basePower,
      star_multiplier: starMultiplier,
      final_power: basePower * starMultiplier,
      power_level: this.getPowerLevel(basePower * starMultiplier)
    };
  }
  
  // 获取力度等级
  getPowerLevel(power) {
    if (power >= 5) return '极强';
    if (power >= 4) return '强';
    if (power >= 3) return '中等';
    if (power >= 2) return '弱';
    return '极弱';
  }
  
  // 分析四化星的相互作用
  analyzeSiHuaInteractions(sihuaLevels) {
    const interactions = [];
    const conflictAnalysis = [];
    const enhancementAnalysis = [];
    
    // 分析不同层次四化的冲突和增强
    for (let i = 0; i < sihuaLevels.length; i++) {
      for (let j = i + 1; j < sihuaLevels.length; j++) {
        const level1 = sihuaLevels[i];
        const level2 = sihuaLevels[j];
        
        // 检查同星不同化的情况
        const sameStarDiffHua = this.findSameStarDifferentHua(level1, level2);
        if (sameStarDiffHua.length > 0) {
          conflictAnalysis.push({
            type: '同星异化',
            level1: level1.type,
            level2: level2.type,
            conflicts: sameStarDiffHua,
            impact: '星曜能量分散，效果减弱'
          });
        }
        
        // 检查四化叠加效应
        const overlappingHua = this.findOverlappingHua(level1, level2);
        if (overlappingHua.length > 0) {
          enhancementAnalysis.push({
            type: '四化叠加',
            level1: level1.type,
            level2: level2.type,
            enhancements: overlappingHua,
            impact: '四化效应增强，影响力加倍'
          });
        }
      }
    }
    
    return {
      total_interactions: interactions.length + conflictAnalysis.length + enhancementAnalysis.length,
      conflicts: conflictAnalysis,
      enhancements: enhancementAnalysis,
      overall_harmony: this.calculateOverallHarmony(conflictAnalysis, enhancementAnalysis),
      recommendations: this.generateInteractionRecommendations(conflictAnalysis, enhancementAnalysis)
    };
  }
  
  // 查找同星不同化
  findSameStarDifferentHua(level1, level2) {
    const conflicts = [];
    const level1Stars = [level1.hua_lu.star, level1.hua_quan.star, level1.hua_ke.star, level1.hua_ji.star];
    const level2Stars = [level2.hua_lu.star, level2.hua_quan.star, level2.hua_ke.star, level2.hua_ji.star];
    
    level1Stars.forEach((star1, index1) => {
      level2Stars.forEach((star2, index2) => {
        if (star1 === star2 && index1 !== index2) {
          const hua1 = ['化禄', '化权', '化科', '化忌'][index1];
          const hua2 = ['化禄', '化权', '化科', '化忌'][index2];
          conflicts.push({
            star: star1,
            hua1: hua1,
            hua2: hua2,
            severity: this.calculateConflictSeverity(hua1, hua2)
          });
        }
      });
    });
    
    return conflicts;
  }
  
  // 查找四化叠加
  findOverlappingHua(level1, level2) {
    const overlaps = [];
    const huaTypes = ['hua_lu', 'hua_quan', 'hua_ke', 'hua_ji'];
    
    huaTypes.forEach(huaType => {
      if (level1[huaType].star === level2[huaType].star) {
        overlaps.push({
          star: level1[huaType].star,
          hua_type: level1[huaType].nature,
          enhancement_level: this.calculateEnhancementLevel(level1[huaType], level2[huaType])
        });
      }
    });
    
    return overlaps;
  }
  
  // 计算冲突严重程度
  calculateConflictSeverity(hua1, hua2) {
    const conflictMatrix = {
      '化禄': { '化忌': '高', '化权': '中', '化科': '低' },
      '化权': { '化忌': '中', '化禄': '中', '化科': '低' },
      '化科': { '化忌': '中', '化禄': '低', '化权': '低' },
      '化忌': { '化禄': '高', '化权': '中', '化科': '中' }
    };
    
    return conflictMatrix[hua1]?.[hua2] || '低';
  }
  
  // 计算增强程度
  calculateEnhancementLevel(hua1, hua2) {
    const power1 = hua1.activation_power.final_power;
    const power2 = hua2.activation_power.final_power;
    const totalPower = power1 + power2;
    
    if (totalPower >= 8) return '极强增强';
    if (totalPower >= 6) return '强增强';
    if (totalPower >= 4) return '中等增强';
    return '轻微增强';
  }
  
  // 计算整体和谐度
  calculateOverallHarmony(conflicts, enhancements) {
    const conflictScore = conflicts.reduce((sum, conflict) => {
      const severityScore = { '高': 3, '中': 2, '低': 1 };
      return sum + (severityScore[conflict.conflicts[0]?.severity] || 0);
    }, 0);
    
    const enhancementScore = enhancements.length * 2;
    const harmonyScore = Math.max(0, enhancementScore - conflictScore);
    
    if (harmonyScore >= 6) return '非常和谐';
    if (harmonyScore >= 3) return '较为和谐';
    if (harmonyScore >= 0) return '基本和谐';
    return '不够和谐';
  }
  
  // 生成互动建议
  generateInteractionRecommendations(conflicts, enhancements) {
    const recommendations = [];
    
    if (conflicts.length > 0) {
      recommendations.push('注意四化冲突带来的能量分散，建议在相关领域保持平衡心态');
      recommendations.push('避免在冲突星曜相关的事务上过度执着');
    }
    
    if (enhancements.length > 0) {
      recommendations.push('充分利用四化叠加带来的增强效应');
      recommendations.push('在增强星曜相关领域可以积极进取');
    }
    
    if (conflicts.length === 0 && enhancements.length === 0) {
      recommendations.push('四化系统运行平稳，可按既定计划发展');
    }
    
    return recommendations;
  }
  
  // 分析宫位互动效应
  analyzePalaceInteractions(palaces, sihuaData) {
    const interactions = {};
    
    Object.keys(palaces).forEach(palaceName => {
      const palace = palaces[palaceName];
      const palaceInteraction = this.palaceInteractions[palaceName];
      
      if (palaceInteraction) {
        interactions[palaceName] = {
          palace_info: palace,
          interaction_effects: {
            opposite_palace: this.analyzeOppositePalaceEffect(palaceName, palaceInteraction.对宫, palaces, sihuaData),
            triangle_palaces: this.analyzeTrianglePalaceEffect(palaceName, palaceInteraction.三合, palaces, sihuaData),
            harmony_palace: this.analyzeHarmonyPalaceEffect(palaceName, palaceInteraction.六合, palaces, sihuaData),
            conflict_palace: this.analyzeConflictPalaceEffect(palaceName, palaceInteraction.六冲, palaces, sihuaData)
          },
          overall_interaction_strength: 0,
          interaction_summary: ''
        };
        
        // 计算整体互动强度
        const effects = interactions[palaceName].interaction_effects;
        interactions[palaceName].overall_interaction_strength = 
          (effects.opposite_palace.strength + 
           effects.triangle_palaces.average_strength + 
           effects.harmony_palace.strength + 
           effects.conflict_palace.strength) / 4;
      }
    });
    
    return interactions;
  }
  
  // 分析对宫效应
  analyzeOppositePalaceEffect(sourcePalace, targetPalace, palaces, sihuaData) {
    const sourceStars = palaces[sourcePalace]?.all_stars || [];
    const targetStars = palaces[targetPalace]?.all_stars || [];
    
    return {
      target_palace: targetPalace,
      interaction_type: '对宫相冲',
      strength: this.calculateInteractionStrength(sourceStars, targetStars),
      effect_description: `${sourcePalace}与${targetPalace}形成对宫关系，相互影响较强`,
      recommendations: [`注意${sourcePalace}和${targetPalace}的平衡发展`]
    };
  }
  
  // 分析三合效应
  analyzeTrianglePalaceEffect(sourcePalace, trianglePalaces, palaces, sihuaData) {
    const effects = trianglePalaces.map(targetPalace => {
      const sourceStars = palaces[sourcePalace]?.all_stars || [];
      const targetStars = palaces[targetPalace]?.all_stars || [];
      
      return {
        target_palace: targetPalace,
        strength: this.calculateInteractionStrength(sourceStars, targetStars)
      };
    });
    
    const averageStrength = effects.reduce((sum, effect) => sum + effect.strength, 0) / effects.length;
    
    return {
      target_palaces: trianglePalaces,
      interaction_type: '三合拱照',
      average_strength: averageStrength,
      individual_effects: effects,
      effect_description: `${sourcePalace}与${trianglePalaces.join('、')}形成三合关系，相互扶助`,
      recommendations: [`善用${sourcePalace}的三合宫位带来的助力`]
    };
  }
  
  // 分析六合效应
  analyzeHarmonyPalaceEffect(sourcePalace, targetPalace, palaces, sihuaData) {
    const sourceStars = palaces[sourcePalace]?.all_stars || [];
    const targetStars = palaces[targetPalace]?.all_stars || [];
    
    return {
      target_palace: targetPalace,
      interaction_type: '六合和谐',
      strength: this.calculateInteractionStrength(sourceStars, targetStars),
      effect_description: `${sourcePalace}与${targetPalace}形成六合关系，和谐互补`,
      recommendations: [`发挥${sourcePalace}和${targetPalace}的协同效应`]
    };
  }
  
  // 分析六冲效应
  analyzeConflictPalaceEffect(sourcePalace, targetPalace, palaces, sihuaData) {
    const sourceStars = palaces[sourcePalace]?.all_stars || [];
    const targetStars = palaces[targetPalace]?.all_stars || [];
    
    return {
      target_palace: targetPalace,
      interaction_type: '六冲对立',
      strength: this.calculateInteractionStrength(sourceStars, targetStars),
      effect_description: `${sourcePalace}与${targetPalace}形成六冲关系，需要化解冲突`,
      recommendations: [`注意化解${sourcePalace}和${targetPalace}的冲突能量`]
    };
  }
  
  // 计算互动强度
  calculateInteractionStrength(sourceStars, targetStars) {
    const sourceCount = sourceStars.length;
    const targetCount = targetStars.length;
    const totalStars = sourceCount + targetCount;
    
    // 基础强度基于星曜数量
    let baseStrength = Math.min(totalStars / 4, 1.0);
    
    // 主星加权
    const mainStars = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];
    const sourceMainCount = sourceStars.filter(star => mainStars.includes(star)).length;
    const targetMainCount = targetStars.filter(star => mainStars.includes(star)).length;
    
    baseStrength += (sourceMainCount + targetMainCount) * 0.1;
    
    return Math.min(baseStrength, 1.0);
  }
  
  // 获取年干
  getYearStem(year) {
    const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    return stems[(year - 4) % 10];
  }
  
  // 获取月干
  getMonthStem(year, month) {
    const yearStemIndex = (year - 4) % 10;
    const monthStemIndex = (yearStemIndex * 2 + month) % 10;
    const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    return stems[monthStemIndex];
  }
}

module.exports = EnhancedSiHua;