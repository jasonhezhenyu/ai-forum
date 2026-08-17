import { NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth';

export async function POST() {
  await logoutUser();

  const response = NextResponse.json({ message: '已退出登录' });
  response.cookies.set('session', '', { maxAge: 0, path: '/' });

  return response;
}
