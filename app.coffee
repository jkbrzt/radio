class Video extends Backbone.Model


class Player extends Backbone.Model

  @UNSTARTED: -1
  @ENDED: 0
  @PLAYING: 1
  @PAUSED: 2
  @BUFFERING: 3
  @VIDEO_CUED: 5
  @ERROR: 999  # Custom

  initialize: ->
    app.playlist.bind 'reset', @swfEmbed

  isPlaying: ->
    @get('state') == Player.PLAYING or
    @get('state') == Player.BUFFERING

  playRandom: ->
    @player.loadVideoById app.playlist.random().id

  play: ->
    @playRandom()
    @set state: Player.PLAYING

  stop: ->
    @player.stopVideo()
    @set state: Player.PAUSED

  playStop: =>
    if @isPlaying()
      @stop()
    else
      @play()

  stateChanged: (state)=>
    switch state
      when Player.ENDED, Player.ERROR
        @playRandom()
    @set state: state

  videoError: (error_code)=>
    switch error_code
      when 2
        error = 'request contains an invalid parameter'
      when 100
        error = 'the video requested was not found'
      when 101, 150
        error = 'the video requested does not allow playback in the embedded players'
      else
        error = 'unknown error'
    @trigger 'error', [error]
    @stateChanged Player.ERROR

  swfEmbed: =>
    swfobject.embedSWF 'http://www.youtube.com/apiplayer?enablejsapi=1&version=3',
       @id,
       #'425', '356',
       '1', '1',
       '8',
       null, null,
       allowScriptAccess: 'always',
       id: @id

  swfReady: =>
    @player = $("##{ @id }")[0]
    @player.addEventListener 'onStateChange', 'app.player.stateChanged'
    @player.addEventListener 'onError', 'app.player.videoError'


class Playlist extends Backbone.Collection

  initialize: (options)->
    @id = options.id

  fetchFeed: =>
    $.ajax
      dataType: 'jsonp'
      url: 'https://gdata.youtube.com/feeds/api/playlists/' +
           "#{ @id }?v=2&alt=jsonc"
      success: (feed)=>
        console.log feed
        @reset(item.video for item in feed.data.items \
          when item.video.accessControl.embed == 'allowed')

  random: ->
    @at Math.floor(Math.random() * @length)


class PlayerView extends Backbone.View

  initialize: (options)->

    @el = $ '#player'
    @button = @el.find '.button'
    @status = @el.find '.status'

    @button.on 'click', @buttonClicked
    @model.bind 'change:state', @render

  render: =>
    @button.text(if @model.isPlaying() then 'stop' else 'play')
    state = @model.get('state')
    switch state
      when Player.BUFFERING
        text = 'loading…'
      when Player.ERROR
        text = 'error has occurred'
      else
        text = ''
    @status.text(text)

  buttonClicked: =>
      @model.playStop()


################################################################


app = {}
$ ->
  PLAYLIST_ID = 'E7504F20BC16E506'

  app.playlist = new Playlist id: PLAYLIST_ID
  app.player = new Player id: 'swf'
  app.view = new PlayerView model: app.player

  app.playlist.fetchFeed()

  window.onYouTubePlayerReady = ->
    app.view.render()
    app.player.swfReady()

  window.app = app
