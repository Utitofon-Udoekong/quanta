import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useUserStore } from '@/app/stores/user';

interface LikeButtonProps {
  contentId: string;
  contentType: string;
  onLikeChange?: (liked: boolean, count: number) => void;
}

export default function LikeButton({ contentId, contentType, onLikeChange }: LikeButtonProps) {
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
        setLikeCount(data.likes || 0);
        setLiked(data.userLiked || false);
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
    if (!user || submitting) return;
    
    // Optimistic update
    const newLiked = !liked;
    const newCount = newLiked ? likeCount + 1 : likeCount - 1;
    
    setLiked(newLiked);
    setLikeCount(newCount);
    setSubmitting(true);
    
    // Notify parent component if callback provided
    if (onLikeChange) {
      onLikeChange(newLiked, newCount);
    }

    try {
      const res = await fetch(`/api/content/${contentType}/${contentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!res.ok) {
        // Revert optimistic update on error
        setLiked(!newLiked);
        setLikeCount(newLiked ? likeCount : likeCount + 1);
        throw new Error('Failed to update like');
      }
      
      const data = await res.json();
      // Update with actual server response
      setLikeCount(data.likes || newCount);
      setLiked(data.liked || newLiked);
      setError(null);
      
      // Notify parent component with actual data
      if (onLikeChange) {
        onLikeChange(data.liked || newLiked, data.likes || newCount);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update like');
      // console.error('Like error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <button className="flex items-center gap-1 text-gray-400 cursor-not-allowed" disabled>
        <Icon icon="mdi:heart-outline" className="w-5 h-5" />
        <span>...</span>
      </button>
    );
  }

  return (
    <button
      className={`flex items-center gap-1 transition-all duration-200 ${
        liked 
          ? 'text-pink-500 hover:text-pink-400' 
          : 'text-gray-400 hover:text-pink-400'
      } ${submitting ? 'opacity-75' : ''}`}
      onClick={handleToggleLike}
      disabled={!user || submitting}
      title={user ? (liked ? 'Unlike' : 'Like') : 'Sign in to like'}
    >
      <Icon 
        icon={liked ? 'mdi:heart' : 'mdi:heart-outline'} 
        className={`w-5 h-5 ${submitting ? 'animate-pulse' : ''}`} 
      />
      <span>{likeCount}</span>
    </button>
  );
} 