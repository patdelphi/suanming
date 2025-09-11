import React, { useState, useEffect } from 'react';
import { X, Settings, Eye, EyeOff, Save, TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { ChineseButton } from './ChineseButton';
import { ChineseCard, ChineseCardContent, ChineseCardHeader, ChineseCardTitle } from './ChineseCard';
import { getAIConfigAsync, saveAIConfig, validateAIConfig, AIConfig, defaultAIConfig } from '../../config/aiConfig';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

const AIConfigModal: React.FC<AIConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const [config, setConfig] = useState<AIConfig>({
    apiKey: '',
    apiUrl: '',
    modelName: '',
    maxTokens: 4000,
    temperature: 0.7,
    timeout: 30000,
    stream: true
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // 加载当前配置
  useEffect(() => {
    const loadConfig = async () => {
      if (isOpen) {
        const currentConfig = await getAIConfigAsync();
        setConfig(currentConfig);
        setTestResult(null);
      }
    };
    loadConfig();
  }, [isOpen]);

  // 处理输入变化
  const handleInputChange = (field: keyof AIConfig, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setTestResult(null); // 清除测试结果
  };

  // 保存配置
  const handleSave = async () => {
    if (!validateAIConfig(config)) {
      toast.error('请填写完整的配置信息');
      return;
    }

    setIsSaving(true);
    try {
      saveAIConfig(config);
      toast.success('AI配置保存成功');
      if (onConfigSaved) {
        onConfigSaved();
      }
      onClose();
    } catch (error: any) {
      toast.error(`保存配置失败: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 测试配置
  const handleTest = async () => {
    if (!validateAIConfig(config)) {
      toast.error('请先填写完整的配置信息');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const testRequest = {
        model: config.modelName,
        messages: [
          {
            role: 'user',
            content: '请回复"配置测试成功"来确认连接正常。'
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(testRequest),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
          setTestResult({
            success: true,
            message: '连接测试成功！AI API配置正确。'
          });
          toast.success('配置测试成功');
        } else {
          throw new Error('API响应格式异常');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API请求失败: ${response.status} ${errorData.error?.message || response.statusText}`);
      }
    } catch (error: any) {
      let errorMessage = '连接测试失败';
      if (error.name === 'AbortError') {
        errorMessage = '请求超时，请检查网络连接和API地址';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setTestResult({
        success: false,
        message: errorMessage
      });
      toast.error('配置测试失败');
    } finally {
      setIsTesting(false);
    }
  };

  // 重置为默认配置
  const handleReset = () => {
    setConfig({
      ...defaultAIConfig // 使用完整的默认配置，包括API Key
    });
    setTestResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <ChineseCard className="border-0 shadow-none">
          <ChineseCardHeader className="border-b">
            <div className="flex items-center justify-between">
              <ChineseCardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-blue-600" />
                <span>AI解读配置</span>
              </ChineseCardTitle>
              <ChineseButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1"
              >
                <X className="h-4 w-4" />
              </ChineseButton>
            </div>
          </ChineseCardHeader>
          
          <ChineseCardContent className="space-y-6 p-6">
            {/* API Key */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                API Key <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={(e) => handleInputChange('apiKey', e.target.value)}
                  placeholder="请输入您的API Key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* API URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                API地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={config.apiUrl}
                onChange={(e) => handleInputChange('apiUrl', e.target.value)}
                placeholder="https://api.openai.com/v1/chat/completions"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Model Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                模型名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.modelName}
                onChange={(e) => handleInputChange('modelName', e.target.value)}
                placeholder="gpt-3.5-turbo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Advanced Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">最大Token数</label>
                <input
                  type="number"
                  value={config.maxTokens}
                  onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value) || 2000)}
                  min="100"
                  max="4000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">温度参数</label>
                <input
                  type="number"
                  value={config.temperature}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value) || 0.7)}
                  min="0"
                  max="2"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">超时时间(ms)</label>
                <input
                  type="number"
                  value={config.timeout}
                  onChange={(e) => handleInputChange('timeout', parseInt(e.target.value) || 30000)}
                  min="5000"
                  max="120000"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Stream Setting */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">流式输出</label>
              <div className="flex items-center space-x-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.stream}
                    onChange={(e) => handleInputChange('stream', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    config.stream ? 'bg-blue-600' : 'bg-gray-200'
                  )}>
                    <span className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      config.stream ? 'translate-x-6' : 'translate-x-1'
                    )} />
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    {config.stream ? '启用' : '禁用'}
                  </span>
                </label>
                <span className="text-xs text-gray-500">
                  启用后将实时显示AI生成的内容
                </span>
              </div>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={cn(
                'flex items-center space-x-2 p-3 rounded-lg border',
                testResult.success 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              )}>
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                <span className="text-sm">{testResult.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <ChineseButton
                variant="outline"
                onClick={handleReset}
                className="text-gray-600"
              >
                重置默认
              </ChineseButton>
              
              <div className="flex items-center space-x-3">
                <ChineseButton
                  variant="outline"
                  onClick={handleTest}
                  disabled={isTesting || !validateAIConfig(config)}
                  className="flex items-center space-x-2"
                >
                  <TestTube className={cn('h-4 w-4', isTesting && 'animate-pulse')} />
                  <span>{isTesting ? '测试中...' : '测试连接'}</span>
                </ChineseButton>
                
                <ChineseButton
                  onClick={handleSave}
                  disabled={isSaving || !validateAIConfig(config)}
                  className="flex items-center space-x-2"
                >
                  <Save className={cn('h-4 w-4', isSaving && 'animate-pulse')} />
                  <span>{isSaving ? '保存中...' : '保存配置'}</span>
                </ChineseButton>
              </div>
            </div>
          </ChineseCardContent>
        </ChineseCard>
      </div>
    </div>
  );
};

export default AIConfigModal;