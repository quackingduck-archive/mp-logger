(function() {
  var MSLogger, fs, ms, path;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  fs = require('fs');
  path = require('path');
  ms = require('message-socket');
  ms.messageFormat = 'json';
  module.exports = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return typeof result === "object" ? result : child;
    })(MSLogger, args, function() {});
  };
  MSLogger = (function() {
    function MSLogger(name, url) {
      var dir;
      this.name = name;
      this.url = url;
      if (!this.url) {
        dir = "/tmp/mslogger";
        if (!path.existsSync(dir)) {
          fs.mkdirSync(dir, 0777);
        }
        this.url = "ipc://" + dir + "/" + this.name;
        this.pubUrl = this.url + '.pub';
      }
      this.seqId = Math.round(Math.random() * 1000000);
      this.seq = 0;
      this.buffer = [];
      this.maxBufferSize = 20;
      this.reply = ms.reply(this.url);
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
      this.publish = ms.publish(this.pubUrl);
    }
    MSLogger.prototype.connectResponse = function() {
      return {
        messages: this.buffer,
        subscribe: this.pubUrl,
        seq_id: this.seqId,
        seq: this.seq
      };
    };
    MSLogger.prototype.syncResponse = function(seq) {
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
    MSLogger.prototype.info = function(msg) {
      return this.log('info', msg);
    };
    MSLogger.prototype.warn = function(msg) {
      return this.log('warn', msg);
    };
    MSLogger.prototype.error = function(msg) {
      return this.log('error', msg);
    };
    MSLogger.prototype.fatal = function(msg) {
      return this.log('fatal', msg);
    };
    MSLogger.prototype.debug = function(msg) {
      return this.log('debug', msg);
    };
    MSLogger.prototype.log = function(type, msg) {
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
    MSLogger.prototype.close = function() {
      this.reply.close();
      return this.publish.close();
    };
    return MSLogger;
  })();
}).call(this);
