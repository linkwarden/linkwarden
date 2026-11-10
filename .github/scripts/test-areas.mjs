// Splits the tests into the areas CI runs as separate checks (see
// .github/workflows/ci.yml).
//
// Every test file has to be in exactly one area of its suite. When one isn't,
// all checks of that suite fail, so a new test file can't go unrun unnoticed.
//
// Usage: AREAS='["Web", ...]' node .github/scripts/test-areas.mjs <suite> <area> [-- <command>...]
// Prints the area's test files, one per line, or runs the command with them
// added to the end. AREAS is the list of areas ci.yml runs for the suite, which
// has to match the areas below.

import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Vitest's and Playwright's default test file names
const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;

// Minus what vitest.config.mts excludes
const isVitestTest = (path) =>
  TEST_FILE.test(path) && !/(^|\/)(node_modules|dist|e2e|\.next)\//.test(path);

// Each area lists the files or folders (ending in "/") it runs, relative to
// the suite's dir.
const suites = {
  unit: {
    dir: "",
    files: (path) => isVitestTest(path) && !path.includes(".integration.test."),
    areas: {
      Web: ["apps/web/"],
      Extension: ["apps/extension/"],
      Mobile: ["apps/mobile/"],
      "Worker and packages": ["apps/worker/", "packages/"],
    },
  },
  integration: {
    dir: "",
    files: (path) => isVitestTest(path) && path.includes(".integration.test."),
    areas: {
      Database: ["apps/", "packages/"],
    },
  },
  // Every project in apps/web/playwright.config.ts except "chromium email"
  "e2e-web": {
    dir: "apps/web/e2e/",
    files: (path) =>
      path.endsWith(".spec.ts") && !path.startsWith("tests/email/"),
    areas: {
      Login: [
        "tests/public/login.spec.ts",
        "tests/public/password-change-notice.spec.ts",
        "tests/public/password-retries.spec.ts",
      ],
      Permissions: [
        "tests/public/archive-upload-permissions.spec.ts",
        "tests/public/collection-parents.spec.ts",
        "tests/public/link-update-permissions.spec.ts",
        "tests/public/session-revocation.spec.ts",
      ],
      "Search and no-email": [
        "tests/public/no-email.spec.ts",
        "tests/public/public-collection-links.spec.ts",
        "tests/public/search-query.spec.ts",
        "tests/public/usage-analytics.spec.ts",
        "tests/public/usage-analytics-privacy.spec.ts",
      ],
      Imports: ["tests/public/import-order.spec.ts"],
    },
  },
  "e2e-email": {
    dir: "apps/web/e2e/tests/email/",
    files: (path) => path.endsWith(".spec.ts"),
    areas: {
      "Verification and codes": [
        "verification.spec.ts",
        "edge-cases.spec.ts",
        "email-change.spec.ts",
      ],
      "Pre-hijacking and OIDC": ["prehijack.spec.ts", "session-revocation.spec.ts"],
      "Delivery and upgrades": [
        "delivery.spec.ts",
        "password-reset.spec.ts",
        "upgrade.spec.ts",
      ],
    },
  },
  // apps/extension/playwright.config.ts keeps Playwright's default testMatch
  "e2e-extension": {
    dir: "apps/extension/e2e/",
    files: (path) => TEST_FILE.test(path),
    areas: {
      Popup: ["tests/popup.spec.ts"],
      Options: ["tests/options.spec.ts"],
    },
  },
};

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const [suiteName, area, , ...command] = process.argv.slice(2);
const suite = suites[suiteName];
if (!suite) fail(`Unknown suite "${suiteName}"`);

const names = Object.keys(suite.areas);
const listed = JSON.parse(process.env.AREAS || "[]");
if ([...listed].sort().join("\n") !== [...names].sort().join("\n"))
  fail(
    `The ${suiteName} areas in ci.yml (${listed.join(", ")}) don't match ` +
      `the ones in .github/scripts/test-areas.mjs (${names.join(", ")}).`
  );
if (!suite.areas[area]) fail(`Unknown ${suiteName} area "${area}"`);

const root = fileURLToPath(new URL("../..", import.meta.url));
const files = execFileSync("git", ["ls-files", "-z", "--", suite.dir || "."], {
  cwd: root,
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean)
  .map((path) => path.slice(suite.dir.length))
  .filter(suite.files);

const matches = (entry, file) =>
  entry.endsWith("/") ? file.startsWith(entry) : file === entry;
const inArea = (name, file) =>
  suite.areas[name].some((entry) => matches(entry, file));

const problems = [];
for (const file of files) {
  const areas = names.filter((name) => inArea(name, file));
  if (areas.length === 0)
    problems.push(`${suite.dir}${file} isn't in any ${suiteName} area.`);
  if (areas.length > 1)
    problems.push(
      `${suite.dir}${file} is in more than one area: ${areas.join(", ")}.`
    );
}
// A folder can be empty for now, but a file that's gone was renamed or removed.
for (const name of names)
  for (const entry of suite.areas[name])
    if (!entry.endsWith("/") && !files.includes(entry))
      problems.push(
        `${suite.dir}${entry} in the ${name} area isn't a ${suiteName} test file.`
      );

if (problems.length)
  fail(
    [...problems, "Fix the areas in .github/scripts/test-areas.mjs."].join("\n")
  );

// Given no files, the test runner would run the whole suite instead.
const selected = files
  .filter((file) => inArea(area, file))
  .map((file) => suite.dir + file);
if (!selected.length) fail(`The ${area} area has no test files.`);

if (!command.length) {
  console.log(selected.join("\n"));
} else {
  const { status } = spawnSync(command[0], [...command.slice(1), ...selected], {
    stdio: "inherit",
  });
  process.exit(status ?? 1);
}
