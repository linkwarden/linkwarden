import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const file = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../version.xcconfig"
);

const source = fs.readFileSync(file, "utf8");
const match = source.match(/^CURRENT_PROJECT_VERSION\s*=\s*(\d+)\s*$/m);

if (!match) {
  console.error(`No CURRENT_PROJECT_VERSION found in ${file}`);
  process.exit(1);
}

const current = Number(match[1]);
const next = current + 1;

fs.writeFileSync(
  file,
  source.replace(match[0], `CURRENT_PROJECT_VERSION = ${next}`)
);

console.log(`Build number ${current} -> ${next}`);
console.log(
  "Check this is above the last build App Store Connect accepted before uploading."
);
