import SwaggerParser from "@apidevtools/swagger-parser";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const specPath = join(__dirname, "..", "openapi.yaml");

await SwaggerParser.validate(specPath);
console.log("OK:", specPath);
