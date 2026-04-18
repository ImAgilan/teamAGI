/**
 * PostSkeleton — Loading placeholder for post cards
 */
export default function PostSkeleton() {
  return (
    <div className="card p-4 mb-3">
      <div className="flex items-start gap-3 mb-3">
        <div className="skeleton w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 w-32 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="skeleton h-3.5 w-full rounded" />
        <div className="skeleton h-3.5 w-4/5 rounded" />
        <div className="skeleton h-3.5 w-3/5 rounded" />
      </div>
      <div className="skeleton h-48 w-full rounded-xl mb-3" />
      <div className="flex gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-5 w-12 rounded" />
        ))}
      </div>
    </div>
  );
}
