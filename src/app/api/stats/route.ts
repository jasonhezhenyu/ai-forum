import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const totalPosts = await db.get('SELECT COUNT(*) AS count FROM posts') as { count: number };
    const totalComments = await db.get('SELECT COUNT(*) AS count FROM comments') as { count: number };
    const totalUsers = await db.get('SELECT COUNT(*) AS count FROM users') as { count: number };
    const totalCategories = await db.get('SELECT COUNT(*) AS count FROM categories') as { count: number };
    const todayPost = await db.get(
      "SELECT COUNT(*) AS count FROM posts WHERE date(created_at) = date('now', 'localtime')"
    ) as { count: number };

    return NextResponse.json({
      totalPosts: totalPosts?.count ?? 0,
      totalComments: totalComments?.count ?? 0,
      totalUsers: totalUsers?.count ?? 0,
      totalCategories: totalCategories?.count ?? 0,
      todayPosts: todayPost?.count ?? 0,
    });
  } catch (error: any) {
    console.error('/api/stats error:', error);
    return NextResponse.json({ error: error.message, totalPosts: 0, totalComments: 0, totalUsers: 0, todayPosts: 0 });
  }
}
