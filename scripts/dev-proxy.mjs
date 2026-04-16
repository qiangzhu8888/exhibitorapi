/**
 * ブラウザから AiMeet OpenAPI を試すときの CORS 回避用（ローカル開発のみ）。
 *
 * 使い方:
 *   npm run dev        … 対話でプロキシ起動（推奨）
 *   npm run proxy:dev  … プロキシのみ即時起動
 *
 * Servers の `{apiRoot}{envPrefix}` とパス `/openapi/...` の組み合わせに対応。
 * 互換: `/openapi/...`、`/env/test|prod/openapi/...`、欠落時の `/auth/...` 補完。
 */

import http from "node:http";
import https from "node:https";
import {
  DEFAULT_UPSTREAM,
  UPSTREAM_BY_ENV,
  resolveRoute,
  buildUpstreamTargetUrl,
} from "./dev-proxy-routing.mjs";

const PORT = Number(process.env.PROXY_PORT || 8787);

function allowOrigin(req) {
  const o = req.headers.origin;
  if (!o) return "*";
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(o)) return o;
  return o;
}

function corsHeaders(req) {
  const origin = allowOrigin(req);
  const h = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
  const reqHdr = req.headers["access-control-request-headers"];
  if (reqHdr) h["Access-Control-Allow-Headers"] = reqHdr;
  else h["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept";
  return h;
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(req));
    res.end();
    return;
  }

  const hostHeader = req.headers.host || `127.0.0.1:${PORT}`;
  let u;
  try {
    u = new URL(req.url || "/", `http://${hostHeader}`);
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad URL");
    return;
  }

  const route = resolveRoute(u.pathname, u.search || "");
  if (!route) {
    res.writeHead(
      404,
      { "Content-Type": "text/plain; charset=utf-8", ...corsHeaders(req) },
    );
    res.end(
      [
        "想定外のパスです。次のいずれかを使ってください:",
        `  /env/test/openapi/...  → ${UPSTREAM_BY_ENV.test}`,
        `  /env/prod/openapi/...  → ${UPSTREAM_BY_ENV.prod}`,
        `  /openapi/...           → ${DEFAULT_UPSTREAM}（AIMEET_OPENAPI_BASE で変更可）`,
        "",
      ].join("\n"),
    );
    return;
  }

  const target = buildUpstreamTargetUrl(route.upstream, route.path);
  const lib = target.protocol === "https:" ? https : http;
  const defaultPort = target.protocol === "https:" ? 443 : 80;

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  headers.host = target.host;

  const pReq = lib.request(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || defaultPort,
      path: target.pathname + target.search,
      method: req.method,
      headers,
    },
    (pRes) => {
      const out = { ...pRes.headers };
      delete out["access-control-allow-origin"];
      delete out["access-control-allow-credentials"];
      delete out["access-control-expose-headers"];
      delete out["access-control-allow-methods"];
      delete out["access-control-allow-headers"];
      out["access-control-allow-origin"] = allowOrigin(req);
      out["access-control-expose-headers"] = "*";
      res.writeHead(pRes.statusCode || 502, out);
      pRes.pipe(res);
    },
  );

  pReq.on("error", (e) => {
    res.writeHead(502, {
      "Content-Type": "text/plain; charset=utf-8",
      ...corsHeaders(req),
    });
    res.end(`Proxy error: ${e.message}`);
  });

  req.pipe(pReq);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`CORS proxy listening http://127.0.0.1:${PORT}`);
  console.log(`  /env/test/openapi/*  -> ${UPSTREAM_BY_ENV.test}/openapi/*`);
  console.log(`  /env/prod/openapi/*  -> ${UPSTREAM_BY_ENV.prod}/openapi/*`);
  console.log(`  /openapi/* (legacy) -> ${DEFAULT_UPSTREAM}/openapi/*`);
});
