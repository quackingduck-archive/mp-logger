(function() {
  var count, logger, msLogger;
  msLogger = require('./ms-logger');
  count = 0;
  logger = msLogger('example');
  setInterval(function() {
    logger.info("counting: " + (count += 1));
    if (count === 100) {
      return process.exit();
    }
  }, 10);
}).call(this);
