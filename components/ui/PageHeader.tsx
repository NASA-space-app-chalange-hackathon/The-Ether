import type { ReactNode } from "react";

/** Page title row: h1 (+ optional intro) on the left, controls on the right. */
export function PageHeader({ title, intro, children }: { title: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {intro && <div className="max-w-2xl text-sm text-muted">{intro}</div>}
      </div>
      {children}
    </div>
  );
}

/** A titled surface. The title is a small mono eyebrow. */
export function Panel({
  title,
  action,
  children,
  className = "",
  ...rest
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLElement>, "title">) {
  return (
    <section className={`surface p-5 ${className}`} {...rest}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="eyebrow">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
