import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

// PUT - 更新昵称
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { nickname } = await request.json();

  if (!nickname || nickname.trim().length === 0) {
    return NextResponse.json({ error: '昵称不能为空' }, { status: 400 });
  }

  if (nickname.trim().length > 20) {
    return NextResponse.json({ error: '昵称长度不能超过 20 个字符' }, { status: 400 });
  }

  await db.run('UPDATE users SET nickname = ? WHERE id = ?', nickname.trim(), user.id);

  return NextResponse.json({ message: '昵称更新成功', nickname: nickname.trim() });
}
