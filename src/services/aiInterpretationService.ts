import { getAIConfig, validateAIConfig, getPromptTemplate } from '../config/aiConfig';

// AI解读结果接口
export interface AIInterpretationResult {
  success: boolean;
  content?: string;
  error?: string;
  timestamp: string;
  model?: string;
  tokensUsed?: number;
}

// AI解读请求参数
export interface AIInterpretationRequest {
  analysisType: 'bazi' | 'ziwei' | 'yijing' | 'qimen';
  analysisContent: any; // 改为any类型，支持对象数据
  customPrompt?: string;
  onStreamUpdate?: (content: string) => void; // 流式更新回调
}

// 将分析数据转换为Markdown格式
export const convertAnalysisToMarkdown = (analysisData: any, analysisType: string): string => {
  try {
    let markdown = `# ${getAnalysisTitle(analysisType)}分析结果\n\n`;
    
    // 根据不同分析类型生成不同的Markdown内容
    switch (analysisType) {
      case 'bazi':
        markdown += generateBaziMarkdown(analysisData);
        break;
      case 'ziwei':
        markdown += generateZiweiMarkdown(analysisData);
        break;
      case 'yijing':
        markdown += generateYijingMarkdown(analysisData);
        break;
      case 'qimen':
        markdown += generateQimenMarkdown(analysisData);
        break;
      default:
        markdown += JSON.stringify(analysisData, null, 2);
    }
    
    return markdown;
  } catch (error) {
    return JSON.stringify(analysisData, null, 2);
  }
};

// 生成八字分析的Markdown - 使用与服务器端相同的完整逻辑
const generateBaziMarkdown = (data: any): string => {
  const timestamp = new Date().toLocaleString('zh-CN');
  const userName = data.basic_info?.personal_data?.name || '用户';
  
  let markdown = `# 八字命理分析报告\n\n`;
  markdown += `**姓名：** ${userName}\n`;
  markdown += `**生成时间：** ${timestamp}\n`;
  markdown += `**分析类型：** 八字命理\n\n`;
  markdown += `---\n\n`;
  
  // 基本信息
  if (data.basic_info) {
    markdown += `## 📋 基本信息\n\n`;
    
    if (data.basic_info.personal_data) {
      const personal = data.basic_info.personal_data;
      markdown += `- **姓名：** ${personal.name || '未提供'}\n`;
      markdown += `- **性别：** ${personal.gender || '未提供'}\n`;
      markdown += `- **出生日期：** ${personal.birth_date || '未提供'}\n`;
      markdown += `- **出生时间：** ${personal.birth_time || '未提供'}\n`;
      if (personal.birth_place) {
        markdown += `- **出生地点：** ${personal.birth_place}\n`;
      }
    }
    
    // 八字信息
    if (data.basic_info.bazi_chart) {
      const bazi = data.basic_info.bazi_chart;
      markdown += `\n### 🔮 八字信息\n\n`;
      markdown += `**完整八字：** ${bazi.complete_chart || ''}\n\n`;
      
      markdown += `| 柱位 | 天干 | 地支 | 纳音 |\n`;
      markdown += `|------|------|------|------|\n`;
      markdown += `| 年柱 | ${bazi.year_pillar?.[0] || '-'} | ${bazi.year_pillar?.[1] || '-'} | ${bazi.year_nayin || '-'} |\n`;
      markdown += `| 月柱 | ${bazi.month_pillar?.[0] || '-'} | ${bazi.month_pillar?.[1] || '-'} | ${bazi.month_nayin || '-'} |\n`;
      markdown += `| 日柱 | ${bazi.day_pillar?.[0] || '-'} | ${bazi.day_pillar?.[1] || '-'} | ${bazi.day_nayin || '-'} |\n`;
      markdown += `| 时柱 | ${bazi.hour_pillar?.[0] || '-'} | ${bazi.hour_pillar?.[1] || '-'} | ${bazi.hour_nayin || '-'} |\n\n`;
    }
    
    // 五行分析
    if (data.basic_info.wuxing_analysis) {
      const wuxing = data.basic_info.wuxing_analysis;
      markdown += `### 🌟 五行分析\n\n`;
      if (wuxing.element_counts) {
        markdown += `**五行统计：**\n`;
        Object.entries(wuxing.element_counts).forEach(([element, count]) => {
          markdown += `- ${element}：${count}个\n`;
        });
        markdown += `\n`;
      }
      if (wuxing.balance_analysis) {
        markdown += `**平衡分析：** ${wuxing.balance_analysis}\n\n`;
      }
      if (wuxing.strength_analysis) {
        markdown += `**强弱分析：** ${wuxing.strength_analysis}\n\n`;
      }
      if (wuxing.seasonal_influence) {
        markdown += `**季节影响：** ${wuxing.seasonal_influence}\n\n`;
      }
      if (wuxing.element_relationships) {
        markdown += `**五行关系：** ${wuxing.element_relationships}\n\n`;
      }
    }
    
    // 纳音分析
    if (data.basic_info.bazi_chart?.nayin_info) {
      const nayin = data.basic_info.bazi_chart.nayin_info;
      markdown += `### 🎵 纳音分析\n\n`;
      if (nayin.year_nayin) {
        markdown += `**年柱纳音：** ${nayin.year_nayin}\n`;
      }
      if (nayin.month_nayin) {
        markdown += `**月柱纳音：** ${nayin.month_nayin}\n`;
      }
      if (nayin.day_nayin) {
        markdown += `**日柱纳音：** ${nayin.day_nayin}\n`;
      }
      if (nayin.hour_nayin) {
        markdown += `**时柱纳音：** ${nayin.hour_nayin}\n\n`;
      }
      if (nayin.nayin_analysis) {
        markdown += `**纳音特征：** ${nayin.nayin_analysis}\n\n`;
      }
    }
  }
  
  // 四柱解释
  if (data.basic_info?.pillar_interpretations) {
    markdown += `### 🏛️ 四柱解释\n\n`;
    const pillars = data.basic_info.pillar_interpretations;
    if (pillars.year_pillar) {
      markdown += `**年柱：** ${pillars.year_pillar}\n\n`;
    }
    if (pillars.month_pillar) {
      markdown += `**月柱：** ${pillars.month_pillar}\n\n`;
    }
    if (pillars.day_pillar) {
      markdown += `**日柱：** ${pillars.day_pillar}\n\n`;
    }
    if (pillars.hour_pillar) {
      markdown += `**时柱：** ${pillars.hour_pillar}\n\n`;
    }
  }
  
  // 格局分析
  if (data.geju_analysis) {
    markdown += `## 🎯 格局分析\n\n`;
    if (data.geju_analysis.pattern_analysis) {
      markdown += `**格局特点：** ${data.geju_analysis.pattern_analysis}\n\n`;
    }
    if (data.geju_analysis.pattern_strength) {
      markdown += `**格局强度：** ${data.geju_analysis.pattern_strength}\n\n`;
    }
    if (data.geju_analysis.pattern_advice) {
      markdown += `**格局建议：** ${data.geju_analysis.pattern_advice}\n\n`;
    }
  }
  
  // 十神分析
  if (data.ten_gods_analysis) {
    markdown += `## ⚡ 十神分析\n\n`;
    if (data.ten_gods_analysis.day_master_analysis) {
      markdown += `**日主分析：** ${data.ten_gods_analysis.day_master_analysis}\n\n`;
    }
    if (data.ten_gods_analysis.ten_gods_distribution) {
      markdown += `**十神分布：** ${data.ten_gods_analysis.ten_gods_distribution}\n\n`;
    }
    if (data.ten_gods_analysis.personality_traits) {
      markdown += `**性格特质：** ${data.ten_gods_analysis.personality_traits}\n\n`;
    }
  }
  
  // 大运分析
  if (data.dayun_analysis) {
    markdown += `## 📈 大运分析\n\n`;
    if (data.dayun_analysis.current_dayun) {
      const current = data.dayun_analysis.current_dayun;
      markdown += `**当前大运：** ${current.ganzhi} (${current.start_age}-${current.end_age}岁)\n`;
      markdown += `**大运特点：** ${current.analysis || current.description}\n\n`;
    }
    if (data.dayun_analysis.dayun_influence) {
      markdown += `**大运影响：** ${data.dayun_analysis.dayun_influence}\n\n`;
    }
    if (data.dayun_analysis.yearly_fortune) {
      markdown += `**流年分析：** ${data.dayun_analysis.yearly_fortune}\n\n`;
    }
    if (data.dayun_analysis.future_outlook) {
      markdown += `**未来展望：** ${data.dayun_analysis.future_outlook}\n\n`;
    }
    
    // 大运序列
    if (data.dayun_analysis.dayun_sequence) {
      markdown += `### 🔄 八步大运序列\n\n`;
      markdown += `| 大运 | 年龄段 | 十神 | 特点 |\n`;
      markdown += `|------|--------|------|------|\n`;
      data.dayun_analysis.dayun_sequence.forEach((dayun: any) => {
        markdown += `| ${dayun.ganzhi} | ${dayun.start_age}-${dayun.end_age}岁 | ${dayun.ten_god} | ${dayun.description || '待分析'} |\n`;
      });
      markdown += `\n`;
    }
  }
  
  // 详细流年分析
  if (data.dayun_analysis?.detailed_yearly_analysis) {
    markdown += `## 📅 详细流年分析\n\n`;
    data.dayun_analysis.detailed_yearly_analysis.forEach((yearData: any) => {
      markdown += `### ${yearData.year}年（${yearData.age}岁）${yearData.year_ganzhi}\n\n`;
      if (yearData.overall_fortune) {
        markdown += `**整体运势：** ${yearData.overall_fortune}\n\n`;
      }
      if (yearData.career_fortune) {
        markdown += `**事业运势：** ${yearData.career_fortune}\n\n`;
      }
      if (yearData.wealth_fortune) {
        markdown += `**财运分析：** ${yearData.wealth_fortune}\n\n`;
      }
      if (yearData.relationship_fortune) {
        markdown += `**感情运势：** ${yearData.relationship_fortune}\n\n`;
      }
      if (yearData.health_fortune) {
        markdown += `**健康运势：** ${yearData.health_fortune}\n\n`;
      }
      if (yearData.monthly_guidance) {
        markdown += `**月度指导：** ${yearData.monthly_guidance}\n\n`;
      }
    });
  }
  
  // 人生指导
  if (data.life_guidance) {
    markdown += `## 💡 人生指导\n\n`;
    if (data.life_guidance.overall_summary) {
      markdown += `**总体概述：** ${data.life_guidance.overall_summary}\n\n`;
    }
    if (data.life_guidance.career_guidance) {
      markdown += `**事业指导：** ${data.life_guidance.career_guidance}\n\n`;
    }
    if (data.life_guidance.relationship_guidance) {
      markdown += `**感情指导：** ${data.life_guidance.relationship_guidance}\n\n`;
    }
    if (data.life_guidance.health_guidance) {
      markdown += `**健康指导：** ${data.life_guidance.health_guidance}\n\n`;
    }
    if (data.life_guidance.wealth_guidance) {
      markdown += `**财运指导：** ${data.life_guidance.wealth_guidance}\n\n`;
    }
    if (data.life_guidance.life_advice) {
      markdown += `**人生建议：** ${data.life_guidance.life_advice}\n\n`;
    }
    if (data.life_guidance.lucky_elements) {
      markdown += `**幸运元素：** ${data.life_guidance.lucky_elements}\n\n`;
    }
    if (data.life_guidance.taboo_elements) {
      markdown += `**忌讳元素：** ${data.life_guidance.taboo_elements}\n\n`;
    }
    if (data.life_guidance.suitable_directions) {
      markdown += `**适宜方位：** ${data.life_guidance.suitable_directions}\n\n`;
    }
    if (data.life_guidance.suitable_colors) {
      markdown += `**适宜颜色：** ${data.life_guidance.suitable_colors}\n\n`;
    }
    if (data.life_guidance.suitable_numbers) {
      markdown += `**适宜数字：** ${data.life_guidance.suitable_numbers}\n\n`;
    }
    if (data.life_guidance.development_suggestions) {
      markdown += `**发展建议：** ${data.life_guidance.development_suggestions}\n\n`;
    }
  }
  
  // 综合分析
  if (data.comprehensive_analysis) {
    markdown += `## 🎯 综合分析\n\n`;
    if (data.comprehensive_analysis.overall_assessment) {
      markdown += `**整体评估：** ${data.comprehensive_analysis.overall_assessment}\n\n`;
    }
    if (data.comprehensive_analysis.key_insights) {
      markdown += `**关键洞察：** ${data.comprehensive_analysis.key_insights}\n\n`;
    }
    if (data.comprehensive_analysis.recommendations) {
      markdown += `**重要建议：** ${data.comprehensive_analysis.recommendations}\n\n`;
    }
  }
  
  // 免责声明
  markdown += `---\n\n`;
  markdown += `## ⚠️ 免责声明\n\n`;
  markdown += `本分析报告基于传统八字命理学理论，结合现代分析方法生成。八字命理是中华传统文化的重要组成部分，仅供参考，不可过分依赖。人生的幸福需要通过自己的努力和智慧来创造。\n\n`;
  markdown += `**分析时间：** ${timestamp}\n`;
  
  return markdown;
};

// 生成紫微斗数分析的Markdown - 使用与服务器端相同的完整逻辑
const generateZiweiMarkdown = (data: any): string => {
  const timestamp = new Date().toLocaleString('zh-CN');
  const userName = data.basic_info?.personal_data?.name || '用户';
  
  let markdown = `# 紫微斗数分析报告\n\n`;
  markdown += `**姓名：** ${userName}\n`;
  markdown += `**生成时间：** ${timestamp}\n`;
  markdown += `**分析类型：** 紫微斗数\n\n`;
  markdown += `---\n\n`;
  
  // 基本信息
  if (data.basic_info) {
    markdown += `## 📋 基本信息\n\n`;
    
    if (data.basic_info.personal_data) {
      const personal = data.basic_info.personal_data;
      markdown += `- **姓名：** ${personal.name || '未提供'}\n`;
      markdown += `- **性别：** ${personal.gender || '未提供'}\n`;
      markdown += `- **出生日期：** ${personal.birth_date || '未提供'}\n`;
      markdown += `- **出生时间：** ${personal.birth_time || '未提供'}\n`;
      if (personal.birth_place) {
        markdown += `- **出生地点：** ${personal.birth_place}\n`;
      }
    }
    
    // 紫微斗数命盘信息
    if (data.basic_info.ziwei_chart) {
      const chart = data.basic_info.ziwei_chart;
      markdown += `\n### 🌟 紫微斗数命盘\n\n`;
      
      if (chart.main_stars) {
        markdown += `**主星配置：**\n`;
        Object.entries(chart.main_stars).forEach(([palace, stars]) => {
          markdown += `- ${palace}：${Array.isArray(stars) ? stars.join('、') : stars}\n`;
        });
        markdown += `\n`;
      }
      
      if (chart.life_palace) {
        markdown += `**命宫：** ${chart.life_palace}\n`;
      }
      if (chart.body_palace) {
        markdown += `**身宫：** ${chart.body_palace}\n\n`;
      }
    }
  }
  
  // 详细分析
  if (data.detailed_analysis) {
    markdown += `## 🔍 详细分析\n\n`;
    const analysis = data.detailed_analysis;
    
    if (analysis.personality_analysis) {
      markdown += `### 👤 性格特质\n\n`;
      if (analysis.personality_analysis.main_characteristics) {
        markdown += `**主要特征：** ${analysis.personality_analysis.main_characteristics}\n\n`;
      }
      if (analysis.personality_analysis.strengths) {
        markdown += `**优势特点：** ${analysis.personality_analysis.strengths}\n\n`;
      }
      if (analysis.personality_analysis.areas_for_growth) {
        markdown += `**成长空间：** ${analysis.personality_analysis.areas_for_growth}\n\n`;
      }
    }
    
    if (analysis.career_fortune) {
      markdown += `### 💼 事业运势\n\n`;
      if (analysis.career_fortune.career_direction) {
        markdown += `**事业方向：** ${analysis.career_fortune.career_direction}\n\n`;
      }
      if (analysis.career_fortune.success_factors) {
        markdown += `**成功要素：** ${analysis.career_fortune.success_factors}\n\n`;
      }
    }
    
    if (analysis.wealth_fortune) {
      markdown += `### 💰 财富运势\n\n`;
      if (analysis.wealth_fortune.wealth_potential) {
        markdown += `**财富潜力：** ${analysis.wealth_fortune.wealth_potential}\n\n`;
      }
      if (analysis.wealth_fortune.financial_advice) {
        markdown += `**理财建议：** ${analysis.wealth_fortune.financial_advice}\n\n`;
      }
    }
    
    if (analysis.relationship_fortune) {
      markdown += `### 💕 感情运势\n\n`;
      if (analysis.relationship_fortune.love_characteristics) {
        markdown += `**感情特质：** ${analysis.relationship_fortune.love_characteristics}\n\n`;
      }
      if (analysis.relationship_fortune.marriage_outlook) {
        markdown += `**婚姻展望：** ${analysis.relationship_fortune.marriage_outlook}\n\n`;
      }
    }
    
    if (analysis.health_fortune) {
      markdown += `### 🏥 健康运势\n\n`;
      if (analysis.health_fortune.health_tendencies) {
        markdown += `**健康倾向：** ${analysis.health_fortune.health_tendencies}\n\n`;
      }
      if (analysis.health_fortune.wellness_advice) {
        markdown += `**养生建议：** ${analysis.health_fortune.wellness_advice}\n\n`;
      }
    }
  }
  
  // 流年运势
  if (data.yearly_fortune) {
    markdown += `## 📅 流年运势\n\n`;
    if (data.yearly_fortune.current_year) {
      markdown += `**${data.yearly_fortune.current_year.year}年运势：** ${data.yearly_fortune.current_year.fortune_summary}\n\n`;
    }
  }
  
  // 综合建议
  if (data.life_guidance) {
    markdown += `## 💡 人生指导\n\n`;
    if (data.life_guidance.life_advice) {
      markdown += `${data.life_guidance.life_advice}\n\n`;
    }
  }
  
  // 免责声明
  markdown += `---\n\n`;
  markdown += `## ⚠️ 免责声明\n\n`;
  markdown += `本分析报告基于传统紫微斗数理论，结合现代分析方法生成。紫微斗数是中华传统文化的重要组成部分，仅供参考，不可过分依赖。人生的幸福需要通过自己的努力和智慧来创造。\n\n`;
  markdown += `**分析时间：** ${timestamp}\n`;
  
  return markdown;
};

// 生成易经分析的Markdown - 使用与服务器端相同的完整逻辑
const generateYijingMarkdown = (data: any): string => {
  const timestamp = new Date().toLocaleString('zh-CN');
  const userName = data.basic_info?.divination_data?.name || '用户';
  
  let markdown = `# 易经占卜分析报告\n\n`;
  markdown += `**占卜者：** ${userName}\n`;
  markdown += `**生成时间：** ${timestamp}\n`;
  markdown += `**分析类型：** 易经占卜\n\n`;
  markdown += `---\n\n`;
  
  // 基本信息
  if (data.basic_info) {
    markdown += '## 📋 占卜基本信息\n\n';
    if (data.basic_info.divination_data) {
      markdown += `- **问题**: ${data.basic_info.divination_data.question}\n`;
      markdown += `- **占卜方法**: ${data.basic_info.divination_data.method}\n`;
      markdown += `- **占卜时间**: ${data.basic_info.divination_data.divination_time}\n\n`;
    }
  }
  
  // 卦象信息
  if (data.basic_info?.hexagram_info) {
    const hexInfo = data.basic_info.hexagram_info;
    markdown += '## 🔮 卦象信息\n\n';
    
    // 本卦信息
    markdown += `**本卦**: ${hexInfo.main_hexagram} (第${hexInfo.main_hexagram_number}卦)\n`;
    markdown += `**卦象符号**: ${hexInfo.main_hexagram_symbol}\n`;
    markdown += `**卦辞**: ${hexInfo.hexagram_description}\n`;
    
    // 卦象结构
    if (hexInfo.hexagram_structure) {
      markdown += `**上卦**: ${hexInfo.hexagram_structure.upper_trigram}\n`;
      markdown += `**下卦**: ${hexInfo.hexagram_structure.lower_trigram}\n`;
    }
    
    // 变卦信息
    if (hexInfo.changing_hexagram && hexInfo.changing_hexagram !== '无') {
      markdown += `**变卦**: ${hexInfo.changing_hexagram}\n`;
      markdown += `**变卦符号**: ${hexInfo.changing_hexagram_symbol}\n`;
    } else {
      markdown += `**变卦**: 无变卦\n`;
    }
    
    markdown += '\n';
  }
  
  // 详细分析
  if (data.detailed_analysis) {
    markdown += `## 🔍 详细分析\n\n`;
    const analysis = data.detailed_analysis;
    
    // 卦象分析
    if (analysis.hexagram_analysis) {
      markdown += '### 📖 卦象分析\n\n';
      markdown += `**主要含义**: ${analysis.hexagram_analysis.primary_meaning}\n`;
      markdown += `**卦辞解释**: ${analysis.hexagram_analysis.judgment}\n`;
      markdown += `**象传**: ${analysis.hexagram_analysis.image}\n`;
      if (analysis.hexagram_analysis.trigram_analysis) {
        markdown += `**卦象分析**: ${analysis.hexagram_analysis.trigram_analysis}\n`;
      }
      markdown += '\n';
    }
    
    // 动爻分析
    if (analysis.changing_lines_analysis) {
      markdown += '### ⚡ 动爻分析\n\n';
      markdown += `**动爻数量**: ${analysis.changing_lines_analysis.changing_lines_count}爻\n`;
      if (analysis.changing_lines_analysis.changing_line_position) {
        markdown += `**动爻位置**: ${analysis.changing_lines_analysis.changing_line_position}\n`;
      }
      if (analysis.changing_lines_analysis.line_meanings) {
        markdown += `**爻辞含义**: ${analysis.changing_lines_analysis.line_meanings}\n`;
      }
      markdown += '\n';
    }
    
    // 变卦分析
    if (analysis.changing_hexagram_analysis) {
      markdown += '### 🔄 变卦分析\n\n';
      markdown += `**变化含义**: ${analysis.changing_hexagram_analysis.meaning}\n`;
      markdown += `**转化洞察**: ${analysis.changing_hexagram_analysis.transformation_insight}\n`;
      markdown += `**指导建议**: ${analysis.changing_hexagram_analysis.guidance}\n`;
      markdown += `**时机把握**: ${analysis.changing_hexagram_analysis.timing}\n`;
      markdown += '\n';
    }
    
    // 高级分析（互卦、错卦、综卦）
    if (analysis.advanced_analysis) {
      markdown += '### 🎯 高级卦象分析\n\n';
      
      if (analysis.advanced_analysis.inter_hexagram) {
        markdown += `**互卦**: ${analysis.advanced_analysis.inter_hexagram.name}\n`;
        markdown += `互卦分析: ${analysis.advanced_analysis.inter_hexagram.analysis}\n\n`;
      }
      
      if (analysis.advanced_analysis.opposite_hexagram) {
        markdown += `**错卦**: ${analysis.advanced_analysis.opposite_hexagram.name}\n`;
        markdown += `错卦分析: ${analysis.advanced_analysis.opposite_hexagram.analysis}\n\n`;
      }
      
      if (analysis.advanced_analysis.reverse_hexagram) {
        markdown += `**综卦**: ${analysis.advanced_analysis.reverse_hexagram.name}\n`;
        markdown += `综卦分析: ${analysis.advanced_analysis.reverse_hexagram.analysis}\n\n`;
      }
    }
    
    // 五行分析
    if (analysis.hexagram_analysis?.five_elements) {
      const elements = analysis.hexagram_analysis.five_elements;
      markdown += '### 🌟 五行分析\n\n';
      markdown += `**上卦五行**: ${elements.upper_element}\n`;
      markdown += `**下卦五行**: ${elements.lower_element}\n`;
      markdown += `**五行关系**: ${elements.relationship}\n`;
      markdown += `**五行平衡**: ${elements.balance}\n\n`;
    }
  }
  
  // 综合解读
  if (data.comprehensive_interpretation) {
    markdown += '## 💡 综合解读\n\n';
    markdown += `${data.comprehensive_interpretation}\n\n`;
  }
  
  // 实用建议
  if (data.practical_guidance) {
    markdown += '## 🎯 实用建议\n\n';
    if (data.practical_guidance.immediate_actions) {
      markdown += `**近期行动**: ${data.practical_guidance.immediate_actions}\n`;
    }
    if (data.practical_guidance.long_term_strategy) {
      markdown += `**长期策略**: ${data.practical_guidance.long_term_strategy}\n`;
    }
    if (data.practical_guidance.timing_advice) {
      markdown += `**时机建议**: ${data.practical_guidance.timing_advice}\n`;
    }
    markdown += '\n';
  }
  
  // 免责声明
  markdown += `---\n\n`;
  markdown += `## ⚠️ 免责声明\n\n`;
  markdown += `本分析报告基于传统易经理论，结合现代分析方法生成。易经是中华传统文化的重要组成部分，仅供参考，不可过分依赖。人生的幸福需要通过自己的努力和智慧来创造。\n\n`;
  markdown += `**分析时间：** ${timestamp}\n`;
  
  return markdown;
};

// 生成奇门遁甲分析的Markdown
const generateQimenMarkdown = (data: any): string => {
  const timestamp = new Date().toLocaleString('zh-CN');
  let markdown = `## 奇门遁甲分析报告\n\n**分析时间：** ${timestamp}\n\n`;
  
  try {
    // 基本信息
    if (data.timeInfo) {
      markdown += `### 时空信息\n\n`;
      if (data.timeInfo.jieqi) markdown += `**节气：** ${data.timeInfo.jieqi}\n`;
      if (data.qimenPan?.jushu) markdown += `**局数：** ${data.qimenPan.jushu}局\n`;
      if (data.qimenPan?.yindun !== undefined) {
        markdown += `**阴阳遁：** ${data.qimenPan.yindun ? '阴遁' : '阳遁'}\n`;
      }
      if (data.timeInfo.hour) {
        markdown += `**时辰：** ${data.timeInfo.hour.gan}${data.timeInfo.hour.zhi}时\n`;
      }
      markdown += `\n`;
    }
    
    // 奇门盘信息
    if (data.qimenPan && data.qimenPan.dipan) {
      markdown += `### 奇门盘布局\n\n`;
      const palaceNames = ['坎一宫', '坤二宫', '震三宫', '巽四宫', '中五宫', '乾六宫', '兑七宫', '艮八宫', '离九宫'];
      
      data.qimenPan.dipan.forEach((palace: any, index: number) => {
        if (palace) {
          markdown += `**${palaceNames[index]}：**\n`;
          if (palace.star) markdown += `- 九星：${palace.star}\n`;
          if (palace.door) markdown += `- 八门：${palace.door}\n`;
          if (palace.god) markdown += `- 八神：${palace.god}\n`;
          markdown += `\n`;
        }
      });
    }
    
    // 用神分析
    if (data.yongShenAnalysis) {
      markdown += `### 用神分析\n\n`;
      
      if (data.yongShenAnalysis.primary) {
        markdown += `**主用神：**\n`;
        Object.entries(data.yongShenAnalysis.primary).forEach(([key, value]) => {
          markdown += `- ${key}：${value}\n`;
        });
        markdown += `\n`;
      }
      
      if (data.yongShenAnalysis.secondary) {
        markdown += `**次用神：**\n`;
        Object.entries(data.yongShenAnalysis.secondary).forEach(([key, value]) => {
          markdown += `- ${key}：${value}\n`;
        });
        markdown += `\n`;
      }
      
      if (data.yongShenAnalysis.overall) {
        markdown += `**综合分析：**\n${data.yongShenAnalysis.overall}\n\n`;
      }
    }
    
    // 格局识别
    if (data.patterns && data.patterns.length > 0) {
      markdown += `### 格局识别\n\n`;
      data.patterns.forEach((pattern: any, index: number) => {
        markdown += `**${pattern.name}** (${pattern.type === 'auspicious' ? '吉格' : '凶格'})\n`;
        if (pattern.description) markdown += `${pattern.description}\n`;
        if (pattern.influence) markdown += `影响：${pattern.influence}\n`;
        markdown += `\n`;
      });
    }
    
    // 预测结果
    if (data.prediction) {
      markdown += `### 预测结果\n\n`;
      
      if (data.prediction.probability) {
        markdown += `**成功概率：** ${data.prediction.probability}%\n\n`;
      }
      
      if (data.prediction.analysis) {
        markdown += `**详细分析：**\n${data.prediction.analysis}\n\n`;
      }
      
      if (data.prediction.suggestions && data.prediction.suggestions.length > 0) {
        markdown += `**建议：**\n`;
        data.prediction.suggestions.forEach((suggestion: string) => {
          markdown += `- ${suggestion}\n`;
        });
        markdown += `\n`;
      }
    }
    
  } catch (error) {
    markdown += `\n**原始数据：**\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`;
  }
  
  return markdown;
};

// 获取分析类型标题
const getAnalysisTitle = (analysisType: string): string => {
  const titles = {
    'bazi': '八字命理',
    'ziwei': '紫微斗数',
    'yijing': '易经占卜',
    'qimen': '奇门遁甲'
  };
  return titles[analysisType as keyof typeof titles] || '命理';
};

// 将Markdown表格转换为纯文本
const convertMarkdownTablesToText = (markdown: string): string => {
  const tableRegex = /\|[^\n]*\|[\s\S]*?(?=\n\s*\n|\n\s*#|\n\s*\*|\n\s*-|\n\s*>|$)/g;
  
  return markdown.replace(tableRegex, (table) => {
    const lines = table.trim().split('\n');
    let result = '';
    let isFirstDataRow = true;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 跳过分隔行
      if (line.includes('---') || line.includes('━')) {
        continue;
      }
      
      // 处理表格行
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.slice(1, -1).split('|').map(cell => cell.trim());
        
        // 过滤掉空数据行
        const hasValidData = cells.some(cell => cell && cell !== '-' && cell !== '待分析' && cell.trim() !== '');
        const dataColumns = cells.slice(1);
        const hasRealData = dataColumns.some(cell => cell && cell !== '-' && cell !== '待分析' && cell.trim() !== '');
        const shouldProcessRow = hasValidData && (cells.length === 1 || hasRealData);
        
        if (shouldProcessRow) {
          if (isFirstDataRow) {
            result += '【' + cells.join(' - ') + '】\n';
            isFirstDataRow = false;
          } else {
            if (cells.length >= 2) {
              result += `${cells[0]}：${cells.slice(1).join('，')}\n`;
            } else {
              result += cells.join('，') + '\n';
            }
          }
        }
      }
    }
    
    return result + '\n';
  });
};



// 调用AI API进行解读
export const requestAIInterpretation = async (request: AIInterpretationRequest): Promise<AIInterpretationResult> => {
  const startTime = Date.now();
  
  try {
    // 获取AI配置
    const config = getAIConfig();
    
    // 验证配置
    if (!validateAIConfig(config)) {
      return {
        success: false,
        error: 'AI配置不完整，请检查API Key、API地址和模型名称设置',
        timestamp: new Date().toISOString()
      };
    }
    
    // 完全使用MD文件下载流程获取完整内容
    let analysisMarkdown = '';
    
    // 如果用户直接传入字符串，原原本本使用，不做任何处理
    if (typeof request.analysisContent === 'string') {
      analysisMarkdown = request.analysisContent;
    } else {
      // 必须调用服务器端下载API获取完整的Markdown内容
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('需要登录才能使用AI解读功能');
      }
      
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
          (import.meta.env.DEV ? 'http://localhost:3001/api' : 
           (window.location.hostname.includes('koyeb.app') ? `${window.location.origin}/api` : `${window.location.origin}/api`));
        
        // 智能提取分析数据
        let serverAnalysisData = request.analysisContent;
        if (request.analysisContent?.analysis) {
          serverAnalysisData = request.analysisContent.analysis;
        } else if (request.analysisContent?.data?.analysis) {
          serverAnalysisData = request.analysisContent.data.analysis;
        }
        

        
        // 调用服务器端下载API，但获取文本内容而不是文件下载
        const response = await fetch(`${API_BASE_URL}/download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            analysisData: serverAnalysisData,
            analysisType: request.analysisType,
            format: 'markdown',
            userName: serverAnalysisData?.basic_info?.personal_data?.name || '用户'
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`服务器端API调用失败: ${response.status} ${response.statusText}`);
        }
        
        // 获取完整的Markdown内容
        const blob = await response.blob();
        analysisMarkdown = await blob.text();
        
        // 验证内容完整性
        if (analysisMarkdown.length < 1000) {
          throw new Error('生成的分析内容不完整');
        }
        
      } catch (error) {
          throw new Error(`无法获取完整的分析内容: ${error.message}`);
        }
    }
    
    // 将Markdown表格转换为纯文本
    const textContent = convertMarkdownTablesToText(analysisMarkdown);
    
    // 获取提示词模板
    const promptTemplate = request.customPrompt || getPromptTemplate(request.analysisType);
    const prompt = promptTemplate.replace('{analysisContent}', textContent);
    
    // 构建请求体
    const requestBody = {
      model: config.modelName,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      stream: config.stream
    };
    
    // 发送请求
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, config.timeout);
    
    const requestStartTime = Date.now();
    
    const jsonBody = JSON.stringify(requestBody);
    
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: jsonBody, // 使用预先序列化的JSON
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        errorData = {};
      }
      
      const errorMessage = `API请求失败: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`;
      throw new Error(errorMessage);
    }
    
    let content = '';
    let tokensUsed = 0;
    let model = config.modelName;
    
    if (config.stream) {
      // 处理流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                  const delta = parsed.choices[0].delta;
                  if (delta.content) {
                    content += delta.content;
                    // 调用流式更新回调
                    if (request.onStreamUpdate) {
                      request.onStreamUpdate(content);
                    }
                  }
                }
                
                // 获取使用情况和模型信息
                if (parsed.usage) {
                  tokensUsed = parsed.usage.total_tokens;
                }
                if (parsed.model) {
                  model = parsed.model;
                }
              } catch (parseError) {
                // 忽略解析错误，继续处理
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      

      
    } else {
      // 处理非流式响应
      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('AI响应格式异常');
      }
      
      content = data.choices[0].message.content;
      tokensUsed = data.usage?.total_tokens;
      model = data.model || config.modelName;
    }
    
 return {
       success: true,
       content,
       timestamp: new Date().toISOString(),
       model,
       tokensUsed
     };
    
  } catch (error: any) {
    let errorMessage = '未知错误';
    if (error.name === 'AbortError') {
      errorMessage = '请求超时，请稍后重试';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    };
  }
};

// 保存AI解读结果到数据库
export const saveAIInterpretation = async (readingId: number, result: AIInterpretationResult): Promise<void> => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('需要登录才能保存AI解读结果');
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
      (import.meta.env.DEV ? 'http://localhost:3001/api' : 
        (window.location.hostname.includes('koyeb.app') ? `${window.location.origin}/api` : `${window.location.origin}/api`));

    const response = await fetch(`${API_BASE_URL}/ai-interpretation/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        reading_id: readingId,
        content: result.content,
        model: result.model,
        tokens_used: result.tokensUsed,
        success: result.success,
        error_message: result.error
      })
    });

    if (!response.ok) {
      throw new Error(`保存AI解读结果失败: ${response.status}`);
    }

    // 同时保存到localStorage作为备份
    const key = `ai-interpretation-${readingId}`;
    localStorage.setItem(key, JSON.stringify(result));
  } catch (error) {
    // 如果数据库保存失败，至少保存到localStorage
    try {
      const key = `ai-interpretation-${readingId}`;
      localStorage.setItem(key, JSON.stringify(result));
    } catch (localError) {
      // 静默处理存储错误
    }
  }
};

// 从数据库或本地存储获取AI解读结果
export const getAIInterpretation = async (readingId: number): Promise<AIInterpretationResult | null> => {
  try {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // 优先从数据库获取
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
        (import.meta.env.DEV ? 'http://localhost:3001/api' : 
          (window.location.hostname.includes('koyeb.app') ? `${window.location.origin}/api` : `${window.location.origin}/api`));

      const response = await fetch(`${API_BASE_URL}/ai-interpretation/get/${readingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return {
            success: data.data.success,
            content: data.data.content,
            error: data.data.error_message,
            timestamp: data.data.created_at,
            model: data.data.model,
            tokensUsed: data.data.tokens_used
          };
        }
      } else if (response.status === 404) {
        // 404是正常情况，表示还没有AI解读记录
        return null;
      }
    }

    // 如果数据库获取失败，尝试从localStorage获取
    const key = `ai-interpretation-${readingId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    // 如果数据库获取失败，尝试从localStorage获取
    try {
      const key = `ai-interpretation-${readingId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (localError) {
      // 静默处理获取错误
    }
  }
  return null;
};

// 同步版本的getAIInterpretation（仅从localStorage获取，用于向后兼容）
export const getAIInterpretationSync = (analysisId: string): AIInterpretationResult | null => {
  try {
    const key = `ai-interpretation-${analysisId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    // 静默处理获取错误
  }
  return null;
};

// 清除AI解读结果
export const clearAIInterpretation = (analysisId: string): void => {
  try {
    const key = `ai-interpretation-${analysisId}`;
    localStorage.removeItem(key);
  } catch (error) {
    // 静默处理清除错误
  }
};