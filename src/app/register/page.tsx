'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          nickname: nickname.trim() || username,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '注册失败，请重试');
        return;
      }

      router.push('/login?registered=true');
    } catch {
      setError('网络错误，请检查连接后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🚀</div>
          <h1 className="text-2xl font-extrabold text-[var(--boe-dark)]">创建账号</h1>
          <p className="text-sm text-[var(--boe-dark-secondary)] mt-1">加入BOE品质中台 AI Agent 论坛，开始交流</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--boe-matte)] backdrop-blur-sm rounded-2xl border border-[var(--boe-silver)] shadow-lg p-6 space-y-4">
          {error && (
            <div className="bg-red-50/80 border border-red-100 text-red-600 text-sm p-3 rounded-xl flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--boe-dark-secondary)] mb-1.5">用户名 <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--boe-silver)] rounded-xl focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)] outline-none transition-all duration-200"
              placeholder="2-20 个字符，用于登录"
              autoComplete="username"
              required
              minLength={2}
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--boe-dark-secondary)] mb-1.5">昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--boe-silver)] rounded-xl focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)] outline-none transition-all duration-200"
              placeholder="设置你的显示昵称（可选）"
              maxLength={20}
            />
            <p className="text-xs text-[var(--boe-text-muted)] mt-1">在社区中显示的名字，不填则使用用户名</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--boe-dark-secondary)] mb-1.5">密码 <span className="text-red-400">*</span></label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--boe-silver)] rounded-xl focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)] outline-none transition-all duration-200"
              placeholder="至少 6 位密码"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--boe-dark-secondary)] mb-1.5">确认密码 <span className="text-red-400">*</span></label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--boe-silver)] rounded-xl focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)] outline-none transition-all duration-200"
              placeholder="请再次输入密码"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-2.5 rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 shadow-md shadow-blue-500/15"
          >
            {loading ? '注册中...' : '创建账号'}
          </button>

          <p className="text-center text-sm text-[var(--boe-dark-secondary)] pt-2">
            已有账号？{' '}
            <Link href="/login" className="text-[var(--boe-primary)] hover:text-blue-700 transition-colors duration-200 font-medium">
              立即登录
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
