/**
 * 数据库迁移系统
 * 提供版本控制的数据库迁移管理
 */
const path = require('path');
const fs = require('fs');

class MigrationManager {
  constructor(db) {
    this.db = db;
    this.migrationsDir = path.join(__dirname, 'migrations');
    this.ensureMigrationsTable();
  }

  /**
   * 确保迁移记录表存在
   */
  ensureMigrationsTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        checksum TEXT NOT NULL
      );
    `);
  }

  /**
   * 获取已应用的迁移列表
   */
  getAppliedMigrations() {
    return this.db.prepare('SELECT version, name, applied_at FROM schema_migrations ORDER BY version ASC').all();
  }

  /**
   * 获取当前数据库版本
   */
  getCurrentVersion() {
    const result = this.db.prepare('SELECT MAX(version) as version FROM schema_migrations').get();
    return result?.version || 0;
  }

  /**
   * 加载迁移文件
   */
  loadMigrations() {
    if (!fs.existsSync(this.migrationsDir)) {
      console.log('迁移目录不存在，创建空目录');
      fs.mkdirSync(this.migrationsDir, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(this.migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    return files.map(file => {
      const match = file.match(/^(\d{4})_(.+)\.sql$/);
      if (!match) {
        console.warn(`跳过无效的迁移文件名: ${file}`);
        return null;
      }

      const version = parseInt(match[1]);
      const name = match[2];
      const content = fs.readFileSync(path.join(this.migrationsDir, file), 'utf8');
      const checksum = this.calculateChecksum(content);

      return { version, name, content, checksum, file };
    }).filter(Boolean);
  }

  /**
   * 计算SQL内容校验和
   */
  calculateChecksum(sql) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(sql.trim()).digest('hex');
  }

  /**
   * 运行所有待执行的迁移
   */
  run() {
    const applied = this.getAppliedMigrations();
    const appliedVersions = new Set(applied.map(m => m.version));
    const migrations = this.loadMigrations();

    const pending = migrations.filter(m => !appliedVersions.has(m.version));

    if (pending.length === 0) {
      console.log('✅ 数据库已是最新版本');
      return { applied: 0, total: migrations.length };
    }

    console.log(`🔄 发现 ${pending.length} 个待迁移，开始执行...`);

    let appliedCount = 0;
    const transaction = this.db.transaction((migration) => {
      try {
        // 执行迁移SQL
        this.db.exec(migration.content);

        // 记录迁移信息
        this.db.prepare(
          'INSERT INTO schema_migrations (version, name, checksum) VALUES (?, ?, ?)'
        ).run(migration.version, migration.name, migration.checksum);

        appliedCount++;
        console.log(`  ✅ [${migration.version}] ${migration.name} 执行成功`);
      } catch (error) {
        console.error(`  ❌ [${migration.version}] ${migration.name} 执行失败:`, error.message);
        throw error;
      }
    });

    for (const migration of pending) {
      transaction(migration);
    }

    console.log(`🎉 成功应用 ${appliedCount} 个迁移`);
    return { applied: appliedCount, total: migrations.length };
  }

  /**
   * 回滚到指定版本
   */
  rollback(targetVersion) {
    const applied = this.getAppliedMigrations();
    const toRollback = applied.filter(m => m.version > targetVersion).reverse();

    if (toRollback.length === 0) {
      console.log('没有需要回滚的迁移');
      return { rolledBack: 0 };
    }

    console.log(`🔄 回滚 ${toRollback.length} 个迁移到版本 ${targetVersion}...`);

    let rolledBackCount = 0;
    for (const migration of toRollback) {
      const rollbackFile = path.join(this.migrationsDir, `${migration.version}_${migration.name}.rollback.sql`);
      
      if (!fs.existsSync(rollbackFile)) {
        console.warn(`  ⚠️  跳过 [${migration.version}] ${migration.name} - 回滚文件不存在`);
        continue;
      }

      const rollbackSql = fs.readFileSync(rollbackFile, 'utf8');
      
      try {
        const transaction = this.db.transaction(() => {
          this.db.exec(rollbackSql);
          this.db.prepare('DELETE FROM schema_migrations WHERE version = ?').run(migration.version);
        });
        transaction();

        rolledBackCount++;
        console.log(`  ✅ [${migration.version}] ${migration.name} 回滚成功`);
      } catch (error) {
        console.error(`  ❌ [${migration.version}] ${migration.name} 回滚失败:`, error.message);
        throw error;
      }
    }

    console.log(`🎉 成功回滚 ${rolledBackCount} 个迁移`);
    return { rolledBack: rolledBackCount };
  }

  /**
   * 获取迁移状态信息
   */
  getStatus() {
    const applied = this.getAppliedMigrations();
    const migrations = this.loadMigrations();
    const appliedVersions = new Set(applied.map(m => m.version));

    const status = migrations.map(m => ({
      version: m.version,
      name: m.name,
      applied: appliedVersions.has(m.version),
      appliedAt: applied.find(a => a.version === m.version)?.applied_at || null,
    }));

    return {
      currentVersion: this.getCurrentVersion(),
      totalMigrations: migrations.length,
      appliedCount: applied.length,
      pendingCount: migrations.length - applied.length,
      migrations: status,
    };
  }
}

module.exports = MigrationManager;
