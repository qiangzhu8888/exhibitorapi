/**
 * プロキシの起動有無と（直接接続時の）BASE API を選んで実行する。
 * プロキシ利用時は Swagger 上で `/env/{test|prod}/openapi` と apiEnv を別指定可能。
 *
 * 対話: npm run dev
 * 非対話: node scripts/launch.mjs --proxy
 *        node scripts/launch.mjs --no-proxy
 *        node scripts/launch.mjs --no-proxy --base=test
 *
 * オプション:
 *   --base=test|prod   --no-proxy 時の表示用（省略時は対話で選択／非対話では両方表示）
 *   --proxy            プロキシを起動
 *   --no-proxy         プロキシなし（URL のみ表示）
 *   --port=8787        プロキシ待受ポート
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const BASE_PRESETS = {
  test: {
    key: "test",
    label: "テスト",
    url: "https://aibox-test.aimeet.jp",
  },
  prod: {
    key: "prod",
    label: "本番",
    url: "https://aibox.aimeet.jp",
  },
};

/** @param {string[]} argv process.argv slice from index 2 */
export function parseLaunchArgs(argv) {
  const out = {
    base: /** @type {string | null} */ (null),
    proxy: /** @type {boolean | null} */ (null),
    port: 8787,
  };
  for (const a of argv) {
    if (a.startsWith("--base=")) {
      const v = a.slice(7).toLowerCase();
      if (v === "test" || v === "prod") out.base = v;
    } else if (a === "--proxy") {
      out.proxy = true;
    } else if (a === "--no-proxy") {
      out.proxy = false;
    } else if (a.startsWith("--port=")) {
      const n = Number(a.slice(7));
      if (Number.isFinite(n) && n > 0) out.port = n;
    }
  }
  return out;
}

function printBanner() {
  console.log("");
  console.log("AiMeet OpenAPI — 開発ランチャー");
  console.log("------------------------------");
}

async function promptBase(rl) {
  const lines = [
    "直接接続する BASE API（表示用）を選んでください:",
    `  1) ${BASE_PRESETS.test.label}  ${BASE_PRESETS.test.url}`,
    `  2) ${BASE_PRESETS.prod.label}  ${BASE_PRESETS.prod.url}`,
  ];
  console.log(lines.join("\n"));
  const ans = (await rl.question("番号 [1-2] (既定: 1): ")).trim();
  if (ans === "2") return BASE_PRESETS.prod;
  return BASE_PRESETS.test;
}

async function promptProxy(rl) {
  const ans = (
    await rl.question(
      "プロキシサーバを起動しますか？（ブラウザで Try する場合は Y） [Y/n]: ",
    )
  )
    .trim()
    .toLowerCase();
  if (ans === "" || ans === "y" || ans === "yes") return true;
  if (ans === "n" || ans === "no") return false;
  return true;
}

function printNoProxyHelp(base) {
  console.log("");
  console.log("プロキシなし（プロセスは起動しません）。");
  console.log("");
  console.log("  OpenAPI base URL:");
  console.log(`    ${base.url}/openapi`);
  console.log("");
  console.log(
    "  注意: ブラウザから別オリジンで fetch すると CORS で失敗することがあります。",
  );
  console.log("        Postman・curl・サーバ側呼び出し向けです。");
  console.log("");
}

function printNoProxyHelpBoth() {
  console.log("");
  console.log("プロキシなし（プロセスは起動しません）。");
  console.log("");
  console.log("  直接接続の OpenAPI base URL:");
  console.log(`    テスト: ${BASE_PRESETS.test.url}/openapi`);
  console.log(`    本番:   ${BASE_PRESETS.prod.url}/openapi`);
  console.log("");
  console.log(
    "  Swagger では「直接接続」サーバーを選び、変数 apiHost でホストを切り替えてください。",
  );
  console.log("");
}

function printProxyHelp(port) {
  const origin = `http://127.0.0.1:${port}`;
  console.log("");
  console.log("プロキシを起動します。終了は Ctrl+C です。");
  console.log("");
  console.log("  Swagger: 「直接接続」は /openapi/...、「プロキシ」は /env/{apiEnv}/openapi/... を選んでください。");
  console.log("");
}

function printHelp() {
  console.log(`
使い方:
  npm run dev
  node scripts/launch.mjs [オプション]

オプション:
  --proxy            プロキシを起動（BASE は Swagger の apiEnv / 直接接続側で指定）
  --no-proxy         プロキシなし（URL のみ表示）
  --base=test|prod   --no-proxy 時の表示用（省略可）
  --port=番号        プロキシの待受ポート（既定: 8787）
  -h, --help         このヘルプ

例:
  node scripts/launch.mjs --proxy
  node scripts/launch.mjs --no-proxy --base=prod
`);
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return;
  }

  const parsed = parseLaunchArgs(argv);
  let baseKey = parsed.base;
  let useProxy = parsed.proxy;
  const port = parsed.port;

  const rl = readline.createInterface({ input, output });

  try {
    printBanner();

    if (useProxy === null) {
      if (!input.isTTY) {
        console.error(
          "非対話実行では --proxy または --no-proxy を指定してください。",
        );
        process.exitCode = 1;
        return;
      }
      useProxy = await promptProxy(rl);
    }

    if (useProxy) {
      printProxyHelp(port);

      const fallbackBase =
        baseKey && BASE_PRESETS[baseKey]
          ? BASE_PRESETS[baseKey].url
          : BASE_PRESETS.test.url;

      const proxyPath = join(__dirname, "dev-proxy.mjs");
      const child = spawn(
        process.execPath,
        [proxyPath],
        {
          stdio: "inherit",
          env: {
            ...process.env,
            AIMEET_OPENAPI_BASE: fallbackBase,
            PROXY_PORT: String(port),
          },
        },
      );

      child.on("exit", (code, signal) => {
        if (signal) process.kill(process.pid, signal);
        else process.exit(code ?? 0);
      });
      return;
    }

    if (!baseKey || !BASE_PRESETS[baseKey]) {
      if (input.isTTY) {
        const picked = await promptBase(rl);
        baseKey = picked.key;
      } else {
        printNoProxyHelpBoth();
        return;
      }
    }

    const base = BASE_PRESETS[baseKey];
    if (!base) {
      console.error(`不明な --base: ${baseKey}（test または prod）`);
      process.exitCode = 1;
      return;
    }

    printNoProxyHelp(base);
  } finally {
    rl.close();
  }
}

const __filename = fileURLToPath(import.meta.url);
const isMain =
  Boolean(process.argv[1]) && resolve(process.argv[1]) === __filename;

if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
