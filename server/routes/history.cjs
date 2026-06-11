const express = require('express');
const { getDB } = require('../database/index.cjs');
const { authenticate } = require('../middleware/auth.cjs');
const { AppError, asyncHandler } = require('../middleware/errorHandler.cjs');
const AnalysisComparison = require('../services/common/AnalysisComparison.cjs');

const router = express.Router();

// 初始化分析对比服务
const analysisComparison = new AnalysisComparison();

// 获取用户历史记录
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, reading_type } = req.query;
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const db = getDB();
  
  // 构建查询条件
  let whereClause = 'WHERE user_id = ?';
  let params = [req.user.id];
  
  if (reading_type && ['bazi', 'ziwei', 'yijing', 'wuxing', 'qimen'].includes(reading_type)) {
    whereClause += ' AND reading_type = ?';
    params.push(reading_type);
  }
  
  // 获取总数
  const countQuery = `SELECT COUNT(*) as total FROM numerology_readings nr ${whereClause.replace('WHERE', 'WHERE nr.')}`;
  const { total } = db.prepare(countQuery).get(...params);
  
  // 获取分页数据，包含AI解读状态
  const dataQuery = `
    SELECT 
      nr.id,
      nr.reading_type,
      nr.name,
      nr.birth_date,
      nr.birth_time,
      nr.birth_place,
      nr.gender,
      nr.input_data,
      nr.results,
      nr.analysis,
      nr.status,
      nr.created_at,
      nr.updated_at,
      CASE WHEN ai.id IS NOT NULL THEN 1 ELSE 0 END as has_ai_interpretation
    FROM numerology_readings nr
    LEFT JOIN ai_interpretations ai ON (ai.reading_id = nr.id AND ai.user_id = nr.user_id)
    ${whereClause.replace('WHERE', 'WHERE nr.')}
    ORDER BY nr.created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  const readings = db.prepare(dataQuery).all(...params, parseInt(limit), offset);
  
  // 处理JSON字段
  const processedReadings = readings.map(reading => {
    const processed = { ...reading };
    
    // 解析JSON字段
    try {
      if (processed.input_data) {
        processed.input_data = JSON.parse(processed.input_data);
      }
      if (processed.results) {
        processed.results = JSON.parse(processed.results);
      }
      if (processed.analysis) {
        processed.analysis = JSON.parse(processed.analysis);
      }
    } catch (error) {
      console.error('JSON解析错误:', error);
    }
    
    // 数据转换适配器：将旧格式转换为新格式
    if (processed.analysis) {
      // 如果有 analysis 字段，直接使用
      return processed;
    } else if (processed.results) {
      // 如果只有 results 字段，转换为新格式
      processed.analysis = {
        [processed.reading_type]: {
          [`${processed.reading_type}_analysis`]: processed.results
        },
        metadata: {
          analysis_time: processed.created_at,
          version: '1.0',
          analysis_type: processed.reading_type,
          migrated_from_results: true
        }
      };
    }
    
    return processed;
  });
  
  res.json({
    data: processedReadings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// 获取单个分析记录
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // 排除保留路径，让其他路由处理
  if (['stats', 'search'].includes(id)) {
    return res.status(404).json({ error: '路由不存在' });
  }
  
  const db = getDB();
  
  const reading = db.prepare(`
    SELECT 
      id,
      reading_type,
      name,
      birth_date,
      birth_time,
      birth_place,
      gender,
      input_data,
      results,
      analysis,
      status,
      created_at,
      updated_at
    FROM numerology_readings 
    WHERE id = ? AND user_id = ?
  `).get(id, req.user.id);
  
  if (!reading) {
    throw new AppError('分析记录不存在', 404, 'READING_NOT_FOUND');
  }
  
  // 处理JSON字段
  try {
    if (reading.input_data) {
      reading.input_data = JSON.parse(reading.input_data);
    }
    if (reading.results) {
      reading.results = JSON.parse(reading.results);
    }
    if (reading.analysis) {
      reading.analysis = JSON.parse(reading.analysis);
    }
  } catch (error) {
    console.error('JSON解析错误:', error);
  }
  
  // 数据转换适配器
  if (!reading.analysis && reading.results) {
    reading.analysis = {
      [reading.reading_type]: {
        [`${reading.reading_type}_analysis`]: reading.results
      },
      metadata: {
        analysis_time: reading.created_at,
        version: '1.0',
        analysis_type: reading.reading_type,
        migrated_from_results: true
      }
    };
  }
  
  res.json({
    data: reading
  });
}));

// 删除分析记录
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = getDB();
  
  // 检查记录是否存在且属于当前用户
  const reading = db.prepare(
    'SELECT id FROM numerology_readings WHERE id = ? AND user_id = ?'
  ).get(id, req.user.id);
  
  if (!reading) {
    throw new AppError('分析记录不存在', 404, 'READING_NOT_FOUND');
  }
  
  // 删除记录
  const deleteReading = db.prepare('DELETE FROM numerology_readings WHERE id = ?');
  deleteReading.run(id);
  
  res.json({
    data: {
      message: '分析记录删除成功'
    }
  });
}));

// 批量删除分析记录
router.delete('/', authenticate, asyncHandler(async (req, res) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new AppError('请提供要删除的记录ID列表', 400, 'MISSING_IDS');
  }
  
  const db = getDB();
  
  // 验证所有记录都属于当前用户
  const placeholders = ids.map(() => '?').join(',');
  const readings = db.prepare(
    `SELECT id FROM numerology_readings WHERE id IN (${placeholders}) AND user_id = ?`
  ).all(...ids, req.user.id);
  
  if (readings.length !== ids.length) {
    throw new AppError('部分记录不存在或无权限删除', 400, 'INVALID_RECORDS');
  }
  
  // 批量删除
  const deleteReadings = db.prepare(
    `DELETE FROM numerology_readings WHERE id IN (${placeholders}) AND user_id = ?`
  );
  const result = deleteReadings.run(...ids, req.user.id);
  
  res.json({
    data: {
      message: `成功删除 ${result.changes} 条分析记录`
    }
  });
}));

// 获取分析统计信息
router.get('/stats/summary', authenticate, asyncHandler(async (req, res) => {
  const db = getDB();
  
  // 获取各类型分析数量
  const typeStats = db.prepare(`
    SELECT 
      reading_type,
      COUNT(*) as count
    FROM numerology_readings 
    WHERE user_id = ?
    GROUP BY reading_type
  `).all(req.user.id);
  
  // 获取总数和最近分析时间
  const summary = db.prepare(`
    SELECT 
      COUNT(*) as total_readings,
      MAX(created_at) as last_analysis_time,
      MIN(created_at) as first_analysis_time
    FROM numerology_readings 
    WHERE user_id = ?
  `).get(req.user.id);
  
  // 获取最近30天的分析数量
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentCount = db.prepare(`
    SELECT COUNT(*) as recent_count
    FROM numerology_readings 
    WHERE user_id = ? AND created_at >= ?
  `).get(req.user.id, thirtyDaysAgo.toISOString());
  
  res.json({
    data: {
      summary: {
        total_readings: summary.total_readings || 0,
        recent_readings: recentCount.recent_count || 0,
        first_analysis_time: summary.first_analysis_time,
        last_analysis_time: summary.last_analysis_time
      },
      type_distribution: typeStats.reduce((acc, stat) => {
        acc[stat.reading_type] = stat.count;
        return acc;
      }, {})
    }
  });
}));

// 搜索分析记录
router.get('/search/:query', authenticate, asyncHandler(async (req, res) => {
  const { query } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  if (!query || query.trim().length < 2) {
    throw new AppError('搜索关键词至少2个字符', 400, 'INVALID_SEARCH_QUERY');
  }
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const db = getDB();
  const searchTerm = `%${query.trim()}%`;
  
  // 搜索记录
  const readings = db.prepare(`
    SELECT 
      id,
      reading_type,
      name,
      birth_date,
      birth_time,
      birth_place,
      gender,
      input_data,
      results,
      analysis,
      status,
      created_at,
      updated_at
    FROM numerology_readings 
    WHERE user_id = ? AND (
      name LIKE ? OR 
      birth_place LIKE ? OR
      reading_type LIKE ?
    )
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user.id, searchTerm, searchTerm, searchTerm, parseInt(limit), offset);
  
  // 获取搜索结果总数
  const { total } = db.prepare(`
    SELECT COUNT(*) as total
    FROM numerology_readings 
    WHERE user_id = ? AND (
      name LIKE ? OR 
      birth_place LIKE ? OR
      reading_type LIKE ?
    )
  `).get(req.user.id, searchTerm, searchTerm, searchTerm);
  
  // 处理JSON字段
  const processedReadings = readings.map(reading => {
    const processed = { ...reading };
    
    try {
      if (processed.input_data) {
        processed.input_data = JSON.parse(processed.input_data);
      }
      if (processed.results) {
        processed.results = JSON.parse(processed.results);
      }
      if (processed.analysis) {
        processed.analysis = JSON.parse(processed.analysis);
      }
    } catch (error) {
      console.error('JSON解析错误:', error);
    }
    
    return processed;
  });
  
  res.json({
    data: processedReadings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total,
      pages: Math.ceil(total / parseInt(limit))
    },
    search: {
      query: query,
      results_count: processedReadings.length
    }
  });
}));

// 对比两个分析结果
router.post('/compare', authenticate, asyncHandler(async (req, res) => {
  const { current_analysis_id, historical_analysis_id, analysis_type } = req.body;
  
  if (!current_analysis_id || !historical_analysis_id || !analysis_type) {
    throw new AppError('缺少必要参数：current_analysis_id, historical_analysis_id, analysis_type', 400, 'MISSING_COMPARISON_PARAMS');
  }
  
  const db = getDB();
  
  // 获取两个分析记录
  const currentAnalysis = db.prepare(`
    SELECT analysis, created_at as analysis_date
    FROM numerology_readings 
    WHERE id = ? AND user_id = ?
  `).get(current_analysis_id, req.user.id);
  
  const historicalAnalysis = db.prepare(`
    SELECT analysis, created_at as analysis_date
    FROM numerology_readings 
    WHERE id = ? AND user_id = ?
  `).get(historical_analysis_id, req.user.id);
  
  if (!currentAnalysis || !historicalAnalysis) {
    throw new AppError('找不到指定的分析记录', 404, 'ANALYSIS_NOT_FOUND');
  }
  
  // 解析分析数据
  const currentData = typeof currentAnalysis.analysis === 'string' 
    ? JSON.parse(currentAnalysis.analysis) 
    : currentAnalysis.analysis;
  const historicalData = typeof historicalAnalysis.analysis === 'string' 
    ? JSON.parse(historicalAnalysis.analysis) 
    : historicalAnalysis.analysis;
  
  // 添加分析日期
  currentData.analysis_date = currentAnalysis.analysis_date;
  historicalData.analysis_date = historicalAnalysis.analysis_date;
  
  // 执行对比分析
  const comparisonResult = analysisComparison.compareAnalysisResults(
    currentData,
    historicalData,
    analysis_type
  );
  
  res.json({
    data: comparisonResult
  });
}));

// 批量对比分析（趋势分析）
router.post('/batch-compare', authenticate, asyncHandler(async (req, res) => {
  const { analysis_type, limit = 10 } = req.body;
  
  if (!analysis_type) {
    throw new AppError('缺少必要参数：analysis_type', 400, 'MISSING_ANALYSIS_TYPE');
  }
  
  const db = getDB();
  
  // 获取用户最近的分析记录
  const analysisHistory = db.prepare(`
    SELECT analysis, created_at as analysis_date
    FROM numerology_readings 
    WHERE user_id = ? AND reading_type = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(req.user.id, analysis_type, limit);
  
  if (analysisHistory.length < 2) {
    throw new AppError('历史数据不足，需要至少2次分析记录', 400, 'INSUFFICIENT_HISTORY');
  }
  
  // 解析分析数据
  const parsedHistory = analysisHistory.map(record => {
    const data = typeof record.analysis === 'string' 
      ? JSON.parse(record.analysis) 
      : record.analysis;
    data.analysis_date = record.analysis_date;
    return data;
  });
  
  // 执行批量对比分析
  const batchComparisonResult = analysisComparison.batchCompareAnalysis(
    parsedHistory,
    analysis_type
  );
  
  res.json({
    data: batchComparisonResult
  });
}));

// 获取分析趋势统计
router.get('/trends/:analysis_type', authenticate, asyncHandler(async (req, res) => {
  const { analysis_type } = req.params;
  const { days = 365 } = req.query;
  
  const db = getDB();
  
  // 获取指定时间范围内的分析记录
  const analysisRecords = db.prepare(`
    SELECT 
      DATE(created_at) as analysis_date,
      COUNT(*) as count
    FROM numerology_readings 
    WHERE user_id = ? 
      AND reading_type = ?
      AND created_at >= datetime('now', '-' || ? || ' days')
    GROUP BY DATE(created_at)
    ORDER BY analysis_date DESC
  `).all(req.user.id, analysis_type, days);
  
  // 计算统计信息
  const totalAnalyses = analysisRecords.reduce((sum, record) => sum + record.count, 0);
  const averagePerDay = totalAnalyses / Math.min(days, analysisRecords.length || 1);
  
  // 获取最近的分析记录用于趋势分析
  const recentAnalyses = db.prepare(`
    SELECT analysis, created_at
    FROM numerology_readings 
    WHERE user_id = ? AND reading_type = ?
    ORDER BY created_at DESC
    LIMIT 5
  `).all(req.user.id, analysis_type);
  
  let trendAnalysis = null;
  if (recentAnalyses.length >= 2) {
    const parsedAnalyses = recentAnalyses.map(record => {
      const data = typeof record.analysis === 'string' 
        ? JSON.parse(record.analysis) 
        : record.analysis;
      data.analysis_date = record.created_at;
      return data;
    });
    
    trendAnalysis = analysisComparison.batchCompareAnalysis(
      parsedAnalyses,
      analysis_type
    );
  }
  
  res.json({
    data: {
      analysis_type: analysis_type,
      time_range: `${days}天`,
      statistics: {
        total_analyses: totalAnalyses,
        average_per_day: averagePerDay.toFixed(2),
        analysis_frequency: analysisRecords
      },
      trend_analysis: trendAnalysis
    }
  });
}));

module.exports = router;