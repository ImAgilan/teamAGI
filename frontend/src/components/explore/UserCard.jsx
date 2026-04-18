/**
 * UserCard — Search result user item
 */
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { followService } from '../../services';
import Avatar from '../shared/Avatar';

export function UserCard({ user }) {
  const queryClient = useQueryClient();
  const followMutation = useMutation({
    mutationFn: () => followService.toggleFollow(user._id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['search'] }),
  });

  return (
    <div className="card flex items-center gap-3 p-3">
      <Link to={`/profile/${user.username}`}>
        <Avatar src={user.avatar?.url} name={user.displayName} size={46} />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/profile/${user.username}`}
          className="font-semibold text-sm hover:underline block truncate"
          style={{ color: 'var(--text-primary)' }}>
          {user.displayName}
        </Link>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
          @{user.username} · {user.followersCount} followers
        </p>
        {user.bio && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{user.bio}</p>}
      </div>
      <button
        onClick={() => followMutation.mutate()}
        className="btn-primary !py-1.5 !px-3 text-xs shrink-0"
      >
        Follow
      </button>
    </div>
  );
}

export default UserCard;
