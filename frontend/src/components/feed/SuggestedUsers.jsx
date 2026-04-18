/**
 * SuggestedUsers — Right sidebar widget
 */
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, followService } from '../../services';
import Avatar from '../shared/Avatar';

export default function SuggestedUsers() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => userService.getSuggestions(),
    select: (r) => r.data.suggestions,
  });

  const followMutation = useMutation({
    mutationFn: (userId) => followService.toggleFollow(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suggestions'] }),
  });

  if (isLoading) return (
    <div className="card p-4 space-y-3">
      <div className="skeleton h-4 w-32 rounded" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <div className="skeleton h-3 w-28 rounded" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
          <div className="skeleton h-7 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );

  if (!data?.length) return null;

  return (
    <div className="card p-4">
      <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
        Who to follow
      </h3>
      <div className="space-y-3">
        {data.map((user) => (
          <div key={user._id} className="flex items-center gap-3">
            <Link to={`/profile/${user.username}`}>
              <Avatar src={user.avatar?.url} name={user.displayName} size={38} />
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                to={`/profile/${user.username}`}
                className="font-semibold text-sm truncate block hover:underline"
                style={{ color: 'var(--text-primary)' }}
              >
                {user.displayName}
              </Link>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                @{user.username} · {user.followersCount} followers
              </p>
            </div>
            <button
              onClick={() => followMutation.mutate(user._id)}
              disabled={followMutation.isPending}
              className="btn-secondary !py-1 !px-3 text-xs shrink-0"
            >
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
