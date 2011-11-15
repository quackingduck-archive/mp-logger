mpLogger   = require '../'
ms         = require 'message-ports'
{testCase} = require 'nodeunit'

module.exports = testCase

  "connect message sends whole buffer": (test) ->
    test.expect 1

    logger = mpLogger 'test'

    logger.info "one"
    logger.info "two"
    logger.info "three"

    req = ms.req 'ipc:///tmp/mplogger/test'
    req { msg: 'connect' }, (res) ->
      test.strictEqual res.messages.length, 3

      req.close()
      logger.close()
      test.done()

  "a null config returns a noop logger": (test) ->
    logger = mpLogger 'test', null
    test.doesNotThrow ->
      logger.info "does nothing. goes nowhere."
    test.done()
