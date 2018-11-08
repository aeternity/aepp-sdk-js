let filesAndfoldersToRemove = [
	'node_modules',
	'deploy',
	'docker',
	'test',
	'contracts/Identity.aes',
	'package.json',
	'package-lock.json',
	'docker-compose.yml'
]
const fs = require('fs-extra')

async function cleanUp() {
    let path = process.cwd() + "/bin/aeproject/test/";
    filesAndfoldersToRemove.forEach((e) => {
        try{
            fs.removeSync(path + e); 
        } catch(e){

        }
    })
}

module.exports = {
    cleanUp
}