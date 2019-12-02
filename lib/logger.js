'use strict';

const log4js = require('log4js');

let logger; 

let getLog = () => {
  if(logger) {return logger;}

  logger = log4js.getLogger();
  logger.level = global.LOG_LEVEL || 'INFO';
  logger.info(`LOG Level: ${logger.level}`);
      
  return logger;  
};

exports.log = getLog(); 