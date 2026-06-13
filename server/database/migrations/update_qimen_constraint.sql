-- 更新numerology_readings表的CHECK约束以支持qimen类型
-- 由于SQLite不支持直接修改CHECK约束，需要重建表

BEGIN TRANSACTION;

-- 创建临时表，包含新的CHECK约束
CREATE TABLE numerology_readings_temp (
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

-- 复制现有数据到临时表
INSERT INTO numerology_readings_temp 
SELECT id, user_id, reading_type, name, birth_date, birth_time, birth_place, gender, 
       input_data, results, analysis, status, created_at, updated_at 
FROM numerology_readings;

-- 删除原表
DROP TABLE numerology_readings;

-- 重命名临时表为原表名
ALTER TABLE numerology_readings_temp RENAME TO numerology_readings;

COMMIT;

-- 验证更新
SELECT name FROM sqlite_master WHERE type='table' AND name='numerology_readings';