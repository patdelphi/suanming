import { AIConfig } from '@/config/aiConfig';

interface FrontendConfig {
  ai: {
    apiKey: string;
    apiUrl: string;
    modelName: string;
    maxTokens: string;
    temperature: string;
    timeout: string;
    stream: boolean;
  };
  apiBaseUrl: string;
}

let cachedConfig: FrontendConfig | null = null;
let configPromise: Promise<FrontendConfig> | null = null;

// 从后端获取配置
export const fetchConfig = async (): Promise<FrontendConfig> => {
  try {
    // 检查是否有缓存的配置
    if (cachedConfig) {
      return cachedConfig;
    }

    // 如果已有正在进行的请求，直接返回该Promise
    if (configPromise) {
      return configPromise;
    }

    // 创建新的请求Promise
    configPromise = new Promise(async (resolve, reject) => {
      try {
        // 发送请求到后端配置API
        const response = await fetch('/api/config');
        if (!response.ok) {
          throw new Error('Failed to fetch config');
        }

        const config = await response.json();
        cachedConfig = config;
        resolve(config);
      } catch (error) {
        console.error('Error fetching config:', error);
        // 返回默认配置作为后备
        const defaultConfig = {
          ai: {
            apiKey: '',
            apiUrl: '',
            modelName: 'GLM-4.5',
            maxTokens: '50000',
            temperature: '0.6',
            timeout: '120000',
            stream: true
          },
          apiBaseUrl: ''
        };
        cachedConfig = defaultConfig;
        resolve(defaultConfig);
      } finally {
        // 请求完成后清除promise引用
        // configPromise = null;
      }
    });

    return configPromise;
  } catch (error) {
    console.error('Error fetching config:', error);
    // 返回默认配置作为后备
    return {
      ai: {
        apiKey: '',
        apiUrl: '',
        modelName: 'GLM-4.5',
        maxTokens: '50000',
        temperature: '0.6',
        timeout: '120000',
        stream: true
      },
      apiBaseUrl: ''
    };
  }
};

// 将后端配置转换为前端AI配置格式
export const getRuntimeAIConfig = async (): Promise<AIConfig> => {
  const config = await fetchConfig();
  return {
    apiKey: config.ai.apiKey,
    apiUrl: config.ai.apiUrl,
    modelName: config.ai.modelName,
    maxTokens: parseInt(config.ai.maxTokens),
    temperature: parseFloat(config.ai.temperature),
    timeout: parseInt(config.ai.timeout),
    stream: config.ai.stream
  };
};

// 获取API基础URL（新增便捷方法）
export const getApiBaseUrl = async (): Promise<string> => {
  const config = await fetchConfig();
  return config.apiBaseUrl || 
    import.meta.env.VITE_API_BASE_URL || 
    (import.meta.env.DEV ? 'http://localhost:3001/api' : 
     (window.location.hostname.includes('koyeb.app') ? `${window.location.origin}/api` : `${window.location.origin}/api`));
};

// 清除配置缓存（用于测试或配置更新时）
export const clearConfigCache = (): void => {
  cachedConfig = null;
  configPromise = null;
};