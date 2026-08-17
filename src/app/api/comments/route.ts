import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { content, postId, parentId } = await request.json();

  if (!content || !postId) {
    return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
  }

  const result = await db.run(
    'INSERT INTO comments (content, user_id, post_id, parent_id) VALUES (?, ?, ?, ?)',
    content, user.id, postId, parentId || null
  );

  // 发通知
  const post = await db.get('SELECT user_id, title FROM posts WHERE id = ?', postId) as any;
  if (post) {
    const excerpt = content.length > 30 ? content.slice(0, 30) + '...' : content;
    if (parentId) {
      // 回复评论：通知被回复的人
      const parent = await db.get('SELECT user_id FROM comments WHERE id = ?', parentId) as any;
      if (parent && parent.user_id !== user.id) {
        await createNotification(
          parent.user_id,
          'comment',
          `${user.nickname || user.username} 回复了你的评论：${excerpt}`,
          postId,
          user.id
        );
      }
    } else {
      // 评论帖子：通知帖子作者
      await createNotification(
        post.user_id,
        'comment',
        `${user.nickname || user.username} 评论了你的帖子《${post.title}》：${excerpt}`,
        postId,
        user.id
      );
    }
  }

  return NextResponse.json({
    message: '评论成功',
    commentId: result.lastInsertRowid,
  });
}
