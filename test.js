(function() {
  var ms, msLogger, testCase;
  msLogger = require('./');
  ms = require('message-ports');
  testCase = require('nodeunit').testCase;
  module.exports = testCase({
    "connect message sends whole buffer": function(test) {
      var logger, req;
      test.expect(1);
      logger = msLogger('test');
      logger.info("one");
      logger.info("two");
      logger.info("three");
      req = ms.req('ipc:///tmp/mslogger/test');
      return req({
        msg: 'connect'
      }, function(res) {
        test.strictEqual(res.messages.length, 3);
        req.close();
        logger.close();
        return test.done();
      });
    },
    "a null config returns a noop logger": function(test) {
      var logger;
      logger = msLogger('test', null);
      test.doesNotThrow(function() {
        return logger.info("does nothing. goes nowhere.");
      });
      return test.done();
    }
  });
}).call(this);
