/* global $, JitsiMeetJS */
// Taken from https://raw.githubusercontent.com/jbemmel/lib-jitsi-meet/master/doc/example/example.js

const confOptions = {
    openBridgeChannel: true
};

// Populate inputs based on URL params, if any
function getParam(name) { 
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]"); 
  const regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search); 
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " ")); 
}

// Shorthand for $( document ).ready()
$(function() {
 $('input:text').each(function() {
   const paramValue = getParam(this.id);
   if (paramValue != "") {
      console.log(`Auto-filling ${this.id} based on URL param value ${paramValue}`);
      this.value = paramValue;
   } else {
      console.log(`Using default value for text input ${this.id}`); 
   }
 });
});

let connection = null;
let isJoined = false;
let room = null;
let ignoreAudio = true;

let localTracks = [];
const remoteTracks = {};
const remoteIndices = [];
let speechTrack;

/**
 * Handles local tracks.
 * @param tracks Array with JitsiTrack objects
 */
function onLocalTracks(tracks) {
    // localTracks = tracks;
    for (let i = 0; i < tracks.length; i++) {
        tracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
            audioLevel => console.log(`Audio Level local: ${audioLevel}`));
        tracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
            () => console.log('local track muted'));
        tracks[i].addEventListener(
            JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
            () => console.log('local track stoped'));
        tracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
            deviceId =>
                console.log(
                    `track audio output device was changed to ${deviceId}`));
        console.log( `localTrack: ${i} ${tracks[i].getType()}` );
        const id = i + localTracks.length;
        if (tracks[i].getType() === 'video') {
            $('body').append(`<video autoplay='1' id='localVideo${id}' />`);
            tracks[i].attach($(`#localVideo${id}`)[0]);
        } else if (!ignoreAudio) {
            $('body').append(
                `<audio autoplay='1' muted='true' id='localAudio${id}' />`);
            tracks[i].attach($(`#localAudio${id}`)[0]);
        }
        if (isJoined) {
            room.addTrack(tracks[i]);
        }
        localTracks.push( tracks[i] );
    }
}

/**
 * Handles remote tracks
 * @param track JitsiTrack object
 */
function onRemoteTrack(track) {
    if (track.isLocal()) {
        return;
    }
    const participant = track.getParticipantId();

    if (!remoteTracks[participant]) {
        remoteTracks[participant] = [];
    } else if (remoteTracks[participant].indexOf(track) >= 0) {
        console.log( "Track already known, skipping..." );
        return;
    }
    const idx = remoteTracks[participant].push(track) - 1;

    track.addEventListener(
        JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
        audioLevel => console.log(`Audio Level remote: ${audioLevel}`));
    track.addEventListener(
        JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
        () => console.log('remote track muted'));
    track.addEventListener(
        JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
        () => console.log('local track stopped'));
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
        deviceId =>
            console.log(
                `track audio output device was changed to ${deviceId}`));
    const id = participant + track.getType() + idx;

    if (track.getType() === 'video') {
        $('body').append(
            `<video autoplay='1' id='${id}' />`);
        
        // TODO use
        // var offscreen = new OffscreenCanvas(256, 256);
        // var gl = offscreen.getContext('webgl');
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const video = document.getElementById(id);

        // set canvas size = 2*2 video size when known
        video.addEventListener('loadedmetadata', function() {
            canvas.width = 2 * video.videoWidth;
            canvas.height = 2 * video.videoHeight;
        });

        video.addEventListener('play', function() {
          const $this = this; //cache
          var _p = remoteIndices.indexOf(participant);
          if (_p<0) _p = remoteIndices.push( participant ) - 1;

          console.log( `Starting video loop for participant ${_p}(${participant}) out of ${remoteIndices}` );
          (function loop() {
            if (!$this.paused && !$this.ended) {
              // void ctx.drawImage(image, dx, dy, dWidth, dHeight);
              // void ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
              //
              //  -------------
              //  |  0  |  1  | == User0 x 2
              //  -------------
              //  |  2  |  3  | == User1 x 2
              //  -------------
              const tileX=2*3*4*5*4, tileY=2*3*4*5*4, n = remoteIndices.length;
              for (var x=0; x<n; ++x) {
                const y = _p;
                // console.log( `Drawing user${_p} at ${x} * tileX/${n} , ${y} * tileY/${n}` );
                ctx.drawImage($this, x * tileX/n, y * tileY/n, tileX/n, tileY/n ); // Make all videos same size square
              }
              setTimeout(loop, 1000 / 5); // drawing at 5fps
            } else {
              console.log( `Exiting video loop for participant ${_p} out of ${remoteIndices.length}` );
            }
           })();
        }, 0);

    } else if (!ignoreAudio) {
        $('body').append(
            `<audio autoplay='1' id='${id}' />`);
    } else {
       return;   
    }
    track.attach($(`#${id}`)[0]);   
}

/**
 * That function is executed when the conference is joined
 */
function onConferenceJoined() {
    console.log('conference room joined! Adding local tracks');
    isJoined = true;
    for (let i = 0; i < localTracks.length; i++) {
        room.addTrack(localTracks[i]);
    }
}

/**
 *
 * @param id
 */
function onUserLeft(id) {
    console.log(`user left: ${id}` );
    if (!remoteTracks[id]) {
        return;
    }
    const tracks = remoteTracks[id];
    const idx = remoteIndices.indexOf(id);
    remoteIndices.splice( idx, 1 );
    for (let i = 0; i < tracks.length; i++) {
        if ( tracks[i].getType() === 'video' || !ignoreAudio ) {
           tracks[i].detach( $(`#${id}${tracks[i].getType()}`)[0] );
         
           // Cleanup html
           const vid = '#' + id + 'video' + idx;
           const video = $(vid).first();
           video.attr('src','');
           video.remove();
        }
    }
}

/**
 * That function is called when connection is established successfully
 */
function onConnectionSuccess() {
    const roomname = $('#room').val().toLowerCase();
    console.log( "Connecting to room: " + roomname );
    room = connection.initJitsiConference(roomname, confOptions);
    room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
    room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, track => {
        console.log(`track removed!!!${track}`);
    });
    room.on(
        JitsiMeetJS.events.conference.CONFERENCE_JOINED,onConferenceJoined);
    room.on(JitsiMeetJS.events.conference.USER_JOINED, id => {
        console.log(`user join: ${id}`);
        remoteTracks[id] = [];
    });
    room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
    room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => {
        console.log(`${track.getType()} - ${track.isMuted()}`);
    });
    room.on(
        JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
        (userID, displayName) => console.log(`${userID} - ${displayName}`));
    room.on(
        JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
        (userID, audioLevel) => console.log(`${userID} - ${audioLevel}`));
    room.on(
        JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED,
        () => console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`));
    room.join();
}

/**
 * This function is called when the connection fail.
 */
function onConnectionFailed(e) {
    console.error('Connection Failed!');
    console.error(e);
}

/**
 * This function is called when the connection fail.
 */
function onDeviceListChanged(devices) {
    console.info('current devices', devices);
}

/**
 * This function is called when we disconnect.
 */
function disconnect() {
    console.log('disconnect!');
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
        onConnectionSuccess);
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_FAILED,
        onConnectionFailed);
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
        disconnect);
}

/**
 *
 */
function unload() {
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].dispose();
    }
    localTracks = [];
    room.leave();
    connection.disconnect();
}

let isVideo = true;

/**
 *
 */
function switchVideo() { // eslint-disable-line no-unused-vars
    isVideo = !isVideo;
    if (localTracks[1]) {
        localTracks[1].dispose();
        localTracks.pop();
    }
    console.log( `createLocalTracks isVideo=${isVideo}` );
    JitsiMeetJS.createLocalTracks({
        devices: [ isVideo ? 'video' : 'desktop' ]
    })
        .then(tracks => {
            localTracks.push(tracks[0]);
            localTracks[1].addEventListener(
                JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
                () => console.log('local track muted'));
            localTracks[1].addEventListener(
                JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
                () => console.log('local track stopped'));
            localTracks[1].attach($('#localVideo1')[0]);
            // localTracks[1].attach($('#canvas')[0]);
            room.addTrack(localTracks[1]);
        })
        .catch(error => console.log(error));
}

/**
 *
 * @param selected
 */
function changeAudioOutput(selected) { // eslint-disable-line no-unused-vars
    JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value);
}

function sayTheWords(words) {
  
   window.speak(words);

   /* TODO send audio stream to Jitsi
   const player = document.getElementById('player');
   if (!player) { window.speak("Creating audio stream, please retry"); return; }
   JitsiMeetJS.createLocalTracks({ devices: [ 'htmlmedia' ], 
                                htmlMediaElements: [ player ] })
    .then( (ts) => {
       if (speechTrack) { 
         if (isJoined) {
             room.removeTrack( speechTrack );
         }
         speechTrack.dispose();
         speechTrack = ts[0]; 
       }
       onLocalTracks(ts);
       window.speak(words); } )
    .catch(error => {
        throw error;
    });
    */
}

$(window).bind('beforeunload', unload);
$(window).bind('unload', unload);

// JvB added
function connectToJitsi() {

const server = $('#server').val();
  
// Copied from https://beta.meet.jit.si/config.js
const options = 
 {
    hosts: {
        domain: server,

        muc: 'conference.' + server, // FIXME: use XEP-0030
        focus: 'focus.' + server,
    },
    disableSimulcast: false, // Send out multiple resolutions to support mobile clients
    resolution: 720,
    constraints: {
        video: {
            height: {
                ideal: 720,
                max: 720,
                min: 180
            },
            width: {
                ideal: 1280,
                max: 1280,
                min: 320
            }
        }
    },
    
    useStunTurn: true, // use XEP-0215 to fetch TURN servers for the JVB connection
    useTurnUdp: true,
    bosh: '//'+server+'/http-bind', // FIXME: use xep-0156 for that
    websocket: 'wss://'+server+'/xmpp-websocket', // FIXME: use xep-0156 for that
    websocketKeepAliveUrl: 'https://'+server+'/_unlock',

    // The name of client node advertised in XEP-0115 'c' stanza
    clientNode: 'http://jitsi.org/jitsi-at-scale-audience-video',
  
    enableP2P: false, // flag to control P2P connections
    startWithAudioMuted: true, // We don't send audio
  
    channelLastN: 20, // The default value of the channel attribute last-n.
    lastNLimits: {
        5: 20,
        30: 15,
        50: 10,
        70: 5,
        90: 2,
        800: 1 // JvB: Added for Jitsi@scale
    },
};
  
JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.DEBUG);
const initOptions = {
    disableAudioLevels: true
};

JitsiMeetJS.init(initOptions);

connection = new JitsiMeetJS.JitsiConnection(null, null, options);

connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
    onConnectionSuccess);
connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_FAILED,
    onConnectionFailed);
connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
    disconnect);

JitsiMeetJS.mediaDevices.addEventListener(
    JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
    onDeviceListChanged);

connection.connect();

// JvB: Changed ['audio','video'] to new 'htmlmedia' extension
JitsiMeetJS.createLocalTracks({ devices: [ 'htmlmedia' ], 
                                htmlMediaElements: [ document.querySelector('canvas') ],
                                htmlMediaFrameRate: 1 })  // Low for testing
    .then(onLocalTracks)
    .catch(error => {
        throw error;
    });

if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
    JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
        const audioOutputDevices
            = devices.filter(d => d.kind === 'audiooutput');

        if (audioOutputDevices.length > 1) {
            $('#audioOutputSelect').html(
                audioOutputDevices
                    .map(
                        d =>
                            `<option value="${d.deviceId}">${d.label}</option>`)
                    .join('\n'));

            $('#audioOutputSelectWrapper').show();
        }
    });
}
    
} // JvB end connectToJitsi
