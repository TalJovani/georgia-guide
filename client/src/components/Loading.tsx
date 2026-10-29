// A screen still waiting for its data. The attribute tells a screen change in progress to hold
// the old screen a moment longer, so the new one slides in with its content, not with this line.
export function Loading() {
  return (
    <p data-screen-loading className="text-muted">
      טוען...
    </p>
  )
}
