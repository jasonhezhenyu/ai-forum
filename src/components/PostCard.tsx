import Link from 'next/link';

interface PostCardProps {
  post: {
    id: number;
    title: string;
    content: string;
    author: string;
    author_nickname?: string;
    author_role?: string;
    author_avatar?: string;
    category_name: string | null;
    comment_count: number;
    like_count: number;
    view_count?: number;
    created_at: string;
    is_pinned?: number;
    is_featured?: number;
  };
}

export default function PostCard({ post }: PostCardProps) {
  // 生成摘要
  const plainText = post.content
    .replace(/[#*`>\[\]!~-]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  const excerpt = plainText.length > 120 ? plainText.slice(0, 120) + '...' : plainText;

  const timeAgo = formatTimeAgo(post.created_at);

  return (
    <Link href={`/posts/${post.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition-all duration-200">
        <div className="flex items-start gap-4">
          {/* 左侧头像 */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
            {post.author.charAt(0).toUpperCase()}
          </div>

          {/* 右侧内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              {post.category_name && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                  {post.category_name}
                </span>
              )}
              <span className="text-xs text-gray-400">{timeAgo}</span>
            </div>

            <h2 className="text-base font-semibold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors line-clamp-1">
              {(post as any).is_pinned === 1 && (
                <span className="inline-block text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-medium mr-1.5">置顶</span>
              )}
              {(post as any).is_featured === 1 && (
                <span className="inline-block text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium mr-1.5">精华</span>
              )}
              {post.title}
            </h2>

            <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
              {excerpt}
            </p>

            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                {post.author_nickname || post.author}
                {(post as any).author_role === 'super_admin' && (
                  <span className="text-[10px] bg-purple-50 text-purple-600 px-1 py-0.5 rounded font-medium">超管</span>
                )}
                {(post as any).author_role === 'admin' && (
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded font-medium">管理</span>
                )}
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {post.view_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {post.comment_count}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {post.like_count}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr + 'Z').getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
