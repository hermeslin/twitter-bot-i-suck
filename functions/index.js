'use strict';
const glob = require("glob");

const endpoints = glob.sync('./endpoints/*.js', { cwd: __dirname });
const triggers = glob.sync('./triggers/*.js', { cwd: __dirname });

[].concat(endpoints, triggers).forEach((file) => {
  const functionName = file.split('/').pop().slice(0, -3); // Strip off '.js'
  if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === functionName) {
    exports[functionName] = require(file);
  }
})
