import { test } from "node:test";
import SwaggerParser from "@apidevtools/swagger-parser";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const specPath = join(__dirname, "..", "openapi.yaml");

test("openapi.yaml は Swagger Parser で検証できる", async () => {
  await SwaggerParser.validate(specPath);
});

test("必須パスと operationId が定義されている", async () => {
  const doc = await SwaggerParser.validate(specPath);
  const paths = doc.paths ?? {};
  const requiredPaths = [
    "/openapi/auth/getAccessToken",
    "/openapi/exhibition/getExhibitionInfo",
    "/openapi/admin/getChildGroupList",
    "/openapi/admin/newExhibitor",
    "/env/{apiEnv}/openapi/auth/getAccessToken",
    "/env/{apiEnv}/openapi/exhibition/getExhibitionInfo",
    "/env/{apiEnv}/openapi/admin/getChildGroupList",
    "/env/{apiEnv}/openapi/admin/newExhibitor",
  ];
  for (const p of requiredPaths) {
    if (!paths[p]) {
      throw new Error(`missing path: ${p}`);
    }
  }
  const ops = [
    ["get", "/openapi/auth/getAccessToken", "getAccessTokenGet"],
    ["post", "/openapi/auth/getAccessToken", "getAccessTokenPost"],
    ["get", "/openapi/exhibition/getExhibitionInfo", "getExhibitionInfo"],
    ["get", "/openapi/admin/getChildGroupList", "getChildGroupList"],
    ["post", "/openapi/admin/newExhibitor", "newExhibitor"],
    ["get", "/env/{apiEnv}/openapi/auth/getAccessToken", "getAccessTokenGetProxy"],
    ["post", "/env/{apiEnv}/openapi/auth/getAccessToken", "getAccessTokenPostProxy"],
    ["get", "/env/{apiEnv}/openapi/exhibition/getExhibitionInfo", "getExhibitionInfoProxy"],
    ["get", "/env/{apiEnv}/openapi/admin/getChildGroupList", "getChildGroupListProxy"],
    ["post", "/env/{apiEnv}/openapi/admin/newExhibitor", "newExhibitorProxy"],
  ];
  for (const [method, path, opId] of ops) {
    const op = paths[path]?.[method];
    if (!op || op.operationId !== opId) {
      throw new Error(`expected ${method} ${path} operationId ${opId}`);
    }
  }
});
