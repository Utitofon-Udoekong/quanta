import { useEffect, useState } from 'react';
import { useUserStore } from '@/app/stores/user';
import { Icon } from '@iconify/react';
import Cookies from 'js-cookie';
import { cookieName } from '@/app/utils/supabase';

interface Comment {
  id: string;
  content: string;
  user: {
    username: string;
    avatar_url: string;
    wallet_address: string;
  };
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  replies?: Comment[];
}

interface CommentSectionProps {
  contentId: string;
  contentType: string;
}

function CommentForm({
  onSubmit,
  onCancel,
  loading,
  initialValue = '',
  placeholder = 'Add a comment...',
  userAvatar,
}: {
  onSubmit: (value: string) => void;
  onCancel?: () => void;
  loading: boolean;
  initialValue?: string;
  placeholder?: string;
  userAvatar?: string;
}) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSubmit(value);
    if (!initialValue) {
        setValue('');
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-4">
      {userAvatar && (
        <img
          src={userAvatar}
          alt="Your avatar"
          className="h-10 w-10 rounded-full border-2 border-transparent group-hover:border-purple-500 transition-colors"
        />
      )}
      <div className="flex-1">
        <textarea
          className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-transparent transition-all"
        value={value}
          onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
          rows={initialValue ? 3 : 2}
      />
        <div className="mt-2 flex items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
          )}
      <button
        type="submit"
            className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:saturate-50 disabled:cursor-not-allowed transition-all shadow-lg"
            disabled={loading || !value.trim()}
      >
            {loading ? 'Submitting...' : 'Submit'}
      </button>
        </div>
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  user,
  editingId,
  setEditingId,
  loading,
}: {
  comment: Comment;
  onReply: (parentId: string, content: string) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  user: any;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  loading: boolean;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const isEditing = editingId === comment.id;

  const handleEditSubmit = (newContent: string) => {
    onEdit(comment.id, newContent);
  };

  const handleReplySubmit = (content: string) => {
    onReply(comment.id, content);
    setIsReplying(false);
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
  };
  
  return (
    <div className="group relative flex items-start gap-4">
      <img
        src={comment.user.avatar_url || `https://robohash.org/${comment.user.wallet_address}`}
        alt="avatar"
        className="h-10 w-10 rounded-full border-2 border-gray-800"
      />
        <div className="flex-1">
        <div className="bg-gray-900/60 rounded-lg px-4 py-3">
          <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white">
                {comment.user.username || comment.user.wallet_address?.slice(0, 8) + '...'}
              </span>
              {comment.user.wallet_address === user?.wallet_address && (
                <span className="text-xs bg-purple-600/50 text-purple-300 px-2 py-0.5 rounded-full">
                  You
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">{timeAgo(comment.created_at)} ago</span>
          </div>

          {isEditing ? (
            <div className="py-2">
            <CommentForm
              initialValue={comment.content}
              loading={loading && editingId === comment.id}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditingId(null)}
              placeholder="Edit your comment..."
            />
            </div>
          ) : (
            <p className="text-gray-300 text-sm">{comment.content}</p>
          )}
        </div>

        {!isEditing && (
           <div className="mt-1 flex items-center gap-4 text-xs text-gray-400 font-medium">
            {user && (
              <button onClick={() => setIsReplying(!isReplying)} className="hover:text-purple-400 transition-colors">
                Reply
              </button>
            )}
            {user?.wallet_address === comment.user.wallet_address && (
              <>
                <button onClick={() => setEditingId(comment.id)} className="hover:text-blue-400 transition-colors">
                  Edit
                </button>
                <button onClick={() => onDelete(comment.id)} className="hover:text-red-400 transition-colors">
                  Delete
                </button>
              </>
            )}
             {comment.updated_at !== comment.created_at && (
              <span className="text-gray-500">(edited)</span>
            )}
          </div>
        )}

        {isReplying && (
          <div className="mt-3">
            <CommentForm
              loading={loading}
              onSubmit={handleReplySubmit}
              onCancel={() => setIsReplying(false)}
              placeholder={`Replying to @${comment.user.username || comment.user.wallet_address?.slice(0, 8)}`}
              userAvatar={user.avatar_url || `https://robohash.org/${user.wallet_address}`}
            />
            </div>
          )}

      {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4 pl-6 border-l-2 border-gray-800">
          {comment.replies.map((reply: Comment) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                user={user}
                editingId={editingId}
                setEditingId={setEditingId}
                loading={loading}
              />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default function CommentSection({ contentId, contentType }: CommentSectionProps) {
  const { user } = useUserStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/${contentType}/${contentId}/comments`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      setComments(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line
  }, [contentId, contentType]);

  const handlePost = async (content: string, parentId: string | null = null) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const token = Cookies.get(cookieName);
      const res = await fetch(`/api/content/${contentType}/${contentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content, parentId }),
      });
      if (!res.ok) throw new Error('Failed to post comment');
      await fetchComments();
    } catch (err: any) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (id: string, content: string) => {
    if (!user) return;
    setEditingId(id);
    setSubmitting(true);
    try {
      const token = Cookies.get(cookieName);
      const res = await fetch(`/api/content/${contentType}/${contentId}/comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ commentId: id, content }),
      });
      if (!res.ok) throw new Error('Failed to edit comment');
      setEditingId(null);
      await fetchComments();
    } catch (err: any) {
      setError(err.message || 'Failed to edit comment');
    } finally {
      setSubmitting(false);
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const token = Cookies.get(cookieName);
      const res = await fetch(`/api/content/${contentType}/${contentId}/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ commentId: id }),
      });
      if (!res.ok) throw new Error('Failed to delete comment');
      await fetchComments();
    } catch (err: any) {
      setError(err.message || 'Failed to delete comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-10 bg-gradient-to-b from-[#1a1c23] to-[#121418] rounded-2xl p-6 shadow-2xl border border-gray-800">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-purple-600/30 to-blue-600/30 rounded-xl">
          <Icon icon="mdi:comment-multiple-outline" className="w-7 h-7 text-purple-300" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Comments</h2>
          <p className="text-sm text-gray-400">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </p>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      
      {user ? (
        <div className="mb-8">
          <CommentForm
            loading={submitting && !editingId}
            onSubmit={(val: string) => handlePost(val)}
            userAvatar={user.avatar_url || `https://robohash.org/${user.wallet_address}`}
          />
        </div>
      ) : (
        <div className="mb-8 p-6 bg-gray-900/50 rounded-lg border border-dashed border-gray-700 text-center">
          <p className="text-gray-400 font-medium">Sign in to join the conversation.</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Icon icon="mdi:loading" className="animate-spin h-8 w-8 text-purple-400 mb-4" />
          <p className="text-gray-400 font-medium">Loading comments...</p>
          <p className="text-xs text-gray-500">Please wait a moment.</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <Icon icon="mdi:comment-question-outline" className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="font-bold text-lg text-gray-300">No comments yet</h3>
          <p className="text-gray-500">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handlePost}
              onEdit={handleEdit}
              onDelete={handleDelete}
              user={user}
              editingId={editingId}
              setEditingId={setEditingId}
              loading={submitting}
            />
          ))}
        </div>
      )}
    </section>
  );
} 