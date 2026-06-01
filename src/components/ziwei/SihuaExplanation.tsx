/**
 * 四化飞星解释组件
 * 展示化禄、化权、化科、化忌四化飞星的详细解释
 */
import React from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { sihuaExplanations } from './shared';

interface SihuaExplanationProps {
  siHua: {
    year_stem: string;
    hua_lu: { star: string };
    hua_quan: { star: string };
    hua_ke: { star: string };
    hua_ji: { star: string };
    enhanced_sihua?: {
      interaction_analysis?: {
        conflicts?: Array<{ type: string; impact: string }>;
        enhancements?: Array<{ type: string; impact: string }>;
        overall_harmony: string;
        recommendations?: string[];
      };
    };
  };
}

const SihuaExplanation: React.FC<SihuaExplanationProps> = ({ siHua }) => {
  if (!siHua) return null;

  return (
    <Card className="chinese-card-decoration border-2 border-purple-400">
      <CardHeader>
        <CardTitle className="text-purple-800 text-2xl font-bold chinese-text-shadow flex items-center space-x-2">
          <Sparkles className="h-6 w-6" />
          <span>四化飞星</span>
        </CardTitle>
        <p className="text-purple-600 mt-2">根据{siHua.year_stem}年干的四化飞星分析</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 四化概述 */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-bold text-purple-800 mb-2">四化飞星概述</h4>
            <p className="text-purple-700 text-sm leading-relaxed">
              四化飞星是紫微斗数的核心理论，由{siHua.year_stem}年干所化出。
              四化分别是化禄（财禄）、化权（权力）、化科（名声）、化忌（阻碍），
              它们会影响相应星曜的能量表现，是判断吉凶和时机的重要依据。
            </p>
          </div>
          
          {/* 四化详解 */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* 化禄 */}
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">💰</span>
                <div>
                  <h4 className="font-bold text-green-800 text-lg">化禄 - {siHua.hua_lu.star}</h4>
                  <p className="text-green-600 text-sm">{sihuaExplanations['化禄'].concept}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-green-800">影响：</span>
                  <span className="text-green-700">{sihuaExplanations['化禄'].influence}</span>
                </div>
                <div>
                  <span className="font-medium text-green-800">应用：</span>
                  <span className="text-green-700">{sihuaExplanations['化禄'].application}</span>
                </div>
                <div>
                  <span className="font-medium text-green-800">时机：</span>
                  <span className="text-green-700">{sihuaExplanations['化禄'].timing}</span>
                </div>
              </div>
            </div>
            
            {/* 化权 */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">👑</span>
                <div>
                  <h4 className="font-bold text-blue-800 text-lg">化权 - {siHua.hua_quan.star}</h4>
                  <p className="text-blue-600 text-sm">{sihuaExplanations['化权'].concept}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-blue-800">影响：</span>
                  <span className="text-blue-700">{sihuaExplanations['化权'].influence}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">应用：</span>
                  <span className="text-blue-700">{sihuaExplanations['化权'].application}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">时机：</span>
                  <span className="text-blue-700">{sihuaExplanations['化权'].timing}</span>
                </div>
              </div>
            </div>
            
            {/* 化科 */}
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">🎓</span>
                <div>
                  <h4 className="font-bold text-yellow-800 text-lg">化科 - {siHua.hua_ke.star}</h4>
                  <p className="text-yellow-600 text-sm">{sihuaExplanations['化科'].concept}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-yellow-800">影响：</span>
                  <span className="text-yellow-700">{sihuaExplanations['化科'].influence}</span>
                </div>
                <div>
                  <span className="font-medium text-yellow-800">应用：</span>
                  <span className="text-yellow-700">{sihuaExplanations['化科'].application}</span>
                </div>
                <div>
                  <span className="font-medium text-yellow-800">时机：</span>
                  <span className="text-yellow-700">{sihuaExplanations['化科'].timing}</span>
                </div>
              </div>
            </div>
            
            {/* 化忌 */}
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h4 className="font-bold text-red-800 text-lg">化忌 - {siHua.hua_ji.star}</h4>
                  <p className="text-red-600 text-sm">{sihuaExplanations['化忌'].concept}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-red-800">影响：</span>
                  <span className="text-red-700">{sihuaExplanations['化忌'].influence}</span>
                </div>
                <div>
                  <span className="font-medium text-red-800">应用：</span>
                  <span className="text-red-700">{sihuaExplanations['化忌'].application}</span>
                </div>
                <div>
                  <span className="font-medium text-red-800">时机：</span>
                  <span className="text-red-700">{sihuaExplanations['化忌'].timing}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 增强四化系统 */}
          {siHua.enhanced_sihua?.interaction_analysis && (
            <div className="space-y-4">
              <h4 className="font-bold text-purple-800 mb-3 flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                多层次四化分析
              </h4>
              
              {/* 四化互动分析 */}
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h5 className="font-semibold text-indigo-800 mb-3">四化互动效应</h5>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* 冲突分析 */}
                  {siHua.enhanced_sihua.interaction_analysis.conflicts?.length > 0 && (
                    <div className="bg-red-50 p-3 rounded border border-red-200">
                      <h6 className="font-medium text-red-800 mb-2 text-sm">四化冲突</h6>
                      <div className="space-y-2">
                        {siHua.enhanced_sihua.interaction_analysis.conflicts.map((conflict, index) => (
                          <div key={index} className="text-xs text-red-700">
                            <span className="font-medium">{conflict.type}：</span>
                            <span>{conflict.impact}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 增强分析 */}
                  {siHua.enhanced_sihua.interaction_analysis.enhancements?.length > 0 && (
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <h6 className="font-medium text-green-800 mb-2 text-sm">四化增强</h6>
                      <div className="space-y-2">
                        {siHua.enhanced_sihua.interaction_analysis.enhancements.map((enhancement, index) => (
                          <div key={index} className="text-xs text-green-700">
                            <span className="font-medium">{enhancement.type}：</span>
                            <span>{enhancement.impact}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 整体和谐度 */}
                <div className="mt-3 p-3 bg-white rounded border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">整体和谐度：</span>
                    <span className={`text-sm font-bold ${
                      siHua.enhanced_sihua.interaction_analysis.overall_harmony === '非常和谐' ? 'text-green-600' :
                      siHua.enhanced_sihua.interaction_analysis.overall_harmony === '较为和谐' ? 'text-blue-600' :
                      siHua.enhanced_sihua.interaction_analysis.overall_harmony === '基本和谐' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {siHua.enhanced_sihua.interaction_analysis.overall_harmony}
                    </span>
                  </div>
                </div>
                
                {/* 建议 */}
                {siHua.enhanced_sihua.interaction_analysis.recommendations?.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <h6 className="font-medium text-blue-800 mb-2 text-sm">四化建议</h6>
                    <ul className="space-y-1">
                      {siHua.enhanced_sihua.interaction_analysis.recommendations.map((rec, index) => (
                        <li key={index} className="text-xs text-blue-700 flex items-start">
                          <span className="mr-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SihuaExplanation;
