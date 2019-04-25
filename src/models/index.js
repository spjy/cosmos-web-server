/* eslint "import/no-dynamic-require": "off", "global-require": "off" */

const fs = require('fs');

// require and export all .js files in same directory as this file
fs.readdirSync(__dirname).forEach((value) => {
  if (value === 'index.js') {
    return;
  }

  if (fs.lstatSync(`${__dirname}/${value}`).isFile() && value.endsWith('.js')) {
    module.exports[value.replace('.js', '')] = require(`./${value}`);
  }
});
