import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

// GET /api/posts - 获取帖子列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('category');
  const sort = searchParams.get('sort') || 'latest';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      posts.id, posts.title, posts.content, posts.created_at,
      posts.category_id, posts.is_pinned, posts.is_featured, posts.view_count,
      users.username AS author, users.nickname AS author_nickname,
      users.avatar AS author_avatar, users.role AS author_role,
      categories.name AS category_name,
      COUNT(DISTINCT comments.id) AS comment_count,
      COUNT(DISTINCT likes.id) AS like_count,
      (COUNT(DISTINCT likes.id) * 2 + COUNT(DISTINCT comments.id)) AS hot_score
    FROM posts
    JOIN users ON posts.user_id = users.id
    LEFT JOIN categories ON posts.category_id = categories.id
    LEFT JOIN comments ON comments.post_id = posts.id
    LEFT JOIN likes ON likes.post_id = posts.id
  `;

  const params: any[] = [];

  if (categoryId) {
    query += ' WHERE posts.category_id = ?';
    params.push(categoryId);
  }

  // 排序逻辑
  let orderBy = 'posts.created_at DESC';
  switch (sort) {
    case 'hot':
      orderBy = 'hot_score DESC, posts.created_at DESC';
      break;
    case 'top':
      orderBy = 'like_count DESC, posts.created_at DESC';
      break;
    case 'featured':
      orderBy = 'posts.is_featured DESC, hot_score DESC, posts.created_at DESC';
      break;
    default:
      orderBy = 'posts.created_at DESC';
  }

  query += ` GROUP BY posts.id ORDER BY posts.is_pinned DESC, ${orderBy} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const posts = await db.all(query, ...params);

  // 获取总数
  let countQuery = 'SELECT COUNT(*) AS total FROM posts';
  if (categoryId) {
    countQuery += ' WHERE category_id = ?';
  }
  const { total } = await db.get(countQuery, ...(categoryId ? [categoryId] : [])) as { total: number };

  return NextResponse.json({
    posts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// POST /api/posts - 创建帖子
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { title, content, categoryId } = await request.json();

  if (!title || !content) {
    return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 });
  }

  const result = await db.run(
    'INSERT INTO posts (title, content, user_id, category_id) VALUES (?, ?, ?, ?)',
    title, content, user.id, categoryId || null
  );

  return NextResponse.json({
    message: '发帖成功',
    postId: result.lastInsertRowid,
  });
}
