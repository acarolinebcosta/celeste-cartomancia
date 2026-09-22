import { loadConfig } from "./config/env.js";
import { buildApp } from "./app.js";

try {
  process.loadEnvFile?.(".env");
} catch {
  // Environment variables may be supplied directly in production.
}

const config = loadConfig();
const app = await buildApp({ config });

try {
  await app.listen({ port: config.port, host: config.host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
