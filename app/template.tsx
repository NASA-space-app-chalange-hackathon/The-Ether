import type { ReactNode } from "react";

/** Re-mounts on every navigation: a short CSS entrance (reduced-motion → fade only). */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-enter">{children}</div>;
}
