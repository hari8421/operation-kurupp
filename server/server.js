// Operation Kurup: The Great Kerala Manhunt
// Zero-dependency HTTP + RFC 6455 WebSocket Real-time Multiplayer Server
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

process.on('uncaughtException', (err) => {
  console.error('[SERVER EXCEPTION]', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[SERVER REJECTION]', reason);
});

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

// ==========================================
// HTTP Static File Server
// ==========================================
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let filePath = parsedUrl.pathname;
  if (filePath === '/') filePath = '/index.html';

  const fullPath = path.join(PUBLIC_DIR, filePath);

  // Security: prevent directory traversal
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Access denied');
    return;
  }

  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      if (filePath === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', rooms: Object.keys(rooms).length }));
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(fullPath).pipe(res);
  });
});

// ==========================================
// RFC 6455 WebSocket Implementation
// ==========================================
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function computeAcceptKey(clientKey) {
  return crypto.createHash('sha1')
    .update(clientKey + WS_GUID)
    .digest('base64');
}

function encodeWsFrame(data) {
  const payload = Buffer.from(typeof data === 'string' ? data : JSON.stringify(data));
  const length = payload.length;

  let header;
  if (length < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81; // FIN + text frame
    header[1] = length;
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }

  return Buffer.concat([header, payload]);
}

function parseWsFrames(buffer, onMessage) {
  let offset = 0;
  while (offset + 2 <= buffer.length) {
    const firstByte = buffer[offset];
    const secondByte = buffer[offset + 1];
    const opcode = firstByte & 0x0f;
    const isMasked = (secondByte & 0x80) !== 0;
    let payloadLen = secondByte & 0x7f;
    let headerLen = 2;

    if (payloadLen === 126) {
      if (offset + 4 > buffer.length) break;
      payloadLen = buffer.readUInt16BE(offset + 2);
      headerLen = 4;
    } else if (payloadLen === 127) {
      if (offset + 10 > buffer.length) break;
      payloadLen = Number(buffer.readBigUInt64BE(offset + 2));
      headerLen = 10;
    }

    const maskOffset = offset + headerLen;
    const dataOffset = maskOffset + (isMasked ? 4 : 0);
    const totalFrameLen = dataOffset + payloadLen - offset;

    if (buffer.length < offset + totalFrameLen) break; // Incomplete frame

    let payload = buffer.slice(dataOffset, dataOffset + payloadLen);
    if (isMasked) {
      const mask = buffer.slice(maskOffset, maskOffset + 4);
      const unmasked = Buffer.alloc(payloadLen);
      for (let i = 0; i < payloadLen; i++) {
        unmasked[i] = payload[i] ^ mask[i % 4];
      }
      payload = unmasked;
    }

    if (opcode === 0x08) {
      // Close frame
      return { closed: true, remaining: Buffer.alloc(0) };
    } else if (opcode === 0x01) {
      // Text frame
      try {
        const msgStr = payload.toString('utf8');
        onMessage(msgStr);
      } catch (e) {
        console.error('Frame decode error:', e.message);
      }
    }

    offset += totalFrameLen;
  }

  return { closed: false, remaining: buffer.slice(offset) };
}

// ==========================================
// Multiplayer Game State & Room Orchestrator
// ==========================================
const rooms = {};

const WORLD_WIDTH = 3600;
const WORLD_HEIGHT = 2800;

const LANDMARKS = [
  { id: 'crime_scene', name: 'Mavelikkara Burning Car Scene', x: 500, y: 700, type: 'crime_scene' },
  { id: 'alappuzha_backwaters', name: 'Alappuzha Backwaters & Jetty', x: 450, y: 1400, type: 'water' },
  { id: 'kallu_shaap', name: 'Karimpinkala Toddy Shop (കള്ളു ഷാപ്പ്)', x: 950, y: 950, type: 'toddy_shop' },
  { id: 'central_junction', name: 'National Chayakada & Bus Stand', x: 1800, y: 1300, type: 'town' },
  { id: 'red_party_office', name: 'LDF Red Star Party Office', x: 1600, y: 1100, type: 'party_office' },
  { id: 'congress_office', name: 'UDF Tricolor Party Office', x: 2050, y: 1150, type: 'party_office' },
  { id: 'apsara_theater', name: 'Apsara Retro Talkies Cinema', x: 1950, y: 1550, type: 'cinema' },
  { id: 'munnar_estate', name: 'Munnar Tea Estate & Bungalow', x: 3000, y: 600, type: 'plantation' },
  { id: 'border_checkpost', name: 'Aryankavu Border Checkpost', x: 3300, y: 2400, type: 'border' }
];

function createDefaultVehicles(era = '1984') {
  const vehicles = [];
  let id = 1;

  if (era === '1984') {
    vehicles.push({
      id: `veh_${id++}`,
      type: 'ambassador_police',
      name: 'HM Ambassador Mark 3 (Police Squad)',
      x: 1700, y: 1350, angle: 0, speed: 0, maxSpeed: 6.2,
      driverId: null, color: '#f8f9fa', beacon: true, horn: 'siren'
    });
    vehicles.push({
      id: `veh_${id++}`,
      type: 'ambassador_taxi',
      name: 'HM Ambassador Taxi',
      x: 1850, y: 1400, angle: 1.5, speed: 0, maxSpeed: 5.8,
      driverId: null, color: '#212529', roofColor: '#f1c40f', horn: 'honk'
    });
    vehicles.push({
      id: `veh_${id++}`,
      type: 'bullet350',
      name: 'Royal Enfield Bullet 350 (Heavy Cast Iron)',
      x: 1650, y: 1250, angle: 0.5, speed: 0, maxSpeed: 7.4,
      driverId: null, color: '#1a1a1a', horn: 'thump'
    });
    vehicles.push({
      id: `veh_${id++}`,
      type: 'chetak',
      name: 'Bajaj Chetak 150 Scooter',
      x: 1900, y: 1200, angle: 3.14, speed: 0, maxSpeed: 5.2,
      driverId: null, color: '#27ae60', horn: 'peep'
    });
    vehicles.push({
      id: `veh_${id++}`,
      type: 'ksrtc_bus',
      name: 'KSRTC "Aana Vandi" Vintage Fast Passenger',
      x: 1750, y: 1550, angle: 0, speed: 0, maxSpeed: 4.8,
      driverId: null, color: '#c0392b', stripeColor: '#f39c12', horn: 'ksrtc'
    });
    vehicles.push({
      id: `veh_${id++}`,
      type: 'kettuvallam',
      name: 'Alappuzha Country Boat (വള്ളം)',
      x: 500, y: 1500, angle: 1.2, speed: 0, maxSpeed: 4.2,
      driverId: null, isWater: true, color: '#5d4037', horn: 'water'
    });
  } else if (era === '1990s') {
    vehicles.push({
      id: `veh_${id++}`,
      type: 'contessa',
      name: 'HM Contessa Classic (Gulf Tycoon)',
      x: 1800, y: 1350, angle: 0, speed: 0, maxSpeed: 7.8,
      driverId: null, color: '#7f1d1d', horn: 'honk'
    });
    vehicles.push({
      id: `veh_${id++}`,
      type: 'padmini',
      name: 'Premier Padmini 118NE',
      x: 1880, y: 1250, angle: 1.8, speed: 0, maxSpeed: 6.0,
      driverId: null, color: '#1e3a8a', horn: 'peep'
    });
    vehicles.push({
      id: `veh_${id++}`,
      type: 'yamaha_rx100',
      name: 'Yamaha RX 100 (2-Stroke Fury)',
      x: 1650, y: 1300, angle: 0.2, speed: 0, maxSpeed: 8.2,
      driverId: null, color: '#b91c1c', horn: 'rev'
    });
    vehicles.push({
      id: `veh_${id++}`,
      type: 'tata_sumo',
      name: 'Tata Sumo High-Range 4x4',
      x: 2900, y: 650, angle: 3.1, speed: 0, maxSpeed: 6.5,
      driverId: null, color: '#f3f4f6', horn: 'honk'
    });
    vehicles.push({
      id: `veh_${id++}`,
      type: 'ksrtc_bus',
      name: 'KSRTC Super Express Bus',
      x: 1750, y: 1550, angle: 0, speed: 0, maxSpeed: 5.2,
      driverId: null, color: '#c0392b', stripeColor: '#f1c40f', horn: 'ksrtc'
    });
  } else {
    vehicles.push({
      id: `veh_${id++}`,
      type: 'bolero_police',
      name: 'Mahindra Bolero Police Interceptor',
      x: 1700, y: 1350, angle: 0, speed: 0, maxSpeed: 7.2,
      driverId: null, color: '#ffffff', beacon: true, horn: 'siren'
    });
    vehicles.push({
      id: `veh_${id++}`,
      type: 'auto_rickshaw',
      name: 'Kerala 3-Wheeler Autorickshaw',
      x: 1820, y: 1300, angle: 2.1, speed: 0, maxSpeed: 5.6,
      driverId: null, color: '#111827', hoodColor: '#eab308', horn: 'peep'
    });
    vehicles.push({
      id: `veh_${id++}`,
      type: 'bullet350',
      name: 'Royal Enfield Classic 350',
      x: 1650, y: 1250, angle: 0.5, speed: 0, maxSpeed: 7.5,
      driverId: null, color: '#1f2937', horn: 'thump'
    });
  }

  return vehicles;
}

function createRoom(roomId, era = '1984') {
  return {
    id: roomId,
    era: era,
    createdAt: Date.now(),
    weather: 'monsoon',
    rainIntensity: 0.8,
    dayTime: 0.35,
    harthalActive: false,
    harthalTimer: 0,
    players: {},
    vehicles: createDefaultVehicles(era),
    clues: [
      { id: 'clue_burnt_car', x: 520, y: 720, title: 'Charred Ambassador Skeleton', desc: 'Burnt car remains found in Mavelikkara paddy fields. Fake insurance papers!', found: false },
      { id: 'clue_hotel_bill', x: 960, y: 970, title: 'Toddy Shop Receipt', desc: 'A man in bell-bottoms and aviators paid with rare foreign currency.', found: false },
      { id: 'clue_estate_register', x: 3020, y: 620, title: 'Munnar Planter Logbook', desc: 'A mysterious manager going by "Mr. Joshi" checked into the estate.', found: false },
      { id: 'clue_sanyasi_cloth', x: 1980, y: 1570, title: 'Discarded Saffron Robe', desc: 'Found in the theater washroom alongside an empty bottle of foreign cologne.', found: false },
      { id: 'clue_forged_passport', x: 1810, y: 1320, title: 'Forged Travel Documents', desc: 'Stamped with exit visa for Abu Dhabi via Bombay port.', found: false }
    ],
    kurupState: {
      isAi: true,
      x: 950,
      y: 950,
      targetX: 3000,
      targetY: 600,
      disguise: 'gulf_tycoon',
      health: 100,
      suspicion: 10,
      escaped: false,
      captured: false,
      aiTimer: 0
    },
    chatLogs: [
      { sender: 'POLICE RADIO', text: 'Attention all units: Fugitive Sukumara Kurup spotted near Mavelikkara/Alappuzha border! Check all vehicles.', time: Date.now() }
    ],
    score: {
      police: 0,
      red_cadres: 0,
      tricolor_cadres: 0,
      gulf_syndicate: 0
    }
  };
}

rooms['DEFAULT'] = createRoom('DEFAULT', '1984');

function broadcastRoomState(room) {
  const payload = {
    type: 'ROOM_SYNC',
    era: room.era,
    weather: room.weather,
    rainIntensity: room.rainIntensity,
    dayTime: room.dayTime,
    harthalActive: room.harthalActive,
    players: Object.values(room.players).map(p => ({
      id: p.id,
      name: p.name || 'Player',
      faction: p.faction || 'police',
      dressStyle: p.dressStyle || 'khaki_uniform',
      disguise: p.disguise || 'default',
      x: Math.round(Number(p.x) || 0),
      y: Math.round(Number(p.y) || 0),
      angle: Number((Number(p.angle) || 0).toFixed(2)),
      speed: Number((Number(p.speed) || 0).toFixed(1)),
      vehicleId: p.vehicleId || null,
      stamina: Math.round(Number(p.stamina) || 100),
      score: p.score || 0
    })),
    vehicles: room.vehicles.map(v => ({
      id: v.id,
      type: v.type,
      name: v.name,
      x: Math.round(Number(v.x) || 0),
      y: Math.round(Number(v.y) || 0),
      angle: Number((Number(v.angle) || 0).toFixed(2)),
      speed: Number((Number(v.speed) || 0).toFixed(1)),
      driverId: v.driverId || null,
      color: v.color,
      beacon: v.beacon
    })),
    clues: room.clues,
    kurupState: {
      x: Math.round(room.kurupState.x),
      y: Math.round(room.kurupState.y),
      disguise: room.kurupState.disguise,
      captured: room.kurupState.captured,
      escaped: room.kurupState.escaped,
      isAi: room.kurupState.isAi
    },
    scores: room.score
  };

  const message = JSON.stringify(payload);
  for (const pid in room.players) {
    const player = room.players[pid];
    if (player.ws && player.ws.readyState === 'OPEN') {
      try {
        player.ws.send(message);
      } catch (err) {}
    }
  }
}

function updateKurupAi(room, dt) {
  const k = room.kurupState;
  if (!k.isAi || k.captured || k.escaped) return;

  k.aiTimer += dt;

  if (k.aiTimer > 25) {
    k.aiTimer = 0;
    const disguises = ['gulf_tycoon', 'sanyasi', 'toddy_tapper', 'police_si'];
    k.disguise = disguises[Math.floor(Math.random() * disguises.length)];
    
    const spots = [
      { x: 950, y: 950 },
      { x: 3000, y: 600 },
      { x: 1950, y: 1550 },
      { x: 500, y: 1500 },
      { x: 3300, y: 2400 }
    ];
    const target = spots[Math.floor(Math.random() * spots.length)];
    k.targetX = target.x;
    k.targetY = target.y;

    room.chatLogs.push({
      sender: 'NEWS BULLETIN',
      text: `Gossip at Chayakada: Sukumara Kurup spotted disguised as a ${k.disguise.replace('_', ' ')} heading toward a new hideout!`,
      time: Date.now()
    });
  }

  const dx = k.targetX - k.x;
  const dy = k.targetY - k.y;
  const dist = Math.hypot(dx, dy);

  if (dist > 20) {
    const moveSpeed = (room.harthalActive ? 0.7 : 2.2);
    k.x += (dx / dist) * moveSpeed;
    k.y += (dy / dist) * moveSpeed;
  } else {
    if (Math.hypot(k.x - 3300, k.y - 2400) < 60) {
      k.escaped = true;
      room.chatLogs.push({
        sender: 'BREAKING NEWS',
        text: 'ALERT: Sukumara Kurup has slipped past the Aryankavu border checkpost and fled Kerala!',
        time: Date.now()
      });
    }
  }

  for (const pid in room.players) {
    const p = room.players[pid];
    const playerDist = Math.hypot(p.x - k.x, p.y - k.y);
    if (playerDist < 45 && !k.captured && !k.escaped) {
      k.captured = true;
      p.score += 500;
      if (p.faction === 'police') room.score.police += 500;
      else if (p.faction === 'red_cadre') room.score.red_cadres += 500;
      else if (p.faction === 'tricolor_cadre') room.score.tricolor_cadres += 500;
      else if (p.faction === 'gulf_syndicate') room.score.gulf_syndicate += 500;

      room.chatLogs.push({
        sender: 'VICTORY BANNER',
        text: `★ HEROIC CAPTURE: ${p.name} (${p.faction.toUpperCase()}) has apprehended Sukumara Kurup!`,
        time: Date.now()
      });
      break;
    }
  }
}

setInterval(() => {
  const dt = 1 / 30;

  for (const roomId in rooms) {
    const room = rooms[roomId];
    room.dayTime = (room.dayTime + 0.0003) % 1;

    if (room.harthalActive) {
      room.harthalTimer -= dt;
      if (room.harthalTimer <= 0) {
        room.harthalActive = false;
        room.chatLogs.push({
          sender: 'RADIO KERALA',
          text: 'The 24-hour Harthal has concluded. Traffic resumes normally across all junctions.',
          time: Date.now()
        });
      }
    }

    updateKurupAi(room, dt);

    for (const v of room.vehicles) {
      if (v.driverId && room.players[v.driverId]) {
        const driver = room.players[v.driverId];
        v.x = driver.x;
        v.y = driver.y;
        v.angle = driver.angle;
        v.speed = driver.speed;
      } else {
        if (Math.abs(v.speed) > 0.1) {
          v.speed *= 0.92;
          v.x += Math.cos(v.angle) * v.speed;
          v.y += Math.sin(v.angle) * v.speed;
        } else {
          v.speed = 0;
        }
      }
    }

    broadcastRoomState(room);
  }
}, 1000 / 30);

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  const acceptKey = computeAcceptKey(key);
  const responseHeaders = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`
  ];

  socket.write(responseHeaders.join('\r\n') + '\r\n\r\n');

  const client = {
    id: 'plr_' + Math.random().toString(36).substr(2, 9),
    socket: socket,
    readyState: 'OPEN',
    send: function(data) {
      if (this.readyState === 'OPEN' && !socket.destroyed) {
        socket.write(encodeWsFrame(data));
      }
    }
  };

  let currentRoomId = 'DEFAULT';
  let playerObj = null;
  let buffer = Buffer.alloc(0);

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    const res = parseWsFrames(buffer, (msgStr) => {
      handleClientMessage(client, msgStr, (newRoomId, newPlayer) => {
        currentRoomId = newRoomId;
        playerObj = newPlayer;
      });
    });

    if (res.closed) {
      cleanupClient();
    } else {
      buffer = res.remaining;
    }
  });

  socket.on('error', () => cleanupClient());
  socket.on('close', () => cleanupClient());
  socket.on('end', () => cleanupClient());

  function cleanupClient() {
    client.readyState = 'CLOSED';
    if (rooms[currentRoomId] && rooms[currentRoomId].players[client.id]) {
      const p = rooms[currentRoomId].players[client.id];
      if (p.vehicleId) {
        const v = rooms[currentRoomId].vehicles.find(veh => veh.id === p.vehicleId);
        if (v) v.driverId = null;
      }
      delete rooms[currentRoomId].players[client.id];
      broadcastRoomState(rooms[currentRoomId]);
    }
  }
});

function handleClientMessage(client, messageStr, setRoomContext) {
  let msg;
  try {
    msg = JSON.parse(messageStr);
  } catch (e) {
    return;
  }

  const roomId = msg.roomId || 'DEFAULT';
  if (!rooms[roomId]) {
    rooms[roomId] = createRoom(roomId, msg.era || '1984');
  }
  const room = rooms[roomId];

  switch (msg.type) {
    case 'JOIN_GAME': {
      const spawnX = 1750 + (Math.random() * 100 - 50);
      const spawnY = 1350 + (Math.random() * 100 - 50);

      const player = {
        id: client.id,
        ws: client,
        name: msg.name || 'Comrade ' + client.id.slice(-4),
        faction: msg.faction || 'police',
        dressStyle: msg.dressStyle || 'khaki_uniform',
        disguise: msg.disguise || 'default',
        x: spawnX,
        y: spawnY,
        angle: 0,
        speed: 0,
        stamina: 100,
        vehicleId: null,
        score: 0
      };

      if (player.faction === 'kurup') {
        room.kurupState.isAi = false;
        room.kurupState.x = spawnX;
        room.kurupState.y = spawnY;
      }

      room.players[client.id] = player;
      setRoomContext(roomId, player);

      client.send(JSON.stringify({
        type: 'WELCOME',
        playerId: client.id,
        roomId: roomId,
        era: room.era,
        landmarks: LANDMARKS,
        worldBounds: { width: WORLD_WIDTH, height: WORLD_HEIGHT }
      }));

      room.chatLogs.push({
        sender: 'ANNOUNCER',
        text: `${player.name} joined as ${player.faction.toUpperCase()} [${player.dressStyle.replace('_', ' ')}]`,
        time: Date.now()
      });
      break;
    }

    case 'PLAYER_INPUT': {
      const p = room.players[client.id];
      if (!p) return;

      if (typeof msg.x === 'number' && !isNaN(msg.x)) p.x = Math.max(50, Math.min(WORLD_WIDTH - 50, msg.x));
      if (typeof msg.y === 'number' && !isNaN(msg.y)) p.y = Math.max(50, Math.min(WORLD_HEIGHT - 50, msg.y));
      if (typeof msg.angle === 'number' && !isNaN(msg.angle)) p.angle = msg.angle;
      if (typeof msg.speed === 'number' && !isNaN(msg.speed)) p.speed = msg.speed;
      if (typeof msg.stamina === 'number' && !isNaN(msg.stamina)) p.stamina = msg.stamina;

      // Sync vehicle if player is driving
      if (p.vehicleId) {
        const v = room.vehicles.find(veh => veh.id === p.vehicleId);
        if (v) {
          v.x = p.x;
          v.y = p.y;
          v.angle = p.angle;
          v.speed = p.speed;
          v.driverId = client.id;
        }
      }

      if (p.faction === 'kurup') {
        room.kurupState.x = p.x;
        room.kurupState.y = p.y;
      }
      break;
    }

    case 'ENTER_VEHICLE': {
      const p = room.players[client.id];
      if (!p) return;

      const vehicle = room.vehicles.find(v => v.id === msg.vehicleId);
      if (vehicle) {
        if (p.vehicleId) {
          const oldV = room.vehicles.find(v => v.id === p.vehicleId);
          if (oldV) oldV.driverId = null;
        }

        vehicle.driverId = client.id;
        p.vehicleId = vehicle.id;
        p.x = vehicle.x;
        p.y = vehicle.y;
        p.angle = vehicle.angle;

        client.send(JSON.stringify({
          type: 'VEHICLE_BOARDED',
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          maxSpeed: vehicle.maxSpeed,
          hornSound: vehicle.horn
        }));
      }
      break;
    }

    case 'EXIT_VEHICLE': {
      const p = room.players[client.id];
      if (!p) return;

      const vId = msg.vehicleId || p.vehicleId;
      if (vId) {
        const vehicle = room.vehicles.find(v => v.id === vId);
        if (vehicle) {
          vehicle.driverId = null;
          vehicle.speed = 0;
        }
      }
      p.vehicleId = null;

      client.send(JSON.stringify({
        type: 'VEHICLE_EXITED'
      }));
      break;
    }

    case 'USE_ABILITY': {
      const p = room.players[client.id];
      if (!p) return;

      const ability = msg.ability;

      if (ability === 'harthal' && (p.faction === 'red_cadre' || p.faction === 'tricolor_cadre')) {
        room.harthalActive = true;
        room.harthalTimer = 15;
        p.score += 50;

        room.chatLogs.push({
          sender: 'MEGA-HARTHAL',
          text: `🚨 ${p.name} called an all-Kerala Harthal! All vehicles must halt!`,
          time: Date.now()
        });
      } else if (ability === 'nakabandi' && p.faction === 'police') {
        p.score += 75;
        room.chatLogs.push({
          sender: 'CRIME BRANCH',
          text: `🚓 DYSP Haridas & ${p.name} erected Nakabandi barricades on all highways!`,
          time: Date.now()
        });
      } else if (ability === 'disguise_shift' && p.faction === 'kurup') {
        const disguises = ['gulf_tycoon', 'sanyasi', 'toddy_tapper', 'police_si'];
        p.disguise = disguises[(disguises.indexOf(p.disguise) + 1) % disguises.length];
        room.kurupState.disguise = p.disguise;
        p.score += 100;

        client.send(JSON.stringify({
          type: 'DISGUISE_CHANGED',
          disguise: p.disguise
        }));
      }
      break;
    }

    case 'CLUE_DISCOVERED': {
      const p = room.players[client.id];
      if (!p) return;

      const clue = room.clues.find(c => c.id === msg.clueId);
      if (clue && !clue.found) {
        clue.found = true;
        p.score += 150;
        if (p.faction === 'police') room.score.police += 150;
        else if (p.faction === 'red_cadre') room.score.red_cadres += 150;
        else if (p.faction === 'tricolor_cadre') room.score.tricolor_cadres += 150;

        room.chatLogs.push({
          sender: 'FORENSIC FIND',
          text: `🔎 Clue unraveled by ${p.name}: [${clue.title}] - ${clue.desc}`,
          time: Date.now()
        });
      }
      break;
    }

    case 'CHAT_MESSAGE': {
      const p = room.players[client.id];
      if (!p) return;

      room.chatLogs.push({
        sender: p.name,
        faction: p.faction,
        text: String(msg.text).slice(0, 140),
        time: Date.now()
      });
      if (room.chatLogs.length > 50) room.chatLogs.shift();
      break;
    }

    case 'CHANGE_ERA': {
      if (['1984', '1990s', '2000s'].includes(msg.era)) {
        room.era = msg.era;
        room.vehicles = createDefaultVehicles(msg.era);
        room.chatLogs.push({
          sender: 'TIME WARP',
          text: `Era shifted to ${msg.era}! Vehicles and retro environments reconfigured.`,
          time: Date.now()
        });
      }
      break;
    }
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🌴 OPERATION KURUP: THE GREAT KERALA MANHUNT 🌴`);
  console.log(`Server live on http://localhost:${PORT}`);
  console.log(`WebSocket ready for cross-platform multiplayer!`);
  console.log(`=======================================================`);
});
