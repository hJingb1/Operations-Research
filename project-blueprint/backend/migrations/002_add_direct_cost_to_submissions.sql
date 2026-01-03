-- 为Submissions表添加direct_cost字段
-- 使用方法: psql -U postgres -d operations_research -f 002_add_direct_cost_to_submissions.sql

-- 1. 添加direct_cost字段
ALTER TABLE Submissions
ADD COLUMN IF NOT EXISTS direct_cost NUMERIC;

-- 2. 更新现有数据（如果total_cost已经是全生命周期总成本）
-- 假设日均间接费用为12000元/天
UPDATE Submissions
SET direct_cost = total_cost - (project_duration * 12000)
WHERE direct_cost IS NULL;

-- 3. 设置direct_cost为NOT NULL（在更新完现有数据后）
ALTER TABLE Submissions
ALTER COLUMN direct_cost SET NOT NULL;

-- 4. 添加注释说明字段含义
COMMENT ON COLUMN Submissions.total_cost IS '全生命周期总成本 = direct_cost + (project_duration × 12000)';
COMMENT ON COLUMN Submissions.direct_cost IS '直接成本（所有任务成本之和）';
COMMENT ON COLUMN Submissions.score IS '排名分数（等于total_cost）';

-- 5. 验证数据
SELECT
    u.name,
    s.direct_cost,
    s.project_duration,
    s.total_cost,
    s.total_cost - (s.project_duration * 12000) AS calculated_direct_cost,
    CASE
        WHEN ABS(s.direct_cost - (s.total_cost - (s.project_duration * 12000))) < 0.01
        THEN '✓ 一致'
        ELSE '✗ 不一致'
    END AS validation
FROM Submissions s
JOIN Users u ON s.user_id = u.id
LIMIT 10;
