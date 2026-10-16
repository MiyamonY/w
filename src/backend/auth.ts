import { createMiddleware } from "hono/factory";
import { verifyWithJwks } from "hono/jwt";
import { z } from "zod/mini";

const AccessEnvSchema = z.object({
  ACCESS_TEAM_DOMAIN: z.string().check(z.minLength(1)),
  ACCESS_AUD: z.string().check(z.minLength(1)),
});

export const requireAccess = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  if (c.env.ACCESS_DISABLED === "true") return next();

  const accessEnv = AccessEnvSchema.safeParse(c.env);
  if (!accessEnv.success) {
    return c.text("Cloudflare Access is not configured", 500);
  }
  const { ACCESS_TEAM_DOMAIN: teamDomain, ACCESS_AUD: aud } = accessEnv.data;

  const token = c.req.header("cf-access-jwt-assertion");
  if (!token) return c.text("Unauthorized", 401);

  try {
    await verifyWithJwks(
      token,
      {
        jwks_uri: `https://${teamDomain}/cdn-cgi/access/certs`,
        allowedAlgorithms: ["RS256"],
        verification: { iss: `https://${teamDomain}`, aud },
      },
      { cf: { cacheTtl: 3600, cacheEverything: true } },
    );
  } catch {
    return c.text("Unauthorized", 401);
  }
  return next();
});
