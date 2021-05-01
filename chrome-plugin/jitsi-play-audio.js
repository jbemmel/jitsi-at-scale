/* global $, JitsiMeetJS */
// Taken from https://raw.githubusercontent.com/jbemmel/lib-jitsi-meet/master/doc/example/example.js

// Copied from https://beta.meet.jit.si/config.js
const options = 
 {
    hosts: {
        domain: 'beta.meet.jit.si',

        muc: 'conference.beta.meet.jit.si', // FIXME: use XEP-0030
        focus: 'focus.beta.meet.jit.si',
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
    bosh: '//beta.meet.jit.si/http-bind', // FIXME: use xep-0156 for that
    websocket: 'wss://beta.meet.jit.si/xmpp-websocket', // FIXME: use xep-0156 for that
    websocketKeepAliveUrl: 'https://beta.meet.jit.si/_unlock',

    // The name of client node advertised in XEP-0115 'c' stanza
    clientNode: 'http://jitsi.org/jitsi-at-scale-agg',
  
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

const confOptions = {
    openBridgeChannel: true
};

let connection = null;
let isJoined = false;
let room = null;

// JvB added
function connectToJitsiRoom() {
console.log( "Connecting to Jitsi room..." );

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

// JvB: Changed ['audio','video'] to new 'canvas' extension
JitsiMeetJS.createLocalTracks({ devices: [ 'canvas' ], 
                                canvasObject: document.querySelector('canvas'),
                                canvasFrameRate: 10 })
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

} // JvB end connectToJitsiRoom