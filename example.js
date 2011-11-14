(function() {
  var count, logger, mpl;
  mpl = require('./');
  count = 0;
  logger = mpl('example');
  setInterval(function() {
    logger.info("counting: " + (count += 1));
    if (count === 100) {
      return process.exit();
    }
  }, 10);
}).call(this);
