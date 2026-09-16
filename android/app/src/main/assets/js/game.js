// Operation Kurup: Core Game Loop, Input Controller & Client Sync
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
    this.touchVector = { x: 0, y: 0, active: false };
    this.isSprinting = false;

    // World state
    this.era = '1984';
    this.weather = 'monsoon';
    this.rainIntensity = 0.75;
    this.dayTime = 0.35;
    this.harthalActive = false;
    this.players = {};
    this.vehicles = [];
    this.clues = [];
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
      if (e.code === 'Space') this.handleHorn();
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
          this.touchVector = { x: 0, y: 0, active: false };
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
        active: dist > 5
      };
    };

    zone.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });
    window.addEventListener('touchcancel', onTouchEnd, { passive: false });

    // Touch Action Buttons
    document.getElementById('btn-interact').addEventListener('click', () => this.handleInteract());
    document.getElementById('btn-sprint').addEventListener('touchstart', () => { this.isSprinting = true; });
    document.getElementById('btn-sprint').addEventListener('touchend', () => { this.isSprinting = false; });
    document.getElementById('btn-horn').addEventListener('click', () => this.handleHorn());
    document.getElementById('btn-ability').addEventListener('click', () => this.handleAbility());
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
        // Retry connection after 2 seconds
        setTimeout(() => this.initNetwork(), 2500);
      };
    } catch (e) {
      console.warn('Standalone offline mode running.');
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
            // Keep local score and stamina synchronized
            this.player.score = p.score;
          }
        });

        // Sync vehicles
        this.vehicles = msg.vehicles;
        this.updateUi();
        break;

      case 'VEHICLE_BOARDED':
        this.player.vehicleId = msg.vehicleId;
        window.kurupAudio.startEngine(msg.vehicleId.includes('bullet') ? 'bullet' : 'car');
        this.showAlert(`Boarded: ${msg.vehicleName}`);
        break;

      case 'VEHICLE_EXITED':
        this.player.vehicleId = null;
        window.kurupAudio.stopEngine();
        this.showAlert('Exited vehicle');
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

    if (this.player.vehicleId) {
      // Exit vehicle
      this.sendWsMessage({ type: 'EXIT_VEHICLE' });
      this.player.vehicleId = null;
      window.kurupAudio.stopEngine();
      return;
    }

    // Check nearest vehicle to enter
    for (const v of this.vehicles) {
      const dist = Math.hypot(this.player.x - v.x, this.player.y - v.y);
      if (dist < 55 && !v.driverId) {
        this.sendWsMessage({
          type: 'ENTER_VEHICLE',
          vehicleId: v.id
        });
        return;
      }
    }

    // Check nearest clue to inspect
    for (const clue of this.clues) {
      const dist = Math.hypot(this.player.x - clue.x, this.player.y - clue.y);
      if (dist < 60 && !clue.found) {
        this.sendWsMessage({
          type: 'CLUE_DISCOVERED',
          clueId: clue.id
        });
        window.kurupAudio.playClueFound();
        this.showAlert(`🔎 CLUE UNCOVERED: ${clue.title}!`);
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

    this.sendWsMessage({
      type: 'USE_ABILITY',
      ability: abilityName
    });

    if (abilityName === 'harthal') {
      this.showAlert('🚨 KERALA-WIDE HARTHAL DECLARED! TRAFFIC HALTED!');
    } else if (abilityName === 'nakabandi') {
      this.showAlert('🚓 POLICE NAKABANDI ROADBLOCK ACTIVATED!');
    }
  }

  toggleAudio() {
    const isMuted = window.kurupAudio.toggleMute();
    this.showAlert(isMuted ? 'Audio Muted' : 'Audio Enabled');
  }

  toggleCaseFile() {
    const modal = document.getElementById('casefileModal');
    modal.style.display = (modal.style.display === 'flex' ? 'none' : 'flex');
    if (modal.style.display === 'flex') {
      this.renderCaseFile();
    }
  }

  showAlert(text) {
    const ticker = document.getElementById('alert-ticker');
    ticker.textContent = text;
    ticker.style.display = 'block';
    clearTimeout(this.alertTimer);
    this.alertTimer = setTimeout(() => {
      ticker.style.display = 'none';
    }, 3200);
  }

  // ==========================================
  // GAME UPDATE LOOP & PHYSICS
  // ==========================================
  update(dt) {
    window.kurupSprites.update();

    // 1. Calculate Player Movement
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

    if (this.player.vehicleId) {
      // VEHICLE DRIVING PHYSICS
      const currentVehicle = this.vehicles.find(v => v.id === this.player.vehicleId);
      const maxSpeed = (currentVehicle ? currentVehicle.maxSpeed : 6.0) * (this.harthalActive ? 0.4 : 1.0);

      if (isMoving) {
        const targetAngle = Math.atan2(moveY, moveX);
        let angleDiff = targetAngle - this.player.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        this.player.angle += angleDiff * 0.12; // Steering response
        this.player.speed = Math.min(maxSpeed, this.player.speed + 0.25);
      } else {
        this.player.speed *= 0.94; // Deceleration
      }

      this.player.x += Math.cos(this.player.angle) * this.player.speed;
      this.player.y += Math.sin(this.player.angle) * this.player.speed;
      window.kurupAudio.updateEngine(this.player.speed, maxSpeed);

    } else {
      // ON-FOOT MOVEMENT PHYSICS
      if (isMoving) {
        this.player.angle = Math.atan2(moveY, moveX);
        const baseSpeed = isSprint && this.player.stamina > 5 ? 4.2 : 2.6;
        this.player.speed = baseSpeed * (this.harthalActive ? 0.8 : 1.0);

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
    this.viewport.x += (targetVx - this.viewport.x) * 0.1;
    this.viewport.y += (targetVy - this.viewport.y) * 0.1;

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
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(clue.found ? '✓ FOUND' : '🔍 CLUE', 0, -14);
      ctx.restore();
    }

    // 3. Draw Vehicles
    for (const v of this.vehicles) {
      window.kurupSprites.drawVehicle(ctx, v);
    }

    // 4. Draw Other Players
    for (const pid in this.players) {
      const p = this.players[pid];
      if (!p.vehicleId) {
        window.kurupSprites.drawCharacter(ctx, p, false);
      }
    }

    // 5. Draw Local Player (if not inside vehicle)
    if (!this.player.vehicleId) {
      window.kurupSprites.drawCharacter(ctx, this.player, true);
    }

    // 6. Draw AI Kurup (if active)
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

    // 7. Day / Night & Monsoon Atmosphere Overlay
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

    // 8. Render Radar Minimap
    window.kurupWorldMap.drawMinimap(
      this.minimapCanvas,
      this.player,
      this.vehicles,
      this.kurupState,
      this.clues
    );
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
  }

  renderCaseFile() {
    const list = document.getElementById('cluesList');
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

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new KurupGame();
});
