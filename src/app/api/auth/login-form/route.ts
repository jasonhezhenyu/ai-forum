import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    // 重定向回登录页，带上错误信息
    return NextResponse.redirect(new URL('/login?error=请输入用户名和密码', request.url));
  }

  const result = await loginUser(username, password);

  if (!result.success) {
    return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent(result.error || '登录失败'), request.url));
  }

  // 登录成功，设置 cookie 并重定向到首页
  const response = NextResponse.redirect(new URL('/', request.url));
  response.cookies.set('session', result.token!, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}
