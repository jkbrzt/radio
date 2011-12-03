(function() {
  var Player, PlayerView, Playlist, Video, app,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Video = (function() {

    __extends(Video, Backbone.Model);

    function Video() {
      Video.__super__.constructor.apply(this, arguments);
    }

    return Video;

  })();

  Player = (function() {

    __extends(Player, Backbone.Model);

    function Player() {
      this.swfReady = __bind(this.swfReady, this);
      this.swfEmbed = __bind(this.swfEmbed, this);
      this.videoError = __bind(this.videoError, this);
      this.stateChanged = __bind(this.stateChanged, this);
      this.playStop = __bind(this.playStop, this);
      Player.__super__.constructor.apply(this, arguments);
    }

    Player.UNSTARTED = -1;

    Player.ENDED = 0;

    Player.PLAYING = 1;

    Player.PAUSED = 2;

    Player.BUFFERING = 3;

    Player.VIDEO_CUED = 5;

    Player.ERROR = 999;

    Player.prototype.initialize = function() {
      return app.playlist.bind('reset', this.swfEmbed);
    };

    Player.prototype.isPlaying = function() {
      return this.get('state') === Player.PLAYING || this.get('state') === Player.BUFFERING;
    };

    Player.prototype.playRandom = function() {
      return this.player.loadVideoById(app.playlist.random().id);
    };

    Player.prototype.play = function() {
      this.playRandom();
      return this.set({
        state: Player.PLAYING
      });
    };

    Player.prototype.stop = function() {
      this.player.stopVideo();
      return this.set({
        state: Player.PAUSED
      });
    };

    Player.prototype.playStop = function() {
      if (this.isPlaying()) {
        return this.stop();
      } else {
        return this.play();
      }
    };

    Player.prototype.stateChanged = function(state) {
      switch (state) {
        case Player.ENDED:
        case Player.ERROR:
          this.playRandom();
      }
      return this.set({
        state: state
      });
    };

    Player.prototype.videoError = function(error_code) {
      var error;
      switch (error_code) {
        case 2:
          error = 'request contains an invalid parameter';
          break;
        case 100:
          error = 'the video requested was not found';
          break;
        case 101:
        case 150:
          error = 'the video requested does not allow playback in the embedded players';
          break;
        default:
          error = 'unknown error';
      }
      this.trigger('error', [error]);
      return this.stateChanged(Player.ERROR);
    };

    Player.prototype.swfEmbed = function() {
      return swfobject.embedSWF('http://www.youtube.com/apiplayer?enablejsapi=1&version=3', this.id, '1', '1', '8', null, null, {
        allowScriptAccess: 'always'
      });
    };

    Player.prototype.swfReady = function() {
      this.player = $("#" + this.id)[0];
      this.player.addEventListener('onStateChange', 'app.player.stateChanged');
      return this.player.addEventListener('onError', 'app.player.videoError');
    };

    return Player;

  })();

  Playlist = (function() {

    __extends(Playlist, Backbone.Collection);

    function Playlist() {
      Playlist.__super__.constructor.apply(this, arguments);
    }

    Playlist.prototype.initialize = function(options) {
      return this.id = options.id;
    };

    Playlist.prototype.url = function() {
      return 'https://gdata.youtube.com/feeds/api/playlists/' + ("" + this.id + "?v=2&alt=jsonc");
    };

    Playlist.prototype.fetch = function() {
      return Playlist.__super__.fetch.call(this, {
        dataType: 'jsonp'
      });
    };

    Playlist.prototype.parse = function(response) {
      var item, _i, _len, _ref, _results;
      _ref = response.data.items;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        if (item.video.accessControl.embed === 'allowed') {
          _results.push(item.video);
        }
      }
      return _results;
    };

    Playlist.prototype.random = function() {
      return this.at(Math.floor(Math.random() * this.length));
    };

    return Playlist;

  })();

  PlayerView = (function() {

    __extends(PlayerView, Backbone.View);

    function PlayerView() {
      this.buttonClicked = __bind(this.buttonClicked, this);
      this.render = __bind(this.render, this);
      PlayerView.__super__.constructor.apply(this, arguments);
    }

    PlayerView.prototype.initialize = function(options) {
      this.el = $('#player');
      this.button = this.el.find('.button');
      this.status = this.el.find('.status');
      this.button.on('click', this.buttonClicked);
      return this.model.bind('change:state', this.render);
    };

    PlayerView.prototype.render = function() {
      var state, text;
      this.button.text(this.model.isPlaying() ? 'stop' : 'play');
      state = this.model.get('state');
      switch (state) {
        case Player.BUFFERING:
          text = 'loading…';
          break;
        case Player.ERROR:
          text = 'error has occurred';
          break;
        default:
          text = '';
      }
      return this.status.text(text);
    };

    PlayerView.prototype.buttonClicked = function() {
      return this.model.playStop();
    };

    return PlayerView;

  })();

  app = {};

  $(function() {
    var PLAYLIST_ID;
    PLAYLIST_ID = 'E7504F20BC16E506';
    app.playlist = new Playlist({
      id: PLAYLIST_ID
    });
    app.player = new Player({
      id: 'swf'
    });
    app.view = new PlayerView({
      model: app.player
    });
    app.playlist.fetch();
    window.onYouTubePlayerReady = function() {
      app.view.render();
      return app.player.swfReady();
    };
    return window.app = app;
  });

}).call(this);
