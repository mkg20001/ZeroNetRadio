

/* ---- /1RaDiogZuNc8WLK3MUGJSMWwrXu8CgrFS/js/lib/Class.coffee ---- */


(function() {
  var Class,
    slice = [].slice;

  Class = (function() {
    function Class() {}

    Class.prototype.trace = true;

    Class.prototype.log = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (!this.trace) {
        return;
      }
      if (typeof console === 'undefined') {
        return;
      }
      args.unshift("[" + this.constructor.name + "]");
      console.log.apply(console, args);
      return this;
    };

    Class.prototype.logStart = function() {
      var args, name;
      name = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (!this.trace) {
        return;
      }
      this.logtimers || (this.logtimers = {});
      this.logtimers[name] = +(new Date);
      if (args.length > 0) {
        this.log.apply(this, ["" + name].concat(slice.call(args), ["(started)"]));
      }
      return this;
    };

    Class.prototype.logEnd = function() {
      var args, ms, name;
      name = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      ms = +(new Date) - this.logtimers[name];
      this.log.apply(this, ["" + name].concat(slice.call(args), ["(Done in " + ms + "ms)"]));
      return this;
    };

    Class.prototype.unregister = function() {
      if (this.interval) {
        clearInterval(this.interval);
        this.log("Unregistered interval for " + this.constructor.name + " (id=" + this.interval + ")");
        return this.interval = 0;
      }
    };

    return Class;

  })();

  window.Class = Class;

}).call(this);


/* ---- /1RaDiogZuNc8WLK3MUGJSMWwrXu8CgrFS/js/lib/ZeroFrame.coffee ---- */


(function() {
  var ZeroFrame,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ZeroFrame = (function(superClass) {
    extend(ZeroFrame, superClass);

    function ZeroFrame(url) {
      this.onCloseWebsocket = bind(this.onCloseWebsocket, this);
      this.onOpenWebsocket = bind(this.onOpenWebsocket, this);
      this.onRequest = bind(this.onRequest, this);
      this.onMessage = bind(this.onMessage, this);
      this.url = url;
      this.waiting_cb = {};
      this.wrapper_nonce = document.location.href.replace(/.*wrapper_nonce=([A-Za-z0-9]+).*/, "$1");
      this.connect();
      this.next_message_id = 1;
      this.history_state = {};
      this.init();
    }

    ZeroFrame.prototype.init = function() {
      return this;
    };

    ZeroFrame.prototype.connect = function() {
      this.target = window.parent;
      window.addEventListener("message", this.onMessage, false);
      this.cmd("innerReady");
      window.addEventListener("beforeunload", (function(_this) {
        return function(e) {
          _this.log("save scrollTop", window.pageYOffset);
          _this.history_state["scrollTop"] = window.pageYOffset;
          return _this.cmd("wrapperReplaceState", [_this.history_state, null]);
        };
      })(this));
      return this.cmd("wrapperGetState", [], (function(_this) {
        return function(state) {
          if (state != null) {
            _this.history_state = state;
          }
          _this.log("restore scrollTop", state, window.pageYOffset);
          if (window.pageYOffset === 0 && state) {
            return window.scroll(window.pageXOffset, state.scrollTop);
          }
        };
      })(this));
    };

    ZeroFrame.prototype.onMessage = function(e) {
      var cmd, message;
      message = e.data;
      cmd = message.cmd;
      if (cmd === "response") {
        if (this.waiting_cb[message.to] != null) {
          return this.waiting_cb[message.to](message.result);
        } else {
          return this.log("Websocket callback not found:", message);
        }
      } else if (cmd === "wrapperReady") {
        return this.cmd("innerReady");
      } else if (cmd === "ping") {
        return this.response(message.id, "pong");
      } else if (cmd === "wrapperOpenedWebsocket") {
        return this.onOpenWebsocket();
      } else if (cmd === "wrapperClosedWebsocket") {
        return this.onCloseWebsocket();
      } else {
        return this.onRequest(cmd, message.params);
      }
    };

    ZeroFrame.prototype.onRequest = function(cmd, message) {
      return this.log("Unknown request", message);
    };

    ZeroFrame.prototype.response = function(to, result) {
      return this.send({
        "cmd": "response",
        "to": to,
        "result": result
      });
    };

    ZeroFrame.prototype.cmd = function(cmd, params, cb) {
      if (params == null) {
        params = {};
      }
      if (cb == null) {
        cb = null;
      }
      return this.send({
        "cmd": cmd,
        "params": params
      }, cb);
    };

    ZeroFrame.prototype.send = function(message, cb) {
      if (cb == null) {
        cb = null;
      }
      message.wrapper_nonce = this.wrapper_nonce;
      message.id = this.next_message_id;
      this.next_message_id += 1;
      this.target.postMessage(message, "*");
      if (cb) {
        return this.waiting_cb[message.id] = cb;
      }
    };

    ZeroFrame.prototype.onOpenWebsocket = function() {
      return this.log("Websocket open");
    };

    ZeroFrame.prototype.onCloseWebsocket = function() {
      return this.log("Websocket close");
    };

    return ZeroFrame;

  })(Class);

  window.ZeroFrame = ZeroFrame;

}).call(this);


/* ---- /1RaDiogZuNc8WLK3MUGJSMWwrXu8CgrFS/js/ZeroRadio.coffee ---- */


(function() {
  var Manifest, Part, Player, Station, Track, ZeroRadio,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Part = (function(superClass) {
    extend(Part, superClass);

    function Part(data) {
      this.loc = "./parts/" + data.loc;
      this.start = data.start;
      this.end = data.end;
      this;
    }

    Part.prototype.valid = function(cur) {
      return cur >= this.start && cur < this.end || cur < this.start && cur < this.end;
    };

    Part.prototype.now = function(cur) {
      return cur >= this.start && cur < this.end;
    };

    Part.prototype.offset = function(cur) {
      return cur - this.start;
    };

    return Part;

  })(Class);

  Manifest = (function(superClass) {
    extend(Manifest, superClass);

    function Manifest(data) {
      var cur, i, len, part;
      if (this.parts == null) {
        this.parts = [];
      }
      this.log("Load manifest with " + data.length + " parts");
      cur = new Date().getTime();
      for (i = 0, len = data.length; i < len; i++) {
        part = data[i];
        part = new Part(part, cur);
        if (part.valid(cur)) {
          this.parts.push(part);
        }
      }
      this.log(this.parts.valid + " out of " + data.length + " parts are valid");
      this;
    }

    Manifest.prototype.add = function() {
      return this.parts.sort((function(_this) {
        return function(a, b) {
          return a.start - b.start;
        };
      })(this));
    };

    return Manifest;

  })(Class);

  Track = (function(superClass) {
    extend(Track, superClass);

    function Track(track, onend) {
      this.el = $("<audio controls onended='console.log(\\'hi\\')'></audio>")[0];
      this.onend = onend;
      this.log("Preload " + track.loc);
      $(document.body).append(this.el);
      this.playing = false;
      this.track = track;
      this.el.src = track.loc;
      this.el.preload = true;
      this.el.pause();
      this;
    }

    Track.prototype.play = function() {
      var offset, self;
      if (this.playing) {
        return;
      }
      offset = Math.floor(this.track.offset(new Date().getTime()) / 1000);
      this.log("Play " + this.track.loc + " with " + offset);
      self = this;
      this.el.addEventListener("ended", function() {
        if (!self.onend) {
          console.error("Onend failed");
        }
        return self.onend();
      });
      this.el.currentTime = offset;
      this.el.volume = 1;
      this.el.play();
      return this.playing = true;
    };

    Track.prototype.remove = function() {
      return $(this.el).remove();
    };

    Track.prototype.valid = function(cur) {
      return this.track.valid(cur);
    };

    return Track;

  })(Class);

  Player = (function(superClass) {
    extend(Player, superClass);

    function Player() {
      if (this.parts == null) {
        this.parts = [];
      }
      if (this.players == null) {
        this.players = [];
      }
      if (this.playersId == null) {
        this.playersId = {};
      }
      this.playing = "";
      this.offline = false;
      this.init = false;
      this;
    }

    Player.prototype.register = function() {
      this.log("Register player loop");
      this.interval = setInterval(this.loop.bind(this), 2000);
      return this.loop();
    };

    Player.prototype.cleanPlayers = function() {
      var cur;
      cur = new Date().getTime();
      return this.players = this.players.filter((function(_this) {
        return function(player) {
          if (player.valid(cur)) {
            return true;
          }
          delete _this.playersId[player.track.loc];
          player.remove();
          return false;
        };
      })(this));
    };

    Player.prototype.getTracks = function(next) {
      var cur, valid;
      cur = new Date().getTime();
      valid = this.parts.filter((function(_this) {
        return function(part) {
          return cur < part.end;
        };
      })(this));
      if (!valid.length) {
        this.log("Offline. 0 parts found");
        return false;
      } else {
        return valid.slice(0, 10).reverse();
      }
    };

    Player.prototype.loop = function() {
      var i, len, track, tracks;
      this.cleanPlayers();
      tracks = this.getTracks();
      track = tracks[0];
      if (!track) {
        if (this.init) {
          if (!this.offline) {
            window.cmd("wrapperNotification", ["error", "<b>Stream is currently offline</b><br>Wait or come back later"]);
            return this.offline = true;
          }
        }
      } else {
        this.offline = false;
        for (i = 0, len = tracks.length; i < len; i++) {
          track = tracks[i];
          if (!this.playersId[track.loc]) {
            this.playersId[track.loc] = new Track(track, this.onend.bind(this));
            this.players.push(this.playersId[track.loc]);
          }
        }
        this.next = tracks;
        return this.fastLoop();
      }
    };

    Player.prototype.fastLoop = function() {
      var i, len, n, ref, results;
      if (this.next) {
        if (this.next.length) {
          ref = this.next;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            n = ref[i];
            if (n.now(new Date().getTime())) {
              if (this.playing !== n.loc) {
                this.play(n.loc);
              }
              break;
            } else {
              results.push(void 0);
            }
          }
          return results;
        }
      }
    };

    Player.prototype.onend = function() {
      this.log("OnEnd Event");
      return this.fastLoop();
    };

    Player.prototype.play = function(track) {
      this.log("Play " + track);
      this.playersId[track].play();
      return this.playing = track;
    };

    return Player;

  })(Class);

  Station = (function(superClass) {
    extend(Station, superClass);

    function Station(main) {
      this.log(main);
      this.main = main;
      this.cmd = this.main.cmd.bind(this.main);
      if (window.cmd == null) {
        window.cmd = this.cmd;
      }
      this.player = new Player();
      this.player.register();
      this.register();
      this;
    }

    Station.prototype.register = function() {
      this.log("Register station");
      this.interval = setInterval(this.loop.bind(this), 5000);
      return this.loop();
    };

    Station.prototype.loop = function() {
      return $.get("parts/manifest.json", (function(_this) {
        return function(parts) {
          if (!parts) {
            _this.cmd("wrapperNotification", ["error", "Failed to get manifest"]);
          }
          _this.manifest = new Manifest(parts);
          _this.player.parts = _this.manifest.add();
          _this.player.loop();
          _this.player.init = true;
          return _this.log("Player now has " + _this.player.parts.length + " items in queue");
        };
      })(this));
    };

    return Station;

  })(Class);

  ZeroRadio = (function(superClass) {
    extend(ZeroRadio, superClass);

    function ZeroRadio() {
      this;
    }

    ZeroRadio.prototype.start = function() {
      this.frame = new ZeroFrame();
      this.frame.onOpenWebsocket = this.onOpenWebsocket;
      ({
        onOpenWebsocket: (function(_this) {
          return function() {};
        })(this)
      });
      return this.station = new Station(this.frame);
    };

    return ZeroRadio;

  })(Class);

  window.Page = new ZeroRadio();

  Page.start();

}).call(this);
