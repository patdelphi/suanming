/**
 * 紫微斗数完整分析主组件
 * 负责状态管理、数据获取和子组件组合
 * 已拆分为多个独立子组件：
 * - SihuaExplanation: 四化飞星解释
 * - MajorPeriodPalace: 大限宫位解释
 * - NayinAnalysis: 纳音五行分析
 * - StarChart: 星曜图表
 * - PalaceGrid: 十二宫位网格展示
 */
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, BookOpen, Crown, Moon, Compass, Sparkles, DollarSign, Heart, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { ChineseCard, ChineseCardContent, ChineseCardHeader, ChineseCardTitle } from './ui/ChineseCard';
import { ChineseLoading } from './ui/ChineseLoading';
import { BackToTop } from './ui/BackToTop';
import DownloadButton from './ui/DownloadButton';
import AIInterpretationButton from './ui/AIInterpretationButton';
import AIConfigModal from './ui/AIConfigModal';
import { localApi } from '../lib/localApi';
import type { Gender } from '../types';
import { wuxingJuColors } from './ziwei/shared';

// 导入拆分的子组件
import SihuaExplanation from './ziwei/SihuaExplanation';
import MajorPeriodPalace from './ziwei/MajorPeriodPalace';
import NayinAnalysis from './ziwei/NayinAnalysis';
import StarChart from './ziwei/StarChart';
import PalaceGrid from './ziwei/PalaceGrid';

interface CompleteZiweiAnalysisProps {
  birthDate: {
    date: string;
    time: string;
    name?: string;
    gender?: string;
  };
  analysisData?: any; // 可选的预先分析的数据
  recordId?: number; // 历史记录ID，用于AI解读
}

const CompleteZiweiAnalysis: React.FC<CompleteZiweiAnalysisProps> = ({ birthDate, analysisData: propAnalysisData, recordId }) => {
  const [isLoading, setIsLoading] = useState(!propAnalysisData);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(propAnalysisData || null);
  const [showAIConfig, setShowAIConfig] = useState(false);

  // 数据获取逻辑
  useEffect(() => {
    // 如果已经有分析数据，直接使用
    if (propAnalysisData) {
      setAnalysisData(propAnalysisData);
      setIsLoading(false);
      return;
    }

    const fetchAnalysisData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const birthData = {
          name: birthDate.name || '用户',
          birth_date: birthDate.date,
          birth_time: birthDate.time,
          gender: (birthDate.gender || 'male') as Gender
        };

        const ziweiResponse = await localApi.analysis.ziwei(birthData);

        if (ziweiResponse.error) {
          throw new Error(ziweiResponse.error.message || '紫微斗数分析失败');
        }

        const analysisResult = ziweiResponse.data?.analysis;
        if (!analysisResult) {
          throw new Error('分析结果为空');
        }

        setAnalysisData(analysisResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : '分析数据获取失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };

    if (birthDate?.date && !propAnalysisData) {
      fetchAnalysisData();
    }
  }, [birthDate?.date, birthDate?.time, birthDate?.name, birthDate?.gender, propAnalysisData]);

  // 渲染加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-yellow-50">
        <ChineseCard variant="elevated" className="p-8">
          <ChineseCardContent className="text-center">
            <ChineseLoading
              size="lg"
              variant="chinese"
              text="正在进行专业紫微斗数分析"
              className="mb-4"
            />
            <h3 className="text-xl font-bold text-red-600 mb-2 font-chinese">排盘分析中</h3>
            <p className="text-gray-600 font-chinese">请稍候，正在生成您的详细命理报告...</p>
          </ChineseCardContent>
        </ChineseCard>
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50">
        <Card className="chinese-card-decoration border-2 border-purple-400 p-8">
          <CardContent className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-purple-800 mb-2">数据获取异常</h3>
            <p className="text-purple-600">未能获取到完整的分析数据，请重新提交分析</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 渲染格局卡片
  const renderPatternCard = (pattern: any) => {
    const levelColors = {
      'excellent': 'bg-green-100 text-green-800 border-green-300',
      'good': 'bg-blue-100 text-blue-800 border-blue-300',
      'fair': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'weak': 'bg-gray-100 text-gray-800 border-gray-300'
    };

    return (
      <Card key={pattern.name} className="chinese-card-decoration hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-purple-800 text-lg font-bold">{pattern.name}</CardTitle>
            <span className={`px-2 py-1 rounded text-xs font-medium border ${levelColors[pattern.level] || levelColors.fair}`}>
              {pattern.level === 'excellent' ? '优秀' : pattern.level === 'good' ? '良好' : pattern.level === 'fair' ? '一般' : '较弱'}
            </span>
          </div>
          <p className="text-purple-600 text-sm">{pattern.type === 'major' ? '主要格局' : pattern.type === 'wealth' ? '财富格局' : pattern.type === 'career' ? '事业格局' : pattern.type === 'relationship' ? '感情格局' : '四化格局'}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-gray-700">{pattern.description}</p>
          <div className="border-t pt-2">
            <h5 className="text-xs font-semibold text-purple-800 mb-1">影响</h5>
            <p className="text-xs text-gray-600">{pattern.influence}</p>
          </div>
          <div className="border-t pt-2">
            <h5 className="text-xs font-semibold text-purple-800 mb-1">建议</h5>
            <p className="text-xs text-gray-600">{pattern.advice}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-8" id="ziwei-analysis-content" data-export-content>
        
        {/* 下载按钮和AI解读按钮 */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 no-export" data-no-export>
          <div className="flex-1">
            <AIInterpretationButton
              analysisData={analysisData}
              analysisType="ziwei"
              recordId={recordId}
              onConfigClick={() => setShowAIConfig(true)}
            />
          </div>
          <div className="flex-shrink-0">
            <DownloadButton
              analysisData={analysisData}
              analysisType="ziwei"
              userName={birthDate.name}
              targetElementId="ziwei-analysis-content"
              className="sticky top-4 z-10"
            />
          </div>
        </div>
        
        {/* 标题和基本信息 */}
        <Card className="chinese-card-decoration dragon-corner border-2 border-purple-400">
          <CardHeader className="text-center">
            <CardTitle className="text-purple-800 text-3xl font-bold chinese-text-shadow flex items-center justify-center space-x-2">
              <Crown className="h-8 w-8" />
              <span>{analysisData.basic_info?.personal_data?.name || '用户'}的专业紫微斗数命理分析报告</span>
              <Crown className="h-8 w-8" />
            </CardTitle>
            <div className="flex justify-center space-x-6 mt-4 text-purple-700">
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
            <div className="text-center space-y-4">
              {/* 八字信息 */}
              <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                <h4 className="font-bold text-purple-800 mb-2">八字信息</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-purple-700">年柱：{analysisData.basic_info?.bazi_info?.year}</p>
                    <p className="text-purple-700">月柱：{analysisData.basic_info?.bazi_info?.month}</p>
                  </div>
                  <div>
                    <p className="text-purple-700">日柱：{analysisData.basic_info?.bazi_info?.day}</p>
                    <p className="text-purple-700">时柱：{analysisData.basic_info?.bazi_info?.hour}</p>
                  </div>
                </div>
              </div>
              
              {/* 农历信息显示 */}
              {analysisData.basic_info?.lunar_info && (
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-lg border border-pink-200">
                  <h4 className="font-bold text-pink-800 mb-3 flex items-center">
                    <Moon className="h-5 w-5 mr-2" />
                    农历信息
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="text-center">
                      <div className="text-pink-700 font-semibold mb-1">农历日期</div>
                      <div className="text-pink-800 font-bold">{analysisData.basic_info.lunar_info.lunar_date}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-pink-700 font-semibold mb-1">干支年</div>
                      <div className="text-pink-800 font-bold">{analysisData.basic_info.lunar_info.ganzhi_year}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-pink-700 font-semibold mb-1">生肖</div>
                      <div className="text-pink-800 font-bold">{analysisData.basic_info.lunar_info.zodiac}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-pink-700 font-semibold mb-1">节气</div>
                      <div className="text-pink-800 font-bold">{analysisData.basic_info.lunar_info.solar_term}</div>
                    </div>
                  </div>
                  {analysisData.basic_info.lunar_info.note && (
                    <p className="text-pink-600 text-xs mt-3 text-center">
                      {analysisData.basic_info.lunar_info.note}
                    </p>
                  )}
                </div>
              )}
              
              {/* 子时计算说明 */}
              {analysisData.basic_info?.zishi_calculation_note && (
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-lg border border-cyan-200">
                  <h4 className="font-bold text-cyan-800 mb-3 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    子时计算说明
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg border border-cyan-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-cyan-700 font-semibold">子时类型</span>
                        <span className="text-cyan-800 font-bold px-2 py-1 bg-cyan-100 rounded">
                          {analysisData.basic_info.zishi_calculation_note.zishi_type}
                        </span>
                      </div>
                      <div className="text-cyan-700 text-sm mb-2">
                        <strong>计算方法：</strong>{analysisData.basic_info.zishi_calculation_note.calculation_method}
                      </div>
                      <div className="text-cyan-600 text-sm mb-2">
                        {analysisData.basic_info.zishi_calculation_note.explanation}
                      </div>
                      {analysisData.basic_info.zishi_calculation_note.ziwei_impact && (
                        <div className="text-cyan-600 text-sm">
                          <strong>紫微影响：</strong>{analysisData.basic_info.zishi_calculation_note.ziwei_impact}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* 五行局和命宫 */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-500">
                  <h4 className="font-bold text-indigo-800 mb-3">五行局详解</h4>
                  
                  {/* 五行局类型 */}
                  <div className={`inline-block px-3 py-2 rounded-lg font-bold mb-3 ${wuxingJuColors[analysisData.basic_info?.wuxing_ju?.type] || 'text-gray-700 bg-gray-100'}`}>
                    {analysisData.basic_info?.wuxing_ju?.type}
                  </div>
                  
                  {/* 详细描述 */}
                  <p className="text-indigo-700 text-sm">{analysisData.basic_info?.wuxing_ju?.description}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-bold text-blue-800 mb-2">命宫位置</h4>
                  <div className="text-2xl font-bold text-blue-800 mb-2">
                    {analysisData.basic_info?.ming_gong_position?.branch}
                  </div>
                  <p className="text-blue-700 text-sm mb-3">{analysisData.basic_info?.ming_gong_position?.description}</p>
                  {/* 详细的命宫位置解释 */}
                  {analysisData.detailed_analysis?.personality_analysis?.overview && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="font-semibold text-blue-800 mb-2 flex items-center">
                        <Compass className="h-4 w-4 mr-1" />
                        命宫位置详解
                      </h5>
                      <div className="text-blue-700 text-sm whitespace-pre-line">
                        {/* 提取命宫位置相关的详细解释 */}
                        {(() => {
                          const overview = analysisData.detailed_analysis.personality_analysis.overview;
                          // 查找包含五行属性和宫位解释的部分
                          const positionMatch = overview.match(/([子丑寅卯辰巳午未申酉戌亥])宫属[金木水火土].*?。/g);
                          if (positionMatch) {
                            return positionMatch.join(' ');
                          }
                          // 如果没有找到特定格式，显示包含宫位信息的句子
                          const sentences = overview.split('。');
                          const relevantSentences = sentences.filter(sentence => 
                            sentence.includes('宫') && (sentence.includes('属') || sentence.includes('代表') || sentence.includes('使您'))
                          );
                          return relevantSentences.length > 0 ? relevantSentences.join('。') + '。' : '命宫位置影响着您的基本性格特质和人生发展方向。';
                        })()
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 纳音五行与五行局专题解析 - 使用拆分后的组件 */}
        {analysisData.basic_info?.wuxing_ju?.nayin && (
          <NayinAnalysis wuxingJu={analysisData.basic_info.wuxing_ju} />
        )}

        {/* 命宫主星信息 - 使用拆分后的组件 */}
        {analysisData.ziwei_analysis?.ming_gong_stars && analysisData.ziwei_analysis.ming_gong_stars.length > 0 && (
          <StarChart 
            mingGongStars={analysisData.ziwei_analysis.ming_gong_stars}
            mingGong={analysisData.ziwei_analysis?.ming_gong}
          />
        )}

        {/* 十二宫位详解 - 使用拆分后的组件 */}
        {analysisData.ziwei_analysis?.twelve_palaces && (
          <PalaceGrid twelvePalaces={analysisData.ziwei_analysis.twelve_palaces} />
        )}

        {/* 四化飞星 - 使用拆分后的组件 */}
        {analysisData.ziwei_analysis?.si_hua && (
          <SihuaExplanation siHua={analysisData.ziwei_analysis.si_hua} />
        )}

        {/* 大限分析 - 使用拆分后的组件 */}
        {analysisData.ziwei_analysis?.major_periods && (
          <MajorPeriodPalace majorPeriods={analysisData.ziwei_analysis.major_periods} />
        )}

        {/* 格局判定 */}
        {analysisData.detailed_analysis?.life_guidance?.pattern_analysis && (
          <Card className="chinese-card-decoration border-2 border-purple-400">
            <CardHeader>
              <CardTitle className="text-purple-800 text-2xl font-bold chinese-text-shadow flex items-center space-x-2">
                <BookOpen className="h-6 w-6" />
                <span>格局判定</span>
              </CardTitle>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-purple-600">检测到{analysisData.detailed_analysis.life_guidance.pattern_analysis.pattern_count}个格局</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  analysisData.detailed_analysis.life_guidance.pattern_analysis.pattern_strength === 'very_strong' ? 'bg-green-100 text-green-800' :
                  analysisData.detailed_analysis.life_guidance.pattern_analysis.pattern_strength === 'strong' ? 'bg-blue-100 text-blue-800' :
                  analysisData.detailed_analysis.life_guidance.pattern_analysis.pattern_strength === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {analysisData.detailed_analysis.life_guidance.pattern_analysis.pattern_strength === 'very_strong' ? '极强' :
                   analysisData.detailed_analysis.life_guidance.pattern_analysis.pattern_strength === 'strong' ? '强' :
                   analysisData.detailed_analysis.life_guidance.pattern_analysis.pattern_strength === 'moderate' ? '中等' :
                   analysisData.detailed_analysis.life_guidance.pattern_analysis.pattern_strength === 'fair' ? '一般' : '较弱'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {/* 格局指导 */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-4">
                <h4 className="font-bold text-purple-800 mb-2">格局总评</h4>
                <p className="text-purple-700">{analysisData.detailed_analysis.life_guidance.pattern_analysis.pattern_guidance}</p>
              </div>
              
              {/* 具体格局 */}
              {analysisData.detailed_analysis.life_guidance.pattern_analysis.detected_patterns && (
                <div className="grid lg:grid-cols-2 gap-4">
                  {analysisData.detailed_analysis.life_guidance.pattern_analysis.detected_patterns.map((pattern: any) => 
                    renderPatternCard(pattern)
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 流年分析 */}
        {analysisData.detailed_analysis?.timing_analysis?.liu_nian_analysis && (
          <Card className="chinese-card-decoration border-2 border-purple-400">
            <CardHeader>
              <CardTitle className="text-purple-800 text-2xl font-bold chinese-text-shadow flex items-center space-x-2">
                <Clock className="h-6 w-6" />
                <span>流年分析</span>
              </CardTitle>
              <p className="text-purple-600 mt-2">{analysisData.detailed_analysis.timing_analysis.liu_nian_analysis.year_ganzhi}年运势分析</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 流年四化 */}
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-bold text-purple-800 mb-3">流年四化</h4>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                      <div className="text-green-800 font-medium">{analysisData.detailed_analysis.timing_analysis.liu_nian_analysis.liu_nian_sihua.hua_lu.star}</div>
                      <div className="text-xs text-green-600">化禄</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="text-blue-800 font-medium">{analysisData.detailed_analysis.timing_analysis.liu_nian_analysis.liu_nian_sihua.hua_quan.star}</div>
                      <div className="text-xs text-blue-600">化权</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded border border-yellow-200">
                      <div className="text-yellow-800 font-medium">{analysisData.detailed_analysis.timing_analysis.liu_nian_analysis.liu_nian_sihua.hua_ke.star}</div>
                      <div className="text-xs text-yellow-600">化科</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded border border-red-200">
                      <div className="text-red-800 font-medium">{analysisData.detailed_analysis.timing_analysis.liu_nian_analysis.liu_nian_sihua.hua_ji.star}</div>
                      <div className="text-xs text-red-600">化忌</div>
                    </div>
                  </div>
                </div>
                
                {/* 年度重点 */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-bold text-green-800 mb-2">年度机会</h4>
                    <ul className="text-green-700 text-sm space-y-1">
                      {analysisData.detailed_analysis.timing_analysis.liu_nian_analysis.year_opportunities?.map((opportunity: string, index: number) => (
                        <li key={index}>• {opportunity}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h4 className="font-bold text-orange-800 mb-2">注意事项</h4>
                    <ul className="text-orange-700 text-sm space-y-1">
                      {analysisData.detailed_analysis.timing_analysis.liu_nian_analysis.year_challenges?.map((challenge: string, index: number) => (
                        <li key={index}>• {challenge}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* 重点领域 */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-bold text-purple-800 mb-2">年度重点领域</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisData.detailed_analysis.timing_analysis.liu_nian_analysis.year_focus_areas?.map((area: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 专业分析模块 */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 个性分析 */}
          {analysisData.detailed_analysis?.personality_analysis && (
            <Card className="chinese-card-decoration border-2 border-purple-400">
              <CardHeader>
                <CardTitle className="text-purple-800 text-xl font-bold chinese-text-shadow flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>个性分析</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-purple-800 mb-2">性格概述</h4>
                  <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.personality_analysis.overview}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-800 mb-2">核心特质</h4>
                  <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.personality_analysis.core_traits}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-green-800 mb-2">优势特长</h4>
                  <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.personality_analysis.strengths}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-800 mb-2">需要注意</h4>
                  <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.personality_analysis.challenges}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 事业分析 */}
          {analysisData.detailed_analysis?.career_analysis && (
            <Card className="chinese-card-decoration border-2 border-purple-400">
              <CardHeader>
                <CardTitle className="text-purple-800 text-xl font-bold chinese-text-shadow flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>事业分析</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-purple-800 mb-2">事业潜力</h4>
                  <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.career_analysis.career_potential}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-800 mb-2">适合行业</h4>
                  <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.career_analysis.suitable_industries}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-800 mb-2">领导风格</h4>
                  <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.career_analysis.leadership_style}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">成功策略</h4>
                  <div className="text-gray-700 text-sm whitespace-pre-line">{analysisData.detailed_analysis.career_analysis.success_strategies}</div>
                </div>
                <div>
                  <h4 className="font-semibold text-green-800 mb-2">现代事业建议</h4>
                  <div className="text-gray-700 text-sm whitespace-pre-line">{analysisData.detailed_analysis.career_analysis.modern_career_advice}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 财富分析 */}
          {analysisData.detailed_analysis?.wealth_analysis && (
            <Card className="chinese-card-decoration border-2 border-purple-400">
              <CardHeader>
                <CardTitle className="text-purple-800 text-xl font-bold chinese-text-shadow flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>财富分析</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-purple-800 mb-2">财运潜力</h4>
                  <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.wealth_analysis.wealth_potential}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-800 mb-2">赚钱方式</h4>
                  <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.wealth_analysis.earning_style}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-800 mb-2">投资倾向</h4>
                  <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.wealth_analysis.investment_tendency}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-green-800 mb-2">理财规划建议</h4>
                  <div className="text-gray-700 text-sm whitespace-pre-line">{analysisData.detailed_analysis.wealth_analysis.financial_planning}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 感情分析 */}
          {analysisData.detailed_analysis?.relationship_analysis && (
            <Card className="chinese-card-decoration border-2 border-purple-400">
              <CardHeader>
                <CardTitle className="text-purple-800 text-xl font-bold chinese-text-shadow flex items-center space-x-2">
                  <Heart className="h-5 w-5" />
                  <span>感情分析</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-purple-800 mb-2">婚姻运势</h4>
                  <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.relationship_analysis.marriage_fortune}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-800 mb-2">配偶特质</h4>
                  <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.relationship_analysis.spouse_characteristics}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-800 mb-2">感情模式</h4>
                  <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.relationship_analysis.relationship_pattern}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-pink-800 mb-2">感情建议</h4>
                  <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.relationship_analysis.relationship_advice}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 人生指导 */}
        {analysisData.detailed_analysis?.life_guidance && (
          <Card className="chinese-card-decoration border-2 border-purple-400">
            <CardHeader>
              <CardTitle className="text-purple-800 text-2xl font-bold chinese-text-shadow flex items-center space-x-2">
                <Sparkles className="h-6 w-6" />
                <span>人生指导</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-2">人生目标</h4>
                    <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.life_guidance.life_purpose}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-2">核心价值观</h4>
                    <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.life_guidance.core_values}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-2">发展方向</h4>
                    <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.life_guidance.development_direction}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-2">精神成长</h4>
                    <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.life_guidance.spiritual_growth}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-2">人生课题</h4>
                    <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.life_guidance.life_lessons}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-indigo-800 mb-2">总体指导</h4>
                    <p className="text-gray-700 text-sm">{analysisData.detailed_analysis.life_guidance.overall_guidance}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 分析说明 */}
        <Card className="chinese-card-decoration border-2 border-gray-300">
          <CardContent className="text-center py-6">
            <p className="text-gray-600 text-sm">
              本分析报告基于传统紫微斗数理论，结合现代分析方法生成。
              紫微斗数是中华传统命理学的重要组成部分，仅供参考，不可过分依赖。
              人生的幸福需要通过自己的努力和智慧来创造。
            </p>
            <div className="mt-4 text-xs text-gray-500">
              分析时间：{analysisData.analysis_date ? new Date(analysisData.analysis_date).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN')}
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

export default CompleteZiweiAnalysis;
