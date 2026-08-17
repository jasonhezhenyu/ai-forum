'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { showToast } from '@/components/Toast';

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  user_id: number;
  category_name: string | null;
  like_count: number;
  view_count?: number;
  created_at: string;
  is_pinned?: number;
  is_featured?: number;
}

interface Comment {
  id: number;
  content: string;
  author: string;
  user_id: number;
  created_at: string;
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; role: string } | null>(null);
  const [isPinned, setIsPinned] = useState(0);
  const [isFeatured, setIsFeatured] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPost = () => {
    fetch(`/api/posts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          showToast(data.error, 'error');
          return;
        }
        if (data.post) {
          setPost(data.post);
          setComments(data.comments || []);
          setLiked(data.liked || false);
          setLikeCount(data.post.like_count || 0);
          setViewCount(data.post.view_count || 0);
          setIsPinned(data.post.is_pinned || 0);
          setIsFeatured(data.post.is_featured || 0);
        }
      })
      .catch(() => {
        showToast('加载帖子失败，请刷新重试', 'error');
      });
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setCurrentUser(data.user));

    fetchPost();
  }, [id]);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const handleAdminAction = async (action: string) => {
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: action === 'delete' ? 'DELETE' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        if (action === 'delete') {
          router.push('/');
        } else if (action === 'pin') {
          setIsPinned(data.is_pinned);
        } else if (action === 'feature') {
          setIsFeatured(data.is_featured);
        }
      } else {
        showToast(data.error || '操作失败', 'error');
      }
    } catch {
      showToast('网络错误，请重试', 'error');
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      showToast('请先登录后再点赞', 'info');
      router.push('/login');
      return;
    }

    const res = await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: parseInt(id) }),
    });
    const data = await res.json();
    setLiked(data.liked);
    setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1));
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('请先登录后再评论', 'info');
      router.push('/login');
      return;
    }
    if (!newComment.trim()) return;

    setCommentLoading(true);
    setError('');

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim(), postId: parseInt(id) }),
      });

      const data = await res.json();

      if (res.ok) {
        fetchPost();
        setNewComment('');
        showToast('评论发表成功', 'success');
      } else {
        setError(data.error || '评论失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setCommentLoading(false);
    }
  };

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition mb-4"
      >
        ← 返回话题中心
      </Link>

      {/* 帖子内容 */}
      <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* 帖子头部 */}
        <div className="px-6 pt-6 pb-4">
          {/* 分类和作者信息 */}
          <div className="flex items-center gap-3 mb-4">
            {post.category_name && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">
                {post.category_name}
              </span>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-xs font-bold">
                {post.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  {(post as any).author_nickname || post.author}
                  {(post as any).author_role === 'super_admin' && (
                    <span className="text-[10px] bg-purple-50 text-purple-600 px-1 py-0.5 rounded font-medium">超级管理员</span>
                  )}
                  {(post as any).author_role === 'admin' && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded font-medium">管理员</span>
                  )}
                </div>
                <div className="text-xs text-gray-400">{formattedDate}</div>
              </div>
            </div>
          </div>

          {/* 标题 */}
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">
            {isPinned === 1 && (
              <span className="inline-block text-sm bg-red-50 text-red-500 px-2 py-0.5 rounded font-medium mr-2 align-middle">📌 置顶</span>
            )}
            {isFeatured === 1 && (
              <span className="inline-block text-sm bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-medium mr-2 align-middle">💎 精华</span>
            )}
            {post.title}
          </h1>
        </div>

        {/* 帖子正文 */}
        <div className="px-6 pb-6">
          <div className="prose-content text-gray-800 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="border-t border-gray-100 px-6 py-3 flex items-center gap-2 bg-gray-50/50 flex-wrap">
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="font-medium">{viewCount}</span>
            <span className="text-xs">浏览</span>
          </span>

          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition ${
              liked
                ? 'bg-red-50 text-red-500'
                : 'text-gray-500 hover:text-red-400 hover:bg-red-50'
            }`}
          >
            <svg className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="font-medium">{likeCount}</span>
            <span className="text-xs">{liked ? '已点赞' : '点赞'}</span>
          </button>

          <button
            onClick={() => document.getElementById('comment-form')?.focus()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-gray-500 hover:text-blue-400 hover:bg-blue-50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="font-medium">{comments.length}</span>
            <span className="text-xs">评论</span>
          </button>

          {/* 管理员操作 */}
          {isAdmin && (
            <>
              <div className="w-px h-5 bg-gray-300 mx-1" />
              <button
                onClick={() => handleAdminAction('pin')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition ${
                  isPinned ? 'bg-red-50 text-red-500' : 'text-gray-400 hover:text-red-400 hover:bg-red-50'
                }`}
              >
                📌 {isPinned ? '已置顶' : '置顶'}
              </button>
              <button
                onClick={() => handleAdminAction('feature')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition ${
                  isFeatured ? 'bg-amber-50 text-amber-600' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                }`}
              >
                💎 {isFeatured ? '已加精' : '加精'}
              </button>
              <button
                onClick={() => {
                  if (confirm('确定要删除这个帖子吗？此操作不可撤销。')) {
                    handleAdminAction('delete');
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
              >
                🗑️ 删除
              </button>
            </>
          )}
        </div>
      </article>

      {/* 评论区 */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            全部评论 <span className="text-gray-400 font-normal">({comments.length})</span>
          </h2>
        </div>

        {/* 评论列表 */}
        <div className="px-6 py-2">
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-3">💬</div>
              <p className="text-gray-400 text-sm">暂无评论</p>
              <p className="text-gray-400 text-xs mt-1">来发表第一条评论吧</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {comments.map((comment, index) => (
                <div key={comment.id} className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {comment.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                          {(comment as any).author_nickname || comment.author}
                          {(comment as any).author_role === 'super_admin' && (
                            <span className="text-[10px] bg-purple-50 text-purple-600 px-1 py-0.5 rounded font-medium">超管</span>
                          )}
                          {(comment as any).author_role === 'admin' && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded font-medium">管理</span>
                          )}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(comment.created_at).toLocaleDateString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {index === 0 && post.user_id === comment.user_id && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">作者</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 发评论表单 */}
        <div className="border-t border-gray-100 px-6 py-4">
          {currentUser ? (
            <form onSubmit={handleComment}>
              {error && (
                <div className="bg-red-50 text-red-600 text-xs p-2 rounded-lg mb-3">{error}</div>
              )}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <textarea
                    id="comment-form"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm resize-none"
                    placeholder="写下你的想法..."
                    required
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-400">⌘ + Enter 快捷发送</span>
                    <button
                      type="submit"
                      disabled={commentLoading || !newComment.trim()}
                      className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {commentLoading ? '发送中...' : '发送'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="text-center py-3">
              <p className="text-sm text-gray-400">
                请{' '}
                <button
                  onClick={() => router.push('/login')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  登录
                </button>{' '}
                后参与评论
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
