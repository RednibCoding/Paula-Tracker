# Project Structure

Paula Tracker is now organized as a **modular library** with clean separation between platform-independent code and platform-specific adapters.

## Directory Layout

```
Paula-Tracker/
├── paulalib/              ← Core library (platform-independent)
│   ├── data.js            ← Data structures (Note, Pattern, Song, Instrument)
│   ├── modloader.js       ← MOD file loading/saving (ArrayBuffer only)
│   ├── audio-engine.js    ← Paula chip emulation (Float32Array only)
│   ├── clipboard.js       ← Pattern editing operations
│   ├── sampleutils.js     ← WAV encode/decode, resampling
│   └── README.md          ← Library API documentation
│
├── src/                   ← Web-based tracker (root level for GitHub Pages)
│   ├── platform/          ← Browser-specific adapters
│   │   ├── audio-web.js           ← Web Audio API wrapper
│   │   ├── file-browser.js        ← File loading/saving
│   │   └── sample-loader-browser.js ← Sample import
│   │
│   ├── main.js            ← Main application entry
│   ├── ui.js              ← UI layout and components
│   ├── renderer.js        ← Canvas rendering
│   ├── inputhandler.js    ← Keyboard/mouse handling
│   ├── noteentry.js       ← Note input logic
│   ├── keyboard.js        ← Keyboard mapping
│   └── instrumentmanager.js ← Instrument UI
│
├── public/                ← Web assets
│   └── icon.png
│
├── index.html             ← Entry point for web tracker (root level for GitHub Pages)
│
├── demomods/              ← Example MOD files
├── demosamples/           ← Example audio samples
└── readme/                ← Documentation assets
```

## Module Responsibilities

### PaulaLib Core (paulalib/)

**Zero platform dependencies** - works anywhere JavaScript runs.

| File | Purpose | Exports |
|------|---------|---------|
| `data.js` | Data structures | `Note`, `Pattern`, `Instrument`, `Song` |
| `modloader.js` | MOD I/O | `loadMOD(buffer)`, `saveMOD(song)` |
| `audio-engine.js` | Audio mixing | `PaulaEngine`, `PERIOD_TABLE`, `NOTE_NAMES` |
| `clipboard.js` | Pattern editing | `Clipboard` |
| `sampleutils.js` | Audio conversion | `decodeWAV()`, `encodeWAV()`, `resample()` |

**Key Principle:** These modules ONLY work with:
- Plain JavaScript objects
- `Uint8Array` / `Float32Array` buffers
- Pure functions with no side effects

They NEVER call:
- Browser APIs (fetch, FileReader, AudioContext, etc.)
- Node.js APIs (fs, path, etc.)
- DOM APIs (document, window, etc.)

### Platform Adapters (src/platform/)

**Browser-specific** - wraps PaulaLib with Web APIs.

| File | Purpose | Wraps |
|------|---------|-------|
| `audio-web.js` | Web Audio output | `audio-engine.js` + Web Audio API |
| `file-browser.js` | File I/O | `modloader.js` + fetch/FileReader/Blob |
| `sample-loader-browser.js` | Sample import | `sampleutils.js` + AudioContext |

### UI Layer (src/)

**Application-specific** - tracker interface built on top of platform layer.

- `main.js` - Application entry point
- `ui.js` - UI layout and state
- `renderer.js` - Canvas rendering
- `inputhandler.js` - Keyboard/mouse input
- `noteentry.js` - Note input logic
- `instrumentmanager.js` - Instrument panel

## Data Flow

```
┌─────────────────────────────────────────┐
│           User Interface                │
│  (Canvas, Keyboard, Mouse)              │
│            src/*.js                     │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│      Platform Adapters Layer            │
│          src/platform/                  │
│  • audio-web.js (Web Audio)             │
│  • file-browser.js (Fetch/Blob)         │
│  • sample-loader-browser.js             │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│          PaulaLib Core                  │
│           paulalib/                     │
│  • data.js                              │
│  • modloader.js                         │
│  • audio-engine.js                      │
│  • clipboard.js                         │
│  • sampleutils.js                       │
└─────────────────────────────────────────┘
     Platform-Independent (~30KB)
```

## Migration Status

### ✅ Project Restructuring Complete!

The project has been reorganized with a clean, modular architecture:

- ✅ PaulaLib core library (`paulalib/`) - Platform-independent (~30KB)
- ✅ Web tracker at root level (`src/`, `index.html`) - For GitHub Pages compatibility
- ✅ Platform adapters in `src/platform/` - Web API wrappers
- ✅ All documentation updated to reflect new structure

**Current Structure:**
- **Core library:** `paulalib/` (platform-independent, reusable)
- **Web tracker:** Root level (browser-based implementation)
  - **Platform layer:** `src/platform/` (Web API adapters)
  - **UI layer:** `src/` (tracker application)
  - **Entry point:** `index.html` (GitHub Pages compatible)

This structure allows:
- 🎯 **Clean separation** - Core logic separate from platform code
- 🔄 **Reusability** - PaulaLib can be used in any JavaScript environment
- 📦 **Modularity** - Future tracker implementations (CLI, desktop, mobile) can share the same core
- 🧪 **Testability** - Pure functions in paulalib are easy to test

## Usage Examples

### Load MOD file

```javascript
// Browser
import { loadFromURL } from './src/platform/file-browser.js';
const song = await loadFromURL('song.mod');

// Or use paulalib directly
import { loadMOD } from './paulalib/modloader.js';
const response = await fetch('song.mod');
const data = new Uint8Array(await response.arrayBuffer());
const song = loadMOD(data);
```

### Play audio

```javascript
// Browser
import { WebAudioAdapter } from './src/platform/audio-web.js';
const audio = new WebAudioAdapter();
audio.init();
audio.setSong(song);
audio.play();

// Or use paulalib engine directly (for custom implementations)
import { PaulaEngine } from './paulalib/audio-engine.js';

const engine = new PaulaEngine(44100);
engine.setSong(song);
engine.play();

// Mix audio manually (512 frames = 1024 samples for stereo)
const audioBuffer = engine.mixAudio(512);
// audioBuffer is Float32Array[1024] - feed to Web Audio API or other output
```

### Edit patterns

```javascript
// Works everywhere (pure JavaScript)
import { Clipboard } from './paulalib/clipboard.js';

const clipboard = new Clipboard();
clipboard.copyRow(pattern, 5);
clipboard.paste(pattern, 10);
```

## See Also

- `paulalib/README.md` - Complete library API reference
- `EFFECTS_REFERENCE.md` - ProTracker effects documentation
- `QUICKSTART.md` - Getting started guide
