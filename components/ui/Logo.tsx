/** Abstract mark: an orbit ring with one accent arc and a pulse line. */
export function LogoMark({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className={`shrink-0 ${className}`}>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity={0.22} strokeWidth={2} />
      <path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5" className="stroke-accent" strokeWidth={2} strokeLinecap="round" />
      <path d="M6.5 12.5h2.4l1.6-3.2 3 6.4 1.6-3.2h2.4" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
