import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useUserStore } from '@/app/stores/user';

interface LikeButtonProps {
  contentId: string;
  contentType: string;
}

export default function LikeButton({ contentId, contentType }: LikeButtonProps) {
  const { user } = useUserStore();
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchLikes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/content/${contentType}/${contentId}/like`);
        if (!res.ok) throw new Error('Failed to fetch likes');
        const data = await res.json();
        setLikeCount(data.count || 0);
        setLiked(data.liked || false);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch likes');
      } finally {
        setLoading(false);
      }
    };
    fetchLikes();
  }, [contentId, contentType, user]);

  const handleToggleLike = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/content/${contentType}/${contentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ like: !liked }),
      });
      if (!res.ok) throw new Error('Failed to update like');
      const data = await res.json();
      setLikeCount(data.count || 0);
      setLiked(data.liked || false);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update like');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <button className="flex items-center gap-1 text-gray-400 cursor-not-allowed" disabled>
        <Icon icon="mdi:heart-outline" className="w-5 h-5" />
        ...
      </button>
    );
  }

  return (
    <button
      className={`flex items-center gap-1 ${liked ? 'text-pink-500' : 'text-gray-400'} hover:text-pink-400 transition`}
      onClick={handleToggleLike}
      disabled={!user || submitting}
      title={user ? (liked ? 'Unlike' : 'Like') : 'Sign in to like'}
    >
      <Icon icon={liked ? 'mdi:heart' : 'mdi:heart-outline'} className="w-5 h-5" />
      <span>{likeCount}</span>
    </button>
  );
} 