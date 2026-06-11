import React from 'react';
import CompleteBaziAnalysis from './CompleteBaziAnalysis';
import CompleteZiweiAnalysis from './CompleteZiweiAnalysis';
import CompleteYijingAnalysis from './CompleteYijingAnalysis';
import CompleteQimenAnalysis from './CompleteQimenAnalysis';

interface AnalysisResultDisplayProps {
  analysisResult?: any;
  analysisType: 'bazi' | 'ziwei' | 'yijing' | 'qimen';
  birthDate?: {
    date: string;
    time: string;
    name?: string;
    gender?: string;
  };
  question?: string;
  userId?: string;
  divinationMethod?: string;
  preAnalysisData?: any; // 预先分析的数据，用于历史记录
  recordId?: number; // 历史记录ID，用于AI解读
}

const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({ 
  analysisResult, 
  analysisType, 
  birthDate, 
  question, 
  userId, 
  divinationMethod,
  preAnalysisData,
  recordId 
}) => {
  // 安全地获取数据的辅助函数
  const safeGet = (obj: any, path: string, defaultValue: any = '暂无数据') => {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    return current || defaultValue;
  };

  // 安全渲染函数，确保返回的是字符串
  const safeRender = (value: any, defaultValue: string = '') => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object' && value !== null) {
      // 特殊处理包含stars键的对象
      if (value.stars && Array.isArray(value.stars)) {
        return value.stars.join(', ');
      }
      // 其他对象转为JSON字符串
      return JSON.stringify(value);
    }
    return defaultValue;
  };

  // 渲染八字命理分析
  const renderBaziAnalysis = () => {
    // 如果有 birthDate，使用新的 CompleteBaziAnalysis 组件
    if (birthDate) {
      return <CompleteBaziAnalysis birthDate={birthDate} analysisData={preAnalysisData} recordId={recordId} />;
    }
    // 如果有分析结果但没有 birthDate，尝试从结果中提取出生信息
    if (analysisResult && analysisResult.data) {
      const basicInfo = analysisResult.data.basic_info;
      if (basicInfo && basicInfo.personal_data) {
        const extractedBirthDate = {
          date: basicInfo.personal_data.birth_date || '',
          time: basicInfo.personal_data.birth_time || '12:00',
          name: basicInfo.personal_data.name || '',
          gender: basicInfo.personal_data.gender === '男性' ? 'male' : 'female'
        };
        return <CompleteBaziAnalysis birthDate={extractedBirthDate} analysisData={preAnalysisData} recordId={recordId} />;
      }
    }
    // 如果没有足够的数据，返回错误提示
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <p className="text-gray-500 text-center">八字分析数据不完整，请重新提交分析</p>
      </div>
    );
  };

  // 渲染紫微斗数分析
  const renderZiweiAnalysis = () => {
    // 如果有 birthDate，使用新的 CompleteZiweiAnalysis 组件
    if (birthDate) {
      return <CompleteZiweiAnalysis birthDate={birthDate} analysisData={preAnalysisData} recordId={recordId} />;
    }
    // 如果有分析结果但没有 birthDate，尝试从结果中提取出生信息
    if (analysisResult && analysisResult.data) {
      const basicInfo = analysisResult.data.basic_info;
      if (basicInfo && basicInfo.personal_data) {
        const extractedBirthDate = {
          date: basicInfo.personal_data.birth_date || '',
          time: basicInfo.personal_data.birth_time || '12:00',
          name: basicInfo.personal_data.name || '',
          gender: basicInfo.personal_data.gender === '男性' ? 'male' : 'female'
        };
        return <CompleteZiweiAnalysis birthDate={extractedBirthDate} analysisData={preAnalysisData} recordId={recordId} />;
      }
    }
    
    // 回退到旧的渲染方式（向后兼容）
    const data = analysisResult?.data || analysisResult;
    const ziweiData = data?.ziwei_analysis || data?.ziwei || data;
    const analysisData = data?.detailed_analysis || data?.analysis || data;
    
    return (
      <div className="space-y-8">
        {/* 命宫信息 */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-purple-700">命宫信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p><span className="font-medium">命宫位置：</span>{safeRender(safeGet(ziweiData, 'ming_gong'), '未知')}</p>
              <p><span className="font-medium">命宫主星：</span>{safeRender(safeGet(ziweiData, 'ming_gong_xing'))}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p><span className="font-medium">整体运势：</span>{safeRender(safeGet(ziweiData, 'shi_er_gong.命宫.interpretation'))}</p>
              <p><span className="font-medium">星曜力度：</span>{safeRender(safeGet(ziweiData, 'shi_er_gong.命宫.strength'))}</p>
            </div>
          </div>
        </div>

        {/* 12宫位分析 */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-blue-700">12宫位分析</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: '命宫', name: '命宫' },
              { key: '兄弟宫', name: '兄弟宫' },
              { key: '夫妻宫', name: '夫妻宫' },
              { key: '子女宫', name: '子女宫' },
              { key: '财帛宫', name: '财帛宫' },
              { key: '疾厄宫', name: '疾厄宫' },
              { key: '迁移宫', name: '迁移宫' },
              { key: '交友宫', name: '交友宫' },
              { key: '事业宫', name: '事业宫' },
              { key: '田宅宫', name: '田宅宫' },
              { key: '福德宫', name: '福德宫' },
              { key: '父母宫', name: '父母宫' }
            ].map((gong) => {
              const gongData = safeGet(ziweiData, `shi_er_gong.${gong.key}`, {});
              return (
                <div key={gong.key} className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">{gong.name}</h4>
                  <p className="text-sm text-gray-600 mb-1">
                    主星：{safeRender(gongData.main_stars)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {safeRender(gongData.interpretation)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 四化飞星系统 */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-green-700">四化飞星系统</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'hua_lu', name: '化禄', color: 'bg-green-50' },
              { key: 'hua_quan', name: '化权', color: 'bg-red-50' },
              { key: 'hua_ke', name: '化科', color: 'bg-yellow-50' },
              { key: 'hua_ji', name: '化忌', color: 'bg-gray-50' }
            ].map((sihua) => {
              const sihuaData = safeGet(ziweiData, `si_hua.${sihua.key}`, {});
              return (
                <div key={sihua.key} className={`${sihua.color} p-4 rounded-lg`}>
                  <h4 className="font-medium mb-2">{sihua.name}</h4>
                  <p className="text-sm text-gray-600">
                    星曜：{safeRender(sihuaData.star)}
                  </p>
                  <p className="text-sm text-gray-600">
                    含义：{safeRender(sihuaData.meaning)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 性格分析 */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-indigo-700">性格分析</h3>
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">性格概述</h4>
              <p className="text-gray-700">{safeRender(safeGet(analysisData, 'character.overview'))}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">性格特质</h4>
              <p className="text-gray-700">{safeRender(safeGet(analysisData, 'character.personality_traits'))}</p>
            </div>
          </div>
        </div>

        {/* 事业财运 */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-orange-700">事业财运</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">适合行业</h4>
              <div className="text-gray-700">
                {Array.isArray(safeGet(analysisData, 'career.suitable_industries')) && 
                 safeGet(analysisData, 'career.suitable_industries')?.map((industry: string, index: number) => (
                  <span key={index} className="inline-block bg-white px-2 py-1 rounded mr-2 mb-2 text-sm">
                    {safeRender(industry)}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">财富模式</h4>
              <p className="text-gray-700">{safeRender(safeGet(analysisData, 'wealth.wealth_pattern'))}</p>
            </div>
          </div>
        </div>

        {/* 感情婚姻 */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-pink-700">感情婚姻</h3>
          <div className="bg-pink-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">婚姻运势</h4>
              <p className="text-gray-700">{safeRender(safeGet(analysisData, 'relationships.marriage_fortune'))}</p>
              <div className="mt-3">
                <h5 className="font-medium text-sm mb-1">伴侣特质：</h5>
                <p className="text-gray-600 text-sm">{safeRender(safeGet(analysisData, 'relationships.spouse_characteristics'))}</p>
              </div>
            </div>
        </div>

        {/* 健康指导 */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-teal-700">健康指导</h3>
          <div className="bg-teal-50 p-4 rounded-lg">
            <p className="text-gray-700">{safeRender(safeGet(analysisData, 'health.constitution'))}</p>
            <div className="mt-3">
              <h5 className="font-medium text-sm mb-1">建议：</h5>
              <p className="text-gray-600 text-sm">{safeRender(safeGet(analysisData, 'health.wellness_advice'))}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染易经占卜分析
  const renderYijingAnalysis = () => {
    // 如果有问题参数，使用新的 CompleteYijingAnalysis 组件
    if (question) {
      return (
        <CompleteYijingAnalysis 
          question={question}
          userId={userId}
          divinationMethod={divinationMethod}
          analysisData={preAnalysisData}
          recordId={recordId}
        />
      );
    }
    
    // 如果有分析结果但没有问题参数，尝试从结果中提取问题信息
    if (analysisResult && analysisResult.data) {
      const basicInfo = analysisResult.data.basic_info;
      if (basicInfo && basicInfo.divination_data) {
        return (
          <CompleteYijingAnalysis 
            question={basicInfo.divination_data.question || '综合运势如何？'}
            userId={userId || 'user123'}
            divinationMethod={divinationMethod || 'time'}
            analysisData={preAnalysisData}
            recordId={recordId}
          />
        );
      }
    }
    
    // 回退到旧的渲染方式（向后兼容）
    const data = analysisResult?.data || analysisResult;
    
    return (
      <div className="space-y-8">
        {/* 占卜基本信息 */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-amber-700">占卜基本信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-amber-50 p-4 rounded-lg">
              <p><span className="font-medium">占卜问题：</span>{safeRender(safeGet(data, 'basic_info.divination_data.question'))}</p>
              <p><span className="font-medium">起卦方法：</span>{safeRender(safeGet(data, 'basic_info.divination_data.method'))}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p><span className="font-medium">占卜时间：</span>{safeGet(data, 'basic_info.divination_data.divination_time') ? new Date(safeGet(data, 'basic_info.divination_data.divination_time')).toLocaleString('zh-CN') : ''}</p>
              <p><span className="font-medium">分析日期：</span>{safeRender(safeGet(data, 'analysis_date'))}</p>
            </div>
          </div>
        </div>

        {/* 卦象分析 */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-green-700">卦象分析</h3>
          
          {/* 本卦识别 */}
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-3 text-gray-800">本卦识别</h4>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-gray-700 text-lg font-medium">
                {safeRender(safeGet(data, 'basic_info.hexagram_info.main_hexagram'))}
              </p>
              <p className="text-gray-600 mt-2">
                卦辞：{safeRender(safeGet(data, 'basic_info.hexagram_info.hexagram_description'))}
              </p>
              <p className="text-gray-600 mt-1">
                上下卦：{safeRender(safeGet(data, 'basic_info.hexagram_info.upper_trigram'))} / {safeRender(safeGet(data, 'basic_info.hexagram_info.lower_trigram'))}
              </p>
            </div>
          </div>

          {/* 卦象详解 */}
          <div>
            <h4 className="text-lg font-medium mb-3 text-gray-800">卦象详解</h4>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-700">{safeRender(safeGet(data, 'basic_info.hexagram_info.detailed_interpretation'))}</p>
            </div>
          </div>
        </div>

        {/* 卦象主要分析 */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-purple-700">卦象主要分析</h3>
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">主要含义</h4>
              <p className="text-gray-700">{safeRender(safeGet(data, 'detailed_analysis.hexagram_analysis.primary_meaning'))}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">吉凶断语</h4>
              <p className="text-gray-700">{safeRender(safeGet(data, 'detailed_analysis.hexagram_analysis.judgment'))}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">象辞解释</h4>
              <p className="text-gray-700">{safeRender(safeGet(data, 'detailed_analysis.hexagram_analysis.image'))}</p>
            </div>
          </div>
        </div>

        {/* 变卦分析 */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-orange-700">变卦分析</h3>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">动爻位置</h4>
            <p className="text-gray-700">
              动爻在{safeRender(safeGet(data, 'detailed_analysis.changing_lines_analysis.changing_line_position'))}，
              含义：{safeRender(safeGet(data, 'detailed_analysis.changing_lines_analysis.line_meaning'))}
            </p>
            <div className="mt-3">
              <h5 className="font-medium text-sm mb-1">变卦结果：</h5>
              <p className="text-gray-600 text-sm">
                {safeRender(safeGet(data, 'detailed_analysis.changing_hexagram.name'))} - 
                {safeRender(safeGet(data, 'detailed_analysis.changing_hexagram.meaning'))}
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {safeRender(safeGet(data, 'detailed_analysis.changing_hexagram.transformation_insight'))}
              </p>
            </div>
          </div>
        </div>

        {/* 人生指导 */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-cyan-700">人生指导</h3>
          <div className="space-y-4">
            <div className="bg-cyan-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">整体运势</h4>
              <p className="text-gray-700">{safeRender(safeGet(data, 'life_guidance.overall_fortune'))}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">事业指导</h4>
              <p className="text-gray-700">{safeRender(safeGet(data, 'life_guidance.career_guidance'))}</p>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">情感指导</h4>
              <p className="text-gray-700">{safeRender(safeGet(data, 'life_guidance.relationship_guidance'))}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">财运指导</h4>
              <p className="text-gray-700">{safeRender(safeGet(data, 'life_guidance.wealth_guidance'))}</p>
            </div>
          </div>
        </div>

        {/* 易经智慧 */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">易经智慧</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">核心信息</h4>
            <p className="text-gray-700 text-lg font-medium mb-3">
              {safeRender(safeGet(data, 'divination_wisdom.key_message'))}
            </p>
            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">行动建议：</span>{safeRender(safeGet(data, 'divination_wisdom.action_advice'))}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">哲学启示：</span>{safeRender(safeGet(data, 'divination_wisdom.philosophical_insight'))}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 主渲染逻辑
  const renderAnalysis = () => {
    switch (analysisType) {
      case 'bazi':
        return renderBaziAnalysis();
      case 'ziwei':
        return renderZiweiAnalysis();
      case 'yijing':
        return renderYijingAnalysis();
      case 'qimen':
        return <CompleteQimenAnalysis analysis={analysisResult?.data || analysisResult} />;
      default:
        return (
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <p className="text-gray-500">未知的分析类型: {analysisType}</p>
          </div>
        );
    }
  };

  // 对于八字分析，如果有 birthDate 则不需要 analysisResult
  if (analysisType === 'bazi' && birthDate) {
    return renderBaziAnalysis();
  }
  
  // 对于易经占卜，如果有 question 参数，直接返回 CompleteYijingAnalysis 组件（不添加额外容器）
  if (analysisType === 'yijing' && question) {
    return (
      <CompleteYijingAnalysis 
        question={question}
        userId={userId}
        divinationMethod={divinationMethod}
        analysisData={preAnalysisData}
        recordId={recordId}
      />
    );
  }
  
  // 对于紫微斗数，如果有 birthDate 参数，直接返回 CompleteZiweiAnalysis 组件（不添加额外容器）
  if (analysisType === 'ziwei' && birthDate) {
    return <CompleteZiweiAnalysis birthDate={birthDate} analysisData={preAnalysisData} recordId={recordId} />;
  }
  
  // 对于奇门遁甲，如果有预分析数据，直接返回 CompleteQimenAnalysis 组件
  if (analysisType === 'qimen' && preAnalysisData) {
    return <CompleteQimenAnalysis analysis={preAnalysisData} recordId={recordId} />;
  }
  
  // 如果没有分析结果数据
  if (!analysisResult) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <p className="text-gray-500 text-center">暂无分析数据</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {renderAnalysis()}
    </div>
  );
};

export default AnalysisResultDisplay;