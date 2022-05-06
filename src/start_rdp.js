import * as core from "@actions/core"
import { FOREGROUND_WAIT_FILE, isForeground, NGROK_PID_FILE } from "./config";

import { execCommand, execShellCommand, getExistingProcess, getValidatedInput, pidIsRunning } from "./helpers"

import { waitNgrok } from "./ngrok_check";

// most @actions toolkit packages have async methods
async function run() {
  try {
    core.info(`Downloading Ngrok ...`);
    await execShellCommand(String.raw `curl -o ngrok.zip -L https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-windows-amd64.zip`);
    
    core.info(`Extract Ngrok ...`);
    await execShellCommand(String.raw `powershell "Expand-Archive ngrok.zip"`);

    core.info(`Ngrok auth...`)
    await execShellCommand(String.raw `.\ngrok\ngrok.exe authtoken ${ getValidatedInput('ngrok-token', /.*/) }`);

    core.info(`Enable TS...`)
    await execShellCommand(String.raw `powershell "Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server'-name 'fDenyTSConnections' -Value 0"`);

    core.info(`Enable Firewall...`)
    await execShellCommand(String.raw `powershell "Enable-NetFirewallRule -DisplayGroup 'Remote Desktop'"`);
    
    core.info(`Enable RDP Auth...`)
    await execShellCommand(String.raw `powershell "Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp' -name 'UserAuthentication' -Value 1"`);
    
    core.info(`Set User Password...`)
    await execShellCommand(String.raw `powershell "Set-LocalUser -Name 'runneradmin' -Password (ConvertTo-SecureString -AsPlainText '${ getValidatedInput('password', /.*/) }' -Force)"`);

    const foreground = isForeground()

    core.info(`Creating marker file...`)
    await execShellCommand(String.raw `echo Delete this file to Continue > ${ FOREGROUND_WAIT_FILE }`);

    let ngrokRunning = false
    try {
      const ngrokPid = await getExistingProcess(NGROK_PID_FILE)
      core.info(`Found existing ngrok pid: ${ngrokPid}`)
      ngrokRunning = pidIsRunning(ngrokPid)
    } catch (e) {
      ngrokRunning = false
      core.info("Check exist ngrok: " + e.toString())
    }
    if (ngrokRunning) {
      core.info("Existing ngrok is still running, not running new ngrok instance!")
    } else {
      core.info("No existing ngrok, creating new ngrok instance..")
      if (foreground) {
        core.info(`Create Tunnel in FOREGROUND...`)
        execCommand(String.raw `.\ngrok\ngrok.exe`, ['tcp', '3389'], false, false, NGROK_PID_FILE).catch((error)=>{
          core.setFailed(error.message);
        });
      } else {
        core.info(`Create Tunnel in BACKGROUND...`)
        execCommand(String.raw `.\ngrok\ngrok.exe`, ['tcp', '3389'], false, true, NGROK_PID_FILE).catch((error)=>{
          core.setFailed(error.message);
        });
      }
    }
    if (foreground) {
      await waitNgrok(FOREGROUND_WAIT_FILE, NGROK_PID_FILE)
    }
  } catch (error) {
    core.setFailed(error.message);
  }
  process.exit(0);
}

run();
