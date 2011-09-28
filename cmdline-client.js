(function() {
  var debug, msgSocket, printMessage;
  msgSocket = require('message-socket');
  msgSocket.messageFormat = 'json';
  require('colors');
  this.run = function(args) {
    var reconnect, req, seqId, seqNum, sync, syncronizing;
    seqId = null;
    seqNum = null;
    syncronizing = false;
    req = msgSocket.req.apply(msgSocket, args);
    req({
      msg: 'connect'
    }, function(res) {
      var msg, sub, _i, _len, _ref;
      _ref = res.messages;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        msg = _ref[_i];
        printMessage(msg);
      }
      seqId = res.seq_id;
      seqNum = res.seq;
      sub = msgSocket.sub(res.subscribe);
      return sub(function(msg) {
        if (!syncronizing) {
          if (msg.seq_id === seqId) {
            if (msg.seq === seqNum + 1) {
              printMessage(msg);
              return seqNum += 1;
            } else {
              return sync();
            }
          } else {
            return reconnect();
          }
        }
      });
    });
    sync = function() {
      syncronizing = true;
      return req({
        msg: 'sync',
        seq: seqNum
      }, function(res) {
        var msg, _i, _len, _ref;
        _ref = res.messages;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          msg = _ref[_i];
          printMessage(msg);
        }
        seqNum = res.seq;
        return syncronizing = false;
      });
    };
    return reconnect = function() {
      syncronizing = true;
      return req({
        msg: 'connect'
      }, function(res) {
        var msg, _i, _len, _ref;
        _ref = res.messages;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          msg = _ref[_i];
          printMessage(msg);
        }
        seqId = res.seq_id;
        seqNum = res.seq;
        return syncronizing = false;
      });
    };
  };
  printMessage = function(msg) {
    var body, colored;
    body = msg.msg;
    colored = (function() {
      switch (msg.type) {
        case 'debug':
          return body.grey;
        case 'warn':
          return body.magenta;
        case 'error':
          return body.red;
        case 'fatal':
          return body.red.inverse;
        default:
          return body;
      }
    })();
    return console.log(colored);
  };
  debug = function(msg) {
    return console.log("[DEBUG] " + msg);
  };
}).call(this);
