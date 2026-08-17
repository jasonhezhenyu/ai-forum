import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';
import path from 'path';

const TURSO_URL = 'libsql://ai-forum-lun-tan-jasonhe.aws-ap-northeast-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY5NzMzNTUsImlkIjoiMDFhMDBmZTctY2UwMS03NWJiLTkzNmUtMjEyZWZhY2YwODc3Iiwia2lkIjoiODlaZDhzbmlzWllCTUxNemFMNzBOV3BGa2o4UXB1aWpKWmVTZ2hMN3dTQSIsInJpZCI6ImQ3NTcyZGQ5LWMzYWItNGRhNy1hZmFiLTYxOWY5NTA0ZDUxNSJ9.Aq0y5utkC9T0P7Yzy4PGFJg2vYHbWKWWOrrvq9qkNkCbHKgPtEqedVTgm_wYnGG2bV8x6X4no7VszI4cTnISDQ';

const DB_PATH = path.join(process.cwd(), 'forum.db');

// 迁移顺序：按外键依赖排列
const TABLES = ['users', 'sessions', 'categories', 'posts', 'comments', 'likes', 'notifications'];

async function migrate() {
  console.log('📦 读取本地数据库:', DB_PATH);
  const localDb = new Database(DB_PATH);
  
  const cloudClient = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
  
  // 先检查云库现有数据
  const cloudUsers = await cloudClient.execute('SELECT COUNT(*) as cnt FROM users');
  console.log('☁️ 云库当前用户数:', cloudUsers.rows[0].cnt);
  
  for (const table of TABLES) {
    const rows = localDb.prepare(`SELECT * FROM ${table}`).all() as any[];
    if (rows.length === 0) {
      console.log(`⏭️  ${table}: 0 条，跳过`);
      continue;
    }

    // 获取列名
    const columns = Object.keys(rows[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const colStr = columns.join(', ');
    const sql = `INSERT OR IGNORE INTO ${table} (${colStr}) VALUES (${placeholders})`;

    let migrated = 0;
    for (const row of rows) {
      const values = columns.map(col => row[col]);
      await cloudClient.execute({ sql, args: values });
      migrated++;
    }
    console.log(`✅ ${table}: ${migrated}/${rows.length} 条已迁移`);
  }

  // 验证
  console.log('\n📊 云库验证:');
  for (const table of TABLES) {
    const result = await cloudClient.execute(`SELECT COUNT(*) as cnt FROM ${table}`);
    console.log(`  ${table}: ${result.rows[0].cnt} 条`);
  }

  localDb.close();
  cloudClient.close();
  console.log('\n🎉 数据迁移完成！');
}

migrate().catch(err => {
  console.error('❌ 迁移失败:', err.message);
  process.exit(1);
});
