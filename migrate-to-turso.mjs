// 纯 JS 迁移脚本 - 不依赖 process.cwd()
import { createRequire } from 'module';
const require = createRequire('/Users/hezhenyu/ai-forum_副本/');

const TURSO_URL = 'libsql://ai-forum-lun-tan-jasonhe.aws-ap-northeast-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY5NzMzNTUsImlkIjoiMDFhMDBmZTctY2UwMS03NWJiLTkzNmUtMjEyZWZhY2YwODc3Iiwia2lkIjoiODlaZDhzbmlzWllCTUxNemFMNzBOV3BGa2o4UXB1aWpKWmVTZ2hMN3dTQSIsInJpZCI6ImQ3NTcyZGQ5LWMzYWItNGRhNy1hZmFiLTYxOWY5NTA0ZDUxNSJ9.Aq0y5utkC9T0P7Yzy4PGFJg2vYHbWKWWOrrvq9qkNkCbHKgPtEqedVTgm_wYnGG2bV8x6X4no7VszI4cTnISDQ';
const DB_PATH = '/Users/hezhenyu/ai-forum_副本/forum.db';

const TABLES = ['users', 'sessions', 'categories', 'posts', 'comments', 'likes', 'notifications'];

async function migrate() {
  const Database = require('better-sqlite3');
  const { createClient } = require('@libsql/client');

  console.log('📦 读取本地数据库:', DB_PATH);
  const localDb = new Database(DB_PATH);
  const cloud = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  // 云库建表
  const schemaSQL = [
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, nickname TEXT DEFAULT '', avatar TEXT DEFAULT '', role TEXT DEFAULT 'user', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, token TEXT UNIQUE NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))`,
    `CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, description TEXT DEFAULT '')`,
    `CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, content TEXT NOT NULL, user_id INTEGER NOT NULL, category_id INTEGER, is_pinned INTEGER DEFAULT 0, is_featured INTEGER DEFAULT 0, view_count INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (category_id) REFERENCES categories(id))`,
    `CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT NOT NULL, user_id INTEGER NOT NULL, post_id INTEGER NOT NULL, parent_id INTEGER DEFAULT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS likes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, post_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, post_id), FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, type TEXT NOT NULL, message TEXT NOT NULL, post_id INTEGER, from_user_id INTEGER, is_read INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE, FOREIGN KEY (from_user_id) REFERENCES users(id))`,
  ];
  for (const sql of schemaSQL) await cloud.execute(sql);
  console.log('☁️ 云库表已创建');

  for (const table of TABLES) {
    const rows = localDb.prepare(`SELECT * FROM ${table}`).all();
    if (rows.length === 0) { console.log(`⏭️  ${table}: 0条，跳过`); continue; }
    const cols = Object.keys(rows[0]);
    const placeholders = cols.map(() => '?').join(', ');
    const sql = `INSERT OR IGNORE INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`;
    for (const row of rows) {
      await cloud.execute({ sql, args: cols.map(c => row[c]) });
    }
    console.log(`✅ ${table}: ${rows.length} 条已迁移`);
  }

  console.log('\n📊 云库验证:');
  for (const table of TABLES) {
    const r = await cloud.execute(`SELECT COUNT(*) as cnt FROM ${table}`);
    console.log(`  ${table}: ${r.rows[0].cnt} 条`);
  }

  localDb.close();
  cloud.close();
  console.log('\n🎉 迁移完成！');
}

migrate().catch(e => { console.error('❌ 失败:', e.message, e.stack); process.exit(1); });
