export type SourceAssetPath =
  | `/source-media/${string}`
  | `/media/${string}`;

export type ContentMediaPath =
  | SourceAssetPath
  | `https://cdn.sanity.io/${string}`;

const sourceMediaAliases: Record<string, SourceAssetPath> = {
  "/products/1762415950641929-447d86cda61a24c2.jpg":
    "/source-media/1762412119440303-447d86cda61a24c2.jpg",
};

export function resolveSourceMediaPath(path: string): ContentMediaPath {
  if (path.startsWith("https://cdn.sanity.io/")) {
    return path as `https://cdn.sanity.io/${string}`;
  }

  if (path.startsWith("/source-media/") || path.startsWith("/media/")) {
    return path as SourceAssetPath;
  }

  const alias = sourceMediaAliases[path];
  if (alias) {
    return alias;
  }

  const legacyMatch = path.match(
    /^\/(?:products|applications)\/([a-zA-Z0-9._-]+)$/,
  );
  if (legacyMatch) {
    return `/source-media/${legacyMatch[1]}`;
  }

  throw new Error(`Unsupported source media path: ${path}`);
}
