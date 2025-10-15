import { startIndexing } from "./workers/linkIndexing";
import { linkProcessing } from "./workers/linkProcessing";
import { startRSSPolling } from "./workers/rssPolling";
import { trialEndEmailWorker } from "./workers/trialEndEmailWorker";

const workerIntervalInSeconds =
  Number(process.env.ARCHIVE_SCRIPT_INTERVAL) || 10;

async function init() {
  console.log("\x1b[34m%s\x1b[0m", "Initializing the worker...");
  startRSSPolling();
  linkProcessing(workerIntervalInSeconds);
  startIndexing(workerIntervalInSeconds);
  trialEndEmailWorker();
}

init();
