const express = require('express');
const { authenticate } = require('../middleware/auth.cjs');
const { dbManager } = require('../database/index.cjs');
const { asyncHandler } = require('../middleware/errorHandler.cjs');

const { generateMarkdown } = require('../services/generators/markdownGenerator.cjs');
const { generatePDF } = require('../services/generators/pdfGenerator.cjs');

const router = express.Router();

/**
 * 下载分析结果
 * POST /api/download
 * 支持格式：markdown, pdf, png
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  try {
    const { analysisData, analysisType, format, userName } = req.body;
    const userId = req.user.id;

    // 验证必需参数
    if (!analysisData || !analysisType || !format) {
      return res.status(400).json({
        error: '缺少必需参数',
        details: 'analysisData, analysisType, format 都是必需的'
      });
    }

    // 验证格式类型
    const supportedFormats = ['markdown', 'pdf', 'png'];
    if (!supportedFormats.includes(format)) {
      return res.status(400).json({
        error: '不支持的格式',
        supportedFormats
      });
    }

    // 验证分析类型
    const supportedAnalysisTypes = ['bazi', 'ziwei', 'yijing', 'qimen'];
    if (!supportedAnalysisTypes.includes(analysisType)) {
      return res.status(400).json({
        error: '不支持的分析类型',
        supportedAnalysisTypes
      });
    }

    let fileBuffer;
    let contentType;
    let fileExtension;
    let filename;

    // 生成文件名 - 格式："分析类型_用户名_日期_时间"（使用分析记录创建时间）
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
    
    // 分析类型映射
    const analysisTypeMap = {
      'bazi': '八字命理',
      'ziwei': '紫微斗数', 
      'yijing': '易经占卜'
    };
    
    const analysisTypeName = analysisTypeMap[analysisType] || analysisType;
    const exportMode = '服务器导出';
    const baseFilename = `${analysisTypeName}_${userName || 'user'}_${exportMode}_${dateStr}_${timeStr}`;
    // 文件名格式: 八字命理_午饭_服务器导出_20250821_133105

    try {
      switch (format) {
        case 'markdown':
          fileBuffer = await generateMarkdown(analysisData, analysisType, userName);
          contentType = 'text/markdown';
          fileExtension = 'md';
          filename = `${baseFilename}.md`;
          break;

        case 'pdf':
          fileBuffer = await generatePDF(analysisData, analysisType, userName);
          contentType = 'application/pdf';
          fileExtension = 'pdf';
          filename = `${baseFilename}.pdf`;
          break;


      }
    } catch (generationError) {
      console.error(`生成${format}文件失败:`, generationError);
      return res.status(500).json({
        error: `生成${format}文件失败`,
        details: generationError.message
      });
    }

    // 记录下载历史（可选）
    try {
      const db = dbManager.getDatabase();
      const stmt = db.prepare(`
        INSERT INTO download_history (user_id, analysis_type, format, filename, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `);
      stmt.run(userId, analysisType, format, filename);
    } catch (dbError) {
      // 下载历史记录失败不影响文件下载
      console.warn('记录下载历史失败:', dbError);
    }

    // 设置响应头
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');

    // 发送文件
    res.send(fileBuffer);

  } catch (error) {
    console.error('下载API错误:', error);
    res.status(500).json({
      error: '服务器内部错误',
      details: error.message
    });
  }
}));

/**
 * 获取用户下载历史
 * GET /api/download/history
 */
router.get('/history', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const db = dbManager.getDatabase();
    
    // 获取总数
    const countStmt = db.prepare('SELECT COUNT(*) as total FROM download_history WHERE user_id = ?');
    const { total } = countStmt.get(userId);
    
    // 获取分页数据
    const offset = (page - 1) * limit;
    const stmt = db.prepare(`
      SELECT analysis_type, format, filename, created_at
      FROM download_history 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    
    const downloads = stmt.all(userId, limit, offset);
    
    res.json({
      downloads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('获取下载历史失败:', error);
    res.status(500).json({
      error: '获取下载历史失败',
      details: error.message
    });
  }
}));

/**
 * 获取支持的格式和分析类型
 * GET /api/download/formats
 */
router.get('/formats', (req, res) => {
  res.json({
    supportedFormats: [
      {
        format: 'markdown',
        label: 'Markdown文档',
        description: '结构化文本格式，便于编辑',
        mimeType: 'text/markdown',
        extension: 'md'
      },
      {
        format: 'pdf',
        label: 'PDF文档',
        description: '专业格式，便于打印和分享',
        mimeType: 'application/pdf',
        extension: 'pdf'
      },
      {
        format: 'png',
        label: 'PNG图片',
        description: '高清图片格式，便于保存',
        mimeType: 'image/png',
        extension: 'png'
      }
    ],
    supportedAnalysisTypes: [
      {
        type: 'bazi',
        label: '八字命理',
        description: '基于传统八字学说的命理分析'
      },
      {
        type: 'ziwei',
        label: '紫微斗数',
        description: '通过星曜排布分析命运走向'
      },
      {
        type: 'yijing',
        label: '易经占卜',
        description: '运用梅花易数解读卦象含义'
      }
    ]
  });
});

module.exports = router;