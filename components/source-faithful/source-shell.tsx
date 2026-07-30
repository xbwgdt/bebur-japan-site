import type { ReactNode } from "react";

export function SourceShell({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  return (
    <div className="source-shell" data-testid="source-shell">
      {children}
    </div>
  );
}
