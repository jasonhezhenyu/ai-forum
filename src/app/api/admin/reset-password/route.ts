import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const { userId, newPassword } = await request.json();

  if (!userId || !newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: '参数错误，密码至少6位' }, { status: 400 });
  }

  const user = await db.get('SELECT id, username FROM users WHERE id = ?', userId) as any;
  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await db.run('UPDATE users SET password_hash = ? WHERE id = ?', hash, userId);

  // 清除该用户所有旧 session
  await db.run('DELETE FROM sessions WHERE user_id = ?', userId);

  return NextResponse.json({ message: `用户 ${user.username} 的密码已重置为 ${newPassword}` });
}
