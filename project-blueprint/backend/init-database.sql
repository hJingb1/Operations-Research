-- 初始化本地PostgreSQL数据库
-- 使用方法: psql -U postgres -d operations_research -f init-database.sql

-- 1. 创建用户表
CREATE TABLE IF NOT EXISTS Users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 创建阶段1成绩表
CREATE TABLE IF NOT EXISTS Phase1Results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id) UNIQUE,
    is_passed BOOLEAN DEFAULT FALSE,
    score INTEGER DEFAULT 0,
    final_duration INTEGER,
    submit_attempts INTEGER DEFAULT 0,
    passed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 创建阶段2提交表
CREATE TABLE IF NOT EXISTS Submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(id),
    track VARCHAR(20) NOT NULL CHECK (track IN ('cost', 'time', 'weighted')),
    score NUMERIC NOT NULL,
    project_duration INTEGER NOT NULL,
    total_cost NUMERIC NOT NULL,
    details JSONB,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, track)
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_phase1_user ON Phase1Results(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_track ON Submissions(track, score);

-- 5. 插入测试用户数据
INSERT INTO Users (name, student_id) VALUES
    ('张三', '2021001'),
    ('李四', '2021002'),
    ('王五', '2021003'),
    ('赵六', '2021004'),
    ('钱七', '2021005'),
    ('测试学生A', '2021010'),
    ('测试学生B', '2021011'),
    ('测试学生C', '2021012')
ON CONFLICT (student_id) DO NOTHING;

-- 6. 验证数据
SELECT '===== 用户表 =====' AS info;
SELECT * FROM Users;

SELECT '===== 阶段1成绩表 =====' AS info;
SELECT * FROM Phase1Results;

SELECT '===== 阶段2提交表 =====' AS info;
SELECT * FROM Submissions;

-- 7. 显示统计信息
SELECT
    '数据库初始化完成' AS status,
    (SELECT COUNT(*) FROM Users) AS user_count,
    (SELECT COUNT(*) FROM Phase1Results) AS phase1_count,
    (SELECT COUNT(*) FROM Submissions) AS submission_count;
