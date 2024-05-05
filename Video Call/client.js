const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
let peerConnection;
let isInitiator = false;

// Get access to the user's camera and microphone
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localVideo.srcObject = stream;
        createPeerConnection(stream);
    })
    .catch(error => {
        console.error('Error accessing media devices:', error);
    });

// Create a peer connection and set up event handlers
function createPeerConnection(stream) {
    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    peerConnection = new RTCPeerConnection(configuration);

    // Add local stream to the peer connection
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    // Set up event handlers for signaling
    peerConnection.onicecandidate = handleICECandidate;
    peerConnection.ontrack = handleTrackEvent;
    peerConnection.onnegotiationneeded = handleNegotiationNeeded;

    // Determine if this peer is the initiator (offerer)
    isInitiator = location.hash === '#init';
    if (isInitiator) {
        initiateCall();
    }
}

// Handle ICE candidate events
function handleICECandidate(event) {
    if (event.candidate) {
        // Send ICE candidate to the other peer via the signaling server
        sendSignalingMessage({ type: 'candidate', candidate: event.candidate });
    }
}

// Handle incoming media streams
function handleTrackEvent(event) {
    if (event.streams && event.streams[0]) {
        remoteVideo.srcObject = event.streams[0];
    }
}

// Handle negotiation needed event
async function handleNegotiationNeeded() {
    try {
        if (isInitiator) {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            sendSignalingMessage({ type: 'offer', offer: offer });
        }
    } catch (error) {
        console.error('Error creating offer:', error);
    }
}

// Send signaling messages to the PHP signaling server
function sendSignalingMessage(message) {
    fetch('signaling.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    })
    .then(response => {
        if (!response.ok) {
            console.error('Failed to send signaling message:', response.statusText);
        }
    })
    .catch(error => {
        console.error('Error sending signaling message:', error);
    });
}

// Initiate a call (for the initiator peer)
async function initiateCall() {
    try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        sendSignalingMessage({ type: 'offer', offer: offer });
    } catch (error) {
        console.error('Error creating offer:', error);
    }
}

// Clean up resources on page unload or when ending the call
window.onunload = window.onbeforeunload = () => {
    if (peerConnection) {
        peerConnection.close();
    }
};
