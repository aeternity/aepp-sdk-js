const fs = require('fs')

const createIfExistsFolder = (dir) => {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
}

const copyFile = (file, targetDir, srcDir) => {
	if (fs.existsSync(`${targetDir}/${file}`)) {
		throw new Error(`${file} already exists in ${targetDir} directory.`);
	}

	const fileSource = `${srcDir}/${file}`;

	fs.copyFileSync(fileSource, targetDir);
}

module.exports = {
	createIfExistsFolder,
	copyFile
}