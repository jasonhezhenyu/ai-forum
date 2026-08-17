import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';

// GET - 管理员获取所有帖子列表
export async function GET() {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const posts = await db.all(`
    SELECT
      posts.id, posts.title, posts.is_pinned, posts.is_featured, posts.created_at,
      users.username AS author, users.nickname AS author_nickname,
      categories.name AS category_name,
      COUNT(DISTINCT comments.id) AS comment_count,
      COUNT(DISTINCT likes.id) AS like_count
    FROM posts
    JOIN users ON posts.user_id = users.id
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN comments ON comments.post_id = posts.id
    LEFT JOIN likes ON likes.post_id = posts.id
    GROUP BY posts.id
    ORDER BY posts.is_pinned DESC, posts.created_at DESC
  `);

  return NextResponse.json({ posts });
}
