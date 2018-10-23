const init = require('./cli-commands/init/init.js');

const addInitOption = (program) => {
  program
    .command('init')
    .description('Initialize aepp project')
    .action(async () => {
      await init.run();
    })
}


const initCommands = (program) => {
  addInitOption(program);
}


module.exports = {
  initCommands
}

