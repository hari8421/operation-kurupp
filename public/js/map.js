// Operation Kurup: Kerala Open-World Map & Landscape Engine
// Renders backwaters, paddy fields, tea estates, roads, junctions, and groves
class KurupWorldMap {
  constructor() {
    this.width = 3600;
    this.height = 2800;
    this.coconutTrees = [];
    this.initTrees();
  }

  initTrees() {
    // Deterministic random generation of 80+ coconut palms across Kerala landscape
    for (let i = 0; i < 90; i++) {
      const x = (i * 137.5) % this.width;
      const y = ((i * 263.7) + 120) % this.height;

      // Avoid placing right in the middle of major roads
      if (Math.abs(x - 1800) < 60 || Math.abs(y - 1300) < 60) continue;

      this.coconutTrees.push({
        x: x,
        y: y,
        scale: 0.85 + ((i % 5) * 0.08)
      });
    }
  }

  draw(ctx, viewport, sprites) {
    const vx = viewport.x;
    const vy = viewport.y;
    const vw = viewport.width;
    const vh = viewport.height;

    // 1. BASE TERRAIN (Lush Kerala Paddy Green)
    ctx.fillStyle = '#166534';
    ctx.fillRect(vx, vy, vw, vh);

    // Paddy field patchwork grid
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2;
    const gridSize = 160;
    const startX = Math.floor(vx / gridSize) * gridSize;
    const endX = vx + vw;
    const startY = Math.floor(vy / gridSize) * gridSize;
    const endY = vy + vh;

    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, vy);
      ctx.lineTo(x, vy + vh);
      ctx.stroke();
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(vx, y);
      ctx.lineTo(vx + vw, y);
      ctx.stroke();
    }

    // 2. WATERWAYS & BACKWATERS (Alappuzha Canals on West: x between 200 and 650)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(300, 0, 300, this.height);

    // Water ripple highlights
    ctx.fillStyle = '#38bdf8';
    const rippleOffset = Math.sin(sprites.animTick * 3) * 4;
    for (let wy = Math.max(0, vy); wy <= Math.min(this.height, vy + vh); wy += 80) {
      ctx.fillRect(330 + rippleOffset, wy, 45, 3);
      ctx.fillRect(450 - rippleOffset, wy + 35, 60, 3);
    }

    // Wooden bridges across backwaters
    ctx.fillStyle = '#78350f';
    ctx.fillRect(280, 680, 340, 50); // Bridge 1 near crime scene
    ctx.fillRect(280, 1380, 340, 60); // Main bridge to town

    // Bridge railings
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3;
    ctx.strokeRect(280, 680, 340, 50);
    ctx.strokeRect(280, 1380, 340, 60);

    // 3. ROADS & HIGHWAYS (Kerala State Highways)
    // Main East-West Highway (y = 1300 to 1380)
    ctx.fillStyle = '#1e293b'; // Wet dark asphalt
    ctx.fillRect(0, 1300, this.width, 80);

    // Highway yellow dashed divider lines
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(0, 1340);
    ctx.lineTo(this.width, 1340);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // North-South Central Arterial Road (x = 1760 to 1840)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(1760, 0, 80, this.height);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(1800, 0);
    ctx.lineTo(1800, this.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Munnar High Range Mountain Road (Branching up to Munnar: x = 1800 -> 3000, y = 1300 -> 600)
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(1840, 1300);
    ctx.quadraticCurveTo(2400, 950, 3000, 600);
    ctx.lineTo(3060, 600);
    ctx.quadraticCurveTo(2460, 950, 1840, 1360);
    ctx.fill();

    // Tea Plantation Hills (Munnar North-East)
    ctx.fillStyle = '#15803d';
    if (typeof window.drawRoundedRect === 'function') {
      window.drawRoundedRect(ctx, 2600, 200, 900, 700, 60);
    } else {
      ctx.beginPath();
      ctx.rect(2600, 200, 900, 700);
    }
    ctx.fill();
    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 4;
    // Contoured tea terrace lines
    for (let r = 250; r <= 850; r += 50) {
      ctx.beginPath();
      ctx.moveTo(2650, r);
      ctx.quadraticCurveTo(3000, r + 25, 3450, r - 15);
      ctx.stroke();
    }

    // 4. LANDMARKS & BUILDINGS
    // Mavelikkara Burning Car Scene
    sprites.drawCrimeScene(ctx, 500, 700);

    // Toddy Shop
    sprites.drawToddyShop(ctx, 950, 950);

    // National Chayakada at Central Junction
    sprites.drawChayakada(ctx, 1880, 1240);

    // Political Party Offices
    sprites.drawPartyOffice(ctx, 1600, 1150, 'red');
    sprites.drawPartyOffice(ctx, 2050, 1150, 'tricolor');

    // Apsara Retro Cinema Theater
    ctx.save();
    ctx.translate(1950, 1550);
    ctx.fillStyle = '#312e81';
    ctx.fillRect(-50, -40, 100, 80);
    ctx.fillStyle = '#e0e7ff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('അപ്സര ടാക്കീസ്', 0, -22);
    // Cinema movie poster (Vintage 1980s Malayalam film)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-35, -10, 30, 42);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('അങ്ങാടി', -20, 15);
    ctx.restore();

    // Munnar Tea Bungalow
    ctx.save();
    ctx.translate(3000, 600);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-45, -35, 90, 70);
    ctx.fillStyle = '#991b1b'; // Red roof
    ctx.fillRect(-48, -42, 96, 16);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MUNNAR PLANTERS CLUB', 0, -22);
    ctx.restore();

    // Aryankavu Border Checkpost (South East)
    ctx.save();
    ctx.translate(3300, 2400);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(-50, -30, 100, 60);
    // Red & White Police Barrier
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-60, 0, 120, 8);
    ctx.fillStyle = '#ffffff';
    for (let b = -60; b <= 50; b += 20) {
      ctx.fillRect(b, 0, 10, 8);
    }
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText('KERALA STATE EXCISE & POLICE CHECKPOST', 0, -15);
    ctx.restore();

    // 5. COCONUT PALM GROVES
    this.coconutTrees.forEach(t => {
      if (t.x >= vx - 100 && t.x <= vx + vw + 100 &&
          t.y >= vy - 100 && t.y <= vy + vh + 100) {
        sprites.drawPalmTree(ctx, t.x, t.y, t.scale);
      }
    });
  }

  // Draw Radar Minimap
  drawMinimap(canvas, player, vehicles, kurupState, clues) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, w, h);

    const scaleX = w / this.width;
    const scaleY = h / this.height;

    // Canals
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(300 * scaleX, 0, 300 * scaleX, h);

    // Roads
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 1300 * scaleY, w, 80 * scaleY);
    ctx.fillRect(1760 * scaleX, 0, 80 * scaleX, h);

    // Clues
    clues.forEach(c => {
      ctx.fillStyle = c.found ? '#10b981' : '#ef4444';
      ctx.beginPath();
      ctx.arc(c.x * scaleX, c.y * scaleY, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Vehicles
    ctx.fillStyle = '#f59e0b';
    vehicles.forEach(v => {
      ctx.fillRect(v.x * scaleX - 1.5, v.y * scaleY - 1.5, 3, 3);
    });

    // Kurup (if spotted / hint)
    if (kurupState) {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(kurupState.x * scaleX, kurupState.y * scaleY, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Current Player
    if (player) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(player.x * scaleX, player.y * scaleY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

window.kurupWorldMap = new KurupWorldMap();
