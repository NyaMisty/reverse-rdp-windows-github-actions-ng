import * as core from "@actions/core"
import { FOREGROUND_WAIT_FILE, isForeground, NGROK_PID_FILE } from "./config";
import { waitNgrok } from "./ngrok_check";

async function run() {
  try {
    if (!isForeground()) {
      core.info(`RDP Tunnel is not started foregorundly, wait for marking file deletion!`)
      await waitNgrok(FOREGROUND_WAIT_FILE, NGROK_PID_FILE)
    }
  } catch (error) {
    core.setFailed(error.message);
  }
  process.exit(0);
}

run();