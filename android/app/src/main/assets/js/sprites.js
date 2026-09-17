// Operation Kurup: Procedural Canvas Pixel & Vector Sprite Renderer
// Renders authentic Kerala characters, cultural dress styles, multi-era vehicles, and landmarks

// Universal cross-browser rounded rectangle path builder
function drawRoundedRect(ctx, x, y, w, h, radii) {
  if (!radii) radii = 0;
  let tl = 0, tr = 0, br = 0, bl = 0;
  if (typeof radii === 'number') {
    tl = tr = br = bl = radii;
  } else if (Array.isArray(radii)) {
    tl = radii[0] || 0;
    tr = radii[1] || 0;
    br = radii[2] || 0;
    bl = radii[3] || 0;
  }
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl);
  ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
}
window.drawRoundedRect = drawRoundedRect;

class KurupSpriteRenderer {
  constructor() {
    this.animTick = 0;
  }

  update() {
    this.animTick += 0.05;
  }

  // ==========================================
  // HELPER: draw a gradient-filled ellipse (shadow / glow)
  // ==========================================
  _drawShadow(ctx, x, y, rx, ry, alpha) {
    const g = ctx.createRadialGradient(x, y + ry * 0.3, 0, x, y, Math.max(rx, ry));
    g.addColorStop(0, `rgba(0,0,0,${alpha})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==========================================
  // CHARACTERS — realistic proportions & shading
  // Scale: ~36px tall total. Head=8px, torso=11px, legs=11px, feet=4px
  // ==========================================
  drawCharacter(ctx, player, isCurrent = false) {
    if (!player || isNaN(player.x) || isNaN(player.y)) return;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle + Math.PI / 2); // face direction of travel

    const isMoving = Math.abs(player.speed) > 0.25;
    const swing = isMoving ? Math.sin(this.animTick * 9) : 0;
    const bob   = isMoving ? Math.abs(Math.sin(this.animTick * 9)) * 1.5 : 0;

    const faction = player.faction || 'police';
    const disguise = player.disguise || 'default';

    // ---- SKIN TONE ----
    // Authentic South Indian skin — warm brown
    const skinBase  = '#c28a5a';
    const skinShade = '#a8714a';
    const skinLight = '#d9a47a';

    // ---- SHADOW ----
    this._drawShadow(ctx, 0, 10, 14, 7, 0.38);

    // ---- FEET / SHOES ----
    const footL = -4 + swing * 5;
    const footR =  4 - swing * 5;
    let shoeCol = '#1a1a2e';
    if (faction === 'red_cadre' || faction === 'tricolor_cadre') shoeCol = '#92400e'; // sandals
    if (disguise === 'sanyasi') shoeCol = skinBase; // barefoot

    ctx.fillStyle = shoeCol;
    // Left foot
    ctx.beginPath();
    ctx.ellipse(-3.5, 10 + footL * 0.3, 3.5, 2.2, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Right foot
    ctx.beginPath();
    ctx.ellipse(3.5, 10 + footR * 0.3, 3.5, 2.2, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // ---- LEGS ----
    let legColTop = '#374151', legColBot = '#1f2937';
    if (faction === 'police' && disguise !== 'sanyasi') {
      legColTop = '#b8a06a'; legColBot = '#9e8a55'; // khaki
    } else if (faction === 'red_cadre' || faction === 'tricolor_cadre') {
      legColTop = '#f8fafc'; legColBot = '#e2e8f0'; // white mundu
    } else if (faction === 'gulf_syndicate' || disguise === 'gulf_tycoon') {
      legColTop = '#7c2d12'; legColBot = '#92400e'; // bell-bottoms
    } else if (disguise === 'sanyasi') {
      legColTop = '#f97316'; legColBot = '#ea580c'; // saffron
    }

    // Left leg with gradient
    const lgL = ctx.createLinearGradient(-6, 0, -2, 0);
    lgL.addColorStop(0, legColTop); lgL.addColorStop(1, legColBot);
    ctx.fillStyle = lgL;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.quadraticCurveTo(-7 + swing * 3, 5, -4 + swing * 5, 10);
    ctx.lineTo(-2 + swing * 5, 10);
    ctx.quadraticCurveTo(-1, 5, -2, 0);
    ctx.closePath();
    ctx.fill();

    // Right leg
    const lgR = ctx.createLinearGradient(2, 0, 6, 0);
    lgR.addColorStop(0, legColBot); lgR.addColorStop(1, legColTop);
    ctx.fillStyle = lgR;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.quadraticCurveTo(1, 5, 3 - swing * 5, 10);
    ctx.lineTo(6 - swing * 5, 10);
    ctx.quadraticCurveTo(7 - swing * 3, 5, 6, 0);
    ctx.closePath();
    ctx.fill();

    // Mundu border stripe (Kerala cadres)
    if (faction === 'red_cadre') {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-7, 2, 14, 1.5);
    } else if (faction === 'tricolor_cadre') {
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-7, 2, 14, 1);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(-7, 3.5, 14, 1);
    }

    // ---- TORSO ----
    let torsoCol = '#c5ae7b', torsoShade = '#a8935e';
    let beltOn = false;
    if (faction === 'police' && disguise !== 'sanyasi') {
      torsoCol = '#c5ae7b'; torsoShade = '#a8935e'; beltOn = true;
    } else if (faction === 'red_cadre') {
      torsoCol = '#f8fafc'; torsoShade = '#d1d5db';
    } else if (faction === 'tricolor_cadre') {
      torsoCol = '#fef3c7'; torsoShade = '#fde68a';
    } else if (faction === 'gulf_syndicate' || disguise === 'gulf_tycoon') {
      torsoCol = '#d97706'; torsoShade = '#b45309';
    } else if (disguise === 'sanyasi') {
      torsoCol = '#f97316'; torsoShade = '#ea580c';
    } else if (disguise === 'toddy_tapper') {
      torsoCol = skinBase; torsoShade = skinShade; // bare chest
    }

    const tg = ctx.createLinearGradient(-7, -12, 7, 0);
    tg.addColorStop(0, torsoCol);
    tg.addColorStop(1, torsoShade);
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.bezierCurveTo(-8, -4, -8, -10, -5, -12);
    ctx.lineTo(5, -12);
    ctx.bezierCurveTo(8, -10, 8, -4, 7, 0);
    ctx.closePath();
    ctx.fill();

    // Torso outline for depth
    ctx.strokeStyle = torsoShade;
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Police badge
    if (faction === 'police' && disguise !== 'sanyasi') {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(-3, -7, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Police Sam Browne belt
    if (beltOn) {
      ctx.fillStyle = '#3b2010';
      ctx.fillRect(-7.5, -2.5, 15, 2.5);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.rect(-2, -2.3, 4, 2.2);
      ctx.fill();
      // Diagonal strap
      ctx.strokeStyle = '#3b2010';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-5, -12);
      ctx.lineTo(0, -2.5);
      ctx.stroke();
    }

    // Red cadre towel on shoulder
    if (faction === 'red_cadre') {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(-8, -12);
      ctx.quadraticCurveTo(-10, -8, -9, 0);
      ctx.lineTo(-6, 0);
      ctx.quadraticCurveTo(-7, -8, -5, -12);
      ctx.closePath();
      ctx.fill();
    }

    // Gulf gold chain
    if (faction === 'gulf_syndicate' || disguise === 'gulf_tycoon') {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -8, 3.5, 0.3, Math.PI - 0.3);
      ctx.stroke();
    }

    // Rudraksha mala (sanyasi)
    if (disguise === 'sanyasi') {
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, -7, 4, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * 0.1 + (i / 4) * Math.PI * 0.8;
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 4, -7 + Math.sin(a) * 4, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ---- ARMS ----
    const armCol = faction === 'police' && disguise !== 'sanyasi' ? '#c5ae7b'
                 : (disguise === 'sanyasi' || disguise === 'toddy_tapper') ? skinBase
                 : torsoCol;
    // Left arm (swings forward with right leg)
    ctx.strokeStyle = armCol;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, -10);
    ctx.quadraticCurveTo(-10, -5, -8 - swing * 4, 2);
    ctx.stroke();
    // Right arm
    ctx.beginPath();
    ctx.moveTo(6, -10);
    ctx.quadraticCurveTo(10, -5, 8 + swing * 4, 2);
    ctx.stroke();

    // Police lathi in right hand
    if (faction === 'police' && disguise !== 'sanyasi') {
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8 + swing * 4, 2);
      ctx.lineTo(12 + swing * 4, 14);
      ctx.stroke();
    }
    // Red flag on bamboo stick
    if (faction === 'red_cadre') {
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(8 + swing * 3, 2);
      ctx.lineTo(10 + swing * 3, -18);
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(10 + swing * 3, -18);
      ctx.lineTo(10 + swing * 3, -10);
      ctx.lineTo(18 + swing * 3, -14);
      ctx.closePath();
      ctx.fill();
    }

    // ---- NECK ----
    const ng = ctx.createLinearGradient(-2.5, -14, 2.5, -12);
    ng.addColorStop(0, skinLight); ng.addColorStop(1, skinBase);
    ctx.fillStyle = ng;
    ctx.beginPath();
    ctx.ellipse(0, -13, 2.5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // ---- HEAD ----
    // Head bob while walking
    const headY = -20 - bob * 0.5;
    const hg = ctx.createRadialGradient(-2, headY - 2, 1, 0, headY, 7);
    hg.addColorStop(0, skinLight);
    hg.addColorStop(0.6, skinBase);
    hg.addColorStop(1, skinShade);
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.ellipse(0, headY, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = skinShade;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // EYES
    ctx.fillStyle = '#1a0a00';
    ctx.beginPath();
    ctx.ellipse(-2.2, headY - 0.5, 1.4, 1.1, 0.1, 0, Math.PI * 2);
    ctx.ellipse(2.2, headY - 0.5, 1.4, 1.1, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // Eye whites
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-2.5, headY - 0.7, 0.7, 0.5, 0, 0, Math.PI * 2);
    ctx.ellipse(2.5, headY - 0.7, 0.7, 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Aviators (gulf_tycoon)
    if (disguise === 'gulf_tycoon' || faction === 'gulf_syndicate') {
      ctx.fillStyle = 'rgba(10,10,30,0.82)';
      ctx.beginPath();
      ctx.ellipse(-2.2, headY - 0.5, 2.2, 1.6, 0.1, 0, Math.PI * 2);
      ctx.ellipse(2.2, headY - 0.5, 2.2, 1.6, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      // Bridge
      ctx.beginPath();
      ctx.moveTo(-0.5, headY - 0.5);
      ctx.lineTo(0.5, headY - 0.5);
      ctx.stroke();
    }

    // NOSE
    ctx.strokeStyle = skinShade;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, headY - 0.3);
    ctx.quadraticCurveTo(1.4, headY + 0.8, 0.8, headY + 1.6);
    ctx.stroke();

    // MOUTH — slight smile
    ctx.strokeStyle = '#7a3b1e';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(0, headY + 2.5, 2, 0.15, Math.PI - 0.15);
    ctx.stroke();

    // SIGNATURE MALAYALI MEESHA (mustache)
    ctx.fillStyle = '#1a0a00';
    ctx.beginPath();
    ctx.moveTo(-2.8, headY + 1.2);
    ctx.bezierCurveTo(-2.5, headY + 0.2, -0.5, headY + 0.5, 0, headY + 0.8);
    ctx.bezierCurveTo(0.5, headY + 0.5, 2.5, headY + 0.2, 2.8, headY + 1.2);
    ctx.bezierCurveTo(2.2, headY + 1.8, 0.5, headY + 1.5, 0, headY + 1.6);
    ctx.bezierCurveTo(-0.5, headY + 1.5, -2.2, headY + 1.8, -2.8, headY + 1.2);
    ctx.closePath();
    ctx.fill();

    // HAIR & HEADWEAR
    if (faction === 'police' && disguise !== 'sanyasi') {
      // Police peaked cap with red band
      ctx.fillStyle = '#8f7748';
      ctx.beginPath();
      ctx.ellipse(0, headY - 6.5, 7, 3.5, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a6438';
      ctx.fillRect(-7, headY - 7.5, 14, 2);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-7, headY - 7, 14, 1.2);
      // Peak visor
      ctx.fillStyle = '#5c4e2e';
      ctx.beginPath();
      ctx.ellipse(0, headY - 5.5, 8.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Gold badge on cap
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, headY - 7.2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (disguise === 'sanyasi') {
      // Matted hair bun + tilak
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.ellipse(0, headY - 7.5, 4.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // White tilak
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, headY - 2, 1, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (faction === 'gulf_syndicate' || disguise === 'gulf_tycoon') {
      // Puffed 80s hair
      ctx.fillStyle = '#1c1007';
      ctx.beginPath();
      ctx.ellipse(0, headY - 6, 6.5, 5, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      // Slight wave highlight
      ctx.strokeStyle = '#3d2b14';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-5, headY - 5);
      ctx.quadraticCurveTo(-1, headY - 9, 5, headY - 5);
      ctx.stroke();
    } else {
      // Classic wavy black hair
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.ellipse(0, headY - 6, 6, 4.5, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    }

    // Ear
    ctx.fillStyle = skinBase;
    ctx.beginPath();
    ctx.ellipse(-6, headY, 1.2, 1.8, -0.3, 0, Math.PI * 2);
    ctx.ellipse(6, headY, 1.2, 1.8, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // ---- PLAYER INDICATOR RING ----
    if (isCurrent) {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    // ---- NAME TAG (drawn in screen space after rotation) ----
    ctx.save();
    const tagY = player.y - 30;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 5;
    ctx.fillStyle = isCurrent ? '#38bdf8' : '#f3f4f6';
    ctx.fillText(player.name || '', player.x, tagY);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ==========================================
  // VEHICLES — realistic shapes, gradients, detail
  // ==========================================
  drawVehicle(ctx, v) {
    if (!v || isNaN(v.x) || isNaN(v.y)) return;
    const angle = isNaN(v.angle) ? 0 : v.angle;

    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.rotate(angle);

    // Drop shadow
    this._drawShadow(ctx, 3, 5, 32, 15, 0.5);

    // Driver halo & headlight beams
    if (v.driverId) {
      const isLocal = Boolean(window.gameInstance && window.gameInstance.player.id === v.driverId);
      ctx.strokeStyle = isLocal ? '#38bdf8' : '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = isLocal ? '#38bdf8' : '#fbbf24';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(0, 0, 34, 20, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Headlight cone
      const beamG = ctx.createLinearGradient(20, 0, 85, 0);
      beamG.addColorStop(0, 'rgba(255,240,160,0.35)');
      beamG.addColorStop(1, 'rgba(255,240,160,0)');
      ctx.fillStyle = beamG;
      ctx.beginPath();
      ctx.moveTo(20, -10);
      ctx.lineTo(85, -32);
      ctx.lineTo(85, 32);
      ctx.lineTo(20, 10);
      ctx.closePath();
      ctx.fill();
    }

    const t = v.type;

    // ---- AMBASSADOR (POLICE & TAXI) ----
    if (t === 'ambassador_police' || t === 'ambassador_taxi') {
      const isPolice = (t === 'ambassador_police');
      const bodyColor = v.color || (isPolice ? '#f0f4f8' : '#1c1c1c');
      const roofColor = isPolice ? '#f0f4f8' : (v.roofColor || '#f1c40f');

      // Tyre wells
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath(); ctx.ellipse(-13, -15, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(13, -15, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-13, 15, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(13, 15, 7, 4, 0, 0, Math.PI * 2); ctx.fill();

      // Tyres
      [['-', '-'], ['+', '-'], ['-', '+'], ['+', '+']].forEach(([sx, sy]) => {
        const wx = (sx === '-' ? -1 : 1) * 16;
        const wy = (sy === '-' ? -1 : 1) * 13;
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.ellipse(wx, wy, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.ellipse(wx, wy, 3, 5.5, 0, 0, Math.PI * 2); ctx.fill();
        // Hubcap
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath(); ctx.ellipse(wx, wy, 2, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      });

      // Body — rounded classic shape
      const bodyG = ctx.createLinearGradient(-24, -14, 24, 14);
      bodyG.addColorStop(0, lightenColor(bodyColor, 25));
      bodyG.addColorStop(0.5, bodyColor);
      bodyG.addColorStop(1, darkenColor(bodyColor, 20));
      ctx.fillStyle = bodyG;
      ctx.beginPath();
      ctx.moveTo(-24, -10);
      ctx.bezierCurveTo(-26, -10, -26, 10, -24, 10);
      ctx.lineTo(22, 10);
      ctx.bezierCurveTo(26, 10, 27, 6, 27, 0);
      ctx.bezierCurveTo(27, -6, 26, -10, 22, -10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = darkenColor(bodyColor, 30);
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Cabin / greenhouse
      const cabinG = ctx.createLinearGradient(-10, -12, 12, 0);
      cabinG.addColorStop(0, roofColor);
      cabinG.addColorStop(1, darkenColor(roofColor, 15));
      ctx.fillStyle = cabinG;
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.bezierCurveTo(-11, -10, -12, -4, -12, 0);
      ctx.lineTo(12, 0);
      ctx.bezierCurveTo(12, -4, 12, -10, 10, -10);
      ctx.closePath();
      ctx.fill();

      // Windscreen (front glass — subtle blue tint)
      ctx.fillStyle = 'rgba(150,200,255,0.28)';
      ctx.beginPath();
      ctx.moveTo(10, -9);
      ctx.lineTo(20, -9);
      ctx.bezierCurveTo(22, -9, 23, -5, 23, 0);
      ctx.lineTo(12, 0);
      ctx.bezierCurveTo(12, -5, 11, -9, 10, -9);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(100,160,255,0.4)';
      ctx.lineWidth = 0.6;
      ctx.stroke();

      // Rear windshield
      ctx.fillStyle = 'rgba(150,200,255,0.22)';
      ctx.beginPath();
      ctx.moveTo(-10, -9);
      ctx.lineTo(-20, -9);
      ctx.lineTo(-21, 0);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();

      // Side windows
      ctx.fillStyle = 'rgba(150,200,255,0.2)';
      ctx.strokeStyle = 'rgba(100,160,255,0.3)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.rect(-8, -9, 16, 9);
      ctx.fill();
      ctx.stroke();

      // Chrome front bumper & grille
      const chromeG = ctx.createLinearGradient(22, -8, 28, 8);
      chromeG.addColorStop(0, '#e8e8e8');
      chromeG.addColorStop(0.5, '#ffffff');
      chromeG.addColorStop(1, '#b0b0b0');
      ctx.fillStyle = chromeG;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(22, -8, 5, 16, 2) : ctx.rect(22, -8, 5, 16);
      ctx.fill();

      // Grille slats
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 0.6;
      for (let i = -5; i <= 5; i += 2.5) {
        ctx.beginPath(); ctx.moveTo(23, i); ctx.lineTo(26, i); ctx.stroke();
      }

      // Round headlights
      const hlG = ctx.createRadialGradient(24, -7, 0, 24, -7, 3);
      hlG.addColorStop(0, '#fffde0'); hlG.addColorStop(1, '#f59e0b');
      ctx.fillStyle = hlG;
      ctx.beginPath(); ctx.arc(24, -7, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hlG;
      ctx.beginPath(); ctx.arc(24, 7, 3, 0, Math.PI * 2); ctx.fill();

      // Tail lights
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.arc(-25, -7, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-25, 7, 2.5, 0, Math.PI * 2); ctx.fill();

      // Police beacon (flashing)
      if (v.beacon) {
        const flashOn = Math.floor(this.animTick * 10) % 2 === 0;
        ctx.shadowColor = flashOn ? '#ef4444' : '#3b82f6';
        ctx.shadowBlur = 16;
        ctx.fillStyle = flashOn ? '#ef4444' : '#3b82f6';
        ctx.beginPath();
        ctx.arc(2, -1, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Siren bar
        ctx.fillStyle = flashOn ? '#3b82f6' : '#ef4444';
        ctx.beginPath();
        ctx.arc(-3, -1, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Taxi roof sign
      if (t === 'ambassador_taxi') {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-6, -13, 12, 4);
        ctx.fillStyle = '#111';
        ctx.font = 'bold 3.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TAXI', 0, -10);
      }

      // Police side stripe
      if (isPolice) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(-20, -10.5);
        ctx.lineTo(20, -10.5);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // ---- ROYAL ENFIELD BULLET 350 ----
    else if (t === 'bullet350') {
      // Frame
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-12, 5);
      ctx.bezierCurveTo(-12, -2, -2, -6, 2, -6);
      ctx.bezierCurveTo(8, -6, 14, -2, 14, 5);
      ctx.stroke();

      // Rear wheel
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(-12, 5, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath(); ctx.arc(-12, 5, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 0.8;
      for (let s = 0; s < 8; s++) {
        const a = (s / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(-12 + Math.cos(a) * 2, 5 + Math.sin(a) * 2);
        ctx.lineTo(-12 + Math.cos(a) * 6.5, 5 + Math.sin(a) * 6.5);
        ctx.stroke();
      }
      ctx.fillStyle = '#c0c0c0';
      ctx.beginPath(); ctx.arc(-12, 5, 2.5, 0, Math.PI * 2); ctx.fill();

      // Front wheel
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(14, 5, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath(); ctx.arc(14, 5, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 0.8;
      for (let s = 0; s < 8; s++) {
        const a = (s / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(14 + Math.cos(a) * 2, 5 + Math.sin(a) * 2);
        ctx.lineTo(14 + Math.cos(a) * 5.5, 5 + Math.sin(a) * 5.5);
        ctx.stroke();
      }
      ctx.fillStyle = '#c0c0c0';
      ctx.beginPath(); ctx.arc(14, 5, 2, 0, Math.PI * 2); ctx.fill();

      // Teardrop fuel tank with gradient
      const tankG = ctx.createRadialGradient(-1, -6, 1, 0, -3, 8);
      tankG.addColorStop(0, '#2a2a2a');
      tankG.addColorStop(1, '#0a0a0a');
      ctx.fillStyle = tankG;
      ctx.beginPath();
      ctx.ellipse(0, -3, 9, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Gold pinstripe
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(0, -3, 9, 5.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Royal Enfield logo hint
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 3px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RE', 0, -2);

      // Engine block
      ctx.fillStyle = '#3a3a3a';
      ctx.beginPath();
      ctx.rect(-5, 0, 10, 7);
      ctx.fill();
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.rect(-4, 1, 8, 2);
      ctx.fill();

      // Chrome exhaust pipe
      const exG = ctx.createLinearGradient(-12, 8, 10, 8);
      exG.addColorStop(0, '#999'); exG.addColorStop(0.5, '#fff'); exG.addColorStop(1, '#aaa');
      ctx.strokeStyle = exG;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-10, 8);
      ctx.bezierCurveTo(-5, 10, 5, 10, 10, 8);
      ctx.stroke();

      // Headlamp
      const hlG2 = ctx.createRadialGradient(18, 2, 0, 18, 2, 4);
      hlG2.addColorStop(0, '#fffde0'); hlG2.addColorStop(1, '#f59e0b');
      ctx.fillStyle = hlG2;
      ctx.beginPath(); ctx.arc(18, 2, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c0c0c0';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Handlebar
      ctx.strokeStyle = '#c0c0c0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, -8);
      ctx.lineTo(10, 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, -8);
      ctx.bezierCurveTo(10, -9, 12, -9, 14, -7);
      ctx.stroke();

      // Leather seat
      ctx.fillStyle = '#5c3d1e';
      ctx.beginPath();
      ctx.ellipse(-4, -7, 7, 3, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- KSRTC BUS ----
    else if (t === 'ksrtc_bus') {
      const busRed = v.color || '#c0392b';
      const stripe = v.stripeColor || '#f1c40f';

      // Tyres (6 wheels)
      [[-28, -17], [-28, 17], [0, -17], [0, 17], [26, -17], [26, 17]].forEach(([wx, wy]) => {
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.ellipse(wx, wy, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.ellipse(wx, wy, 3.5, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#aaa';
        ctx.beginPath(); ctx.ellipse(wx, wy, 1.8, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      });

      // Body
      const busG = ctx.createLinearGradient(-42, -16, 42, 16);
      busG.addColorStop(0, lightenColor(busRed, 15));
      busG.addColorStop(0.5, busRed);
      busG.addColorStop(1, darkenColor(busRed, 15));
      ctx.fillStyle = busG;
      ctx.beginPath();
      ctx.moveTo(-40, -15);
      ctx.bezierCurveTo(-43, -15, -43, 15, -40, 15);
      ctx.lineTo(38, 15);
      ctx.bezierCurveTo(43, 15, 44, 8, 44, 0);
      ctx.bezierCurveTo(44, -8, 43, -15, 38, -15);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = darkenColor(busRed, 25);
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Yellow speed stripe (full length)
      ctx.fillStyle = stripe;
      ctx.fillRect(-40, -6, 83, 12);

      // KSRTC lettering on stripe
      ctx.fillStyle = busRed;
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KSRTC', 0, 4);

      // Side windows row
      ctx.fillStyle = 'rgba(150,200,255,0.3)';
      ctx.strokeStyle = 'rgba(100,160,255,0.4)';
      ctx.lineWidth = 0.5;
      for (let wx = -33; wx <= 22; wx += 13) {
        ctx.beginPath(); ctx.rect(wx, -14, 10, 7); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.rect(wx, 7, 10, 7); ctx.fill(); ctx.stroke();
      }

      // Front windshield
      ctx.fillStyle = 'rgba(150,200,255,0.35)';
      ctx.beginPath();
      ctx.moveTo(36, -14);
      ctx.lineTo(42, -10);
      ctx.lineTo(42, 10);
      ctx.lineTo(36, 14);
      ctx.closePath();
      ctx.fill();

      // Front destination board
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.rect(28, -14, 8, 6); ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 3px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EXP', 32, -10);

      // Front headlights
      ctx.fillStyle = '#fffde0';
      ctx.beginPath(); ctx.ellipse(42, -10, 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(42, 10, 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();

      // Rear tail lights
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.ellipse(-41, -10, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-41, 10, 2, 3, 0, 0, Math.PI * 2); ctx.fill();

      // Roof ventilator
      ctx.fillStyle = darkenColor(busRed, 10);
      ctx.beginPath(); ctx.rect(-20, -17, 40, 3); ctx.fill();
    }

    // ---- BAJAJ CHETAK SCOOTER ----
    else if (t === 'chetak') {
      const sCol = v.color || '#27ae60';
      // Wheels
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(-10, 5, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.arc(-10, 5, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#999';
      ctx.beginPath(); ctx.arc(-10, 5, 2, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(10, 5, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.arc(10, 5, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#999';
      ctx.beginPath(); ctx.arc(10, 5, 2, 0, Math.PI * 2); ctx.fill();

      // Body shell
      const cG = ctx.createRadialGradient(-2, -3, 1, 0, 0, 14);
      cG.addColorStop(0, lightenColor(sCol, 20));
      cG.addColorStop(1, darkenColor(sCol, 10));
      ctx.fillStyle = cG;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = darkenColor(sCol, 20);
      ctx.lineWidth = 0.7;
      ctx.stroke();

      // Floorboard
      ctx.fillStyle = darkenColor(sCol, 15);
      ctx.beginPath(); ctx.rect(-6, 2, 12, 5); ctx.fill();

      // Spare tyre bulge on side
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath(); ctx.arc(-10, -5, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#444';
      ctx.beginPath(); ctx.arc(-10, -5, 2.5, 0, Math.PI * 2); ctx.fill();

      // Headlamp
      ctx.fillStyle = '#fffde0';
      ctx.beginPath(); ctx.arc(13, 0, 3, 0, Math.PI * 2); ctx.fill();

      // Handlebar
      ctx.strokeStyle = '#c0c0c0';
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(8, -6); ctx.lineTo(8, 6); ctx.stroke();
    }

    // ---- KETTUVALLAM (COUNTRY BOAT) ----
    else if (t === 'kettuvallam') {
      // Water ripple beneath
      ctx.strokeStyle = 'rgba(56,189,248,0.3)';
      ctx.lineWidth = 2;
      for (let w = 0; w < 3; w++) {
        const wOff = Math.sin(this.animTick * 2 + w) * 3;
        ctx.beginPath();
        ctx.ellipse(0, 8 + w * 4, 35 - w * 4, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Wooden hull with planking
      const hullG = ctx.createLinearGradient(-35, -2, 35, 2);
      hullG.addColorStop(0, '#3d2710');
      hullG.addColorStop(0.5, '#5c3d1e');
      hullG.addColorStop(1, '#3d2710');
      ctx.fillStyle = hullG;
      ctx.beginPath();
      ctx.moveTo(-35, 2);
      ctx.bezierCurveTo(-30, -12, 30, -12, 35, 2);
      ctx.bezierCurveTo(30, 12, -30, 12, -35, 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2a1a08';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Plank lines
      ctx.strokeStyle = '#2a1a08';
      ctx.lineWidth = 0.5;
      for (let p = -25; p <= 25; p += 8) {
        ctx.beginPath();
        ctx.moveTo(p, -11);
        ctx.bezierCurveTo(p, -4, p, 4, p, 11);
        ctx.stroke();
      }

      // Thatched canopy
      const thatchG = ctx.createLinearGradient(-15, -10, 15, -10);
      thatchG.addColorStop(0, '#92400e');
      thatchG.addColorStop(0.5, '#d97706');
      thatchG.addColorStop(1, '#92400e');
      ctx.fillStyle = thatchG;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.bezierCurveTo(-18, -14, 18, -14, 18, 0);
      ctx.closePath();
      ctx.fill();
      // Bamboo ribs on canopy
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 1;
      for (let r = -14; r <= 14; r += 5) {
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.bezierCurveTo(r, -7, r, -12, r, -14);
        ctx.stroke();
      }

      // Punting pole
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, -5);
      ctx.lineTo(32, 14);
      ctx.stroke();
    }

    // ---- HM CONTESSA ----
    else if (t === 'contessa') {
      const cCol = v.color || '#881337';
      // Tyres
      [[-18, -13], [16, -13], [-18, 13], [16, 13]].forEach(([wx, wy]) => {
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(wx, wy, 5, 7.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.ellipse(wx, wy, 3.5, 5.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#bbb'; ctx.beginPath(); ctx.ellipse(wx, wy, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
      });

      // Body — muscular boxy American-inspired shape
      const cG2 = ctx.createLinearGradient(-26, -12, 26, 12);
      cG2.addColorStop(0, lightenColor(cCol, 20));
      cG2.addColorStop(0.5, cCol);
      cG2.addColorStop(1, darkenColor(cCol, 15));
      ctx.fillStyle = cG2;
      ctx.beginPath();
      ctx.moveTo(-26, -11);
      ctx.bezierCurveTo(-28, -11, -28, 11, -26, 11);
      ctx.lineTo(24, 11);
      ctx.bezierCurveTo(28, 11, 28, -11, 24, -11);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = darkenColor(cCol, 30);
      ctx.lineWidth = 0.7;
      ctx.stroke();

      // Cabin
      ctx.fillStyle = darkenColor(cCol, 5);
      ctx.beginPath(); ctx.rect(-14, -10, 24, 10); ctx.fill();
      ctx.fillStyle = 'rgba(150,200,255,0.3)';
      ctx.beginPath(); ctx.rect(-12, -9, 20, 9); ctx.fill();

      // Quad headlights
      ctx.fillStyle = '#fffde0';
      ctx.beginPath(); ctx.rect(22, -10, 5, 4); ctx.fill();
      ctx.beginPath(); ctx.rect(22, -4, 5, 4); ctx.fill();
      ctx.beginPath(); ctx.rect(22, 2, 5, 4); ctx.fill();
      ctx.beginPath(); ctx.rect(22, 8, 5, 4); ctx.fill();

      // Chrome bumper bar
      const chrG = ctx.createLinearGradient(24, -12, 28, 12);
      chrG.addColorStop(0, '#ccc'); chrG.addColorStop(0.5, '#fff'); chrG.addColorStop(1, '#aaa');
      ctx.fillStyle = chrG;
      ctx.fillRect(24, -12, 5, 24);

      // Tail lights
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.rect(-28, -10, 3, 6); ctx.fill();
      ctx.beginPath(); ctx.rect(-28, 4, 3, 6); ctx.fill();
    }

    // ---- AUTO RICKSHAW ----
    else if (t === 'auto_rickshaw') {
      // Single front wheel
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.ellipse(12, 5, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.ellipse(12, 5, 3.5, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#aaa';
      ctx.beginPath(); ctx.ellipse(12, 5, 1.5, 2, 0, 0, Math.PI * 2); ctx.fill();

      // Two rear wheels
      [[-10, -12], [-10, 12]].forEach(([wx, wy]) => {
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(wx, wy, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.ellipse(wx, wy, 3.5, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#aaa'; ctx.beginPath(); ctx.ellipse(wx, wy, 1.5, 2, 0, 0, Math.PI * 2); ctx.fill();
      });

      // Yellow canopy
      const hoodG = ctx.createLinearGradient(-14, -10, 14, 10);
      hoodG.addColorStop(0, '#fde68a'); hoodG.addColorStop(1, '#f59e0b');
      ctx.fillStyle = hoodG;
      ctx.beginPath();
      ctx.moveTo(-14, -9);
      ctx.bezierCurveTo(-14, -14, 14, -14, 14, -9);
      ctx.lineTo(14, 9);
      ctx.bezierCurveTo(14, 14, -14, 14, -14, 9);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Black lower cab
      ctx.fillStyle = '#1f2937';
      ctx.beginPath(); ctx.rect(-13, -8, 27, 16); ctx.fill();

      // Windshield
      ctx.fillStyle = 'rgba(150,200,255,0.35)';
      ctx.beginPath(); ctx.rect(6, -7, 6, 14); ctx.fill();

      // Headlight
      ctx.fillStyle = '#fffde0';
      ctx.beginPath(); ctx.ellipse(14, 0, 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();

      // Meter / dashboard strip
      ctx.fillStyle = '#374151';
      ctx.beginPath(); ctx.rect(4, -4, 4, 8); ctx.fill();
    }

    // ---- TATA SUMO / BOLERO (generic SUV) ----
    else if (t === 'tata_sumo' || t === 'bolero_police') {
      const suvCol = v.color || '#f3f4f6';
      const isPolSuv = t === 'bolero_police';

      [[-18, -14], [16, -14], [-18, 14], [16, 14]].forEach(([wx, wy]) => {
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(wx, wy, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.ellipse(wx, wy, 4, 5.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c0c0c0'; ctx.beginPath(); ctx.ellipse(wx, wy, 2, 2.8, 0, 0, Math.PI * 2); ctx.fill();
      });

      const sG = ctx.createLinearGradient(-26, -14, 26, 14);
      sG.addColorStop(0, lightenColor(suvCol, 15));
      sG.addColorStop(0.5, suvCol);
      sG.addColorStop(1, darkenColor(suvCol, 15));
      ctx.fillStyle = sG;
      ctx.beginPath();
      ctx.moveTo(-26, -13);
      ctx.bezierCurveTo(-28, -13, -28, 13, -26, 13);
      ctx.lineTo(24, 13);
      ctx.bezierCurveTo(28, 13, 28, -13, 24, -13);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = darkenColor(suvCol, 25);
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Full-length cabin
      ctx.fillStyle = darkenColor(suvCol, 5);
      ctx.beginPath(); ctx.rect(-22, -12, 44, 12); ctx.fill();

      // Windows
      ctx.fillStyle = 'rgba(150,200,255,0.3)';
      ctx.strokeStyle = 'rgba(100,160,255,0.3)';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.rect(-18, -11, 12, 11); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.rect(-4, -11, 12, 11); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.rect(10, -11, 11, 11); ctx.fill(); ctx.stroke();

      // Windshield
      ctx.fillStyle = 'rgba(150,200,255,0.35)';
      ctx.beginPath();
      ctx.moveTo(22, -12); ctx.lineTo(27, -9); ctx.lineTo(27, 9); ctx.lineTo(22, 12);
      ctx.closePath(); ctx.fill();

      // Headlights (rectangular)
      ctx.fillStyle = '#fffde0';
      ctx.beginPath(); ctx.rect(24, -12, 5, 6); ctx.fill();
      ctx.beginPath(); ctx.rect(24, 6, 5, 6); ctx.fill();

      // Tail lights
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.rect(-28, -11, 3, 6); ctx.fill();
      ctx.beginPath(); ctx.rect(-28, 5, 3, 6); ctx.fill();

      // Roof bars on Sumo
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1.5;
      for (let b = -15; b <= 15; b += 10) {
        ctx.beginPath(); ctx.moveTo(b, -13); ctx.lineTo(b, -17); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(-15, -17); ctx.lineTo(15, -17); ctx.stroke();

      if (isPolSuv && v.beacon) {
        const fOn = Math.floor(this.animTick * 10) % 2 === 0;
        ctx.shadowColor = fOn ? '#ef4444' : '#3b82f6';
        ctx.shadowBlur = 14;
        ctx.fillStyle = fOn ? '#ef4444' : '#3b82f6';
        ctx.beginPath(); ctx.rect(-6, -19, 5, 4); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = fOn ? '#3b82f6' : '#ef4444';
        ctx.beginPath(); ctx.rect(1, -19, 5, 4); ctx.fill();
      }
    }

    // ---- YAMAHA RX 100 ----
    else if (t === 'yamaha_rx100') {
      const rCol = v.color || '#b91c1c';
      // Wheels
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(-11, 5, 8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(12, 5, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath(); ctx.arc(-11, 5, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(12, 5, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c0c0c0';
      ctx.beginPath(); ctx.arc(-11, 5, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(12, 5, 2, 0, Math.PI * 2); ctx.fill();

      // Tank
      const rxG = ctx.createRadialGradient(-1, -5, 1, 0, -2, 9);
      rxG.addColorStop(0, lightenColor(rCol, 20));
      rxG.addColorStop(1, darkenColor(rCol, 15));
      ctx.fillStyle = rxG;
      ctx.beginPath(); ctx.ellipse(0, -2, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = darkenColor(rCol, 30);
      ctx.lineWidth = 0.7; ctx.stroke();

      // Exhaust
      ctx.strokeStyle = '#c0c0c0';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-9, 8); ctx.bezierCurveTo(-4, 12, 8, 12, 12, 8);
      ctx.stroke();

      // Headlamp
      ctx.fillStyle = '#fffde0';
      ctx.beginPath(); ctx.arc(16, 0, 3.5, 0, Math.PI * 2); ctx.fill();

      // 2-stroke smoke particle
      if (v.speed && Math.abs(v.speed) > 1) {
        ctx.fillStyle = 'rgba(200,200,200,0.18)';
        const smk = Math.sin(this.animTick * 5) * 2;
        ctx.beginPath(); ctx.arc(-16 + smk, 5, 4, 0, Math.PI * 2); ctx.fill();
      }
    }

    // ---- PADMINI ----
    else if (t === 'padmini') {
      const pCol = v.color || '#1e3a8a';
      [[-16, -13], [14, -13], [-16, 13], [14, 13]].forEach(([wx, wy]) => {
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(wx, wy, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.ellipse(wx, wy, 3.5, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#bbb'; ctx.beginPath(); ctx.ellipse(wx, wy, 1.8, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      });

      const pG = ctx.createLinearGradient(-22, -12, 22, 12);
      pG.addColorStop(0, lightenColor(pCol, 20));
      pG.addColorStop(0.5, pCol);
      pG.addColorStop(1, darkenColor(pCol, 15));
      ctx.fillStyle = pG;
      ctx.beginPath();
      ctx.moveTo(-22, -10);
      ctx.bezierCurveTo(-25, -10, -25, 10, -22, 10);
      ctx.lineTo(20, 10);
      ctx.bezierCurveTo(24, 10, 24, -10, 20, -10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = darkenColor(pCol, 30);
      ctx.lineWidth = 0.7; ctx.stroke();

      ctx.fillStyle = darkenColor(pCol, 5);
      ctx.beginPath(); ctx.rect(-10, -9, 18, 9); ctx.fill();
      ctx.fillStyle = 'rgba(150,200,255,0.3)';
      ctx.beginPath(); ctx.rect(-8, -8, 14, 8); ctx.fill();

      ctx.fillStyle = '#fffde0';
      ctx.beginPath(); ctx.ellipse(22, -7, 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(22, 7, 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.ellipse(-23, -7, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-23, 7, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
  }

  // ==========================================
  // KERALA ENVIRONMENT & LANDMARKS
  // ==========================================
  drawPalmTree(ctx, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Shadow
    this._drawShadow(ctx, 4, 10, 22, 10, 0.28);

    // Trunk — tapers and curves
    const trunkG = ctx.createLinearGradient(-4, 10, 4, -60);
    trunkG.addColorStop(0, '#3d2510');
    trunkG.addColorStop(0.5, '#5c3d1e');
    trunkG.addColorStop(1, '#7a5230');
    ctx.strokeStyle = trunkG;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(6, -10, 10, -35, 3, -60);
    ctx.stroke();

    // Trunk ridges (bark texture)
    ctx.strokeStyle = '#2a1a08';
    ctx.lineWidth = 1;
    for (let h = 5; h > -52; h -= 8) {
      const x1 = h / -10;
      ctx.beginPath();
      ctx.moveTo(x1 - 3, h);
      ctx.bezierCurveTo(x1, h - 2, x1 + 2, h - 1, x1 + 4, h);
      ctx.stroke();
    }

    // Coconut cluster
    ctx.fillStyle = '#4a3520';
    for (let c = 0; c < 3; c++) {
      const ca = (c / 3) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(3 + Math.cos(ca) * 3, -60 + Math.sin(ca) * 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fronds — graceful curves with sway
    const sway = Math.sin(this.animTick * 1.5 + x * 0.01) * 0.06;
    ctx.translate(3, -62);
    ctx.rotate(sway);

    const frondAngles = [0, 0.65, 1.3, 2.0, 2.8, 3.5, 4.3, 5.1, 5.8];
    frondAngles.forEach((a, i) => {
      ctx.save();
      ctx.rotate(a);
      // Main frond stem
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2.5 - i * 0.1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(12, -4, 28, 4, 42, 14);
      ctx.stroke();
      // Leaflets
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      for (let l = 8; l <= 38; l += 5) {
        const t2 = l / 42;
        const cx2 = 12 * (1 - t2) * (1 - t2) * t2 * 3 + 28 * (1 - t2) * t2 * t2 * 3 + 42 * t2 * t2 * t2;
        const cy2 = -4 * (1 - t2) * (1 - t2) * t2 * 3 + 4 * (1 - t2) * t2 * t2 * 3 + 14 * t2 * t2 * t2;
        ctx.beginPath();
        ctx.moveTo(cx2, cy2);
        ctx.lineTo(cx2 + 5, cy2 + 7);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx2, cy2);
        ctx.lineTo(cx2 - 5, cy2 + 7);
        ctx.stroke();
      }
      ctx.restore();
    });

    ctx.restore();
  }

  // NPC pedestrian (simpler than player, no name)
  drawNPC(ctx, npc) {
    if (!npc || isNaN(npc.x) || isNaN(npc.y)) return;
    ctx.save();
    ctx.translate(npc.x, npc.y);
    ctx.rotate(npc.angle + Math.PI / 2);

    const swing = Math.sin(this.animTick * 7 + npc.id * 1.3) * 4;
    const skinTones = ['#c28a5a', '#a0714a', '#d9a47a', '#b8835a'];
    const skin = skinTones[npc.id % skinTones.length];

    this._drawShadow(ctx, 0, 9, 11, 5, 0.3);

    // Legs
    ctx.fillStyle = npc.clothColor || '#374151';
    ctx.fillRect(-5, -1 + swing * 0.2, 4, 9);
    ctx.fillRect(1, -1 - swing * 0.2, 4, 9);

    // Body
    ctx.fillStyle = npc.shirtColor || '#6b7280';
    ctx.beginPath();
    ctx.moveTo(-6, -1); ctx.bezierCurveTo(-7, -5, -7, -11, -4, -12);
    ctx.lineTo(4, -12); ctx.bezierCurveTo(7, -11, 7, -5, 6, -1);
    ctx.closePath(); ctx.fill();

    // Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -17, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(0, -19.5, 4.5, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Authentic Chayakada (Kerala Tea Stall)
  drawChayakada(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Building shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(4, 38, 50, 10, 0, 0, Math.PI * 2); ctx.fill();

    // Walls with slight gradient depth
    const wG = ctx.createLinearGradient(-40, -30, 40, 30);
    wG.addColorStop(0, '#92400e'); wG.addColorStop(1, '#78350f');
    ctx.fillStyle = wG;
    ctx.fillRect(-40, -30, 80, 60);

    // Mangalore tile roof with ridges
    const roofG = ctx.createLinearGradient(-44, -44, 44, -30);
    roofG.addColorStop(0, '#dc2626'); roofG.addColorStop(1, '#991b1b');
    ctx.fillStyle = roofG;
    ctx.beginPath();
    ctx.moveTo(-46, -30);
    ctx.lineTo(46, -30);
    ctx.lineTo(42, -44);
    ctx.lineTo(-42, -44);
    ctx.closePath();
    ctx.fill();
    // Tile ridges
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 1;
    for (let r = -38; r <= 38; r += 8) {
      ctx.beginPath(); ctx.moveTo(r, -44); ctx.lineTo(r + 2, -30); ctx.stroke();
    }

    // Signboard
    ctx.fillStyle = '#fef08a';
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-35, -26, 70, 14, 3) : ctx.rect(-35, -26, 70, 14); ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('നാഷണൽ ചായക്കട', 0, -16);

    // Counter
    ctx.fillStyle = '#d4b896';
    ctx.fillRect(-30, -8, 28, 16);
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1; ctx.strokeRect(-30, -8, 28, 16);

    // Glass showcase with snacks
    ctx.fillStyle = 'rgba(200,230,255,0.3)';
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.rect(-28, -7, 24, 14); ctx.fill(); ctx.stroke();
    // Pazhampori (banana fritters)
    ctx.fillStyle = '#d97706';
    for (let f = 0; f < 4; f++) {
      ctx.beginPath();
      ctx.ellipse(-22 + f * 7, 2, 3, 5, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#92400e'; ctx.lineWidth = 0.5; ctx.stroke();
    }

    // Brass samovar
    const samG = ctx.createRadialGradient(16, -5, 1, 16, 0, 9);
    samG.addColorStop(0, '#fde68a'); samG.addColorStop(1, '#b45309');
    ctx.fillStyle = samG;
    ctx.beginPath(); ctx.ellipse(16, 0, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d97706'; ctx.lineWidth = 0.8; ctx.stroke();

    // Steam
    const steamY = Math.sin(this.animTick * 5) * 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(16, -10); ctx.bezierCurveTo(14, -14 + steamY, 18, -18 + steamY, 16, -22 + steamY);
    ctx.stroke();

    // Bench outside
    ctx.fillStyle = '#5c3d1e';
    ctx.fillRect(-38, 24, 76, 6);
    ctx.fillStyle = '#3d2710';
    ctx.fillRect(-38, 28, 8, 4);
    ctx.fillRect(30, 28, 8, 4);

    ctx.restore();
  }

  // Toddy Shop
  drawToddyShop(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(4, 38, 48, 10, 0, 0, Math.PI * 2); ctx.fill();

    const wG = ctx.createLinearGradient(-45, -35, 45, 35);
    wG.addColorStop(0, '#b45309'); wG.addColorStop(1, '#92400e');
    ctx.fillStyle = wG;
    ctx.fillRect(-45, -35, 90, 70);

    // Thatched roof
    const thG = ctx.createLinearGradient(-48, -50, 48, -35);
    thG.addColorStop(0, '#d97706'); thG.addColorStop(1, '#a16207');
    ctx.fillStyle = thG;
    ctx.beginPath();
    ctx.moveTo(-50, -35); ctx.lineTo(50, -35);
    ctx.lineTo(44, -52); ctx.lineTo(-44, -52);
    ctx.closePath(); ctx.fill();

    // Thatch lines
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 1;
    for (let r = -40; r <= 40; r += 7) {
      ctx.beginPath(); ctx.moveTo(r, -52); ctx.lineTo(r + 4, -35); ctx.stroke();
    }

    // Sign
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.rect(-38, -30, 76, 14); ctx.fill();
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('കള്ളു ഷാപ്പ്  (TODDY SHOP)', 0, -20);

    // Earthen pots with shading
    const potPositions = [-20, 0, 20];
    potPositions.forEach(px => {
      const pG = ctx.createRadialGradient(px - 2, 16, 1, px, 20, 8);
      pG.addColorStop(0, '#92400e'); pG.addColorStop(1, '#451a03');
      ctx.fillStyle = pG;
      ctx.beginPath();
      ctx.ellipse(px, 20, 7, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2a0e00'; ctx.lineWidth = 0.7; ctx.stroke();
      // Pot neck
      ctx.fillStyle = '#78350f';
      ctx.beginPath(); ctx.ellipse(px, 12, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    });

    ctx.restore();
  }

  // Burning Ambassador Crime Scene
  drawCrimeScene(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Scorched ground
    ctx.fillStyle = '#1a1008';
    ctx.beginPath(); ctx.ellipse(0, 8, 40, 18, 0, 0, Math.PI * 2); ctx.fill();

    // Police caution tape
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([12, 6]);
    ctx.strokeRect(-52, -38, 104, 72);
    ctx.setLineDash([]);

    // Tape posts
    ctx.fillStyle = '#78350f';
    [[-52, -38], [52, -38], [-52, 34], [52, 34]].forEach(([px, py]) => {
      ctx.beginPath(); ctx.rect(px - 1.5, py, 3, 12); ctx.fill();
    });

    // Charred car body
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.moveTo(-25, -8); ctx.bezierCurveTo(-28, -8, -28, 8, -25, 8);
    ctx.lineTo(22, 8); ctx.bezierCurveTo(26, 8, 26, -8, 22, -8);
    ctx.closePath(); ctx.fill();
    // Black char marks
    ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-20, -8); ctx.lineTo(-16, 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, -8); ctx.lineTo(6, 8); ctx.stroke();

    // Burnt cabin
    ctx.fillStyle = '#111827';
    ctx.beginPath(); ctx.rect(-10, -7, 20, 7); ctx.fill();

    // Flames — layered flicker
    const flicker = Math.sin(this.animTick * 12) * 4;
    const flicker2 = Math.sin(this.animTick * 9 + 1) * 3;
    // Outer orange flame
    ctx.fillStyle = 'rgba(249,115,22,0.7)';
    ctx.beginPath();
    ctx.moveTo(-12, 0); ctx.bezierCurveTo(-14, -8 - flicker, -6, -18 - flicker, 0, -22 - flicker);
    ctx.bezierCurveTo(6, -18 - flicker2, 14, -8 - flicker2, 12, 0);
    ctx.closePath(); ctx.fill();
    // Inner yellow flame
    ctx.fillStyle = 'rgba(253,224,71,0.8)';
    ctx.beginPath();
    ctx.moveTo(-7, 0); ctx.bezierCurveTo(-8, -6 - flicker, -3, -14 - flicker, 0, -18 - flicker);
    ctx.bezierCurveTo(3, -14 - flicker2, 8, -6 - flicker2, 7, 0);
    ctx.closePath(); ctx.fill();
    // Core white
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(-3, 0); ctx.bezierCurveTo(-4, -5, 0, -12 - flicker, 0, -12 - flicker);
    ctx.bezierCurveTo(0, -12 - flicker2, 4, -5, 3, 0);
    ctx.closePath(); ctx.fill();

    // Smoke plumes
    ctx.fillStyle = 'rgba(71,85,105,0.3)';
    const smokeY = (this.animTick * 15) % 60;
    ctx.beginPath(); ctx.arc(-5, -22 - smokeY, 10 + smokeY * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -28 - smokeY * 0.8, 8 + smokeY * 0.12, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  // Political Party Office
  drawPartyOffice(ctx, x, y, type = 'red') {
    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(4, 38, 50, 10, 0, 0, Math.PI * 2); ctx.fill();

    // Building depth (side face)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(45, -40); ctx.lineTo(50, -35);
    ctx.lineTo(50, 35); ctx.lineTo(45, 40);
    ctx.closePath(); ctx.fill();

    // Front wall
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-45, -40, 90, 80);
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1; ctx.strokeRect(-45, -40, 90, 80);

    if (type === 'red') {
      // Red header band
      const hG = ctx.createLinearGradient(-48, -48, 48, -38);
      hG.addColorStop(0, '#ef4444'); hG.addColorStop(1, '#b91c1c');
      ctx.fillStyle = hG;
      ctx.fillRect(-48, -48, 96, 14);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('☭  LDF ഓഫീസ്', 0, -38);

      // Window with lit interior
      ctx.fillStyle = 'rgba(253,224,71,0.3)';
      ctx.fillRect(-15, -28, 30, 20);
      ctx.strokeStyle = '#92400e'; ctx.lineWidth = 1; ctx.strokeRect(-15, -28, 30, 20);
      // Cross bars
      ctx.beginPath(); ctx.moveTo(0, -28); ctx.lineTo(0, -8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-15, -18); ctx.lineTo(15, -18); ctx.stroke();

      // Flag pole + flag
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(40, -68, 3, 82);
      const flagWave = Math.sin(this.animTick * 3) * 2;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(43, -68);
      ctx.bezierCurveTo(53 + flagWave, -64, 53 - flagWave, -56, 43, -52);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('★', 48 + flagWave * 0.3, -58);
    } else {
      // Green header band
      const hG = ctx.createLinearGradient(-48, -48, 48, -38);
      hG.addColorStop(0, '#16a34a'); hG.addColorStop(1, '#15803d');
      ctx.fillStyle = hG;
      ctx.fillRect(-48, -48, 96, 14);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('UDF  മണ്ഡലം ഓഫീസ്', 0, -38);

      // Window
      ctx.fillStyle = 'rgba(253,224,71,0.25)';
      ctx.fillRect(-15, -28, 30, 20);
      ctx.strokeStyle = '#374151'; ctx.lineWidth = 1; ctx.strokeRect(-15, -28, 30, 20);
      ctx.beginPath(); ctx.moveTo(0, -28); ctx.lineTo(0, -8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-15, -18); ctx.lineTo(15, -18); ctx.stroke();

      // Tricolor flag
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(40, -68, 3, 82);
      const fw = Math.sin(this.animTick * 2.5) * 2;
      // Orange
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(43, -68); ctx.bezierCurveTo(55 + fw, -65, 55 - fw, -61, 43, -58); ctx.closePath(); ctx.fill();
      // White
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(43, -58); ctx.bezierCurveTo(55 + fw, -55, 55 - fw, -51, 43, -48); ctx.closePath(); ctx.fill();
      // Green
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.moveTo(43, -48); ctx.bezierCurveTo(55 + fw, -45, 55 - fw, -41, 43, -38); ctx.closePath(); ctx.fill();
    }

    ctx.restore();
  }
}

// ---- Colour helpers ----
function lightenColor(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (n >> 16) + amount);
  const g = Math.min(255, ((n >> 8) & 0xff) + amount);
  const b = Math.min(255, (n & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}
function darkenColor(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (n >> 16) - amount);
  const g = Math.max(0, ((n >> 8) & 0xff) - amount);
  const b = Math.max(0, (n & 0xff) - amount);
  return `rgb(${r},${g},${b})`;
}

window.kurupSprites = new KurupSpriteRenderer();
