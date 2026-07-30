export type StudioEnvironment = {
  projectId: string;
  dataset: string;
  apiVersion: string;
};

type Environment = Readonly<Record<string, string | undefined>>;

export function readStudioEnvironment(
  environment: Environment = process.env,
): StudioEnvironment {
  const projectId = environment.SANITY_STUDIO_PROJECT_ID?.trim();

  if (!projectId) {
    throw new Error(
      "缺少 SANITY_STUDIO_PROJECT_ID。请在 Sanity Studio 环境中设置该公开变量。",
    );
  }

  return {
    projectId,
    dataset: environment.SANITY_STUDIO_DATASET?.trim() || "production",
    apiVersion:
      environment.SANITY_STUDIO_API_VERSION?.trim() || "2025-02-19",
  };
}
