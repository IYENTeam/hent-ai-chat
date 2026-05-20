export function getEnv(): CloudflareEnv {
  try {
    const { getRequestContext } = require("@opennextjs/cloudflare");
    return getRequestContext().env as CloudflareEnv;
  } catch {
    return process.env as unknown as CloudflareEnv;
  }
}
