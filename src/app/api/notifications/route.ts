import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getNotifications, getUnreadCount, markAsRead } from '@/lib/notifications';

// GET - 获取通知列表和未读数
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }

  const notifications = await getNotifications(user.id);
  const unreadCount = await getUnreadCount(user.id);

  return NextResponse.json({ notifications, unreadCount });
}

// PUT - 标记为已读
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { id } = await request.json().catch(() => ({}));
  await markAsRead(user.id, id);

  return NextResponse.json({ message: '已标记为已读' });
}
