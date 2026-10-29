// The app's shared controls, in the landing page's Apple style: full pills for buttons, flat
// white cards on the grey ground, one blue for the action and its pale tint for a second choice.

export const inputClassName =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-ink placeholder:text-muted transition-[border-color,box-shadow] duration-150 focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none aria-invalid:border-danger'

export const primaryButtonClassName =
  'press rounded-full bg-brand px-5 py-3 text-center font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50'

export const secondaryButtonClassName =
  'press rounded-full bg-brand-soft px-5 py-3 text-center font-semibold text-accent hover:bg-brand/15'

export const dangerButtonClassName =
  'press rounded-full bg-danger-soft px-5 py-3 text-center font-semibold text-danger hover:bg-danger/15 disabled:opacity-50'

export const cardClassName = 'rounded-[18px] bg-surface p-5'

// A screen's title: the page's one h1, in ink, set like the landing page's headlines but at app size.
export const pageTitleClassName = 'font-display text-[28px] leading-tight font-bold tracking-tight text-ink'

// Messages rise into place (.enter) instead of popping in and shoving the content below.
export const errorBoxClassName = 'enter rounded-2xl bg-danger-soft p-3.5 text-sm text-danger'

export const successBoxClassName = 'enter rounded-2xl bg-ok/12 p-3.5 text-sm text-ok'
