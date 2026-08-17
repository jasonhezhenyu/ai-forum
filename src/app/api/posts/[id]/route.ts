import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

// GET /api/posts/[id] - 获取单个帖子详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 先增加浏览次数
  await db.run('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', id);

  const post = await db.get(`
    SELECT
      posts.id, posts.title, posts.content, posts.created_at,
      posts.updated_at, posts.category_id, posts.is_pinned, posts.is_featured,
      posts.view_count,
      users.id AS user_id, users.username AS author,
      users.nickname AS author_nickname, users.role AS author_role,
      categories.name AS category_name,
      COUNT(DISTINCT likes.id) AS like_count
    FROM posts
    JOIN users ON posts.user_id = users.id
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN likes ON likes.post_id = posts.id
    WHERE posts.id = ?
    GROUP BY posts.id
  `, id);

  if (!post) {
    return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
  }

  // 获取评论
  const comments = await db.all(`
    SELECT comments.id, comments.content, comments.created_at,
           comments.parent_id,
           users.username AS author, users.nickname AS author_nickname,
           users.role AS author_role, users.id AS user_id
    FROM comments
    JOIN users ON comments.user_id = users.id
    WHERE comments.post_id = ?
    ORDER BY comments.created_at ASC
  `, id);

  // 检查当前用户是否已点赞
  const currentUser = await getCurrentUser();
  let liked = false;
  if (currentUser) {
    const like = await db.get(
      'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
      currentUser.id, id
    );
    liked = !!like;
  }

  return NextResponse.json({ post, comments, liked });
}
