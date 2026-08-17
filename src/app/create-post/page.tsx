'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/Toast';
import WysiwygEditor from '@/components/WysiwygEditor';

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 检查登录状态
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push('/login');
        }
      });

    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          categoryId: categoryId ? parseInt(categoryId) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '发帖失败，请重试');
        return;
      }

      showToast('帖子发布成功！', 'success');
      router.push(`/posts/${data.postId}`);
    } catch {
      setError('网络错误，请检查连接后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-[var(--boe-text-muted)] hover:text-[var(--boe-dark)] transition-colors duration-200"
        >
          ← 返回
        </button>
        <h1 className="text-xl font-extrabold text-[var(--boe-dark)]">发布新话题</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 分类和标题 */}
        <div className="bg-[var(--boe-matte)] rounded-2xl border border-[var(--boe-silver)] shadow-sm p-6 space-y-4">
          {/* 分类选择 - 改为按钮式选择 */}
          <div>
            <label className="block text-sm font-medium text-[var(--boe-dark-secondary)] mb-2">选择分类</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(categoryId === String(cat.id) ? '' : String(cat.id))}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 border ${
                    categoryId === String(cat.id)
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-500'
                      : 'bg-[var(--boe-matte)] text-[var(--boe-dark-secondary)] border-[var(--boe-silver)] hover:border-blue-300 hover:text-[var(--boe-dark)]'
                  }`}
                  title={cat.description}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--boe-dark-secondary)] mb-1.5">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--boe-silver)] rounded-xl focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)] outline-none transition-all duration-200 text-base"
              placeholder="用一句话概括你的话题..."
              required
              maxLength={200}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-[var(--boe-text-muted)]">好的标题能吸引更多人参与讨论</span>
              <span className="text-xs text-[var(--boe-text-muted)]">{title.length}/200</span>
            </div>
          </div>
        </div>

        {/* 内容编辑区 */}
        <div className="bg-[var(--boe-matte)] rounded-2xl border border-[var(--boe-silver)] shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[var(--boe-dark-secondary)]">内容</label>
            <div className="flex bg-[var(--boe-silver)] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setPreview(false)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                  !preview ? 'bg-[var(--boe-matte)] shadow-sm text-[var(--boe-dark)]' : 'text-[var(--boe-text-muted)]'
                }`}
              >
                编辑
              </button>
              <button
                type="button"
                onClick={() => setPreview(true)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                  preview ? 'bg-[var(--boe-matte)] shadow-sm text-[var(--boe-dark)]' : 'text-[var(--boe-text-muted)]'
                }`}
              >
                预览
              </button>
            </div>
          </div>

          {preview ? (
            <div className="min-h-[300px] p-4 border border-[var(--boe-silver)] rounded-xl bg-[var(--boe-silver-light)]/50 prose-content" dangerouslySetInnerHTML={{ __html: content || '<span class="text-gray-300">在编辑区输入内容后，这里会显示预览效果</span>' }} />
          ) : (
            <WysiwygEditor
              content={content}
              setContent={setContent}
              placeholder="在这里写下你的想法..."
              rows={14}
              showToast={(msg) => setError(msg)}
            />
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="bg-[var(--boe-matte)] rounded-2xl border border-[var(--boe-silver)] shadow-sm p-4 flex items-center justify-between">
          <div className="text-xs text-[var(--boe-text-muted)]">
            💡 支持 Markdown 语法排版
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2 rounded-xl text-sm text-[var(--boe-dark-secondary)] border border-[var(--boe-silver)] hover:bg-[var(--boe-silver-light)] transition-all duration-200"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              className="px-6 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-500/20"
            >
              {loading ? '发布中...' : '发布话题'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50/80 border border-red-100 text-red-600 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
