import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { id } = await params;

  const comment = await db.get('SELECT id, user_id, post_id FROM comments WHERE id = ?', id) as any;
  if (!comment) {
    return NextResponse.json({ error: '评论不存在' }, { status: 404 });
  }

  // 只能删除自己的评论，管理员可以删除任意评论
  const isAdmin = user.role === 'admin' || user.role === 'super_admin';
  if (comment.user_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: '只能删除自己的评论' }, { status: 403 });
  }

  // 删除该评论及其所有子回复
  await db.run('DELETE FROM comments WHERE id = ? OR parent_id = ?', id, id);

  return NextResponse.json({ message: '评论已删除' });
}
