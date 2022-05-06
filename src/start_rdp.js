import * as core from "@actions/core"
import { FOREGROUND_WAIT_FILE, isForeground } from "./config";

import { execShellCommand, getValidatedInput, waitForFileDeletion } from "./helpers"

// most @actions toolkit packages have async methods
async function run() {
  try {
    core.info(`Downloading Ngrok ...`);
    await execShellCommand('curl -o ngrok.zip -L https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-windows-amd64.zip');
    
    core.info(`Extract Ngrok ...`);
    await execShellCommand('powershell "Expand-Archive ngrok.zip"');

    core.info(`Ngrok auth...`)
    await execShellCommand(`.\ngrok\ngrok.exe authtoken ${ getValidatedInput('ngrok-token', /.*/) }`);

    core.info(`Enable TS...`)
    await execShellCommand(String.raw `powershell "Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server'-name 'fDenyTSConnections' -Value 0"`);

    core.info(`Enable Firewall...`)
    await execShellCommand(`powershell "Enable-NetFirewallRule -DisplayGroup 'Remote Desktop'"`);
    
    core.info(`Enable RDP Auth...`)
    await execShellCommand(String.raw `powershell "Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp' -name 'UserAuthentication' -Value 1"`);
    
    core.info(`Set User Password...`)
    await execShellCommand(`powershell "Set-LocalUser -Name 'runneradmin' -Password (ConvertTo-SecureString -AsPlainText '${ getValidatedInput('password', /.*/) }' -Force)"`);

    const foreground = isForeground()

    core.info(`Creating marker file...`)
    await execShellCommand(String.raw `echo Delete this file to Continue >> ${ FOREGROUND_WAIT_FILE }`);

    if (foreground) {
      core.info(`Create Tunnel in FOREGROUND...`)
      execShellCommand(`.\ngrok\ngrok.exe tcp 3389`, false, false).catch((error)=>{
        core.setFailed(error.message);
      });
      await waitForFileDeletion()
    } else {
      core.info(`Create Tunnel in BACKGROUND...`)
      execShellCommand(`.\ngrok\ngrok.exe tcp 3389`, false, true).catch((error)=>{
        core.setFailed(error.message);
      });
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
