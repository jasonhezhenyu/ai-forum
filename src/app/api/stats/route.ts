import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const totalPosts = await db.get('SELECT COUNT(*) AS count FROM posts') as { count: number };
  const totalComments = await db.get('SELECT COUNT(*) AS count FROM comments') as { count: number };
  const totalUsers = await db.get('SELECT COUNT(*) AS count FROM users') as { count: number };
  const totalCategories = await db.get('SELECT COUNT(*) AS count FROM categories') as { count: number };

  // 今日发帖数
  const todayPosts = await db.get(
    "SELECT COUNT(*) AS count FROM posts WHERE date(created_at) = date('now', 'localtime')"
  ) as { count: number };

  return NextResponse.json({
    totalPosts: totalPosts.count,
    totalComments: totalComments.count,
    totalUsers: totalUsers.count,
    totalCategories: totalCategories.count,
    todayPosts: todayPosts.count,
  });
}
