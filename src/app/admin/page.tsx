'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/Toast';

interface AdminUser {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  role: string;
  created_at: string;
  post_count: number;
  comment_count: number;
}

interface AdminPost {
  id: number;
  title: string;
  author: string;
  author_nickname: string;
  category_name: string;
  is_pinned: number;
  is_featured: number;
  comment_count: number;
  like_count: number;
  created_at: string;
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [activeTab, setActiveTab] = useState<'forum' | 'users'>('forum');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchData = () => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      setCurrentUser(d.user);
      if (!d.user || (d.user.role !== 'admin' && d.user.role !== 'super_admin')) {
        router.push('/');
        return;
      }
    });
    fetch('/api/admin/users').then(r => r.json()).then(d => setUsers(d.users || []));
    fetch('/api/admin/posts').then(r => r.json()).then(d => setPosts(d.posts || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleChangeRole = async (userId: number, role: string) => {
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message, 'success');
      fetchData();
    } else {
      showToast(data.error, 'error');
    }
  };

  const handlePostAction = async (postId: number, action: string) => {
    const res = await fetch(`/api/admin/posts/${postId}`, {
      method: action === 'delete' ? 'DELETE' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message, 'success');
      fetchData();
    } else {
      showToast(data.error, 'error');
    }
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20 text-center text-gray-400">加载中...</div>;

  const isSuperAdmin = currentUser?.role === 'super_admin';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-extrabold text-[var(--boe-dark)]">⚙️ 后台管理</h1>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          isSuperAdmin ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
        }`}>
          {isSuperAdmin ? '超级管理员' : '管理员'}
        </span>
      </div>
      <p className="text-sm text-[var(--boe-dark-secondary)] mb-6">
        {isSuperAdmin ? '管理论坛内容、用户角色和权限' : '管理论坛帖子内容'}
      </p>

      {/* Tab 切换 */}
      <div className="flex gap-1 bg-[var(--boe-matte)] rounded-2xl border border-[var(--boe-silver)] p-1 mb-6">
        <button
          onClick={() => setActiveTab('forum')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'forum' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-[var(--boe-text-muted)] hover:text-[var(--boe-dark)] hover:bg-[var(--boe-silver-light)]'
          }`}
        >
          📋 论坛管理
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'users' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-[var(--boe-text-muted)] hover:text-[var(--boe-dark)] hover:bg-[var(--boe-silver-light)]'
            }`}
          >
            👥 用户管理
          </button>
        )}
      </div>

      {/* 论坛管理 */}
      {activeTab === 'forum' && (
        <div className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '总帖子', value: posts.length, color: 'text-blue-600 bg-blue-500/5 rounded-2xl border border-blue-100/50' },
              { label: '置顶帖', value: posts.filter(p => p.is_pinned).length, color: 'text-red-600 bg-red-500/5 rounded-2xl border border-red-100/50' },
              { label: '精华帖', value: posts.filter(p => p.is_featured).length, color: 'text-amber-600 bg-amber-500/5 rounded-2xl border border-amber-100/50' },
              { label: '总用户', value: users.length, color: 'text-green-600 bg-green-500/5 rounded-2xl border border-green-100/50' },
            ].map(s => (
              <div key={s.label} className={`${s.color} rounded-xl p-4`}>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs mt-1 opacity-75">{s.label}</div>
              </div>
            ))}
          </div>

          {/* 帖子列表 */}
          <div className="bg-[var(--boe-matte)] rounded-2xl border border-[var(--boe-silver)] shadow-sm">
            <div className="px-6 py-4 border-b border-[var(--boe-silver)]">
              <h2 className="text-base font-bold text-[var(--boe-dark)]">所有帖子</h2>
            </div>
            {posts.length === 0 ? (
              <div className="px-6 py-12 text-center text-[var(--boe-text-muted)] text-sm">暂无帖子</div>
            ) : (
              <div className="divide-y divide-[var(--boe-silver)]">
                {posts.map((post) => (
                  <div key={post.id} className="px-6 py-4 hover:bg-[var(--boe-silver-light)]/50 transition-all duration-200 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {post.is_pinned === 1 && <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-medium">置顶</span>}
                        {post.is_featured === 1 && <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">精华</span>}
                        <a href={`/posts/${post.id}`} className="text-sm font-medium text-[var(--boe-dark)] hover:text-blue-600 truncate transition-colors duration-200" target="_blank">
                          {post.title}
                        </a>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[var(--boe-text-muted)]">
                        <span>{post.author_nickname || post.author}</span>
                        {post.category_name && <span>{post.category_name}</span>}
                        <span>💬 {post.comment_count}</span>
                        <span>❤️ {post.like_count}</span>
                        <span>{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handlePostAction(post.id, 'pin')}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-all duration-200 ${post.is_pinned ? 'bg-red-50 text-red-500' : 'text-[var(--boe-text-muted)] hover:bg-[var(--boe-silver-light)]'}`}>
                        📌
                      </button>
                      <button onClick={() => handlePostAction(post.id, 'feature')}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-all duration-200 ${post.is_featured ? 'bg-amber-50 text-amber-600' : 'text-[var(--boe-text-muted)] hover:bg-[var(--boe-silver-light)]'}`}>
                        💎
                      </button>
                      <button onClick={() => { if (confirm('确定删除？')) handlePostAction(post.id, 'delete'); }}
                        className="px-2.5 py-1 rounded-lg text-xs text-[var(--boe-text-muted)] hover:bg-red-50 hover:text-red-500 transition-all duration-200">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 用户管理（仅超管可见） */}
      {activeTab === 'users' && isSuperAdmin && (
        <div className="space-y-6">
          <div className="bg-[var(--boe-matte)] rounded-2xl border border-[var(--boe-silver)] shadow-sm">
            <div className="px-6 py-4 border-b border-[var(--boe-silver)]">
              <h2 className="text-base font-bold text-[var(--boe-dark)]">所有用户</h2>
              <p className="text-xs text-[var(--boe-text-muted)] mt-1">设置管理员权限，管理注册用户</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--boe-silver-light)] text-[var(--boe-dark-secondary)]">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">用户信息</th>
                    <th className="text-left px-6 py-3 font-medium hidden sm:table-cell">发帖/评论</th>
                    <th className="text-left px-6 py-3 font-medium hidden sm:table-cell">注册时间</th>
                    <th className="text-left px-6 py-3 font-medium">角色</th>
                    <th className="text-left px-6 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--boe-silver)]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[var(--boe-silver-light)]/50 transition-all duration-200">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img src={u.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-xs font-bold">
                              {(u.nickname || u.username).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-[var(--boe-dark)]">{u.nickname || u.username}</div>
                            <div className="text-xs text-[var(--boe-text-muted)]">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-[var(--boe-dark-secondary)] hidden sm:table-cell">
                        {u.post_count} 帖 / {u.comment_count} 评
                      </td>
                      <td className="px-6 py-3 text-[var(--boe-text-muted)] hidden sm:table-cell">
                        {new Date(u.created_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          u.role === 'super_admin' ? 'bg-purple-50 text-purple-600' :
                          u.role === 'admin' ? 'bg-blue-50 text-blue-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {u.role === 'super_admin' ? '超级管理员' : u.role === 'admin' ? '管理员' : '用户'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const pw = prompt('请输入新密码（至少6位）：');
                            if (pw && pw.length >= 6) {
                              fetch('/api/admin/reset-password', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: u.id, newPassword: pw }),
                              }).then(r => r.json()).then(d => showToast(d.message || d.error, d.message ? 'success' : 'error'));
                            } else if (pw) {
                              showToast('密码至少6位', 'error');
                            }
                          }}
                          className="text-xs text-gray-400 hover:text-blue-500"
                          title="重置密码"
                        >
                          🔑
                        </button>
                        {u.role !== 'super_admin' && u.id !== currentUser?.id && (
                          u.role === 'admin' ? (
                            <button onClick={() => handleChangeRole(u.id, 'user')}
                              className="text-xs text-red-500 hover:underline">
                              取消管理员
                            </button>
                          ) : (
                            <button onClick={() => handleChangeRole(u.id, 'admin')}
                              className="text-xs text-blue-600 hover:underline">
                              设为管理员
                            </button>
                          )
                        )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
