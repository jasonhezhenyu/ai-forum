import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';

// 管理员操作帖子：置顶、加精、删除
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const { id } = await params;
  const { action } = await request.json();

  const post = await db.get('SELECT id, is_pinned, is_featured FROM posts WHERE id = ?', id) as any;
  if (!post) {
    return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
  }

  switch (action) {
    case 'pin':
      await db.run('UPDATE posts SET is_pinned = ? WHERE id = ?', post.is_pinned ? 0 : 1, id);
      return NextResponse.json({
        message: post.is_pinned ? '已取消置顶' : '已置顶',
        is_pinned: post.is_pinned ? 0 : 1,
      });

    case 'feature':
      await db.run('UPDATE posts SET is_featured = ? WHERE id = ?', post.is_featured ? 0 : 1, id);
      return NextResponse.json({
        message: post.is_featured ? '已取消精华' : '已设为精华',
        is_featured: post.is_featured ? 0 : 1,
      });

    default:
      return NextResponse.json({ error: '未知操作' }, { status: 400 });
  }
}

// 管理员删除帖子
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const { id } = await params;

  const post = await db.get('SELECT id FROM posts WHERE id = ?', id);
  if (!post) {
    return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
  }

  await db.run('DELETE FROM posts WHERE id = ?', id);

  return NextResponse.json({ message: '帖子已删除' });
}
