# TinyTracker - Simple Chip-Tune Tracker

A simplified music tracker inspired by Ultimate Sound Tracker, designed for creating chip-tune music with 4 synthesized channels.

## Pattern Format

Each pattern cell contains 3 parts:

```
NOTE | INST | EFFECT
C-4  | 2    | 047
```

- **NOTE** (3 chars): Musical note (C-0 to B-7) or `---` for empty
- **INST** (1 hex): Instrument number (0-7)
- **EFFECT** (3 hex): Effect type + parameter (e.g., `047` = arpeggio with param 47)

## Channels

- **Channel 0**: Square wave (adjustable pulse width)
- **Channel 1**: Sawtooth wave
- **Channel 2**: Sine wave
- **Channel 3**: Noise generator

## Instruments (8 Total)

Each instrument has ADSR envelope parameters:

- **Attack**: Time to reach peak volume (0.001-1.0 seconds)
- **Decay**: Time to decay to sustain level (0.001-1.0 seconds)
- **Sustain**: Sustained volume level (0.0-1.0)
- **Release**: Time to fade out after note off (0.001-1.0 seconds)
- **Duty Cycle**: Square wave pulse width (0.1-0.9, channel 0 only)

### Editing Instruments

**In code** (tracker/main.js, setupDefaultInstruments function):
```javascript
this.state.song.instruments[0].name = 'Square Lead';
this.state.song.instruments[0].attack = 0.01;
this.state.song.instruments[0].decay = 0.1;
this.state.song.instruments[0].sustain = 0.7;
this.state.song.instruments[0].release = 0.2;
this.state.song.instruments[0].dutyCycle = 0.5;
```

**Live editing** (while tracker is running):
- **Shift + A**: Increase Attack
- **Shift + D**: Increase Decay
- **Shift + S**: Increase Sustain
- **Shift + R**: Increase Release
- **Shift + W**: Increase Duty Cycle (square wave only)
- **Ctrl + Shift + Key**: Fine adjustment (smaller steps)

## Effects

### 0xy - Arpeggio
Rapidly cycles between 3 notes: base note, +x semitones, +y semitones

**Example**: `C-4 0 047` plays C-E-G (major chord)
- 0 = base note (C)
- 4 = +4 semitones (E)
- 7 = +7 semitones (G)

### 1xx - Pitch Slide Up
Slides pitch upward continuously

**Parameter**: xx = slide speed (01-FF)
- Higher values = faster slide
- Example: `C-4 0 110` = slow upward slide

### 2xx - Pitch Slide Down
Slides pitch downward continuously

**Parameter**: xx = slide speed (01-FF)
- Example: `C-4 0 220` = slow downward slide

### 4xy - Vibrato
Adds pitch wobble/vibrato effect

**Parameters**:
- x = vibrato speed (0-F)
- y = vibrato depth (0-F)
- Example: `C-4 0 435` = medium speed, medium depth vibrato

### Axy - Volume Slide
Smoothly changes volume

**Parameters**:
- x = slide up speed (0-F, if y=0)
- y = slide down speed (0-F, if x=0)
- Example: `--- 0 A04` = fade out slowly
- Example: `--- 0 A40` = fade in slowly

### Cxx - Set Volume
Sets note volume immediately

**Parameter**: xx = volume (00-40 in hex = 0-64 in decimal)
- 00 = silent
- 40 = full volume
- Example: `C-4 0 C20` = play at half volume

## Keyboard Controls

### Navigation
- **↑ / ↓**: Move cursor up/down rows
- **← / →**: Move cursor between columns (note/inst/effect)
- **Page Up / Page Down**: Jump 16 rows
- **Home / End**: Jump to first/last row
- **Tab**: Toggle edit mode on/off

### Note Entry (Edit Mode Only)
Piano keyboard layout:
```
High:  I O P ...     (C5-E5)
Mid:   Q W E R T Y U (C4-B4)
Low:   Z X C V B N M (C3-B3)
       S D   G H J    (sharps/flats)
```

### Playback
- **Space**: Play/Stop from current position
- **L**: Toggle pattern loop mode (loop current pattern)
- **F**: Toggle follow playback (auto-scroll during playback)
- **F5-F8**: Mute/unmute channels 1-4

### Editing
- **0-9, A-F**: Enter hex values (instrument/effect)
- **Delete**: Clear current cell
- **Ctrl + 1-8**: Select instrument 1-8

### Instrument Editing (Live)
- **Shift + A/D/S/R**: Adjust ADSR envelope
- **Shift + W**: Adjust duty cycle (square wave)
- **Ctrl + Shift + Key**: Fine adjustment

## Example Patterns

### Major Chord Arpeggio
```
00 C-4 0 047   (C major: C-E-G)
01 --- 0 ...
02 --- 0 ...
03 --- 0 ...
```

### Bass Line with Slides
```
00 C-3 1 ...
04 --- 1 110   (slide up)
08 F-3 1 ...
12 --- 1 220   (slide down)
```

### Melody with Vibrato
```
00 C-4 0 435   (note with vibrato)
04 E-4 0 435
08 G-4 0 435
12 C-5 0 435
```

### Volume Fade
```
00 C-4 2 C40   (full volume)
04 --- 2 A02   (fade out)
08 --- 2 A02
12 --- 2 A02
```

## Tips

1. **Pattern Loop Mode**: Press `L` to enable pattern loop - perfect for working on a single pattern
2. **Follow Playback**: Press `F` to toggle auto-scroll - the view follows the playing position
3. **Start Simple**: Use instrument 0-3 for each channel type (Square/Saw/Sine/Noise)
2. **Test Sounds**: Press notes in edit mode to hear instruments immediately
3. **Arpeggio Chords**:
   - Major: `047` (C-E-G)
   - Minor: `037` (C-Eb-G)
   - Diminished: `036` (C-Eb-Gb)
   - Octave: `0C0` or `007` (C-G-C)
4. **Volume Control**: Use `Cxx` to mix channels at different volumes
5. **Percussion**: Use noise channel (3) with short envelopes for drums
6. **Bass**: Use sine/saw on channel 1-2 with low octaves (C-2, C-3)

## File Structure

```
tinytracker/
├── index.html              Main entry point
├── engine/
│   └── audio-engine.js     Chip-tune synth engine
├── platform/
│   └── audio-web.js        Web Audio API adapter
└── tracker/
    ├── main.js             Application logic
    ├── renderer.js         Pattern/instrument display
    ├── inputhandler.js     Keyboard controls
    └── ui.js               Immediate mode UI system
```

## Customization

Edit `tracker/main.js` → `setupDefaultInstruments()` to create custom instrument presets with different ADSR envelopes and waveform settings.

## License

Same as Paula Tracker - see main repository LICENSE
