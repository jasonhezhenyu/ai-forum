import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isFile = searchParams.get('type') === 'file';

  const formData = await request.formData();
  const file = (formData.get('image') || formData.get('attachment')) as File;

  if (!file) {
    return NextResponse.json({ error: '请选择文件' }, { status: 400 });
  }

  // 附件限制 20MB，图片视频限制 50MB
  const maxSize = isFile ? 20 * 1024 * 1024 : 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: `文件大小不能超过 ${isFile ? 20 : 50}MB` }, { status: 400 });
  }

  const imageTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
  const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];

  let subDir = 'files';
  if (imageTypes.includes(file.type)) subDir = 'images';
  else if (videoTypes.includes(file.type)) subDir = 'videos';

  const ext = file.type.split('/')[1] || path.extname(file.name).slice(1) || 'bin';
  const name = crypto.randomBytes(8).toString('hex');
  const fileName = `${name}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', subDir);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(uploadDir, fileName), buffer);

  const url = `/api/uploads/${subDir}/${fileName}`;
  const originalName = file.name;

  const markdown = imageTypes.includes(file.type) ? `![](${url})` : `[${originalName}](${url})`;

  return NextResponse.json({ url, markdown, originalName });
}
