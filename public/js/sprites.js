// Operation Kurup: Procedural Canvas Pixel & Vector Sprite Renderer
// Renders authentic Kerala characters, cultural dress styles, multi-era vehicles, and landmarks
class KurupSpriteRenderer {
  constructor() {
    this.animTick = 0;
  }

  update() {
    this.animTick += 0.05;
  }

  // ==========================================
  // CHARACTERS & DRESS STYLES
  // ==========================================
  drawCharacter(ctx, player, isCurrent = false) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Walking leg cycle
    const isMoving = Math.abs(player.speed) > 0.3;
    const legOffset = isMoving ? Math.sin(this.animTick * 8) * 5 : 0;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 11, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const faction = player.faction;
    const dress = player.dressStyle;
    const disguise = player.disguise;

    // 1. LEGS & LOWER BODY DRESS
    if (dress === 'khaki_uniform' || (faction === 'police' && disguise !== 'sanyasi')) {
      // Police Khaki trousers & black boots
      ctx.fillStyle = '#b59d6e'; // Khaki
      ctx.fillRect(-6 + legOffset, -2, 5, 11);
      ctx.fillRect(1 - legOffset, -2, 5, 11);
      ctx.fillStyle = '#111827'; // Boots
      ctx.fillRect(-6 + legOffset, 7, 5, 4);
      ctx.fillRect(1 - legOffset, 7, 5, 4);
    } else if (dress === 'folded_mundu' || faction === 'red_cadre' || faction === 'tricolor_cadre') {
      // Kerala White Mundu (folded up above knee or double mundu)
      ctx.fillStyle = '#f8fafc'; // Crisp white mundu
      ctx.fillRect(-6 + legOffset, -3, 12, 10);
      // Golden or red border (Kasavu / Kara)
      ctx.fillStyle = (faction === 'red_cadre' ? '#dc2626' : '#d97706');
      ctx.fillRect(-6, 5, 12, 2);
      // Bare legs & slippers
      ctx.fillStyle = '#d49b6a';
      ctx.fillRect(-5 + legOffset, 7, 3, 5);
      ctx.fillRect(2 - legOffset, 7, 3, 5);
    } else if (dress === 'bell_bottoms' || faction === 'gulf_syndicate') {
      // 1980s Retro Bell-bottom trousers
      ctx.fillStyle = '#7c2d12'; // Deep brown flared pants
      ctx.fillRect(-7 + legOffset, -3, 6, 12);
      ctx.fillRect(1 - legOffset, -3, 6, 12);
      ctx.fillStyle = '#1e293b'; // Leather shoes
      ctx.fillRect(-8 + legOffset, 8, 7, 3);
      ctx.fillRect(1 - legOffset, 8, 7, 3);
    } else if (disguise === 'sanyasi') {
      // Saffron robe
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-6 + legOffset, -3, 12, 13);
    } else {
      // Default trousers
      ctx.fillStyle = '#374151';
      ctx.fillRect(-6 + legOffset, -2, 5, 11);
      ctx.fillRect(1 - legOffset, -2, 5, 11);
    }

    // 2. TORSO & UPPER DRESS
    if (faction === 'police' && disguise !== 'sanyasi') {
      // Khaki Police Shirt
      ctx.fillStyle = '#c5ae7b';
      ctx.fillRect(-7, -10, 14, 11);
      // Police leather Sam Browne belt & brass buckle
      ctx.fillStyle = '#3b2010';
      ctx.fillRect(-7, -2, 14, 3);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-2, -2, 4, 3);
      // Red police shoulder lanyard
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-5, -8);
      ctx.lineTo(0, -3);
      ctx.stroke();
    } else if (faction === 'red_cadre') {
      // White shirt + Red towel on shoulder (ചുവന്ന തോർത്ത്)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-7, -10, 14, 11);
      ctx.fillStyle = '#dc2626'; // Red towel
      ctx.fillRect(-8, -10, 5, 12);
      // Small communist red star badge
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(3, -5, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (faction === 'tricolor_cadre') {
      // Khadi Kurta + Tricolor stole
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(-7, -10, 14, 11);
      // Tricolor sash
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-6, -10, 3, 11);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, -10, 3, 11);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, -10, 3, 11);
    } else if (faction === 'gulf_syndicate' || disguise === 'gulf_tycoon') {
      // 1980s Safari suit / Floral print shirt
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-7, -10, 14, 11);
      // Gold chain & collar
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-3, -9);
      ctx.lineTo(0, -4);
      ctx.lineTo(3, -9);
      ctx.stroke();
    } else if (disguise === 'toddy_tapper') {
      // Bare chest with muscle tone
      ctx.fillStyle = '#c28552';
      ctx.fillRect(-7, -10, 14, 11);
    } else if (disguise === 'sanyasi') {
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-7, -10, 14, 11);
      // Rudraksha mala
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -5, 4, 0, Math.PI);
      ctx.stroke();
    }

    // 3. HEAD & HAIR
    ctx.fillStyle = '#d49b6a'; // Face
    ctx.beginPath();
    ctx.arc(0, -14, 5, 0, Math.PI * 2);
    ctx.fill();

    // Mustache (Signature Malayali Meesha!)
    ctx.fillStyle = '#111827';
    ctx.fillRect(-3, -13, 6, 2);

    // Headwear / Hair
    if (faction === 'police' && disguise !== 'sanyasi') {
      // Police retro side cap (Khaki with red ribbon)
      ctx.fillStyle = '#8f7748';
      ctx.fillRect(-5, -19, 10, 4);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-5, -16, 10, 1.5);
    } else if (disguise === 'sanyasi') {
      // Long hair knot & Vibhuti (sacred white ash)
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(0, -18, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, -15, 6, 1);
    } else if (faction === 'gulf_syndicate' || disguise === 'gulf_tycoon') {
      // Retro wavy puffed 80s hairstyle + Ray-ban aviator sunglasses!
      ctx.fillStyle = '#172554';
      ctx.beginPath();
      ctx.arc(0, -16, 5.5, Math.PI, Math.PI * 2);
      ctx.fill();
      // Aviators
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-4, -15, 3.5, 2.5);
      ctx.fillRect(0.5, -15, 3.5, 2.5);
    } else {
      // Classic wavy hair
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(0, -16, 5.5, Math.PI, Math.PI * 2);
      ctx.fill();
    }

    // Held Item / Prop
    if (faction === 'police') {
      // Lathi in hand
      ctx.fillStyle = '#78350f';
      ctx.fillRect(8, -8, 2, 16);
    } else if (faction === 'red_cadre') {
      // Red party flag on bamboo stick
      ctx.fillStyle = '#b45309';
      ctx.fillRect(7, -18, 2, 22);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(9, -18, 9, 6);
    }

    // Player indicator circle for current player
    if (isCurrent) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, -5, 18, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // Player Name Tag
    ctx.save();
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(player.name, player.x, player.y - 25);
    ctx.restore();
  }

  // ==========================================
  // VEHICLES ACROSS ERAS
  // ==========================================
  drawVehicle(ctx, v) {
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.rotate(v.angle);

    // Dynamic Vehicle Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(2, 3, 28, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    const t = v.type;

    if (t === 'ambassador_police' || t === 'ambassador_taxi') {
      // =====================================
      // HINDUSTAN AMBASSADOR MARK 3 (1984)
      // =====================================
      const isPolice = (t === 'ambassador_police');
      const bodyCol = isPolice ? '#f8fafc' : '#1f2937';
      const roofCol = isPolice ? '#f8fafc' : '#f59e0b';

      // Main curved chassis
      ctx.fillStyle = bodyCol;
      ctx.beginPath();
      ctx.roundRect(-24, -12, 48, 24, [8, 12, 12, 8]);
      ctx.fill();
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Front chrome curved bumper & grill
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(20, -10, 4, 20);
      ctx.fillRect(-24, -10, 3, 20);

      // Round headlights
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(22, -8, 2.5, 0, Math.PI * 2);
      ctx.arc(22, 8, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Cabin & Windshields
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-10, -9, 22, 18);
      ctx.fillStyle = roofCol;
      ctx.fillRect(-8, -8, 18, 16);

      // Police Beacon / Siren on roof
      if (v.beacon) {
        const flash = Math.floor(this.animTick * 12) % 2 === 0;
        ctx.fillStyle = flash ? '#ef4444' : '#3b82f6';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Wheels
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-16, -13, 8, 2);
      ctx.fillRect(10, -13, 8, 2);
      ctx.fillRect(-16, 11, 8, 2);
      ctx.fillRect(10, 11, 8, 2);

    } else if (t === 'bullet350') {
      // =====================================
      // ROYAL ENFIELD BULLET 350
      // =====================================
      // Twin spoked wheels
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(14, -3, 6, 6);
      ctx.fillRect(-16, -3, 6, 6);

      // Chrome exhaust pipe
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-12, 3, 22, 2.5);

      // Heavy Teardrop Fuel Tank (Black with Golden pinstripes)
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.ellipse(2, 0, 9, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Single round headlight & handlebars
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(16, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(10, -8, 2, 16); // Handlebars

      // Rider seat
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-8, -3, 7, 6);

    } else if (t === 'ksrtc_bus') {
      // =====================================
      // KSRTC "AANA VANDI" FAST PASSENGER BUS
      // =====================================
      // Long wooden/metal chassis (Red & Yellow)
      ctx.fillStyle = '#b91c1c'; // KSRTC iconic red
      ctx.beginPath();
      ctx.roundRect(-42, -15, 84, 30, [4, 6, 6, 4]);
      ctx.fill();

      // Yellow speed stripe
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-42, -5, 84, 10);

      // Windshield & passenger windows
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(28, -13, 10, 26); // Front windshield
      ctx.fillStyle = '#38bdf8';
      // Side windows
      for (let w = -34; w <= 18; w += 10) {
        ctx.fillRect(w, -14, 7, 3);
        ctx.fillRect(w, 11, 7, 3);
      }

      // Route Board ("ആന വണ്ടി - KSRTC")
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, -7, 10, 14);

      // Wheels
      ctx.fillStyle = '#09090b';
      ctx.fillRect(-30, -17, 10, 3);
      ctx.fillRect(20, -17, 10, 3);
      ctx.fillRect(-30, 14, 10, 3);
      ctx.fillRect(20, 14, 10, 3);

    } else if (t === 'chetak') {
      // =====================================
      // BAJAJ CHETAK 150 SCOOTER
      // =====================================
      ctx.fillStyle = '#15803d'; // Retro green
      ctx.beginPath();
      ctx.ellipse(0, 0, 13, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Round spare tire bulb on side
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(-6, -6, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // Front headlight
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(12, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (t === 'kettuvallam') {
      // =====================================
      // ALAPPUZHA KETTUVALLAM (COUNTRY BOAT)
      // =====================================
      // Curved wooden hull
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.moveTo(-35, 0);
      ctx.quadraticCurveTo(0, -14, 35, 0);
      ctx.quadraticCurveTo(0, 14, -35, 0);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Woven palm thatched canopy
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-15, -7, 30, 14);
      // Bamboo ribbing
      ctx.strokeStyle = '#92400e';
      for (let b = -12; b <= 12; b += 6) {
        ctx.beginPath();
        ctx.moveTo(b, -7);
        ctx.lineTo(b, 7);
        ctx.stroke();
      }

    } else if (t === 'contessa') {
      // =====================================
      // HM CONTESSA CLASSIC (1990s Muscle)
      // =====================================
      ctx.fillStyle = '#881337'; // Wine red
      ctx.fillRect(-26, -11, 52, 22);
      // Chrome bumper & quad headlamps
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(24, -9, 3, 18);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(23, -8, 2, 4);
      ctx.fillRect(23, 4, 2, 4);
      // Sleek cabin
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-12, -8, 22, 16);

    } else if (t === 'auto_rickshaw') {
      // =====================================
      // KERALA 3-WHEELER AUTORICKSHAW
      // =====================================
      // Yellow top hood
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.roundRect(-12, -8, 24, 16, [4, 6, 6, 4]);
      ctx.fill();
      // Black lower body
      ctx.fillStyle = '#111827';
      ctx.fillRect(-14, -7, 6, 14);
      // Windshield
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(6, -6, 4, 12);
      // Single front wheel
      ctx.fillStyle = '#09090b';
      ctx.fillRect(10, -2, 4, 4);
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

    // Tree shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Curved Trunk
    ctx.strokeStyle = '#573d1c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.quadraticCurveTo(8, -25, 2, -60);
    ctx.stroke();

    // Trunk ridges
    ctx.strokeStyle = '#3e2710';
    ctx.lineWidth = 1.5;
    for (let h = 0; h > -55; h -= 8) {
      ctx.beginPath();
      ctx.moveTo(-2, h);
      ctx.lineTo(6, h - 2);
      ctx.stroke();
    }

    // Coconut bunch
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(2, -58, 4, 0, Math.PI * 2);
    ctx.arc(6, -56, 3.5, 0, Math.PI * 2);
    ctx.arc(-1, -55, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Fronds swaying with wind
    const sway = Math.sin(this.animTick * 2 + x) * 0.08;
    ctx.translate(2, -60);
    ctx.rotate(sway);

    const frondAngles = [0, 0.7, 1.4, 2.2, 3.14, 3.9, 4.6, 5.5];
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 3;

    frondAngles.forEach(a => {
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(20, -10, 42, 10);
      ctx.stroke();
      // Little leaves
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.2;
      for (let l = 10; l <= 38; l += 5) {
        ctx.beginPath();
        ctx.moveTo(l, -2);
        ctx.lineTo(l + 3, 6);
        ctx.stroke();
      }
      ctx.restore();
    });

    ctx.restore();
  }

  // Authentic Chayakada (Kerala Tea Stall)
  drawChayakada(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(-45, -35, 90, 70);

    // Wooden shack stall
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-40, -30, 80, 60);

    // Red Mangalore tiled roof eaves
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(-44, -36, 88, 14);

    // Signboard: "NATIONAL CHAYAKADA" in Malayalam / English
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-35, -28, 70, 14);
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('നാഷണൽ ചായക്കട', 0, -18);

    // Counter & Glass snack showcase (Pazhampori / Banana Fritters!)
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-28, -8, 24, 16);
    ctx.fillStyle = '#eab308'; // Golden Pazhampori
    ctx.fillRect(-25, -5, 6, 10);
    ctx.fillRect(-17, -5, 6, 10);

    // Brass Tea Samovar with steaming kettle
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(14, -2, 7, 0, Math.PI * 2);
    ctx.fill();

    // Steam particles
    const steamY = Math.sin(this.animTick * 6) * 4;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(14, -14 + steamY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Long wooden benches outside
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-35, 22, 70, 6);

    ctx.restore();
  }

  // Toddy Shop (കള്ളു ഷാപ്പ്)
  drawToddyShop(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Palm thatch hut
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-45, -35, 90, 70);

    // Thatch roof
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-48, -40, 96, 16);

    // Toddy Shop Signboard
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-38, -32, 76, 14);
    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('കള്ളു ഷാപ്പ് (SHAP)', 0, -22);

    // Earthen toddy pots (കലങ്ങൾ)
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(-20, 20, 7, 0, Math.PI * 2);
    ctx.arc(0, 20, 7, 0, Math.PI * 2);
    ctx.arc(20, 20, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Burning Ambassador Crime Scene (Mavelikkara 1984)
  drawCrimeScene(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Police caution tape cordon
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(-50, -35, 100, 70);

    // Charred car frame
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(-25, -12, 50, 24);

    // Fire & Smoke particles
    const flicker = Math.sin(this.animTick * 10) * 3;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-8, -4 + flicker, 8, 0, Math.PI * 2);
    ctx.arc(8, -2 - flicker, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(-8, -5 + flicker, 5, 0, Math.PI * 2);
    ctx.arc(8, -3 - flicker, 4, 0, Math.PI * 2);
    ctx.fill();

    // Smoke
    ctx.fillStyle = 'rgba(100, 116, 139, 0.4)';
    const smokeY = (this.animTick * 20) % 40;
    ctx.beginPath();
    ctx.arc(0, -20 - smokeY, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Political Party Office (Red Star / Tricolor)
  drawPartyOffice(ctx, x, y, type = 'red') {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-45, -35, 90, 70);

    if (type === 'red') {
      // Red Office
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-48, -40, 96, 14);
      // Hammer & sickle emblem
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('☭ LDF ഓഫീസ്', 0, -22);

      // Flag pole
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(40, -60, 3, 70);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(43, -60, 18, 12);
    } else {
      // Tricolor Office
      ctx.fillStyle = '#15803d';
      ctx.fillRect(-48, -40, 96, 14);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('UDF മണ്ഡലം', 0, -22);

      // Tricolor Flag
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(40, -60, 3, 70);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(43, -60, 18, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(43, -56, 18, 4);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(43, -52, 18, 4);
    }

    ctx.restore();
  }
}

window.kurupSprites = new KurupSpriteRenderer();
