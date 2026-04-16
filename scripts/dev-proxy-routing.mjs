/**
 * dev-proxy 用: パス解決と上流 URL 組み立て（単体テスト可能）
 */

export const DEFAULT_UPSTREAM = (
  process.env.AIMEET_OPENAPI_BASE || "https://aibox-test.aimeet.jp"
).replace(/\/$/, "");

export const UPSTREAM_BY_ENV = {
  test: "https://aibox-test.aimeet.jp",
  prod: "https://aibox.aimeet.jp",
};

function normalizePathname(pathname) {
  try {
    return decodeURI(pathname);
  } catch {
    return pathname;
  }
}

/**
 * @param {string} pathname
 * @param {string} search
 * @returns {{ upstream: string, path: string } | null}
 */
export function resolveRoute(pathname, search) {
  const pathNorm = normalizePathname(pathname);
  const m = pathNorm.match(/^\/env\/(test|prod)(\/.*)?$/i);
  if (m) {
    const rest = m[2] ?? "";
    if (!rest.startsWith("/openapi")) {
      return null;
    }
    const upstream = UPSTREAM_BY_ENV[m[1].toLowerCase()];
    return { upstream, path: rest + search };
  }
  if (pathNorm.startsWith("/openapi")) {
    return { upstream: DEFAULT_UPSTREAM, path: pathNorm + search };
  }
  if (
    pathNorm.startsWith("/auth/") ||
    pathNorm.startsWith("/exhibition/") ||
    pathNorm.startsWith("/admin/")
  ) {
    return {
      upstream: DEFAULT_UPSTREAM,
      path: `/openapi${pathNorm}${search}`,
    };
  }
  return null;
}

/**
 * new URL(relative, base) は base にパスがある場合に相対解釈でズレることがあるため、
 * 上流は常に「origin + path + query」で連結する。
 */
export function buildUpstreamTargetUrl(upstreamBase, pathAndQuery) {
  const base = upstreamBase.replace(/\/$/, "");
  const pq = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  return new URL(`${base}${pq}`);
}
