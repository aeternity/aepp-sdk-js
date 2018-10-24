const fs = require('fs-extra')

const createIfExistsFolder = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

const copyFileOrDir = (sourceFileOrDir, destinationFileOrDir, copyOptions = {}) => {
  if (fs.existsSync(`${destinationFileOrDir}`)) {
    throw new Error(`${destinationFileOrDir} already exists.`);
  }

  fs.copySync(sourceFileOrDir, destinationFileOrDir, copyOptions)
}

module.exports = {
  createIfExistsFolder,
  copyFileOrDir
}
