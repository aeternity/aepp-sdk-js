const fs = require('fs')

const createIfExistsFolder = (dir, message) => {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
}

const copyFile = (file, dir, libraryDirectory) => {
	if (fs.existsSync(`${dir}/${file}`)) {
		throw new Error(`${file} already exists in ${dir} directory. You've probably already initialized aeproject for this project.`);
	}

	const fileSource = `${libraryDirectory}/${file}`;

	fs.copyFileSync(fileSource, dir);
}

module.exports = {
	createIfExistsFolder,
	copyFile
}