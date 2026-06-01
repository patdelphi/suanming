/**
 * 数据库迁移CLI脚本
 * 用法: node server/scripts/db-migrate.cjs [status|rollback <version>]
 */
const { dbManager } = require('../database/index.cjs');

const action = process.argv[2] || 'status';
const targetVersion = parseInt(process.argv[3]) || 0;

try {
  // 初始化数据库
  dbManager.init();
  console.log('');

  switch (action) {
    case 'status':
      console.log('📊 数据库迁移状态:');
      const status = dbManager.getMigrationStatus();
      console.log(`   当前版本: v${String(status.currentVersion).padStart(4, '0')}`);
      console.log(`   总迁移数: ${status.totalMigrations}`);
      console.log(`   已应用: ${status.appliedCount}`);
      console.log(`   待执行: ${status.pendingCount}`);
      console.log('');
      console.log('迁移列表:');
      status.migrations.forEach(m => {
        const icon = m.applied ? '✅' : '⬜';
        const appliedAt = m.appliedAt ? ` (应用时间: ${m.appliedAt})` : '';
        console.log(`   ${icon} [${m.version}] ${m.name}${appliedAt}`);
      });
      break;

    case 'rollback':
      if (!targetVersion) {
        console.error('❌ 请指定回滚目标版本: node server/scripts/db-migrate.cjs rollback <version>');
        process.exit(1);
      }
      console.log(`🔄 开始回滚到版本 ${targetVersion}...`);
      const result = dbManager.rollback(targetVersion);
      console.log(`✅ 回滚完成: 回滚了 ${result.rolledBack} 个迁移`);
      break;

    default:
      console.error(`❌ 未知操作: ${action}`);
      console.log('可用操作: status, rollback <version>');
      process.exit(1);
  }

  // 关闭数据库
  dbManager.close();
} catch (error) {
  console.error('❌ 操作失败:', error.message);
  process.exit(1);
}
