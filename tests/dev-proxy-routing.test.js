import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveRoute,
  buildUpstreamTargetUrl,
} from "../scripts/dev-proxy-routing.mjs";

test("resolveRoute: /env/test/openapi/... → テスト上流", () => {
  const r = resolveRoute(
    "/env/test/openapi/auth/getAccessToken",
    "?a=1",
  );
  assert.ok(r);
  assert.equal(r.upstream, "https://aibox-test.aimeet.jp");
  assert.equal(r.path, "/openapi/auth/getAccessToken?a=1");
});

test("buildUpstreamTargetUrl: 連結で正しい AiMeet URL", () => {
  const u = buildUpstreamTargetUrl(
    "https://aibox-test.aimeet.jp",
    "/openapi/auth/getAccessToken?x=1",
  );
  assert.equal(
    u.href,
    "https://aibox-test.aimeet.jp/openapi/auth/getAccessToken?x=1",
  );
});

test("buildUpstreamTargetUrl: new URL(relative,base) と異なり二重パスにならない", () => {
  const legacy = new URL(
    "/openapi/auth/getAccessToken",
    "https://aibox-test.aimeet.jp/",
  );
  const fixed = buildUpstreamTargetUrl(
    "https://aibox-test.aimeet.jp",
    "/openapi/auth/getAccessToken",
  );
  assert.equal(fixed.pathname, "/openapi/auth/getAccessToken");
  assert.equal(legacy.pathname, "/openapi/auth/getAccessToken");
  assert.equal(fixed.href, legacy.href);
});
