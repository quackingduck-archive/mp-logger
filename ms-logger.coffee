# Buffering log publisher. Semi-reliable. Clients that connect first shouldn't
# miss messages.

fs = require 'fs'
path = require 'path'

ms = require 'message-socket'
ms.messageFormat = 'json'

module.exports = (args...) -> new MSLogger args...

class MSLogger
  constructor: (@name, @url) ->
    # Default for times when the exact location of the domain socket isn't
    # important
    unless @url
      dir = "/tmp/mslogger"
      fs.mkdirSync dir, 0777 unless path.existsSync dir
      @url = "ipc://#{dir}/#{@name}"
      @pubUrl = @url + '.pub'

    @seqId = Math.round(Math.random()*1000000)
    @seq = 0

    @buffer = []
    @maxBufferSize = 20

    @reply = ms.reply @url
    @reply (msg, send) =>
      cmd = msg.msg; delete msg.msg
      switch cmd
        when 'connect' then send @connectResponse()
        when 'sync' then send @syncResponse(msg.seq)
        else send error: "message not understood"

    @publish = ms.publish @pubUrl


  connectResponse: ->
    messages: @buffer
    subscribe: @pubUrl
    seq_id: @seqId, seq: @seq

  syncResponse: (seq) ->
    messages: msg for msg in @buffer when msg.seq > seq
    seq_id: @seqId, seq: @seq

  info:  (msg) -> @log 'info',  msg
  warn:  (msg) -> @log 'warn',  msg
  error: (msg) -> @log 'error', msg
  fatal: (msg) -> @log 'fatal', msg
  debug: (msg) -> @log 'debug', msg

  log: (type,msg) ->
    # todo: include hostname
    msg =
      name: @name
      seq_id: @seqId
      seq: @seq+=1
      type: type
      msg: msg
      time: new Date()

    # todo: compose message then buffer it
    @buffer.shift() if @buffer.length > @maxBufferSize
    @buffer.push msg
    @publish msg

  close: ->
    @reply.close()
    @publish.close()
