# Paula Tracker

A classic 4-channel sound tracker inspired by the legendary **Ultimate Sound Tracker** from the Amiga era. Built with modern web technologies while maintaining that old-school demoscene aesthetic.

** Features a complete software-based Amiga Paula chip emulator! **

Paula Tracker includes **PaulaLib** - a platform-independent audio engine that accurately emulates the Amiga Paula chip in pure software. All audio mixing, resampling, and effects are calculated in JavaScript - the Web Audio API is only used to send the final mixed samples to your speakers!

![PaulaTracker](/readme/PaulaTracker.png)

### Demo Video

https://youtu.be/FpLkmfKNvbI

*Click to watch the demo on YouTube*

## Features

### Current Implementation (v0.2)

- ✅ **4-Channel Pattern Editor** - Classic tracker interface with 64 rows per pattern
- ✅ **Immediate Mode Canvas UI** - Retro color scheme matching ProTracker
- ✅ **Web Audio Engine** - Sample-based playback using Amiga period tables
- ✅ **Full Keyboard Navigation** - Complete keyboard control for editing and playback
- ✅ **MOD File Support** - Load and save classic Amiga .MOD files (31 instruments)
- ✅ **Sample Loading** - Import audio files (WAV, MP3, OGG, etc.) into instruments
- ✅ **Sample Export** - Save individual instrument samples as WAV files
- ✅ **Song Sequencer** - Pattern order management with visual timeline
- ✅ **Pattern Management** - Copy/paste rows and patterns, duplicate patterns
- ✅ **Clipboard System** - Copy/cut/paste notes, rows, and entire patterns
- ✅ **Channel Muting** - Toggle individual channels (F5-F8)
- ✅ **Pattern Loop Mode** - Loop current pattern for composition (L key)
- ✅ **VU Meters** - Real-time volume visualization for each channel
- ✅ **ProTracker Effects** - Arpeggio, portamento, vibrato, volume slides, and more
- ✅ **Help System** - Built-in F1 help overlay with all keyboard shortcuts
- ✅ **Song Title Editor** - Customize song titles (20 char MOD format limit)

## Usage

### Running Locally

1. Clone or download this repository
2. cd Paula-Tracker
2. Start a local server (required for ES6 modules):
   - **Python 3**: `python -m http.server 8000`
   - **Python 2**: `python -m SimpleHTTPServer 8000`
   - **VS Code**: Use the Live Server extension
   - **Node.js**: `npx http-server`
3. Open `http://localhost:8000` in your browser

### Keyboard Controls

#### Navigation
- **Arrow Keys** - Move cursor (up/down/left/right)
- **Ctrl+Arrows** - Page up/down (16 rows), jump channels left/right
- **Shift+Arrows** - Change current instrument up/down
- **Alt+Arrows** - Navigate song positions in sequencer
- **Page Up/Down** - Jump 16 rows
- **Home/End** - Jump to first/last row
- **Tab** - Next column

#### Playback
- **Space** - Play/Stop from current position
- **L** - Toggle pattern loop mode
- **F5-F8** - Mute/unmute channels 1-4
- **F9** - Preview current instrument

#### Editing
- **Z-M** (lower row) - Enter notes (C-1 octave)
- **Q-P** (upper row) - Enter notes (C-2 octave)  
- **S,D,G,H,J** (black keys) - Sharp notes (#)
- **0-9, A-F** - Enter hex values (instrument, effect, param)
- **Delete** - Clear note at cursor
- **Insert** - Insert blank row
- **Shift+Delete** - Delete row

#### Clipboard
- **Ctrl+C** - Copy current row
- **Ctrl+Shift+C** - Copy entire pattern
- **Ctrl+V** - Paste
- **Ctrl+X** - Cut row
- **Ctrl+Delete** - Clear entire pattern

#### Files & Management
- **Ctrl+L** - Load MOD file
- **Ctrl+S** - Save MOD file (song title updates from filename)
- **Ctrl+D** - Duplicate current pattern to next slot
- **Shift+Insert** - Load WAV/MP3/OGG sample into current instrument
- **Shift+Home** - Save current instrument as WAV file

#### Song Sequencer
- **Alt+Insert** - Insert position in song sequence
- **Alt+Delete** - Delete position from song sequence

#### Help
- **F1** - Show/hide keyboard shortcuts help overlay

#### Pattern Editor Layout
```
ROW | NOTE INS EFF PAR | NOTE INS EFF PAR | NOTE INS EFF PAR | NOTE INS EFF PAR |
----|------------------|------------------|------------------|------------------|
00  | C-2  01  .  ..   | ---  ..  .  ..   | E-2  01  .  ..   | ---  ..  .  ..   |
01  | ---  ..  .  ..   | ---  ..  .  ..   | ---  ..  .  ..   | ---  ..  .  ..   |
```

## Technical Details

### PaulaLib - Software Paula Chip Emulator

**PaulaLib is a complete, platform-independent Amiga Paula chip emulator written in pure JavaScript!**

Unlike typical web audio applications that rely on the Web Audio API for mixing and effects, PaulaLib performs ALL audio processing in software:

#### What PaulaLib Does:
- ✅ **Software mixing** - Mixes 4 audio channels entirely in JavaScript
- ✅ **Period-based synthesis** - Authentic Amiga period-to-frequency conversion (PAULA_FREQUENCY / period)
- ✅ **Linear interpolation** - Smooth resampling for any output sample rate
- ✅ **All ProTracker effects** - Arpeggio, vibrato, slides, tremolo, volume slides, etc.
- ✅ **Finetune support** - 16 finetune values per note (ProTracker standard)
- ✅ **Pattern sequencing** - Complete MOD playback with pattern order
- ✅ **VU meters** - Peak detection with smooth decay
- ✅ **ProTracker-accurate timing** - Tick/tempo system matching original hardware

#### What Web Audio API Does:
- ❌ **NOT mixing** - PaulaLib mixes in software
- ❌ **NOT effects** - PaulaLib calculates all effects
- ❌ **NOT resampling** - PaulaLib does linear interpolation
- ✅ **ONLY output** - Just plays the final mixed stereo buffer

**This means PaulaLib can run on ANY platform that can play PCM audio:**
- Web browsers (current implementation)
- Desktop apps (SDL, PortAudio, ALSA)
- Embedded devices
- Game consoles
- Mobile devices (iOS/Android native audio)
- Raspberry Pi
- Arduino with audio output
- Literally anywhere!

The platform-specific code is minimal - just a thin adapter that requests audio buffers and sends them to the speakers. Everything else is pure, portable JavaScript.

### Architecture

The tracker is built with clean, modular ES6 code:

```
PaulaTracker/
├── index.html          # Main HTML page
├── paulalib/           # 🎵 PLATFORM-INDEPENDENT PAULA EMULATOR
│   ├── audio-engine.js # Complete Paula chip emulation (mixing, effects, timing)
│   ├── data.js         # Data structures (Note, Pattern, Song, Instrument)
│   ├── modloader.js    # MOD file format parsing and writing
│   ├── sampleutils.js  # Sample loading utilities (WAV decoding, etc.)
│   └── clipboard.js    # Copy/paste functionality
├── src/                # 🌐 WEB PLATFORM SPECIFIC
│   ├── main.js         # Main tracker application and state management
│   ├── ui.js           # Immediate mode UI framework with canvas rendering
│   ├── renderer.js     # All UI rendering (pattern editor, sequencer, VU meters)
│   ├── inputhandler.js # Keyboard input handling and shortcuts
│   ├── noteentry.js    # Note entry and instrument selection
│   ├── keyboard.js     # Piano keyboard mapping
│   ├── instrumentmanager.js # Instrument preview and management
│   └── platform/       # Platform adapters (web-specific)
│       ├── audio-web.js        # Web Audio API adapter (just output!)
│       ├── file-browser.js     # Browser file I/O
│       └── sample-loader-browser.js # Browser audio decoding
```

**The key innovation:** The `paulalib/` directory contains zero platform-specific code! It's pure JavaScript that could run in Node.js, Deno, Bun, or be compiled to C/Rust/anything else. The `src/platform/` adapters are the only web-specific parts.

### Paula Chip Emulation Details

PaulaLib accurately emulates the Amiga Paula audio chip:

- **4-channel sample playback** - Each channel independently plays 8-bit samples
- **Period-based pitch control** - Uses Amiga period tables (not Hz frequencies!)
- **Sample rate conversion** - Linear interpolation for smooth playback at any rate
- **Hardware-accurate timing** - Tick/tempo system matching ProTracker
- **Authentic vibrato** - Uses ProTracker's 32-value sine lookup table
- **Finetune support** - 16 period variations per note (-8 to +7)
- **Channel mixing** - Software stereo mixing (L/R/L/R panning)
- **Loop support** - Sample loops with configurable start/length
- **Volume control** - Per-channel 0-64 volume range
- **VU metering** - Peak tracking with smooth decay

**Paula Constants:**
```javascript
PAULA_FREQUENCY = 7093789.2 / 2 = 3546894.6 Hz (PAL)
Sample Rate = PAULA_FREQUENCY / (period * outputSampleRate)
```

The period-to-rate conversion is authentic to the original hardware!

### Period Table (Amiga Standard)

Notes are represented by Amiga periods:
- C-1 = 856
- C-2 = 428
- C-3 = 214

This matches the original hardware's Paula chip frequency calculation.

### Effects Reference

All effects are entered in the pattern as `Exx` or `Exy` where E is the effect number (0-F) and xx/xy are hex parameters.

**Important:** Tempo and BPM are controlled via the `Fxx` effect, not global settings. This is authentic ProTracker behavior.

| Effect | Name            | Description |
|--------|-----------------|-------------|
| 0xy    | Arpeggio        | Rapid cycle through note + x semitones + y semitones |
| 1xx    | Slide Up        | Slide pitch up by xx units per tick |
| 2xx    | Slide Down      | Slide pitch down by xx units per tick |
| 3xx    | Tone Portamento | Slide to target note at speed xx |
| 4xy    | Vibrato         | Vibrato with speed x and depth y |
| 5xy    | Tone Porta + Vol Slide | Continue portamento + volume slide |
| 6xy    | Vibrato + Vol Slide | Continue vibrato + volume slide |
| 7xy    | Tremolo | Volume vibrato with speed x and depth y |
| 8xx    | Set Panning | Set stereo position (00=left, 80=center, FF=right) |
| 9xx    | Sample Offset | Start sample at offset xx*256 bytes |
| Axy    | Volume Slide | Slide volume (x=up by x, y=down by y per tick) |
| Bxx    | Position Jump | Jump to pattern position xx in song |
| Cxx    | Set Volume | Set volume to xx (00-40 hex, 0-64 decimal) |
| Dxx    | Pattern Break | Break pattern, next pattern starts at row xx |
| Fxx    | Set Speed/BPM | If xx < 20: set speed (ticks/row), if xx >= 20: set BPM |

**Effect Usage Examples:**
- `F06` - Set speed to 6 (default ProTracker speed)
- `F7D` - Set BPM to 125 (hex 7D = 125 decimal)
- `C40` - Set volume to 64 (full volume)
- `037` - Arpeggio major chord (root + 3 + 7 semitones)
- `310` - Portamento to note at speed 16

## Development

### Module Structure

Paula Tracker follows a clean modular architecture:

- **main.js** - Core tracker state and coordination
- **renderer.js** - All visual rendering (pattern editor, sequencer, instruments, VU meters)
- **inputhandler.js** - Centralized keyboard input handling
- **audio.js** - Web Audio engine with ProTracker effect processing
- **data.js** - Immutable data structures (Note, Pattern, Instrument, Song)

### Adding New Effects

Effects are processed in `audio.js`:

```javascript
processEffect(channel, note, firstTick) {
    const param = note.param;
    const x = (param >> 4) & 0xF;  // High nibble
    const y = param & 0xF;          // Low nibble
    
    switch (note.effect) {
        case 0x1: // Slide up
            if (!firstTick && this.channelStates[channel].source) {
                // Implementation here
            }
            break;
    }
}
```

### Working with Samples

Load samples into instruments:

```javascript
// Via file input (automatic)
tracker.instrumentManager.loadSample(instrumentNumber);

// Programmatically
const instr = song.instruments[1];
instr.name = 'My Sample';
instr.volume = 64;
instr.length = audioBuffer.length;
instr.sampleData = audioBuffer.getChannelData(0);
instr.repeatStart = 0;
instr.repeatLength = 0; // 0 = no loop
```

### Creating Procedural Instruments

Generate waveforms procedurally:

```javascript
const instr = song.instruments[1];
instr.name = 'Saw Wave';
instr.volume = 64;
instr.finetune = 0;

const length = 8000;
instr.length = length;
instr.sampleData = new Float32Array(length);

for (let i = 0; i < length; i++) {
    instr.sampleData[i] = ((i % 100) / 50 - 1) * 0.3;
}

// Set loop
instr.repeatStart = 0;
instr.repeatLength = 100;
```

## Credits

- **Inspiration**: Ultimate Sound Tracker, SoundTracker, NoiseTracker, ProTracker
- **Audio**: Web Audio API
- **UI**: Custom immediate mode canvas rendering

## License

MIT License - Feel free to use, modify, and learn from this code!

## Links

- [ProTracker](https://en.wikipedia.org/wiki/ProTracker) - Classic Amiga tracker
- [MOD Format Specification](http://www.eblong.com/zarf/blorb/mod-spec.txt)

---

**Made with ❤️ for the demoscene**

Press SPACE to start tracking!
