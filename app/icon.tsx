import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-static";

export const size = {
  width: 1173,
  height: 406,
};

export const contentType = "image/png";

export default async function Icon(): Promise<Response> {
  const image = await readFile(
    join(process.cwd(), "public", "media", "brand", "bebur-favicon.png"),
  );

  return new Response(new Uint8Array(image), {
    headers: { "Content-Type": contentType },
  });
}
