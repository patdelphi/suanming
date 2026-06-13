const { getDB } = require('./server/database/index.cjs');

/**
 * 修复字符串ID的AI解读记录，尝试关联到对应的历史记录
 */
function fixStringIdRecords() {
  try {
    // 初始化数据库连接
    const { dbManager } = require('./server/database/index.cjs');
    dbManager.init();
    const db = getDB();
    
    console.log('=== 开始修复字符串ID的AI解读记录 ===\n');
    
    // 1. 获取所有字符串ID的AI解读记录
    const stringIdRecords = db.prepare(`
      SELECT * FROM ai_interpretations
      WHERE analysis_id NOT GLOB '[0-9]*'
      ORDER BY created_at DESC
    `).all();
    
    console.log(`找到 ${stringIdRecords.length} 条字符串ID记录需要修复`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    stringIdRecords.forEach((record, index) => {
      console.log(`\n处理记录 ${index + 1}/${stringIdRecords.length}:`);
      console.log(`  AI记录ID: ${record.id}`);
      console.log(`  analysis_id: ${record.analysis_id}`);
      console.log(`  analysis_type: ${record.analysis_type}`);
      console.log(`  created_at: ${record.created_at}`);
      
      // 尝试根据时间戳和类型找到最匹配的历史记录
      const possibleHistoryRecords = db.prepare(`
        SELECT 
          id,
          name,
          reading_type,
          created_at,
          ABS(strftime('%s', created_at) - strftime('%s', ?)) as time_diff
        FROM numerology_readings
        WHERE reading_type = ? AND user_id = ?
        ORDER BY time_diff ASC
        LIMIT 5
      `).all(record.created_at, record.analysis_type, record.user_id);
      
      if (possibleHistoryRecords.length > 0) {
        const bestMatch = possibleHistoryRecords[0];
        const timeDiffHours = bestMatch.time_diff / 3600; // 转换为小时
        
        console.log(`  找到 ${possibleHistoryRecords.length} 个可能的匹配记录:`);
        possibleHistoryRecords.forEach((match, i) => {
          const diffHours = match.time_diff / 3600;
          console.log(`    ${i + 1}. ID: ${match.id}, name: ${match.name}, 时间差: ${diffHours.toFixed(2)}小时`);
        });
        
        // 如果时间差在24小时内，认为是合理的匹配
        if (timeDiffHours <= 24) {
          console.log(`  ✅ 选择最佳匹配: ID ${bestMatch.id} (时间差: ${timeDiffHours.toFixed(2)}小时)`);
          
          // 检查是否已经有AI解读记录关联到这个历史记录
          const existingAI = db.prepare(`
            SELECT id FROM ai_interpretations
            WHERE analysis_id = ? AND user_id = ?
          `).get(bestMatch.id.toString(), record.user_id);
          
          if (existingAI) {
            console.log(`  ⚠️  历史记录 ${bestMatch.id} 已经有AI解读记录，跳过修复`);
            skippedCount++;
          } else {
            // 更新AI解读记录的analysis_id
            const updateResult = db.prepare(`
              UPDATE ai_interpretations
              SET analysis_id = ?
              WHERE id = ?
            `).run(bestMatch.id.toString(), record.id);
            
            if (updateResult.changes > 0) {
              console.log(`  ✅ 成功更新: analysis_id ${record.analysis_id} → ${bestMatch.id}`);
              fixedCount++;
            } else {
              console.log(`  ❌ 更新失败`);
            }
          }
        } else {
          console.log(`  ⚠️  最佳匹配的时间差过大 (${timeDiffHours.toFixed(2)}小时)，跳过修复`);
          skippedCount++;
        }
      } else {
        console.log(`  ❌ 没有找到匹配的历史记录`);
        skippedCount++;
      }
    });
    
    console.log('\n=== 修复完成 ===');
    console.log(`总处理记录: ${stringIdRecords.length}`);
    console.log(`成功修复: ${fixedCount}`);
    console.log(`跳过修复: ${skippedCount}`);
    
    // 验证修复结果
    console.log('\n=== 验证修复结果 ===');
    const remainingStringIds = db.prepare(`
      SELECT COUNT(*) as count FROM ai_interpretations
      WHERE analysis_id NOT GLOB '[0-9]*'
    `).get();
    
    console.log(`剩余字符串ID记录: ${remainingStringIds.count}`);
    
    const totalAIRecords = db.prepare(`
      SELECT COUNT(*) as count FROM ai_interpretations
    `).get();
    
    console.log(`总AI解读记录: ${totalAIRecords.count}`);
    
    // 重新统计匹配情况
    const matchedRecords = db.prepare(`
      SELECT COUNT(*) as count
      FROM ai_interpretations ai
      JOIN numerology_readings nr ON ai.analysis_id = nr.id AND ai.user_id = nr.user_id
    `).get();
    
    console.log(`成功匹配的记录: ${matchedRecords.count}`);
    console.log(`匹配率: ${((matchedRecords.count / totalAIRecords.count) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('修复过程中发生错误:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fixStringIdRecords();
}

module.exports = { fixStringIdRecords };