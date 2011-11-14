# Log publisher that buffers publisher-side and is therefore "semi-reliable".
# Clients that connect first shouldn't exhibit the [slow joiner] problem and
# always miss the first few messages.
#
# [slow joiner]: http://zguide.zeromq.org/lua:all#Getting-the-Message-Out

fs = require 'fs'
path = require 'path'

ms = require 'message-ports'
ms.messageFormat = 'json'

module.exports = (args...) -> new MSLogger args...

class MSLogger
  constructor: (@name, conf) ->
    @seqId = Math.round(Math.random()*1000000)
    @seq = 0

    @buffer = []
    @maxBufferSize = 20

    @closed = yes

    if conf isnt null
      if conf is undefined then @openDefaultSockets() else @open conf

  info:  (msg) -> @log 'info',  msg
  warn:  (msg) -> @log 'warn',  msg
  error: (msg) -> @log 'error', msg
  fatal: (msg) -> @log 'fatal', msg
  debug: (msg) -> @log 'debug', msg

  open: (conf) ->
    @replyUrl = conf.rep
    @reply = ms.reply @replyUrl
    @reply (msg, send) =>
      cmd = msg.msg; delete msg.msg
      switch cmd
        when 'connect' then send @connectResponse()
        when 'sync' then send @syncResponse(msg.seq)
        else send error: "message not understood"

    @pubUrl = conf.pub
    @publish = ms.publish @pubUrl

    @closed = no
    this

  reopen: (conf) ->
    @close() unless @closed
    @open conf

  close: ->
    return if @closed
    @reply.close()   ; @reply   = null ; @replyUrl = null
    @publish.close() ; @publish = null ; @pubUrl   = null
    @closed = yes

  openDefaultSockets: ->
    dir = "/tmp/mslogger"
    fs.mkdirSync dir, 0777 unless path.existsSync dir
    rep = "ipc://#{dir}/#{@name}"
    pub = rep + '.pub'
    @open {rep,pub}

  connectResponse: ->
    messages: @buffer
    subscribe: @pubUrl
    seq_id: @seqId, seq: @seq

  syncResponse: (seq) ->
    messages: msg for msg in @buffer when msg.seq > seq
    seq_id: @seqId, seq: @seq

  log: (type,msg) ->
    return if @closed
    # todo: include hostname
    msg =
      name: @name
      seq_id: @seqId
      seq: @seq+=1
      type: type
      msg: msg
      time: new Date()

    @buffer.shift() if @buffer.length > @maxBufferSize
    @buffer.push msg
    @publish msg
