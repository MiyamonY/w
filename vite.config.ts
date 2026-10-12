import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { z } from "zod";

const EnvSchema = z.object({
  WORKER_DOMAIN: z.hostname().optional(),
  WORKER_D1_DATABASE_ID: z.uuid(),
  WORKER_ACCESS_TEAM_DOMAIN: z.string().regex(/^[a-z0-9-]+\.cloudflareaccess\.com$/, {
    error: "<team>.cloudflareaccess.com の形式で指定してください",
  }),
  WORKER_ACCESS_AUD: z.string().regex(/^[0-9a-f]{64}$/, {
    error: "64桁の16進数（Application Audience Tag）を指定してください",
  }),
});

const loadEnv = () => {
  const values = Object.fromEntries(
    Object.keys(EnvSchema.shape).map((key) => [key, process.env[key] || undefined]),
  );
  const result = EnvSchema.safeParse(values);
  if (!result.success) {
    throw new Error(`環境変数が正しくありません\n${z.prettifyError(result.error)}`);
  }
  return result.data;
};

export default defineConfig(({ command }) => {
  const isBuild = command === "build";
  const env = isBuild ? loadEnv() : undefined;

  return {
    plugins: [
      tailwindcss(),
      cloudflare({
        config: (config) => {
          if (!env) return;
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
