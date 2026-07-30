import Image from "next/image";
import Link from "next/link";

import { resolveSourceMediaPath } from "@/components/source-faithful/source-media";
import type { Application } from "@/lib/types";

export function ApplicationCard({
  application,
}: {
  application: Application;
}): React.ReactElement {
  const image = application.images[0];

  return (
    <article className="application-card card">
      <div className="application-card__media">
        {image ? (
          <Image
            alt={image.alt}
            height={360}
            sizes="(min-width: 64rem) 25vw, (min-width: 40rem) 50vw, 100vw"
            src={resolveSourceMediaPath(image.src)}
            width={560}
          />
        ) : (
          <div
            className="application-card__fallback"
            role="img"
            aria-label={`${application.title} イメージ`}
          >
            <span>BEBUR</span>
            <strong>APPLICATION</strong>
          </div>
        )}
      </div>
      <div className="application-card__body">
        <h3>{application.title}</h3>
        <p>{application.description}</p>
        <Link className="application-card__link" href={application.route}>
          導入分野を見る
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
