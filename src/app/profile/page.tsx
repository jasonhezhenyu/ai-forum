'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/Toast';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push('/login');
          return;
        }
        setUser(data.user);
        setNickname(data.user.nickname || data.user.username);
      });
  }, []);

  const handleSaveNickname = async () => {
    if (!nickname.trim()) return;
    setSaving(true);
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: nickname.trim() }),
    });

    if (res.ok) {
      showToast('昵称更新成功', 'success');
      router.refresh();
    } else {
      const data = await res.json();
      showToast(data.error || '更新失败', 'error');
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await fetch('/api/upload-avatar', { method: 'POST', body: formData });
    const data = await res.json();

    if (res.ok) {
      setUser((prev: any) => ({ ...prev, avatar: data.avatarUrl }));
      showToast('头像上传成功', 'success');
      router.refresh();
    } else {
      showToast(data.error || '上传失败', 'error');
    }
    setUploading(false);
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">加载中...</div>
    );
  }

  const displayName = user.nickname || user.username;
  const avatarColor = (name: string) => {
    const colors = ['from-blue-400 to-blue-600', 'from-purple-400 to-purple-600', 'from-green-400 to-green-600', 'from-orange-400 to-orange-600'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold text-[var(--boe-dark)] mb-8">个人设置</h1>

      {/* 头像 */}
      <div className="bg-[var(--boe-matte)] rounded-2xl border border-[var(--boe-silver)] shadow-sm p-6 mb-6">
        <h2 className="text-base font-bold text-[var(--boe-dark)] mb-4">头像</h2>
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <img src={user.avatar} className="w-20 h-20 rounded-full object-cover border-2 border-gray-100" alt="" />
          ) : (
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${avatarColor(user.username)} text-white flex items-center justify-center text-2xl font-bold`}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <label className="inline-block cursor-pointer bg-[var(--boe-matte)] border border-[var(--boe-silver)] text-[var(--boe-dark-secondary)] px-4 py-2 rounded-lg text-sm hover:bg-[var(--boe-silver-light)] transition-all duration-200">
              {uploading ? '上传中...' : '更换头像'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <p className="text-xs text-[var(--boe-text-muted)] mt-2">支持 PNG、JPG、GIF、WebP，最大 2MB</p>
          </div>
        </div>
      </div>

      {/* 昵称 */}
      <div className="bg-[var(--boe-matte)] rounded-2xl border border-[var(--boe-silver)] shadow-sm p-6 mb-6">
        <h2 className="text-base font-bold text-[var(--boe-dark)] mb-4">昵称</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="flex-1 px-4 py-2 border border-[var(--boe-silver)] rounded-xl focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)] outline-none transition-all duration-200"
            placeholder="设置你的显示昵称"
            maxLength={20}
          />
          <button
            onClick={handleSaveNickname}
            disabled={saving || !nickname.trim()}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 shadow-sm shadow-blue-500/20"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 账号信息 */}
      <div className="bg-[var(--boe-matte)] rounded-2xl border border-[var(--boe-silver)] shadow-sm p-6">
        <h2 className="text-base font-bold text-[var(--boe-dark)] mb-4">账号信息</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-[var(--boe-silver)]">
            <span className="text-[var(--boe-text-muted)]">用户名</span>
            <span className="text-[var(--boe-dark)] font-medium">{user.username}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[var(--boe-silver)]">
            <span className="text-[var(--boe-text-muted)]">昵称</span>
            <span className="text-[var(--boe-dark)] font-medium">{displayName}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-[var(--boe-text-muted)]">注册时间</span>
            <span className="text-[var(--boe-dark)] font-medium">--</span>
          </div>
        </div>
      </div>
    </div>
  );
}
