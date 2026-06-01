/**
 * 大限宫位解释组件
 * 展示十二大限的详细分析，包括当前大限、各时期大限的重点领域、发展机会等
 */
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { majorPeriodPalaceExplanations } from './shared';

interface MajorPeriodPalaceProps {
  majorPeriods: {
    wuxing_ju: string;
    start_age: string | number;
    current_period?: {
      description: string;
    };
    all_periods?: Array<{
      period_number: number;
      age_range: string;
      palace_name: string;
      palace_branch: string;
      is_current: boolean;
    }>;
  };
}

const MajorPeriodPalace: React.FC<MajorPeriodPalaceProps> = ({ majorPeriods }) => {
  if (!majorPeriods) return null;

  return (
    <Card className="chinese-card-decoration border-2 border-purple-400">
      <CardHeader>
        <CardTitle className="text-purple-800 text-2xl font-bold chinese-text-shadow flex items-center space-x-2">
          <TrendingUp className="h-6 w-6" />
          <span>大限分析</span>
        </CardTitle>
        <p className="text-purple-600 mt-2">{majorPeriods.wuxing_ju}，起运年龄{majorPeriods.start_age}岁</p>
      </CardHeader>
      <CardContent>
        {/* 当前大限 */}
        {majorPeriods.current_period && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-4">
            <h4 className="font-bold text-purple-800 mb-2">当前大限</h4>
            <p className="text-purple-700 font-medium">{majorPeriods.current_period.description}</p>
          </div>
        )}
        
        {/* 所有大限 */}
        <div className="space-y-4">
          <h4 className="font-bold text-purple-800 mb-3">十二大限详解</h4>
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {majorPeriods.all_periods?.map((period, index) => {
              const explanation = majorPeriodPalaceExplanations[period.palace_name] || {
                focus: '该宫位的重点领域',
                opportunities: '潜在的发展机会',
                challenges: '可能面临的挑战',
                advice: '建议关注的方向'
              };
              
              // 查找当前大限的索引
              const currentIndex = majorPeriods.all_periods?.findIndex((p) => p.is_current) ?? -1;
              
              return (
                <div key={index} className={`p-5 rounded-lg border transition-all duration-200 hover:shadow-lg ${
                  period.is_current 
                    ? 'bg-purple-100 border-purple-300 shadow-lg ring-2 ring-purple-200' 
                    : 'bg-white border-gray-200 hover:border-purple-200'
                }`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-purple-800 text-lg">第{period.period_number}大限</span>
                    <span className="text-sm text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded">{period.age_range}</span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-bold text-gray-800">{period.palace_branch}宫</span>
                      <span className="text-gray-600">（{period.palace_name}）</span>
                    </div>
                    {period.is_current && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-purple-200 text-purple-800 px-3 py-1 rounded-full font-medium">当前大限</span>
                        <span className="text-xs text-purple-600">正在经历</span>
                      </div>
                    )}
                    {!period.is_current && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        index < currentIndex 
                          ? 'bg-gray-100 text-gray-600' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {index < currentIndex ? '已过' : '未来'}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-indigo-800">重点领域：</span>
                      <p className="text-indigo-700 mt-1">{explanation.focus}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium text-green-800">发展机会：</span>
                      <p className="text-green-700 mt-1">{explanation.opportunities}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium text-orange-800">注意事项：</span>
                      <p className="text-orange-700 mt-1">{explanation.challenges}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium text-blue-800">建议方向：</span>
                      <p className="text-blue-700 mt-1">{explanation.advice}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MajorPeriodPalace;
