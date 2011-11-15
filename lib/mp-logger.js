(function() {
  var MPLogger, fs, ms, path;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  fs = require('fs');
  path = require('path');
  ms = require('message-ports');
  ms.messageFormat = 'json';
  module.exports = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return typeof result === "object" ? result : child;
    })(MPLogger, args, function() {});
  };
  MPLogger = (function() {
    function MPLogger(name, conf) {
      this.name = name;
      this.seqId = Math.round(Math.random() * 1000000);
      this.seq = 0;
      this.buffer = [];
      this.maxBufferSize = 20;
      this.closed = true;
      if (conf !== null) {
        if (conf === void 0) {
          this.openDefaultSockets();
        } else {
          this.open(conf);
        }
      }
    }
    MPLogger.prototype.info = function(msg) {
      return this.log('info', msg);
    };
    MPLogger.prototype.warn = function(msg) {
      return this.log('warn', msg);
    };
    MPLogger.prototype.error = function(msg) {
      return this.log('error', msg);
    };
    MPLogger.prototype.fatal = function(msg) {
      return this.log('fatal', msg);
    };
    MPLogger.prototype.debug = function(msg) {
      return this.log('debug', msg);
    };
    MPLogger.prototype.open = function(conf) {
      this.replyUrl = conf.rep;
      this.reply = ms.reply(this.replyUrl);
      this.reply(__bind(function(msg, send) {
        var cmd;
        cmd = msg.msg;
        delete msg.msg;
        switch (cmd) {
          case 'connect':
            return send(this.connectResponse());
          case 'sync':
            return send(this.syncResponse(msg.seq));
          default:
            return send({
              error: "message not understood"
            });
        }
      }, this));
      this.pubUrl = conf.pub;
      this.publish = ms.publish(this.pubUrl);
      this.closed = false;
      return this;
    };
    MPLogger.prototype.reopen = function(conf) {
      if (!this.closed) {
        this.close();
      }
      return this.open(conf);
    };
    MPLogger.prototype.close = function() {
      if (this.closed) {
        return;
      }
      this.reply.close();
      this.reply = null;
      this.replyUrl = null;
      this.publish.close();
      this.publish = null;
      this.pubUrl = null;
      return this.closed = true;
    };
    MPLogger.prototype.openDefaultSockets = function() {
      var dir, pub, rep;
      dir = "/tmp/mplogger";
      if (!path.existsSync(dir)) {
        fs.mkdirSync(dir, 0777);
      }
      rep = "ipc://" + dir + "/" + this.name;
      pub = rep + '.pub';
      return this.open({
        rep: rep,
        pub: pub
      });
    };
    MPLogger.prototype.connectResponse = function() {
      return {
        messages: this.buffer,
        subscribe: this.pubUrl,
        seq_id: this.seqId,
        seq: this.seq
      };
    };
    MPLogger.prototype.syncResponse = function(seq) {
      var msg;
      return {
        messages: (function() {
          var _i, _len, _ref, _results;
          _ref = this.buffer;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            msg = _ref[_i];
            if (msg.seq > seq) {
              _results.push(msg);
            }
          }
          return _results;
        }).call(this),
        seq_id: this.seqId,
        seq: this.seq
      };
    };
    MPLogger.prototype.log = function(type, msg) {
      if (this.closed) {
        return;
      }
      msg = {
        name: this.name,
        seq_id: this.seqId,
        seq: this.seq += 1,
        type: type,
        msg: msg,
        time: new Date()
      };
      if (this.buffer.length > this.maxBufferSize) {
        this.buffer.shift();
      }
      this.buffer.push(msg);
      return this.publish(msg);
    };
    return MPLogger;
  })();
}).call(this);
