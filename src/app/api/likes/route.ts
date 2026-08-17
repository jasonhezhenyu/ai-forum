import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { postId } = await request.json();

  if (!postId) {
    return NextResponse.json({ error: '帖子ID不能为空' }, { status: 400 });
  }

  const existing = await db.get(
    'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
    user.id, postId
  );

  if (existing) {
    await db.run('DELETE FROM likes WHERE user_id = ? AND post_id = ?', user.id, postId);
    return NextResponse.json({ liked: false, message: '已取消点赞' });
  } else {
    await db.run('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', user.id, postId);

    // 发通知给帖子作者
    const post = await db.get('SELECT user_id, title FROM posts WHERE id = ?', postId) as any;
    if (post) {
      await createNotification(
        post.user_id,
        'like',
        `${user.nickname || user.username} 赞了你的帖子《${post.title}》`,
        postId,
        user.id
      );
    }

    return NextResponse.json({ liked: true, message: '点赞成功' });
  }
}
