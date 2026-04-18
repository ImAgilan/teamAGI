/**
 * CommentSection — Inline comments under a post
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Trash2, Heart } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { commentService } from '../../services';
import Avatar from '../shared/Avatar';
import useAuthStore from '../../store/authStore';

export function CommentSection({ postId }) {
  const [text, setText] = useState('');
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => commentService.getComments(postId),
    select: (r) => r.data,
  });

  const addMutation = useMutation({
    mutationFn: () => commentService.addComment(postId, { content: text }),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to post comment'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => commentService.deleteComment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', postId] }),
  });

  return (
    <div className="border-t px-4 py-3" style={{ borderColor: 'var(--border)' }}>
      {/* Input */}
      <div className="flex gap-2.5 mb-4">
        <Avatar src={currentUser?.avatar?.url} name={currentUser?.displayName} size={32} />
        <div className="flex-1 flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            className="input !py-1.5 !px-3 text-sm flex-1"
            onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) addMutation.mutate(); }}
          />
          <button
            onClick={() => addMutation.mutate()}
            disabled={!text.trim() || addMutation.isPending}
            className="btn-primary p-1.5 !rounded-lg shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* Comments list */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-2.5">
              <div className="skeleton w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3 w-24 rounded" />
                <div className="skeleton h-3 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {data?.comments?.map((comment) => (
          <div key={comment._id} className="flex gap-2.5 group">
            <Link to={`/profile/${comment.author.username}`}>
              <Avatar src={comment.author.avatar?.url} name={comment.author.displayName} size={32} />
            </Link>
            <div className="flex-1 min-w-0">
              <div
                className="rounded-2xl rounded-tl-sm px-3 py-2"
                style={{ background: 'var(--bg-tertiary)' }}
              >
                <Link
                  to={`/profile/${comment.author.username}`}
                  className="text-sm font-semibold hover:underline"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {comment.author.displayName}
                </Link>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {comment.content}
                </p>
              </div>
              <div className="flex items-center gap-3 mt-1 px-2">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
                {comment.likesCount > 0 && (
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Heart size={10} fill="currentColor" className="text-red-400" />
                    {comment.likesCount}
                  </span>
                )}
                {comment.author._id === currentUser?._id && (
                  <button
                    onClick={() => deleteMutation.mutate(comment._id)}
                    className="text-xs opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 flex items-center gap-1"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {data?.total > 5 && (
        <button className="text-sm font-medium mt-3" style={{ color: 'var(--brand)' }}>
          View all {data.total} comments
        </button>
      )}
    </div>
  );
}

export default CommentSection;
