// backend/seed-users.js

const { Pool } = require('pg');

// 【重要】在这里粘贴你硬编码的数据库连接字符串
const dbConnectionString = 'postgresql://postgres:2q257fhj@blueprint-db-postgresql.ns-3cnjew51.svc:5432';

const pool = new Pool({ connectionString: dbConnectionString });

// ===================================================================
// 【核心修改】我们不再读取CSV文件，而是直接在这里定义学生数据
// 您可以在这个数组里添加或修改学生名单
const students = [
  { name: '张三', student_id: '2023001' },
  { name: '李四', student_id: '2023002' },
  { name: '王五', student_id: '2023003' },
  // ... 在这里添加更多学生
];
// ===================================================================

async function seedUsers() {
  console.log('Starting to seed users into the database...');
  
  const client = await pool.connect();
  try {
    // 使用事务确保所有用户要么全部插入，要么全部失败
    await client.query('BEGIN');
    
    let insertedCount = 0;
    for (const user of students) {
      // ON CONFLICT DO NOTHING 确保如果学号已存在，则不会报错，直接跳过
      const query = 'INSERT INTO Users (name, student_id) VALUES ($1, $2) ON CONFLICT (student_id) DO NOTHING RETURNING *';
      const result = await client.query(query, [user.name, user.student_id]);
      if (result.rowCount > 0) {
        insertedCount++;
      }
    }
    
    await client.query('COMMIT');
    console.log(`✅ Seeding complete. Processed ${students.length} students, inserted ${insertedCount} new users.`);
    
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding users:', e);
  } finally {
    client.release();
    pool.end();
  }
}

// 立即执行该函数
seedUsers();