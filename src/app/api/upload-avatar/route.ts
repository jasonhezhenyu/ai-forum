import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('avatar') as File;

  if (!file) {
    return NextResponse.json({ error: '请选择文件' }, { status: 400 });
  }

  // 限制文件大小 2MB
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: '文件大小不能超过 2MB' }, { status: 400 });
  }

  // 限制文件类型
  if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type)) {
    return NextResponse.json({ error: '仅支持 PNG、JPG、GIF、WebP 格式' }, { status: 400 });
  }

  const ext = file.type.split('/')[1];
  const fileName = `avatar-${user.id}-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'avatars');

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(uploadDir, fileName), buffer);

  const avatarUrl = `/avatars/${fileName}`;
  await db.run('UPDATE users SET avatar = ? WHERE id = ?', avatarUrl, user.id);

  return NextResponse.json({ avatarUrl });
}
