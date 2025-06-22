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

function CommentForm({ onSubmit, onCancel, loading, initialValue = '', placeholder = 'Add a comment...' }: any) {
  const [value, setValue] = useState(initialValue);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value);
    setValue('');
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        className="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
        rows={3}
      />
      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || !value.trim()}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Icon icon="mdi:loading" className="animate-spin h-4 w-4" />
              Posting...
            </span>
          ) : (
            'Post Comment'
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function CommentItem({ comment, onReply, onEdit, onDelete, user, replyingTo, editingId, loading, setEditingId }: any) {
  const [showReply, setShowReply] = useState(false);

  const handleEditSubmit = (newContent: string) => {
    onEdit(comment.id, newContent);
    setEditingId(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const handleReplySubmit = (content: string) => {
    onReply(comment.id, content);
    setShowReply(false);
  };

  const handleReplyCancel = () => {
    setShowReply(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="group hover:bg-gray-900/30 rounded-lg p-4 transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <img 
            src={comment.user.avatar_url || `https://robohash.org/${comment.user.wallet_address}`} 
            alt="avatar" 
            className="w-10 h-10 rounded-full border-2 border-gray-700"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-sm text-white">
              {comment.user.username || comment.user.wallet_address?.slice(0, 8) + '...'}
            </span>
            <span className="text-xs text-gray-400">
              {formatDate(comment.created_at)}
            </span>
            {comment.updated_at !== comment.created_at && (
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                edited
              </span>
            )}
          </div>
          
          {editingId === comment.id ? (
            <div className="mb-3">
              <CommentForm
                initialValue={comment.content}
                loading={loading}
                onSubmit={handleEditSubmit}
                onCancel={handleEditCancel}
                placeholder="Edit your comment..."
              />
            </div>
          ) : (
            <p className="text-gray-200 text-sm leading-relaxed mb-3">{comment.content}</p>
          )}
          
          <div className="flex items-center gap-4 text-xs">
            {user && !showReply && editingId !== comment.id && (
              <button 
                onClick={() => setShowReply(true)} 
                className="text-gray-400 hover:text-purple-400 transition-colors font-medium"
              >
                Reply
              </button>
            )}
            {user && user.wallet_address === comment.user.wallet_address && editingId !== comment.id && (
              <>
                <button 
                  onClick={() => setEditingId(comment.id)} 
                  className="text-gray-400 hover:text-blue-400 transition-colors font-medium"
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDelete(comment.id)} 
                  className="text-gray-400 hover:text-red-400 transition-colors font-medium"
                >
                  Delete
                </button>
              </>
            )}
          </div>
          
          {showReply && user && editingId !== comment.id && (
            <div className="mt-4 ml-4 pl-4 border-l-2 border-purple-500/30">
              <CommentForm 
                loading={loading} 
                onSubmit={handleReplySubmit} 
                onCancel={handleReplyCancel}
                placeholder={`Reply to @${comment.user.username || comment.user.wallet_address?.slice(0, 8)}`} 
              />
            </div>
          )}
        </div>
      </div>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 ml-14 pl-4 border-l-2 border-gray-700 space-y-4">
          {comment.replies.map((reply: Comment) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              onReply={onReply} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              user={user} 
              replyingTo={replyingTo} 
              editingId={editingId} 
              loading={loading}
              setEditingId={setEditingId}
            />
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
    <section className="mt-10 bg-[#121418] rounded-lg p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-600/20 rounded-lg">
          <Icon icon="mdi:comment-multiple-outline" className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Comments</h2>
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
      
      {user && (
        <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
          <CommentForm loading={submitting} onSubmit={(val: string) => handlePost(val)} />
        </div>
      )}
      
      {!user && (
        <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 text-center">
          <p className="text-gray-400">Sign in to post a comment.</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-gray-400">
            <Icon icon="mdi:loading" className="animate-spin h-5 w-5" />
            <span>Loading comments...</span>
          </div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <Icon icon="mdi:comment-outline" className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handlePost}
              onEdit={handleEdit}
              onDelete={handleDelete}
              user={user}
              replyingTo={null}
              editingId={editingId}
              loading={submitting}
              setEditingId={setEditingId}
            />
          ))}
        </div>
      )}
    </section>
  );
} 