import path from "node:path";

import { createSchema, validateDocument } from "sanity";
import { createViteServer } from "vitest/node";

const offlineClient = {
  withConfig: () => offlineClient,
  // The built-in Sanity slug validator asks the client whether a matching slug
  // already exists. Generated document IDs and slugs are validated locally, so
  // return `true` (unique) without constructing a network-capable client.
  fetch: async () => true,
};

export async function validateSanityImportDocuments(documents) {
  const root = process.cwd();
  const hadWindow = Object.hasOwn(globalThis, "window");
  const previousWindow = globalThis.window;
  if (!hadWindow) {
    globalThis.window = globalThis;
  }
  const moduleServer = await createViteServer({
    appType: "custom",
    configFile: path.join(root, "vitest.config.ts"),
    logLevel: "silent",
    root,
    server: { middlewareMode: true },
  });

  try {
    const { schemaTypes } = await moduleServer.ssrLoadModule(
      "/sanity/schemaTypes/index.ts",
    );
    const schema = createSchema({
      name: "import-validation",
      types: schemaTypes,
    });
    const documentIds = new Set(documents.map(({ _id }) => _id));
    const workspace = {
      schema,
      // Sanity injects a client into every validator context. The local stub
      // implements its built-in slug uniqueness contract without remote I/O.
      getClient: () => offlineClient,
    };
    const validationResults = await Promise.all(
      documents.map((document) =>
        validateDocument({
          document,
          workspace,
          environment: "studio",
          getDocumentExists: async ({ id }) => documentIds.has(id),
        }),
      ),
    );

    return validationResults.flat().filter(({ level }) => level === "error");
  } finally {
    await moduleServer.close();
    if (hadWindow) {
      globalThis.window = previousWindow;
    } else {
      delete globalThis.window;
    }
  }
}
