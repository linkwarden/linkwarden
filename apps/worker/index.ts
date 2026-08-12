import { spawn } from "node:child_process";

function launch() {
  // Spawning "tsx" directly fails on Windows (spawn tsx ENOENT) since .cmd
  // shims can't be spawned without a shell. Resolve the CLI and run it with
  // the current Node binary instead.
  const child = spawn(
    process.execPath,
    [require.resolve("tsx/cli"), "worker.ts"],
    { stdio: "inherit" }
  );

  child.on("exit", (code, signal) => {
    console.error(
      `worker exited (code=${code} signal=${signal}) – restarting…`
    );
    setTimeout(launch, 5000);
  });
}

process.on("SIGINT", () => process.exit());

launch();
