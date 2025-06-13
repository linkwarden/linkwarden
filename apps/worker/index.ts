import { spawn } from "node:child_process";
import { join } from "node:path";

function launch() {
  const tsxPath = join(__dirname, "../../node_modules/tsx/dist/cli.mjs");
  const child = spawn("node", [tsxPath, "worker.ts"], { stdio: "inherit" });

  child.on("exit", (code, signal) => {
    console.error(
      `worker exited (code=${code} signal=${signal}) – restarting…`
    );
    setTimeout(launch, 5000);
  });
}

process.on("SIGINT", () => process.exit());

launch();
