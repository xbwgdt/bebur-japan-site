import type { ReactElement } from "react";

import { PageBlockRenderer } from "@/components/page-block-renderer";
import { SourceShell } from "@/components/source-faithful/source-shell";
import type { SanityPage } from "@/lib/sanity/queries";

export function PublishedPage({ page }: { page: SanityPage }): ReactElement {
  return (
    <SourceShell>
      <main className="section source-section site-container">
        <PageBlockRenderer blocks={page.blocks} />
      </main>
    </SourceShell>
  );
}
