var events        = require('events'),
    eventEmitter  = new events.EventEmitter(),
    Spotify       = require('node-spotify')({ appkeyFile: './config/spotify_appkey.key' }),
    PusherClient  = require('pusher-client')
    PusherServer  = require('pusher')
    Musicti = {
        pusher: {
            appId: '',
            key: '',
            secret: '',
            channel: 'musicti_client'
        },
        playList: {
            currentTrack: null,
            previousTrack: null,
            tracks: []
        },

        init: function()  {

            var client  = new PusherClient(Musicti.pusher.key),
                server  = new PusherServer({
                            appId:  Musicti.pusher.appId,
                            key:    Musicti.pusher.key,
                            secret: Musicti.pusher.secret
                        }),
                channel = client.subscribe(Musicti.pusher.channel);

            PusherClient.log  = function(message) {
                Musicti.log(message);
            }

            channel.bind('pause', function(){
                // Emit a pause track event
                eventEmitter.emit('pause');

                // Log pause event
                Musicti.log('pause track event fired');
            });

            channel.bind('resume', function(){
                // Emit a resume track event
                eventEmitter.emit('resume');

                // Log resume event
                Musicti.log('resume track event fired')
            });

            channel.bind('next', function(){
                // Emit a next track event
                eventEmitter.emit('next');

                // Log next event
                Musicti.log('next track event fired')
            });

            channel.bind('play', function(track){

                // Emit a play track event
                eventEmitter.emit('play', track);

                // Trigger notification of track being played
                server.trigger('musicti_notification', 'playing', track);

                // Log play event
                Musicti.log('play track event fired')
            });

            channel.bind('queue', function(track) {
                // Emit a queue track event
                eventEmitter.emit('queue', track);

                // Log queue event
                Musicti.log('queue track event fired')
            });

            channel.bind('stop', function(){
                // Emit a stop track event
                eventEmitter.emit('stop');

                // Log stop event
                Musicti.log('stop track event fired')
            });

        },
        /**
         * Log Message
         *
         * @param message
         */
        log: function (message) {
            console.log(message);
        },
        /**
         * Set current Track
         *
         * @param track
         */
        setCurrentTrack: function(track) {
            Musicti.playList.currentTrack = track;
        },
        /**
         * Get current Track
         *
         * @returns {*}
         */
        getCurrentTrack: function() {
            return Musicti.playList.currentTrack;
        },
        /**
         * Add a Track to running playlist
         *
         * @param track
         */
        addTrackToPlayList: function(track) {
            if(Musicti.playList.tracks.indexOf(track) == -1)
            {
                Musicti.playList.tracks.push(track);
            }else{
                Musicti.log('cannot add a duplicate track to playlist');
            }
        },
        /**
         * Get next Track
         *
         * @returns {*}
         */
        getNextTrack: function() {
            if(Musicti.playList.tracks.length > 0)
            {
                return Musicti.playList.tracks.pop();
            }

            return null;
        },
        /**
         * Set previous Track
         *
         * @param track
         */
        setPreviousTrack: function(track) {
            Musicti.playList.previousTrack = track;
        },
        /**
         * Get previous Track
         *
         * @returns {*}
         */
        getPreviousTrack: function() {
            return Musicti.playList.previousTrack;
        }
    };


Spotify.login('USERNAME', 'PASSWORD', false, false);
Spotify.on({
    ready: function() {
        Musicti.init();

        Spotify.player.on({
            endOfTrack: function() {
                // Emit next track event
                eventEmitter.emit('next');
            }
        });

        eventEmitter.on('pause', function() {
            Spotify.player.pause();
        });

        eventEmitter.on('resume', function() {
            Spotify.player.resume();
        });

        eventEmitter.on('next', function() {
            // Make sure we have another track to play after our current one
            var nextTrack = Musicti.getNextTrack();
            if(nextTrack !== null) {
                // Emit a play track event
                eventEmitter.emit('play', nextTrack);
            }else{
                // Emit an empty playlist event
                eventEmitter.emit('empty_playlist');

                Musicti.log('Nothing else to play');
            }
        });

        eventEmitter.on('queue', function(t) {
            var url  = t.url.toString(),
                track = Spotify.createFromLink(url);

            if(typeof track !== 'undefined')
            {
                Musicti.addTrackToPlayList(t);
            }else{
                Musicti.log('invalid track');
            }
        });

        eventEmitter.on('stop', function() {
            Spotify.player.stop();
        });

        eventEmitter.on('play', function(t) {
            var url  = t.url.toString(),
                track = Spotify.createFromLink(url);

            if(typeof track !== 'undefined')
            {
                Musicti.setPreviousTrack(Musicti.getCurrentTrack());
                Musicti.setCurrentTrack(t);

                Spotify.player.play(track);
            }else{
                Musicti.log('invalid track');
            }
        });
    }
});



