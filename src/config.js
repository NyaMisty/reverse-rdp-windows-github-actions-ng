import { getValidatedInput } from "./helpers"

export const isForeground = () => {
    const enabled = getValidatedInput('foreground', /(true|false|0|1)/i)
    if (/(true|1)/i.test(enabled)) {
        return true;
    } else {
        return false;
    }
}

export const FOREGROUND_WAIT_FILE = String.raw `C:\Users\runneradmin\Desktop\Delete-This-File-To-Continue.txt`
export const NGROK_PID_FILE = String.raw `C:\ngrok-rdp.pid`