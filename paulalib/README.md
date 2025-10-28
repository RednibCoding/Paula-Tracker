# PaulaLib - Platform-Independent ProTracker Library

**Pure JavaScript MOD tracker engine with zero platform dependencies**

## 🎯 What is PaulaLib?

PaulaLib is the core of Paula Tracker extracted into a clean, reusable library. It handles all the complex MOD file parsing, audio mixing, and pattern manipulation - **without touching any browser or Node.js APIs**.

This means you can:
- ✅ Use it in **any** JavaScript environment (browser, Node.js, Deno, Bun, etc.)
- ✅ Build your own UI on top (web, desktop, terminal, hardware)
- ✅ Write **testable** code (no mocking browser APIs!)
- ✅ Keep it **small** (~25KB total)

## 📦 What's Inside

| File | Size | Purpose |
|------|------|---------|
| `data.js` | 5 KB | Core data structures (Note, Pattern, Instrument, Song) |
| `modloader.js` | 8 KB | Load/save ProTracker MOD files |
| `audio-engine.js` | 10 KB | Pure Paula chip emulation & mixing |
| `clipboard.js` | 3 KB | Pattern editing operations (copy/paste/insert/delete) |
| `sampleutils.js` | 5 KB | WAV encode/decode, resampling, audio conversion |

**Total: ~30KB** of pure, platform-independent JavaScript!

## 🚀 Quick Start

### Load and Play a MOD

```javascript
import { loadMOD } from './paulalib/modloader.js';
import { PaulaEngine } from './paulalib/audio-engine.js';

// Load MOD from ArrayBuffer/Uint8Array
const modData = new Uint8Array(await fetch('song.mod').then(r => r.arrayBuffer()));
const song = loadMOD(modData);

// Create audio engine
const engine = new PaulaEngine(44100); // 44.1kHz
engine.setSong(song);
engine.play();

// Mix audio samples (platform does this in a loop)
const samples = engine.mixAudio(512); // Returns Float32Array[1024] (512 stereo frames)
// Now YOU decide how to play these samples (Web Audio, Speaker, SDL, etc.)
```

### Inspect MOD Files

```javascript
import { loadMOD, countInstruments } from './paulalib/modloader.js';

const song = loadMOD(modData);
console.log(`Title: ${song.title}`);
console.log(`Length: ${song.songLength} patterns`);
console.log(`Instruments: ${countInstruments(song)}`);
console.log(`BPM: ${song.bpm}, Tempo: ${song.tempo}`);
```

### Create MOD Files Programmatically

```javascript
import { Song, Pattern } from './paulalib/data.js';
import { saveMOD } from './paulalib/modloader.js';

const song = new Song();
song.title = 'My Song';

// Add notes
const pattern = song.patterns[0];
const note = pattern.getNote(0, 0); // row 0, channel 0
note.period = 428; // C-2
note.instrument = 1;
note.effect = 0xC; // Set volume
note.param = 0x40; // Full volume

// Save
const modData = saveMOD(song);
// Now YOU decide how to save (Blob, fs.writeFile, etc.)
```

### Work with Samples

```javascript
import { decodeWAV, encodeWAV, audioToInstrument } from './paulalib/sampleutils.js';

// Load WAV file
const wavData = new Uint8Array(/* ... */);
const { sampleData, sampleRate, name } = decodeWAV(wavData, 'bassdrum.wav');

// Convert to MOD instrument
const instrument = audioToInstrument(sampleData, sampleRate, name);
song.instruments[1] = instrument;

// Export instrument back to WAV
const wavOut = encodeWAV(instrument.sampleData, instrument.sampleRate);
// YOU decide how to save it
```

### Edit Patterns

```javascript
import { Clipboard } from './paulalib/clipboard.js';

const clipboard = new Clipboard();

// Copy/paste operations
clipboard.copyRow(pattern, 5);
clipboard.paste(pattern, 10);

// Insert/delete rows
clipboard.insertRow(pattern, 8);
clipboard.deleteRow(pattern, 12);

// Clear pattern
clipboard.clearPattern(pattern);
```

## 🏗️ Architecture

PaulaLib is **pure logic** - it never calls:
- ❌ `fetch()` or `XMLHttpRequest`
- ❌ `FileReader`, `Blob`, `URL.createObjectURL()`
- ❌ `AudioContext`, `ScriptProcessor`, `AudioWorklet`
- ❌ `document.createElement()` or DOM APIs
- ❌ `fs.readFile()` or Node.js APIs
- ❌ `console.log()` (except for development debugging)

Instead, it works with:
- ✅ Plain JavaScript objects
- ✅ `Uint8Array` and `Float32Array` buffers
- ✅ Pure functions that transform data

**You provide the platform layer!** See `../src/platform/` for browser adapter examples.

## 📚 API Reference

### Data Structures (`data.js`)

```javascript
// Note - single event in a pattern
const note = new Note();
note.period = 428;        // Amiga period (0 = no note)
note.instrument = 1;      // Instrument number (1-31)
note.effect = 0xC;        // Effect command (0x0-0xF)
note.param = 0x40;        // Effect parameter (0x00-0xFF)
note.clear();             // Clear all fields
note.isEmpty();           // Check if empty
note.clone();             // Deep copy

// Pattern - 64 rows x 4 channels
const pattern = new Pattern();
const note = pattern.getNote(row, channel);
pattern.setNote(row, channel, note);
pattern.clear();
pattern.clone();

// Instrument - sample data
const instrument = new Instrument();
instrument.name = 'Kick';
instrument.length = 8000;
instrument.volume = 64;
instrument.sampleData = new Float32Array(8000);
instrument.repeatStart = 0;
instrument.repeatLength = 2; // 2 = no loop
instrument.hasLoop();
instrument.isEmpty();

// Song - complete MOD
const song = new Song();
song.title = 'My Song';
song.tempo = 6;           // Ticks per row (1-31)
song.bpm = 125;           // Beats per minute (32-255)
song.songLength = 4;      // Number of pattern positions
song.patternOrder = [0, 1, 2, 1]; // Pattern sequence
song.instruments[1-31];   // 31 instruments
song.patterns[0-63];      // 64 patterns
song.getPattern(index);
song.getInstrument(index);
song.getCurrentPattern(position);
```

### MOD Loader (`modloader.js`)

```javascript
// Load MOD from buffer
const song = loadMOD(arrayBuffer); // ArrayBuffer or Uint8Array

// Save MOD to buffer
const data = saveMOD(song); // Returns Uint8Array

// Count instruments
const count = countInstruments(song); // Returns number
```

### Audio Engine (`audio-engine.js`)

```javascript
const engine = new PaulaEngine(sampleRate = 44100);

// Setup
engine.setSong(song);
engine.play(position = 0);
engine.stop();

// Real-time mixing (call this repeatedly)
const samples = engine.mixAudio(numFrames); // Float32Array[numFrames * 2]

// State
const state = engine.getState();
// Returns: {playing, position, row, tempo, bpm, vuLevels, mutedChannels}

// Utilities
engine.periodToNoteName(428); // Returns 'C-2'
engine.toggleMute(channel);   // Mute/unmute channel
```

### Clipboard (`clipboard.js`)

```javascript
const clipboard = new Clipboard();

clipboard.copyRow(pattern, row);
clipboard.copyPattern(pattern);
clipboard.copyChannel(pattern, row, channel);

clipboard.paste(pattern, row, channel);

clipboard.clearPattern(pattern);
clipboard.clearRow(pattern, row);
clipboard.insertRow(pattern, row);
clipboard.deleteRow(pattern, row);

clipboard.hasData();  // Returns boolean
clipboard.getType();  // Returns 'row' | 'pattern' | 'channel'
```

### Sample Utilities (`sampleutils.js`)

```javascript
// Decode WAV file
const {sampleData, sampleRate, name} = decodeWAV(buffer, filename);
// Returns: Float32Array, number, string

// Encode WAV file
const wavData = encodeWAV(sampleData, sampleRate); // Returns Uint8Array

// Resample audio
const resampled = resample(input, inputRate, outputRate); // Returns Float32Array

// Convert to instrument
const instrument = audioToInstrument(sampleData, sampleRate, name);
```

## 🎨 Building Your Own UI

PaulaLib is **just the engine**. You provide:

1. **Platform Layer** - File I/O, audio output, user input
2. **UI Layer** - Rendering, controls, visualization

Example platforms:
- **Web** - Canvas rendering + Web Audio API
- **Node.js** - Terminal UI + Speaker package
- **Electron/Tauri** - Desktop app with native file dialogs
- **Embedded** - Hardware tracker with OLED display + I2S audio

See `../src/platform/` for browser implementation examples.

## 📝 Example: Minimal Player

```javascript
import { loadMOD } from './paulalib/modloader.js';
import { PaulaEngine } from './paulalib/audio-engine.js';

// Your platform layer loads the file
const modData = await yourPlatform.loadFile('song.mod');

// PaulaLib parses it
const song = loadMOD(modData);

// Create engine
const engine = new PaulaEngine(44100);
engine.setSong(song);
engine.play();

// Your platform layer plays audio
while (engine.getState().playing) {
    const samples = engine.mixAudio(512);
    await yourPlatform.playAudio(samples);
    
    const state = engine.getState();
    yourPlatform.displayPosition(state.position, state.row);
}
```

## 🧪 Testing

Because PaulaLib has **zero dependencies**, testing is trivial:

```javascript
import { loadMOD, saveMOD } from './paulalib/modloader.js';

// No mocking needed!
const originalData = new Uint8Array(/* test MOD file */);
const song = loadMOD(originalData);
const savedData = saveMOD(song);

assert(savedData.length === originalData.length);
```

## 📄 License

MIT - Use anywhere, for anything!

## 🙏 Credits

Based on classic Amiga ProTracker format and Paula chip specifications.
