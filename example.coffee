# Example app that uses mslog.
#
# Subscribers that connect first will not exhibit the "slow joiner"
# issue (thanks to mslog's buffering) and will see all log messages
#
# First, start the client:
#     ./mslog ipc:///tmp/mslogger/example
#
# Then run this file
#     coffee example.coffee

msLogger = require './ms-logger'

count = 0

logger = msLogger 'example'

setInterval ->
  logger.info "counting: #{count+=1}"
  if count is 100
    process.exit()
, 10