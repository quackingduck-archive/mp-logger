msLogger   = require './'
ms         = require 'message-socket'
{testCase} = require 'nodeunit'

module.exports = testCase

  "connect message sends whole buffer": (test) ->
    test.expect 1

    logger = msLogger 'test'

    logger.info "one"
    logger.info "two"
    logger.info "three"

    req = ms.req 'ipc:///tmp/mslogger/test'
    req { msg: 'connect' }, (res) ->
      test.strictEqual res.messages.length, 3

      req.close()
      logger.close()
      test.done()