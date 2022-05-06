import * as core from "@actions/core"

import { stat } from 'fs/promises';
import { getExistingProcess, pidIsRunning } from './helpers';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const ts = () => Math.floor(Date.now()/1000)

const fileExists = async (filename) => {
    return await stat(filename).then(() => true).catch(() => false)
}

export const waitNgrok = async (mark_path, pidfile) => {
    const startTimeStamp = ts()
    for (let i = 0; ; i++) {
        const existing = await fileExists(mark_path)
        if (!existing) {
            console.log(`Mark file ${ mark_path } deleted! Finishing...`)
            break
        }
        try {
            const ngrokPid = await getExistingProcess(pidfile)
            if (!pidIsRunning(ngrokPid)) {
                core.info(`Ngrok with pid ${ngrokPid} does not exist, exiting...`)
                break
            }
        } catch (e) {
            core.info(`Error checking alive for ngrok, exiting...`)
            break
        }
        await sleep(2000)
        if (i > 0 && i % 10 === 0) {
            console.log(`Waited file-deletion of ${ mark_path } for ${ ts() - startTimeStamp } seconds...`)
        }
    }
    console.log(`Waited for total ${ ts() - startTimeStamp } seconds`)
}