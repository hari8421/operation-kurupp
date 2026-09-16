# Operation Kurup: The Great Kerala Manhunt (ഓപ്പറേഷൻ കുറുപ്പ്)

A retro-styled, atmospheric cross-platform multiplayer game set in the scenic landscapes of Kerala during the 1980s–2000s. Players compete in asymmetric factions to track down or play as the infamous fugitive **Sukumara Kurup** following the sensational 1984 Chacko murder and burning Ambassador car case in Mavelikkara.

---

## 🌴 Key Features

### 1. Authentic Kerala World & Landscapes
- **Alappuzha & Mavelikkara Sector**:
  - The infamous charred Ambassador car crime scene in the lush paddy fields.
  - Backwater canals with shimmering water ripples, wooden bridges, and steerable **Kettuvallam** (country boats).
  - Authentic **Karimpinkala Toddy Shop (കള്ളു ഷാപ്പ്)** with thatched eaves and clay pots.
- **Central Town & Chayakada Junction**:
  - Iconic **National Chayakada** with steam rising from brass tea samovars, wooden benches, and banana fritters (*pazhampori*).
  - Political Party Offices: **LDF Red Star Office** (with red flags & hammer-and-sickle) and **UDF Tricolor Front Office** (with khadi stoles & banners).
  - **Apsara Retro Talkies Cinema** featuring 1980s Malayalam classic film posters (e.g. *Angadi*).
- **Munnar High-Range Tea Estates**:
  - Winding hairpin mountain roads, contour-carved tea hills, and the colonial Planters Club bungalow where Kurup hides under an alias.
- **Aryankavu / Walayar Border Checkpost**:
  - Police nakabandi barricades and excise gates where Kurup attempts his daring state escape.

---

### 2. Multi-Era Vehicles & Iconic Audio
Switch between eras on the fly (`1984 Retro`, `1990s Vintage`, `2000s Modern`):

| Era | Vehicles Included | Sound Signature (Web Audio Synthesizer) |
|---|---|---|
| **1984 Retro** | HM Ambassador Mark 3 (Police & Taxi), Royal Enfield Bullet 350, Bajaj Chetak 150 Scooter, KSRTC "Aana Vandi" Bus, Kettuvallam Boat | Bullet heavy cast-iron thump, KSRTC musical air horn, Ambassador dual horn |
| **1990s Vintage** | HM Contessa Classic, Premier Padmini 118NE, Yamaha RX 100, Tata Sumo 4x4, KSRTC Super Express | High-rev 2-stroke scream, muscle car rumble |
| **2000s Modern** | Mahindra Bolero Police Interceptor, Kerala 3-Wheeler Auto-rickshaw, Royal Enfield Classic 350 | Police wail sirens, 3-wheeler horn |

---

### 3. Factions, Cultural Dress Styles & Abilities
- 👮 **Kerala Police (DYSP Haridas & Crime Branch Squad)**:
  - *Dress*: Khaki uniform, Sam Browne leather belt, red lanyard, retro side cap, lathi.
  - *Special Power*: **Nakabandi Roadblock** — erects highway checkpoints and uncovers forensic evidence.
- 🚩 **Red Star Cadres (Comrade Vijayan & Youth Cadres)**:
  - *Dress*: Crisp white double-mundu (folded up), red shoulder towel (*thorthu*), red star badge, megaphone.
  - *Special Power*: **Kerala-wide Harthal** — freezes vehicle traffic across the state for 15 seconds.
- 🇮🇳 **Tricolor Front (Democratic Youth Movement)**:
  - *Dress*: Khadi kurta, white mundu, tricolor stole.
  - *Special Power*: **Press Expose & Dharna** — mobilizes citizen convoys and broadcasts suspect coordinates.
- 🌴 **Gulf Hawala Syndicate (Bavu Haji & Smugglers)**:
  - *Dress*: 1980s Safari suit, Ray-Ban aviator sunglasses, gold watch, bell-bottom trousers, VIP suitcase.
  - *Special Power*: **Contessa Speed Boost & Hawala Informant Network**.
- 🕵️ **Sukumara Kurup (The Fugitive)**:
  - *Playable Faction*: Evade capture, change disguises on the move (Gulf Tycoon, Sanyasi with saffron robe & sacred ash, Toddy Tapper with bare chest & kothu mundu, or Police Sub-Inspector), plant decoy clues, and escape across the border.

---

### 4. Cross-Platform Playability & Standalone Native Mobile App
- **Web & Browser**: Plays instantly on any desktop, tablet, or phone.
- **Mobile Touch Controls**: Integrated on-screen responsive analog thumbstick, sprint button, vehicle horn/siren, drive/enter button, and ability trigger.
- **Standalone Android App (Not a PWA)**:
  - Contains complete native Android Studio project files in `android/`.
  - Native `MainActivity.java` with hardware-accelerated WebGL `WebView` in full-screen immersive landscape mode.
  - Pre-bundled offline assets inside `android/app/src/main/assets/` — no internet or server required for single-player / bot mode!
  - Compile directly to standalone `.apk` using standard Android Studio or `npm run build:android`.
- **Standalone Desktop App (Mac & Windows)**:
  - Electron runner `desktop/main.js` packaged for macOS (`.app`/`.dmg`) and Windows (`.exe`) via `npm run build:desktop`.

---

## 🚀 How to Run

### Quick Start (Web & Multiplayer Server)
```bash
# Inside project directory:
cd /Users/hari/.gemini/antigravity/scratch/operation-kurupp

# Start the game server (Zero external npm dependencies needed!)
npm start
```
Open your browser at **`http://localhost:3000`** (or access via your phone on the same Wi-Fi using `http://<your-local-ip>:3000`).

### Controls
- **Movement**: `W, A, S, D` or Arrow Keys (or on-screen virtual joystick on mobile)
- **Sprint**: `Left Shift` (or `SPRINT` button on mobile)
- **Enter / Exit Vehicle**: `E` (or `ENTER` button on mobile)
- **Inspect Clue**: `E` when near a clue marker
- **Vehicle Horn / Police Siren**: `Space` (or `HORN` button on mobile)
- **Faction Ability (Harthal / Roadblock / Disguise)**: `Q` or `F` (or `ABILITY` button on mobile)
- **Cycle Eras (1984 -> 1990s -> 2000s)**: Click the **ERA** badge on the top HUD
- **Crime Dossier / Case File**: `C` (or click `CASE FILE` on top HUD)
- **Audio Toggle**: `M` (or click `AUDIO` on top HUD)

---

## 📱 Compiling the Standalone Mobile App (Android APK)
To build the real, standalone native Android `.apk` (not a PWA):

```bash
# Run the automated build script
npm run build:android
```
Or open the `android/` directory in **Android Studio** and select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
The APK will be generated at `android/app/build/outputs/apk/debug/app-debug.apk`.
