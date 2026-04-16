import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLaunchArgs, BASE_PRESETS } from "../scripts/launch.mjs";

test("parseLaunchArgs: --base と --proxy / --no-proxy", () => {
  assert.deepEqual(parseLaunchArgs([]), {
    base: null,
    proxy: null,
    port: 8787,
  });
  assert.deepEqual(parseLaunchArgs(["--base=test", "--proxy"]), {
    base: "test",
    proxy: true,
    port: 8787,
  });
  assert.deepEqual(parseLaunchArgs(["--base=prod", "--no-proxy"]), {
    base: "prod",
    proxy: false,
    port: 8787,
  });
  assert.deepEqual(parseLaunchArgs(["--port=9000", "--base=test", "--proxy"]), {
    base: "test",
    proxy: true,
    port: 9000,
  });
});

test("BASE_PRESETS に test / prod がある", () => {
  assert.equal(BASE_PRESETS.test.url, "https://aibox-test.aimeet.jp");
  assert.equal(BASE_PRESETS.prod.url, "https://aibox.aimeet.jp");
});
