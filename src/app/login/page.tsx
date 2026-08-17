'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const doLogin = async () => {
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '登录失败');
        setLoading(false);
        return;
      }

      window.location.href = '/';
    } catch {
      setError('网络错误，请重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🤖</div>
          <h1 className="text-2xl font-extrabold text-[var(--boe-dark)]">欢迎回来</h1>
          <p className="text-sm text-[var(--boe-dark-secondary)] mt-1">登录你的账号，继续参与讨论</p>
        </div>

        <div className="bg-[var(--boe-matte)] backdrop-blur-sm rounded-2xl border border-[var(--boe-silver)] shadow-lg p-6 space-y-4">
          {error && (
            <div className="bg-red-50/80 border border-red-100 text-red-600 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--boe-dark-secondary)] mb-1.5">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doLogin()}
              className="w-full px-4 py-2.5 border border-[var(--boe-silver)] rounded-xl focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)] outline-none transition-all duration-200 text-[var(--boe-dark)]"
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--boe-dark-secondary)] mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doLogin()}
              className="w-full px-4 py-2.5 border border-[var(--boe-silver)] rounded-xl focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)] outline-none transition-all duration-200 text-[var(--boe-dark)]"
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </div>

          <button
            onClick={doLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-2.5 rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 shadow-md shadow-blue-500/15"
          >
            {loading ? '登录中...' : '登录'}
          </button>

          <p className="text-center text-sm text-[var(--boe-dark-secondary)] pt-2">
            还没有账号？{' '}
            <Link href="/register" className="text-[var(--boe-primary)] hover:text-blue-700 transition-colors duration-200 font-medium">
              立即注册
            </Link>
          </p>
          <p className="text-center text-sm text-[var(--boe-text-muted)]">
            <Link href="/forgot-password" className="hover:text-[var(--boe-dark)] transition-colors duration-200">
              忘记密码？
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
