import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// 将当前用户设为超级管理员（仅当还没有超级管理员时可用）
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  // 检查是否已有超级管理员
  const existing = await db.get(
    "SELECT id FROM users WHERE role = 'super_admin'"
  );

  if (existing) {
    return NextResponse.json({ error: '已存在超级管理员，无法重复设置' }, { status: 400 });
  }

  await db.run("UPDATE users SET role = 'super_admin' WHERE id = ?", user.id);

  return NextResponse.json({
    message: '你已成为超级管理员！',
    role: 'super_admin',
  });
}
