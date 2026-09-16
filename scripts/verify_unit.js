// In-memory Unit Verification for Operation Kurup Game & Server Mechanics
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🔍 Running Operation Kurup Unit & Component Verification...');

const baseDir = path.join(__dirname, '..');

// 1. Verify all required files exist
const requiredFiles = [
  'public/index.html',
  'public/css/style.css',
  'public/js/audio.js',
  'public/js/sprites.js',
  'public/js/map.js',
  'public/js/game.js',
  'server/server.js',
  'android/settings.gradle',
  'android/build.gradle',
  'android/app/build.gradle',
  'android/app/src/main/AndroidManifest.xml',
  'android/app/src/main/java/com/keralagames/operationkurup/MainActivity.java',
  'android/app/src/main/assets/index.html',
  'android/app/src/main/assets/css/style.css',
  'android/app/src/main/assets/js/game.js',
  'capacitor.config.json',
  'desktop/main.js',
  'package.json',
  'README.md'
];

requiredFiles.forEach(f => {
  const full = path.join(baseDir, f);
  assert(fs.existsSync(full), `Missing file: ${f}`);
  const stats = fs.statSync(full);
  assert(stats.size > 0, `File is empty: ${f}`);
  console.log(`  ✓ Checked ${f} (${stats.size} bytes)`);
});

// 2. Test Vehicle configurations across eras
const serverCode = fs.readFileSync(path.join(baseDir, 'server/server.js'), 'utf8');

assert(serverCode.includes('ambassador_police'), 'Missing 1984 Ambassador Police');
assert(serverCode.includes('bullet350'), 'Missing Bullet 350');
assert(serverCode.includes('ksrtc_bus'), 'Missing KSRTC bus');
assert(serverCode.includes('kettuvallam'), 'Missing Kettuvallam boat');
assert(serverCode.includes('contessa'), 'Missing 1990s Contessa');
assert(serverCode.includes('padmini'), 'Missing 1990s Padmini');
assert(serverCode.includes('yamaha_rx100'), 'Missing Yamaha RX 100');
assert(serverCode.includes('bolero_police'), 'Missing 2000s Bolero Police');
assert(serverCode.includes('auto_rickshaw'), 'Missing Autorickshaw');

// 3. Test Faction & Cultural Dressing
const spritesCode = fs.readFileSync(path.join(baseDir, 'public/js/sprites.js'), 'utf8');
assert(spritesCode.includes('khaki_uniform'), 'Missing khaki uniform styling');
assert(spritesCode.includes('folded_mundu'), 'Missing Kerala folded mundu styling');
assert(spritesCode.includes('bell_bottoms'), 'Missing 80s bell bottoms');
assert(spritesCode.includes('sanyasi'), 'Missing sanyasi disguise');
assert(spritesCode.includes('gulf_tycoon'), 'Missing gulf tycoon styling');
assert(spritesCode.includes('drawPalmTree'), 'Missing coconut tree rendering');
assert(spritesCode.includes('drawChayakada'), 'Missing Chayakada tea stall rendering');
assert(spritesCode.includes('drawToddyShop'), 'Missing Toddy shop rendering');
assert(spritesCode.includes('drawCrimeScene'), 'Missing 1984 Mavelikkara crime scene rendering');

// 4. Test Audio Synthesizer
const audioCode = fs.readFileSync(path.join(baseDir, 'public/js/audio.js'), 'utf8');
assert(audioCode.includes('ksrtc'), 'Missing KSRTC musical horn synth');
assert(audioCode.includes('thump'), 'Missing Bullet 350 engine thump synth');
assert(audioCode.includes('siren'), 'Missing Police siren synth');
assert(audioCode.includes('startBgm'), 'Missing 80s Kerala crime-thriller synthwave BGM');

console.log('✅ ALL 4 VERIFICATION STAGES PASSED SUCCESSFULLY!');
