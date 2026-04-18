/**
 * AdminPage — Dashboard with analytics and user/post management
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, FileText, TrendingUp, ShieldCheck, Ban, Trash2, UserCheck, Crown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { adminService } from '../services';
import Avatar from '../components/shared/Avatar';

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon size={18} style={{ color }} />
      </div>
    </div>
    <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </p>
  </div>
);

export default function AdminPage() {
  const [tab, setTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: analytics } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: () => adminService.getAnalytics(),
    select: (r) => r.data.analytics,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers', userSearch],
    queryFn: () => adminService.getUsers({ search: userSearch }),
    enabled: tab === 'users',
    select: (r) => r.data,
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['adminPosts'],
    queryFn: () => adminService.getPosts(),
    enabled: tab === 'posts',
    select: (r) => r.data,
  });

  const banMutation = useMutation({
    mutationFn: ({ id, reason }) => adminService.banUser(id, reason),
    onSuccess: () => { toast.success('User banned'); queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); },
  });

  const unbanMutation = useMutation({
    mutationFn: (id) => adminService.unbanUser(id),
    onSuccess: () => { toast.success('User unbanned'); queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); },
  });

  const removePostMutation = useMutation({
    mutationFn: (id) => adminService.removePost(id, 'Violated community guidelines'),
    onSuccess: () => { toast.success('Post removed'); queryClient.invalidateQueries({ queryKey: ['adminPosts'] }); },
  });

  const TABS = ['overview', 'users', 'posts'];

  return (
    <div className="py-4 animate-fade-in px-4 sm:px-0">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck size={24} style={{ color: 'var(--brand)' }} />
        <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-tertiary)' }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all"
            style={{
              background: tab === t ? 'var(--bg-secondary)' : 'transparent',
              color: tab === t ? 'var(--brand)' : 'var(--text-muted)',
              boxShadow: tab === t ? 'var(--card-shadow)' : 'none',
            }}
          >{t}</button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="Total Users" value={analytics.users.total} icon={Users} color="#3b82f6" />
            <StatCard label="Active Users" value={analytics.users.active} icon={UserCheck} color="#10b981" />
            <StatCard label="Banned Users" value={analytics.users.banned} icon={Ban} color="#ef4444" />
            <StatCard label="Total Posts" value={analytics.posts.total} icon={FileText} color="#8b5cf6" />
            <StatCard label="Posts Today" value={analytics.posts.today} icon={TrendingUp} color="#f59e0b" />
            <StatCard label="Comments" value={analytics.comments.total} icon={FileText} color="#06b6d4" />
          </div>

          {/* Top Posts */}
          {analytics.topPosts?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>🔥 Top Posts</h3>
              <div className="space-y-3">
                {analytics.topPosts.map((post) => (
                  <div key={post._id} className="flex items-start gap-3 pb-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <Avatar src={post.author?.avatar?.url} name={post.author?.displayName} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{post.author?.displayName}</p>
                      <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{post.content || '[Media post]'}</p>
                    </div>
                    <div className="text-xs text-right shrink-0" style={{ color: 'var(--text-muted)' }}>
                      <p>❤️ {post.likesCount}</p>
                      <p>💬 {post.commentsCount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div className="space-y-4">
          <input
            placeholder="Search users by name or email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="input"
          />
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['User', 'Email', 'Role', 'Joined', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usersLoading && (
                  <tr><td colSpan={6} className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</td></tr>
                )}
                {users?.users?.map((user) => (
                  <tr key={user._id} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={user.avatar?.url} name={user.displayName} size={32} />
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user.displayName}</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: user.role === 'admin' ? '#f59e0b' : 'var(--text-muted)' }}>
                        {user.role === 'admin' && <Crown size={11} />}{user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.isBanned ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {user.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.role !== 'admin' && (
                        user.isBanned ? (
                          <button onClick={() => unbanMutation.mutate(user._id)} className="text-xs font-medium text-green-600 hover:underline">
                            Unban
                          </button>
                        ) : (
                          <button onClick={() => banMutation.mutate({ id: user._id, reason: 'Violation' })} className="text-xs font-medium text-red-500 hover:underline">
                            Ban
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POSTS */}
      {tab === 'posts' && (
        <div className="space-y-3">
          {postsLoading && <p style={{ color: 'var(--text-muted)' }}>Loading posts...</p>}
          {posts?.posts?.map((post) => (
            <div key={post._id} className="card p-4 flex items-start gap-3">
              <Avatar src={post.author?.avatar?.url} name={post.author?.displayName} size={38} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{post.author?.displayName}</p>
                <p className="text-sm line-clamp-2 mt-0.5" style={{ color: 'var(--text-secondary)' }}>{post.content || '[Media post]'}</p>
                <div className="flex gap-3 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>❤️ {post.likesCount}</span>
                  <span>💬 {post.commentsCount}</span>
                  <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                  {post.isDeleted && <span className="text-red-500 font-semibold">REMOVED</span>}
                </div>
              </div>
              {!post.isDeleted && (
                <button onClick={() => removePostMutation.mutate(post._id)} className="btn-ghost p-1.5 !rounded-lg text-red-400 hover:text-red-600 shrink-0">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
