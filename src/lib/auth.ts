import { cookies } from 'next/headers';
import db from './db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export type UserRole = 'super_admin' | 'admin' | 'user';

export interface User {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  role: UserRole;
}

// 注册新用户
export async function registerUser(username: string, password: string, nickname?: string) {
  const existing = await db.get('SELECT id FROM users WHERE username = ?', username);
  if (existing) {
    return { success: false, error: '用户名已存在' };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const displayName = nickname || username;
  const result = await db.run(
    'INSERT INTO users (username, password_hash, nickname) VALUES (?, ?, ?)',
    username, passwordHash, displayName
  );

  return { success: true, userId: result.lastInsertRowid };
}

// 验证登录
export async function loginUser(username: string, password: string) {
  const user = await db.get(
    'SELECT id, username, nickname, avatar, role, password_hash FROM users WHERE username = ?',
    username
  ) as { id: number; username: string; nickname: string; avatar: string; role: string; password_hash: string } | undefined;

  if (!user) {
    return { success: false, error: '用户名或密码错误' };
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return { success: false, error: '用户名或密码错误' };
  }

  const token = crypto.randomBytes(32).toString('hex');
  await db.run('INSERT INTO sessions (user_id, token) VALUES (?, ?)', user.id, token);

  return {
    success: true,
    token,
    userId: user.id,
    username: user.username,
    nickname: user.nickname || user.username,
    avatar: user.avatar || '',
    role: user.role as UserRole,
  };
}

// 获取当前用户
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) return null;

  const session = await db.get(`
    SELECT users.id, users.username, users.nickname, users.avatar, users.role
    FROM sessions
    JOIN users ON sessions.user_id = users.id
    WHERE sessions.token = ?
  `, token) as User | undefined;

  return session || null;
}

// 退出登录
export async function logoutUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (token) {
    await db.run('DELETE FROM sessions WHERE token = ?', token);
  }
}

// 要求登录
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error('请先登录');
  return user;
}

// 要求管理员（含超级管理员）
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    throw new Error('需要管理员权限');
  }
  return user;
}

// 仅超级管理员
export async function requireSuperAdmin(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== 'super_admin') {
    throw new Error('需要超级管理员权限');
  }
  return user;
}

// 是否管理员
export function isAdmin(role: UserRole): boolean {
  return role === 'admin' || role === 'super_admin';
}
