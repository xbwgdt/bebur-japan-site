import path from "node:path";
import { createRequire } from "node:module";

import { JSDOM } from "jsdom";
import { Schema } from "@sanity/schema";
import { builtinTypes, groupProblems, validateSchema } from "@sanity/schema/_internal";
import { validateDocumentWithWorkspace as validateDocument } from "@sanity/validation";
import { createViteServer } from "vitest/node";

const require = createRequire(import.meta.url);

const offlineClient = {
  withConfig: () => offlineClient,
  // The built-in Sanity slug validator asks the client whether a matching slug
  // already exists. Generated document IDs and slugs are validated locally, so
  // return `true` (unique) without constructing a network-capable client.
  fetch: async () => true,
};

export async function validateSanityImportDocuments(documents, { existingDocumentIds = [] } = {}) {
  const root = process.cwd();
  const hadWindow = Object.hasOwn(globalThis, "window");
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const hadDocument = Object.hasOwn(globalThis, "document");
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  let dom;
  let moduleServer;

  try {
    if (!hadWindow) {
      dom = new JSDOM("<!doctype html><html><body></body></html>");
      globalThis.window = dom.window;
      globalThis.document = dom.window.document;
    }
    moduleServer = await createViteServer({
      appType: "custom",
      configFile: path.join(root, "vitest.config.mts"),
      logLevel: "silent",
      root,
      // This server only loads schema definitions once; watching the entire
      // checkout adds a costly filesystem scan on Windows without any benefit.
      server: { middlewareMode: true, watch: null },
      // Schema files only use Sanity's define* helpers and type-only imports.
      // Resolve those helpers to the same official exports without the Studio UI.
      resolve: {
        alias: [{ find: /^sanity$/, replacement: require.resolve("@sanity/types") }],
      },
    });
    const { schemaTypes } = await moduleServer.ssrLoadModule(
      "/sanity/schemaTypes/index.ts",
    );
    // Keep Sanity's built-in slug/asset types and schema-definition checks.
    // These three headless packages are pinned to the same Studio version.
    const problems = groupProblems(validateSchema(schemaTypes, { parentTypes: builtinTypes }).getTypes());
    if (problems.some(group => group.problems.some(problem => problem.severity === "error"))) {
      throw new Error("Sanity schema definition validation failed");
    }
    const schema = Schema.compile({
      name: "import-validation",
      types: [...builtinTypes, ...schemaTypes],
    });
    const documentIds = new Set([...documents.map(({ _id }) => _id), ...existingDocumentIds]);
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
          // Match sanity.validateDocument: keep reference shape/existence checks
          // offline, without enabling the headless API's remote type lookups.
          validateReferenceTypes: false,
          getDocumentExists: async ({ id }) => documentIds.has(id),
        }),
      ),
    );

    return validationResults.flat().filter(({ level }) => level === "error");
  } finally {
    try {
      await moduleServer?.close();
    } finally {
      try {
        if (hadWindow) {
          Object.defineProperty(globalThis, "window", previousWindow);
        } else {
          delete globalThis.window;
        }
      } finally {
        try {
          if (hadDocument) {
            Object.defineProperty(globalThis, "document", previousDocument);
          } else {
            delete globalThis.document;
          }
        } finally {
          dom?.window.close();
        }
      }
    }
  }
}
