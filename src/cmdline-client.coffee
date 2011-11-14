# Syncronizing (semi-reliable) log client

msgSocket = require 'message-ports'
msgSocket.messageFormat = 'json'

require 'colors'

@run = (args) ->

  seqId = null
  seqNum = null
  syncronizing = no

  req = msgSocket.req args...
  req { msg: 'connect' }, (res) ->

    printMessage msg for msg in res.messages

    seqId = res.seq_id
    seqNum = res.seq

    sub = msgSocket.sub res.subscribe
    # we do this until the process dies
    sub (msg) ->
      unless syncronizing
        if msg.seq_id is seqId
          if msg.seq is seqNum+1
            printMessage msg
            seqNum += 1
          else sync()
        else reconnect()

  sync = ->
    syncronizing = yes
    # we ask for all messages in the buffer after seqNum
    req { msg: 'sync', seq: seqNum }, (res) ->
      printMessage msg for msg in res.messages
      seqNum = res.seq
      syncronizing = no

  reconnect = ->
    syncronizing = yes
    # we ask for all messages in the buffer
    req { msg: 'connect' }, (res) ->
      printMessage msg for msg in res.messages
      seqId = res.seq_id
      seqNum = res.seq
      syncronizing = no


printMessage = (msg) ->
  body = msg.msg
  colored = switch msg.type
    when 'debug' then body.grey
    when 'warn'  then body.magenta
    when 'error' then body.red
    when 'fatal' then body.red.inverse
    else body
  console.log colored

debug = (msg) -> console.log "[DEBUG] #{msg}"
