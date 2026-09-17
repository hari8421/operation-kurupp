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

    // World Boundary Constraints
    this.player.x = Math.max(40, Math.min(window.kurupWorldMap.width - 40, this.player.x));
    this.player.y = Math.max(40, Math.min(window.kurupWorldMap.height - 40, this.player.y));

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

    ctx.save();
    // Apply camera viewport offset
    ctx.translate(-this.viewport.x, -this.viewport.y);

    // 1. Draw Kerala Map Landscape (Backwaters, paddy, roads, trees, landmarks)
    window.kurupWorldMap.draw(ctx, this.viewport, window.kurupSprites);

    // 2. Draw Clue Investigation Markers
    for (const clue of this.clues) {
      ctx.save();
      ctx.translate(clue.x, clue.y);
      const pulse = Math.sin(window.kurupSprites.animTick * 6) * 3;
      ctx.fillStyle = clue.found ? '#10b981' : '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, 10 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(clue.found ? '✓ FOUND' : '🔍 CLUE', 0, -15);
      ctx.restore();
    }

    // 3. Draw Vehicles
    for (const v of this.vehicles) {
      window.kurupSprites.drawVehicle(ctx, v);
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
        ctx.translate(nearestV.x, nearestV.y - 34);
        const bounce = Math.sin(window.kurupSprites.animTick * 6) * 4;
        ctx.translate(0, bounce);

        // Neon badge background
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

        // Arrow down
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(-6, 13);
        ctx.lineTo(6, 13);
        ctx.lineTo(0, 19);
        ctx.fill();

        ctx.restore();
      }

      // Clue prompt
      for (const clue of this.clues) {
        if (!clue.found && Math.hypot(this.player.x - clue.x, this.player.y - clue.y) < 80) {
          ctx.save();
          ctx.translate(clue.x, clue.y - 28);
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
      // Player is inside a vehicle — draw their name above the vehicle so it's
      // clear the character hasn't vanished. The cyan halo on the vehicle
      // already marks it as locally driven; we add the name tag here.
      const dv = this.vehicles.find(v => v.id === this.player.vehicleId);
      if (dv) {
        ctx.save();
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 5;
        ctx.fillText(this.player.name, dv.x, dv.y - 42);
        ctx.restore();
      }
    }

    // 7. Draw AI Kurup (if active)
    if (this.kurupState && this.player.faction !== 'kurup') {
      const k = {
        x: this.kurupState.x,
        y: this.kurupState.y,
        angle: 0,
        speed: 1,
        faction: 'kurup',
        dressStyle: 'folded_mundu',
        disguise: this.kurupState.disguise,
        name: 'Sukumara Kurup (Fugitive)'
      };
      window.kurupSprites.drawCharacter(ctx, k, false);
    }

    ctx.restore();

    // 8. Day / Night & Monsoon Atmosphere Overlay
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

    // Lightning Flash Effect
    if (this.lightningAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningAlpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 9. Render Radar Minimap
    window.kurupWorldMap.drawMinimap(
      this.minimapCanvas,
      this.player,
      this.vehicles,
      this.kurupState,
      this.clues
    );

    // 10. Live speed readout — updated every frame so the dashboard never lags
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
