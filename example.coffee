# Example usage of mp-logger
#
# First, start the client:
#     ./bin/ms-logger ipc:///tmp/mslogger/example
#
# Then run this file
#     coffee example.coffee

mpl = require './'

count = 0

logger = mpl 'example'

setInterval ->
  logger.info "counting: #{count+=1}"
  if count is 100
    process.exit()
, 10
