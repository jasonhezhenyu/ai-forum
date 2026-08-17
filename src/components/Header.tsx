'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { showToast } from '@/components/Toast';

interface User {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  role: string;
}

interface Notification {
  id: number;
  type: string;
  message: string;
  post_id: number;
  is_read: number;
  created_at: string;
  from_username: string;
  from_nickname: string;
  from_avatar: string;
}

const AVATAR_COLORS = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-green-400 to-green-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
  'from-teal-400 to-teal-600',
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr + 'Z').getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = () => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        if (data.user) fetchNotifications();
      });
  };

  const fetchNotifications = () => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data.notifications.slice(0, 10));
        setUnreadCount(data.unreadCount);
      });
  };

  useEffect(() => { fetchUser(); }, [pathname]);

  // 定期轮询通知
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(timer);
  }, [user?.id]);

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setMenuOpen(false);
    showToast('已退出登录', 'info');
    router.push('/');
    router.refresh();
  };

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
  };

  const displayName = user?.nickname || user?.username || '';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-blue-600 hover:text-blue-700 transition">
          <span className="text-xl">🤖</span>
          <span className="hidden sm:inline">BOE品质中台 AI Agent 论坛</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              pathname === '/' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            首页
          </Link>

          {user ? (
            <>
              {/* 通知铃铛 */}
              <div className="relative ml-1" ref={notifRef}>
                <button
                  onClick={() => { setNotifOpen(!notifOpen); setMenuOpen(false); if (!notifOpen) fetchNotifications(); }}
                  className="relative p-2 rounded-lg hover:bg-gray-50 transition"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* 通知下拉 */}
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900">消息通知</h3>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">
                          全部已读
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-400">
                          暂无通知
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <Link
                            key={n.id}
                            href={`/posts/${n.post_id}`}
                            onClick={() => setNotifOpen(false)}
                            className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${
                              !n.is_read ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            {/* 头像或图标 */}
                            <div className="shrink-0 mt-0.5">
                              {n.from_avatar ? (
                                <img src={n.from_avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
                              ) : (
                                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColor(n.from_username)} text-white flex items-center justify-center text-xs font-bold`}>
                                  {(n.from_nickname || n.from_username).charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                                {n.message}
                              </p>
                              <span className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</span>
                            </div>
                            {!n.is_read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
                            )}
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 用户菜单 */}
              <div className="relative ml-1" ref={menuRef}>
                <button
                  onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false); }}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 transition"
                >
                  {user.avatar ? (
                    <img src={user.avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
                  ) : (
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColor(user.username)} text-white flex items-center justify-center text-xs font-bold`}>
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm text-gray-700 max-w-[100px] truncate">{displayName}</span>
                  {user?.role === 'super_admin' && (
                    <span className="hidden sm:inline text-[10px] bg-purple-50 text-purple-600 px-1 py-0.5 rounded font-medium">超管</span>
                  )}
                  {user?.role === 'admin' && (
                    <span className="hidden sm:inline text-[10px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded font-medium">管理</span>
                  )}
                  <svg className={`w-3 h-3 text-gray-400 transition ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl border border-gray-200 shadow-lg py-1">
                    <div className="px-4 py-2.5 text-xs text-gray-400 border-b border-gray-100">
                      已登录为 <span className="font-medium text-gray-600">{displayName}</span>
                      {user?.role === 'super_admin' && (
                        <span className="ml-1.5 text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-medium">超级管理员</span>
                      )}
                      {user?.role === 'admin' && (
                        <span className="ml-1.5 text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">管理员</span>
                      )}
                    </div>
                    {(user?.role === 'admin' || user?.role === 'super_admin') && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition font-medium"
                      >
                        ⚙️ 后台管理
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
                    >
                      👤 个人设置
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
                    >
                      🚪 退出登录
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition">
                登录
              </Link>
              <Link href="/register" className="ml-1 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition shadow-sm">
                注册账号
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
