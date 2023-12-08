import shell from "shelljs";
import urlHandler from "../lib/api/urlHandler";

const command = process.argv[2];

const args = process.argv.slice(3).join(" ");

if (!command) {
  console.log("Please provide a command to run. (start, dev, etc.)");
  process.exit(1);
}

shell.exec(`yarn ${command || ""} ${args || ""}`);
