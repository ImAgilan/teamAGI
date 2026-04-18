/**
 * PostMenu — Dropdown context menu for post actions
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2, Flag, Link2, EyeOff } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { postService } from '../../services';

export default function PostMenu({ post, isOwn, queryKey, onClose }) {
  const ref = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const deleteMutation = useMutation({
    mutationFn: () => postService.deletePost(post._id),
    onSuccess: () => {
      toast.success('Post deleted');
      queryClient.invalidateQueries({ queryKey });
      onClose();
    },
    onError: () => toast.error('Failed to delete post'),
  });

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/posts/${post._id}`);
    toast.success('Link copied!');
    onClose();
  };

  const items = [
    { icon: Link2, label: 'Copy link', onClick: copyLink, show: true },
    { icon: Trash2, label: 'Delete post', onClick: () => deleteMutation.mutate(), show: isOwn, danger: true },
    { icon: Flag, label: 'Report post', onClick: () => { toast('Report submitted'); onClose(); }, show: !isOwn },
  ].filter((i) => i.show);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-8 z-50 w-44 rounded-xl py-1 shadow-xl border animate-fade-in"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
    >
      {items.map(({ icon: Icon, label, onClick, danger }) => (
        <button
          key={label}
          onClick={onClick}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors text-left"
          style={{ color: danger ? '#ef4444' : 'var(--text-primary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}
