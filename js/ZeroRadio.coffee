class Part extends Class
	constructor: (data) ->
		@loc="./parts/"+data.l
		@start=data.s
		@end=data.e
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
		@log "Load manifest with #{data.length} parts"
		cur=new Date().getTime()
		for part in data
			part=new Part(part,cur)
			if part.valid(cur)
				@parts.push(part)
		@log "#{@parts.length} out of #{data.length} parts are valid"
		@parts=@parts.sort (a,b) =>
			a.start-b.start
		@
	toArray: ->
		return @parts
	toObject: ->
		res={}
		for part in @parts
			res[part.loc]=part
		return res

class Track extends Class
	constructor: (track, onend) ->
		@el=$("<audio controls onended='console.log(\\'hi\\')'></audio>")[0]
		@onend=onend
		@log "Preload #{track.loc}"
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
		@log "Play #{@track.loc} with offest of #{offset}s"
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
		@partsId?={}
		@players?=[]
		@playersId?={}
		@playing=""
		@offline=false
		@init=false
		@
	cleanPlayers: ->
		@players=@players.filter (player) =>
			if @partsId[player.track.loc]
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
		if not tracks.length
			if @init
				if not @offline
					window.cmd "wrapperNotification", ["error","<b>Stream is currently offline</b><br>Wait or come back later"]
					@offline=true
					@next=null
		else
			@offline=false
			for track in tracks
				if not @playersId[track.loc]
					@playersId[track.loc]=new Track(track,@onend.bind(@))
					@players.push(@playersId[track.loc])
			@next=tracks
			@fastLoop()
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
		@register()
		@
	register: ->
		@log "Register station"
		@interval=setInterval(@loop.bind(@),5000)
		@loop()
	loop: -> #fetch new parts
		$.get "parts/manifest.json", (parts) =>
			if not parts
				@cmd "wrapperNotification", ["error","Failed to get manifest"]
			@manifest=new Manifest(parts)
			@player.parts=@manifest.toArray() #the loc is the id so it really doesn't matter if it's a new object or not
			@player.partsId=@manifest.toObject()
			@player.loop()
			@player.init=true
			@log "Player now has #{@player.parts.length} items in queue"


class ZeroRadio extends Class
	constructor: ->
		@log "NOTE: A part is valid when it's start time is not in the past"
		@
	start: ->
		@frame=new ZeroFrame()
		@frame.onOpenWebsocket=@onOpenWebsocket
  onOpenWebsocket: =>
		@station=new Station(@frame)

window.Page = new ZeroRadio()
Page.start()
