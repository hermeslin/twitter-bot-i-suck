'use strict';
const glob = require("glob");

const files = glob.sync('./endpoints/*.js', { cwd: __dirname });
files.forEach((file) => {
  const functionName = file.split('/').pop().slice(0, -3); // Strip off '.js'
  console.log(functionName);
  if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === functionName) {
    exports[functionName] = require(file);
  }
})
