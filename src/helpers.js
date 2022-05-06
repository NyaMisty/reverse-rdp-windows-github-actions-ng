// ripped from action-tmate

// @ts-check
import { spawn } from 'child_process'
import * as core from "@actions/core"
import fs from 'fs'
import { stat } from 'fs/promises';

/**
 * @param {string} cmd
 * @returns {Promise<string>}
 */
export const execShellCommand = (cmd, needOutput = true, detached = false) => {
  core.debug(`Executing shell command: [${cmd}]`)
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, [], { shell: true, detached: detached })
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
  });
}

execShellCommand

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

const sleep = ms => new Promise(r => setTimeout(r, ms));

const fileExists = async (filename) => {
    return await stat(filename).then(() => true).catch(() => false)
}

const ts = () => Math.floor(Date.now()/1000)

export const waitForFileDeletion = async (path) => {
    const startTimeStamp = ts()
    for (let i = 0; ; i++) {
        if (await fileExists(path)) {
            break
        }
        await sleep(1000)
        if (i > 0 && i % 10 === 0) {
            console.log(`Waited file-deletion of ${ path } for ${ ts() - startTimeStamp } seconds...`)
        }
    }
}