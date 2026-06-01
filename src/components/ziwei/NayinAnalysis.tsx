/**
 * 纳音五行分析组件
 * 展示纳音五行与五行局的详细解析，包括纳音特征、五行局影响等
 */
import React from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { wuxingJuColors, nayinPersonalizedAnalysis } from './shared';

interface NayinAnalysisProps {
  wuxingJu: {
    type: string;
    nayin: string;
    start_age: string | number;
    number: number;
    description: string;
  };
}

const NayinAnalysis: React.FC<NayinAnalysisProps> = ({ wuxingJu }) => {
  if (!wuxingJu?.nayin) return null;

  // 获取纳音个性化分析
  const getNayinAnalysis = () => {
    const analysisFn = nayinPersonalizedAnalysis[wuxingJu.nayin];
    if (analysisFn) {
      return analysisFn(wuxingJu.type);
    }
    return `您的年柱纳音为${wuxingJu.nayin}，在紫微斗数中对应${wuxingJu.type}，这是您天生的五行本质和能量特征，深刻影响着您的性格特质和人生发展轨迹。`;
  };

  return (
    <Card className="chinese-card-decoration border-2 border-amber-400">
      <CardHeader>
        <CardTitle className="text-amber-800 text-2xl font-bold chinese-text-shadow flex items-center justify-center space-x-2">
          <Sparkles className="h-6 w-6" />
          <span>纳音五行与五行局详解</span>
          <Sparkles className="h-6 w-6" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* 纳音与五行局的关系 */}
            <div className="bg-white p-4 rounded-lg border border-amber-200">
              <h4 className="font-bold text-amber-800 mb-3 text-center">纳音决定五行局</h4>
              <div className="space-y-3">
                <div className="text-center p-3 bg-amber-100 rounded-lg">
                  <div className="text-sm font-semibold text-amber-800 mb-1">您的年柱纳音</div>
                  <div className="text-xl font-bold text-amber-900">{wuxingJu.nayin}</div>
                  <div className="text-xs text-amber-700 mt-1">↓ 对应 ↓</div>
                  <div className="text-lg font-bold text-indigo-800 mt-2">{wuxingJu.type}</div>
                </div>
                
                <div className="bg-amber-50 p-3 rounded-lg">
                  <h5 className="font-semibold text-amber-800 mb-2">五行局影响</h5>
                  <ul className="text-xs text-amber-700 space-y-1">
                    <li>• 大限起始年龄：{wuxingJu.start_age}岁</li>
                    <li>• 大限周期：每{wuxingJu.number * 10}年一步</li>
                    <li>• 运势节奏：{wuxingJu.type}的能量特征</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* 纳音五行分类与特征 */}
            <div className="bg-white p-4 rounded-lg border border-amber-200">
              <h4 className="font-bold text-amber-800 mb-3 text-center">纳音五行特征</h4>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                  <div className="font-semibold text-yellow-800">金纳音特征</div>
                  <div className="text-yellow-700">坚韧、果断、重义气，适合从事金融、机械、军警等行业</div>
                </div>
                <div className="p-2 bg-green-50 rounded border-l-4 border-green-400">
                  <div className="font-semibold text-green-800">木纳音特征</div>
                  <div className="text-green-700">仁慈、进取、有创意，适合教育、文化、医疗等行业</div>
                </div>
                <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                  <div className="font-semibold text-blue-800">水纳音特征</div>
                  <div className="text-blue-700">智慧、灵活、善变通，适合贸易、运输、信息等行业</div>
                </div>
                <div className="p-2 bg-red-50 rounded border-l-4 border-red-400">
                  <div className="font-semibold text-red-800">火纳音特征</div>
                  <div className="text-red-700">热情、积极、有领导力，适合娱乐、广告、能源等行业</div>
                </div>
                <div className="p-2 bg-orange-50 rounded border-l-4 border-orange-400">
                  <div className="font-semibold text-orange-800">土纳音特征</div>
                  <div className="text-orange-700">稳重、诚信、有耐心，适合房地产、农业、建筑等行业</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-white p-4 rounded-lg border border-amber-200">
            <h4 className="font-bold text-amber-800 mb-3 text-center">紫微斗数中的纳音应用</h4>
            <div className="grid md:grid-cols-3 gap-4 text-xs">
              <div className="bg-purple-50 p-3 rounded-lg">
                <h5 className="font-semibold text-purple-800 mb-2">🏰 五行局确定</h5>
                <p className="text-purple-700 leading-relaxed">
                  年柱纳音直接决定五行局类型，影响紫微星的定位和整个命盘的格局。
                </p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg">
                <h5 className="font-semibold text-indigo-800 mb-2">⏰ 大限推算</h5>
                <p className="text-indigo-700 leading-relaxed">
                  五行局数决定大限的起始年龄和每步大限的年数，是推算运程的基础。
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <h5 className="font-semibold text-blue-800 mb-2">🌟 性格分析</h5>
                <p className="text-blue-700 leading-relaxed">
                  纳音五行体现了深层的性格特质，与主星配合形成完整的性格画像。
                </p>
              </div>
            </div>
          </div>
          
          {/* 纳音五行个性化解读 */}
          <div className="mt-6 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="text-amber-700 font-semibold text-sm">纳音五行个性化解读</span>
            </div>
            <p className="text-amber-700 text-sm leading-relaxed">
              {getNayinAnalysis()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NayinAnalysis;
