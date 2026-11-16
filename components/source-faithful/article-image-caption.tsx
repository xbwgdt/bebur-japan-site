import type {ContentImage} from "@/lib/types";
import manifest from "@/content/source/article-image-completion-20261116.json";
import localized from "@/content/source/six-image-localization-20261116.json";
import {resolveSourceMediaPath} from "./source-media";

export function ArticleImageCaption({kind,slug,image}: {kind:string;slug:string;image:ContentImage}) {
  const expandable=manifest.pages.some(page=>page.type===kind&&page.slug===slug) || (kind === "news" && localized.assets.some(asset=>asset.slug===slug));
  return <figcaption>{image.alt}{expandable&&<> <a className="article-image-expand" href={resolveSourceMediaPath(image.src)} target="_blank" rel="noopener noreferrer" aria-label={`${image.alt}を拡大表示（新しいタブ）`}>拡大表示</a></>}</figcaption>;
}
