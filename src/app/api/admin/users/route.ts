import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireSuperAdmin } from '@/lib/auth';
import db from '@/lib/db';

// GET - 获取用户列表（管理员可见）
export async function GET() {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const users = await db.all(`
    SELECT id, username, nickname, avatar, role, created_at,
      (SELECT COUNT(*) FROM posts WHERE user_id = users.id) AS post_count,
      (SELECT COUNT(*) FROM comments WHERE user_id = users.id) AS comment_count
    FROM users
    ORDER BY CASE role WHEN 'super_admin' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, created_at ASC
  `);

  return NextResponse.json({ users });
}

// PUT - 修改用户角色（仅超级管理员）
export async function PUT(request: NextRequest) {
  try {
    await requireSuperAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const { userId, role } = await request.json();

  if (!userId || !['admin', 'user'].includes(role)) {
    return NextResponse.json({ error: '参数错误' }, { status: 400 });
  }

  // 不能修改自己的角色
  const currentUser = await requireSuperAdmin();
  if (currentUser.id === userId) {
    return NextResponse.json({ error: '不能修改自己的角色' }, { status: 400 });
  }

  await db.run('UPDATE users SET role = ? WHERE id = ?', role, userId);

  return NextResponse.json({ message: '角色更新成功' });
}
