export const SITE_SETTINGS_DOCUMENT_ID = "siteSettings";

const singletonSchemaTypes = new Set([SITE_SETTINGS_DOCUMENT_ID]);

export function filterSingletonTemplates<T extends { schemaType: string }>(
  templates: T[],
): T[] {
  return templates.filter(
    (template) => !singletonSchemaTypes.has(template.schemaType),
  );
}

export function filterSingletonCreationOptions<
  T extends { templateId: string },
>(options: T[]): T[] {
  return options.filter(
    (option) => !singletonSchemaTypes.has(option.templateId),
  );
}

export function filterSingletonActions<T extends { action?: string }>(
  actions: T[],
  context: { schemaType: string },
): T[] {
  if (!singletonSchemaTypes.has(context.schemaType)) {
    return actions;
  }

  return actions.filter((action) => action.action !== "duplicate");
}
