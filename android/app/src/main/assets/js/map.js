// Operation Kurup: Kerala Open-World Map & Landscape Engine
// Renders backwaters, paddy fields, tea estates, roads, junctions, and groves
class KurupWorldMap {
  constructor() {
    this.width  = 3600;
    this.height = 2800;
    this.coconutTrees = [];
    this.bushes = [];
    this.rocks  = [];
    this._offscreenReady = false;
    this._bgCanvas = null;
    this.initTrees();
    this.initScatter();
  }

  initTrees() {
    for (let i = 0; i < 110; i++) {
      const x = (i * 137.5) % this.width;
      const y = ((i * 263.7) + 120) % this.height;
      if (Math.abs(x - 1800) < 70 || Math.abs(y - 1300) < 70) continue;
      if (x > 270 && x < 660 && y > 0) continue; // avoid backwater strip
      this.coconutTrees.push({ x, y, scale: 0.82 + ((i % 6) * 0.07) });
    }
  }

  initScatter() {
    // Small bushes scattered across paddy fields
    for (let i = 0; i < 140; i++) {
      const x = (i * 89.3 + 300) % this.width;
      const y = (i * 173.1 + 200) % this.height;
      if (x > 270 && x < 660) continue;
      if (Math.abs(x - 1800) < 90 || Math.abs(y - 1340) < 90) continue;
      this.bushes.push({ x, y, r: 5 + (i % 4) * 2 });
    }
    // Rocks / boulders
    for (let i = 0; i < 40; i++) {
      const x = (i * 211.7 + 500) % this.width;
      const y = (i * 317.3 + 400) % this.height;
      this.rocks.push({ x, y, rx: 6 + (i % 5) * 2, ry: 4 + (i % 3) * 2, angle: (i * 0.6) % Math.PI });
    }
  }

  // ─── PRE-RENDER static background to offscreen canvas ───────────────────
  // Called once; thereafter we just blit the cached image.
  _buildBackground(sprites) {
    const oc = document.createElement('canvas');
    oc.width  = this.width;
    oc.height = this.height;
    const c = oc.getContext('2d');
    this._drawStaticLayers(c, sprites);
    this._bgCanvas = oc;
    this._offscreenReady = true;
  }

  // ─── DRAW ────────────────────────────────────────────────────────────────
  draw(ctx, viewport, sprites) {
    const vx = viewport.x, vy = viewport.y;
    const vw = viewport.width, vh = viewport.height;

    // ── 1. BASE TERRAIN — multi-tone paddy patchwork ──────────────────────
    // Sky-green base
    ctx.fillStyle = '#14532d';
    ctx.fillRect(vx, vy, vw, vh);

    // Paddy patches with varied greens
    const patchColors = ['#166534', '#15803d', '#16a34a', '#14532d', '#1a6b3c'];
    const patchSize = 200;
    const px0 = Math.floor(vx / patchSize) * patchSize;
    const py0 = Math.floor(vy / patchSize) * patchSize;
    for (let px = px0; px <= vx + vw + patchSize; px += patchSize) {
      for (let py = py0; py <= vy + vh + patchSize; py += patchSize) {
        const ci = (Math.floor(px / patchSize) * 3 + Math.floor(py / patchSize) * 7) % patchColors.length;
        ctx.fillStyle = patchColors[ci];
        ctx.fillRect(px, py, patchSize, patchSize);
      }
    }

    // Paddy grid lines (bund ridges between fields)
    ctx.strokeStyle = 'rgba(10,60,20,0.55)';
    ctx.lineWidth = 1.5;
    const gs = 160;
    const gx0 = Math.floor(vx / gs) * gs;
    const gy0 = Math.floor(vy / gs) * gs;
    for (let x = gx0; x <= vx + vw + gs; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, vy); ctx.lineTo(x, vy + vh); ctx.stroke();
    }
    for (let y = gy0; y <= vy + vh + gs; y += gs) {
      ctx.beginPath(); ctx.moveTo(vx, y); ctx.lineTo(vx + vw, y); ctx.stroke();
    }

    // Paddy crop rows (subtle parallel lines inside patches)
    ctx.strokeStyle = 'rgba(34,197,94,0.15)';
    ctx.lineWidth = 0.8;
    const cr = 14;
    for (let y = gy0; y <= vy + vh + cr; y += cr) {
      ctx.beginPath(); ctx.moveTo(vx, y); ctx.lineTo(vx + vw, y); ctx.stroke();
    }

    // ── 2. BACKWATERS & CANALS ────────────────────────────────────────────
    // Main canal body (Alappuzha backwaters: x 290–610)
    const waterG = ctx.createLinearGradient(290, 0, 610, 0);
    waterG.addColorStop(0,   '#075985');
    waterG.addColorStop(0.3, '#0369a1');
    waterG.addColorStop(0.6, '#0284c7');
    waterG.addColorStop(1,   '#0ea5e9');
    ctx.fillStyle = waterG;
    ctx.fillRect(290, vy, 320, vh);

    // Water shimmer — animated horizontal ripples
    const t = sprites.animTick;
    ctx.strokeStyle = 'rgba(125,211,252,0.38)';
    ctx.lineWidth = 1.4;
    for (let wy = gy0 - (gy0 % 40); wy <= vy + vh; wy += 40) {
      const woff = Math.sin(t * 1.8 + wy * 0.015) * 12;
      ctx.beginPath();
      ctx.moveTo(300, wy);
      ctx.bezierCurveTo(360 + woff, wy - 4, 480 - woff, wy + 4, 600, wy);
      ctx.stroke();
    }
    // Secondary thin ripples
    ctx.strokeStyle = 'rgba(186,230,253,0.22)';
    ctx.lineWidth = 0.7;
    for (let wy = gy0 - (gy0 % 22); wy <= vy + vh; wy += 22) {
      const woff = Math.cos(t * 2.4 + wy * 0.02) * 8;
      ctx.beginPath();
      ctx.moveTo(310, wy + 8); ctx.bezierCurveTo(390 + woff, wy + 4, 490 - woff, wy + 12, 595, wy + 8);
      ctx.stroke();
    }

    // Water reflections (vertical shimmer lines)
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    for (let wx = 310; wx <= 590; wx += 18) {
      const len = 20 + Math.sin(t * 3 + wx * 0.1) * 10;
      const ry2 = vy + ((wx * 37) % vh);
      ctx.beginPath(); ctx.moveTo(wx, ry2); ctx.lineTo(wx + 1, ry2 + len); ctx.stroke();
    }

    // Canal bank embankments
    const bankL = ctx.createLinearGradient(275, 0, 295, 0);
    bankL.addColorStop(0, '#78350f'); bankL.addColorStop(1, '#15803d');
    ctx.fillStyle = bankL;
    ctx.fillRect(275, vy, 18, vh);
    const bankR = ctx.createLinearGradient(607, 0, 628, 0);
    bankR.addColorStop(0, '#15803d'); bankR.addColorStop(1, '#78350f');
    ctx.fillStyle = bankR;
    ctx.fillRect(607, vy, 18, vh);

    // A smaller cross-canal (horizontal, y ~900)
    if (vy < 960 && vy + vh > 840) {
      const hcG = ctx.createLinearGradient(0, 840, 0, 960);
      hcG.addColorStop(0, '#0369a1'); hcG.addColorStop(0.5, '#0284c7'); hcG.addColorStop(1, '#0369a1');
      ctx.fillStyle = hcG;
      ctx.fillRect(vx, 840, vw, 120);
      // Ripples on it
      ctx.strokeStyle = 'rgba(125,211,252,0.3)';
      ctx.lineWidth = 1;
      for (let cx = gx0; cx <= vx + vw; cx += 50) {
        const co = Math.sin(t * 2 + cx * 0.02) * 6;
        ctx.beginPath();
        ctx.moveTo(cx, 870); ctx.bezierCurveTo(cx + 20 + co, 866, cx + 30 - co, 874, cx + 50, 870);
        ctx.stroke();
      }
    }

    // ── 3. WOODEN BRIDGES ─────────────────────────────────────────────────
    this._drawBridge(ctx, 280, 670, 340, 55);   // Mavelikkara bridge
    this._drawBridge(ctx, 280, 1375, 340, 62);  // Main town bridge

    // Cross-canal bridge
    if (vy < 1000 && vy + vh > 800) {
      this._drawBridgeH(ctx, 900, 840, 80, 120); // horizontal bridge over small canal
    }

    // ── 4. ROADS ──────────────────────────────────────────────────────────
    // Main East–West highway (y 1300–1380)
    this._drawRoad(ctx, 'h', 0, 1300, this.width, 80);

    // North–South central artery (x 1760–1840)
    this._drawRoad(ctx, 'v', 1760, 0, 80, this.height);

    // Munnar mountain road
    ctx.save();
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(1840, 1300);
    ctx.bezierCurveTo(2200, 1050, 2700, 800, 3060, 590);
    ctx.lineTo(3075, 610);
    ctx.bezierCurveTo(2715, 820, 2215, 1070, 1855, 1365);
    ctx.closePath();
    ctx.fill();
    // Centre line on mountain road
    ctx.strokeStyle = 'rgba(251,191,36,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 14]);
    ctx.beginPath();
    ctx.moveTo(1847, 1332);
    ctx.bezierCurveTo(2207, 1060, 2707, 810, 3067, 600);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Side road from junction to Toddy Shop area
    this._drawRoad(ctx, 'h', 850, 940, 200, 40);
    // Side road to cinema theater
    this._drawRoad(ctx, 'v', 1930, 1300, 40, 280);

    // Junction boxes (darker concrete)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(1760, 1300, 80, 80);  // Main junction

    // ── 5. ROAD MARKINGS ─────────────────────────────────────────────────
    // Pedestrian crossings at main junction
    ctx.fillStyle = 'rgba(248,250,252,0.7)';
    for (let stripe = 0; stripe < 5; stripe++) {
      ctx.fillRect(1760, 1385 + stripe * 8, 80, 4);
      ctx.fillRect(1840 + stripe * 8, 1300, 4, 80);
    }

    // ── 6. TEA ESTATE (Munnar NE) ─────────────────────────────────────────
    if (vx < 3500 && vx + vw > 2600 && vy < 900 && vy + vh > 200) {
      // Hill base gradient
      const hillG = ctx.createLinearGradient(2600, 200, 3500, 900);
      hillG.addColorStop(0, '#166534'); hillG.addColorStop(0.5, '#15803d'); hillG.addColorStop(1, '#14532d');
      ctx.fillStyle = hillG;
      ctx.beginPath();
      ctx.moveTo(2600, 900); ctx.lineTo(2600, 260);
      ctx.bezierCurveTo(2750, 200, 3200, 200, 3500, 220);
      ctx.lineTo(3500, 900); ctx.closePath(); ctx.fill();

      // Tea terrace contour lines
      ctx.strokeStyle = '#166534'; ctx.lineWidth = 3;
      for (let r = 280; r <= 860; r += 45) {
        ctx.beginPath();
        ctx.moveTo(2620, r);
        ctx.bezierCurveTo(2900, r + 20, 3200, r - 15, 3480, r + 10);
        ctx.stroke();
      }
      // Tea bush rows (darker dots)
      ctx.fillStyle = '#14532d';
      for (let ty = 280; ty <= 850; ty += 22) {
        for (let tx = 2620; tx <= 3480; tx += 16) {
          ctx.beginPath(); ctx.arc(tx, ty, 3, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    // ── 7. ROCKS & BUSHES ─────────────────────────────────────────────────
    for (const rock of this.rocks) {
      if (rock.x < vx - 20 || rock.x > vx + vw + 20 || rock.y < vy - 20 || rock.y > vy + vh + 20) continue;
      const rg = ctx.createRadialGradient(rock.x - 2, rock.y - 2, 1, rock.x, rock.y, rock.rx);
      rg.addColorStop(0, '#94a3b8'); rg.addColorStop(1, '#475569');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.ellipse(rock.x, rock.y, rock.rx, rock.ry, rock.angle, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 0.6; ctx.stroke();
    }
    for (const bush of this.bushes) {
      if (bush.x < vx - 20 || bush.x > vx + vw + 20 || bush.y < vy - 20 || bush.y > vy + vh + 20) continue;
      // Skip if on water or road
      if (bush.x > 280 && bush.x < 625) continue;
      if (Math.abs(bush.y - 1340) < 55 || Math.abs(bush.x - 1800) < 55) continue;
      const bg = ctx.createRadialGradient(bush.x - 1, bush.y - 1, 1, bush.x, bush.y, bush.r);
      bg.addColorStop(0, '#22c55e'); bg.addColorStop(1, '#15803d');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(bush.x, bush.y, bush.r, 0, Math.PI * 2); ctx.fill();
    }

    // ── 8. LANDMARKS ─────────────────────────────────────────────────────
    sprites.drawCrimeScene(ctx, 500, 700);
    sprites.drawToddyShop(ctx, 950, 950);
    sprites.drawChayakada(ctx, 1880, 1230);
    sprites.drawPartyOffice(ctx, 1600, 1140, 'red');
    sprites.drawPartyOffice(ctx, 2050, 1140, 'tricolor');

    // Apsara Cinema Theatre — proper building
    this._drawCinema(ctx, 1950, 1545);

    // Munnar Planters Club
    this._drawPlantersClub(ctx, 3000, 600);

    // Aryankavu Border Checkpost
    this._drawCheckpost(ctx, 3300, 2400);

    // ── 9. COCONUT PALM GROVES ───────────────────────────────────────────
    for (const tree of this.coconutTrees) {
      if (tree.x < vx - 110 || tree.x > vx + vw + 110 || tree.y < vy - 110 || tree.y > vy + vh + 110) continue;
      sprites.drawPalmTree(ctx, tree.x, tree.y, tree.scale);
    }
  }

  // ── ROAD HELPER ─────────────────────────────────────────────────────────
  _drawRoad(ctx, dir, rx, ry, rw, rh) {
    // Asphalt base with subtle texture
    const rg = ctx.createLinearGradient(rx, ry, rx + (dir === 'h' ? 0 : rw), ry + (dir === 'v' ? 0 : rh));
    rg.addColorStop(0, '#1e293b');
    rg.addColorStop(0.5, '#243044');
    rg.addColorStop(1, '#1e293b');
    ctx.fillStyle = rg;
    ctx.fillRect(rx, ry, rw, rh);

    // Road edge lines (white)
    ctx.strokeStyle = 'rgba(248,250,252,0.55)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    if (dir === 'h') {
      ctx.beginPath(); ctx.moveTo(rx, ry + 2); ctx.lineTo(rx + rw, ry + 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rx, ry + rh - 2); ctx.lineTo(rx + rw, ry + rh - 2); ctx.stroke();
      // Centre dashes
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5; ctx.setLineDash([20, 16]);
      ctx.beginPath(); ctx.moveTo(rx, ry + rh / 2); ctx.lineTo(rx + rw, ry + rh / 2); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(rx + 2, ry); ctx.lineTo(rx + 2, ry + rh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rx + rw - 2, ry); ctx.lineTo(rx + rw - 2, ry + rh); ctx.stroke();
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5; ctx.setLineDash([20, 16]);
      ctx.beginPath(); ctx.moveTo(rx + rw / 2, ry); ctx.lineTo(rx + rw / 2, ry + rh); ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // ── BRIDGE HELPERS ───────────────────────────────────────────────────────
  _drawBridge(ctx, x, y, w, h) {
    // Bridge deck
    const bg = ctx.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, '#92400e'); bg.addColorStop(0.5, '#b45309'); bg.addColorStop(1, '#78350f');
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    // Planks
    ctx.strokeStyle = '#5c2d0e'; ctx.lineWidth = 1.5;
    for (let px = x + 10; px < x + w; px += 14) {
      ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke();
    }
    // Railings
    ctx.strokeStyle = '#451a03'; ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    // Rail posts
    ctx.fillStyle = '#451a03';
    for (let px = x; px <= x + w; px += 25) {
      ctx.fillRect(px - 2, y - 8, 4, h + 16);
    }
    // Top rail
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x + w, y - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + h + 8); ctx.lineTo(x + w, y + h + 8); ctx.stroke();
  }

  _drawBridgeH(ctx, x, y, w, h) {
    const bg = ctx.createLinearGradient(x, y, x + w, y);
    bg.addColorStop(0, '#78350f'); bg.addColorStop(0.5, '#b45309'); bg.addColorStop(1, '#78350f');
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#451a03'; ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  }

  // ── BUILDING HELPERS ────────────────────────────────────────────────────
  _drawCinema(ctx, x, y) {
    ctx.save(); ctx.translate(x, y);
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(4, 44, 58, 12, 0, 0, Math.PI * 2); ctx.fill();
    // Side face (depth)
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(50, -44); ctx.lineTo(56, -38); ctx.lineTo(56, 40); ctx.lineTo(50, 44);
    ctx.closePath(); ctx.fill();
    // Front wall
    const cg = ctx.createLinearGradient(-50, -44, 50, 44);
    cg.addColorStop(0, '#312e81'); cg.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = cg;
    ctx.fillRect(-50, -44, 100, 88);
    // Marquee header
    const mg = ctx.createLinearGradient(-50, -44, 50, -28);
    mg.addColorStop(0, '#4c1d95'); mg.addColorStop(1, '#7c3aed');
    ctx.fillStyle = mg;
    ctx.fillRect(-50, -44, 100, 18);
    // Neon sign
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('APSARA  TALKIES', 0, -31);
    ctx.fillStyle = '#c4b5fd';
    ctx.font = '6px sans-serif';
    ctx.fillText('അപ്സര  ടാക്കീസ്', 0, -23);
    // Poster frames
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-42, -20, 28, 40);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(14, -20, 28, 40);
    // Poster art hint
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('അങ്ങാടി', -28, 5);
    ctx.fillStyle = '#fde68a';
    ctx.fillText('SPADIKAM', 28, 5);
    // Entry door
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-8, 14, 16, 30);
    ctx.strokeStyle = '#4c1d95'; ctx.lineWidth = 1; ctx.strokeRect(-8, 14, 16, 30);
    // Neon lights (flickering)
    const flick = Math.sin(sprites.animTick * 7) > 0.3;
    ctx.fillStyle = flick ? 'rgba(196,181,253,0.8)' : 'rgba(196,181,253,0.2)';
    for (let li = -44; li <= 44; li += 8) {
      ctx.beginPath(); ctx.arc(li, -44, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  _drawPlantersClub(ctx, x, y) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(4, 42, 55, 12, 0, 0, Math.PI * 2); ctx.fill();
    // Side
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(48, -38); ctx.lineTo(54, -32); ctx.lineTo(54, 38); ctx.lineTo(48, 42);
    ctx.closePath(); ctx.fill();
    // Walls
    const wg = ctx.createLinearGradient(-48, -38, 48, 38);
    wg.addColorStop(0, '#f8fafc'); wg.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = wg;
    ctx.fillRect(-48, -38, 96, 76);
    // Red tile roof
    const rg = ctx.createLinearGradient(-52, -52, 52, -36);
    rg.addColorStop(0, '#dc2626'); rg.addColorStop(1, '#991b1b');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(-52, -38); ctx.lineTo(-48, -52); ctx.lineTo(48, -52); ctx.lineTo(52, -38);
    ctx.closePath(); ctx.fill();
    // Ridge tiles
    ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 1;
    for (let r = -44; r <= 44; r += 8) {
      ctx.beginPath(); ctx.moveTo(r, -52); ctx.lineTo(r + 2, -38); ctx.stroke();
    }
    // Veranda columns
    ctx.fillStyle = '#e2e8f0';
    [-32, -16, 0, 16, 32].forEach(cx => {
      ctx.fillRect(cx - 3, -38, 6, 76);
    });
    // Windows
    ctx.fillStyle = 'rgba(253,224,71,0.3)';
    ctx.strokeStyle = '#b8a06a'; ctx.lineWidth = 1;
    [[-38, -28], [-18, -28], [2, -28], [22, -28]].forEach(([wx, wy]) => {
      ctx.beginPath(); ctx.rect(wx, wy, 14, 20); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(wx + 7, wy); ctx.lineTo(wx + 7, wy + 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(wx, wy + 10); ctx.lineTo(wx + 14, wy + 10); ctx.stroke();
    });
    // Sign
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-40, -15, 80, 12);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('MUNNAR PLANTERS CLUB', 0, -6);
    // Door
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-9, 12, 18, 26);
    ctx.fillStyle = '#b45309';
    ctx.beginPath(); ctx.arc(7, 25, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  _drawCheckpost(ctx, x, y) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(4, 36, 60, 12, 0, 0, Math.PI * 2); ctx.fill();
    // Building
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(-55, -32, 110, 64);
    ctx.strokeStyle = '#374151'; ctx.lineWidth = 1; ctx.strokeRect(-55, -32, 110, 64);
    // Police blue stripes
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(-55, -32, 110, 8);
    ctx.fillRect(-55, 24, 110, 8);
    // Sign board
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('KERALA POLICE & EXCISE CHECKPOST', 0, -20);
    ctx.fillStyle = '#f9fafb'; ctx.font = '6px sans-serif';
    ctx.fillText('ആര്യൻകാവ് ബോർഡർ', 0, -11);
    // Barrier arm (red & white striped)
    const barAngle = 0; // static; game.js can animate if needed
    ctx.save(); ctx.translate(-60, 0); ctx.rotate(barAngle);
    for (let s = 0; s < 7; s++) {
      ctx.fillStyle = s % 2 === 0 ? '#ef4444' : '#f8fafc';
      ctx.fillRect(s * 14, -4, 14, 8);
    }
    ctx.restore();
    // Guard booth
    ctx.fillStyle = '#374151';
    ctx.fillRect(36, -32, 20, 64);
    ctx.fillStyle = 'rgba(150,200,255,0.35)';
    ctx.fillRect(40, -28, 12, 20);
    ctx.restore();
  }

  // ── MINIMAP ──────────────────────────────────────────────────────────────
  drawMinimap(canvas, player, vehicles, kurupState, clues) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const sx = w / this.width, sy = h / this.height;

    // Background terrain
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#064e3b'); bg.addColorStop(1, '#065f46');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Canals
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(290 * sx, 0, 320 * sx, h);

    // Main roads
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 1300 * sy, w, 80 * sy);
    ctx.fillRect(1760 * sx, 0, 80 * sx, h);

    // Minimap border / frame
    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, w, h);

    // Clue markers
    clues.forEach(c => {
      ctx.fillStyle = c.found ? '#10b981' : '#ef4444';
      ctx.beginPath(); ctx.arc(c.x * sx, c.y * sy, 2.5, 0, Math.PI * 2); ctx.fill();
    });

    // Vehicles
    ctx.fillStyle = '#f59e0b';
    vehicles.forEach(v => {
      ctx.fillRect(v.x * sx - 2, v.y * sy - 2, 4, 4);
    });

    // Kurup
    if (kurupState && !kurupState.captured) {
      ctx.fillStyle = '#dc2626';
      ctx.shadowColor = '#dc2626'; ctx.shadowBlur = 4;
      ctx.beginPath(); ctx.arc(kurupState.x * sx, kurupState.y * sy, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Other players
    if (window.gameInstance) {
      Object.values(window.gameInstance.players || {}).forEach(p => {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(p.x * sx, p.y * sy, 2.5, 0, Math.PI * 2); ctx.fill();
      });
    }

    // Local player
    if (player) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(player.x * sx, player.y * sy, 4, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.2;
      ctx.stroke();

      // Direction tick
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(player.x * sx, player.y * sy);
      ctx.lineTo(
        player.x * sx + Math.cos(player.angle) * 7,
        player.y * sy + Math.sin(player.angle) * 7
      );
      ctx.stroke();
    }

    // Minimap label
    ctx.fillStyle = 'rgba(16,185,129,0.7)';
    ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('KERALA MAP', 2, h - 2);
  }
}

// Expose sprites ref needed by helpers defined before game loads
const sprites = window.kurupSprites;

window.kurupWorldMap = new KurupWorldMap();
