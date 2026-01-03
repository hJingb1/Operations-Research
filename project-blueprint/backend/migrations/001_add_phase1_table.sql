-- 阶段1成绩表
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

-- 为user_id创建索引
CREATE INDEX idx_phase1_user ON Phase1Results(user_id);