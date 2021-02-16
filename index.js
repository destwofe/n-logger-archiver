const FS = require('fs')
const Cron = require('cron').CronJob
const Moment = require('moment')
const { parallel } = require('@destwofe/n-utils');

const logDir = `logs`;
const archiveDir = `logs/archive`;

if (!FS.existsSync(logDir)) FS.mkdirSync(logDir);
if (!FS.existsSync(archiveDir)) FS.mkdirSync(archiveDir);


/**
 * archive files
 * @param {[String]} inputPaths 
 * @param {String} outputPath 
 */
const archive = async (inputPaths, outputPath, isRMInput = false) => {
  try {
    const a = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level. 0 - 9, fast - compress
    });
    // const a = archiver('tar', { gzipOptions: { level: 9 } } )
  
    const output = fs.createWriteStream(outputPath)
    a.pipe(output);
  
    // var file1 = __dirname + '/logs/2019-04-24.log';
    // a.append(fs.createReadStream(file1), { name: '2019-04-24.log' });
  
    inputPaths.forEach(inputPath => {
      a.append(fs.createReadStream(inputPath), { name: inputPath.split('/').pop() })
    })

    await a.finalize()
    if (isRMInput) {
      inputPaths.forEach(inputPath => {
        fs.unlinkSync(inputPath)
      })
    }

    return undefined
  } catch (error) {
    return error
  }
}

/**
 * archive an old logs
 */
const archiveOldLogs = async () => {
  const files = FS.readdirSync(`${logDir}`)
  const days = FS.readdirSync(`${logDir}`).filter(a => a.indexOf('Error') == -1 && a.indexOf('.log') !== -1 && a.indexOf(Moment().format('YYYY-MM-DD')) === -1).map(a => a.replace('.log', ''))

  const fns = days.map(day => () => archive(files.filter(a => a.indexOf(day) != -1).map(a => `${logDir}/${a}`), `${archiveDir}/${day}.zip`, true))
  await parallel(fns, 10)
}

/**
 * set archive interval active time
 * @param {String} cronTime default is "0 0 * * *" (00:00 of every day)
 */
const setArchiveInterval = (cronTime = '0 0 * * *') => {
  const job = new Cron(cronTime, archiveOldLogs)
  job.start()
}

module.exports = { archiveOldLogs, setArchiveInterval };