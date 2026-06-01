/**
 * 十二宫位网格展示组件
 * 展示紫微斗数十二宫位的详细信息，包括星曜、亮度、强度解释等
 */
import React from 'react';
import { Star, Sparkles, Zap, BarChart3, BookOpen, Sun, User, Heart, DollarSign, Activity, Compass, Target, Crown, Moon } from 'lucide-react';
import { ChineseCard, ChineseCardContent, ChineseCardHeader, ChineseCardTitle } from '../ui/ChineseCard';
import { cn } from '../../lib/utils';
import { starColors, luckyStarColors, unluckyStarColors, strengthColors, strengthExplanations } from './shared';

interface PalaceGridProps {
  twelvePalaces: {
    [key: string]: {
      position?: string;
      branch?: string;
      strength?: string;
      main_stars?: string[];
      lucky_stars?: string[];
      unlucky_stars?: string[];
      brightness_analysis?: {
        overall_brightness: string;
        brightness_score: number;
        brightness_description: string;
        combination_effect?: string;
      };
      interpretation?: string;
    };
  };
}

// 宫位图标映射
const palaceIcons: { [key: string]: any } = {
  '命宫': User,
  '兄弟宫': Heart,
  '夫妻宫': Heart,
  '子女宫': Star,
  '财帛宫': DollarSign,
  '疾厄宫': Activity,
  '迁移宫': Compass,
  '交友宫': Heart,
  '事业宫': Crown,
  '田宅宫': Target,
  '福德宫': Sun,
  '父母宫': Moon
};

const PalaceGrid: React.FC<PalaceGridProps> = ({ twelvePalaces }) => {
  if (!twelvePalaces) return null;

  // 渲染单个宫位卡片
  const renderPalaceCard = (palaceName: string, palace: any) => {
    if (!palace) return null;

    const PalaceIcon = palaceIcons[palaceName] || Star;

    return (
      <ChineseCard key={palaceName} variant="bordered" className="hover:shadow-xl transition-all duration-300 min-h-[320px] w-full">
        <ChineseCardHeader className="text-center pb-3">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
              <PalaceIcon className="h-5 w-5 text-white" />
            </div>
            <ChineseCardTitle className="text-red-600 text-heading-lg font-bold font-chinese">
              {palaceName}
            </ChineseCardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 text-body-md font-chinese">{palace.position || palace.branch}</span>
              <span className={cn(
                'px-2 py-1 rounded-full text-label-md font-medium font-chinese',
                strengthColors[palace.strength] || 'text-gray-600 bg-gray-50'
              )}>
                {palace.strength}
              </span>
            </div>
          </div>
        </ChineseCardHeader>
        <ChineseCardContent className="space-y-3">
          {/* 星曜亮度分析 */}
          {palace.brightness_analysis && (
            <div className="mb-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <h5 className="text-label-lg font-semibold text-orange-700 mb-2 font-chinese flex items-center">
                <Sun className="h-4 w-4 mr-1" />
                星曜亮度：{palace.brightness_analysis.overall_brightness}
              </h5>
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      palace.brightness_analysis.brightness_score >= 4 ? 'bg-green-500' :
                      palace.brightness_analysis.brightness_score >= 3 ? 'bg-yellow-500' :
                      palace.brightness_analysis.brightness_score >= 2 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(palace.brightness_analysis.brightness_score * 20, 100)}%` }}
                  ></div>
                </div>
                <span className="text-label-md font-medium text-orange-700 font-chinese">
                  {palace.brightness_analysis.brightness_score?.toFixed(1)}
                </span>
              </div>
              <p className="text-body-sm text-orange-800 font-chinese">
                {palace.brightness_analysis.brightness_description}
              </p>
              {palace.brightness_analysis.combination_effect && (
                <p className="text-body-sm text-orange-700 mt-1 font-chinese">
                  组合效果：{palace.brightness_analysis.combination_effect}
                </p>
              )}
            </div>
          )}
          
          {/* 主星 */}
          {palace.main_stars && palace.main_stars.length > 0 && (
            <div>
              <h5 className="text-label-lg font-semibold text-red-800 mb-2 font-chinese flex items-center">
                <Star className="h-4 w-4 mr-1" />
                主星
              </h5>
              <div className="flex flex-wrap gap-1">
                {palace.main_stars.map((star: string, index: number) => (
                  <span key={index} className={cn(
                    'px-2 py-1 rounded-full text-label-md font-medium border font-chinese',
                    starColors[star] || 'bg-gray-100 text-gray-800 border-gray-300'
                  )}>
                    {star}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* 吉星 */}
          {palace.lucky_stars && palace.lucky_stars.length > 0 && (
            <div>
              <h5 className="text-label-lg font-semibold text-yellow-800 mb-2 font-chinese flex items-center">
                <Sparkles className="h-4 w-4 mr-1" />
                吉星
              </h5>
              <div className="flex flex-wrap gap-1">
                {palace.lucky_stars.map((star: string, index: number) => (
                  <span key={index} className={cn(
                    'px-2 py-1 rounded-full text-label-md font-medium border font-chinese',
                    luckyStarColors
                  )}>
                    {star}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* 煞星 */}
          {palace.unlucky_stars && palace.unlucky_stars.length > 0 && (
            <div>
              <h5 className="text-label-lg font-semibold text-red-800 mb-2 font-chinese flex items-center">
                <Zap className="h-4 w-4 mr-1" />
                煞星
              </h5>
              <div className="flex flex-wrap gap-1">
                {palace.unlucky_stars.map((star: string, index: number) => (
                  <span key={index} className={cn(
                    'px-2 py-1 rounded-full text-label-md font-medium border font-chinese',
                    unluckyStarColors
                  )}>
                    {star}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* 强度解释 */}
          {palace.strength && (
            <div className="border-t border-red-100 pt-3 mt-3">
              <h5 className="text-label-lg font-semibold text-gray-800 mb-2 font-chinese flex items-center">
                <BarChart3 className="h-4 w-4 mr-1" />
                强度解释
              </h5>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-md font-medium text-gray-800 font-chinese">当前强度：</span>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-label-md font-medium font-chinese',
                    strengthColors[palace.strength] || 'text-gray-600 bg-gray-50'
                  )}>
                    {palace.strength}
                  </span>
                </div>
                <p className="text-body-sm text-gray-700 leading-relaxed font-chinese">
                  {strengthExplanations[palace.strength] || '该宫位的星曜配置具有独特的影响模式，需要结合具体情况来分析。'}
                </p>
              </div>
            </div>
          )}
          
          {/* 宫位解读 */}
          {palace.interpretation && (
            <div className="border-t border-red-100 pt-3 mt-3">
              <h5 className="text-label-lg font-semibold text-gray-800 mb-2 font-chinese flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                宫位解读
              </h5>
              <p className="text-body-md text-gray-700 leading-relaxed font-chinese">{palace.interpretation}</p>
            </div>
          )}
        </ChineseCardContent>
      </ChineseCard>
    );
  };

  return (
    <ChineseCard variant="elevated" className="bg-gradient-to-br from-red-50 to-yellow-50">
      <ChineseCardHeader>
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Star className="h-6 w-6 text-white" />
          </div>
          <ChineseCardTitle className="text-red-600 text-2xl md:text-3xl font-bold font-chinese">
            十二宫位详解
          </ChineseCardTitle>
          <p className="text-gray-600 mt-2 font-chinese">紫微斗数将人生分为十二个宫位，每个宫位代表不同的人生领域</p>
          
          {/* 星曜强度等级说明 */}
          <div className="mt-4 bg-gradient-to-r from-red-50 to-yellow-50 p-4 rounded-lg border border-red-200">
            <h4 className="font-bold text-red-800 mb-3 text-center font-chinese">星曜强度等级说明</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <div className="text-center p-2 bg-green-100 rounded border border-green-300">
                <div className="font-semibold text-green-800 font-chinese">旺</div>
                <div className="text-green-700 font-chinese">最强</div>
              </div>
              <div className="text-center p-2 bg-blue-100 rounded border border-blue-300">
                <div className="font-semibold text-blue-800 font-chinese">得地</div>
                <div className="text-blue-700 font-chinese">较强</div>
              </div>
              <div className="text-center p-2 bg-yellow-100 rounded border border-yellow-300">
                <div className="font-semibold text-yellow-800 font-chinese">平</div>
                <div className="text-yellow-700 font-chinese">中等</div>
              </div>
              <div className="text-center p-2 bg-orange-100 rounded border border-orange-300">
                <div className="font-semibold text-orange-800 font-chinese">不得地</div>
                <div className="text-orange-700 font-chinese">较弱</div>
              </div>
              <div className="text-center p-2 bg-red-100 rounded border border-red-300">
                <div className="font-semibold text-red-800 font-chinese">陷</div>
                <div className="text-red-700 font-chinese">最弱</div>
              </div>
            </div>
            <p className="text-red-700 text-xs mt-3 text-center font-chinese">
              星曜强度反映了该宫位星曜力量的强弱，影响相关人生领域的发展顺逆程度
            </p>
          </div>
        </div>
      </ChineseCardHeader>
      <ChineseCardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {Object.entries(twelvePalaces).map(([palaceName, palace]) => 
            renderPalaceCard(palaceName, palace)
          )}
        </div>
      </ChineseCardContent>
    </ChineseCard>
  );
};

export default PalaceGrid;
