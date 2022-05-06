// ripped from action-tmate

// @ts-check
import { spawn } from 'child_process'
import * as core from "@actions/core"
import fs from 'fs'
import { readFile } from 'fs/promises';

function spawn_wrap(proc, needOutput, pidfile) {
    return new Promise((resolve, reject) => {
        if (pidfile) {
            fs.writeFileSync(pidfile, (proc.pid || 0).toString())
        }
        let stdout = ""
        proc.stdout.on('data', (data) => {
          process.stdout.write(data);
          if (needOutput) {
            stdout += data.toString();
          }
        });
    
        proc.stderr.on('data', (data) => {
          process.stderr.write(data)
        });
    
        proc.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(code ? code.toString() : undefined))
          }
          resolve(stdout.trim())
        });
      })
}

export const execShellCommand = (cmd, needOutput = true, detached = false, pidfile = null) => {
  core.debug(`Executing shell command: [${cmd}]`)
  return spawn_wrap(spawn(cmd, [], { shell: true, detached: detached }), needOutput, pidfile)
}


export const execCommand = (cmd, arg, needOutput = true, detached = false, pidfile = null) => {
    core.debug(`Executing shell command: [${cmd}]`)
    return spawn_wrap(spawn(cmd, arg, { detached: detached }), needOutput, pidfile)
  }

export function pidIsRunning(pid) {
    try {
      process.kill(pid, 0);
      return true;
    } catch(e) {
      return false;
    }
  }

/**
 * @param {string} key
 * @param {RegExp} re regex to use for validation
 * @return {string} {undefined} or throws an error if input doesn't match regex
 */
export const getValidatedInput = (key, re) => {
  const value = core.getInput(key);
  if (value !== undefined && !re.test(value)) {
    throw new Error(`Invalid value for '${key}': '${value}'`);
  }
  return value;
}


/**
 * @return {Promise<string>}
 */
export const getLinuxDistro = async () => {
  try {
    const osRelease = await fs.promises.readFile("/etc/os-release")
    const match = osRelease.toString().match(/^ID=(.*)$/m)
    return match ? match[1] : "(unknown)"
  } catch (e) {
    return "(unknown)"
  }
}

export const getExistingProcess = async (pidfile) => {
    const buf = await readFile(pidfile)
    const ngrokPid = parseInt(buf.toString())
    return ngrokPid
}

