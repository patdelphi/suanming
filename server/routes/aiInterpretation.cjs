const express = require('express');
const { authenticate } = require('../middleware/auth.cjs');
const { getDB } = require('../database/index.cjs');
const { asyncHandler } = require('../middleware/errorHandler.cjs');
const router = express.Router();

// 保存AI解读结果
router.post('/save', authenticate, asyncHandler(async (req, res) => {
  try {
    const { reading_id, content, model, tokens_used, success, error_message } = req.body;
    const user_id = req.user.id;

    // 验证必需参数
    if (!reading_id || (!content && success !== false)) {
      return res.status(400).json({
        error: '缺少必需参数：reading_id, content'
      });
    }

    // 验证reading_id是否属于当前用户
    const db = getDB();
    const readingExists = db.prepare(
      'SELECT id FROM numerology_readings WHERE id = ? AND user_id = ?'
    ).get(reading_id, user_id);
    
    if (!readingExists) {
      return res.status(404).json({
        error: '分析记录不存在或无权限访问'
      });
    }

    // 检查是否已存在AI解读记录（1对1关系）
    const existingInterpretation = db.prepare(
      'SELECT id FROM ai_interpretations WHERE reading_id = ? AND user_id = ?'
    ).get(reading_id, user_id);

    if (existingInterpretation) {
      // 更新现有记录
      const updateStmt = db.prepare(`
        UPDATE ai_interpretations 
        SET content = ?, model = ?, tokens_used = ?, success = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateStmt.run(content, model, tokens_used, success ? 1 : 0, error_message, existingInterpretation.id);

      res.json({
        success: true,
        message: 'AI解读结果更新成功',
        id: existingInterpretation.id
      });
    } else {
      // 创建新记录
      const insertStmt = db.prepare(`
        INSERT INTO ai_interpretations (user_id, reading_id, content, model, tokens_used, success, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const result = insertStmt.run(user_id, reading_id, content, model, tokens_used, success ? 1 : 0, error_message);

      res.json({
        success: true,
        message: 'AI解读结果保存成功',
        id: result.lastInsertRowid
      });
    }
  } catch (error) {
    console.error('保存AI解读结果失败:', error);
    res.status(500).json({
      error: '保存AI解读结果失败',
      details: error.message
    });
  }
}));

// 获取AI解读结果
router.get('/get/:reading_id', authenticate, asyncHandler(async (req, res) => {
  try {
    const { reading_id } = req.params;
    const user_id = req.user.id;
    const db = getDB();

    // 获取AI解读记录及关联的分析记录信息
    const interpretation = db.prepare(`
      SELECT ai.*, nr.name, nr.reading_type, nr.created_at as analysis_created_at
      FROM ai_interpretations ai
      JOIN numerology_readings nr ON ai.reading_id = nr.id
      WHERE ai.reading_id = ? AND ai.user_id = ?
      ORDER BY ai.created_at DESC
      LIMIT 1
    `).get(reading_id, user_id);
    
    if (!interpretation) {
      return res.status(404).json({
        error: 'AI解读结果不存在'
      });
    }

    res.json({
      success: true,
      data: {
        id: interpretation.id,
        reading_id: interpretation.reading_id,
        content: interpretation.content,
        model: interpretation.model,
        tokens_used: interpretation.tokens_used,
        success: interpretation.success === 1,
        error_message: interpretation.error_message,
        created_at: interpretation.created_at,
        updated_at: interpretation.updated_at,
        analysis_name: interpretation.name,
        analysis_type: interpretation.reading_type,
        analysis_created_at: interpretation.analysis_created_at
      }
    });
  } catch (error) {
    console.error('获取AI解读结果失败:', error);
    res.status(500).json({
      error: '获取AI解读结果失败',
      details: error.message
    });
  }
}));

// 获取用户的所有AI解读记录
router.get('/list', authenticate, asyncHandler(async (req, res) => {
  try {
    const user_id = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { reading_type } = req.query;
    const offset = (page - 1) * limit;
    const db = getDB();

    let whereClause = 'WHERE ai.user_id = ?';
    let params = [user_id];

    if (reading_type) {
      whereClause += ' AND nr.reading_type = ?';
      params.push(reading_type);
    }

    const interpretations = db.prepare(`
      SELECT ai.*, nr.name, nr.birth_date, nr.reading_type, nr.created_at as analysis_created_at
      FROM ai_interpretations ai
      JOIN numerology_readings nr ON ai.reading_id = nr.id
      ${whereClause}
      ORDER BY ai.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    // 获取总数
    const totalResult = db.prepare(`
      SELECT COUNT(*) as count
      FROM ai_interpretations ai
      JOIN numerology_readings nr ON ai.reading_id = nr.id
      ${whereClause}
    `).get(...params);
    const total = totalResult.count;

    res.json({
      success: true,
      data: interpretations.map(item => ({
        id: item.id,
        reading_id: item.reading_id,
        analysis_type: item.reading_type,
        content: item.content,
        model: item.model,
        tokens_used: item.tokens_used,
        success: item.success === 1,
        error_message: item.error_message,
        created_at: item.created_at,
        updated_at: item.updated_at,
        analysis_name: item.name,
        analysis_birth_date: item.birth_date,
        analysis_created_at: item.analysis_created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取AI解读列表失败:', error);
    res.status(500).json({
      error: '获取AI解读列表失败',
      details: error.message
    });
  }
}));

// 删除AI解读结果
router.delete('/delete/:reading_id', authenticate, asyncHandler(async (req, res) => {
  try {
    const { reading_id } = req.params;
    const user_id = req.user.id;
    const db = getDB();

    const deleteStmt = db.prepare(
      'DELETE FROM ai_interpretations WHERE reading_id = ? AND user_id = ?'
    );
    const result = deleteStmt.run(reading_id, user_id);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'AI解读结果不存在或无权限删除'
      });
    }

    res.json({
      success: true,
      message: 'AI解读结果删除成功'
    });
  } catch (error) {
    console.error('删除AI解读结果失败:', error);
    res.status(500).json({
      error: '删除AI解读结果失败',
      details: error.message
    });
  }
}));

module.exports = router;