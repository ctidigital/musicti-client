var Spotify       = require('node-spotify')({ appkeyFile: './config/spotify_appkey.key' }),
    PusherClient  = require('pusher-client')
    PusherServer  = require('pusher')
    Musicti = {
        pusher: {
            appId: '',
            key: '',
            secret: '',
            channel: 'musicti_client',
            client: {}
        },
        playList: {
            currentTrack: {},
            nextTrack: {},
            previousTrack: {}
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
                Musicti.logger(message);
            }

            Spotify.player.on({
                endOfTrack: function() {
                    Musicti.logger("end of track");
                    Spotify.player.play(Musicti.playList.nextTrack);
                }
            });

            channel.bind('pause', function(){
                Spotify.player.pause();
            });

            channel.bind('resume', function(){
                Spotify.player.resume();
            });

            channel.bind('skip', function(){
                Spotify.player.play(Musicti.playList.nextTrack);
            });

            channel.bind('play', function(t){
                var url  = t.url.toString(),
                    track = Spotify.createFromLink(url);

                Musicti.setPreviousTrack(Musicti.playList.currentTrack);
                Musicti.setCurrentTrack(t);

                server.trigger('musicti_notification', 'playing', track);

                Spotify.player.play(track);
            });

            channel.bind('queue', function(t) {
                var url   = t.url.toString(),
                    track = Spotify.createFromLink(url);

                Musicti.setNextTrack(track);
            });

            channel.bind('stop', function(){
                Spotify.player.stop();
            });

        },
        logger: function (message) {
            console.log(message);
        },
        setCurrentTrack: function(track) {
            Musicti.playList.currentTrack = track;
        },
        setNextTrack: function(track) {
            Musicti.playList.nextTrack = track;
            Musicti.logger("Playing " + track.name + " next");
        },
        setPreviousTrack: function(track) {
            Musicti.playList.previousTrack = track;
        }
    };

Spotify.login('USERNAME', 'PASSWORD', false, false);
Spotify.on({
    ready: Musicti.init
});



