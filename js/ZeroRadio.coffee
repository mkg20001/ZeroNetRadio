class Part extends Class
	constructor: (data) ->
		@loc="./parts/"+data.loc
		@start=data.start
		@end=data.end
		#@log "Init file #{data.loc} @ #{data.start} (valid=#{@valid(cur)})"
		@
	valid: (cur) ->
		return cur>=@start and cur<@end || cur<@start and cur<@end
	now: (cur) ->
		return cur>=@start and cur<@end
	offset: (cur) ->
		return cur-@start

class Manifest extends Class
	constructor: (data) ->
		@parts?=[]
		@log "Init manifest with #{data.length} parts"
		cur=new Date().getTime()
		for part in data
			part=new Part(part,cur)
			if part.valid(cur)
				@parts.push(part)
		@
	add: (list) ->
		cur=new Date().getTime()
		newlist=list.filter((part) => part.valid(cur))
		ids=newlist.map((part) => part.loc)
		return newlist.concat(@parts.filter((part) => return ids.indexOf(part.loc)==-1)).sort (a,b) =>
			a.start-b.start

class Track extends Class
	constructor: (track, onend) ->
		@el=$("<audio controls onended='console.log(\\'hi\\')'></audio>")[0]
		@onend=onend
		@log "E", onend
		$(document.body).append(@el)
		@playing=false
		@track=track
		@el.src=track.loc
		@el.preload=true
		#@el.volume=0
		@el.pause()
		@
	play: () ->
		if @playing
			return
		offset=Math.floor(@track.offset(new Date().getTime())/1000)
		@log "Play #{@track.loc} with #{offset}"
		self=this
		@el.addEventListener "ended", ->
			if not self.onend
				console.error "Onend failed"
			self.onend()
		@el.currentTime=offset
		@el.volume=1
		@el.play()
		@playing=true
	remove: () ->
		$(@el).remove()
	valid: (cur) ->
		return @track.valid(cur)

class Player extends Class
	constructor: () ->
		@parts?=[]
		@players?=[]
		@playersId?={}
		@playing=""
		@offline=false
		@init=false
		@
	register: ->
		@log "Register player loop"
		@interval=setInterval(@loop.bind(@),2000)
		#@interval=setInterval(@fastLoop.bind(@),100)
		@loop()
	cleanPlayers: ->
		cur=new Date().getTime()
		@players=@players.filter (player) =>
			if player.valid(cur)
				return true
			delete @playersId[player.track.loc]
			player.remove()
			return false
	getTracks: (next) ->
		cur=new Date().getTime()
		valid=@parts.filter (part) =>
			return cur<part.end
		if not valid.length
			@log "Offline. 0 parts found"
			return false
		else
			return valid.slice(0,10).reverse()
	loop: ->
		@cleanPlayers()
		tracks=@getTracks()
		#chooseTrack
		track=tracks[0]
		if not track
			if @init
				if not @offline
					window.cmd "wrapperNotification", ["error","<b>Stream is currently offline</b><br>Wait or come back later"]
					@offline=true
		else
			@offline=false
			for track in tracks
				if not @playersId[track.loc]
					@playersId[track.loc]=new Track(track,@onend.bind(@))
					@players.push(@playersId[track.loc])
			if @playing != track.loc
				@play track.loc
			@next=tracks
	fastLoop: ->
		if @next
			if @next.length
				for n in @next
					if n.now(new Date().getTime())
						if @playing != n.loc
							@play n.loc
						break
	onend: ->
		@log "OnEnd Event"
		@fastLoop()
	play: (track) ->
		@log "Play #{track}"
		@playersId[track].play()
		@playing=track

class Station extends Class
	constructor: (main) ->
		@log main
		@main=main
		@cmd=@main.cmd.bind(@main)
		window.cmd?=@cmd
		@player=new Player()
		@player.register()
		@register()
		@
	register: ->
		@log "Register station"
		@interval=setInterval(@loop.bind(@),5000)
		@loop()
	loop: ->
		$.get "parts/manifest.json", (parts) =>
			if not parts
				@cmd "wrapperNotification", ["error","Failed to get manifest"]
			@manifest=new Manifest(parts)
			@player.parts=@manifest.add(@player.parts)
			@player.init=true
			@log "Player now has #{@player.parts.length} items in queue"


class ZeroRadio extends Class
	constructor: ->
		@
	start: ->
		@frame=new ZeroFrame()
		@frame.onOpenWebsocket=@onOpenWebsocket
  onOpenWebsocket: =>
		@station=new Station(@frame)

window.Page = new ZeroRadio()
Page.start()
