import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  if (!q.trim()) {
    return NextResponse.json({ posts: [], total: 0 });
  }

  const keyword = `%${q.trim()}%`;

  const posts = await db.all(`
    SELECT
      posts.id, posts.title, posts.content, posts.created_at,
      posts.view_count, posts.is_pinned, posts.is_featured,
      users.username AS author, users.nickname AS author_nickname,
      users.role AS author_role,
      categories.name AS category_name,
      COUNT(DISTINCT comments.id) AS comment_count,
      COUNT(DISTINCT likes.id) AS like_count
    FROM posts
    JOIN users ON posts.user_id = users.id
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN comments ON comments.post_id = posts.id
    LEFT JOIN likes ON likes.post_id = posts.id
    WHERE posts.title LIKE ? OR posts.content LIKE ?
    GROUP BY posts.id
    ORDER BY posts.created_at DESC
    LIMIT ? OFFSET ?
  `, keyword, keyword, limit, offset);

  const total = (await db.get(
    'SELECT COUNT(*) AS count FROM posts WHERE title LIKE ? OR content LIKE ?',
    keyword, keyword
  ) as { count: number }).count;

  return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
}
