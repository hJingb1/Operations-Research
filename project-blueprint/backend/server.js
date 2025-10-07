// backend/server.js

const express = require('express');
const { Pool } = require('pg');
const http = require('http');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

const PORT = 8080;
const JWT_SECRET = 'your-super-secret-key-for-dev'; // 生产环境中应使用环境变量

// --- 中间件 ---
app.use(bodyParser.json());

// --- 数据库连接池 ---
const dbConnectionString = 'postgresql://postgres:2q257fhj@blueprint-db-postgresql.ns-3cnjew51.svc:5432';
const pool = new Pool({ connectionString: dbConnectionString });

// --- 认证中间件 (Authentication Middleware) ---
// 这是一个守卫，会检查所有需要登录才能访问的API请求
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Token格式应为 "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ error: 'No token provided.' }); // 401 Unauthorized
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token is invalid.' }); // 403 Forbidden
        }
        // 将解码后的用户信息附加到请求对象上，供后续路由使用
        req.user = user;
        next(); // Token有效，放行
    });
};

// --- API 路由 ---

// 1. 用户登录 API (无变化)
app.post('/api/auth/login', async (req, res) => {
    const { name, studentId } = req.body;
    if (!name || !studentId) {
        return res.status(400).json({ error: 'Name and studentId are required.' });
    }
    try {
        const result = await pool.query('SELECT * FROM Users WHERE name = $1 AND student_id = $2', [name, studentId]);
        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const token = jwt.sign({ userId: user.id, name: user.name, studentId: user.student_id }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ message: 'Login successful!', token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. 获取排行榜 API (无变化)
app.get('/api/leaderboard', async (req, res) => {
    const { track } = req.query;
    if (!['cost', 'time', 'weighted'].includes(track)) {
        return res.status(400).json({ error: 'Invalid track specified.' });
    }
    try {
        const query = `
            SELECT u.name, s.score, s.project_duration, s.total_cost, s.submitted_at
            FROM Submissions s JOIN Users u ON s.user_id = u.id
            WHERE s.track = $1 ORDER BY s.score ASC LIMIT 20;
        `;
        const result = await pool.query(query, [track]);
        res.json(result.rows);
    } catch (err) {
        console.error('Leaderboard fetch error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. 提交分数 API (【核心】新增)
// 我们将 authMiddleware 应用于此路由，所以它需要有效的JWT才能访问
app.post('/api/submissions', authMiddleware, async (req, res) => {
    const userId = req.user.userId; // 从认证中间件中获取用户ID
    const { track, score, projectDuration, totalCost, details } = req.body;

    // 数据验证
    if (!track || score == null || projectDuration == null || totalCost == null) {
        return res.status(400).json({ error: 'Missing required submission data.' });
    }

    try {
        // 使用 PostgreSQL 的 "UPSERT" (Update or Insert) 功能，非常高效
        // ON CONFLICT...DO UPDATE 会在 (user_id, track) 组合已存在时执行更新
        const upsertQuery = `
            INSERT INTO Submissions (user_id, track, score, project_duration, total_cost, details)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id, track)
            DO UPDATE SET
                score = EXCLUDED.score,
                project_duration = EXCLUDED.project_duration,
                total_cost = EXCLUDED.total_cost,
                details = EXCLUDED.details,
                submitted_at = CURRENT_TIMESTAMP
            WHERE
                -- 关键：只有当新分数低于旧分数时，才执行更新
                Submissions.score > EXCLUDED.score;
        `;
        
        const result = await pool.query(upsertQuery, [userId, track, score, projectDuration, totalCost, details || {}]);

        if (result.rowCount > 0) {
            // rowCount > 0 意味着记录被成功插入或更新了
            res.status(200).json({ message: 'Submission successful! Your new best score has been recorded.' });
        } else {
            // rowCount = 0 意味着记录已存在，但新分数没有更好
            res.status(200).json({ message: 'Submission received, but it was not better than your previous best score.' });
        }
    } catch (err) {
        console.error('Submission error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- 启动服务器 ---
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
  // ... (数据库连接检查部分无变化)
});
