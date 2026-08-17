'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import { Suspense } from 'react';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) { setLoading(false); return; }
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="max-w-3xl mx-auto">
      {loading ? (
        <div className="text-center py-10 text-[var(--boe-text-muted)]">搜索中...</div>
      ) : query ? (
        <>
          <p className="text-sm text-[var(--boe-dark-secondary)] mb-4">
            搜索「{query}」找到 {posts.length} 个结果
          </p>
          {posts.length === 0 ? (
            <div className="text-center py-16 text-[var(--boe-text-muted)]">
              未找到相关帖子
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-[var(--boe-text-muted)]">请输入搜索关键词</div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Suspense fallback={<div className="text-center py-10 text-[var(--boe-text-muted)]">加载中...</div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
