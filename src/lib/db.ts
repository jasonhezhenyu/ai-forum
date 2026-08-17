import Database from 'better-sqlite3';
import path from 'path';

type Row = Record<string, any>;

// 云库模式：设置 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN 时走 Turso (libSQL)；
// 否则回落到本地 better-sqlite3（开发环境），两者共用同一套 SQL。
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

let localDb: Database.Database | null = null;
let tursoClient: any = null;

function getLocalDb(): Database.Database {
  if (!localDb) {
    localDb = new Database(path.join(process.cwd(), 'forum.db'));
    localDb.pragma('busy_timeout = 5000');
    localDb.pragma('journal_mode = WAL');
    localDb.pragma('foreign_keys = ON');
    localDb.pragma('synchronous = NORMAL');
  }
  return localDb;
}

async function getClient(): Promise<any> {
  if (!tursoClient) {
    const { createClient } = await import('@libsql/client');
    tursoClient = createClient({ url: tursoUrl!, authToken: tursoToken });
  }
  return tursoClient;
}

const CREATE_TABLES = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    is_pinned INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  )`,
  `CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    parent_id INTEGER DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    post_id INTEGER,
    from_user_id INTEGER,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES users(id)
  )`,
];

const MIGRATIONS = [
  `ALTER TABLE users ADD COLUMN nickname TEXT DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`,
  `ALTER TABLE posts ADD COLUMN is_pinned INTEGER DEFAULT 0`,
  `ALTER TABLE posts ADD COLUMN is_featured INTEGER DEFAULT 0`,
  `ALTER TABLE posts ADD COLUMN view_count INTEGER DEFAULT 0`,
  `ALTER TABLE comments ADD COLUMN parent_id INTEGER DEFAULT NULL`,
];

const DEFAULT_CATEGORIES: [string, string][] = [
  ['前沿资讯', '品质中台及 AI Agent 领域最新动态和资讯'],
  ['技术交流', '技术方案、架构设计和实现细节'],
  ['应用讨论', 'AI Agent 在品质中台的应用实践'],
  ['创新点子', '分享你的创意和想做的项目'],
  ['优化建议', '对现有方案提出改进建议'],
  ['其他', '不属于以上分类的话题'],
];

async function doEnsureSchema() {
  if (tursoUrl) {
    const client = await getClient();
    for (const sql of CREATE_TABLES) {
      await client.execute(sql);
    }
    for (const sql of MIGRATIONS) {
      try { await client.execute(sql); } catch { /* 列已存在 */ }
    }
    for (const [name, desc] of DEFAULT_CATEGORIES) {
      await client.execute({
        sql: 'INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)',
        args: [name, desc],
      });
    }
  } else {
    const ldb = getLocalDb();
    for (const sql of CREATE_TABLES) ldb.exec(sql);
    for (const sql of MIGRATIONS) {
      try { ldb.exec(sql); } catch { /* 列已存在 */ }
    }
    const insert = ldb.prepare('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)');
    for (const [name, desc] of DEFAULT_CATEGORIES) insert.run(name, desc);
  }
}

// 只初始化一次（缓存 Promise，避免并发重复建表）
let schemaPromise: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!schemaPromise) schemaPromise = doEnsureSchema();
  return schemaPromise;
}

export const db = {
  async get<T = Row>(sql: string, ...args: any[]): Promise<T | undefined> {
    await ensureSchema();
    if (tursoUrl) {
      const client = await getClient();
      const r = await client.execute({ sql, args });
      return r.rows[0] as T | undefined;
    }
    return getLocalDb().prepare(sql).get(...args) as T | undefined;
  },

  async all<T = Row>(sql: string, ...args: any[]): Promise<T[]> {
    await ensureSchema();
    if (tursoUrl) {
      const client = await getClient();
      const r = await client.execute({ sql, args });
      return r.rows as T[];
    }
    return getLocalDb().prepare(sql).all(...args) as T[];
  },

  async run(sql: string, ...args: any[]): Promise<{ changes: number; lastInsertRowid: number }> {
    await ensureSchema();
    if (tursoUrl) {
      const client = await getClient();
      const r = await client.execute({ sql, args });
      return { changes: r.rowsAffected, lastInsertRowid: Number(r.lastInsertRowid ?? 0) };
    }
    const r = getLocalDb().prepare(sql).run(...args);
    return { changes: r.changes, lastInsertRowid: Number(r.lastInsertRowid) };
  },
};

export default db;
