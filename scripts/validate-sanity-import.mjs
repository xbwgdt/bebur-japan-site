import path from "node:path";

import { JSDOM } from "jsdom";
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
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const hadDocument = Object.hasOwn(globalThis, "document");
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  let dom;
  if (!hadWindow) {
    dom = new JSDOM("<!doctype html><html><body></body></html>");
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
  }
  let moduleServer;

  try {
    moduleServer = await createViteServer({
      appType: "custom",
      configFile: path.join(root, "vitest.config.ts"),
      logLevel: "silent",
      root,
      server: { middlewareMode: true },
    });
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
    try {
      await moduleServer?.close();
    } finally {
      if (hadWindow) {
        Object.defineProperty(globalThis, "window", previousWindow);
      } else {
        delete globalThis.window;
      }
      if (hadDocument) {
        Object.defineProperty(globalThis, "document", previousDocument);
      } else {
        delete globalThis.document;
      }
      dom?.window.close();
    }
  }
}
