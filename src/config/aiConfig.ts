import { getRuntimeAIConfig } from '@/services/configService';

// AI解读功能配置文件
export interface AIConfig {
  apiKey: string;
  apiUrl: string;
  modelName: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
  stream: boolean;
}

// 默认AI配置
export const defaultAIConfig: AIConfig = {
  apiKey: import.meta.env.VITE_AI_API_KEY || '',
  apiUrl: import.meta.env.VITE_AI_API_URL || '',
  modelName: import.meta.env.VITE_AI_MODEL_NAME || 'GLM-4.5',
  maxTokens: parseInt(import.meta.env.VITE_AI_MAX_TOKENS || '50000'),
  temperature: parseFloat(import.meta.env.VITE_AI_TEMPERATURE || '0.6'),
  timeout: parseInt(import.meta.env.VITE_AI_TIMEOUT || '120000'),
  stream: import.meta.env.VITE_AI_STREAM === 'false' ? false : true
};

// AI解读提示词模板
export const aiPromptTemplates = {
  bazi: `你是一位专业的八字命理大师，请对以下八字分析结果进行深度解读和补充说明。

请从以下几个方面进行解读：
1. 命格特点的深层含义
2. 五行平衡对人生的具体影响
3. 大运流年的关键转折点
4. 实用的人生建议和注意事项
5. 现代生活中的应用指导

请用通俗易懂的语言，结合现代生活实际，给出具有指导意义的解读。

八字分析结果：
{analysisContent}

请提供详细的AI解读：`,

  ziwei: `你是一位资深的紫微斗数专家，请对以下紫微斗数分析结果进行专业解读。

请重点分析：
1. 命宫主星的性格特质解析
2. 十二宫位的相互影响
3. 大限小限的运势变化
4. 桃花、财帛、事业等重点宫位分析
5. 现实生活中的应用建议

请结合现代社会背景，提供实用的人生指导。

紫微斗数分析结果：
{analysisContent}

请提供专业的AI解读：`,

  yijing: `你是一位精通易经的占卜大师，请对以下易经占卜结果进行深入解读。

请从以下角度分析：
1. 卦象的深层寓意
2. 爻辞的具体指导意义
3. 变卦的发展趋势
4. 针对问题的具体建议
5. 行动时机和注意事项

请用现代语言解释古典智慧，提供切实可行的指导。

易经占卜结果：
{analysisContent}

请提供智慧的AI解读：`,

  qimen: `你是一位精通奇门遁甲的预测大师，请对以下奇门遁甲分析结果进行专业解读。

请重点分析：
1. 奇门盘局的整体格局特点
2. 用神落宫的吉凶分析
3. 九星八门八神的组合意义
4. 格局对事情发展的具体影响
5. 最佳行动时机和策略建议
6. 需要注意的不利因素

请结合现代实际情况，提供具有指导价值的预测分析。

奇门遁甲分析结果：
{analysisContent}

请提供专业的AI解读：`
};

// 获取AI配置
export const getAIConfig = (): AIConfig => {
  // 可以从localStorage或其他存储中读取用户自定义配置
  const savedConfig = localStorage.getItem('ai-config');
  if (savedConfig) {
    try {
      const parsedConfig = JSON.parse(savedConfig);
      return { ...defaultAIConfig, ...parsedConfig };
    } catch (error) {
      // 解析失败，使用默认配置
    }
  }
  return defaultAIConfig;
};

// 异步版本的getAIConfig
export const getAIConfigAsync = async (): Promise<AIConfig> => {
  try {
    // 获取后端配置
    const runtimeConfig = await getRuntimeAIConfig();
    
    // 获取用户自定义配置
    const savedConfig = localStorage.getItem('ai-config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        return { ...runtimeConfig, ...parsedConfig };
      } catch (error) {
        // 解析失败，仅使用运行时配置
      }
    }
    return runtimeConfig;
  } catch (error) {
    console.error('Error getting AI config:', error);
    // 出错时回退到getAIConfig
    return getAIConfig();
  }
};

// 保存AI配置
export const saveAIConfig = async (config: Partial<AIConfig>): Promise<void> => {
  try {
    const currentConfig = await getAIConfigAsync();
    const newConfig = { ...currentConfig, ...config };
    localStorage.setItem('ai-config', JSON.stringify(newConfig));
  } catch (error) {
    // 静默处理保存错误
  }
};

// 验证AI配置
export const validateAIConfig = (config: AIConfig): boolean => {
  return !!(config.apiKey && config.apiUrl && config.modelName);
};

// 获取提示词模板
export const getPromptTemplate = (analysisType: 'bazi' | 'ziwei' | 'yijing' | 'qimen'): string => {
  return aiPromptTemplates[analysisType] || aiPromptTemplates.bazi;
};