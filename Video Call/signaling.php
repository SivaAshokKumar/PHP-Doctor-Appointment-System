<?php
// Set appropriate headers for WebSocket-like communication
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Store signaling state for each peer
$signalingState = [];

// Handle signaling messages
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if ($data && isset($data['type'], $data['peerId'])) {
        $peerId = $data['peerId'];
        switch ($data['type']) {
            case 'offer':
            case 'answer':
            case 'candidate':
                // Store signaling messages for each peer
                if (!isset($signalingState[$peerId])) {
                    $signalingState[$peerId] = [];
                }
                $signalingState[$peerId][] = $data;
                relaySignalingMessages($peerId);
                break;
            default:
                // Invalid message type
                http_response_code(400);
                echo json_encode(['error' => 'Invalid message type']);
                exit;
        }
    } else {
        // Invalid request format
        http_response_code(400);
        echo json_encode(['error' => 'Invalid request format']);
        exit;
    }
}

// Relay signaling messages to the other peer
function relaySignalingMessages($peerId) {
    global $signalingState;
    $otherPeerId = $peerId === 'peer1' ? 'peer2' : 'peer1';
    if (isset($signalingState[$otherPeerId])) {
        foreach ($signalingState[$otherPeerId] as $message) {
            sendSignalingMessage($peerId, $message);
        }
        // Clear signaling messages after relaying
        unset($signalingState[$otherPeerId]);
    }
}

// Send signaling messages back to the client (JavaScript)
function sendSignalingMessage($peerId, $message) {
    echo json_encode(['peerId' => $peerId, 'message' => $message]);
}
?>
