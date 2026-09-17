// Operation Kurup: Core Game Loop, Input Controller & Client Sync

// ============================================
// POLYFILL: CanvasRenderingContext2D.roundRect
// Ensures compatibility with ALL browsers/WebViews
// ============================================
if (typeof CanvasRenderingContext2D !== 'undefined' &&
    !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    if (!radii) radii = 0;
    let tl, tr, br, bl;
    if (typeof radii === 'number') {
      tl = tr = br = bl = radii;
    } else if (Array.isArray(radii)) {
      tl = radii[0] || 0;
      tr = radii[1] || 0;
      br = radii[2] || 0;
      bl = radii[3] || 0;
    } else {
      tl = tr = br = bl = 0;
    }
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y);
    this.arcTo(x + w, y, x + w, y + tr, tr);
    this.lineTo(x + w, y + h - br);
    this.arcTo(x + w, y + h, x + w - br, y + h, br);
    this.lineTo(x + bl, y + h);
    this.arcTo(x, y + h, x, y + h - bl, bl);
    this.lineTo(x, y + tl);
    this.arcTo(x, y, x + tl, y, tl);
    this.closePath();
    return this;
  };
}

class KurupGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.minimapCanvas = document.getElementById('minimapCanvas');

    // Local player state
    this.player = {
      id: 'local_player',
      name: 'DYSP Haridas',
      faction: 'police',
      dressStyle: 'khaki_uniform',
      disguise: 'default',
      x: 1750,
      y: 1350,
      angle: 0,
      speed: 0,
      stamina: 100,
      vehicleId: null,
      score: 0
    };

    this.viewport = { x: 0, y: 0, width: 800, height: 600 };
    this.keys = {};
    this.touchVector = { x: 0, y: 0, active: false, mag: 0 };
    this.isSprinting = false;

    // World state (initialized with offline defaults immediately)
    this.era = '1984';
    this.weather = 'monsoon';
    this.rainIntensity = 0.75;
    this.dayTime = 0.35;
    this.harthalActive = false;
    this.players = {};
    this.vehicles = this.getDefaultVehicles('1984');
    this.clues = this.getDefaultClues();
    this.kurupState = { x: 950, y: 950, disguise: 'gulf_tycoon', captured: false, escaped: false };
    this.scores = { police: 0, red_cadres: 0, tricolor_cadres: 0, gulf_syndicate: 0 };

    // Rain particles
    this.rainDrops = [];
    this.lightningAlpha = 0;

    // ── PARTICLES (skid marks, dust, speed lines) ──
    this.particles = [];       // { x,y, vx,vy, life, maxLife, r, color, type }
    this.skidMarks = [];       // { x,y, angle, alpha, width } — persistent trails
    this.screenShake = { x: 0, y: 0, trauma: 0 }; // screen-space camera shake

    // ── NPC PEDESTRIANS ──
    this.npcs = [];
    this.initNpcs();

    // ── WANTED / PURSUIT SYSTEM ──
    // wantedLevel 0-5 stars; increases when player rams things at speed
    this.wantedLevel    = 0;
    this.wantedTimer    = 0;   // countdown to cool down
    this.pursuitActive  = false;
    this.pursuitCooldown = 0;

    // WebSocket
    this.ws = null;
    this.connected = false;
    this.lastInputSendTime = 0;

    this.initCanvas();
    this.initInputs();
    this.initRain();
    this.initNetwork();

    // Start loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  getDefaultVehicles(era = '1984') {
    let id = 1;
    const vehicles = [];
    if (era === '1984') {
      vehicles.push({
        id: `veh_${id++}`,
        type: 'ambassador_police',
        name: 'HM Ambassador Mark 3 (Police Squad)',
        x: 1700, y: 1350, angle: 0, speed: 0, maxSpeed: 6.8,
        driverId: null, color: '#f8f9fa', beacon: true, horn: 'siren'
      });
      vehicles.push({
        id: `veh_${id++}`,
        type: 'ambassador_taxi',
        name: 'HM Ambassador Taxi',
        x: 1850, y: 1400, angle: 1.5, speed: 0, maxSpeed: 6.2,
        driverId: null, color: '#212529', roofColor: '#f1c40f', horn: 'honk'
      });
      vehicles.push({
        id: `veh_${id++}`,
        type: 'bullet350',
        name: 'Royal Enfield Bullet 350 (Heavy Cast Iron)',
        x: 1650, y: 1250, angle: 0.5, speed: 0, maxSpeed: 7.8,
        driverId: null, color: '#1a1a1a', horn: 'thump'
      });
      vehicles.push({
        id: `veh_${id++}`,
        type: 'chetak',
        name: 'Bajaj Chetak 150 Scooter',
        x: 1900, y: 1200, angle: 3.14, speed: 0, maxSpeed: 5.4,
        driverId: null, color: '#27ae60', horn: 'peep'
      });
      vehicles.push({
        id: `veh_${id++}`,
        type: 'ksrtc_bus',
        name: 'KSRTC "Aana Vandi" Vintage Fast Passenger',
        x: 1750, y: 1550, angle: 0, speed: 0, maxSpeed: 5.2,
        driverId: null, color: '#c0392b', stripeColor: '#f39c12', horn: 'ksrtc'
      });
      vehicles.push({
        id: `veh_${id++}`,
        type: 'kettuvallam',
        name: 'Alappuzha Country Boat (വള്ളം)',
        x: 500, y: 1500, angle: 1.2, speed: 0, maxSpeed: 4.4,
        driverId: null, isWater: true, color: '#5d4037', horn: 'water'
      });
    } else if (era === '1990s') {
      vehicles.push({
        id: `veh_${id++}`,
        type: 'contessa',
        name: 'HM Contessa Classic (Gulf Tycoon)',
        x: 1800, y: 1350, angle: 0, speed: 0, maxSpeed: 8.2,
        driverId: null, color: '#7f1d1d', horn: 'honk'
      });
      vehicles.push({
        id: `veh_${id++}`,
        type: 'padmini',
        name: 'Premier Padmini 118NE',
        x: 1880, y: 1250, angle: 1.8, speed: 0, maxSpeed: 6.4,
        driverId: null, color: '#1e3a8a', horn: 'peep'
      });
      vehicles.push({
        id: `veh_${id++}`,
        type: 'yamaha_rx100',
        name: 'Yamaha RX 100 (2-Stroke Fury)',
        x: 1650, y: 1300, angle: 0.2, speed: 0, maxSpeed: 8.6,
        driverId: null, color: '#b91c1c', horn: 'rev'
      });
      vehicles.push({
        id: `veh_${id++}`,
        type: 'tata_sumo',
        name: 'Tata Sumo High-Range 4x4',
        x: 2900, y: 650, angle: 3.1, speed: 0, maxSpeed: 7.0,
        driverId: null, color: '#f3f4f6', horn: 'honk'
      });
      vehicles.push({
        id: `veh_${id++}`,
        type: 'ksrtc_bus',
        name: 'KSRTC Super Express Bus',
        x: 1750, y: 1550, angle: 0, speed: 0, maxSpeed: 5.6,
        driverId: null, color: '#c0392b', stripeColor: '#f1c40f', horn: 'ksrtc'
      });
    } else {
      vehicles.push({
        id: `veh_${id++}`,
        type: 'bolero_police',
        name: 'Mahindra Bolero Police Interceptor',
        x: 1700, y: 1350, angle: 0, speed: 0, maxSpeed: 7.6,
        driverId: null, color: '#ffffff', beacon: true, horn: 'siren'
      });
      vehicles.push({
        id: `veh_${id++}`,
        type: 'auto_rickshaw',
        name: 'Kerala 3-Wheeler Autorickshaw',
        x: 1820, y: 1300, angle: 2.1, speed: 0, maxSpeed: 6.0,
        driverId: null, color: '#111827', hoodColor: '#eab308', horn: 'peep'
      });
      vehicles.push({
        id: `veh_${id++}`,
        type: 'bullet350',
        name: 'Royal Enfield Classic 350',
        x: 1650, y: 1250, angle: 0.5, speed: 0, maxSpeed: 8.0,
        driverId: null, color: '#1f2937', horn: 'thump'
      });
    }
    return vehicles;
  }

  getDefaultClues() {
    return [
      { id: 'clue_burnt_car', x: 520, y: 720, title: 'Charred Ambassador Skeleton', desc: 'Burnt car remains found in Mavelikkara paddy fields. Fake insurance papers!', found: false },
      { id: 'clue_hotel_bill', x: 960, y: 970, title: 'Toddy Shop Receipt', desc: 'A man in bell-bottoms and aviators paid with rare foreign currency.', found: false },
      { id: 'clue_estate_register', x: 3020, y: 620, title: 'Munnar Planter Logbook', desc: 'A mysterious manager going by "Mr. Joshi" checked into the estate.', found: false },
      { id: 'clue_sanyasi_cloth', x: 1980, y: 1570, title: 'Discarded Saffron Robe', desc: 'Found in the theater washroom alongside an empty bottle of foreign cologne.', found: false },
      { id: 'clue_forged_passport', x: 1810, y: 1320, title: 'Forged Travel Documents', desc: 'Stamped with exit visa for Abu Dhabi via Bombay port.', found: false }
    ];
  }

  initNpcs() {
    // Spawn 18 pedestrians wandering around key landmarks
    const spawnPoints = [
      { x: 1780, y: 1290 }, { x: 1820, y: 1310 }, { x: 1760, y: 1360 },
      { x: 1850, y: 1280 }, { x: 1900, y: 1230 }, { x: 1680, y: 1330 },
      { x:  960, y:  980 }, { x:  990, y:  960 }, { x:  930, y:  945 },
      { x: 1890, y: 1250 }, { x: 1870, y: 1260 }, { x: 1910, y: 1240 },
      { x:  520, y:  730 }, { x:  540, y:  710 }, { x:  500, y:  750 },
      { x: 1640, y: 1170 }, { x: 2060, y: 1180 }, { x: 2010, y: 1560 }
    ];
    const shirtColors  = ['#ef4444','#3b82f6','#10b981','#f59e0b','#ffffff','#8b5cf6','#f97316'];
    const clothColors  = ['#f8fafc','#374151','#1f2937','#92400e','#1e3a8a'];
    spawnPoints.forEach((p, i) => {
      this.npcs.push({
        id: i,
        x: p.x + (Math.random() - 0.5) * 40,
        y: p.y + (Math.random() - 0.5) * 40,
        angle: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.8,
        wanderTimer: Math.random() * 180,
        shirtColor: shirtColors[i % shirtColors.length],
        clothColor: clothColors[i % clothColors.length],
        fleeing: false,
        fleeTimer: 0
      });
    });
  }

  initCanvas() {
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.viewport.width = this.canvas.width;
      this.viewport.height = this.canvas.height;
    };
    window.addEventListener('resize', resize);
    resize();

    // Minimap canvas
    this.minimapCanvas.width = 140;
    this.minimapCanvas.height = 110;
  }

  initRain() {
    for (let i = 0; i < 120; i++) {
      this.rainDrops.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        length: 12 + Math.random() * 16,
        speed: 14 + Math.random() * 8
      });
    }
  }

  // ==========================================
  // INPUT CONTROLS (DESKTOP & TOUCH MOBILE)
  // ==========================================
  initInputs() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyE') this.handleInteract();
      if (e.code === 'Space') {
        e.preventDefault();
        this.handleHorn();
      }
      if (e.code === 'KeyQ' || e.code === 'KeyF') this.handleAbility();
      if (e.code === 'KeyM') this.toggleAudio();
      if (e.code === 'KeyC') this.toggleCaseFile();
      if (e.code === 'KeyZ') this.handleVoiceShout(0.65);
      if (e.code === 'KeyX') this.handleVoiceShout(0.9);
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mobile Virtual Joystick Setup
    const zone = document.getElementById('joystick-zone');
    const thumb = document.getElementById('joystick-thumb');
    let touchId = null;
    let originX = 0, originY = 0;

    const onTouchStart = (e) => {
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      const rect = zone.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
      updateJoystick(touch.clientX, touch.clientY);
    };

    const onTouchMove = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          break;
        }
      }
    };

    const onTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          this.touchVector = { x: 0, y: 0, active: false, mag: 0 };
          thumb.style.transform = 'translate(0px, 0px)';
          break;
        }
      }
    };

    const updateJoystick = (cx, cy) => {
      let dx = cx - originX;
      let dy = cy - originY;
      const maxRadius = 45;
      const dist = Math.hypot(dx, dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      thumb.style.transform = `translate(${dx}px, ${dy}px)`;
      this.touchVector = {
        x: dx / maxRadius,
        y: dy / maxRadius,
        active: dist > 4,
        mag: Math.min(1.0, dist / maxRadius)
      };
    };

    zone.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });
    window.addEventListener('touchcancel', onTouchEnd, { passive: false });

    // Multi-Input Action Buttons (Debounced to prevent pointerdown + click race conditions)
    const setupButton = (id, callback) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      let lastTrigger = 0;
      const trigger = (e) => {
        if (e) e.preventDefault();
        const now = performance.now();
        if (now - lastTrigger < 250) return; // 250ms debounce
        lastTrigger = now;
        callback();
      };
      btn.addEventListener('pointerdown', trigger);
      btn.addEventListener('click', trigger);
    };

    setupButton('btn-interact', () => this.handleInteract());
    setupButton('btn-horn', () => this.handleHorn());
    setupButton('btn-ability', () => this.handleAbility());
    setupButton('btn-shout', () => this.handleVoiceShout(0.75));

    // Sprint Button (Press and Hold)
    const sprintBtn = document.getElementById('btn-sprint');
    if (sprintBtn) {
      const startSprint = (e) => {
        e.preventDefault();
        this.isSprinting = true;
        sprintBtn.style.transform = 'scale(0.92)';
        sprintBtn.style.background = '#059669';
      };
      const stopSprint = (e) => {
        e.preventDefault();
        this.isSprinting = false;
        sprintBtn.style.transform = 'scale(1)';
        sprintBtn.style.background = 'rgba(16, 149, 106, 0.7)';
      };
      sprintBtn.addEventListener('pointerdown', startSprint);
      sprintBtn.addEventListener('pointerup', stopSprint);
      sprintBtn.addEventListener('pointerleave', stopSprint);
      sprintBtn.addEventListener('pointercancel', stopSprint);
    }
  }

  // ==========================================
  // WEBSOCKET MULTIPLAYER NETWORK
  // ==========================================
  initNetwork() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host || 'localhost:3000';
    const wsUrl = `${protocol}//${host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.connected = true;
        this.sendWsMessage({
          type: 'JOIN_GAME',
          roomId: 'DEFAULT',
          era: this.era,
          name: this.player.name,
          faction: this.player.faction,
          dressStyle: this.player.dressStyle,
          disguise: this.player.disguise
        });
      };

      this.ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          this.handleServerMessage(msg);
        } catch (err) {}
      };

      this.ws.onclose = () => {
        this.connected = false;
        setTimeout(() => this.initNetwork(), 2500);
      };
    } catch (e) {
      console.warn('Standalone offline mode active.');
    }
  }

  sendWsMessage(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  handleServerMessage(msg) {
    switch (msg.type) {
      case 'WELCOME':
        this.player.id = msg.playerId;
        this.era = msg.era;
        break;

      case 'ROOM_SYNC':
        this.era = msg.era;
        this.weather = msg.weather;
        this.rainIntensity = msg.rainIntensity;
        this.dayTime = msg.dayTime;
        this.harthalActive = msg.harthalActive;
        this.clues = msg.clues || this.clues;
        this.kurupState = msg.kurupState || this.kurupState;
        this.scores = msg.scores || this.scores;

        // Sync other players
        this.players = {};
        msg.players.forEach(p => {
          if (p.id !== this.player.id) {
            this.players[p.id] = p;
          } else {
            this.player.score = p.score;
          }
        });

        // Sync vehicles while PRESERVING local authoritative driver position & vehicle parameters
        if (msg.vehicles && msg.vehicles.length > 0) {
          const serverMap = new Map();
          msg.vehicles.forEach(sv => serverMap.set(sv.id, sv));

          this.vehicles.forEach(localV => {
            const sv = serverMap.get(localV.id);
            if (sv) {
              if (this.player.vehicleId && localV.id === this.player.vehicleId) {
                // Local player is driving this vehicle: keep local authoritative physics
                localV.x = this.player.x;
                localV.y = this.player.y;
                localV.angle = this.player.angle;
                localV.speed = this.player.speed;
                localV.driverId = this.player.id;
              } else {
                // Other vehicle: sync from server
                if (typeof sv.x === 'number' && !isNaN(sv.x)) localV.x = sv.x;
                if (typeof sv.y === 'number' && !isNaN(sv.y)) localV.y = sv.y;
                if (typeof sv.angle === 'number' && !isNaN(sv.angle)) localV.angle = sv.angle;
                if (typeof sv.speed === 'number' && !isNaN(sv.speed)) localV.speed = sv.speed;
                localV.driverId = sv.driverId || null;
              }
              if (sv.color) localV.color = sv.color;
              if (sv.beacon !== undefined) localV.beacon = sv.beacon;
              if (sv.maxSpeed) localV.maxSpeed = Number(sv.maxSpeed) || localV.maxSpeed;
            }
          });

          // Append any newly added vehicles from server (e.g. after era warp)
          msg.vehicles.forEach(sv => {
            if (!this.vehicles.some(lv => lv.id === sv.id)) {
              this.vehicles.push({
                ...sv,
                maxSpeed: Number(sv.maxSpeed) || 6.5,
                horn: sv.horn || 'honk'
              });
            }
          });
        }

        this.updateUi();
        break;

      case 'VEHICLE_BOARDED':
        if (this.player.vehicleId !== msg.vehicleId) {
          this.player.vehicleId = msg.vehicleId;
          const v = this.vehicles.find(veh => veh.id === msg.vehicleId);
          if (v) {
            v.driverId = this.player.id;
            this.player.x = v.x;
            this.player.y = v.y;
            this.player.angle = v.angle;
          }
          window.kurupAudio.startEngine(msg.vehicleId.includes('bullet') ? 'bullet' : 'car');
          this.showAlert(`🚗 Boarded: ${msg.vehicleName || 'Vehicle'}`);
          this.updateUi();
        }
        break;

      case 'VEHICLE_EXITED':
        if (this.player.vehicleId) {
          const oldV = this.vehicles.find(v => v.id === this.player.vehicleId);
          if (oldV) oldV.driverId = null;
          this.player.vehicleId = null;
          this.player.speed = 0;
          window.kurupAudio.stopEngine();
          this.showAlert('Exited vehicle');
          this.updateUi();
        }
        break;

      case 'DISGUISE_CHANGED':
        this.player.disguise = msg.disguise;
        this.showAlert(`Disguise shifted to: ${msg.disguise.replace('_', ' ').toUpperCase()}`);
        break;
    }
  }

  // ==========================================
  // WANTED LEVEL
  // ==========================================
  addWanted(delta) {
    this.wantedLevel = Math.max(0, Math.min(5, this.wantedLevel + delta));
    this.wantedTimer = 18; // seconds before it starts fading
    this.updateWantedUi();
    if (this.wantedLevel >= 3 && delta > 0) {
      this.showAlert(`⭐ WANTED LEVEL ${this.wantedLevel} — POLICE PURSUIT INITIATED!`);
    }
  }

  updateWantedUi() {
    const el = document.getElementById('wantedStars');
    if (!el) return;
    el.textContent = '⭐'.repeat(this.wantedLevel) + '☆'.repeat(5 - this.wantedLevel);
    el.style.color = this.wantedLevel >= 4 ? '#ef4444'
                   : this.wantedLevel >= 2 ? '#f59e0b'
                   : '#6b7280';
    el.style.display = this.wantedLevel > 0 ? 'block' : 'none';
  }

  // ==========================================
  // CHARACTER VOICE / SHOUT
  // ==========================================
  handleVoiceShout(intensity = 0.65) {
    window.kurupAudio.ensureContext();
    const now = performance.now();
    // 800ms cooldown to prevent spam
    if (this._lastShoutTime && now - this._lastShoutTime < 800) return;
    this._lastShoutTime = now;

    window.kurupAudio.playVoice(this.player.faction, intensity);

    // Show speech bubble with faction-appropriate phrase
    const phrases = {
      police:         ['STOP! POLICE!', 'Nikkeda!', 'Surrender NOW!', 'Nobody move!', 'Hands up!'],
      red_cadre:      ['Inquilab Zindabad!', 'Lal Salaam!', 'Harthal!', 'Janangale jagratha!', 'Samara vijayam!'],
      tricolor_cadre: ['Jai Hind!', 'Bharat Mata Ki Jai!', 'Vande Mataram!', 'Democracy wins!'],
      gulf_syndicate: ['Eda machane!', 'Gulf-il ninn vannu!', 'Panam und, pedi venda!', 'Ayyy!'],
      kurup:          ['...', 'Nobody saw me.', '*looks around nervously*', 'Njaan Kurupalla!']
    };
    const list = phrases[this.player.faction] || phrases.police;
    const phrase = list[Math.floor(Math.random() * list.length)];

    // Store bubble state for render
    this.speechBubble = {
      text: phrase,
      x: this.player.x,
      y: this.player.y,
      life: 1.0,
      intensity
    };
  }

  // ==========================================
  // ACTION HANDLERS
  // ==========================================
  handleInteract() {
    window.kurupAudio.ensureContext();

    // 1. EXIT VEHICLE (Instant Local Execution)
    if (this.player.vehicleId) {
      const oldV = this.vehicles.find(v => v.id === this.player.vehicleId);
      if (oldV) oldV.driverId = null;
      const exitedId = this.player.vehicleId;
      this.player.vehicleId = null;
      this.player.speed = 0;
      window.kurupAudio.stopEngine();
      this.showAlert('Exited vehicle onto foot.');
      this.sendWsMessage({ type: 'EXIT_VEHICLE', vehicleId: exitedId });
      this.updateUi();
      return;
    }

    // 2. ENTER NEAREST VEHICLE (Generous Detection Radius)
    let nearestVehicle = null;
    let minDist = Infinity;
    for (const v of this.vehicles) {
      const isBus = v.type === 'ksrtc_bus';
      const interactRadius = isBus ? 135 : 95;
      const dist = Math.hypot(this.player.x - v.x, this.player.y - v.y);
      if (dist < interactRadius && (!v.driverId || v.driverId === this.player.id) && dist < minDist) {
        minDist = dist;
        nearestVehicle = v;
      }
    }

    if (nearestVehicle) {
      // Instant Local Prediction
      this.player.vehicleId = nearestVehicle.id;
      nearestVehicle.driverId = this.player.id;
      this.player.x = nearestVehicle.x;
      this.player.y = nearestVehicle.y;
      this.player.angle = nearestVehicle.angle;
      this.player.speed = 0;

      window.kurupAudio.startEngine(nearestVehicle.type.includes('bullet') ? 'bullet' : 'car');
      this.showAlert(`🚗 Boarded ${nearestVehicle.name}! Drive with W/S or Joystick!`);

      this.sendWsMessage({
        type: 'ENTER_VEHICLE',
        vehicleId: nearestVehicle.id
      });
      this.updateUi();
      return;
    }

    // 3. INSPECT NEAREST CLUE
    for (const clue of this.clues) {
      const dist = Math.hypot(this.player.x - clue.x, this.player.y - clue.y);
      if (dist < 80 && !clue.found) {
        clue.found = true;
        this.player.score += 150;
        this.sendWsMessage({
          type: 'CLUE_DISCOVERED',
          clueId: clue.id
        });
        window.kurupAudio.playClueFound();
        this.showAlert(`🔎 CLUE UNCOVERED: ${clue.title}!`);
        this.updateUi();
        return;
      }
    }
  }

  handleHorn() {
    window.kurupAudio.ensureContext();
    if (this.player.vehicleId) {
      const v = this.vehicles.find(veh => veh.id === this.player.vehicleId);
      if (v) {
        window.kurupAudio.playHorn(v.type === 'ksrtc_bus' ? 'ksrtc' : (v.beacon ? 'siren' : (v.type.includes('bullet') ? 'thump' : 'honk')));
      }
    } else {
      window.kurupAudio.playHorn('peep');
    }
  }

  handleAbility() {
    window.kurupAudio.ensureContext();
    window.kurupAudio.playAbility();

    let abilityName = 'harthal';
    if (this.player.faction === 'police') abilityName = 'nakabandi';
    else if (this.player.faction === 'kurup') abilityName = 'disguise_shift';
    else abilityName = 'harthal';

    if (abilityName === 'harthal') {
      this.harthalActive = true;
      this.player.score += 50;
      this.showAlert('🚨 KERALA-WIDE HARTHAL DECLARED! TRAFFIC HALTED!');
    } else if (abilityName === 'nakabandi') {
      this.player.score += 75;
      this.showAlert('🚓 POLICE NAKABANDI ROADBLOCK ACTIVATED!');
    } else if (abilityName === 'disguise_shift') {
      const disguises = ['gulf_tycoon', 'sanyasi', 'toddy_tapper', 'police_si'];
      this.player.disguise = disguises[(disguises.indexOf(this.player.disguise) + 1) % disguises.length];
      this.player.score += 100;
      this.showAlert(`🎭 Disguise shifted to: ${this.player.disguise.replace('_', ' ').toUpperCase()}!`);
    }

    this.sendWsMessage({
      type: 'USE_ABILITY',
      ability: abilityName
    });
    this.updateUi();
  }

  changeEra(nextEra) {
    this.era = nextEra;
    if (this.player.vehicleId) {
      this.player.vehicleId = null;
      window.kurupAudio.stopEngine();
    }
    this.vehicles = this.getDefaultVehicles(nextEra);
    this.showAlert(`⏳ Time warp: Shifted to ${nextEra} era! New vehicles spawned!`);
    window.kurupAudio.playClueFound();
    this.sendWsMessage({
      type: 'CHANGE_ERA',
      era: nextEra
    });
    this.updateUi();
  }

  toggleAudio() {
    const isMuted = window.kurupAudio.toggleMute();
    this.showAlert(isMuted ? 'Audio Muted' : 'Audio Enabled');
    return isMuted;
  }

  toggleCaseFile() {
    const modal = document.getElementById('casefileModal');
    if (!modal) return;
    const isVisible = (modal.style.display === 'flex');
    modal.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) {
      this.renderCaseFile();
    }
  }

  showAlert(text) {
    const ticker = document.getElementById('alert-ticker');
    if (!ticker) return;
    ticker.textContent = text;
    ticker.style.display = 'block';
    clearTimeout(this.alertTimer);
    this.alertTimer = setTimeout(() => {
      ticker.style.display = 'none';
    }, 3200);
  }

  // ==========================================
  // GAME UPDATE LOOP & DRIVING PHYSICS
  // ==========================================
  update(dt) {
    window.kurupSprites.update();

    if (this.player.vehicleId) {
      // =======================================
      // VEHICLE DRIVING PHYSICS (Keyboard & Touch)
      // =======================================
      const currentVehicle = this.vehicles.find(v => v.id === this.player.vehicleId);

      // Safety: if vehicle no longer exists (era change, server desync), auto-exit
      if (!currentVehicle) {
        console.warn('Vehicle', this.player.vehicleId, 'not found, auto-exiting.');
        this.player.vehicleId = null;
        this.player.speed = 0;
        window.kurupAudio.stopEngine();
        this.showAlert('Vehicle lost — back on foot.');
        this.updateUi();
        return;
      }

      const maxSpeed = currentVehicle.maxSpeed * (this.harthalActive ? 0.35 : 1.0);
      const accel = (currentVehicle.type.includes('bullet') ? 0.32 : 0.24);

      const isForward = this.keys['KeyW'] || this.keys['ArrowUp'];
      const isReverse = this.keys['KeyS'] || this.keys['ArrowDown'];
      const isLeft = this.keys['KeyA'] || this.keys['ArrowLeft'];
      const isRight = this.keys['KeyD'] || this.keys['ArrowRight'];

      if (this.touchVector.active) {
        // Touch Joystick Driving
        const joyAngle = Math.atan2(this.touchVector.y, this.touchVector.x);
        let angleDiff = joyAngle - this.player.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) < Math.PI * 0.65) {
          // Accelerate forward along joystick direction
          this.player.angle += angleDiff * 0.11;
          this.player.speed = Math.min(maxSpeed, this.player.speed + accel * this.touchVector.mag);
        } else {
          // Reverse
          let revDiff = (joyAngle + Math.PI) - this.player.angle;
          while (revDiff > Math.PI) revDiff -= Math.PI * 2;
          while (revDiff < -Math.PI) revDiff += Math.PI * 2;
          this.player.angle += revDiff * 0.11;
          this.player.speed = Math.max(-maxSpeed * 0.45, this.player.speed - accel * 0.7 * this.touchVector.mag);
        }
      } else {
        // Keyboard Driving
        if (isForward) {
          this.player.speed = Math.min(maxSpeed, this.player.speed + accel);
        } else if (isReverse) {
          this.player.speed = Math.max(-maxSpeed * 0.45, this.player.speed - accel * 0.7);
        } else {
          this.player.speed *= 0.94;
          if (Math.abs(this.player.speed) < 0.05) this.player.speed = 0;
        }

        // Steering
        const steerRate = 0.055;
        const steerFactor = Math.min(1.0, Math.abs(this.player.speed) / (maxSpeed * 0.3) + 0.35);
        const revSign = this.player.speed < -0.1 ? -1 : 1;

        if (isLeft) {
          this.player.angle -= steerRate * steerFactor * revSign;
        }
        if (isRight) {
          this.player.angle += steerRate * steerFactor * revSign;
        }
      }

      // Update position
      this.player.x += Math.cos(this.player.angle) * this.player.speed;
      this.player.y += Math.sin(this.player.angle) * this.player.speed;

      // Keep vehicle strictly synchronized to player
      if (currentVehicle) {
        currentVehicle.x = this.player.x;
        currentVehicle.y = this.player.y;
        currentVehicle.angle = this.player.angle;
        currentVehicle.speed = this.player.speed;
        currentVehicle.driverId = this.player.id;
      }

      window.kurupAudio.updateEngine(this.player.speed, maxSpeed);

    } else {
      // =======================================
      // ON-FOOT MOVEMENT PHYSICS
      // =======================================
      let moveX = 0, moveY = 0;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

      if (this.touchVector.active) {
        moveX = this.touchVector.x;
        moveY = this.touchVector.y;
      }

      const isMoving = Math.hypot(moveX, moveY) > 0.05;
      const isSprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.isSprinting;

      if (isMoving) {
        this.player.angle = Math.atan2(moveY, moveX);
        const baseSpeed = isSprint && this.player.stamina > 5 ? 4.2 : 2.6;
        this.player.speed = baseSpeed * (this.harthalActive ? 0.75 : 1.0);

        if (isSprint && this.player.stamina > 0) {
          this.player.stamina = Math.max(0, this.player.stamina - dt * 18);
        }
      } else {
        this.player.speed = 0;
        this.player.stamina = Math.min(100, this.player.stamina + dt * 12);
      }

      this.player.x += Math.cos(this.player.angle) * this.player.speed;
      this.player.y += Math.sin(this.player.angle) * this.player.speed;
    }

    // ── SPEECH BUBBLE FADE ───────────────────────────────────────────────
    if (this.speechBubble && this.speechBubble.life > 0) {
      this.speechBubble.life -= dt * 0.9;
      // Track player position
      this.speechBubble.x = this.player.x;
      this.speechBubble.y = this.player.y;
    }

    // World Boundary Constraints
    this.player.x = Math.max(40, Math.min(window.kurupWorldMap.width - 40, this.player.x));
    this.player.y = Math.max(40, Math.min(window.kurupWorldMap.height - 40, this.player.y));

    // ── SKID MARKS ───────────────────────────────────────────────────────
    if (this.player.vehicleId) {
      const cv = this.vehicles.find(v => v.id === this.player.vehicleId);
      if (cv) {
        const isBraking = (this.keys['KeyS'] || this.keys['ArrowDown']) && this.player.speed > 2.5;
        const isTurningFast = (this.keys['KeyA'] || this.keys['KeyD'] ||
                               this.keys['ArrowLeft'] || this.keys['ArrowRight']) && Math.abs(this.player.speed) > 4;
        if (isBraking || isTurningFast) {
          // Drop a mark every few frames
          if (Math.random() < 0.4) {
            this.skidMarks.push({
              x: this.player.x - Math.cos(this.player.angle) * 18,
              y: this.player.y - Math.sin(this.player.angle) * 18,
              angle: this.player.angle,
              alpha: 0.55,
              width: cv.type === 'ksrtc_bus' ? 8 : 4
            });
            this.skidMarks.push({
              x: this.player.x + Math.sin(this.player.angle) * 10 - Math.cos(this.player.angle) * 18,
              y: this.player.y - Math.cos(this.player.angle) * 10 - Math.sin(this.player.angle) * 18,
              angle: this.player.angle,
              alpha: 0.55,
              width: cv.type === 'ksrtc_bus' ? 8 : 4
            });
          }
        }
        // Cap total marks
        if (this.skidMarks.length > 400) this.skidMarks.splice(0, 20);
        // Fade oldest marks
        for (const m of this.skidMarks) {
          m.alpha -= 0.0004;
        }
        this.skidMarks = this.skidMarks.filter(m => m.alpha > 0.02);
      }
    }

    // ── DUST / SPEED-LINE PARTICLES ──────────────────────────────────────
    if (this.player.vehicleId) {
      const spd = Math.abs(this.player.speed);
      if (spd > 3.5 && Math.random() < 0.35) {
        // Dust from rear wheels
        for (let d = 0; d < 2; d++) {
          this.particles.push({
            x: this.player.x - Math.cos(this.player.angle) * 22 + (Math.random() - 0.5) * 12,
            y: this.player.y - Math.sin(this.player.angle) * 22 + (Math.random() - 0.5) * 12,
            vx: -Math.cos(this.player.angle) * 1.5 + (Math.random() - 0.5) * 2,
            vy: -Math.sin(this.player.angle) * 1.5 + (Math.random() - 0.5) * 2,
            life: 1, maxLife: 1,
            r: 4 + Math.random() * 5,
            color: 'rgba(180,160,120,',
            type: 'dust'
          });
        }
      }
      // Speed lines when going fast in vehicle
      if (spd > 5 && Math.random() < 0.5) {
        this.particles.push({
          x: this.player.x + (Math.random() - 0.5) * this.viewport.width * 0.8,
          y: this.player.y + (Math.random() - 0.5) * this.viewport.height * 0.8,
          vx: Math.cos(this.player.angle) * -(spd * 3),
          vy: Math.sin(this.player.angle) * -(spd * 3),
          life: 1, maxLife: 1,
          r: 1.5,
          color: 'rgba(255,255,255,',
          type: 'speedline',
          len: 10 + spd * 3
        });
      }
    }

    // Footstep dust for sprinting
    if (!this.player.vehicleId && this.player.speed > 3.5 && Math.random() < 0.25) {
      this.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 8,
        y: this.player.y + 8 + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 1.2,
        vy: Math.random() * -1,
        life: 1, maxLife: 1,
        r: 2 + Math.random() * 2,
        color: 'rgba(160,140,100,',
        type: 'dust'
      });
    }

    // Update / cull particles
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.035;
      p.r *= 1.04;
    }
    this.particles = this.particles.filter(p => p.life > 0);
    if (this.particles.length > 300) this.particles.splice(0, 50);

    // ── SCREEN SHAKE ──────────────────────────────────────────────────────
    if (this.screenShake.trauma > 0) {
      const t2 = this.screenShake.trauma * this.screenShake.trauma;
      this.screenShake.x = (Math.random() - 0.5) * 20 * t2;
      this.screenShake.y = (Math.random() - 0.5) * 20 * t2;
      this.screenShake.trauma = Math.max(0, this.screenShake.trauma - dt * 2.2);
    } else {
      this.screenShake.x = 0;
      this.screenShake.y = 0;
    }

    // Collision detection: player vehicle vs NPC — trigger shake & wanted
    if (this.player.vehicleId) {
      for (const npc of this.npcs) {
        const dist = Math.hypot(this.player.x - npc.x, this.player.y - npc.y);
        if (dist < 28 && Math.abs(this.player.speed) > 1.5) {
          // Scatter NPC away
          const esc = Math.atan2(npc.y - this.player.y, npc.x - this.player.x);
          npc.x += Math.cos(esc) * 30;
          npc.y += Math.sin(esc) * 30;
          npc.fleeing = true;
          npc.fleeTimer = 220;
          npc.angle = esc;
          // Screen shake
          this.screenShake.trauma = Math.min(1, this.screenShake.trauma + 0.4);
          // Impact dust burst
          for (let d = 0; d < 6; d++) {
            const a = Math.random() * Math.PI * 2;
            this.particles.push({
              x: this.player.x, y: this.player.y,
              vx: Math.cos(a) * (2 + Math.random() * 3),
              vy: Math.sin(a) * (2 + Math.random() * 3),
              life: 1, maxLife: 1, r: 5 + Math.random() * 5,
              color: 'rgba(200,160,80,', type: 'dust'
            });
          }
          // Gain wanted level
          this.addWanted(1);
        }
      }
    }

    // ── NPC UPDATE ────────────────────────────────────────────────────────
    for (const npc of this.npcs) {
      if (npc.fleeing && npc.fleeTimer > 0) {
        // Run away from player
        npc.fleeTimer--;
        const fleeSpeed = 3.2;
        npc.x += Math.cos(npc.angle) * fleeSpeed;
        npc.y += Math.sin(npc.angle) * fleeSpeed;
        if (npc.fleeTimer <= 0) npc.fleeing = false;
      } else {
        // Wander: change direction periodically
        npc.wanderTimer--;
        if (npc.wanderTimer <= 0) {
          npc.angle = Math.random() * Math.PI * 2;
          npc.speed = 0.5 + Math.random() * 1.0;
          npc.wanderTimer = 80 + Math.random() * 160;
        }
        npc.x += Math.cos(npc.angle) * npc.speed;
        npc.y += Math.sin(npc.angle) * npc.speed;
      }
      // Keep NPCs in world bounds, loosely around their spawn area
      npc.x = Math.max(200, Math.min(window.kurupWorldMap.width - 200, npc.x));
      npc.y = Math.max(200, Math.min(window.kurupWorldMap.height - 200, npc.y));
    }

    // ── KURUP AI MOVEMENT ─────────────────────────────────────────────────
    if (this.kurupState && !this.kurupState.captured && !this.kurupState.escaped) {
      const kx = this.kurupState.x, ky = this.kurupState.y;
      const distToPlayer = Math.hypot(this.player.x - kx, this.player.y - ky);

      // Kurup flees when police is within 300px, otherwise drifts slowly
      if (this.player.faction === 'police' && distToPlayer < 300) {
        // Run away from player
        const fleeAngle = Math.atan2(ky - this.player.y, kx - this.player.x);
        const kurupSpeed = 1.8 + (this.kurupState.fleeBoost || 0);
        this.kurupState.x += Math.cos(fleeAngle) * kurupSpeed;
        this.kurupState.y += Math.sin(fleeAngle) * kurupSpeed;
        this.kurupState.angle = fleeAngle;
        this.kurupState.speed = kurupSpeed;

        // Boost if very close (panic)
        this.kurupState.fleeBoost = distToPlayer < 120 ? 2.5 : 0;

        // Randomly change disguise to confuse player
        if (!this.kurupState._disguiseTimer) this.kurupState._disguiseTimer = 0;
        this.kurupState._disguiseTimer--;
        if (this.kurupState._disguiseTimer <= 0) {
          const disguises = ['gulf_tycoon', 'sanyasi', 'toddy_tapper', 'default'];
          const next = disguises[Math.floor(Math.random() * disguises.length)];
          if (next !== this.kurupState.disguise) {
            this.kurupState.disguise = next;
            this.showAlert(`🎭 Kurup changed disguise: spotted as ${next.replace('_',' ').toUpperCase()}!`);
          }
          this.kurupState._disguiseTimer = 300 + Math.random() * 300;
        }

        // Capture check
        if (distToPlayer < 40 && this.player.faction === 'police') {
          this.kurupState.captured = true;
          this.player.score += 500;
          this.addWanted(-5); // clear wanted
          this.showAlert('🏆 SUKUMARA KURUP CAPTURED! Case closed! +500 points!');
          window.kurupAudio.playClueFound();
          this.updateUi();
        }
      } else {
        // Passive wander
        if (!this.kurupState._wanderTimer) this.kurupState._wanderTimer = 0;
        this.kurupState._wanderTimer--;
        if (this.kurupState._wanderTimer <= 0) {
          this.kurupState._wanderAngle = Math.random() * Math.PI * 2;
          this.kurupState._wanderTimer = 120 + Math.random() * 200;
        }
        const wa = this.kurupState._wanderAngle || 0;
        this.kurupState.x += Math.cos(wa) * 0.8;
        this.kurupState.y += Math.sin(wa) * 0.8;
        this.kurupState.angle = wa;
        this.kurupState.speed = 0.8;
      }

      // World boundary clamp for Kurup
      this.kurupState.x = Math.max(100, Math.min(window.kurupWorldMap.width - 100, this.kurupState.x));
      this.kurupState.y = Math.max(100, Math.min(window.kurupWorldMap.height - 100, this.kurupState.y));
    }

    // ── WANTED LEVEL COOLDOWN ─────────────────────────────────────────────
    if (this.wantedLevel > 0) {
      this.wantedTimer -= dt;
      if (this.wantedTimer <= 0) {
        this.wantedLevel = Math.max(0, this.wantedLevel - 1);
        this.wantedTimer = this.wantedLevel > 0 ? 12 : 0;
        this.updateWantedUi();
      }
    }

    // Viewport camera smooth follow
    const targetVx = this.player.x - this.viewport.width / 2;
    const targetVy = this.player.y - this.viewport.height / 2;
    this.viewport.x += (targetVx - this.viewport.x) * 0.12;
    this.viewport.y += (targetVy - this.viewport.y) * 0.12;

    // Send input sync to server (25 updates/sec)
    const now = performance.now();
    if (now - this.lastInputSendTime > 40) {
      this.lastInputSendTime = now;
      this.sendWsMessage({
        type: 'PLAYER_INPUT',
        x: this.player.x,
        y: this.player.y,
        angle: this.player.angle,
        speed: this.player.speed,
        stamina: this.player.stamina
      });
    }

    // Weather / Rain simulation
    for (const drop of this.rainDrops) {
      drop.y += drop.speed;
      drop.x -= 3;
      if (drop.y > window.innerHeight) {
        drop.y = -20;
        drop.x = Math.random() * (window.innerWidth + 100);
      }
    }

    // Occasional monsoon lightning flash
    if (Math.random() < 0.003) {
      this.lightningAlpha = 0.55;
      window.kurupAudio.playThunder();
    } else if (this.lightningAlpha > 0) {
      this.lightningAlpha = Math.max(0, this.lightningAlpha - 0.05);
    }
  }

  // ==========================================
  // RENDER METHOD
  // ==========================================
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply screen shake offset on top of viewport
    const shakeX = this.screenShake ? this.screenShake.x : 0;
    const shakeY = this.screenShake ? this.screenShake.y : 0;

    ctx.save();
    // Apply camera viewport offset + screen shake
    ctx.translate(-this.viewport.x + shakeX, -this.viewport.y + shakeY);

    // 1. Draw Kerala Map Landscape
    window.kurupWorldMap.draw(ctx, this.viewport, window.kurupSprites);

    // 1b. Draw persistent skid marks (below vehicles, above road)
    for (const m of this.skidMarks) {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.angle);
      ctx.strokeStyle = `rgba(30,20,10,${m.alpha})`;
      ctx.lineWidth = m.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-m.width, -m.width / 2);
      ctx.lineTo(m.width, m.width / 2);
      ctx.stroke();
      ctx.restore();
    }

    // 1c. Draw dust/speed-line particles (below characters, above road)
    for (const p of this.particles) {
      if (p.type === 'speedline') {
        ctx.save();
        ctx.strokeStyle = `${p.color}${(p.life * 0.4).toFixed(2)})`;
        ctx.lineWidth = p.r;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.25, p.y - p.vy * 0.25);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${(p.life * 0.45).toFixed(2)})`;
        ctx.fill();
      }
    }

    // 2. Draw Clue Investigation Markers
    for (const clue of this.clues) {
      ctx.save();
      ctx.translate(clue.x, clue.y);
      const pulse = Math.sin(window.kurupSprites.animTick * 6) * 3;
      // Outer glow ring
      ctx.beginPath();
      ctx.arc(0, 0, 16 + pulse, 0, Math.PI * 2);
      ctx.strokeStyle = clue.found ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)';
      ctx.lineWidth = 4;
      ctx.stroke();
      // Inner dot
      ctx.fillStyle = clue.found ? '#10b981' : '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, 9 + pulse * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(clue.found ? '✓ FOUND' : '🔍 CLUE', 0, -18);
      ctx.restore();
    }

    // 3. Draw Vehicles
    for (const v of this.vehicles) {
      window.kurupSprites.drawVehicle(ctx, v);
    }

    // 3b. Draw NPC pedestrians
    for (const npc of this.npcs) {
      window.kurupSprites.drawNPC(ctx, npc);
    }

    // 4. Draw Floating Interactive Badges over nearby vehicles / clues
    if (!this.player.vehicleId) {
      let nearestV = null;
      let minVdist = Infinity;
      for (const v of this.vehicles) {
        const isBus = v.type === 'ksrtc_bus';
        const r = isBus ? 135 : 95;
        const d = Math.hypot(this.player.x - v.x, this.player.y - v.y);
        if (d < r && (!v.driverId || v.driverId === this.player.id) && d < minVdist) {
          minVdist = d;
          nearestV = v;
        }
      }

      if (nearestV) {
        ctx.save();
        ctx.translate(nearestV.x, nearestV.y - 40);
        const bounce = Math.sin(window.kurupSprites.animTick * 6) * 4;
        ctx.translate(0, bounce);
        ctx.fillStyle = 'rgba(14, 116, 144, 0.92)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(-65, -13, 130, 26, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🚗 [E] DRIVE ' + nearestV.name.split(' ')[0], 0, 4);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(-6, 13); ctx.lineTo(6, 13); ctx.lineTo(0, 19); ctx.fill();
        ctx.restore();
      }

      for (const clue of this.clues) {
        if (!clue.found && Math.hypot(this.player.x - clue.x, this.player.y - clue.y) < 80) {
          ctx.save();
          ctx.translate(clue.x, clue.y - 32);
          const bounce = Math.sin(window.kurupSprites.animTick * 6) * 4;
          ctx.translate(0, bounce);
          ctx.fillStyle = 'rgba(22, 101, 52, 0.92)';
          ctx.strokeStyle = '#4ade80';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(-58, -13, 116, 26, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🔍 [E] EXAMINE CLUE', 0, 4);
          ctx.restore();
        }
      }

      // Kurup capture prompt
      if (this.kurupState && !this.kurupState.captured && this.player.faction === 'police') {
        const dk = Math.hypot(this.player.x - this.kurupState.x, this.player.y - this.kurupState.y);
        if (dk < 70) {
          ctx.save();
          ctx.translate(this.kurupState.x, this.kurupState.y - 42);
          const bounce = Math.sin(window.kurupSprites.animTick * 8) * 5;
          ctx.translate(0, bounce);
          ctx.fillStyle = 'rgba(185,28,28,0.92)';
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(-68, -13, 136, 26, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🚔 [E] ARREST KURUP!', 0, 4);
          ctx.restore();
        }
      }
    }

    // 5. Draw Other Players
    for (const pid in this.players) {
      const p = this.players[pid];
      if (!p.vehicleId) {
        window.kurupSprites.drawCharacter(ctx, p, false);
      }
    }

    // 6. Draw Local Player (if not inside vehicle)
    if (!this.player.vehicleId) {
      window.kurupSprites.drawCharacter(ctx, this.player, true);
    } else {
      const dv = this.vehicles.find(v => v.id === this.player.vehicleId);
      if (dv) {
        ctx.save();
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 5;
        ctx.fillText(this.player.name, dv.x, dv.y - 46);
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    // 6b. Speech bubble above player (or above vehicle if driving)
    if (this.speechBubble && this.speechBubble.life > 0) {
      const sb = this.speechBubble;
      const alpha = Math.min(1, sb.life * 2); // fade out last 50% of life
      const px = sb.x;
      const py = sb.y - (this.player.vehicleId ? 60 : 46);
      const isLoud = sb.intensity >= 0.85;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Measure text
      ctx.font = `bold ${isLoud ? 13 : 11}px sans-serif`;
      const tw = ctx.measureText(sb.text).width;
      const bw = tw + 18;
      const bh = 22;
      const bx = px - bw / 2;
      const by = py - bh / 2;

      // Bubble fill
      ctx.fillStyle = isLoud ? 'rgba(239,68,68,0.92)' : 'rgba(17,24,39,0.88)';
      ctx.strokeStyle = isLoud ? '#fca5a5' : '#38bdf8';
      ctx.lineWidth = isLoud ? 2 : 1.5;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.fill();
      ctx.stroke();

      // Tail pointing down to character
      ctx.fillStyle = isLoud ? 'rgba(239,68,68,0.92)' : 'rgba(17,24,39,0.88)';
      ctx.beginPath();
      ctx.moveTo(px - 6, by + bh);
      ctx.lineTo(px + 6, by + bh);
      ctx.lineTo(px, by + bh + 8);
      ctx.closePath();
      ctx.fill();

      // Text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(sb.text, px, by + bh * 0.67);

      // Exclamation rings for loud shout
      if (isLoud) {
        const ring = (1 - sb.life) * 28;
        ctx.strokeStyle = `rgba(239,68,68,${alpha * 0.4})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 22 + ring, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // 7. Draw AI Kurup
    if (this.kurupState && !this.kurupState.captured && this.player.faction !== 'kurup') {
      const k = {
        x: this.kurupState.x,
        y: this.kurupState.y,
        angle: this.kurupState.angle || 0,
        speed: this.kurupState.speed || 0.8,
        faction: 'gulf_syndicate',
        dressStyle: 'bell_bottoms',
        disguise: this.kurupState.disguise,
        name: 'Sukumara Kurup'
      };
      window.kurupSprites.drawCharacter(ctx, k, false);

      // Red wanted glow ring around Kurup when police is nearby
      if (this.player.faction === 'police') {
        const dk = Math.hypot(this.player.x - k.x, this.player.y - k.y);
        if (dk < 400) {
          const pulse2 = Math.sin(window.kurupSprites.animTick * 8) * 4;
          ctx.strokeStyle = `rgba(239,68,68,${0.2 + (1 - dk / 400) * 0.5})`;
          ctx.lineWidth = 3;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(k.x, k.y, 28 + pulse2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
    }

    // Kurup captured banner
    if (this.kurupState && this.kurupState.captured) {
      ctx.save();
      ctx.translate(this.kurupState.x, this.kurupState.y);
      ctx.fillStyle = 'rgba(16,185,129,0.92)';
      ctx.beginPath();
      ctx.roundRect(-55, -18, 110, 28, 6);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✅ KURUP CAPTURED', 0, -1);
      ctx.restore();
    }

    ctx.restore(); // end world-space transform

    // 8. Day/Night & Monsoon Overlay
    const nightOpacity = Math.max(0, Math.sin(this.dayTime * Math.PI * 2) * 0.45);
    ctx.fillStyle = `rgba(12, 20, 36, ${nightOpacity})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Monsoon Rain Streaks
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
    ctx.lineWidth = 1.2;
    for (const drop of this.rainDrops) {
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 4, drop.y + drop.length);
      ctx.stroke();
    }

    // Lightning Flash
    if (this.lightningAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningAlpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Red vignette when wanted level is high
    if (this.wantedLevel >= 3) {
      const wAlpha = (this.wantedLevel - 2) / 3 * 0.22 * (0.7 + Math.sin(window.kurupSprites.animTick * 4) * 0.3);
      const wg = ctx.createRadialGradient(
        this.canvas.width / 2, this.canvas.height / 2, this.canvas.height * 0.3,
        this.canvas.width / 2, this.canvas.height / 2, this.canvas.height * 0.85
      );
      wg.addColorStop(0, 'rgba(185,28,28,0)');
      wg.addColorStop(1, `rgba(185,28,28,${wAlpha})`);
      ctx.fillStyle = wg;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 9. Minimap
    window.kurupWorldMap.drawMinimap(
      this.minimapCanvas,
      this.player,
      this.vehicles,
      this.kurupState,
      this.clues
    );

    // 10. Live speed display
    if (this.player.vehicleId) {
      const speedEl = document.getElementById('dashSpeed');
      if (speedEl) {
        speedEl.textContent = `${Math.round(Math.abs(this.player.speed) * 16)} km/h`;
      }
    }
  }

  updateUi() {
    // Stamina Bar
    const staminaBar = document.getElementById('staminaFill');
    if (staminaBar) {
      staminaBar.style.width = `${Math.max(0, this.player.stamina)}%`;
    }

    // Score Display
    const scoreElem = document.getElementById('playerScore');
    if (scoreElem) {
      scoreElem.textContent = this.player.score;
    }

    // Vehicle Dashboard
    const dash = document.getElementById('vehicle-dash');
    if (dash) {
      if (this.player.vehicleId) {
        dash.style.display = 'block';
        const v = this.vehicles.find(veh => veh.id === this.player.vehicleId);
        document.getElementById('dashVehicleName').textContent = v ? v.name : 'Vehicle';
        document.getElementById('dashSpeed').textContent = `${Math.round(Math.abs(this.player.speed) * 16)} km/h`;
      } else {
        dash.style.display = 'none';
      }
    }

    // Contextual Action Button (ENTER/DRIVE/EXIT/CLUE)
    const interactBtn = document.getElementById('btn-interact');
    if (interactBtn) {
      const textSpan = interactBtn.querySelector('span:not(.btn-icon)');
      const iconSpan = interactBtn.querySelector('.btn-icon');

      if (this.player.vehicleId) {
        if (textSpan) textSpan.textContent = 'EXIT';
        if (iconSpan) iconSpan.textContent = '🚪';
        interactBtn.style.borderColor = '#f59e0b';
        interactBtn.style.background = 'rgba(180, 83, 9, 0.88)';
        interactBtn.style.boxShadow = '0 0 14px rgba(245, 158, 11, 0.5)';
      } else {
        let nearV = this.vehicles.some(v => {
          const r = v.type === 'ksrtc_bus' ? 135 : 95;
          return Math.hypot(this.player.x - v.x, this.player.y - v.y) < r && (!v.driverId || v.driverId === this.player.id);
        });
        let nearC = this.clues.some(c => !c.found && Math.hypot(this.player.x - c.x, this.player.y - c.y) < 80);

        if (nearV) {
          if (textSpan) textSpan.textContent = 'DRIVE';
          if (iconSpan) iconSpan.textContent = '🚗';
          interactBtn.style.borderColor = '#38bdf8';
          interactBtn.style.background = 'rgba(14, 116, 144, 0.95)';
          interactBtn.style.boxShadow = '0 0 16px rgba(56, 189, 248, 0.7)';
        } else if (nearC) {
          if (textSpan) textSpan.textContent = 'CLUE';
          if (iconSpan) iconSpan.textContent = '🔍';
          interactBtn.style.borderColor = '#4ade80';
          interactBtn.style.background = 'rgba(22, 101, 52, 0.95)';
          interactBtn.style.boxShadow = '0 0 16px rgba(74, 222, 128, 0.7)';
        } else {
          if (textSpan) textSpan.textContent = 'ENTER';
          if (iconSpan) iconSpan.textContent = '🚗';
          interactBtn.style.borderColor = '#4b5563';
          interactBtn.style.background = 'rgba(31, 41, 55, 0.85)';
          interactBtn.style.boxShadow = 'none';
        }
      }
    }
  }

  renderCaseFile() {
    const list = document.getElementById('cluesList');
    if (!list) return;
    list.innerHTML = '';
    this.clues.forEach(c => {
      const div = document.createElement('div');
      div.className = `clue-item ${c.found ? 'found' : ''}`;
      div.innerHTML = `
        <div class="clue-header">${c.found ? '✓' : '❓'} ${c.title}</div>
        <div class="clue-text">${c.found ? c.desc : 'Evidence not yet examined. Search the reported location!'}</div>
      `;
      list.appendChild(div);
    });
  }

  gameLoop(timestamp) {
    const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    try {
      this.update(dt);
    } catch (e) {
      console.error('Update error:', e);
      // Auto-recover: if we're in a bad vehicle state, exit it
      if (this.player.vehicleId) {
        this.player.vehicleId = null;
        this.player.speed = 0;
      }
    }

    // IMPORTANT: always reset the canvas transform before rendering so that
    // any mid-render exception (caught below) cannot cause the viewport
    // ctx.translate() to accumulate across frames, which freezes the screen.
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    try {
      this.render();
    } catch (e) {
      console.error('Render error:', e);
      // Safety-reset transform again in case render threw mid-save/translate
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new KurupGame();
});
