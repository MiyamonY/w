import { createMiddleware } from "hono/factory";
import { verifyWithJwks } from "hono/jwt";

export const requireAccess = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  if (c.env.ACCESS_DISABLED === "true") return next();

  const { ACCESS_TEAM_DOMAIN: teamDomain, ACCESS_AUD: aud } = c.env;
  if (!teamDomain || !aud) {
    return c.text("Cloudflare Access is not configured", 500);
  }

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
