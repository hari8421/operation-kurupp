// Automated Verification Test for Operation Kurup Server & Multiplayer WebSocket
const http = require('http');
const crypto = require('crypto');

console.log('Testing Operation Kurup Server & Endpoints...');

// 1. Test HTTP Server
function testHttp() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/', (res) => {
      console.log(`[HTTP GET /] Status: ${res.statusCode}, Content-Type: ${res.headers['content-type']}`);
      if (res.statusCode === 200) {
        resolve();
      } else {
        reject(new Error(`Unexpected status: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

// 2. Test WebSocket Handshake & Protocol
function testWebSocket() {
  return new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString('base64');
    const req = http.request({
      port: 3000,
      host: 'localhost',
      headers: {
        'Connection': 'Upgrade',
        'Upgrade': 'websocket',
        'Sec-WebSocket-Key': key,
        'Sec-WebSocket-Version': '13'
      }
    });

    req.on('upgrade', (res, socket) => {
      console.log(`[WebSocket] Upgrade handshake successful! Status: ${res.statusCode}`);

      // Helper to encode client masked text frame
      function sendFrame(text) {
        const payload = Buffer.from(text);
        const mask = crypto.randomBytes(4);
        const header = Buffer.alloc(6);
        header[0] = 0x81; // FIN + text
        header[1] = 0x80 | payload.length; // Masked + len
        mask.copy(header, 2);

        const masked = Buffer.alloc(payload.length);
        for (let i = 0; i < payload.length; i++) {
          masked[i] = payload[i] ^ mask[i % 4];
        }
        socket.write(Buffer.concat([header, masked]));
      }

      let welcomed = false;
      let syncReceived = false;

      socket.on('data', (chunk) => {
        // Find text payload from server unmasked frame
        if (chunk.length >= 2) {
          const len = chunk[1] & 0x7f;
          let payload;
          if (len < 126) payload = chunk.slice(2, 2 + len);
          else if (len === 126) payload = chunk.slice(4, 4 + chunk.readUInt16BE(2));

          if (payload) {
            try {
              const msg = JSON.parse(payload.toString('utf8'));
              if (msg.type === 'WELCOME') {
                console.log(`[WebSocket] Received WELCOME! Player ID: ${msg.playerId}, Era: ${msg.era}`);
                welcomed = true;

                // Test player action: enter vehicle and discover clue
                sendFrame(JSON.stringify({
                  type: 'ENTER_VEHICLE',
                  vehicleId: 'veh_1'
                }));

                sendFrame(JSON.stringify({
                  type: 'USE_ABILITY',
                  ability: 'harthal'
                }));
              } else if (msg.type === 'ROOM_SYNC') {
                if (!syncReceived) {
                  console.log(`[WebSocket] Received ROOM_SYNC! Vehicles: ${msg.vehicles.length}, Clues: ${msg.clues.length}, Kurup: (${msg.kurupState.x}, ${msg.kurupState.y})`);
                  syncReceived = true;
                  socket.end();
                  resolve();
                }
              }
            } catch (err) {
              // Fragmented frame in test
            }
          }
        }
      });

      // Join game
      sendFrame(JSON.stringify({
        type: 'JOIN_GAME',
        roomId: 'DEFAULT',
        name: 'Test Officer DYSP',
        faction: 'police',
        dressStyle: 'khaki_uniform'
      }));
    });

    req.on('error', reject);
    req.end();
  });
}

async function runVerification() {
  try {
    await testHttp();
    await testWebSocket();
    console.log('✅ ALL VERIFICATION CHECKS PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  }
}

runVerification();
