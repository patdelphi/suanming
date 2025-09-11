import { getApiBaseUrl } from '@/services/configService';
// 本地API客户端
// 替代Supabase客户端，提供相同的接口

// 强制在开发环境使用正确的后端地址
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001/api' : 
   (window.location.hostname.includes('koyeb.app') ? `${window.location.origin}/api` : `${window.location.origin}/api`));

// 在应用启动时从后端获取配置并更新API_BASE_URL
(async () => {
  try {
    API_BASE_URL = await getApiBaseUrl();
  } catch (error) {
    console.error('Error updating API base URL:', error);
    // 出错时保持现有配置
  }
})();

// 调试信息


interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

interface User {
  id: number;
  email: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

class LocalApiClient {
  private token: string | null = null;
  private pendingRequests: Map<string, Promise<any>> = new Map();

  constructor() {
    // 从localStorage恢复token
    this.token = localStorage.getItem('auth_token');
  }

  // 设置认证token
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // 获取认证头
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // 通用请求方法
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      // 检查响应是否为空或非JSON格式
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          return {
            error: {
              code: 'HTTP_ERROR',
              message: `HTTP ${response.status}: ${response.statusText}`,
            },
          };
        }
        // 如果是成功响应但不是JSON，返回空数据
        return { data: {} as T };
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        return {
          error: {
            code: 'JSON_PARSE_ERROR',
            message: '服务器返回了无效的JSON格式',
          },
        };
      }

      if (!response.ok) {
        return {
          error: data.error || {
            code: 'HTTP_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`,
          },
        };
      }

      return { data: data.data || data };
    } catch (error) {
      // API请求失败
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : '网络请求失败',
        },
      };
    }
  }

  // 认证相关方法
  auth = {
    // 用户注册
    signUp: async (email: string, password: string, full_name?: string): Promise<ApiResponse<AuthResponse>> => {
      const response = await this.request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name }),
      });

      if (response.data) {
        this.setToken(response.data.token);
      }

      return response;
    },

    // 用户登录
    signInWithPassword: async ({ email, password }: { email: string; password: string }): Promise<ApiResponse<AuthResponse>> => {
      const response = await this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.data) {
        this.setToken(response.data.token);
      }

      return response;
    },

    // 获取当前用户
    getUser: async (): Promise<ApiResponse<{ user: User }>> => {
      return this.request<{ user: User }>('/auth/me');
    },

    // 用户登出
    signOut: async (): Promise<ApiResponse<{ message: string }>> => {
      const response = await this.request<{ message: string }>('/auth/logout', {
        method: 'POST',
      });

      this.setToken(null);
      return response;
    },

    // 验证token
    verify: async (): Promise<ApiResponse<{ valid: boolean; user: User }>> => {
      return this.request<{ valid: boolean; user: User }>('/auth/verify');
    },

    // 修改密码
    changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
    },
  };

  // 用户档案相关方法
  profiles = {
    // 获取用户档案
    get: async (): Promise<ApiResponse<{ profile: any }>> => {
      return this.request<{ profile: any }>('/profile');
    },

    // 更新用户档案
    update: async (profileData: any): Promise<ApiResponse<{ profile: any }>> => {
      return this.request<{ profile: any }>('/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
    },

    // 上传头像
    uploadAvatar: async (avatarUrl: string): Promise<ApiResponse<{ message: string; avatar_url: string }>> => {
      return this.request<{ message: string; avatar_url: string }>('/profile/avatar', {
        method: 'POST',
        body: JSON.stringify({ avatar_url: avatarUrl }),
      });
    },
  };

  // 生成请求唯一键
  private generateRequestKey(endpoint: string, data: any): string {
    return `${endpoint}:${JSON.stringify(data)}`;
  }

  // 带去重的请求方法
  private async requestWithDeduplication<T>(
    endpoint: string,
    options: RequestInit,
    data: any
  ): Promise<ApiResponse<T>> {
    const requestKey = this.generateRequestKey(endpoint, data);
    
    // 如果已有相同请求在进行中，返回该请求的Promise
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }
    
    // 创建新请求
    const requestPromise = this.request<T>(endpoint, options).finally(() => {
      // 请求完成后清除缓存
      this.pendingRequests.delete(requestKey);
    });
    
    // 缓存请求Promise
    this.pendingRequests.set(requestKey, requestPromise);
    
    return requestPromise;
  }

  // 分析相关方法
  analysis = {
    // 八字分析
    bazi: async (birthData: any): Promise<ApiResponse<{ record_id: number; analysis: any }>> => {
      return this.requestWithDeduplication<{ record_id: number; analysis: any }>('/analysis/bazi', {
        method: 'POST',
        body: JSON.stringify({ birth_data: birthData }),
      }, birthData);
    },

    // 紫微斗数分析
    ziwei: async (birthData: any): Promise<ApiResponse<{ record_id: number; analysis: any }>> => {
      return this.requestWithDeduplication<{ record_id: number; analysis: any }>('/analysis/ziwei', {
        method: 'POST',
        body: JSON.stringify({ birth_data: birthData }),
      }, birthData);
    },

    // 易经分析
    yijing: async (yijingData: any): Promise<ApiResponse<{ record_id: number; analysis: any }>> => {
      return this.requestWithDeduplication<{ record_id: number; analysis: any }>('/analysis/yijing', {
        method: 'POST',
        body: JSON.stringify(yijingData),
      }, yijingData);
    },

    // 奇门遁甲分析
    qimen: async (qimenData: any): Promise<ApiResponse<{ record_id: number; analysis: any }>> => {
      return this.requestWithDeduplication<{ record_id: number; analysis: any }>('/qimen/analyze', {
        method: 'POST',
        body: JSON.stringify(qimenData),
      }, qimenData);
    },

    // 综合分析
    comprehensive: async (birthData: any, includeTypes?: string[]): Promise<ApiResponse<{ record_id: number; analysis: any }>> => {
      return this.request<{ record_id: number; analysis: any }>('/analysis/comprehensive', {
        method: 'POST',
        body: JSON.stringify({ birth_data: birthData, include_types: includeTypes }),
      });
    },

    // 获取分析类型
    getTypes: async (): Promise<ApiResponse<{ available_types: any[] }>> => {
      return this.request<{ available_types: any[] }>('/analysis/types');
    },

    // 验证分析数据
    validate: async (birthData: any, analysisType: string): Promise<ApiResponse<{ valid: boolean; errors: string[] }>> => {
      return this.request<{ valid: boolean; errors: string[] }>('/analysis/validate', {
        method: 'POST',
        body: JSON.stringify({ birth_data: birthData, analysis_type: analysisType }),
      });
    },

    // 保存历史记录
    saveHistory: async (analysisType: string, analysisData: any, inputData?: any): Promise<ApiResponse<{ record_id: number; message: string }>> => {
      return this.request<{ record_id: number; message: string }>('/analysis/save-history', {
        method: 'POST',
        body: JSON.stringify({ 
          analysis_type: analysisType, 
          analysis_data: analysisData, 
          input_data: inputData 
        }),
      });
    },
  };

  // 历史记录相关方法
  history = {
    // 获取历史记录
    getAll: async (params?: { page?: number; limit?: number; reading_type?: string }): Promise<ApiResponse<any[]>> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.reading_type) searchParams.set('reading_type', params.reading_type);

      const queryString = searchParams.toString();
      const endpoint = queryString ? `/history?${queryString}` : '/history';

      return this.request<any[]>(endpoint);
    },

    // 获取单个记录
    getById: async (id: string): Promise<ApiResponse<any>> => {
      return this.request<any>(`/history/${id}`);
    },

    // 删除记录
    delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>(`/history/${id}`, {
        method: 'DELETE',
      });
    },

    // 批量删除记录
    deleteBatch: async (ids: string[]): Promise<ApiResponse<{ message: string }>> => {
      return this.request<{ message: string }>('/history', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      });
    },

    // 获取统计信息
    getStats: async (): Promise<ApiResponse<any>> => {
      return this.request<any>('/history/stats/summary');
    },

    // 搜索记录
    search: async (query: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<any[]>> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());

      const queryString = searchParams.toString();
      const endpoint = queryString ? `/history/search/${encodeURIComponent(query)}?${queryString}` : `/history/search/${encodeURIComponent(query)}`;

      return this.request<any[]>(endpoint);
    },
  };

  // AI解读相关方法
  aiInterpretation = {
    // 获取AI解读结果
    get: async (readingId: number): Promise<ApiResponse<any>> => {
      return this.request(`/ai-interpretation/get/${readingId}`);
    },

    // 保存AI解读结果
    save: async (readingId: number, content: string, model?: string, tokensUsed?: number): Promise<ApiResponse<any>> => {
      return this.request<any>('/ai-interpretation/save', {
        method: 'POST',
        body: JSON.stringify({
          reading_id: readingId,
          content,
          model,
          tokens_used: tokensUsed,
          success: true
        })
      });
    },

    // 获取AI解读列表
    list: async (params?: { page?: number; limit?: number; reading_type?: string }): Promise<ApiResponse<any[]>> => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.reading_type) queryParams.append('reading_type', params.reading_type);
      
      const endpoint = `/ai-interpretation/list${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      return this.request<any[]>(endpoint);
    }
  };

  // 兼容Supabase的functions.invoke方法
  functions = {
    invoke: async (functionName: string, options: { body: any }): Promise<ApiResponse<any>> => {
      // 将Supabase Edge Function调用映射到本地API
      const functionMap: Record<string, string> = {
        'bazi-analyzer': '/analysis/bazi',
        'ziwei-analyzer': '/analysis/ziwei',
        'yijing-analyzer': '/analysis/yijing',
        'bazi-details': '/analysis/bazi-details',
        'bazi-wuxing-analysis': '/analysis/bazi-wuxing',
        'reading-history': '/history',
      };

      const endpoint = functionMap[functionName.replace(/\?.*$/, '')] || `/functions/${functionName}`;
      
      if (functionName.includes('reading-history')) {
        const { action, ...params } = options.body;
        
        switch (action) {
          case 'get_history':
            return this.history.getAll();
          case 'delete_reading':
            return this.history.delete(params.reading_id);
          default:
            return { error: { code: 'UNKNOWN_ACTION', message: `Unknown action: ${action}` } };
        }
      }

      return this.request<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify(options.body),
      });
    },
  };
}

// 创建单例实例
const localApi = new LocalApiClient();

export { localApi };
export type { ApiResponse, User, AuthResponse };