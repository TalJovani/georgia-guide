// A small round count of new messages. Shows nothing when there are none.
export function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span
      aria-label={`${count} הודעות חדשות`}
      className="inline-grid min-w-5 place-items-center rounded-full bg-brand px-1.5 text-xs font-bold text-on-brand tabular-nums"
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
