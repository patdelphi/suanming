// 神机阁项目核心类型定义
// 定义前端与后端交互的所有数据结构

// ===== 通用类型 =====

/** API统一响应格式 */
export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/** 通用状态枚举 */
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** 性别类型 */
export type Gender = 'male' | 'female';

/** 分析类型 */
export type AnalysisType = 'bazi' | 'ziwei' | 'yijing' | 'qimen' | 'comprehensive';

// ===== 输入数据类型 =====

/** 出生数据（分析请求的输入） */
export interface BirthData {
  name: string;
  birth_date: string; // YYYY-MM-DD
  birth_time?: string; // HH:MM
  gender?: Gender;
  birth_place?: string;
  question?: string; // 易经占卜用
}

/** 前端出生日期选择器格式 */
export interface BirthDateInput {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  name?: string;
  gender?: string;
}

/** 分析请求 */
export interface AnalysisRequest {
  user_id: number;
  birth_data: BirthData;
}

// ===== 八字分析类型 =====

/** 四柱单柱数据 */
export interface BaziPillar {
  stem: string; // 天干
  branch: string; // 地支
  ten_god: string; // 十神
  element: string; // 五行
  hidden_stems?: Array<{
    stem: string;
    ten_god: string;
    element: string;
  }>;
}

/** 四柱数据 */
export interface BaziPillars {
  year: BaziPillar;
  month: BaziPillar;
  day: BaziPillar;
  hour: BaziPillar;
}

/** 五行统计 */
export interface WuxingCount {
  金: number;
  木: number;
  水: number;
  火: number;
  土: number;
}

/** 五行分析 */
export interface WuxingAnalysis {
  elements: WuxingCount;
  dominant_element: string;
  weak_element: string;
  balance_score: number;
  recommendations: string[];
}

/** 大运序列项 */
export interface DayunItem {
  age_start: number;
  age_end: number;
  stem: string;
  branch: string;
  element: string;
  ten_god: string;
}

/** 大运流年分析 */
export interface DayunYearlyAnalysis {
  year: number;
  age: number;
  stem: string;
  branch: string;
  analysis: string;
  fortune_score?: number;
}

/** 大运分析 */
export interface DayunAnalysis {
  dayun_sequence: DayunItem[];
  detailed_yearly_analysis: DayunYearlyAnalysis[];
  current_dayun?: DayunItem;
}

/** 八字基础信息 */
export interface BaziBasicInfo {
  name: string;
  birth_date: string;
  birth_time: string;
  gender: string;
  solar_date?: string;
  lunar_date?: string;
  day_master?: string;
  day_master_element?: string;
  day_master_strength?: string;
}

/** 八字完整分析结果 */
export interface BaziAnalysisResult {
  basic_info: BaziBasicInfo;
  pillars: BaziPillars;
  wuxing_analysis: WuxingAnalysis;
  dayun_analysis: DayunAnalysis;
  personality_analysis?: string;
  career_analysis?: string;
  love_analysis?: string;
  health_analysis?: string;
  overall_fortune?: string;
  [key: string]: unknown; // 其他扩展字段
}

// ===== 紫微斗数分析类型 =====

/** 紫微宫位数据 */
export interface ZiweiPalace {
  name: string;
  position: number;
  stars: string[];
  major_stars?: string[];
  minor_stars?: string[];
  sihua?: Record<string, string>;
  [key: string]: unknown;
}

/** 紫微斗数分析结果 */
export interface ZiweiAnalysisResult {
  basic_info: BaziBasicInfo;
  palaces: Record<string, ZiweiPalace>;
  detailed_analysis: {
    life_guidance?: {
      pattern_analysis?: {
        detected_patterns: Array<{
          name: string;
          type: string;
          description: string;
          level?: string;
        }>;
      };
    };
    [key: string]: unknown;
  };
  sihua_explanation?: Record<string, unknown>;
  major_period_palace?: Record<string, unknown>;
  nayin_analysis?: Record<string, unknown>;
  [key: string]: unknown;
}

// ===== 易经分析类型 =====

/** 卦象数据 */
export interface HexagramData {
  name: string;
  symbol?: string;
  description: string;
  judgment?: string;
  image?: string;
  trigram?: {
    upper: string;
    lower: string;
  };
}

/** 变爻分析 */
export interface ChangingLineAnalysis {
  line_number: number;
  description: string;
  interpretation?: string;
}

/** 易经分析结果 */
export interface YijingAnalysisResult {
  question: string;
  main_hexagram: HexagramData;
  changed_hexagram?: HexagramData;
  changing_lines?: number[];
  detailed_analysis?: Array<ChangingLineAnalysis & { [key: string]: unknown }>;
  interpretation?: string;
  guidance?: string;
  [key: string]: unknown;
}

// ===== 奇门遁甲分析类型 =====

/** 奇门宫位数据 */
export interface QimenPalace {
  position: number;
  name: string;
  star?: string;
  door?: string;
  deity?: string;
  stem?: string;
  branch?: string;
  [key: string]: unknown;
}

/** 奇门遁甲分析结果 */
export interface QimenAnalysisResult {
  basic_info: {
    qimen_info?: Record<string, string>;
    [key: string]: unknown;
  };
  detailed_analysis: {
    qimen_pan?: {
      dipan: QimenPalace[];
      [key: string]: unknown;
    };
    yongshen_analysis?: Record<string, unknown>;
    pattern_analysis?: Array<{
      name?: string;
      type?: string;
      level?: string;
      description?: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
  prediction_result?: Record<string, unknown>;
  guidance?: Record<string, unknown>;
  [key: string]: unknown;
}

// ===== 分析结果联合类型 =====

/** 各分析结果映射 */
export interface AnalysisResultMap {
  bazi: BaziAnalysisResult;
  ziwei: ZiweiAnalysisResult;
  yijing: YijingAnalysisResult;
  qimen: QimenAnalysisResult;
}

/** 综合分析结果 */
export interface ComprehensiveAnalysisResult {
  analysis_type: 'comprehensive';
  analysis_date: string;
  included_types: string[];
  results: Partial<AnalysisResultMap>;
}

// ===== 用户与档案类型 =====

/** 用户信息 */
export interface User {
  id: number;
  email: string;
}

/** 认证响应 */
export interface AuthResponse {
  user: User;
  token: string;
}

/** 用户档案 */
export interface UserProfile {
  id: number;
  user_id: number;
  username?: string;
  full_name: string;
  birth_date: string;
  birth_time?: string;
  birth_location?: string;
  gender: Gender;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

/** 档案更新请求数据 */
export interface ProfileUpdateData {
  full_name?: string;
  birth_date?: string;
  birth_time?: string;
  birth_location?: string;
  gender?: Gender;
}

// ===== 历史记录类型 =====

/** 历史阅读记录 */
export interface NumerologyReading {
  id: number;
  user_id: number;
  reading_type: AnalysisType;
  name: string;
  birth_date: string | null;
  birth_time?: string | null;
  birth_place?: string | null;
  gender?: string | null;
  input_data: string | Record<string, unknown>;
  analysis: Record<string, unknown>;
  results?: Record<string, unknown>;
  status: AnalysisStatus;
  has_ai_interpretation?: boolean;
  created_at: string;
  updated_at: string;
}

/** 历史记录查询参数 */
export interface HistoryQueryParams {
  page?: number;
  limit?: number;
  reading_type?: string;
}

/** 历史记录统计 */
export interface HistoryStats {
  total_readings: number;
  by_type: Record<string, number>;
  recent_activity?: Array<{
    date: string;
    count: number;
  }>;
}

// ===== 分析类型元数据 =====

/** 分析类型信息 */
export interface AnalysisTypeInfo {
  type: string;
  name: string;
  description: string;
  required_fields: string[];
  optional_fields: string[];
}

// ===== AI解读类型 =====

/** AI解读记录 */
export interface AIInterpretation {
  id: number;
  reading_id: number;
  user_id: number;
  content: string;
  model?: string;
  tokens_used?: number;
  success?: boolean;
  created_at: string;
}

// ===== 分析响应格式 =====

/** 分析API响应 */
export interface AnalysisResponse<T extends keyof AnalysisResultMap = keyof AnalysisResultMap> {
  record_id?: number;
  analysis: AnalysisResultMap[T];
}

/** 保存历史记录响应 */
export interface SaveHistoryResponse {
  record_id: number;
  message: string;
}