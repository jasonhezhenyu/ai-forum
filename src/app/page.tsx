'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PostCard from '@/components/PostCard';

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  category_name: string | null;
  comment_count: number;
  like_count: number;
  view_count?: number;
  created_at: string;
  is_pinned?: number;
  is_featured?: number;
}

interface Category {
  id: number;
  name: string;
  description: string;
  post_count: number;
}

interface Stats {
  totalPosts: number;
  totalComments: number;
  totalUsers: number;
  todayPosts: number;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats>({ totalPosts: 0, totalComments: 0, totalUsers: 0, todayPosts: 0 });
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories));
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => setStats(data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (sortBy) params.set('sort', sortBy);

    fetch(`/api/posts?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setPosts(data.posts))
      .finally(() => setLoading(false));
  }, [selectedCategory, sortBy]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* 左侧边栏 */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-20 space-y-4">
            {/* 分类导航 */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">话题分类</h3>
              </div>
              <div className="p-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    selectedCategory === ''
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  📋 全部话题
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(String(cat.id))}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between ${
                      selectedCategory === String(cat.id)
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                      selectedCategory === String(cat.id)
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>{cat.post_count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 社区统计 */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">社区统计</h3>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">总发帖量</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.totalPosts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">话题分类</span>
                  <span className="text-sm font-semibold text-gray-900">{categories.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">总评论数</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.totalComments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">社区成员</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.totalUsers}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">今日发帖</span>
                    <span className="text-sm font-semibold text-green-600">+{stats.todayPosts}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* 主内容区 */}
        <div className="flex-1 min-w-0">
          {/* 顶部：标题 + 发帖按钮 */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">话题中心</h1>
              <p className="text-sm text-gray-500 mt-1">
                {selectedCategory
                  ? `正在浏览：${categories.find((c) => String(c.id) === selectedCategory)?.name || ''}`
                  : '发现精彩讨论，赋能品质中台提质增效'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* 移动端筛选 */}
              <div className="lg:hidden">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white outline-none"
                >
                  <option value="">全部话题</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <Link
                href="/create-post"
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
              >
                ✏️ 发布新帖子
              </Link>
            </div>
          </div>

          {/* 排序标签 */}
          <div className="flex gap-1 mb-4 bg-white rounded-xl border border-gray-100 p-1">
            {[
              { key: 'latest', label: '🕐 最新', desc: '按发布时间排序' },
              { key: 'hot', label: '🔥 最热', desc: '评论和点赞最多的' },
              { key: 'top', label: '👍 高分', desc: '点赞数最高的' },
              { key: 'featured', label: '💎 精华', desc: '综合热度最高的' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSortBy(tab.key)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  sortBy === tab.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                title={tab.desc}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(3)}</span>
              </button>
            ))}
          </div>

          {/* 帖子列表 */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-gray-500 text-lg mb-2">还没有人发帖</p>
              <p className="text-gray-400 text-sm mb-6">成为第一个分享想法的人吧！</p>
              <Link
                href="/create-post"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
              >
                发布第一个话题
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
