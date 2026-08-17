import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  const { username, password, nickname } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
  }

  if (username.length < 2 || username.length > 20) {
    return NextResponse.json({ error: '用户名长度需在 2-20 个字符之间' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: '密码长度至少 6 位' }, { status: 400 });
  }

  const result = await registerUser(username, password, nickname);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // 第一个注册的用户自动成为超级管理员
  const userCount = (await db.get('SELECT COUNT(*) AS count FROM users') as { count: number }).count;
  if (userCount === 1) {
    await db.run("UPDATE users SET role = 'super_admin' WHERE id = ?", result.userId);
    return NextResponse.json({ message: '注册成功！你是首位用户，已自动成为超级管理员' });
  }

  return NextResponse.json({ message: '注册成功' });
}
