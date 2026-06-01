/**
 * 星曜图表组件
 * 展示命宫主星的详细信息，包括性格特质、事业方向、财运特点等
 */
import React from 'react';
import { Star, Sparkles, User, Target, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { starColors, starExplanations } from './shared';

interface StarChartProps {
  mingGongStars: string[];
  mingGong?: string;
}

const StarChart: React.FC<StarChartProps> = ({ mingGongStars, mingGong }) => {
  if (!mingGongStars || mingGongStars.length === 0) return null;

  return (
    <Card className="chinese-card-decoration border-2 border-purple-400">
      <CardHeader>
        <CardTitle className="text-purple-800 text-2xl font-bold chinese-text-shadow flex items-center space-x-2">
          <Star className="h-6 w-6" />
          <span>命宫主星详解</span>
        </CardTitle>
        <p className="text-purple-600 mt-2">命宫在{mingGong}，主星决定了您的基本性格和人生走向</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {mingGongStars.map((star, index) => {
            const explanation = starExplanations[star];
            return (
              <div key={index} className="bg-white p-6 rounded-lg border-l-4 border-purple-500 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`px-4 py-2 rounded-lg font-bold text-lg border-2 ${starColors[star] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                    {star}
                  </div>
                  {explanation && (
                    <span className="text-purple-600 font-medium">{explanation.nature}</span>
                  )}
                </div>
                
                {explanation && (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-blue-800 mb-2 flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>性格特质</span>
                      </h5>
                      <p className="text-blue-700 text-sm">{explanation.personality}</p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-green-800 mb-2 flex items-center space-x-1">
                        <Target className="h-4 w-4" />
                        <span>事业方向</span>
                      </h5>
                      <p className="text-green-700 text-sm">{explanation.career}</p>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-yellow-800 mb-2 flex items-center space-x-1">
                        <DollarSign className="h-4 w-4" />
                        <span>财运特点</span>
                      </h5>
                      <p className="text-yellow-700 text-sm">{explanation.fortune}</p>
                    </div>
                  </div>
                )}
                
                {!explanation && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600 text-sm">此星曜的详细解释正在完善中...</p>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* 主星组合解读 */}
          {mingGongStars.length > 1 && (
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h4 className="font-bold text-purple-800 mb-3 flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span>主星组合特色</span>
              </h4>
              <p className="text-purple-700">
                您的命宫有{mingGongStars.join('、')}同宫，这种组合使您兼具了多种星曜的特质。
                {mingGongStars.length === 2 ? 
                  '双星同宫往往能够互补优势，但也需要平衡不同星曜的能量。' : 
                  '多星同宫的格局较为复杂，需要综合各星曜的特质来理解您的性格。'
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StarChart;
