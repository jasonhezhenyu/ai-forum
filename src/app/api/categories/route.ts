import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const categories = await db.all(`
      SELECT
        c.id, c.name, c.description,
        COUNT(p.id) AS post_count
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.id
    `);
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('/api/categories error:', error);
    return NextResponse.json({ error: error.message || 'Internal error', categories: [] }, { status: 500 });
  }
}
