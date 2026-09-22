export function resolveMockApiMode(
  configuredValue: string | undefined,
  isProduction: boolean,
) {
  const usingMockApi = configuredValue === "true";
  if (isProduction && usingMockApi) {
    throw new Error("Mock API cannot be enabled in production.");
  }
  return usingMockApi;
}

export const usingMockApi = resolveMockApiMode(
  import.meta.env.VITE_USE_MOCK_API,
  import.meta.env.PROD,
);
