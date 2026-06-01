-- 迁移示例：创建AI解读表
-- 版本: 0001
-- 描述: 初始数据库结构

-- 此文件包含首次创建的完整schema
-- 实际运行时只会执行尚未存在的表创建语句

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户档案表
CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT,
    full_name TEXT,
    birth_date TEXT,
    birth_time TEXT,
    birth_location TEXT,
    gender TEXT CHECK (gender IN ('male', 'female')),
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 命理分析记录表
CREATE TABLE IF NOT EXISTS numerology_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    reading_type TEXT NOT NULL CHECK (reading_type IN ('bazi', 'ziwei', 'yijing', 'wuxing', 'qimen')),
    name TEXT,
    birth_date TEXT,
    birth_time TEXT,
    birth_place TEXT,
    gender TEXT,
    input_data TEXT,
    results TEXT,
    analysis TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 下载历史表
CREATE TABLE IF NOT EXISTS download_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('bazi', 'ziwei', 'yijing')),
    format TEXT NOT NULL CHECK (format IN ('markdown', 'pdf', 'png')),
    filename TEXT NOT NULL,
    file_size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 会话表
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- AI解读结果表
CREATE TABLE IF NOT EXISTS ai_interpretations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    reading_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    model TEXT,
    tokens_used INTEGER,
    success BOOLEAN DEFAULT 1,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reading_id) REFERENCES numerology_readings(id) ON DELETE CASCADE,
    UNIQUE(reading_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_readings_user_id ON numerology_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_readings_type ON numerology_readings(reading_type);
CREATE INDEX IF NOT EXISTS idx_readings_created_at ON numerology_readings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_interpretations_user_id ON ai_interpretations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interpretations_reading_id ON ai_interpretations(reading_id);
CREATE INDEX IF NOT EXISTS idx_ai_interpretations_created_at ON ai_interpretations(created_at DESC);

-- 触发器
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_user_profiles_timestamp 
    AFTER UPDATE ON user_profiles
    FOR EACH ROW
    BEGIN
        UPDATE user_profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_numerology_readings_timestamp 
    AFTER UPDATE ON numerology_readings
    FOR EACH ROW
    BEGIN
        UPDATE numerology_readings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_ai_interpretations_timestamp 
    AFTER UPDATE ON ai_interpretations
    FOR EACH ROW
    BEGIN
        UPDATE ai_interpretations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS cleanup_expired_sessions
    AFTER INSERT ON user_sessions
    FOR EACH ROW
    BEGIN
        DELETE FROM user_sessions WHERE expires_at < datetime('now');
    END;
