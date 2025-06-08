import { useEffect, useState } from 'react';
import { useUserStore } from '@/app/stores/user';
import { Icon } from '@iconify/react';

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

function CommentForm({ onSubmit, loading, initialValue = '', placeholder = 'Add a comment...' }: any) {
  const [value, setValue] = useState(initialValue);
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (!value.trim()) return;
        onSubmit(value);
        setValue('');
      }}
      className="flex gap-2 mt-2"
    >
      <input
        className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? '...' : 'Post'}
      </button>
    </form>
  );
}

function CommentItem({ comment, onReply, onEdit, onDelete, user, replyingTo, editingId, loading }: any) {
  const [showReply, setShowReply] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  return (
    <div className="mb-4">
      <div className="flex items-start gap-3">
        <img src={comment.user.avatar_url || '/default-avatar.png'} alt="avatar" className="w-8 h-8 rounded-full" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{comment.user.username}</span>
            <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleString()}</span>
          </div>
          {editingId === comment.id ? (
            <CommentForm
              initialValue={comment.content}
              loading={loading}
              onSubmit={val => onEdit(comment.id, val)}
              placeholder="Edit your comment..."
            />
          ) : (
            <p className="text-gray-200 text-sm mt-1">{comment.content}</p>
          )}
          <div className="flex gap-2 mt-1 text-xs text-gray-400">
            {user && (
              <button onClick={() => setShowReply(!showReply)} className="hover:underline">Reply</button>
            )}
            {user && user.wallet_address === comment.user.wallet_address && (
              <>
                <button onClick={() => setShowEdit(!showEdit)} className="hover:underline">Edit</button>
                <button onClick={() => onDelete(comment.id)} className="hover:underline text-red-400">Delete</button>
              </>
            )}
          </div>
          {showReply && user && (
            <div className="ml-4 mt-2">
              <CommentForm loading={loading} onSubmit={val => { onReply(comment.id, val); setShowReply(false); }} placeholder={`Reply to @${comment.user.username}`} />
            </div>
          )}
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 mt-2 border-l border-gray-700 pl-4">
          {comment.replies.map((reply: Comment) => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} onEdit={onEdit} onDelete={onDelete} user={user} replyingTo={replyingTo} editingId={editingId} loading={loading} />
          ))}
        </div>
      )}
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
      const res = await fetch(`/api/content/${contentType}/${contentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    setSubmitting(true);
    try {
      const res = await fetch(`/api/content/${contentType}/${id}/comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to edit comment');
      setEditingId(null);
      await fetchComments();
    } catch (err: any) {
      setError(err.message || 'Failed to edit comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/content/${contentType}/${id}/comments`, {
        method: 'DELETE',
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
    <section className="mt-10">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Icon icon="mdi:comment-multiple-outline" className="w-6 h-6" />
        Comments
      </h2>
      {error && <div className="text-red-400 mb-2">{error}</div>}
      {user && (
        <CommentForm loading={submitting} onSubmit={val => handlePost(val)} />
      )}
      {!user && (
        <div className="mb-4 text-gray-400">Sign in to post a comment.</div>
      )}
      {loading ? (
        <div className="text-gray-400">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-gray-400">No comments yet. Be the first to comment!</div>
      ) : (
        <div className="mt-4">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handlePost}
              onEdit={handleEdit}
              onDelete={handleDelete}
              user={user}
              editingId={editingId}
              loading={submitting}
            />
          ))}
        </div>
      )}
    </section>
  );
} 