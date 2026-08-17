'use client';

import { useState } from 'react';
import Link from 'next/link';
import { showToast } from '@/components/Toast';

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔑</div>
          <h1 className="text-2xl font-extrabold text-[var(--boe-dark)]">忘记密码</h1>
          <p className="text-sm text-[var(--boe-dark-secondary)] mt-1">验证身份后重置密码</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="bg-[var(--boe-matte)] backdrop-blur-sm rounded-2xl border border-[var(--boe-silver)] shadow-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--boe-dark-secondary)] mb-1.5">请输入你的用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--boe-silver)] rounded-xl focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)] outline-none transition-all duration-200"
                placeholder="请输入用户名"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-2.5 rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-md shadow-blue-500/15"
            >
              下一步
            </button>
            <p className="text-center text-sm text-[var(--boe-dark-secondary)]">
              <Link href="/login" className="text-[var(--boe-primary)] hover:text-blue-700 transition-colors duration-200 font-medium">返回登录</Link>
            </p>
          </form>
        ) : (
          <div className="bg-[var(--boe-matte)] backdrop-blur-sm rounded-2xl border border-[var(--boe-silver)] shadow-lg p-6 space-y-4">
            <div className="text-center py-4">
              <div className="text-3xl mb-3">📩</div>
              <p className="text-sm text-[var(--boe-dark-secondary)] leading-relaxed">
                用户 <span className="font-bold text-[var(--boe-primary)]">{username}</span> 的密码重置请求已提交。
              </p>
              <div className="mt-4 p-4 bg-blue-500/5 border border-blue-100/50 rounded-xl text-left text-sm text-[var(--boe-dark-secondary)] space-y-2">
                <p className="font-medium text-blue-700">📋 请联系管理员重置密码：</p>
                <p>1. 找到论坛的<span className="font-medium">管理员或超级管理员</span></p>
                <p>2. 管理员在「后台管理 → 用户管理」中选择你的账号</p>
                <p>3. 点击「重置密码」设置新密码</p>
              </div>
            </div>
            <Link
              href="/login"
              className="block text-center w-full py-2.5 rounded-xl border border-[var(--boe-silver)] text-sm text-[var(--boe-dark-secondary)] hover:bg-[var(--boe-silver-light)] transition-all duration-200"
            >
              返回登录
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
