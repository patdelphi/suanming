import React, { useState, useEffect, useCallback, ErrorInfo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Calendar, Star, BookOpen, Sparkles, User, BarChart3, Zap, TrendingUp, Loader2, Clock, Target, Heart, DollarSign, Activity, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { BackToTop } from './ui/BackToTop';
import DownloadButton from './ui/DownloadButton';
import AIInterpretationButton from './ui/AIInterpretationButton';
import AIConfigModal from './ui/AIConfigModal';
import { localApi } from '../lib/localApi';
import type { Gender } from '../types';

/**
 * 八字分析组件的Props接口
 */
interface CompleteBaziAnalysisProps {
  /** 出生日期信息 */
  birthDate: {
    /** 出生日期 (YYYY-MM-DD) */
    date: string;
    /** 出生时间 (HH:MM) */
    time: string;
    /** 姓名（可选） */
    name?: string;
    /** 性别（可选） */
    gender?: string;
  };
  /** 可选的预先分析的数据 */
  analysisData?: any;
  /** 历史记录ID，用于AI解读 */
  recordId?: number;
}

/**
 * 验证出生日期数据的有效性
 * @param birthDate 出生日期数据
 * @returns 验证结果和错误信息
 */
const validateBirthDate = (birthDate: CompleteBaziAnalysisProps['birthDate']): { isValid: boolean; error?: string } => {
  if (!birthDate) {
    return { isValid: false, error: '出生日期数据不能为空' };
  }
  
  if (!birthDate.date || typeof birthDate.date !== 'string') {
    return { isValid: false, error: '出生日期不能为空' };
  }
  
  // 验证日期格式
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(birthDate.date)) {
    return { isValid: false, error: '出生日期格式必须为 YYYY-MM-DD' };
  }
  
  // 验证日期有效性
  const date = new Date(birthDate.date);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: '出生日期无效' };
  }
  
  if (!birthDate.time || typeof birthDate.time !== 'string') {
    return { isValid: false, error: '出生时间不能为空' };
  }
  
  // 验证时间格式
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(birthDate.time)) {
    return { isValid: false, error: '出生时间格式必须为 HH:MM' };
  }
  
  // 验证时间有效性
  const [hours, minutes] = birthDate.time.split(':').map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return { isValid: false, error: '出生时间无效' };
  }
  
  // 验证姓名长度
  if (birthDate.name && birthDate.name.length > 50) {
    return { isValid: false, error: '姓名长度不能超过50个字符' };
  }
  
  // 验证性别
  if (birthDate.gender) {
    const validGenders = ['male', 'female', '男', '女'];
    if (!validGenders.includes(birthDate.gender)) {
      return { isValid: false, error: '性别必须是 male/female 或 男/女' };
    }
  }
  
  return { isValid: true };
};

/**
 * 错误显示组件
 */
const ErrorDisplay: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => (
  <Card className="border-red-200 bg-red-50">
    <CardContent className="p-6">
      <div className="flex items-center space-x-3">
        <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-2">分析出错</h3>
          <p className="text-red-700 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              重新分析
            </button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const CompleteBaziAnalysis: React.FC<CompleteBaziAnalysisProps> = ({ birthDate, analysisData: propAnalysisData, recordId }) => {
  const [isLoading, setIsLoading] = useState(!propAnalysisData);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(propAnalysisData || null);
  const [showAIConfig, setShowAIConfig] = useState(false);
  
  // 输入验证
  const validation = validateBirthDate(birthDate);
  const isValidInput = validation.isValid;

  // 五行颜色配置
  const elementColors: { [key: string]: string } = {
    '木': '#22c55e', // 绿色
    '火': '#ef4444', // 红色
    '土': '#eab308', // 黄色
    '金': '#64748b', // 银色
    '水': '#3b82f6'  // 蓝色
  };

  // 五行符号配置
  const elementSymbols: { [key: string]: string } = {
    '木': '🌲',
    '火': '🔥',
    '土': '⛰️',
    '金': '⚡',
    '水': '💧'
  };

  // 十神颜色配置
  const tenGodColors: { [key: string]: string } = {
    '正官': 'bg-blue-100 text-blue-800 border-blue-300',
    '七杀': 'bg-red-100 text-red-800 border-red-300',
    '正财': 'bg-green-100 text-green-800 border-green-300',
    '偏财': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    '正印': 'bg-purple-100 text-purple-800 border-purple-300',
    '偏印': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    '食神': 'bg-pink-100 text-pink-800 border-pink-300',
    '伤官': 'bg-orange-100 text-orange-800 border-orange-300',
    '比肩': 'bg-gray-100 text-gray-800 border-gray-300',
    '劫财': 'bg-slate-100 text-slate-800 border-slate-300',
    '日主': 'bg-amber-100 text-amber-800 border-amber-300'
  };

  // 分析数据获取函数
  const fetchAnalysisData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const birthData = {
        name: birthDate.name || '用户',
        birth_date: birthDate.date,
        birth_time: birthDate.time,
        gender: (birthDate.gender || 'male') as Gender
      };

      const baziResponse = await localApi.analysis.bazi(birthData);

      if (baziResponse.error) {
        throw new Error(baziResponse.error.message || '八字分析失败');
      }

      const analysisResult = baziResponse.data?.analysis;
      if (!analysisResult) {
        throw new Error('分析结果为空');
      }

      setAnalysisData(analysisResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '分析数据获取失败，请稍后重试';
      console.error('八字分析错误:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [birthDate.name, birthDate.date, birthDate.time, birthDate.gender]);

  useEffect(() => {
    // 如果输入无效，不执行分析
    if (!isValidInput) {
      return;
    }
    
    // 如果已经有分析数据，直接使用
    if (propAnalysisData) {
      setAnalysisData(propAnalysisData);
      setIsLoading(false);
      return;
    }

    if (birthDate?.date && !propAnalysisData) {
      fetchAnalysisData();
    }
  }, [birthDate?.date, birthDate?.time, birthDate?.name, birthDate?.gender, propAnalysisData, isValidInput, fetchAnalysisData]);

  // 输入验证失败时的早期返回
  if (!isValidInput) {
    return <ErrorDisplay error={validation.error!} />;
  }

  // 渲染加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-yellow-50">
        <Card className="chinese-card-decoration border-2 border-yellow-400 p-8">
          <CardContent className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-800 mb-2">正在进行专业八字分析</h3>
            <p className="text-red-600">请稍候，正在生成您的详细命理报告...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchAnalysisData} />;
  }
  
  // 检查分析数据的完整性
  if (!analysisData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-yellow-50">
        <Card className="chinese-card-decoration border-2 border-red-400 p-8">
          <CardContent className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-bold text-red-800 mb-2">分析失败</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              重新分析
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-yellow-50">
        <Card className="chinese-card-decoration border-2 border-yellow-400 p-8">
          <CardContent className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-red-800 mb-2">数据获取异常</h3>
            <p className="text-red-600">未能获取到完整的分析数据，请重新提交分析</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 渲染四柱信息卡片
  const renderPillarCard = (pillar: any, pillarName: string, description: string) => {
    if (!pillar) return null;

    return (
      <Card className="chinese-card-decoration hover:shadow-xl transition-all duration-300 border-2 border-yellow-400">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-red-800 text-lg font-bold chinese-text-shadow">
            {pillarName}
          </CardTitle>
          <p className="text-red-600 text-xs">{description}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-800 mb-2">
              {pillar.stem}{pillar.branch}
            </div>
            <div className="flex justify-center space-x-2 mb-3">
              <span className={`px-2 py-1 rounded text-xs font-medium border ${tenGodColors[pillar.ten_god] || 'bg-gray-100 text-gray-800'}`}>
                {pillar.ten_god}
              </span>
              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                {pillar.element}
              </span>
            </div>
          </div>
          
          {pillar.hidden_stems && pillar.hidden_stems.length > 0 && (
            <div className="border-t pt-2">
              <h5 className="text-xs font-semibold text-red-800 mb-1">地支藏干</h5>
              <div className="flex flex-wrap gap-1">
                {pillar.hidden_stems.map((stem: string, index: number) => (
                  <span key={index} className="px-1 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                    {stem}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // 渲染五行雷达图
  const renderWuxingRadar = () => {
    if (!analysisData.wuxing_analysis?.element_distribution) return null;

    const elements = analysisData.wuxing_analysis.element_distribution;
    const radarData = Object.entries(elements).map(([element, count]) => ({
      element,
      value: count as number,
      fullMark: 6
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#dc2626" />
          <PolarAngleAxis 
            dataKey="element" 
            tick={{ fill: '#dc2626', fontSize: 14, fontWeight: 'bold' }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 6]} 
            tick={{ fill: '#b91c1c', fontSize: 12 }}
          />
          <Radar
            name="五行强度"
            dataKey="value"
            stroke="#dc2626"
            fill="rgba(220, 38, 38, 0.3)"
            fillOpacity={0.6}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  // 渲染五行分布卡片
  const renderElementCards = () => {
    if (!analysisData.wuxing_analysis?.element_distribution) return null;

    const elements = analysisData.wuxing_analysis.element_distribution;
    const total = Object.values(elements).reduce((sum: number, count: any) => sum + (typeof count === 'number' ? count : 0), 0) as number;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
        {Object.entries(elements).map(([element, count]) => {
          const numCount = typeof count === 'number' ? count : 0;
          const percentage = total > 0 ? Math.round((numCount / total) * 100) : 0;
          const strength = numCount >= 3 ? '旺' : numCount >= 2 ? '中' : '弱';
          
          return (
            <Card key={element} className="text-center hover:shadow-xl transition-all duration-300 chinese-card-decoration border-2 border-yellow-400">
              <CardContent className="p-4">
                <div className="text-3xl mb-2">{elementSymbols[element]}</div>
                <h3 className="font-bold text-red-800 text-lg mb-2 chinese-text-shadow">{element}</h3>
                <div className="text-2xl font-bold text-yellow-600 mb-1">{numCount}</div>
                <div className="text-sm text-gray-600 mb-2">{percentage}%</div>
                <div className={`text-sm font-medium mb-2 ${
                  strength === '旺' ? 'text-green-600' : 
                  strength === '中' ? 'text-yellow-600' : 'text-orange-600'
                }`}>
                  {strength}
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${percentage}%`, 
                      backgroundColor: elementColors[element]
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-8" id="bazi-analysis-content" data-export-content>
        
        {/* 下载按钮和AI解读按钮 */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 no-export" data-no-export>
          <div className="flex-1">
            <AIInterpretationButton
              analysisData={analysisData}
              analysisType="bazi"
              recordId={recordId}
              onConfigClick={() => setShowAIConfig(true)}
            />
          </div>
          <div className="flex-shrink-0">
            <DownloadButton
              analysisData={analysisData}
              analysisType="bazi"
              userName={birthDate.name}
              targetElementId="bazi-analysis-content"
              className="sticky top-4 z-10"
            />
          </div>
        </div>
        
        {/* 标题和基本信息 */}
        <Card className="chinese-card-decoration dragon-corner border-2 border-yellow-400">
          <CardHeader className="text-center">
            <CardTitle className="text-red-800 text-3xl font-bold chinese-text-shadow">
              {analysisData.basic_info?.personal_data?.name || '用户'}的专业八字命理分析报告
            </CardTitle>
            <div className="flex justify-center space-x-6 mt-4 text-red-700">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>{analysisData.basic_info?.personal_data?.birth_date}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>{analysisData.basic_info?.personal_data?.birth_time}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>{analysisData.basic_info?.personal_data?.gender || '未知'}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-800 mb-4">
                八字：{analysisData.basic_info?.bazi_chart?.complete_chart}
              </div>
              
              {/* 农历信息显示 */}
              {analysisData.basic_info?.lunar_info && (
                <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <h4 className="font-bold text-purple-800 mb-3 flex items-center">
                    <span className="mr-2">🌙</span>
                    农历信息
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="text-center">
                      <div className="text-purple-700 font-semibold mb-1">农历日期</div>
                      <div className="text-purple-800 font-bold">{analysisData.basic_info.lunar_info.lunar_date}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-700 font-semibold mb-1">干支年</div>
                      <div className="text-purple-800 font-bold">{analysisData.basic_info.lunar_info.ganzhi_year}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-700 font-semibold mb-1">生肖</div>
                      <div className="text-purple-800 font-bold">{analysisData.basic_info.lunar_info.zodiac}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-700 font-semibold mb-1">节气</div>
                      <div className="text-purple-800 font-bold">{analysisData.basic_info.lunar_info.solar_term}</div>
                    </div>
                  </div>
                  {analysisData.basic_info.lunar_info.note && (
                    <p className="text-purple-600 text-xs mt-3 text-center">
                      {analysisData.basic_info.lunar_info.note}
                    </p>
                  )}
                </div>
              )}
              
              {/* 子时计算说明 */}
              {analysisData.basic_info?.zishi_calculation_note && (
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center">
                    <span className="mr-2">⏰</span>
                    子时计算说明
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-700 font-semibold">子时类型</span>
                        <span className="text-blue-800 font-bold px-2 py-1 bg-blue-100 rounded">
                          {analysisData.basic_info.zishi_calculation_note.zishi_type}
                        </span>
                      </div>
                      <div className="text-blue-700 text-sm mb-2">
                        <strong>计算方法：</strong>{analysisData.basic_info.zishi_calculation_note.calculation_method}
                      </div>
                      <div className="text-blue-600 text-sm">
                        {analysisData.basic_info.zishi_calculation_note.explanation}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 节气调整提示 */}
              {analysisData.basic_info?.solar_term_adjustment?.shouldAdjust && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-yellow-600">⚠️</span>
                    <h4 className="font-semibold text-yellow-800">节气调整建议</h4>
                  </div>
                  <p className="text-yellow-700 text-sm mb-2">
                    {analysisData.basic_info.solar_term_adjustment.recommendation}
                  </p>
                  {analysisData.basic_info.solar_term_adjustment.currentTerm && (
                    <div className="text-xs text-yellow-600">
                      当前节气：{analysisData.basic_info.solar_term_adjustment.currentTerm.name} 
                      ({new Date(analysisData.basic_info.solar_term_adjustment.currentTerm.time).toLocaleString()})
                    </div>
                  )}
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border-l-4 border-red-500">
                  <h4 className="font-bold text-red-800 mb-2">日主信息</h4>
                  <p className="text-red-700">
                    日主：{analysisData.basic_info?.bazi_chart?.day_master}（{analysisData.basic_info?.bazi_chart?.day_master_element}）
                  </p>
                  <p className="text-red-700">
                    旺衰：{analysisData.basic_info?.bazi_chart?.element_strength?.strength_level}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-bold text-red-800 mb-2">用神分析</h4>
                  <p className="text-red-700 text-sm">
                    {analysisData.basic_info?.bazi_chart?.element_strength?.use_god_analysis?.analysis}
                  </p>
                </div>
              </div>
              
              {/* 纳音五行信息 */}
              {analysisData.basic_info?.bazi_chart?.nayin_info && (
                <div className="mt-4 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200">
                  <h4 className="font-bold text-amber-800 mb-3 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2" />
                    四柱纳音五行
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="text-amber-700 font-semibold text-sm mb-1">年柱纳音</div>
                      <div className="text-amber-800 font-bold">{analysisData.basic_info.bazi_chart.nayin_info.year_nayin}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-amber-700 font-semibold text-sm mb-1">月柱纳音</div>
                      <div className="text-amber-800 font-bold">{analysisData.basic_info.bazi_chart.nayin_info.month_nayin}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-amber-700 font-semibold text-sm mb-1">日柱纳音</div>
                      <div className="text-amber-800 font-bold">{analysisData.basic_info.bazi_chart.nayin_info.day_nayin}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-amber-700 font-semibold text-sm mb-1">时柱纳音</div>
                      <div className="text-amber-800 font-bold">{analysisData.basic_info.bazi_chart.nayin_info.hour_nayin}</div>
                    </div>
                  </div>
                  <p className="text-amber-600 text-xs mt-3 text-center">
                     纳音五行是根据干支组合推算的传统五行属性，体现了深层的命理特征
                   </p>
                   
                   {/* 纳音详细解释 */}
                   <div className="mt-4 bg-white p-4 rounded-lg border border-amber-300">
                     <h5 className="font-bold text-amber-800 mb-3 text-center">纳音五行理论解释</h5>
                     <div className="space-y-3 text-xs text-amber-700">
                       <div className="bg-amber-50 p-3 rounded-lg">
                         <h6 className="font-semibold mb-1">📚 理论来源</h6>
                         <p className="leading-relaxed">
                           纳音五行起源于古代音律学说，将60甲子干支与五音十二律相配，
                           形成独特的五行分类体系。每两个干支为一组，共30组纳音。
                         </p>
                       </div>
                       
                       <div className="bg-amber-50 p-3 rounded-lg">
                         <h6 className="font-semibold mb-1">🎯 八字应用</h6>
                         <p className="leading-relaxed">
                           在八字命理中，纳音五行补充了正五行的不足，提供了另一个维度的分析角度。
                           年柱纳音代表祖业根基，月柱纳音影响青年运势，日柱纳音关乎夫妻关系，
                           时柱纳音预示子女和晚年。四柱纳音的相生相克关系，揭示了命运的深层规律。
                         </p>
                       </div>
                       
                       <div className="bg-amber-50 p-3 rounded-lg">
                         <h6 className="font-semibold mb-1">⚖️ 实用价值</h6>
                         <p className="leading-relaxed">
                           纳音五行在择偶合婚、起名改名、择日选时等方面具有重要参考价值。
                           同类纳音的人往往有相似的性格特征和人生际遇，
                           不同纳音之间的配合关系影响着人际交往和事业合作的成败。
                         </p>
                       </div>
                     </div>
                   </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 四柱详细信息 */}
        <Card className="chinese-card-decoration dragon-corner border-2 border-yellow-400">
          <CardHeader>
            <CardTitle className="text-red-800 text-2xl font-bold chinese-text-shadow text-center">
              四柱详细信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-4 gap-6 mb-6">
              {renderPillarCard(analysisData.basic_info?.bazi_chart?.year_pillar, '年柱', '祖辈与早年运势')}
              {renderPillarCard(analysisData.basic_info?.bazi_chart?.month_pillar, '月柱', '父母与青年运势')}
              {renderPillarCard(analysisData.basic_info?.bazi_chart?.day_pillar, '日柱', '自身与配偶')}
              {renderPillarCard(analysisData.basic_info?.bazi_chart?.hour_pillar, '时柱', '子女与晚年运势')}
            </div>
          </CardContent>
        </Card>

        {/* 四柱详细解释 */}
        {analysisData.basic_info?.pillar_interpretations && (
          <Card className="chinese-card-decoration dragon-corner border-2 border-yellow-400">
            <CardHeader>
              <CardTitle className="text-red-800 text-2xl font-bold chinese-text-shadow flex items-center">
                <BookOpen className="mr-2 h-6 w-6 text-yellow-600" />
                四柱专业解释
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-red-50 to-yellow-50 rounded-lg p-6">
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                    <h4 className="font-bold text-red-800 mb-2 flex items-center">
                      <span className="mr-2">🏛️</span>年柱解释
                    </h4>
                    <p className="text-red-700 leading-relaxed text-sm">
                      {analysisData.basic_info.pillar_interpretations.year_pillar}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-bold text-red-800 mb-2 flex items-center">
                      <span className="mr-2">🌟</span>月柱解释
                    </h4>
                    <p className="text-red-700 leading-relaxed text-sm">
                      {analysisData.basic_info.pillar_interpretations.month_pillar}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                    <h4 className="font-bold text-red-800 mb-2 flex items-center">
                      <span className="mr-2">💎</span>日柱解释
                    </h4>
                    <p className="text-red-700 leading-relaxed text-sm">
                      {analysisData.basic_info.pillar_interpretations.day_pillar}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
                    <h4 className="font-bold text-red-800 mb-2 flex items-center">
                      <span className="mr-2">🌅</span>时柱解释
                    </h4>
                    <p className="text-red-700 leading-relaxed text-sm">
                      {analysisData.basic_info.pillar_interpretations.hour_pillar}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 纳音五行专题解析 */}
        {analysisData.basic_info?.bazi_chart?.nayin_info && (
          <Card className="chinese-card-decoration dragon-corner border-2 border-amber-400">
            <CardHeader>
              <CardTitle className="text-amber-800 text-2xl font-bold chinese-text-shadow text-center flex items-center justify-center">
                <Sparkles className="mr-2 h-6 w-6" />
                纳音五行专题解析
                <Sparkles className="ml-2 h-6 w-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* 纳音分类表 */}
                  <div className="bg-white p-4 rounded-lg border border-amber-200">
                    <h4 className="font-bold text-amber-800 mb-3 text-center">纳音五行分类</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                        <span className="font-semibold text-yellow-800">金纳音</span>
                        <span className="text-yellow-700">海中金、剑锋金、白蜡金、砂中金、金箔金、钗钏金</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <span className="font-semibold text-green-800">木纳音</span>
                        <span className="text-green-700">大林木、杨柳木、松柏木、平地木、桑柘木、石榴木</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                        <span className="font-semibold text-blue-800">水纳音</span>
                        <span className="text-blue-700">涧下水、泉中水、长流水、天河水、大溪水、大海水</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <span className="font-semibold text-red-800">火纳音</span>
                        <span className="text-red-700">炉中火、山头火、霹雳火、山下火、覆灯火、天上火</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                        <span className="font-semibold text-orange-800">土纳音</span>
                        <span className="text-orange-700">路旁土、城头土、屋上土、壁上土、大驿土、沙中土</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 您的纳音特征 */}
                  <div className="bg-white p-4 rounded-lg border border-amber-200">
                    <h4 className="font-bold text-amber-800 mb-3 text-center">您的纳音特征分析</h4>
                    <div className="space-y-3">
                       <div className="text-center p-3 bg-amber-100 rounded-lg">
                         <div className="text-lg font-bold text-amber-800 mb-1">年柱纳音</div>
                         <div className="text-2xl font-bold text-amber-900">{analysisData.basic_info.bazi_chart.nayin_info.year_nayin}</div>
                         <div className="text-xs text-amber-700 mt-1">主导您的根基特质</div>
                       </div>
                       
                       {/* 四柱纳音对比分析 */}
                       <div className="bg-amber-50 p-3 rounded-lg">
                         <h5 className="font-semibold text-amber-800 mb-2">四柱纳音配合分析</h5>
                         <div className="grid grid-cols-2 gap-2 text-xs">
                           <div className="bg-white p-2 rounded border-l-2 border-red-400">
                             <div className="font-semibold text-red-800">年柱：{analysisData.basic_info.bazi_chart.nayin_info.year_nayin}</div>
                             <div className="text-red-700">祖业根基，早年环境</div>
                           </div>
                           <div className="bg-white p-2 rounded border-l-2 border-green-400">
                             <div className="font-semibold text-green-800">月柱：{analysisData.basic_info.bazi_chart.nayin_info.month_nayin}</div>
                             <div className="text-green-700">父母宫位，青年运势</div>
                           </div>
                           <div className="bg-white p-2 rounded border-l-2 border-blue-400">
                             <div className="font-semibold text-blue-800">日柱：{analysisData.basic_info.bazi_chart.nayin_info.day_nayin}</div>
                             <div className="text-blue-700">夫妻宫位，中年发展</div>
                           </div>
                           <div className="bg-white p-2 rounded border-l-2 border-purple-400">
                             <div className="font-semibold text-purple-800">时柱：{analysisData.basic_info.bazi_chart.nayin_info.hour_nayin}</div>
                             <div className="text-purple-700">子女宫位，晚年归宿</div>
                           </div>
                         </div>
                         <p className="text-xs text-amber-700 mt-2 leading-relaxed">
                           {(() => {
                             const yearNayin = analysisData.basic_info.bazi_chart.nayin_info.year_nayin;
                             const monthNayin = analysisData.basic_info.bazi_chart.nayin_info.month_nayin;
                             const dayNayin = analysisData.basic_info.bazi_chart.nayin_info.day_nayin;
                             const hourNayin = analysisData.basic_info.bazi_chart.nayin_info.hour_nayin;
                             
                             // 判断纳音五行的生克关系
                             const getNayinElement = (nayin) => {
                               if (nayin.includes('金')) return '金';
                               if (nayin.includes('木')) return '木';
                               if (nayin.includes('水')) return '水';
                               if (nayin.includes('火')) return '火';
                               if (nayin.includes('土')) return '土';
                               return '未知';
                             };
                             
                             const yearElement = getNayinElement(yearNayin);
                             const dayElement = getNayinElement(dayNayin);
                             
                             if (yearElement === dayElement) {
                               return `您的年柱和日柱纳音同属${yearElement}行，表明您的根基特质与核心性格高度一致，人生发展方向明确，容易在专业领域取得成就。`;
                             } else {
                               const relationship = {
                                 '金木': '金克木，需要在坚持原则与灵活变通之间找到平衡',
                                 '木土': '木克土，创新精神与稳重品格的结合',
                                 '土水': '土克水，务实态度与智慧思维的融合',
                                 '水火': '水克火，理性思考与热情行动的协调',
                                 '火金': '火克金，热情活力与冷静判断的平衡',
                                 '木金': '金克木，需要在坚持原则与灵活变通之间找到平衡',
                                 '土木': '木克土，创新精神与稳重品格的结合',
                                 '水土': '土克水，务实态度与智慧思维的融合',
                                 '火水': '水克火，理性思考与热情行动的协调',
                                 '金火': '火克金，热情活力与冷静判断的平衡'
                               };
                               const key = yearElement + dayElement;
                               const reverseKey = dayElement + yearElement;
                               return relationship[key] || relationship[reverseKey] || `您的年柱${yearElement}行与日柱${dayElement}行相配，形成了独特的性格组合，需要在不同特质间寻求和谐发展。`;
                             }
                           })()
                         }
                         </p>
                       </div>
                      
                      <div className="bg-amber-50 p-3 rounded-lg">
                         <h5 className="font-semibold text-amber-800 mb-2">您的纳音特质分析</h5>
                         <p className="text-xs text-amber-700 leading-relaxed">
                           {(() => {
                             const yearNayin = analysisData.basic_info.bazi_chart.nayin_info.year_nayin;
                             const nayinAnalysis = {
                               '海中金': '您具有海中金的特质，如深海中的珍宝，内敛而珍贵。性格沉稳内敛，不轻易显露锋芒，但内在蕴含巨大潜力。适合从事需要耐心和深度思考的工作，如研究、金融分析等。',
                               '剑锋金': '您具有剑锋金的特质，锋利而坚韧。性格刚毅果断，有很强的执行力和领导能力。适合从事需要决断力的工作，如管理、军警、外科医生等。',
                               '白蜡金': '您具有白蜡金的特质，纯净而温润。性格温和细腻，善于协调人际关系。适合从事服务性行业，如教育、咨询、艺术等。',
                               '砂中金': '您具有砂中金的特质，需要淘洗才能显现价值。性格踏实勤奋，通过不断努力获得成功。适合从事需要积累的行业，如技术、工艺等。',
                               '金箔金': '您具有金箔金的特质，薄而广泛。性格灵活多变，善于适应环境。适合从事变化性强的工作，如销售、媒体、设计等。',
                               '钗钏金': '您具有钗钏金的特质，精美而实用。性格优雅实际，注重品质和细节。适合从事精品行业，如珠宝、奢侈品、高端服务等。',
                               '大林木': '您具有大林木的特质，如参天大树般稳重。性格宽容大度，有很强的包容力和成长性。适合从事教育、管理、环保等需要长期发展的行业。',
                               '杨柳木': '您具有杨柳木的特质，柔韧而优美。性格温柔灵活，善于适应变化。适合从事创意性工作，如艺术、设计、文学等。',
                               '松柏木': '您具有松柏木的特质，坚韧不屈。性格坚强独立，有很强的意志力。适合从事需要坚持的工作，如科研、创业等。',
                               '平地木': '您具有平地木的特质，广阔而包容。性格平和宽广，善于团结他人。适合从事团队协作性强的工作，如项目管理、公共服务等。',
                               '桑柘木': '您具有桑柘木的特质，实用而有价值。性格务实勤劳，注重实际效果。适合从事实用性强的行业，如农业、制造业等。',
                               '石榴木': '您具有石榴木的特质，多子多福。性格热情开朗，善于交际。适合从事人际交往频繁的工作，如销售、公关、娱乐等。',
                               '涧下水': '您具有涧下水的特质，清澈而持续。性格纯净坚持，有很强的原则性。适合从事需要专业性的工作，如医疗、法律、技术等。',
                               '泉中水': '您具有泉中水的特质，源源不断。性格富有创造力，思维活跃。适合从事创新性工作，如科技、研发、创意等。',
                               '长流水': '您具有长流水的特质，绵延不绝。性格持久稳定，有很强的耐力。适合从事需要长期坚持的工作，如教育、慈善等。',
                               '天河水': '您具有天河水的特质，高远而广阔。性格志向远大，有很强的理想主义色彩。适合从事高层次的工作，如学术研究、政策制定等。',
                               '大溪水': '您具有大溪水的特质，奔腾而有力。性格积极进取，行动力强。适合从事动态性强的工作，如体育、旅游、物流等。',
                               '大海水': '您具有大海水的特质，深邃而包容。性格深沉大度，有很强的包容力。适合从事需要大局观的工作，如战略规划、国际贸易等。',
                               '炉中火': '您具有炉中火的特质，热烈而专注。性格热情专一，有很强的专业精神。适合从事需要专业技能的工作，如工程、医疗、艺术等。',
                               '山头火': '您具有山头火的特质，明亮而显眼。性格开朗外向，善于表现自己。适合从事表演性质的工作，如娱乐、广告、演讲等。',
                               '霹雳火': '您具有霹雳火的特质，迅猛而有力。性格急躁直接，行动迅速。适合从事需要快速反应的工作，如急救、新闻、竞技等。',
                               '山下火': '您具有山下火的特质，温暖而持久。性格温和坚持，有很强的服务精神。适合从事服务性工作，如护理、客服、社工等。',
                               '覆灯火': '您具有覆灯火的特质，温馨而照明。性格温暖体贴，善于照顾他人。适合从事关怀性工作，如教育、医护、家政等。',
                               '天上火': '您具有天上火的特质，光明而高远。性格光明磊落，有很强的正义感。适合从事公正性工作，如法律、监督、公益等。',
                               '路旁土': '您具有路旁土的特质，承载而包容。性格踏实可靠，善于支持他人。适合从事基础性工作，如基建、物流、服务等。',
                               '城头土': '您具有城头土的特质，坚固而防护。性格稳重可靠，有很强的责任感。适合从事安全防护性工作，如保安、保险、质检等。',
                               '屋上土': '您具有屋上土的特质，实用而温馨。性格实际温和，注重家庭和谐。适合从事家庭相关工作，如房地产、家装、育儿等。',
                               '壁上土': '您具有壁上土的特质，装饰而美化。性格注重外表和形象，有艺术天赋。适合从事美化性工作，如装修、美容、设计等。',
                               '大驿土': '您具有大驿土的特质，连接而沟通。性格善于沟通协调，有很强的组织能力。适合从事协调性工作，如管理、外交、中介等。',
                               '沙中土': '您具有沙中土的特质，细腻而广泛。性格细心周到，注重细节。适合从事精细化工作，如会计、编辑、工艺等。'
                             };
                             return nayinAnalysis[yearNayin] || `您的${yearNayin}纳音代表了独特的五行特质，影响着您的性格和人生发展方向。`;
                           })()
                         }
                         </p>
                       </div>
                      
                      <div className="bg-amber-50 p-3 rounded-lg">
                        <h5 className="font-semibold text-amber-800 mb-2">四柱配合</h5>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          年月日时四柱的纳音相互作用，形成了您独特的命理格局。
                          纳音的生克制化关系，揭示了人生各个阶段的运势变化规律。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 五行能量分布 */}
        <Card className="chinese-card-decoration dragon-corner border-2 border-yellow-400">
          <CardHeader>
            <CardTitle className="text-red-800 text-2xl font-bold chinese-text-shadow text-center">
              五行能量分布分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {renderElementCards()}
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-red-50 to-yellow-50 rounded-lg p-6">
                  <h4 className="font-bold text-red-800 mb-4 text-center">五行平衡雷达图</h4>
                  {renderWuxingRadar()}
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border-l-4 border-yellow-500">
                    <h4 className="font-bold text-red-800 mb-2">五行平衡分析</h4>
                    <p className="text-red-700 leading-relaxed text-sm">
                      {analysisData.wuxing_analysis?.balance_analysis}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                    <h4 className="font-bold text-red-800 mb-2">个性特质</h4>
                    <p className="text-red-700 leading-relaxed text-sm">
                      {analysisData.wuxing_analysis?.personality_traits}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-bold text-red-800 mb-2">改善建议</h4>
                    <p className="text-red-700 leading-relaxed text-sm">
                      {analysisData.wuxing_analysis?.improvement_suggestions}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 格局分析 */}
        {analysisData.geju_analysis && (
          <Card className="chinese-card-decoration dragon-corner border-2 border-yellow-400">
            <CardHeader>
              <CardTitle className="text-red-800 text-2xl font-bold chinese-text-shadow flex items-center">
                <Star className="mr-2 h-6 w-6 text-yellow-600" />
                格局分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-red-50 to-yellow-50 rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                      <h4 className="font-bold text-red-800 mb-2">格局类型</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-purple-600">
                          {analysisData.geju_analysis.pattern_type}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                          {analysisData.geju_analysis.pattern_strength}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                      <h4 className="font-bold text-red-800 mb-2">格局特征</h4>
                      <p className="text-red-700 leading-relaxed text-sm">
                        {analysisData.geju_analysis.characteristics}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                      <h4 className="font-bold text-red-800 mb-2">适合职业</h4>
                      <p className="text-red-700 leading-relaxed text-sm">
                        {analysisData.geju_analysis.career_path}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
                      <h4 className="font-bold text-red-800 mb-2">人生意义</h4>
                      <p className="text-red-700 leading-relaxed text-sm">
                        {analysisData.geju_analysis.life_meaning}
                      </p>
                    </div>
                  </div>
                </div>
                {analysisData.geju_analysis.development_strategy && (
                  <div className="mt-4 bg-white p-4 rounded-lg border-l-4 border-yellow-500">
                    <h4 className="font-bold text-red-800 mb-2">发展策略</h4>
                    <p className="text-red-700 leading-relaxed text-sm">
                      {analysisData.geju_analysis.development_strategy}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 大运流年分析 */}
        {analysisData.dayun_analysis && (
          <Card className="chinese-card-decoration dragon-corner border-2 border-yellow-400">
            <CardHeader>
              <CardTitle className="text-red-800 text-2xl font-bold chinese-text-shadow flex items-center">
                <TrendingUp className="mr-2 h-6 w-6 text-yellow-600" />
                大运流年分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-red-50 to-yellow-50 rounded-lg p-6">
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white p-4 rounded-lg border-l-4 border-red-500">
                    <h4 className="font-bold text-red-800 mb-2">起运信息</h4>
                    <p className="text-red-700">起运年龄：{analysisData.dayun_analysis.start_luck_age}岁</p>
                    <p className="text-red-700">当前年龄：{analysisData.dayun_analysis.current_age}岁</p>
                    {analysisData.dayun_analysis.current_dayun && (
                      <p className="text-red-700">
                        当前大运：{analysisData.dayun_analysis.current_dayun.ganzhi}
                        （{analysisData.dayun_analysis.current_dayun.start_age}-{analysisData.dayun_analysis.current_dayun.end_age}岁）
                      </p>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-bold text-red-800 mb-2">大运影响</h4>
                    <p className="text-red-700 leading-relaxed text-sm">
                      {analysisData.dayun_analysis.dayun_influence}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                    <h4 className="font-bold text-red-800 mb-2">流年分析</h4>
                    <p className="text-red-700 leading-relaxed text-sm">
                      {analysisData.dayun_analysis.yearly_fortune}
                    </p>
                  </div>
                </div>
                
                {/* 大运序列 */}
                {analysisData.dayun_analysis.dayun_sequence && (
                  <div className="mb-6">
                    <h4 className="font-bold text-red-800 mb-4 text-center">八步大运序列</h4>
                    <div className="grid md:grid-cols-4 gap-3">
                      {analysisData.dayun_analysis.dayun_sequence.map((dayun: any, index: number) => (
                        <div key={index} className={`p-3 rounded-lg border-2 ${
                          analysisData.dayun_analysis.current_dayun && 
                          dayun.ganzhi === analysisData.dayun_analysis.current_dayun.ganzhi 
                            ? 'bg-yellow-100 border-yellow-400' 
                            : 'bg-white border-gray-300'
                        }`}>
                          <div className="text-center">
                            <div className="font-bold text-red-800">{dayun.ganzhi}</div>
                            <div className="text-sm text-red-600">{dayun.start_age}-{dayun.end_age}岁</div>
                            <div className={`text-xs px-2 py-1 rounded mt-1 ${tenGodColors[dayun.ten_god] || 'bg-gray-100 text-gray-800'}`}>
                              {dayun.ten_god}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
                  <h4 className="font-bold text-red-800 mb-2">未来展望</h4>
                  <p className="text-red-700 leading-relaxed text-sm">
                    {analysisData.dayun_analysis.future_outlook}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 详细流年分析 */}
        {analysisData.dayun_analysis?.detailed_yearly_analysis && (
          <Card className="chinese-card-decoration dragon-corner border-2 border-yellow-400">
            <CardHeader>
              <CardTitle className="text-red-800 text-2xl font-bold chinese-text-shadow flex items-center">
                <Calendar className="mr-2 h-6 w-6 text-yellow-600" />
                详细流年分析（未来六年）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-red-50 to-yellow-50 rounded-lg p-6">
                <div className="space-y-6">
                  {analysisData.dayun_analysis.detailed_yearly_analysis.map((yearData: any, index: number) => (
                    <div key={index} className="bg-white p-6 rounded-lg border-2 border-yellow-300 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-red-800 text-xl">
                          {yearData.year}年（{yearData.age}岁）{yearData.year_ganzhi}
                        </h4>
                        <div className="flex space-x-2">
                          <span className={`text-sm px-3 py-1 rounded-full ${tenGodColors[yearData.year_ten_god] || 'bg-gray-100 text-gray-800'}`}>
                            {yearData.year_ten_god}
                          </span>
                          <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-300">
                            {yearData.dayun_period}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-3">
                          <div className="border-l-4 border-blue-400 pl-3">
                            <h5 className="font-semibold text-red-800 text-sm flex items-center">
                              <Target className="h-4 w-4 mr-1" />整体运势
                            </h5>
                            <p className="text-red-700 text-xs leading-relaxed">{yearData.overall_fortune}</p>
                          </div>
                          <div className="border-l-4 border-green-400 pl-3">
                            <h5 className="font-semibold text-red-800 text-sm flex items-center">
                              <BarChart3 className="h-4 w-4 mr-1" />事业运势
                            </h5>
                            <p className="text-red-700 text-xs leading-relaxed">{yearData.career_fortune}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="border-l-4 border-yellow-400 pl-3">
                            <h5 className="font-semibold text-red-800 text-sm flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />财运分析
                            </h5>
                            <p className="text-red-700 text-xs leading-relaxed">{yearData.wealth_fortune}</p>
                          </div>
                          <div className="border-l-4 border-pink-400 pl-3">
                            <h5 className="font-semibold text-red-800 text-sm flex items-center">
                              <Heart className="h-4 w-4 mr-1" />感情运势
                            </h5>
                            <p className="text-red-700 text-xs leading-relaxed">{yearData.relationship_fortune}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="border-l-4 border-purple-400 pl-3">
                            <h5 className="font-semibold text-red-800 text-sm flex items-center">
                              <Activity className="h-4 w-4 mr-1" />健康提醒
                            </h5>
                            <p className="text-red-700 text-xs leading-relaxed">{yearData.health_fortune}</p>
                          </div>
                          <div className="border-l-4 border-orange-400 pl-3">
                            <h5 className="font-semibold text-red-800 text-sm flex items-center">
                              <Sparkles className="h-4 w-4 mr-1" />关键建议
                            </h5>
                            <p className="text-red-700 text-xs leading-relaxed">{yearData.key_advice}</p>
                          </div>
                        </div>
                      </div>
                      
                      {yearData.monthly_highlights && yearData.monthly_highlights.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-yellow-200">
                          <h5 className="font-semibold text-red-800 text-sm mb-2 flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />月度重点
                          </h5>
                          <div className="grid md:grid-cols-2 gap-2">
                            {yearData.monthly_highlights.map((highlight: string, hIndex: number) => (
                              <p key={hIndex} className="text-red-700 text-xs bg-yellow-50 p-2 rounded">• {highlight}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 专业人生指导 */}
        {analysisData.life_guidance && (
          <Card className="chinese-card-decoration dragon-corner border-2 border-yellow-400">
            <CardHeader>
              <CardTitle className="text-red-800 text-2xl font-bold chinese-text-shadow flex items-center">
                <BookOpen className="mr-2 h-6 w-6 text-yellow-600" />
                专业人生指导
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-red-50 to-yellow-50 rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                      <h4 className="font-bold text-red-800 mb-2">事业发展</h4>
                      <p className="text-red-700 leading-relaxed text-sm">
                        {analysisData.life_guidance.career_development}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                      <h4 className="font-bold text-red-800 mb-2">财富管理</h4>
                      <p className="text-red-700 leading-relaxed text-sm">
                        {analysisData.life_guidance.wealth_management}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-l-4 border-pink-500">
                      <h4 className="font-bold text-red-800 mb-2">感情婚姻</h4>
                      <p className="text-red-700 leading-relaxed text-sm">
                        {analysisData.life_guidance.marriage_relationships}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                      <h4 className="font-bold text-red-800 mb-2">健康养生</h4>
                      <p className="text-red-700 leading-relaxed text-sm">
                        {analysisData.life_guidance.health_wellness}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-l-4 border-yellow-500">
                      <h4 className="font-bold text-red-800 mb-2">个人发展</h4>
                      <p className="text-red-700 leading-relaxed text-sm">
                        {analysisData.life_guidance.personal_development}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-500">
                      <h4 className="font-bold text-red-800 mb-2">综合总结</h4>
                      <p className="text-red-700 leading-relaxed text-sm">
                        {analysisData.life_guidance.overall_summary}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 现代应用建议 */}
        {analysisData.modern_applications && (
          <Card className="chinese-card-decoration dragon-corner border-2 border-yellow-400">
            <CardHeader>
              <CardTitle className="text-red-800 text-2xl font-bold chinese-text-shadow flex items-center">
                <Zap className="mr-2 h-6 w-6 text-yellow-600" />
                现代应用建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-red-50 to-yellow-50 rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                      <h4 className="font-bold text-red-800 mb-2">生活方式建议</h4>
                      <p className="text-red-700 leading-relaxed text-sm">
                        {analysisData.modern_applications.lifestyle_recommendations}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                      <h4 className="font-bold text-red-800 mb-2">职业策略</h4>
                      <p className="text-red-700 leading-relaxed text-sm">
                        {analysisData.modern_applications.career_strategies}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                      <h4 className="font-bold text-red-800 mb-2">人际关系建议</h4>
                      <p className="text-red-700 leading-relaxed text-sm">
                        {analysisData.modern_applications.relationship_advice}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
                      <h4 className="font-bold text-red-800 mb-2">决策时机</h4>
                      <p className="text-red-700 leading-relaxed text-sm">
                        {analysisData.modern_applications.decision_making}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 分析报告尾部 */}
        <Card className="chinese-card-decoration dragon-corner border-2 border-yellow-400">
          <CardContent className="text-center py-8">
            <div className="text-red-800">
              <p className="text-lg font-bold mb-2">专业八字命理分析报告</p>
              <p className="text-sm">分析日期：{analysisData.analysis_date ? new Date(analysisData.analysis_date).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN')}</p>
              <p className="text-xs mt-4 text-red-600">
                本报告基于传统四柱八字理论，结合现代命理学研究成果，为您提供专业的命理分析和人生指导。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 回到顶部按钮 */}
      <BackToTop />
      
      {/* AI配置模态框 */}
      <AIConfigModal
        isOpen={showAIConfig}
        onClose={() => setShowAIConfig(false)}
        onConfigSaved={() => {
          setShowAIConfig(false);
          // 可以在这里添加配置保存后的逻辑
        }}
      />
    </div>
  );
};

export default CompleteBaziAnalysis;