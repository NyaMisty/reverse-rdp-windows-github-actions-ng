import * as core from "@actions/core"
import { FOREGROUND_WAIT_FILE, isForeground } from "./config";
import { waitForFileDeletion } from "./helpers"

async function run() {
  try {
    if (!isForeground()) {
      core.info(`RDP Tunnel is not started foregorundly, wait for marking file deletion!`)
      await waitForFileDeletion(FOREGROUND_WAIT_FILE)
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();