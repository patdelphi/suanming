import { getApiBaseUrl } from '@/services/configService';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, FileText, FileImage, File, Loader2, ChevronDown, Printer, Camera } from 'lucide-react';
import { ChineseButton } from './ChineseButton';
import { cn } from '../../lib/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type DownloadFormat = 'markdown' | 'pdf' | 'png';
export type ExportMode = 'server' | 'frontend';

interface DownloadButtonProps {
  analysisData: any;
  analysisType: 'bazi' | 'ziwei' | 'yijing' | 'qimen';
  userName?: string;
  onDownload?: (format: DownloadFormat) => Promise<void>;
  className?: string;
  disabled?: boolean;
  targetElementId?: string; // 用于前端导出的目标元素ID
}

const DownloadButton: React.FC<DownloadButtonProps> = ({
  analysisData,
  analysisType,
  userName,
  onDownload,
  className,
  disabled = false,
  targetElementId
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<DownloadFormat | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const allFormatOptions = [
    {
      format: 'markdown' as DownloadFormat,
      label: 'Markdown文档',
      icon: FileText,
      description: '结构化文本格式，便于编辑',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      mode: 'server' as ExportMode
    },
    {
      format: 'pdf' as DownloadFormat,
      label: 'PDF文档（服务器生成）',
      icon: File,
      description: '服务器生成的PDF文档',
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100',
      mode: 'server' as ExportMode
    },
    {
      format: 'pdf' as DownloadFormat,
      label: 'PDF文档（页面导出）',
      icon: Printer,
      description: '直接从页面生成PDF，分页格式',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      mode: 'frontend' as ExportMode
    },

    {
      format: 'png' as DownloadFormat,
      label: 'PNG长图（页面导出）',
      icon: Camera,
      description: '直接从页面生成PNG长图',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 hover:bg-teal-100',
      mode: 'frontend' as ExportMode
    }
  ];

  // 根据是否有targetElementId来过滤选项
  const formatOptions = allFormatOptions.filter(option => {
    // 如果是前端导出模式，需要有targetElementId才显示
    if (option.mode === 'frontend') {
      return !!targetElementId;
    }
    // 服务器模式总是显示
    return true;
  });



  const handleDownload = async (format: DownloadFormat, mode: ExportMode = 'server') => {
    if (disabled || isDownloading) return;

    try {
      setIsDownloading(true);
      setDownloadingFormat(format);
      setShowDropdown(false);

      if (mode === 'frontend') {
        // 前端导出逻辑
        await frontendExport(format);
      } else if (onDownload) {
        await onDownload(format);
      } else {
        // 默认服务器下载逻辑
        await defaultDownload(format);
      }
    } catch (error) {
      // 显示错误提示
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.error(`下载失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    } finally {
      setIsDownloading(false);
      setDownloadingFormat(null);
    }
  };

  // 前端导出功能
  const frontendExport = async (format: DownloadFormat) => {
    if (!targetElementId) {
      const error = '未指定导出目标元素ID，无法使用前端导出功能';
      throw new Error(error);
    }

    const element = document.getElementById(targetElementId);
    
    if (!element) {
      const error = `未找到ID为"${targetElementId}"的元素，请确认页面已完全加载`;
      throw new Error(error);
    }

    if (format === 'png') {
      await exportToPNG(element);
    } else if (format === 'pdf') {
      await exportToPDF(element);
    }
  };

  // 导出为PNG
  const exportToPNG = async (element: HTMLElement): Promise<void> => {
    // 确保页面完全加载和渲染
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const canvas = await html2canvas(element, {
       scale: 2,
       useCORS: true,
       allowTaint: true,
       backgroundColor: '#ffffff',
       scrollX: 0,
       scrollY: 0,
       logging: true, // 启用日志以调试
       // 移除固定尺寸限制，让html2canvas自动计算
       // width: 640,
       // height: element.scrollHeight + 100,
       windowWidth: 640,
       // windowHeight: element.scrollHeight + 100,
       onclone: (clonedDoc) => {
         // 隐藏不需要导出的元素
         const elementsToHide = clonedDoc.querySelectorAll(
           '.no-export, [data-no-export], .fixed, .sticky, .floating'
         );
         elementsToHide.forEach(el => {
           (el as HTMLElement).style.display = 'none';
         });

         // 模拟移动端视口
          const viewport = clonedDoc.createElement('meta');
          viewport.name = 'viewport';
          viewport.content = 'width=640, initial-scale=1';
          clonedDoc.head.appendChild(viewport);

          // 添加移动端样式
          const style = clonedDoc.createElement('style');
          style.textContent = `
            /* 模拟移动端视口 */
            body {
              width: 640px !important;
              max-width: 640px !important;
              margin: 0 !important;
              padding: 16px !important;
              font-size: 16px !important;
              line-height: 1.6 !important;
            }
          
          /* 移除所有边框 */
          * {
            border-left: none !important;
            border-right: none !important;
          }
          
          /* 确保移动端布局 */
          .grid {
            grid-template-columns: 1fr !important;
          }
          
          .flex {
            flex-direction: column !important;
          }
          
          /* 移动端响应式类生效 */
          .sm\\:grid-cols-1,
          .sm\\:grid-cols-2,
          .sm\\:grid-cols-3 {
            grid-template-columns: 1fr !important;
          }
          
          .sm\\:flex-col {
            flex-direction: column !important;
          }
        `;
        clonedDoc.head.appendChild(style);
       }
    });

    const link = document.createElement('a');
    const fileName = getFileName('png', 'frontend');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();

    // 显示成功提示
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast.success('PNG长图导出成功');
    }
  };

  // 导出为PDF
  const exportToPDF = async (element: HTMLElement): Promise<void> => {
    // 确保页面完全加载和渲染
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const canvas = await html2canvas(element, {
       scale: 1.5,
       useCORS: true,
       allowTaint: true,
       backgroundColor: '#ffffff',
       scrollX: 0,
       scrollY: 0,
       logging: true, // 启用日志以调试
       // 移除固定尺寸限制，让html2canvas自动计算
       // width: 640,
       // height: element.scrollHeight + 100,
       windowWidth: 640,
       // windowHeight: element.scrollHeight + 100,
        onclone: (clonedDoc) => {
          // 隐藏不需要导出的元素
          const elementsToHide = clonedDoc.querySelectorAll(
            '.no-export, [data-no-export], .fixed, .sticky, .floating'
          );
          elementsToHide.forEach(el => {
            (el as HTMLElement).style.display = 'none';
          });

          // 模拟移动端视口
          const viewport = clonedDoc.createElement('meta');
          viewport.name = 'viewport';
          viewport.content = 'width=640, initial-scale=1';
          clonedDoc.head.appendChild(viewport);

          // 添加移动端样式
          const style = clonedDoc.createElement('style');
          style.textContent = `
            /* 模拟移动端视口 */
            body {
              width: 640px !important;
              max-width: 640px !important;
              margin: 0 !important;
              padding: 16px !important;
              font-size: 16px !important;
              line-height: 1.6 !important;
            }
          
          /* 移除所有边框 */
          * {
            border-left: none !important;
            border-right: none !important;
          }
          
          /* 确保移动端布局 */
          .grid {
            grid-template-columns: 1fr !important;
          }
          
          .flex {
            flex-direction: column !important;
          }
          
          /* 移动端响应式类生效 */
          .sm\\:grid-cols-1,
          .sm\\:grid-cols-2,
          .sm\\:grid-cols-3 {
            grid-template-columns: 1fr !important;
          }
          
          .sm\\:flex-col {
            flex-direction: column !important;
          }
        `;
        clonedDoc.head.appendChild(style);
       }
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 10;
    const contentWidth = pdfWidth - 2 * margin;
    const contentHeight = pdfHeight - 2 * margin;

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // 优先填满宽度，让内容宽度占满页面
    const widthRatio = contentWidth / (imgWidth * 0.264583);
    const scaledWidth = contentWidth; // 直接使用全部可用宽度
    const scaledHeight = imgHeight * 0.264583 * widthRatio;

    const pageHeight = contentHeight;
    const totalPages = Math.ceil(scaledHeight / pageHeight);

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      const yOffset = -i * pageHeight;
      pdf.addImage(
        imgData,
        'PNG',
        margin,
        margin + yOffset,
        scaledWidth,
        scaledHeight
      );
    }

    const fileName = getFileName('pdf', 'frontend');
    pdf.save(fileName);

    // 显示成功提示
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast.success('PDF文档导出成功');
    }
  };

  // 生成文件名
  const getFileName = (format: string, mode: ExportMode = 'server') => {
    const typeLabel = getAnalysisTypeLabel();
    const userPart = userName || 'user';
    const exportMode = mode === 'frontend' ? '页面导出' : '服务器导出';
    
    // 获取分析报告生成时间
    let analysisDate;
    if (analysisData?.created_at) {
      analysisDate = new Date(analysisData.created_at);
    } else if (analysisData?.basic_info?.created_at) {
      analysisDate = new Date(analysisData.basic_info.created_at);
    } else if (analysisData?.metadata?.analysis_time) {
      analysisDate = new Date(analysisData.metadata.analysis_time);
    } else {
      // 如果没有分析时间，使用当前时间作为备用
      analysisDate = new Date();
    }
    
    const year = analysisDate.getFullYear();
    const month = String(analysisDate.getMonth() + 1).padStart(2, '0');
    const day = String(analysisDate.getDate()).padStart(2, '0');
    const hour = String(analysisDate.getHours()).padStart(2, '0');
    const minute = String(analysisDate.getMinutes()).padStart(2, '0');
    const second = String(analysisDate.getSeconds()).padStart(2, '0');
    
    const dateStr = `${year}${month}${day}`;
    const timeStr = `${hour}${minute}${second}`;
    
    return `${typeLabel}_${userPart}_${exportMode}_${dateStr}_${timeStr}.${format}`;
   };

  const defaultDownload = async (format: DownloadFormat) => {
    try {
      // 获取认证token
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('请先登录');
      }

      // 使用统一的方法获取API基础URL
      const API_BASE_URL = await getApiBaseUrl();

      // 调用后端下载API
      const response = await fetch(`${API_BASE_URL}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          analysisData,
          analysisType,
          format,
          userName
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `下载失败 (${response.status})`);
      }

      // 获取文件名（从响应头或生成默认名称）
      const contentDisposition = response.headers.get('Content-Disposition');
      // 生成与后端一致的文件名格式：分析类型_用户名_日期_时间（使用分析记录创建时间）
      // 优先使用分析记录的创建时间，如果没有则使用当前时间
      let analysisDate;
      if (analysisData.created_at) {
        analysisDate = new Date(analysisData.created_at);
      } else if (analysisData.basic_info?.created_at) {
        analysisDate = new Date(analysisData.basic_info.created_at);
      } else {
        // 如果没有创建时间，使用当前时间作为备用
        analysisDate = new Date();
      }
      
      const year = analysisDate.getFullYear();
      const month = String(analysisDate.getMonth() + 1).padStart(2, '0');
      const day = String(analysisDate.getDate()).padStart(2, '0');
      const hour = String(analysisDate.getHours()).padStart(2, '0');
      const minute = String(analysisDate.getMinutes()).padStart(2, '0');
      const second = String(analysisDate.getSeconds()).padStart(2, '0');
      
      const dateStr = `${year}${month}${day}`;
      const timeStr = `${hour}${minute}${second}`;
      const exportMode = '服务器导出';
      let filename = `${getAnalysisTypeLabel()}_${userName || 'user'}_${exportMode}_${dateStr}_${timeStr}.${format === 'markdown' ? 'md' : format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=(['"]?)([^'"\n]*?)\1/);
        if (filenameMatch && filenameMatch[2]) {
          filename = decodeURIComponent(filenameMatch[2]);
        }
      }

      // 创建blob并下载
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // 清理
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      // 显示成功提示
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.success(`${format.toUpperCase()}文件下载成功`);
      }
      
    } catch (error) {
      // 显示错误提示
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.error(error instanceof Error ? error.message : '下载失败，请重试');
      }
      
      throw error;
    }
  };

  const getAnalysisTypeLabel = () => {
    switch (analysisType) {
      case 'bazi': return '八字命理';
      case 'ziwei': return '紫微斗数';
      case 'yijing': return '易经占卜';
      case 'qimen': return '奇门遁甲';
      default: return '命理';
    }
  };

  const getFormatLabel = (format: DownloadFormat) => {
    switch (format) {
      case 'markdown': return 'Markdown';
      case 'pdf': return 'PDF';
      case 'png': return 'PNG';
      default: return '';
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* 主下载按钮 */}
      <div className="flex items-center space-x-2">
        <ChineseButton
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={disabled || isDownloading}
          variant="secondary"
          className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white border-0 shadow-lg"
        >
          {isDownloading ? (
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
          ) : (
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
          <span className="font-medium text-xs sm:text-sm">
            {isDownloading ? `正在生成${getFormatLabel(downloadingFormat!)}...` : '下载'}
          </span>
          <ChevronDown className={cn(
            'h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200',
            showDropdown ? 'rotate-180' : ''
          )} />
        </ChineseButton>
      </div>

      {/* 使用Portal渲染弹出层到body，脱离父容器限制 */}
      {showDropdown && createPortal(
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 z-[999998] bg-black bg-opacity-20" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* 弹出层 - 固定定位到屏幕中央 */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-[999999] max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm">选择下载格式</h3>
              <p className="text-xs text-gray-600 mt-1">{getAnalysisTypeLabel()}分析结果</p>
            </div>
            
            <div className="p-2">
              {formatOptions.map((option) => {
                const Icon = option.icon;
                const isCurrentlyDownloading = isDownloading && downloadingFormat === option.format;
                
                return (
                  <button
                    key={`${option.format}-${option.mode}`}
                    onClick={() => handleDownload(option.format, option.mode)}
                    disabled={disabled || isDownloading}
                    className={cn(
                      'w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200',
                      option.bgColor,
                      'border border-transparent hover:border-gray-300',
                      disabled || isDownloading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      option.bgColor.replace('hover:', '').replace('bg-', 'bg-').replace('-50', '-100')
                    )}>
                      {isCurrentlyDownloading ? (
                        <Loader2 className={cn('h-5 w-5 animate-spin', option.color)} />
                      ) : (
                        <Icon className={cn('h-5 w-5', option.color)} />
                      )}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className={cn('font-medium text-sm', option.color)}>
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {option.description}
                      </div>
                    </div>
                    
                    {isCurrentlyDownloading && (
                      <div className="text-xs text-gray-500">
                        生成中...
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
              <p className="text-xs text-gray-500 text-center">
                💡 提示：PDF和PNG格式包含完整的视觉设计，Markdown格式便于编辑
              </p>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default DownloadButton;