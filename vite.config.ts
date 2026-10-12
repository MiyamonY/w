import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const RequiredEnv = [
  "WORKER_D1_DATABASE_ID",
  "WORKER_ACCESS_TEAM_DOMAIN",
  "WORKER_ACCESS_AUD",
] as const;

export default defineConfig(({ command }) => {
  const env = process.env;
  const isBuild = command === "build";
  if (isBuild) {
    const missing = RequiredEnv.filter((key) => !env[key]);
    if (missing.length > 0) {
      throw new Error(`環境変数 ${missing.join(", ")} を設定してください`);
    }
  }

  return {
    plugins: [
      tailwindcss(),
      cloudflare({
        config: (config) => {
          if (!isBuild) return;
          if (env.WORKER_DOMAIN) {
            config.routes = [{ pattern: env.WORKER_DOMAIN, custom_domain: true }];
          } else {
            config.workers_dev = true;
          }
          for (const db of config.d1_databases) {
            if (db.binding === "DB") db.database_id = env.WORKER_D1_DATABASE_ID;
          }
          config.vars = {
            ...config.vars,
            ACCESS_TEAM_DOMAIN: env.WORKER_ACCESS_TEAM_DOMAIN,
            ACCESS_AUD: env.WORKER_ACCESS_AUD,
          };
        },
      }),
    ],
    publicDir: false,
    environments: {
      client: {
        build: {
          rolldownOptions: {
            input: { app: "src/view/client.ts" },
            onwarn: (warning, defaultHandler) => {
              if (warning.code === "EVAL" && warning.id?.includes("/htmx.org/")) return;
              defaultHandler(warning);
            },
            output: {
              entryFileNames: "assets/[name].js",
              assetFileNames: "assets/[name][extname]",
            },
          },
        },
      },
    },
  };
});
